import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import "./Messagerie.css";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: { "Accept": "application/json" }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Module-level constants (never recreated on render) ──────────────────────
const EMOJIS = ["😊","😂","❤️","👍","🙏","😍","🤔","😢","🎉","🔥","✅","💯","😎","🤗","😅","👏","💪","🥰","😏","🤣","😭","🤩","💀","😡","🤦","🙄","👀","💬","🎊","✨"];

const AVATAR_COLORS = [
  ["#128C7E", "#075E54"],
  ["#25D366", "#128C7E"],
  ["#34B7F1", "#0095A0"],
  ["#FF6B6B", "#EE5A24"],
  ["#A29BFE", "#6C5CE7"],
  ["#FFB74D", "#FF9800"],
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getInitials = (name = "") =>
  name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

const formatTime = (dateStr) =>
  new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatDate = (dateStr, t) => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return t("messagerie.dates.today");
  if (d.toDateString() === yesterday.toDateString()) return t("messagerie.dates.yesterday");
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
};

const isOnline = (lastSeen) => {
  if (!lastSeen) return false;
  return (new Date() - new Date(lastSeen)) / 1000 < 120;
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = React.memo(({ name, size = 48, online = false, profilePic = null }) => {
  const [imgError, setImgError] = useState(false);
  const idx = name ? name.charCodeAt(0) % AVATAR_COLORS.length : 0;
  const [bg1, bg2] = AVATAR_COLORS[idx];

  const imageUrl = profilePic
    ? (profilePic.startsWith('http') ? profilePic : `${import.meta.env.VITE_API_URL}${profilePic}`)
    : null;

  return (
    <div className="wa-avatar-wrap">
      {imageUrl && !imgError ? (
        <img
          src={imageUrl}
          alt={name}
          style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
          onError={() => setImgError(true)}
        />
      ) : (
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
      )}
      {online && <span className="wa-online-dot" />}
    </div>
  );
});

// ─── MessageBubble ────────────────────────────────────────────────────────────
const MessageBubble = React.memo(({ msg, authUserId, baseUrl, t, onRetry, onOpenImage }) => {
  const isOwn = msg.user_id === authUserId;

  return (
    <div className={`wa-msg-row ${isOwn ? "own" : "other"}`}>
      <div
        className={`wa-bubble ${isOwn ? "own" : "other"} ${msg.status === "failed" ? "wa-bubble--failed" : ""}`}
        onClick={msg.status === "failed" && onRetry ? () => onRetry(msg) : undefined}
        style={msg.status === "failed" ? { cursor: "pointer" } : undefined}
      >
        {/* Image attachment — real or optimistic local preview */}
        {(msg._localPreview || (msg.file_path && msg.file_type?.startsWith("image"))) && (
          <img
            className="wa-bubble-img"
            src={msg._localPreview || `${baseUrl}/storage/${msg.file_path}`}
            alt={t("messagerie.attachment")}
            style={msg._localPreview ? { opacity: 0.75 } : undefined}
            onClick={() => {
              if (!msg._localPreview && onOpenImage)
                onOpenImage(`${baseUrl}/storage/${msg.file_path}`);
            }}
          />
        )}

        {/* Text content */}
        {msg.content && <p className="wa-bubble-text">{msg.content}</p>}

        {/* Meta (time + read receipts) */}
        <div className="wa-bubble-meta">
          <span className="wa-time">{formatTime(msg.created_at)}</span>
          {isOwn && (
            <>
              {msg.status === "sending" && (
                <span className="wa-ticks wa-ticks--sending" title="Sending">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                </span>
              )}
              {msg.status === "failed" && (
                <span className="wa-ticks wa-ticks--failed" title="Failed — tap to retry">⚠</span>
              )}
              {(msg.status === "sent" || msg.status === undefined) && (
                <span className={`wa-ticks ${msg.seen ? "seen" : ""}`}>
                  {msg.seen ? "✓✓" : "✓"}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

// ─── DateSeparator ────────────────────────────────────────────────────────────
const DateSeparator = React.memo(({ date }) => (
  <div className="wa-date-sep">
    <span>{date}</span>
  </div>
));

// ─── TypingIndicator ──────────────────────────────────────────────────────────
const TypingIndicator = React.memo(() => (
  <div className="wa-msg-row other">
    <div className="wa-bubble other wa-typing-bubble">
      <div className="wa-typing-dots">
        <span /><span /><span />
      </div>
    </div>
  </div>
));

// ─── EmptyState ───────────────────────────────────────────────────────────────
const EmptyState = React.memo(({ hasUser, userName, t }) => (
  <div className="wa-empty">
    {hasUser ? (
      <>
        <div className="wa-empty-icon">👋</div>
        <p className="wa-empty-title">{t("messagerie.empty.withUser", { name: userName })}</p>
        <p className="wa-empty-sub">{t("messagerie.empty.withUserSub")}</p>
      </>
    ) : (
      <>
        <div className="wa-empty-icon">💬</div>
        <p className="wa-empty-title">{t("messagerie.empty.noUser")}</p>
        <p className="wa-empty-sub">{t("messagerie.empty.noUserSub")}</p>
      </>
    )}
  </div>
));

// ─── Main Component ───────────────────────────────────────────────────────────
const Messagerie = ({ authUserId, baseUrl = import.meta.env.VITE_API_URL }) => {
  const [connections, setConnections]       = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages]             = useState([]);
  const [content, setContent]               = useState("");
  const [selectedUser, setSelectedUser]     = useState(null);
  const [files, setFiles]                   = useState([]);  // [{ file, preview }]
  const [searchTerm, setSearchTerm]         = useState("");
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showEmoji, setShowEmoji]           = useState(false);
  const [sidebarOpen, setSidebarOpen]       = useState(true);
  const [loading, setLoading]               = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [lightboxSrc, setLightboxSrc]       = useState(null);
  const [showFab, setShowFab]               = useState(false);
  const [unreadPerUser, setUnreadPerUser]   = useState({});

  const messagesEndRef      = useRef(null);
  const inputRef            = useRef(null);
  const fileInputRef        = useRef(null);
  const typingTimeoutRef    = useRef(null);
  const pollingRef          = useRef(null);
  const typingPollRef       = useRef(null);
  const isAtBottomRef       = useRef(true);
  const messagesContainerRef = useRef(null);
  const messageCacheRef     = useRef({});  // { [convId]: { messages, fetchedAt } }
  const convMetaCacheRef    = useRef({});  // { [userId]: { unread, lastMsg, lastTime } }

  const { t } = useTranslation();

  // ── Notifications ──────────────────────────────────────────────────────────
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ── Scroll helpers ─────────────────────────────────────────────────────────
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    isAtBottomRef.current = distanceFromBottom < 80;
    setShowFab(distanceFromBottom > 160);
  };

  const scrollToBottom = useCallback((behavior = "smooth") => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom("smooth");
    }
  }, [messages, otherUserTyping]);

  // ── Load mutual connections ────────────────────────────────────────────────
  useEffect(() => {
    const fetchMutualConnections = async () => {
      if (!authUserId) return;
      try {
        setLoading(true);
        const followingRes = await api.get(`/users/${authUserId}/following`);
        const followersRes = await api.get(`/users/${authUserId}/followers`);
        const mutualConnections = followingRes.data.filter(following =>
          followersRes.data.some(follower => follower.id === following.id)
        );
        setConnections(mutualConnections);
      } catch (err) {
        console.error(t("messagerie.errors.fetchConnections"), err);
        setConnections([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMutualConnections();
  }, [authUserId]);

  // ── Reset unread on conversation open ─────────────────────────────────────
  useEffect(() => {
    if (!conversationId || !selectedUser) return;
    setUnreadPerUser(prev => ({ ...prev, [selectedUser.id]: 0 }));
  }, [conversationId, selectedUser]);

  // ── Sync active conversation last message → sidebar cache ─────────────────
  useEffect(() => {
    if (!selectedUser || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.status === "sending") return;
    const existing = convMetaCacheRef.current[selectedUser.id] || {};
    convMetaCacheRef.current[selectedUser.id] = {
      ...existing,
      lastMsg: last.user_id === authUserId
        ? `${t("messagerie.you")}: ${last.content || "📎"}`
        : last.content || t("messagerie.attachment"),
      lastTime: last.created_at,
    };
  }, [messages, selectedUser, authUserId, t]);

  // ── Poll messages ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = () => {
      const cache = messageCacheRef.current[conversationId];
      const now = Date.now();

      // Skip fetch if cache is fresh (< 5s) and we already have messages
      if (cache?.fetchedAt && now - cache.fetchedAt < 5000 && cache.messages?.length) {
        setLoadingMessages(false);
        return;
      }

      api.get(`/messages/${conversationId}`)
        .then(res => {
          messageCacheRef.current[conversationId] = {
            messages: res.data,
            fetchedAt: Date.now(),
          };
          setMessages(prev => {
            if (prev.length > 0 && res.data.length > prev.length) {
              const newest = res.data[res.data.length - 1];
              if (
                newest.user_id !== authUserId &&
                !document.hasFocus() &&
                Notification.permission === "granted"
              ) {
                new Notification(newest.user?.name || t("messagerie.notifications.newMessage"), {
                  body: newest.content || t("messagerie.notifications.sentMessage"),
                  icon: "/favicon.ico",
                });
              }
            }
            return res.data;
          });
          setLoadingMessages(false);
          api.post(`/messages/${conversationId}/seen`, { user_id: authUserId }).catch(() => {});
        })
        .catch(() => { setLoadingMessages(false); });
    };

    fetchMessages();
    pollingRef.current = setInterval(fetchMessages, 3000);
    return () => clearInterval(pollingRef.current);
  }, [conversationId, authUserId]);

  // ── Poll typing indicator ──────────────────────────────────────────────────
  useEffect(() => {
    if (!conversationId) return;
    typingPollRef.current = setInterval(() => {
      api.get(`/messages/${conversationId}/typing`)
        .then(res => setOtherUserTyping(res.data.is_typing && res.data.user_id !== authUserId))
        .catch(() => {});
    }, 2000);
    return () => clearInterval(typingPollRef.current);
  }, [conversationId, authUserId]);

  // ── Poll unread counts ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!authUserId) return;

    const fetchUnread = async () => {
      try {
        const res = await api.get('/messages/conversations');
        const unread = {};
        res.data.forEach(conv => {
          unread[conv.other_user_id] = conv.unread_count;
          convMetaCacheRef.current[conv.other_user_id] = {
            unread: conv.unread_count,
            lastMsg: conv.last_message,
            lastTime: conv.last_message_at,
            cachedAt: Date.now(),
          };
        });
        setUnreadPerUser(unread);
      } catch {}
    };

    // Restore badges from cache instantly on mount
    const cachedUnread = {};
    Object.entries(convMetaCacheRef.current).forEach(([userId, meta]) => {
      cachedUnread[userId] = meta.unread;
    });
    if (Object.keys(cachedUnread).length) {
      setUnreadPerUser(cachedUnread);
    }

    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, [authUserId]);

  // ── Start conversation ─────────────────────────────────────────────────────
  const startConversation = useCallback(async (user) => {
    if (selectedUser?.id === user.id) {
      setSidebarOpen(false);
      return;
    }
    setLoading(true);
    setSelectedUser(user);
    setSidebarOpen(false);

    // Restore cached messages instantly — no blank screen
    const pendingConvKey = `pending_${user.id}`;
    const cached = messageCacheRef.current[pendingConvKey];
    if (cached?.messages?.length) {
      setMessages(cached.messages);
      setLoadingMessages(false);
    } else {
      setLoadingMessages(true);
    }

    try {
      const res = await api.post("/messages/conversations", {
        user_id: user.id,
        auth_user_id: authUserId,
      });
      const convId = res.data.id;

      // Move pending cache to real convId key
      if (messageCacheRef.current[pendingConvKey]) {
        messageCacheRef.current[convId] = messageCacheRef.current[pendingConvKey];
        delete messageCacheRef.current[pendingConvKey];
      }

      // Restore from convId cache if available
      const convCached = messageCacheRef.current[convId];
      if (convCached?.messages?.length) {
        setMessages(convCached.messages);
        setLoadingMessages(false);
      }

      setConversationId(convId);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      console.error(t("messagerie.errors.startConversation"), err);
      setLoadingMessages(false);
    } finally {
      setLoading(false);
    }
  }, [authUserId, selectedUser]);

  // ── Send one message (shared by text + each image) ─────────────────────────
  const sendOne = useCallback(async (optimisticId, formData) => {
    try {
      const res = await api.post(`/messages/${conversationId}`, formData);
      if (messageCacheRef.current[conversationId]) {
        messageCacheRef.current[conversationId].fetchedAt = 0;
      }
      setMessages(prev =>
        prev.map(m => m.id === optimisticId ? { ...res.data, status: "sent" } : m)
      );
    } catch (err) {
      setMessages(prev =>
        prev.map(m => m.id === optimisticId ? { ...m, status: "failed" } : m)
      );
      console.error(t("messagerie.errors.sendMessage"), err);
    }
  }, [conversationId, t]);

  // ── Handle send ────────────────────────────────────────────────────────────
  const handleSend = useCallback(async (retryMsg = null) => {
    const textContent = retryMsg ? retryMsg.content : content.trim();
    const filesToSend = retryMsg ? [] : files;

    if (!textContent && !filesToSend.length) return;

    isAtBottomRef.current = true;

    if (retryMsg) {
      // Retry: flip failed message back to sending
      setMessages(prev =>
        prev.map(m => m.id === retryMsg.id ? { ...m, status: "sending" } : m)
      );
      const formData = new FormData();
      formData.append("user_id", authUserId);
      if (retryMsg.content) formData.append("content", retryMsg.content);
      await sendOne(retryMsg.id, formData);
      return;
    }

    // Clear inputs immediately
    setContent("");
    setFiles([]);
    setShowEmoji(false);
    clearTimeout(typingTimeoutRef.current);
    api.post(`/messages/${conversationId}/typing`, { user_id: authUserId, is_typing: false }).catch(() => {});

    // Send text
    if (textContent) {
      const optimisticId = `tmp_${Date.now()}`;
      setMessages(prev => [...prev, {
        id: optimisticId,
        user_id: authUserId,
        content: textContent,
        file_path: null,
        file_type: null,
        seen: false,
        status: "sending",
        created_at: new Date().toISOString(),
      }]);
      const formData = new FormData();
      formData.append("user_id", authUserId);
      formData.append("content", textContent);
      sendOne(optimisticId, formData); // fire-and-forget
    }

    // Send each image sequentially
    for (const { file: f, preview } of filesToSend) {
      const optimisticId = `tmp_img_${Date.now()}_${Math.random()}`;
      setMessages(prev => [...prev, {
        id: optimisticId,
        user_id: authUserId,
        content: "",
        file_path: null,
        file_type: "image/jpeg",
        _localPreview: preview,
        seen: false,
        status: "sending",
        created_at: new Date().toISOString(),
      }]);
      const formData = new FormData();
      formData.append("user_id", authUserId);
      formData.append("file", f);
      await sendOne(optimisticId, formData); // await to keep order
    }
  }, [content, files, authUserId, conversationId, sendOne]);

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
    const selected = Array.from(e.target.files);
    if (!selected.length) return;
    selected.forEach(f => {
      if (!f.type.startsWith("image")) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFiles(prev => [...prev, { file: f, preview: ev.target.result }]);
      };
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  };

  // ── Memoized derived state ─────────────────────────────────────────────────
  const filtered = useMemo(() =>
    connections.filter(u =>
      u.id !== authUserId &&
      u.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  [connections, authUserId, searchTerm]);

  const groupedMessages = useMemo(() =>
    messages.reduce((acc, msg) => {
      const date = formatDate(msg.created_at, t);
      if (!acc[date]) acc[date] = [];
      acc[date].push(msg);
      return acc;
    }, {}),
  [messages, t]);

  const getPreview = useCallback((userId) => {
    if (selectedUser?.id === userId && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.user_id === authUserId) return `${t("messagerie.you")}: ${last.content || "📎"}`;
      return last.content || t("messagerie.attachment");
    }
    const meta = convMetaCacheRef.current[userId];
    if (meta?.lastMsg) return meta.lastMsg;
    return null;
  }, [selectedUser, messages, authUserId, t]);

  const getLastTime = useCallback((userId) => {
    if (selectedUser?.id === userId && messages.length > 0) {
      const last = messages[messages.length - 1];
      return formatTime(last.created_at);
    }
    const meta = convMetaCacheRef.current[userId];
    if (meta?.lastTime) return formatTime(meta.lastTime);
    return "";
  }, [selectedUser, messages]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="wa-root">

      {/* ── Lightbox ── */}
      {lightboxSrc && (
        <div className="wa-lightbox" onClick={() => setLightboxSrc(null)}>
          <img src={lightboxSrc} alt="preview" onClick={e => e.stopPropagation()} />
          <button
            className="wa-lightbox-close"
            onClick={() => setLightboxSrc(null)}
            aria-label="Close"
          >✕</button>
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside className={`wa-sidebar ${sidebarOpen || !selectedUser ? "wa-sidebar--open" : ""}`}>
        <div className="wa-sidebar-header">
          <Avatar name="Me" size={38} />
          <h1 className="wa-sidebar-title">{t("messagerie.title")}</h1>
        </div>

        <div className="wa-search-wrap">
          <div className="wa-search-box">
            <span className="wa-search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
            <input
              type="text"
              placeholder={t("messagerie.searchPlaceholder")}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="wa-search-input"
            />
          </div>
        </div>

        <div className="wa-contacts">
          {filtered.length === 0 && (
            <div className="wa-no-contacts">
              <span>{t("messagerie.noContacts")}</span>
              <small>{t("messagerie.noContactsHint")}</small>
            </div>
          )}
          {filtered.map(user => {
            const online  = isOnline(user.last_seen);
            const preview = getPreview(user.id);
            const isActive = selectedUser?.id === user.id;
            return (
              <div
                key={user.id}
                className={`wa-contact ${isActive ? "wa-contact--active" : ""}`}
                onClick={() => startConversation(user)}
              >
                <Avatar name={user.name} size={50} online={online} profilePic={user.profile_pic} />
                <div className="wa-contact-info">
                  <div className="wa-contact-top">
                    <span className="wa-contact-name">{user.name}</span>
                    <span className="wa-contact-time">{getLastTime(user.id)}</span>
                  </div>
                  <div className="wa-contact-bottom">
                    <span className={`wa-contact-preview ${unreadPerUser[user.id] > 0 ? "wa-contact-preview--unread" : ""}`}>
                      {preview || (online ? t("messagerie.status.online") : t("messagerie.status.tapToChat"))}
                    </span>
                    {unreadPerUser[user.id] > 0 && (
                      <span className="wa-unread-badge">
                        {unreadPerUser[user.id] > 99 ? "99+" : unreadPerUser[user.id]}
                      </span>
                    )}
                  </div>
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
              aria-label={t("messagerie.backToContacts")}
            >‹</button>
            <Avatar
              name={selectedUser.name}
              size={42}
              online={isOnline(selectedUser.last_seen)}
              profilePic={selectedUser.profile_pic}
            />
            <div className="wa-chat-header-info">
              <span className="wa-chat-name">{selectedUser.name}</span>
              <span className="wa-chat-status">
                {otherUserTyping
                  ? t("messagerie.status.typing")
                  : isOnline(selectedUser.last_seen)
                  ? t("messagerie.status.online")
                  : t("messagerie.status.lastSeenRecently")}
              </span>
            </div>
          </div>
        ) : (
          <div className="wa-chat-header wa-chat-header--empty">
            <button
              className="wa-back-btn wa-back-btn--mobile"
              onClick={() => setSidebarOpen(true)}
              aria-label={t("messagerie.back")}
            >‹</button>
            <span className="wa-chat-name">{t("messagerie.selectChat")}</span>
          </div>
        )}

        {/* Messages */}
        <div
          className={`wa-messages${loadingMessages ? " wa-messages--switching" : ""}`}
          ref={messagesContainerRef}
          onScroll={handleScroll}
        >
          {loadingMessages && (
            <div className="wa-loading-overlay">
              <div className="wa-loading-spinner" />
            </div>
          )}

          {!selectedUser ? (
            <EmptyState hasUser={false} t={t} />
          ) : messages.length === 0 && !loadingMessages ? (
            <EmptyState hasUser={true} userName={selectedUser.name} t={t} />
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
                    t={t}
                    onRetry={handleSend}
                    onOpenImage={setLightboxSrc}
                  />
                ))}
              </div>
            ))
          )}

          {otherUserTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll-to-bottom FAB */}
        <button
          className={`wa-scroll-fab${showFab ? "" : " wa-scroll-fab--hidden"}`}
          onClick={() => { isAtBottomRef.current = true; scrollToBottom("smooth"); }}
          aria-label="Scroll to bottom"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12l7 7 7-7"/>
          </svg>
        </button>

        {/* Input Area */}
        {selectedUser && (
          <div className="wa-input-area">

            {/* Multi-image preview grid */}
            {files.length > 0 && (
              <div className="wa-files-preview">
                {files.map((item, idx) => (
                  <div key={idx} className="wa-file-thumb">
                    <img src={item.preview} alt="" className="wa-file-thumb-img" />
                    <button
                      className="wa-file-thumb-remove"
                      onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))}
                      aria-label={t("messagerie.removeFile")}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Emoji tray */}
            {showEmoji && (
              <div className="wa-emoji-tray">
                {EMOJIS.map(e => (
                  <button
                    key={e}
                    className="wa-emoji-btn"
                    onClick={() => setContent(prev => prev + e)}
                  >{e}</button>
                ))}
              </div>
            )}

            <div className="wa-input-row">
              <button
                className="wa-input-icon"
                onClick={() => setShowEmoji(!showEmoji)}
                aria-label={t("messagerie.emoji")}
              >{showEmoji ? "😁" : "😊"}</button>

              <label className="wa-input-icon" title={t("messagerie.attachImage")}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
              </label>

              <input
                ref={inputRef}
                type="text"
                className="wa-text-input"
                placeholder={t("messagerie.typeMessage")}
                value={content}
                onChange={handleTyping}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />

              <button
                className="wa-send-btn"
                onClick={handleSend}
                disabled={!content.trim() && !files.length}
                aria-label={t("messagerie.sendMessage")}
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