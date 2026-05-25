import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";

const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [userName, setUserName] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { t } = useTranslation();

  // 🔐 Récupérer le token et les infos user
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // 📡 Configuration axios avec token
  const axiosInstance = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api`,
  });

  // Interceptor pour ajouter le token
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Load chat history and user info
  useEffect(() => {
    loadChatHistory();
    fetchUserInfo();
    inputRef.current?.focus();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchUserInfo = async () => {
    try {
      const token = getAuthToken();
      if (token) {
        setIsAuthenticated(true);
        const response = await axiosInstance.get("/user");
        if (response.data && response.data.name) {
          setUserName(response.data.name);
        }
      }
    } catch (err) {
      console.error(t('aiChat.errors.fetchUserInfo'), err);
      setIsAuthenticated(false);
    }
  };

  const loadChatHistory = () => {
    const token = getAuthToken();
    // Utiliser un storage différent pour chaque utilisateur
    const storageKey = token ? `aiChatHistory_${token.substring(0, 20)}` : "aiChatHistory_guest";
    const savedChats = localStorage.getItem(storageKey);
    if (savedChats) {
      try {
        const parsed = JSON.parse(savedChats);
        setMessages(parsed);
        setChatId(Date.now().toString());
      } catch (e) {
        console.error(t('aiChat.errors.loadHistory'), e);
      }
    }
  };

  const saveChatHistory = (newMessages) => {
    const token = getAuthToken();
    // Sauvegarder dans un storage spécifique à l'utilisateur
    const storageKey = token ? `aiChatHistory_${token.substring(0, 20)}` : "aiChatHistory_guest";
    localStorage.setItem(storageKey, JSON.stringify(newMessages));
  };

  const clearChatHistory = () => {
    if (window.confirm(t('aiChat.confirmClear'))) {
      setMessages([]);
      const token = getAuthToken();
      const storageKey = token ? `aiChatHistory_${token.substring(0, 20)}` : "aiChatHistory_guest";
      localStorage.removeItem(storageKey);
      setChatId(null);
      setShowSuggestions(true);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { 
      sender: "user", 
      text: input,
      timestamp: new Date().toISOString(),
      id: Date.now()
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveChatHistory(updatedMessages);
    
    setInput("");
    setLoading(true);
    setIsTyping(true);
    setError("");
    setShowSuggestions(false);

    try {
      const token = getAuthToken();
      
      // ✅ Utiliser axiosInstance au lieu de axios direct
      const res = await axiosInstance.post(
        "/ask-ai",
        {
          message: input,
          chat_id: chatId,
          context: messages.slice(-5) // Send last 5 messages for context
        },
        {
          timeout: 120000
        }
      );

      const aiMsgId = Date.now() + 1;

      const aiMessage = {
        sender: "ai",
        text: "",
        timestamp: new Date().toISOString(),
        id: aiMsgId
      };

      // نضيف message فارغة
      const tempMessages = [...updatedMessages, aiMessage];
      setMessages(tempMessages);

      let currentText = "";
      const fullText = res.data.reply;

      setIsTyping(false);

      // typing effect
      for (let i = 0; i < fullText.length; i++) {
        currentText += fullText[i];

        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiMsgId
              ? { ...msg, text: currentText }
              : msg
          )
        );

        await new Promise(r => setTimeout(r, 15));
      }

      // نحفظ النهائي
      const finalMessages = tempMessages.map(msg =>
        msg.id === aiMsgId
          ? { ...msg, text: fullText }
          : msg
      );

      setMessages(finalMessages);
      saveChatHistory(finalMessages);
      
      if (!chatId && res.data.chat_id) {
        setChatId(res.data.chat_id);
      }
      
    } catch (err) {
      console.error(t('aiChat.errors.sendMessage'), err);
      
      let errorMessage = t('aiChat.errors.generic');
      
      if (err.code === "ECONNABORTED") {
        errorMessage = t('aiChat.errors.timeout');
      } else if (err.response) {
        if (err.response.status === 401) {
          errorMessage = t('aiChat.errors.sessionExpired');
          setIsAuthenticated(false);
        } else if (err.response.status === 429) {
          errorMessage = t('aiChat.errors.tooManyRequests');
        } else if (err.response.status === 500) {
          errorMessage = t('aiChat.errors.serverError');
        } else {
          errorMessage = err.response.data?.error || err.response.data?.message || errorMessage;
        }
      }
      
      setError(errorMessage);
      
      // Add error message to chat
      const errorAiMessage = {
        sender: "ai",
        text: errorMessage,
        timestamp: new Date().toISOString(),
        id: Date.now() + 1,
        isError: true
      };
      
      const finalMessages = [...updatedMessages, errorAiMessage];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);
      
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const suggestedQuestions = [
    t('aiChat.suggestions.improveGrades'),
    t('aiChat.suggestions.weaknesses'),
    t('aiChat.suggestions.studyTips'),
    t('aiChat.suggestions.motivation'),
    t('aiChat.suggestions.conjugation'),
    t('aiChat.suggestions.timeManagement')
  ];

  return (
    <div className="ai-chat-container">
      <div className="chat-header">
        <div className="header-left">
          <div className="ai-avatar">
            <span className="ai-avatar-icon">🤖</span>
            <span className="online-indicator"></span>
          </div>
          <div className="header-info">
            <h2>{t('aiChat.title')}</h2>
            <p className="status-text">
              {isAuthenticated && userName ? t('aiChat.greeting', { name: userName }) + ' • ' : ""}
              {t('aiChat.status')}
            </p>
          </div>
        </div>
        <div className="header-actions">
          <button 
            onClick={clearChatHistory} 
            className="clear-btn"
            title={t('aiChat.clearHistory')}
          >
            🗑️
          </button>
          <button 
            onClick={() => {
              setMessages([]);
              setShowSuggestions(true);
              const token = getAuthToken();
              const storageKey = token ? `aiChatHistory_${token.substring(0, 20)}` : "aiChatHistory_guest";
              localStorage.removeItem(storageKey);
            }} 
            className="new-chat-btn"
            title={t('aiChat.newChat')}
          >
            {t('aiChat.newChatButton')}
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && showSuggestions && (
          <div className="welcome-section">
            <div className="welcome-icon">👋</div>
            <h3>
              {isAuthenticated && userName 
                ? t('aiChat.welcome.authenticated', { name: userName })
                : t('aiChat.welcome.guest')}
            </h3>
            <p>{t('aiChat.welcome.description')}</p>
            
            <div className="suggestions-grid">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  className="suggestion-btn"
                  onClick={() => {
                    setInput(question);
                    inputRef.current?.focus();
                  }}
                >
                  <span className="suggestion-icon">💡</span>
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={msg.id || index}
            className={`message-wrapper ${msg.sender === "user" ? "user-wrapper" : "ai-wrapper"}`}
          >
            <div className={`message-bubble ${msg.sender === "user" ? "user-bubble" : "ai-bubble"} ${msg.isError ? "error-bubble" : ""}`}>
              {msg.sender === "ai" && !msg.isError && (
                <div className="ai-icon">🤖</div>
              )}
              <div className="message-content">
                <div className="message-text">{msg.text}</div>
                {msg.timestamp && (
                  <div className="message-time">{formatTime(msg.timestamp)}</div>
                )}
              </div>
              {msg.sender === "user" && (
                <div className="user-icon">👤</div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="typing-indicator">
            <div className="typing-bubble">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <span className="typing-text">{t('aiChat.typing')}</span>
            </div>
          </div>
        )}

        {error && !isTyping && (
          <div className="error-banner">
            <span className="error-banner-icon">⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError("")} className="error-close" aria-label={t('aiChat.closeError')}>✕</button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder={t('aiChat.inputPlaceholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            rows={1}
            disabled={loading}
          />
          <button 
            onClick={sendMessage} 
            className={`send-btn ${!input.trim() || loading ? "disabled" : ""}`}
            disabled={!input.trim() || loading}
            aria-label={t('aiChat.send')}
          >
            {loading ? (
              <div className="send-spinner"></div>
            ) : (
              <span>📤</span>
            )}
          </button>
        </div>
        <div className="input-hint">
          <span className="hint-icon">⏎</span>
          <span>{t('aiChat.inputHint')}</span>
        </div>
      </div>
    </div>
  );
};

export default AIChat;




