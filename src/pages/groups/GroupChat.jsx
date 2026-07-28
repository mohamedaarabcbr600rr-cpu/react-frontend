import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getEcho } from "../../lib/echo";
import ImageLightbox from "../../components/ImageLightbox";
import "./GroupsPanel.css";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: { Accept: "application/json" },
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const emojis = ["😊","😂","❤️","👍","🙏","😍","🤔","😢","🎉","🔥","✅","💯","😎","🤗","😅","👏","💪","🥰","😏","🤣","😭","🤩","💀","😡","🤦","🙄","👀","💬","🎊","✨"];

const getFileKind = (fileType) => {
  if (!fileType) return "file";
  if (fileType.startsWith("image/")) return "image";
  if (fileType.startsWith("video/")) return "video";
  return "file";
};

const getInitials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const base = import.meta.env.VITE_API_URL;
  return path.startsWith("/storage") ? `${base}${path}` : `${base}/storage/${path}`;
};

const formatTime = (dateStr) =>
  new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatDateSep = (dateStr) => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
};

const GroupChat = ({ group, authUserId, onMessageSent }) => {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [echoReady, setEchoReady] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  // ── Reply & Delete state (mirrors Messagerie.jsx) ────────────────────────
  const [replyingToMsg, setReplyingToMsg] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [hiddenForMe, setHiddenForMe] = useState(() => {
    try {
      const raw = localStorage.getItem(`hiddenGroupMessages_${authUserId}_${group.id}`);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  });
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const longPressTimerRef = useRef(null);
  const lastTouchEndRef = useRef(0);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollingRef = useRef(null);
  const echoRef = useRef(null);
  const groupIdRef = useRef(group.id);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const goToProfile = (userId) => {
    if (userId) navigate(`/profile/${userId}`);
  };

  useEffect(() => {
    groupIdRef.current = group.id;
  }, [group.id]);

  useEffect(() => {
    let cancelled = false;
    const activeGroupId = group.id;
    setLoading(true);

    const fetchMessages = () => {
      if (cancelled || groupIdRef.current !== activeGroupId) return;
      api
        .get(`/groups/${activeGroupId}/messages`)
        .then((res) => {
          if (cancelled || groupIdRef.current !== activeGroupId) return;
          setMessages(res.data || []);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    fetchMessages();
    pollingRef.current = setInterval(fetchMessages, 12000);

    return () => {
      cancelled = true;
      clearInterval(pollingRef.current);
    };
  }, [group.id]);

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const echo = getEcho(token);
    if (!echo) return;
    echoRef.current = echo;
    setEchoReady(true);
  }, []);

  useEffect(() => {
    if (!echoReady || !echoRef.current) return;

    const channelName = `group.${group.id}`;
    const channel = echoRef.current.private(channelName);

    channel.listen(".group-message.sent", (e) => {
      if (groupIdRef.current !== e.group_id) return;
      setMessages((prev) => {
        // Replace if this is an update (edit/delete) to an existing message
        const existingIdx = prev.findIndex((m) => m.id === e.id);
        if (existingIdx !== -1) {
          const next = prev.slice();
          next[existingIdx] = e;
          return next;
        }
        const idx = prev.findIndex(
          (m) => String(m.id).startsWith("tmp_") && m.user_id === e.user_id && m.content === e.content
        );
        if (idx !== -1) {
          const next = prev.slice();
          next[idx] = e;
          return next;
        }
        return [...prev, e];
      });
    });

    return () => {
      try {
        channel.stopListening(".group-message.sent");
        echoRef.current.leave(channelName);
      } catch {}
    };
  }, [echoReady, group.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Build the flat list of all images in this group conversation (for the lightbox) ──
  const groupImages = useMemo(() => {
    return messages
      .filter((m) => m.file_path && m.file_type?.startsWith("image") && !String(m.id).startsWith("tmp_"))
      .map((m) => ({ id: m.id, url: getImageUrl(`/storage/${m.file_path}`) }));
  }, [messages]);

  const handleImageClick = useCallback((msgId) => {
    const idx = groupImages.findIndex((img) => img.id === msgId);
    if (idx !== -1) setLightboxIndex(idx);
  }, [groupImages]);

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    if (selected.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target.result);
      reader.readAsDataURL(selected);
    } else {
      setFilePreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
  };

  // ── Delete for me (local only) ──────────────────────────────────────────
  const hideForMe = useCallback((msgId) => {
    setHiddenForMe((prev) => {
      const next = new Set(prev);
      next.add(msgId);
      try {
        localStorage.setItem(`hiddenGroupMessages_${authUserId}_${group.id}`, JSON.stringify([...next]));
      } catch {}
      return next;
    });
    setContextMenu(null);
    setDeleteConfirm(null);
  }, [authUserId, group.id]);

  // ── Delete for everyone (backend) ───────────────────────────────────────
  const deleteForEveryone = useCallback(async (msgId) => {
    try {
      const res = await api.delete(`/group-messages/${msgId}`);
      setMessages((prev) => prev.map((m) => (m.id === msgId ? res.data : m)));
    } catch (err) {
      console.error("deleteForEveryone", err);
    } finally {
      setContextMenu(null);
      setDeleteConfirm(null);
    }
  }, []);

  const scrollToMessage = useCallback((msgId) => {
    const el = document.getElementById(`gmsg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMsgId(msgId);
      setTimeout(() => setHighlightedMsgId(null), 1500);
    }
  }, []);

  const openContextMenu = useCallback((msgId, x, y) => {
    const menuWidth = 180;
    const menuHeight = 100;
    const clampedX = Math.max(12, Math.min(x, window.innerWidth - menuWidth - 12));
    const clampedY = Math.max(12, Math.min(y, window.innerHeight - menuHeight - 12));
    setContextMenu({ msgId, x: clampedX, y: clampedY });
  }, []);

  const handleContextMenu = useCallback((e, msgId) => {
    e.preventDefault();
    openContextMenu(msgId, e.clientX, e.clientY);
  }, [openContextMenu]);

  const handleBubbleClick = useCallback((e, msgId) => {
    if (Date.now() - lastTouchEndRef.current < 500) return;
    openContextMenu(msgId, e.clientX, e.clientY);
  }, [openContextMenu]);

  const handleTouchStart = useCallback((e, msgId) => {
    const touch = e.touches[0];
    longPressTimerRef.current = setTimeout(() => {
      openContextMenu(msgId, touch.clientX, touch.clientY);
    }, 500);
  }, [openContextMenu]);

  const cancelLongPress = useCallback(() => {
    clearTimeout(longPressTimerRef.current);
  }, []);

  const handleTouchEnd = useCallback(() => {
    clearTimeout(longPressTimerRef.current);
    lastTouchEndRef.current = Date.now();
  }, []);

  const startReply = useCallback((msg) => {
    setReplyingToMsg(msg);
    setContextMenu(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [contextMenu]);

  const handleSend = useCallback(async () => {
    const text = content.trim();
    if ((!text && !file) || sending) return;

    setSending(true);
    const tempId = `tmp_${Date.now()}`;
    const fileToSend = file;
    const replyToId = replyingToMsg?.id || null;
    const optimisticMsg = {
      id: tempId,
      group_id: group.id,
      user_id: authUserId,
      content: text || null,
      file_path: fileToSend ? URL.createObjectURL(fileToSend) : null,
      file_type: fileToSend?.type || null,
      _local: true,
      created_at: new Date().toISOString(),
      user: { id: authUserId },
      reply_to: replyingToMsg ? {
        id: replyingToMsg.id,
        content: replyingToMsg.content,
        user: { name: replyingToMsg.user?.name },
      } : null,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setContent("");
    setFile(null);
    setFilePreview(null);
    setShowEmoji(false);
    setReplyingToMsg(null);

    try {
      const formData = new FormData();
      if (text) formData.append("content", text);
      if (fileToSend) formData.append("file", fileToSend);
      if (replyToId) formData.append("reply_to_id", replyToId);
      const res = await api.post(`/groups/${group.id}/messages`, formData);
      setMessages((prev) => prev.map((m) => (m.id === tempId ? res.data : m)));
      onMessageSent?.();
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, _failed: true } : m)));
    } finally {
      setSending(false);
    }
  }, [content, file, sending, replyingToMsg, group.id, authUserId, onMessageSent]);

  const visibleGrouped = messages
    .filter((msg) => !hiddenForMe.has(msg.id))
    .reduce((acc, msg) => {
      const date = formatDateSep(msg.created_at);
      if (!acc[date]) acc[date] = [];
      acc[date].push(msg);
      return acc;
    }, {});

  return (
    <div className="groups-chat">
      <div className="groups-chat-messages">
        {loading ? (
          <div className="groups-chat-loading">
            <div className="groups-spinner" />
          </div>
        ) : messages.length === 0 ? (
          <div className="groups-chat-empty">
            <div className="groups-chat-empty-icon">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3>{t("groups.welcomeToGroup", "Welcome to the group! 🎉")}</h3>
            <p>{t("groups.startDiscussion", "Introduce yourself and start the first discussion.")}</p>
          </div>
        ) : (
          Object.entries(visibleGrouped).map(([date, msgs]) => (
            <div key={date}>
              <div className="groups-date-sep"><span>{date}</span></div>
              {msgs.map((msg, i) => {
                const isOwn = String(msg.user_id) === String(authUserId);
                const prevMsg = msgs[i - 1];
                const showAuthor = !isOwn && (!prevMsg || String(prevMsg.user_id) !== String(msg.user_id));
                const isTemp = String(msg.id).startsWith("tmp_");
                const isDeleted = !!msg.deleted_for_everyone_at;
                const isHighlighted = highlightedMsgId === msg.id;

                if (isDeleted) {
                  return (
                    <div key={msg.id} id={`gmsg-${msg.id}`} className={`groups-msg-row ${isOwn ? "own" : "other"}`}>
                      {!isOwn && <div className="groups-msg-avatar-spacer" />}
                      <div className="groups-msg-content">
                        <div className={`groups-msg-bubble ${isOwn ? "own" : "other"} groups-msg-bubble--deleted`}>
                          <p className="groups-msg-deleted-text">{t("groups.messageDeleted", "This message was deleted.")}</p>
                          <span className="groups-msg-time">{formatTime(msg.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} id={`gmsg-${msg.id}`} className={`groups-msg-row ${isOwn ? "own" : "other"}`}>
                    {!isOwn && (
                      <div className="groups-msg-avatar" onClick={() => goToProfile(msg.user_id)} style={{ cursor: "pointer" }}>
                        {msg.user?.profile_pic ? (
                          <img src={getImageUrl(msg.user.profile_pic)} alt={msg.user.name} />
                        ) : (
                          <span>{getInitials(msg.user?.name)}</span>
                        )}
                      </div>
                    )}
                    <div className="groups-msg-content">
                      {showAuthor && (
                        <span className="groups-msg-author" onClick={() => goToProfile(msg.user_id)} style={{ cursor: "pointer" }}>
                          {msg.user?.name}
                        </span>
                      )}
                      <div
                        className={`groups-msg-bubble ${isOwn ? "own" : "other"} ${msg._failed ? "failed" : ""} ${isHighlighted ? "groups-msg-bubble--highlighted" : ""}`}
                        onClick={!isTemp ? (e) => handleBubbleClick(e, msg.id) : undefined}
                        onContextMenu={!isTemp ? (e) => handleContextMenu(e, msg.id) : undefined}
                        onTouchStart={!isTemp ? (e) => handleTouchStart(e, msg.id) : undefined}
                        onTouchEnd={!isTemp ? handleTouchEnd : undefined}
                        onTouchMove={!isTemp ? cancelLongPress : undefined}
                      >
                        {msg.reply_to && (
                          <div
                            className="groups-reply-quote"
                            onClick={(e) => { e.stopPropagation(); scrollToMessage(msg.reply_to.id); }}
                          >
                            <span className="groups-reply-quote-author">{msg.reply_to.user?.name}</span>
                            <span className="groups-reply-quote-text">
                              {msg.reply_to.deleted_for_everyone_at
                                ? t("groups.messageDeleted", "This message was deleted.")
                                : (msg.reply_to.content || t("groups.attachment", "Attachment"))}
                            </span>
                          </div>
                        )}

                       {msg.file_path && (() => {
                          const kind = getFileKind(msg.file_type);
                          const url = msg._local ? msg.file_path : getImageUrl(`/storage/${msg.file_path}`);
                          if (kind === "image") {
                            return (
                              <img
                                src={url}
                                alt="attachment"
                                className="groups-msg-attachment-img"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isTemp) handleImageClick(msg.id);
                                }}
                                style={{ cursor: isTemp ? "default" : "pointer" }}
                              />
                            );
                          }
                          if (kind === "video") {
                            return <video src={url} controls className="groups-msg-attachment-video" />;
                          }
                          return (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="groups-msg-attachment-file" onClick={(e) => e.stopPropagation()}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <path d="M14 2v6h6" />
                              </svg>
                              {t("groups.attachment", "Attachment")}
                            </a>
                          );
                        })()}
                        {msg.content && <p>{msg.content}</p>}
                        <span className="groups-msg-time">{formatTime(msg.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {replyingToMsg && (
        <div className="groups-reply-preview">
          <div className="groups-reply-preview-content">
            <span className="groups-reply-preview-author">{replyingToMsg.user?.name || t("groups.you", "You")}</span>
            <span className="groups-reply-preview-text">
              {replyingToMsg.content || (replyingToMsg.file_path ? t("groups.attachment", "Attachment") : "")}
            </span>
          </div>
          <button
            className="groups-reply-preview-close"
            onClick={() => setReplyingToMsg(null)}
            aria-label={t("groups.cancelReply", "Cancel reply")}
          >
            ✕
          </button>
        </div>
      )}

      {file && (
        <div className="groups-chat-file-preview">
          {filePreview ? (
            <img src={filePreview} alt={file.name} />
          ) : (
            <div className="groups-chat-file-preview-generic">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
              <span>{file.name}</span>
            </div>
          )}
          <button onClick={removeFile} aria-label="Remove">✕</button>
        </div>
      )}

      {showEmoji && (
        <div className="groups-chat-emoji-tray">
          {emojis.map((e) => (
            <button key={e} onClick={() => setContent((prev) => prev + e)}>
              {e}
            </button>
          ))}
        </div>
      )}

      <div className="groups-chat-input-row">
        <button
          className="groups-chat-icon-btn"
          onClick={() => setShowEmoji((v) => !v)}
          aria-label={t("groups.emoji", "Emoji")}
        >
          {showEmoji ? "😁" : "😊"}
        </button>
        <label className="groups-chat-icon-btn" title={t("groups.attach", "Attach")}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
        </label>
        <input
          ref={inputRef}
          type="text"
          className="groups-chat-input"
          placeholder={t("groups.typeMessage", "Type a message...")}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={sending}
        />
        <button
          className="groups-chat-send-btn"
          onClick={handleSend}
          disabled={(!content.trim() && !file) || sending}
          aria-label={t("groups.send", "Send")}
        >
          {sending ? (
            <div className="groups-spinner groups-spinner--small" />
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </div>

      {/* Context menu (right-click / left-click desktop, long-press mobile) */}
      {contextMenu && (() => {
        const targetMsg = messages.find((m) => m.id === contextMenu.msgId);
        if (!targetMsg || targetMsg.deleted_for_everyone_at) return null;
        return (
          <div className="groups-context-menu" style={{ top: contextMenu.y, left: contextMenu.x }} onClick={(e) => e.stopPropagation()}>
            <button className="groups-context-menu-item" onClick={() => startReply(targetMsg)}>
              {t("groups.reply", "Reply")}
            </button>
            <button className="groups-context-menu-item groups-context-menu-item--danger" onClick={() => setDeleteConfirm(contextMenu.msgId)}>
              {t("groups.delete", "Delete")}
            </button>
          </div>
        );
      })()}

      {/* Delete confirmation modal */}
      {deleteConfirm && (() => {
        const targetMsg = messages.find((m) => m.id === deleteConfirm);
        if (!targetMsg) return null;
        const isOwnMsg = String(targetMsg.user_id) === String(authUserId);
        return (
          <div className="groups-delete-modal-overlay" onClick={() => setDeleteConfirm(null)}>
            <div className="groups-delete-modal" onClick={(e) => e.stopPropagation()}>
              <p className="groups-delete-modal-title">{t("groups.deleteMessageTitle", "Delete this message?")}</p>
              <button className="groups-delete-modal-btn" onClick={() => hideForMe(deleteConfirm)}>
                {t("groups.deleteForMe", "Delete for me")}
              </button>
              {isOwnMsg && (
                <button className="groups-delete-modal-btn groups-delete-modal-btn--danger" onClick={() => deleteForEveryone(deleteConfirm)}>
                  {t("groups.deleteForEveryone", "Delete for everyone")}
                </button>
              )}
              <button className="groups-delete-modal-btn groups-delete-modal-btn--cancel" onClick={() => setDeleteConfirm(null)}>
                {t("groups.cancel", "Cancel")}
              </button>
            </div>
          </div>
        );
      })()}

      {lightboxIndex !== null && groupImages.length > 0 && (
        <ImageLightbox
          images={groupImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
};

export default GroupChat;