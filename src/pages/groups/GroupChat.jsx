import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { getEcho } from "../../lib/echo";
import "../Messagerie.css";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: { Accept: "application/json" },
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const formatTime = (dateStr) =>
  new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const GroupChat = ({ group, authUserId }) => {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [echoReady, setEchoReady] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const pollingRef = useRef(null);
  const echoRef = useRef(null);
  const groupIdRef = useRef(group.id);
  const { t } = useTranslation();

  useEffect(() => {
    groupIdRef.current = group.id;
  }, [group.id]);

  // ── Load messages + slow polling fallback ───────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const activeGroupId = group.id;
    setLoading(true);

    const fetchMessages = () => {
      if (cancelled || groupIdRef.current !== activeGroupId) return;
      api.get(`/groups/${activeGroupId}/messages`)
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

  // ── Reverb: init Echo + subscribe to this group's channel ───────────────
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

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = content.trim();
    if (!text || sending) return;

    setSending(true);
    const tempId = `tmp_${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      group_id: group.id,
      user_id: authUserId,
      content: text,
      file_path: null,
      file_type: null,
      created_at: new Date().toISOString(),
      user: { id: authUserId },
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setContent("");

    try {
      const formData = new FormData();
      formData.append("content", text);
      const res = await api.post(`/groups/${group.id}/messages`, formData);
      setMessages((prev) => prev.map((m) => (m.id === tempId ? res.data : m)));
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, _failed: true } : m)));
    } finally {
      setSending(false);
    }
  }, [content, sending, group.id, authUserId]);

  return (
    <div className="groups-chat">
      <div className="groups-chat-messages">
        {loading ? (
          <div className="wa-loading-overlay" style={{ position: "static", background: "transparent" }}>
            <div className="wa-loading-spinner" />
          </div>
        ) : messages.length === 0 ? (
          <div className="wa-empty">
            <div className="wa-empty-icon">💬</div>
            <p className="wa-empty-title">{t("groups.noMessages", "No messages yet")}</p>
            <p className="wa-empty-sub">{t("groups.beFirst", "Be the first to say something!")}</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = String(msg.user_id) === String(authUserId);
            return (
              <div key={msg.id} className={`wa-msg-row ${isOwn ? "own" : "other"}`}>
                <div className={`wa-bubble ${isOwn ? "own" : "other"} ${msg._failed ? "wa-bubble--failed" : ""}`}>
                  {!isOwn && <div className="groups-chat-msg-author">{msg.user?.name}</div>}
                  {msg.content && <p className="wa-bubble-text">{msg.content}</p>}
                  <div className="wa-bubble-meta">
                    <span className="wa-time">{formatTime(msg.created_at)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="groups-chat-input-row">
        <input
          ref={inputRef}
          type="text"
          className="wa-text-input"
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
          className="wa-send-btn"
          onClick={handleSend}
          disabled={!content.trim() || sending}
          aria-label={t("groups.send", "Send")}
        >
          {sending ? (
            <div className="wa-loading-spinner wa-loading-spinner--small" />
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default GroupChat;