import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
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

// ─── Helpers ────────────────────────────────────────────────────────────────
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

// ─── Avatar ─────────────────────────────────────────────────────────────────
const Avatar = memo(({ name, size = 48, online = false, profilePic = null }) => {
  const [imgError, setImgError] = useState(false);
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

  const imageUrl = useMemo(() => {
    if (!profilePic) return null;
    return profilePic.startsWith('http')
      ? profilePic
      : `${import.meta.env.VITE_API_URL}${profilePic}`;
  }, [profilePic]);

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

// ─── Skeleton Loaders ────────────────────────────────────────────────────────
const ContactSkeleton = memo(() => (
  <div className="wa-contact wa-skeleton-contact">
    <div className="wa-skeleton wa-skeleton-avatar" />
    <div className="wa-contact-info">
      <div className="wa-contact-top">
        <div className="wa-skeleton wa-skeleton-name" />
        <div className="wa-skeleton wa-skeleton-time" />
      </div>
      <div className="wa-skeleton wa-skeleton-preview" />
    </div>
  </div>
));

const MessageSkeleton = memo(() => (
  <div className="wa-messages-skeleton">
    {[...Array(5)].map((_, i) => (
      <div key={i} className={`wa-msg-row ${i % 2 === 0 ? "other" : "own"}`}>
        <div className={`wa-skeleton wa-skeleton-bubble ${i % 2 === 0 ? "other" : "own"}`} />
      </div>
    ))}
  </div>
));

// ─── MessageBubble ────────────────────────────────────────────────────────────
const MessageBubble = memo(({ msg, authUserId, baseUrl, t }) => {
  const isOwn = msg.user_id === authUserId;
  const status = msg.status || (msg.seen ? "seen" : "sent");

  const tickIcon = useMemo(() => {
    if (!isOwn) return null;
    if (status === "sending") return <span className="wa-ticks sending">🕐</span>;
    if (status === "seen") return <span className="wa-ticks seen">✓✓</span>;
    return <span className="wa-ticks">✓✓</span>;
  }, [isOwn, status]);

  return (
    <div className={`wa-msg-row ${isOwn ? "own" : "other"}`}>
      <div className={`wa-bubble ${isOwn ? "own" : "other"} ${status === "sending" ? "wa-bubble--sending" : ""}`}>
        {/* Image attachments (multiple) */}
        {msg.file_paths?.length > 0 && (
          <div className={`wa-bubble-images wa-bubble-images--${Math.min(msg.file_paths.length, 4)}`}>
            {msg.file_paths.map((fp, idx) => (
              <img
                key={idx}
                className="wa-bubble-img"
                src={`${baseUrl}/storage/${fp}`}
                alt={t("messagerie.attachment")}
                onClick={() => window.open(`${baseUrl}/storage/${fp}`, "_blank")}
                loading="lazy"
              />
            ))}
          </div>
        )}

        {/* Legacy single image */}
        {!msg.file_paths && msg.file_path && msg.file_type?.startsWith("image") && (
          <img
            className="wa-bubble-img"
            src={`${baseUrl}/storage/${msg.file_path}`}
            alt={t("messagerie.attachment")}
            onClick={() => window.open(`${baseUrl}/storage/${msg.file_path}`, "_blank")}
            loading="lazy"
          />
        )}

        {/* Optimistic image previews */}
        {msg.localPreviews?.length > 0 && (
          <div className={`wa-bubble-images wa-bubble-images--${Math.min(msg.localPreviews.length, 4)}`}>
            {msg.localPreviews.map((src, idx) => (
              <img key={idx} className="wa-bubble-img wa-bubble-img--preview" src={src} alt="preview" />
            ))}
          </div>
        )}

        {msg.content && <p className="wa-bubble-text">{msg.content}</p>}

        <div className="wa-bubble-meta">
          <span className="wa-time">{formatTime(msg.created_at)}</span>
          {tickIcon}
        </div>
      </div>
    </div>
  );
});

// ─── DateSeparator ────────────────────────────────────────────────────────────
const DateSeparator = memo(({ date }) => (
  <div className="wa-date-sep">
    <span>{date}</span>
  </div>
));

// ─── TypingIndicator ──────────────────────────────────────────────────────────
const TypingIndicator = memo(() => (
  <div className="wa-msg-row other">
    <div className="wa-bubble other wa-typing-bubble">
      <div className="wa-typing-dots">
        <span /><span /><span />
      </div>
    </div>
  </div>
));

// ─── EmptyState ───────────────────────────────────────────────────────────────
const EmptyState = memo(({ hasUser, userName, t }) => (
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

// ─── Image Preview Strip ──────────────────────────────────────────────────────
const ImagePreviewStrip = memo(({ files, previews, onRemove, t }) => {
  if (!files.length) return null;
  return (
    <div className="wa-file-preview-strip">
      {previews.map((src, i) => (
        <div key={i} className="wa-file-preview-item">
          {src ? (
            <img src={src} alt="preview" className="wa-file-preview-img" />
          ) : (
            <div className="wa-file-preview-doc">📎 <span>{files[i]?.name}</span></div>
          )}
          <button
            className="wa-remove-file"
            onClick={() => onRemove(i)}
            aria-label={t("messagerie.removeFile")}
          >✕</button>
        </div>
      ))}
    </div>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────
const Messagerie = ({ authUserId, baseUrl = import.meta.env.VITE_API_URL }) => {
  const [connections, setConnections] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  // Multiple files support
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [unreadPerUser, setUnreadPerUser] = useState({});

  // Conversation cache: Map<conversationId, messages[]>
  const messageCache = useRef(new Map());
  // Last message per user for sidebar preview
  const lastMsgPerUser = useRef(new Map());

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const pollingRef = useRef(null);
  const typingPollRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const messagesContainerRef = useRef(null);
  const conversationIdRef = useRef(null); // avoid stale closure in polling

  const { t } = useTranslation();

  const emojis = ["😊","😂","❤️","👍","🙏","😍","🤔","😢","🎉","🔥","✅","💯","😎","🤗","😅","👏","💪","🥰","😏","🤣","😭","🤩","💀","😡","🤦","🙄","👀","💬","🎊","✨"];

  // Keep ref in sync
  useEffect(() => { conversationIdRef.current = conversationId; }, [conversationId]);

  // ── Notifications ──────────────────────────────────────────────────────────
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ── Scroll helpers ─────────────────────────────────────────────────────────
  const scrollToBottom = useCallback((behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const threshold = 80;
    isAtBottomRef.current =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  }, []);

  // Auto-scroll only when user is at bottom or it's their own message
  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom("smooth");
    }
  }, [messages, otherUserTyping, scrollToBottom]);

  // ── Load connections ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchMutualConnections = async () => {
      if (!authUserId) return;
      try {
        setLoading(true);
        const [followingRes, followersRes] = await Promise.all([
          api.get(`/users/${authUserId}/following`),
          api.get(`/users/${authUserId}/followers`),
        ]);
        const mutual = followingRes.data.filter(f =>
          followersRes.data.some(r => r.id === f.id)
        );
        setConnections(mutual);
      } catch (err) {
        console.error(t("messagerie.errors.fetchConnections"), err);
        setConnections([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMutualConnections();
  }, [authUserId, t]);

  // ── Mark read when conversation opens ──────────────────────────────────────
  useEffect(() => {
    if (!conversationId || !selectedUser) return;
    setUnreadPerUser(prev => ({ ...prev, [selectedUser.id]: 0 }));
  }, [conversationId, selectedUser]);

  // ── Poll messages ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/${conversationId}`);
        const incoming = res.data;

        setMessages(prev => {
          // Merge: keep optimistic (tmp_) messages that haven't been confirmed yet
          const confirmed = incoming;
          const stillOptimistic = prev.filter(
            m => String(m.id).startsWith("tmp_") &&
              !confirmed.some(c => c.id === m.serverEchoId)
          );

          const merged = [...confirmed, ...stillOptimistic].sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at)
          );

          // Notify if new message from other user
          if (prev.length > 0 && incoming.length > prev.filter(m => !String(m.id).startsWith("tmp_")).length) {
            const newest = incoming[incoming.length - 1];
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

          // Update cache
          messageCache.current.set(conversationId, merged);

          // Update sidebar last message
          if (incoming.length > 0) {
            const last = incoming[incoming.length - 1];
            if (selectedUser) lastMsgPerUser.current.set(selectedUser.id, last);
          }

          return merged;
        });

        api.post(`/messages/${conversationId}/seen`, { user_id: authUserId }).catch(() => {});
      } catch {}
    };

    fetchMessages();
    pollingRef.current = setInterval(fetchMessages, 3000);
    return () => clearInterval(pollingRef.current);
  }, [conversationId, authUserId, t, selectedUser]);

  // ── Poll typing ────────────────────────────────────────────────────────────
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

    // Immediately show cached messages (no blank screen)
    const cachedConvId = [...messageCache.current.entries()]
      .find(([, msgs]) => msgs[0]?.conversation_id === user.conversationId)?.[0];

    setSelectedUser(user);
    setSidebarOpen(false);

    // Restore from cache if available — instant display
    const cacheKey = `user_${user.id}`;
    if (messageCache.current.has(cacheKey)) {
      setMessages(messageCache.current.get(cacheKey));
      isAtBottomRef.current = true;
    }
    // Note: we do NOT call setMessages([]) anymore

    setConversationLoading(true);
    try {
      const res = await api.post("/messages/conversations", {
        user_id: user.id,
        auth_user_id: authUserId,
      });
      const convId = res.data.id;
      setConversationId(convId);

      // Fetch fresh messages and store under user key for cache
      const msgRes = await api.get(`/messages/${convId}`);
      messageCache.current.set(cacheKey, msgRes.data);
      messageCache.current.set(convId, msgRes.data);
      setMessages(msgRes.data);
      isAtBottomRef.current = true;
      setTimeout(() => scrollToBottom("instant"), 50);
    } catch (err) {
      console.error(t("messagerie.errors.startConversation"), err);
    } finally {
      setConversationLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [authUserId, selectedUser, scrollToBottom, t]);

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!content.trim() && files.length === 0) return;

    const formData = new FormData();
    formData.append("user_id", authUserId);
    if (content.trim()) formData.append("content", content.trim());
    files.forEach(f => formData.append("file", f)); // backend may need "files[]" — keep compat

    // Optimistic message with status
    const optimistic = {
      id: `tmp_${Date.now()}`,
      user_id: authUserId,
      content: content.trim(),
      file_path: null,
      file_paths: null,
      localPreviews: filePreviews.filter(Boolean),
      seen: false,
      status: "sending",
      created_at: new Date().toISOString(),
    };

    setMessages(prev => {
      const updated = [...prev, optimistic];
      const cacheKey = `user_${selectedUser?.id}`;
      messageCache.current.set(cacheKey, updated);
      if (conversationId) messageCache.current.set(conversationId, updated);
      return updated;
    });

    // Force scroll to bottom on send
    isAtBottomRef.current = true;
    setTimeout(() => scrollToBottom("smooth"), 30);

    setContent("");
    setFiles([]);
    setFilePreviews([]);
    setShowEmoji(false);

    clearTimeout(typingTimeoutRef.current);
    api.post(`/messages/${conversationId}/typing`, { user_id: authUserId, is_typing: false }).catch(() => {});

    try {
      const res = await api.post(`/messages/${conversationId}`, formData);
      const confirmed = { ...res.data, status: "sent" };

      setMessages(prev => {
        const updated = prev.map(m => m.id === optimistic.id ? confirmed : m);
        const cacheKey = `user_${selectedUser?.id}`;
        messageCache.current.set(cacheKey, updated);
        if (conversationId) messageCache.current.set(conversationId, updated);
        return updated;
      });

      // Update sidebar last message
      if (selectedUser) lastMsgPerUser.current.set(selectedUser.id, confirmed);
    } catch (err) {
      // Mark as failed but keep visible
      setMessages(prev =>
        prev.map(m => m.id === optimistic.id ? { ...m, status: "failed" } : m)
      );
      console.error(t("messagerie.errors.sendMessage"), err);
    }
  }, [content, files, filePreviews, authUserId, conversationId, selectedUser, scrollToBottom, t]);

  // ── Typing handler ─────────────────────────────────────────────────────────
  const handleTyping = useCallback((e) => {
    setContent(e.target.value);
    if (!conversationId) return;
    api.post(`/messages/${conversationId}/typing`, { user_id: authUserId, is_typing: true }).catch(() => {});
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      api.post(`/messages/${conversationId}/typing`, { user_id: authUserId, is_typing: false }).catch(() => {});
    }, 2000);
  }, [conversationId, authUserId]);

  // ── File select (multiple) ─────────────────────────────────────────────────
  const handleFileSelect = useCallback((e) => {
    const selected = Array.from(e.target.files);
    if (!selected.length) return;

    const newFiles = [...files, ...selected].slice(0, 6); // max 6 images
    setFiles(newFiles);

    const previewPromises = newFiles.map(f =>
      f.type.startsWith("image")
        ? new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = ev => resolve(ev.target.result);
            reader.readAsDataURL(f);
          })
        : Promise.resolve(null)
    );

    Promise.all(previewPromises).then(setFilePreviews);
    // Reset input so same file can be re-selected
    e.target.value = "";
  }, [files]);

  const handleRemoveFile = useCallback((idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setFilePreviews(prev => prev.filter((_, i) => i !== idx));
  }, []);

  // ── Group messages by date (memoized) ─────────────────────────────────────
  const groupedMessages = useMemo(() =>
    messages.reduce((acc, msg) => {
      const date = formatDate(msg.created_at, t);
      if (!acc[date]) acc[date] = [];
      acc[date].push(msg);
      return acc;
    }, {}),
    [messages, t]
  );

  // ── Filter connections ─────────────────────────────────────────────────────
  const filtered = useMemo(() =>
    connections.filter(u =>
      u.id !== authUserId &&
      u.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [connections, authUserId, searchTerm]
  );

  // ── Sidebar last message ───────────────────────────────────────────────────
  const getSidebarInfo = useCallback((user) => {
    const lastMsg = lastMsgPerUser.current.get(user.id);
    if (lastMsg) {
      const isOwn = lastMsg.user_id === authUserId;
      const preview = isOwn
        ? `${t("messagerie.you")}: ${lastMsg.content || "📎"}`
        : lastMsg.content || t("messagerie.attachment");
      return { preview, time: formatTime(lastMsg.created_at) };
    }
    // Fallback for active conversation
    if (selectedUser?.id === user.id && messages.length > 0) {
      const last = messages[messages.length - 1];
      const preview = last.user_id === authUserId
        ? `${t("messagerie.you")}: ${last.content || "📎"}`
        : last.content || t("messagerie.attachment");
      return { preview, time: formatTime(last.created_at) };
    }
    return { preview: null, time: null };
  }, [authUserId, messages, selectedUser, t]);

  // ── Unread polling ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authUserId) return;
    const fetchUnread = async () => {
      try {
        const res = await api.get('/messages/conversations');
        const unread = {};
        res.data.forEach(conv => { unread[conv.other_user_id] = conv.unread_count; });
        setUnreadPerUser(unread);
        // Also update last message cache for sidebar
        res.data.forEach(conv => {
          if (conv.last_message) {
            lastMsgPerUser.current.set(conv.other_user_id, conv.last_message);
          }
        });
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, [authUserId]);

  // ── Key handler ────────────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const canSend = content.trim() || files.length > 0;

  return (
    <div className="wa-root">
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
          {loading ? (
            [...Array(5)].map((_, i) => <ContactSkeleton key={i} />)
          ) : filtered.length === 0 ? (
            <div className="wa-no-contacts">
              <span>{t("messagerie.noContacts")}</span>
              <small>{t("messagerie.noContactsHint")}</small>
            </div>
          ) : (
            filtered.map(user => {
              const online = isOnline(user.last_seen);
              const { preview, time } = getSidebarInfo(user);
              const isActive = selectedUser?.id === user.id;
              const unread = unreadPerUser[user.id];

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
                      {time && <span className="wa-contact-time">{time}</span>}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="wa-contact-preview">
                        {preview || (online ? t("messagerie.status.online") : t("messagerie.status.tapToChat"))}
                      </span>
                      {unread > 0 && (
                        <span className="wa-unread-badge">{unread}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Chat Panel ── */}
      <main className="wa-chat">
        {/* Chat Header — always fixed */}
        {selectedUser ? (
          <div className="wa-chat-header">
            <button
              className="wa-back-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label={t("messagerie.backToContacts")}
            >‹</button>
            <Avatar name={selectedUser.name} size={42} online={isOnline(selectedUser.last_seen)} profilePic={selectedUser.profile_pic} />
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

        {/* Messages — only this scrolls */}
        <div
          className="wa-messages"
          ref={messagesContainerRef}
          onScroll={handleScroll}
        >
          {!selectedUser ? (
            <EmptyState hasUser={false} t={t} />
          ) : conversationLoading && messages.length === 0 ? (
            <MessageSkeleton />
          ) : messages.length === 0 ? (
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
                  />
                ))}
              </div>
            ))
          )}

          {otherUserTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area — always fixed */}
        {selectedUser && (
          <div className="wa-input-area">
            {/* Multiple image previews */}
            <ImagePreviewStrip
              files={files}
              previews={filePreviews}
              onRemove={handleRemoveFile}
              t={t}
            />

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
              <button
                className="wa-input-icon"
                onClick={() => setShowEmoji(!showEmoji)}
                aria-label={t("messagerie.emoji")}
              >
                {showEmoji ? "😁" : "😊"}
              </button>

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
                onKeyDown={handleKeyDown}
              />

              <button
                className="wa-send-btn"
                onClick={handleSend}
                disabled={!canSend}
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