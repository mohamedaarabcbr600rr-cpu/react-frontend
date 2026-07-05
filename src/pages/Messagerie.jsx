import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import axios from "axios";
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import "./Messagerie.css";

/* ============================================================
   Axios instance — keeps your existing REST API 100% intact.
   ============================================================ */
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

// ─── Echo (Reverb) singleton — created once, shared everywhere ─────────────
let echoInstance = null;
const getEcho = (token) => {
  if (echoInstance) return echoInstance;
  if (typeof window === "undefined") return null;
  // If Reverb is not configured, fall back to polling-only mode gracefully.
  if (!import.meta.env.VITE_REVERB_APP_KEY) return null;

  window.Pusher = Pusher;
  echoInstance = new Echo({
    broadcaster: "reverb",
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? "https") === "https",
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${import.meta.env.VITE_API_URL}/broadcasting/auth`,
    auth: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });
  return echoInstance;
};

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

const MAX_FILES = 2;

// ─── Avatar (memoized) ──────────────────────────────────────────────────────
const Avatar = memo(({ name, size = 48, online = false, profilePic = null }) => {
  const [imgError, setImgError] = useState(false);
  const colors = useMemo(() => [
    ["#128C7E", "#075E54"],
    ["#25D366", "#128C7E"],
    ["#34B7F1", "#0095A0"],
    ["#FF6B6B", "#EE5A24"],
    ["#A29BFE", "#6C5CE7"],
    ["#FFB74D", "#FF9800"],
  ], []);
  const idx = name ? name.charCodeAt(0) % colors.length : 0;
  const [bg1, bg2] = colors[idx];

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
Avatar.displayName = "Avatar";

// ─── MessageBubble (memoized — re-renders only when msg object changes) ─────
const MessageBubble = memo(({ msg, authUserId, baseUrl, t }) => {
  const isOwn = String(msg.user_id) === String(authUserId);
  const fileUrl = msg.file_path ? `${baseUrl}/storage/${msg.file_path}` : null;
  const isImage = msg.file_type?.startsWith("image");
  const isTemp = String(msg.id).startsWith("tmp_");
  const isFailed = !!msg._failed;

  const onImageClick = () => {
    if (!isTemp) window.open(fileUrl, "_blank");
  };

  return (
    <div className={`wa-msg-row ${isOwn ? "own" : "other"}`}>
      <div
        className={`wa-bubble ${isOwn ? "own" : "other"} ${
          isFailed ? "wa-bubble--failed" : ""
        } ${isTemp && !isFailed ? "wa-bubble--sending" : ""}`}
      >
        {/* Image attachment */}
        {msg.file_path && isImage && (
          <img
            className="wa-bubble-img"
            src={fileUrl}
            alt={t("messagerie.attachment")}
            onClick={onImageClick}
            style={{ opacity: isTemp ? 0.65 : 1 }}
          />
        )}

        {/* Text content */}
        {msg.content && <p className="wa-bubble-text">{msg.content}</p>}

        {/* Meta (time + read receipts) */}
        <div className="wa-bubble-meta">
          <span className="wa-time">{formatTime(msg.created_at)}</span>
          {isOwn && !isFailed && (
            <span
              className={`wa-ticks ${msg.seen ? "seen" : ""} ${
                isTemp ? "wa-ticks--sending" : ""
              }`}
            >
              {isTemp ? "🕒" : (msg.seen ? "✓✓" : "✓")}
            </span>
          )}
          {isFailed && (
            <span className="wa-ticks wa-ticks--failed" title={t("")}>
              !
            </span>
          )}
        </div>
      </div>
    </div>
  );
}, (prev, next) => {
  // Custom equality: only re-render if the message object reference, user, or baseUrl changes
  return prev.msg === next.msg &&
         prev.authUserId === next.authUserId &&
         prev.baseUrl === next.baseUrl;
});
MessageBubble.displayName = "MessageBubble";

// ─── DateSeparator (memoized) ───────────────────────────────────────────────
const DateSeparator = memo(({ date }) => (
  <div className="wa-date-sep">
    <span>{date}</span>
  </div>
));
DateSeparator.displayName = "DateSeparator";

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
const EmptyState = ({ hasUser, userName, t }) => (
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
);

// ─── Main Component ───────────────────────────────────────────────────────────
const Messagerie = ({ authUserId, baseUrl = import.meta.env.VITE_API_URL }) => {
  const location = useLocation();
  const [connections, setConnections] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  // CHANGED: support up to 2 images instead of a single file
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadPerUser, setUnreadPerUser] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [showScrollFab, setShowScrollFab] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [echoReady, setEchoReady] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const pollingRef = useRef(null);
  const unreadIntervalRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const echoRef = useRef(null);
  const conversationIdRef = useRef(null);
  const selectedUserRef = useRef(null);
  const presenceChannelRef = useRef(null);
  const { t } = useTranslation();

  const emojis = useMemo(() =>
    ["😊","😂","❤️","👍","🙏","😍","🤔","😢","🎉","🔥","✅","💯","😎","🤗","😅","👏","💪","🥰","😏","🤣","😭","🤩","💀","😡","🤦","🙄","👀","💬","🎊","✨"],
    []
  );

  // Keep refs in sync so async callbacks always see the latest values.
  useEffect(() => { conversationIdRef.current = conversationId; }, [conversationId]);
  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);

  // Auto-dismiss error toast after 4s
  useEffect(() => {
    if (!errorMsg) return;
    const id = setTimeout(() => setErrorMsg(null), 4000);
    return () => clearTimeout(id);
  }, [errorMsg]);

  // ── Notifications ──────────────────────────────────────────────────────────
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ── Initialize Echo (once per authUserId) ──────────────────────────────────
  useEffect(() => {
    if (!authUserId) return;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const echo = getEcho(token);
    if (!echo) return; // Reverb not configured — silent fallback to polling
    echoRef.current = echo;
    setEchoReady(true);

    // Presence channel for online / offline status
    let presence = null;
    try {
      presence = echo.join('presence-online');
      presenceChannelRef.current = presence;
      presence
        .here((users) => {
          setOnlineUsers(new Set(users.map(u => u.id)));
        })
        .joining((user) => {
          setOnlineUsers(prev => {
            const next = new Set(prev);
            next.add(user.id);
            return next;
          });
        })
        .leaving((user) => {
          setOnlineUsers(prev => {
            const next = new Set(prev);
            next.delete(user.id);
            return next;
          });
        });
    } catch (err) {
      console.warn("Echo presence init failed", err);
    }

    return () => {
      try { if (presence) presence.leave(); } catch {}
    };
  }, [authUserId]);

  // ── Subscribe to the active conversation channel via Reverb ───────────────
  useEffect(() => {
    if (!echoReady || !echoRef.current || !conversationId) return;

    const channelName = `conversation.${conversationId}`;
    const channel = echoRef.current.private(channelName);

    channel.listen('.message.sent', (e) => {
      // Guard: only apply if still on the same conversation
      if (conversationIdRef.current !== e.conversation_id) return;

      setMessages(prev => {
        // De-duplicate (optimistic message will be replaced by the real one)
        if (prev.some(m => m.id === e.id)) return prev;
        // Replace matching optimistic message (same content + user + close timestamp)
        const idx = prev.findIndex(m =>
          String(m.id).startsWith("tmp_") &&
          m.user_id === e.user_id &&
          m.content === e.content &&
          m.file_path === e.file_path
        );
        if (idx !== -1) {
          const next = prev.slice();
          next[idx] = e;
          return next;
        }
        return [...prev, e];
      });

      // Auto mark as seen
      api.post(`/messages/${conversationId}/seen`, { user_id: authUserId }).catch(() => {});

      // Update unread badge in real time
      if (String(e.user_id) !== String(authUserId)) {
        setUnreadPerUser(prev => ({
          ...prev,
          [e.user_id]: selectedUserRef.current?.id === e.user_id
            ? 0
            : (prev[e.user_id] || 0) + 1
        }));
      }

      // Desktop notification (if tab is hidden)
      if (e.user_id !== authUserId && !document.hasFocus() && Notification.permission === "granted") {
        new Notification(e.user?.name || t("messagerie.notifications.newMessage"), {
          body: e.content || t("messagerie.notifications.sentMessage"),
          icon: "/favicon.ico",
        });
      }
    });

    channel.listen('.typing', (e) => {
      if (conversationIdRef.current !== e.conversation_id) return;
      if (String(e.user_id) !== String(authUserId)) {
        setOtherUserTyping(!!e.is_typing);
      }
    });

    channel.listen('.read', (e) => {
      if (conversationIdRef.current !== e.conversation_id) return;
      setMessages(prev => prev.map(m =>
        String(m.user_id) === String(authUserId) ? { ...m, seen: true } : m
      ));
    });

    return () => {
      try {
        channel.stopListening('.message.sent');
        channel.stopListening('.typing');
        channel.stopListening('.read');
      } catch {}
      try { echoRef.current.leave(channelName); } catch {}
    };
  }, [echoReady, conversationId, authUserId, t]);

  // ── Load messages (initial + slow polling fallback) ────────────────────────
  useEffect(() => {
    if (!conversationId) return;

    setMessagesLoading(true);
    let cancelled = false;
    const activeId = conversationId;

    const fetchMessages = () => {
      if (cancelled || conversationIdRef.current !== activeId) return;
      api.get(`/messages/${activeId}`)
        .then(res => {
          if (cancelled || conversationIdRef.current !== activeId) return;
          setMessages(res.data);
          api.post(`/messages/${activeId}/seen`, { user_id: authUserId }).catch(() => {});
        })
        .catch(err => {
          if (cancelled) return;
          console.error("loadMessages", err);
        })
        .finally(() => {
          if (!cancelled && conversationIdRef.current === activeId) {
            setMessagesLoading(false);
          }
        });
    };

    fetchMessages();
    // 12s polling = safety net if Reverb drops (saves ~5x requests vs 3s polling)
    pollingRef.current = setInterval(fetchMessages, 12000);

    return () => {
      cancelled = true;
      clearInterval(pollingRef.current);
    };
  }, [conversationId, authUserId]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    isAtBottomRef.current = distanceFromBottom < 100;
    setShowScrollFab(distanceFromBottom > 200);
  }, []);

  useEffect(() => {
    if (isAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, otherUserTyping]);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    isAtBottomRef.current = true;
    setShowScrollFab(false);
  }, []);

  // ── Load mutual connections ────────────────────────────────────────────────
  useEffect(() => {
    if (!authUserId) return;
    let cancelled = false;
    const fetchMutualConnections = async () => {
      try {
        setLoading(true);
        const [followingRes, followersRes] = await Promise.all([
          api.get(`/users/${authUserId}/following`),
          api.get(`/users/${authUserId}/followers`),
        ]);
        if (cancelled) return;
        const mutualConnections = followingRes.data.filter(f =>
          followersRes.data.some(fol => fol.id === f.id)
        );
        setConnections(mutualConnections);
      } catch (err) {
        if (cancelled) return;
        console.error(t("messagerie.errors.fetchConnections"), err);
        setConnections([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchMutualConnections();
    return () => { cancelled = true; };
  }, [authUserId, t]);
// ── Auto-open conversation when navigated from a profile "Message" button ──
  useEffect(() => {
    const targetUserId = location.state?.targetUserId;
    if (!targetUserId || connections.length === 0) return;

    const targetUser = connections.find(u => String(u.id) === String(targetUserId));
    if (targetUser) {
      startConversation(targetUser);
    }
  }, [location.state, connections]);
  // ── Reset unread for opened conversation ───────────────────────────────────
  useEffect(() => {
    if (!conversationId || !selectedUser) return;
    setUnreadPerUser(prev => ({ ...prev, [selectedUser.id]: 0 }));
  }, [conversationId, selectedUser]);

  // ── Start conversation ─────────────────────────────────────────────────────
  const startConversation = useCallback(async (user) => {
    if (selectedUser?.id === user.id) {
      setSidebarOpen(false);
      return;
    }
    setLoading(true);
    setMessagesLoading(true);
    setOtherUserTyping(false);
    try {
      const res = await api.post("/messages/conversations", {
        user_id: user.id,
        auth_user_id: authUserId,
      });
      setConversationId(res.data.id);
      setSelectedUser(user);
      // Don't clear messages to [] — the new fetch will replace them when ready.
      // This prevents the "flash of empty state" / "conversation disappeared" bug.
      setMessages([]);
      setSidebarOpen(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      console.error(t("messagerie.errors.startConversation"), err);
      setErrorMsg(t("messagerie.errors.startConversation"));
    } finally {
      setLoading(false);
      setMessagesLoading(false);
    }
  }, [authUserId, selectedUser, t]);

  // ── Send message (optimistic + retry-aware) ────────────────────────────────
  const handleSend = useCallback(async () => {
    if ((!content.trim() && files.length === 0) || sending) return;
    if (!conversationId) return;

    setSending(true);
    setErrorMsg(null);

    const textToSend = content.trim();
    const filesToSend = [...files];
    const baseTs = Date.now();
    const tempIds = filesToSend.length > 0
      ? filesToSend.map((_, i) => `tmp_${baseTs}_${i}`)
      : [`tmp_${baseTs}_0`];

    // Optimistic messages appear instantly
    const optimisticMessages = filesToSend.length > 0
      ? filesToSend.map((f, i) => ({
          id: tempIds[i],
          user_id: authUserId,
          content: i === 0 ? textToSend : null,
          file_path: URL.createObjectURL(f), // local preview
          file_type: f.type,
          seen: false,
          created_at: new Date(baseTs + i).toISOString(),
          _local: true, // marker so we don't open file on click
        }))
      : [{
          id: tempIds[0],
          user_id: authUserId,
          content: textToSend,
          file_path: null,
          file_type: null,
          seen: false,
          created_at: new Date(baseTs).toISOString(),
        }];

    setMessages(prev => [...prev, ...optimisticMessages]);
    isAtBottomRef.current = true;
    setContent("");
    setFiles([]);
    setFilePreviews([]);
    setShowEmoji(false);
    clearTimeout(typingTimeoutRef.current);
    api.post(`/messages/${conversationId}/typing`, { user_id: authUserId, is_typing: false }).catch(() => {});

    try {
      if (filesToSend.length > 0) {
        // Current API takes 1 file per request — send sequentially.
        // Text content rides with the first image.
        for (let i = 0; i < filesToSend.length; i++) {
          const formData = new FormData();
          formData.append("user_id", authUserId);
          if (i === 0 && textToSend) {
            formData.append("content", textToSend);
          }
          formData.append("file", filesToSend[i]);
          const res = await api.post(`/messages/${conversationId}`, formData);
          const serverMsg = res.data;
          setMessages(prev => prev.map(m =>
            m.id === tempIds[i]
              ? { ...serverMsg, content: serverMsg.content || (i === 0 ? textToSend : null) }
              : m
          ));
        }
      } else {
        const formData = new FormData();
        formData.append("user_id", authUserId);
        formData.append("content", textToSend);
        const res = await api.post(`/messages/${conversationId}`, formData);
        setMessages(prev => prev.map(m =>
          m.id === tempIds[0] ? res.data : m
        ));
      }
    } catch (err) {
      console.error(t(""), err);
      // Mark optimistic messages as failed instead of removing — user can retry
      setMessages(prev => prev.map(m =>
        tempIds.includes(m.id) ? { ...m, _failed: true, _local: false } : m
      ));
      setErrorMsg(t(""));
    } finally {
      setSending(false);
    }
  }, [content, files, sending, conversationId, authUserId, t]);

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

  // ── File select (multi, capped at 2) ───────────────────────────────────────
  const handleFileSelect = useCallback((e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    if (selected.length > MAX_FILES) {
      setErrorMsg(t("messagerie.errors.maxFiles", { max: MAX_FILES }));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setFiles(selected);
    setErrorMsg(null);

    Promise.all(selected.map(f => {
      if (f.type.startsWith("image")) {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.readAsDataURL(f);
        });
      }
      return Promise.resolve(null);
    })).then(setFilePreviews);

    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [t]);

  const removeFile = useCallback((index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  }, []);

  // ── Group messages by date (memoized) ──────────────────────────────────────
  const groupedMessages = useMemo(() => {
    return messages.reduce((acc, msg) => {
      const date = formatDate(msg.created_at, t);
      if (!acc[date]) acc[date] = [];
      acc[date].push(msg);
      return acc;
    }, {});
  }, [messages, t]);

  // ── Filter connections (memoized) ─────────────────────────────────────────
  const filtered = useMemo(
    () => connections.filter(u =>
      u.id !== authUserId &&
      u.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [connections, searchTerm, authUserId]
  );

  // ── Get last message preview (memoized) ────────────────────────────────────
  const getPreview = useCallback((userId) => {
    if (selectedUser?.id === userId && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (String(last.user_id) === String(authUserId)) return `${t("messagerie.you")}: ${last.content || "📎"}`;
      return last.content || t("messagerie.attachment");
    }
    return null;
  }, [selectedUser, messages, authUserId, t]);

  // ── Unread polling (lightweight) ───────────────────────────────────────────
  useEffect(() => {
    if (!authUserId) return;
    const fetchUnread = async () => {
      try {
        const res = await api.get('/messages/conversations');
        const unread = {};
        res.data.forEach(conv => {
          unread[conv.other_user_id] = conv.unread_count;
        });
        setUnreadPerUser(prev => {
          // Avoid re-render if nothing changed
          const changed = Object.keys(unread).some(k => unread[k] !== prev[k]);
          return changed ? unread : prev;
        });
      } catch {}
    };
    fetchUnread();
    unreadIntervalRef.current = setInterval(fetchUnread, 8000);
    return () => clearInterval(unreadIntervalRef.current);
  }, [authUserId]);

  return (
    <div className="wa-root">
      {/* ── Sidebar ── */}
      <aside className={`wa-sidebar ${sidebarOpen || !selectedUser ? "wa-sidebar--open" : ""}`}>
        {/* Header */}
        <div className="wa-sidebar-header">
          <Avatar name="Me" size={38} />
          <h1 className="wa-sidebar-title">{t("messagerie.title")}</h1>
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
              placeholder={t("messagerie.searchPlaceholder")}
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
              <span>{t("messagerie.noContacts")}</span>
              <small>{t("messagerie.noContactsHint")}</small>
            </div>
          )}
          {filtered.map(user => {
            const online = onlineUsers.has(user.id) || isOnline(user.last_seen);
            const preview = getPreview(user.id);
            const isActive = selectedUser?.id === user.id;
            const lastMsg = isActive && messages.length > 0
              ? messages[messages.length - 1]
              : null;
            const unread = unreadPerUser[user.id] || 0;
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
                    {preview && (
                      <span className="wa-contact-time">
                        {lastMsg ? formatTime(lastMsg.created_at) : ""}
                      </span>
                    )}
                  </div>
                  <div className="wa-contact-bottom">
                    <span className={`wa-contact-preview ${unread > 0 ? "wa-contact-preview--unread" : ""}`}>
                      {preview || (online ? t("messagerie.status.online") : t("messagerie.status.tapToChat"))}
                    </span>
                    {unread > 0 && (
                      <span className="wa-unread-badge">{unread}</span>
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
        {/* Error toast (non-blocking) */}
        {errorMsg && (
          <div className="wa-error-toast" role="alert">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} aria-label="Dismiss">×</button>
          </div>
        )}

        {/* Chat Header (fixed, flex-shrink: 0) */}
        {selectedUser ? (
          <div className="wa-chat-header">
            <button
              className="wa-back-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label={t("messagerie.backToContacts")}
            >
              ‹
            </button>
            <Avatar
              name={selectedUser.name}
              size={42}
              online={onlineUsers.has(selectedUser.id) || isOnline(selectedUser.last_seen)}
              profilePic={selectedUser.profile_pic}
            />
            <div className="wa-chat-header-info">
              <span className="wa-chat-name">{selectedUser.name}</span>
              <span className="wa-chat-status">
                {otherUserTyping
                  ? t("messagerie.status.typing")
                  : (onlineUsers.has(selectedUser.id) || isOnline(selectedUser.last_seen))
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
            >
              ‹
            </button>
            <span className="wa-chat-name">{t("messagerie.selectChat")}</span>
          </div>
        )}

        {/* Messages */}
        <div
          className="wa-messages"
          ref={messagesContainerRef}
          onScroll={handleScroll}
        >
          {!selectedUser ? (
            <EmptyState hasUser={false} t={t} />
          ) : messagesLoading && messages.length === 0 ? (
            <div className="wa-loading-overlay">
              <div className="wa-loading-spinner" />
            </div>
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

        {/* Scroll-to-bottom FAB */}
        {selectedUser && (
          <button
            className={`wa-scroll-fab ${showScrollFab ? "" : "wa-scroll-fab--hidden"}`}
            onClick={() => scrollToBottom()}
            aria-label={t("messagerie.scrollToBottom")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
        )}

        {/* Input Area */}
        {selectedUser && (
          <div className="wa-input-area">
            {/* File previews — supports up to 2 images */}
            {files.length > 0 && (
              <div className="wa-files-preview">
                {files.map((f, i) => (
                  <div key={i} className="wa-file-thumb">
                    {filePreviews[i] ? (
                      <img src={filePreviews[i]} alt={f.name} className="wa-file-thumb-img" />
                    ) : (
                      <div
                        className="wa-file-thumb-img"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e0e0e0', fontSize: 22 }}
                      >
                        📎
                      </div>
                    )}
                    <button
                      className="wa-file-thumb-remove"
                      onClick={() => removeFile(i)}
                      aria-label={t("messagerie.removeFile")}
                    >
                      ✕
                    </button>
                  </div>
                ))}
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
                aria-label={t("messagerie.emoji")}
              >
                {showEmoji ? "😁" : "😊"}
              </button>

              {/* File attachment — multiple, up to 2 */}
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

              {/* Text input */}
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
                disabled={sending}
              />

              {/* Send button */}
              <button
                className="wa-send-btn"
                onClick={handleSend}
                disabled={(!content.trim() && files.length === 0) || sending}
                aria-label={t("messagerie.")}
              >
                {sending ? (
                  <div className="wa-loading-spinner wa-loading-spinner--small" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Messagerie;
