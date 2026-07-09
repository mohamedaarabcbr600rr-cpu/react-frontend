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
            <div className="ai-avatar-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8V4H8"/>
                <rect width="16" height="12" x="4" y="8" rx="2"/>
                <path d="M2 14h2"/>
                <path d="M20 14h2"/>
                <path d="M15 13v2"/>
                <path d="M9 13v2"/>
              </svg>
            </div>
            <span className="online-indicator"></span>
          </div>
          <div className="header-info">
            <h2>{t('aiChat.title')}</h2>
            <p className="status-text">
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--success)" }}></span>
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14"/>
              <path d="M5 12h14"/>
            </svg>
            {t('aiChat.newChatButton')}
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && showSuggestions && (
          <div className="welcome-section">
            <div className="welcome-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8V4H8"/>
                <rect width="16" height="12" x="4" y="8" rx="2"/>
                <path d="M2 14h2"/>
                <path d="M20 14h2"/>
                <path d="M15 13v2"/>
                <path d="M9 13v2"/>
              </svg>
            </div>
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
                  <span className="suggestion-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18h6"/>
                      <path d="M10 22h4"/>
                      <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1.2 1.9l.3 1.4h5l.3-1.4c.2-.7.6-1.4 1.2-1.9A7 7 0 0 0 12 2Z"/>
                    </svg>
                  </span>
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
                <div className="ai-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 8V4H8"/>
                    <rect width="16" height="12" x="4" y="8" rx="2"/>
                  </svg>
                </div>
              )}
              <div className="message-content">
                <div className="message-text">{msg.text}</div>
                {msg.timestamp && (
                  <div className="message-time">{formatTime(msg.timestamp)}</div>
                )}
              </div>
              {msg.sender === "user" && (
                <div className="user-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="typing-indicator">
            <div className="typing-bubble">
              <div className="ai-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 8V4H8"/>
                  <rect width="16" height="12" x="4" y="8" rx="2"/>
                </svg>
              </div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <span className="typing-text">{t('aiChat.typing')}</span>
            </div>
          </div>
        )}

        {error && !isTyping && (
          <div className="error-banner">
            <span className="error-banner-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <path d="M12 9v4"/>
                <path d="M12 17h.01"/>
              </svg>
            </span>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4Z"/>
                <path d="M22 2 11 13"/>
              </svg>
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