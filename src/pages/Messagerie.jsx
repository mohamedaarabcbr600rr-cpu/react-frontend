import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "./Messagerie.css";

const api = axios.create({
  baseURL: "import.meta.env.VITE_API_URL/api",
  headers: { "Accept": "application/json" }
});

// ✅ AJOUTE CET INTERCEPTEUR ICI (juste après api.create)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// ─── Helpers ────────────────────────────────────────────────────────────────
const getInitials = (name = "") =>
  name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

const formatTime = (dateStr) =>
  new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
};

const isOnline = (lastSeen) => {
  if (!lastSeen) return false;
  return (new Date() - new Date(lastSeen)) / 1000 < 120;
};

// ─── Avatar ──────────────────────────────────────────────────────────────────
const Avatar = ({ name, size = 48, online = false }) => {
  const colors = [
    ["#128C7E", "#075E54"],
    ["#25D366", "#128C7E"],
    ["#34B7F1", "#0095A0"],
    ["#FF6B6B", "#EE5A24"],
    ["#A29BFE", "#6C5CE7"],
    ["#FFB74D", "#FF9800"],
  ];
  const idx = name ? name.charCodeAt(0) % colors.length : 0;
  const [bg1, bg2] = colors[idx];

  return (
    <div className="wa-avatar-wrap">
      <div
        className="wa-avatar"
        style={{
          width: size,
          height: size,
          background: `linear-gradient(135deg, ${bg1}, ${bg2})`,
          fontSize: size * 0.35,
        }}
      >
        {getInitials(name)}
      </div>
      {online && <span className="wa-online-dot" />}
    </div>
  );
};

