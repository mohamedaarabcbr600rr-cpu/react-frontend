import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { getEcho } from "../../lib/echo";
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

const getInitials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

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

const emojis = ["😊","😂","❤️","👍","🙏","😍","🤔","😢","🎉","🔥","✅","💯","😎","🤗","😅","👏","💪","🥰","😏","🤣","😭","🤩","💀","😡","🤦","🙄","👀","💬","🎊","✨"];

const getFileKind = (fileType) => {
  if (!fileType) return "file";
  if (fileType.startsWith("image/")) return "image";
  if (fileType.startsWith("video/")) return "video";
  return "file";
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

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollingRef = useRef(null);
  const echoRef = useRef(null);
  const groupIdRef = useRef(group.id);
  const { t } = useTranslation();

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
        if (prev.some((m) => m.id === e.id)) return prev;
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

  const handleSend = useCallback(async () => {
    const text = content.trim();
    if ((!text && !file) || sending) return;

    setSending(true);
    const tempId = `tmp_${Date.now()}`;
    const fileToSend = file;
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
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setContent("");
    setFile(null);
    setFilePreview(null);
    setShowEmoji(false);

    try {
      const formData = new FormData();
      if (text) formData.append("content", text);
      if (fileToSend) formData.append("file", fileToSend);
      const res = await api.post(`/groups/${group.id}/messages`, formData);
      setMessages((prev) => prev.map((m) => (m.id === tempId ? res.data : m)));
      onMessageSent?.();
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, _failed: true } : m)));
    } finally {
      setSending(false);
    }
  }, [content, file, sending, group.id, authUserId, onMessageSent]);

  const grouped = messages.reduce((acc, msg) => {
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
          Object.entries(grouped).map(([date, msgs]) => (
            <div key={date}>
              <div className="groups-date-sep"><span>{date}</span></div>
              {msgs.map((msg, i) => {
                const isOwn = String(msg.user_id) === String(authUserId);
                const prevMsg = msgs[i - 1];
                const showAuthor = !isOwn && (!prevMsg || String(prevMsg.user_id) !== String(msg.user_id));
                return (
                  <div key={msg.id} className={`groups-msg-row ${isOwn ? "own" : "other"}`}>
                    {!isOwn && (
                      <div className="groups-msg-avatar">
                        {msg.user?.profile_pic ? (
                          <img src={msg.user.profile_pic} alt={msg.user.name} />
                        ) : (
                          <span>{getInitials(msg.user?.name)}</span>
                        )}
                      </div>
                    )}
                    <div className="groups-msg-content">
                      {showAuthor && <span className="groups-msg-author">{msg.user?.name}</span>}
                      <div className={`groups-msg-bubble ${isOwn ? "own" : "other"} ${msg._failed ? "failed" : ""}`}>
                        {msg.file_path && (() => {
                          const kind = getFileKind(msg.file_type);
                          const url = msg._local ? msg.file_path : `${import.meta.env.VITE_API_URL}/storage/${msg.file_path}`;
                          if (kind === "image") {
                            return <img src={url} alt="attachment" className="groups-msg-attachment-img" />;
                          }
                          if (kind === "video") {
                            return <video src={url} controls className="groups-msg-attachment-video" />;
                          }
                          return (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="groups-msg-attachment-file">
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
    </div>
  );
};

export default GroupChat;