// ─── MessageBubble ────────────────────────────────────────────────────────────
const MessageBubble = ({ msg, authUserId, baseUrl }) => {
  const isOwn = msg.user_id === authUserId;

  return (
    <div className={`wa-msg-row ${isOwn ? "own" : "other"}`}>
      <div className={`wa-bubble ${isOwn ? "own" : "other"}`}>
        {/* Image attachment */}
        {msg.file_path && msg.file_type?.startsWith("image") && (
          <img
            className="wa-bubble-img"
            src={`${baseUrl}/storage/${msg.file_path}`}
            alt="attachment"
            onClick={() => window.open(`${baseUrl}/storage/${msg.file_path}`, "_blank")}
          />
        )}

        {/* Text content */}
        {msg.content && <p className="wa-bubble-text">{msg.content}</p>}

        {/* Meta (time + read receipts) */}
        <div className="wa-bubble-meta">
          <span className="wa-time">{formatTime(msg.created_at)}</span>
          {isOwn && (
            <span className={`wa-ticks ${msg.seen ? "seen" : ""}`}>
              {msg.seen ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── DateSeparator ────────────────────────────────────────────────────────────
const DateSeparator = ({ date }) => (
  <div className="wa-date-sep">
    <span>{date}</span>
  </div>
);

// ─── TypingIndicator ──────────────────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="wa-msg-row other">
    <div className="wa-bubble other wa-typing-bubble">
      <div className="wa-typing-dots">
        <span /><span /><span />
      </div>
    </div>
  </div>
);

// ─── EmptyState ───────────────────────────────────────────────────────────────
const EmptyState = ({ hasUser, userName }) => (
  <div className="wa-empty">
    {hasUser ? (
      <>
        <div className="wa-empty-icon">👋</div>
        <p className="wa-empty-title">Start a conversation with {userName}</p>
        <p className="wa-empty-sub">Send a message and start chatting securely.</p>
      </>
    ) : (
      <>
        <div className="wa-empty-icon">💬</div>
        <p className="wa-empty-title">Your Messages</p>
        <p className="wa-empty-sub">
          Select a contact from the list to start a conversation.
        </p>
      </>
    )}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const Messagerie = ({ authUserId, baseUrl = "import.meta.env.VITE_API_URL" }) => {
  const [connections, setConnections] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const pollingRef = useRef(null);
  const typingPollRef = useRef(null);

  // Quick emoji list
  const emojis = ["😊","😂","❤️","👍","🙏","😍","🤔","😢","🎉","🔥","✅","💯","😎","🤗","😅","👏","💪","🥰","😏","🤣","😭","🤩","💀","😡","🤦","🙄","👀","💬","🎊","✨"];

  // ── Notifications ──────────────────────────────────────────────────────────
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherUserTyping]);

  // ── Load connections ────────────────────────────────────────────────────────
  // ── Load mutual connections (amis uniquement) ────────────────────────────────
useEffect(() => {
  const fetchMutualConnections = async () => {
    if (!authUserId) return;
    
    try {
      setLoading(true);
      
      // Récupérer les personnes que JE suis
      const followingRes = await api.get(`/users/${authUserId}/following`);
      const followingList = followingRes.data;
      
      // Récupérer les personnes qui ME suivent
      const followersRes = await api.get(`/users/${authUserId}/followers`);
      const followersList = followersRes.data;
      
      // Garder seulement ceux qui sont dans les DEUX listes (amis mutuels)
      const mutualConnections = followingList.filter(following => 
        followersList.some(follower => follower.id === following.id)
      );
      
      setConnections(mutualConnections);
    } catch (err) {
      console.error("Error fetching mutual connections:", err);
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };
  
  fetchMutualConnections();
}, [authUserId]);

  // ── Poll messages ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = () => {
      api.get(`/messages/${conversationId}`)
        .then(res => {
          setMessages(prev => {
            if (prev.length > 0 && res.data.length > prev.length) {
              const newest = res.data[res.data.length - 1];
              if (
                newest.user_id !== authUserId &&
                !document.hasFocus() &&
                Notification.permission === "granted"
              ) {
                new Notification(newest.user?.name || "New message", {
                  body: newest.content || "Sent you a message",
                  icon: "/favicon.ico",
                });
              }
            }
            return res.data;
          });
          // Mark as seen
          api.post(`/messages/${conversationId}/seen`, { user_id: authUserId }).catch(() => {});
        })
        .catch(() => {});
    };

    fetchMessages();
    pollingRef.current = setInterval(fetchMessages, 3000);
    return () => clearInterval(pollingRef.current);
  }, [conversationId, authUserId]);

  // ── Poll typing indicator ───────────────────────────────────────────────────
  useEffect(() => {
    if (!conversationId) return;

    typingPollRef.current = setInterval(() => {
      api.get(`/messages/${conversationId}/typing`)
        .then(res => setOtherUserTyping(res.data.is_typing && res.data.user_id !== authUserId))
        .catch(() => {});
    }, 2000);

    return () => clearInterval(typingPollRef.current);
  }, [conversationId, authUserId]);

  // ── Start conversation ─────────────────────────────────────────────────────
  const startConversation = useCallback(async (user) => {
    if (selectedUser?.id === user.id) {
      setSidebarOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/messages/conversations", {
        user_id: user.id,
        auth_user_id: authUserId,
      });
      setConversationId(res.data.id);
      setSelectedUser(user);
      setMessages([]);
      setSidebarOpen(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [authUserId, selectedUser]);

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!content.trim() && !file) return;

    const formData = new FormData();
    formData.append("user_id", authUserId);
    if (content.trim()) formData.append("content", content.trim());
    if (file) formData.append("file", file);

    // Optimistic update
    const optimistic = {
      id: `tmp_${Date.now()}`,
      user_id: authUserId,
      content: content.trim(),
      file_path: null,
      file_type: null,
      seen: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setContent("");
    setFile(null);
    setFilePreview(null);
    setShowEmoji(false);

    clearTimeout(typingTimeoutRef.current);
    api.post(`/messages/${conversationId}/typing`, { user_id: authUserId, is_typing: false }).catch(() => {});

    try {
      const res = await api.post(`/messages/${conversationId}`, formData);
      setMessages(prev => prev.map(m => m.id === optimistic.id ? res.data : m));
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      console.error(err);
    }
  };

  // ── Typing handler ─────────────────────────────────────────────────────────
  const handleTyping = (e) => {
    setContent(e.target.value);
    if (!conversationId) return;

    api.post(`/messages/${conversationId}/typing`, { user_id: authUserId, is_typing: true }).catch(() => {});
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      api.post(`/messages/${conversationId}/typing`, { user_id: authUserId, is_typing: false }).catch(() => {});
    }, 2000);
  };

  // ── File select ────────────────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith("image")) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target.result);
      reader.readAsDataURL(f);
    } else {
      setFilePreview(null);
    }
  };

  // ── Group messages by date ─────────────────────────────────────────────────
  const groupedMessages = messages.reduce((acc, msg) => {
    const date = formatDate(msg.created_at);
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});

  // ── Filter connections ─────────────────────────────────────────────────────
  const filtered = connections.filter(u =>
    u.id !== authUserId &&
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Get last message preview ───────────────────────────────────────────────
  const getPreview = (userId) => {
    if (selectedUser?.id === userId && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.user_id === authUserId) return `You: ${last.content || "📎"}`;
      return last.content || "📎 Attachment";
    }
    return null;
  };

  return (
    <div className="wa-root">
      {/* ── Sidebar ── */}
      <aside className={`wa-sidebar ${sidebarOpen || !selectedUser ? "wa-sidebar--open" : ""}`}>
        {/* Header */}
        <div className="wa-sidebar-header">
          <Avatar name="Me" size={38} />
          <h1 className="wa-sidebar-title">Messages</h1>
        </div>

        {/* Search */}
        <div className="wa-search-wrap">
          <div className="wa-search-box">
            <span className="wa-search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search or start new chat"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="wa-search-input"
            />
          </div>
        </div>

        {/* Contacts */}
        <div className="wa-contacts">
          {filtered.length === 0 && (
            <div className="wa-no-contacts">
              <span>No contacts found</span>
              <small>Start by adding friends</small>
            </div>
          )}
          {filtered.map(user => {
            const online = isOnline(user.last_seen);
            const preview = getPreview(user.id);
            const isActive = selectedUser?.id === user.id;
            return (
              <div
                key={user.id}
                className={`wa-contact ${isActive ? "wa-contact--active" : ""}`}
                onClick={() => startConversation(user)}
              >
                <Avatar name={user.name} size={50} online={online} />
                <div className="wa-contact-info">
                  <div className="wa-contact-top">
                    <span className="wa-contact-name">{user.name}</span>
                    {preview && (
                      <span className="wa-contact-time">
                        {selectedUser?.id === user.id && messages.length > 0
                          ? formatTime(messages[messages.length - 1]?.created_at)
                          : ""}
                      </span>
                    )}
                  </div>
                  <span className="wa-contact-preview">
                    {preview || (online ? "Online" : "Tap to chat")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── Chat Panel ── */}
      <main className="wa-chat">
        {/* Chat Header */}
        {selectedUser ? (
          <div className="wa-chat-header">
            <button
              className="wa-back-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Back to contacts"
            >
              ‹
            </button>
            <Avatar name={selectedUser.name} size={42} online={isOnline(selectedUser.last_seen)} />
            <div className="wa-chat-header-info">
              <span className="wa-chat-name">{selectedUser.name}</span>
              <span className="wa-chat-status">
                {otherUserTyping
                  ? "typing..."
                  : isOnline(selectedUser.last_seen)
                  ? "online"
                  : "last seen recently"}
              </span>
            </div>
          </div>
        ) : (
          <div className="wa-chat-header wa-chat-header--empty">
            <button
              className="wa-back-btn wa-back-btn--mobile"
              onClick={() => setSidebarOpen(true)}
              aria-label="Back"
            >
              ‹
            </button>
            <span className="wa-chat-name">Select a chat</span>
          </div>
        )}

        {/* Messages */}
        <div className="wa-messages">
          {!selectedUser ? (
            <EmptyState hasUser={false} />
          ) : messages.length === 0 ? (
            <EmptyState hasUser={true} userName={selectedUser.name} />
          ) : (
            Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
                <DateSeparator date={date} />
                {msgs.map(msg => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    authUserId={authUserId}
                    baseUrl={baseUrl}
                  />
                ))}
              </div>
            ))
          )}

          {otherUserTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {selectedUser && (
          <div className="wa-input-area">
            {/* File preview */}
            {file && (
              <div className="wa-file-preview">
                {filePreview ? (
                  <img src={filePreview} alt="preview" className="wa-file-preview-img" />
                ) : (
                  <span className="wa-file-preview-name">📎 {file.name}</span>
                )}
                <button
                  className="wa-remove-file"
                  onClick={() => { setFile(null); setFilePreview(null); }}
                  aria-label="Remove file"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Emoji tray */}
            {showEmoji && (
              <div className="wa-emoji-tray">
                {emojis.map(e => (
                  <button
                    key={e}
                    className="wa-emoji-btn"
                    onClick={() => setContent(prev => prev + e)}
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}

            <div className="wa-input-row">
              {/* Emoji button */}
              <button
                className="wa-input-icon"
                onClick={() => setShowEmoji(!showEmoji)}
                aria-label="Emoji"
              >
                {showEmoji ? "😁" : "😊"}
              </button>

              {/* File attachment */}
              <label className="wa-input-icon" title="Attach image">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
              </label>

              {/* Text input */}
              <input
                ref={inputRef}
                type="text"
                className="wa-text-input"
                placeholder="Type a message"
                value={content}
                onChange={handleTyping}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />

              {/* Send button */}
              <button
                className="wa-send-btn"
                onClick={handleSend}
                disabled={!content.trim() && !file}
                aria-label="Send message"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Messagerie;




