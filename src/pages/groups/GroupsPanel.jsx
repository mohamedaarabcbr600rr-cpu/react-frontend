import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import GroupChat from "./GroupChat";
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

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const base = import.meta.env.VITE_API_URL;
  return path.startsWith("/storage") ? `${base}${path}` : `${base}/storage/${path}`;
};

const formatListTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (isYesterday) return "Yesterday";
  const diffDays = (now - d) / (1000 * 60 * 60 * 24);
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
};

const GroupsPanel = ({ authUserId }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // all | mine | discover
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupCover, setNewGroupCover] = useState(null);
  const [newGroupCoverPreview, setNewGroupCoverPreview] = useState(null);
  const [creating, setCreating] = useState(false);
  const [joiningId, setJoiningId] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleShareGroup = (group) => {
    const link = `${window.location.origin}/messagerie?groupInvite=${group.invite_token}`;
    navigator.clipboard.writeText(link).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const fetchGroups = () => {
    setLoading(true);
    api
      .get("/groups")
      .then((res) => setGroups(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // ── Auto-join if the user arrived via a group invite link (?groupInvite=TOKEN) ──
  useEffect(() => {
    const token = localStorage.getItem('pending_group_invite');
    if (!token) return;
    localStorage.removeItem('pending_group_invite');
    api.post(`/groups/join-by-token/${token}`)
      .then((res) => {
        fetchGroups();
        setSelectedGroupId(res.data.id);
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    let list = groups;
    if (filter === "mine") list = list.filter((g) => g.is_member);
    if (filter === "discover") list = list.filter((g) => !g.is_member);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter((g) => g.name.toLowerCase().includes(term));
    }
    return list;
  }, [groups, filter, searchTerm]);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  // Fetch member avatars for the header stack whenever a member group is opened
  useEffect(() => {
    setHeaderMenuOpen(false);
    if (!selectedGroup?.is_member) {
      setGroupMembers([]);
      return;
    }
    api
      .get(`/groups/${selectedGroup.id}/members`)
      .then((res) => setGroupMembers(res.data || []))
      .catch(() => setGroupMembers([]));
  }, [selectedGroupId, selectedGroup?.is_member]);

  // ── Immersive mode: hide global navbar on mobile when a group is open ──────
  useEffect(() => {
    const isGroupOpen = !!selectedGroupId;
    document.body.classList.toggle('groups-chat-fullscreen', isGroupOpen);
    return () => document.body.classList.remove('groups-chat-fullscreen');
  }, [selectedGroupId]);

  const handleJoin = async (id, e) => {
    e?.stopPropagation();
    setJoiningId(id);
    try {
      await api.post(`/groups/${id}/join`);
      setGroups((prev) =>
        prev.map((g) => (g.id === id ? { ...g, is_member: true, members_count: g.members_count + 1 } : g))
      );
    } catch {
    } finally {
      setJoiningId(null);
    }
  };

const handleLeave = async (id) => {
    setHeaderMenuOpen(false);
    try {
      await api.post(`/groups/${id}/leave`);
      setGroups((prev) =>
        prev.map((g) =>
          g.id === id ? { ...g, is_member: false, members_count: Math.max(0, g.members_count - 1) } : g
        )
      );
    } catch {}
  };

  const handleDeleteGroup = async (id) => {
    setHeaderMenuOpen(false);
    if (!window.confirm(t("groups.confirmDelete", "Delete this group permanently? This cannot be undone."))) return;
    try {
      await api.delete(`/groups/${id}`);
      setGroups((prev) => prev.filter((g) => g.id !== id));
      setSelectedGroupId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCoverSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewGroupCover(file);
    const reader = new FileReader();
    reader.onload = (ev) => setNewGroupCoverPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setCreating(true);
    try {
      const formData = new FormData();
      formData.append("name", newGroupName.trim());
      if (newGroupDescription.trim()) formData.append("description", newGroupDescription.trim());
      if (newGroupCover) formData.append("cover_image", newGroupCover);

      const res = await api.post("/groups", formData);
      setShowCreateModal(false);
      setNewGroupName("");
      setNewGroupDescription("");
      setNewGroupCover(null);
      setNewGroupCoverPreview(null);
      fetchGroups();
      setSelectedGroupId(res.data.id);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="groups-root">
      <aside className={`groups-sidebar ${!selectedGroupId ? "groups-sidebar--open" : ""}`}>
        <div className="groups-sidebar-header">
          <div className="groups-search-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder={t("groups.searchPlaceholder", "Search groups...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="groups-create-btn" onClick={() => setShowCreateModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            {t("groups.create", "Create")}
          </button>
        </div>

        <div className="groups-filters">
          <button className={`groups-filter-btn ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
            {t("groups.filters.all", "All Groups")}
          </button>
          <button className={`groups-filter-btn ${filter === "mine" ? "active" : ""}`} onClick={() => setFilter("mine")}>
            {t("groups.filters.mine", "My Groups")}
          </button>
          <button className={`groups-filter-btn ${filter === "discover" ? "active" : ""}`} onClick={() => setFilter("discover")}>
            {t("groups.filters.discover", "Discover")}
          </button>
        </div>

        <div className="groups-list">
          {loading ? (
            <div className="groups-loading">
              <div className="groups-spinner" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="groups-empty-list">{t("groups.noGroups", "No groups found")}</div>
          ) : (
            filtered.map((group) => {
              const unread = group.unread_count || 0;
              return (
                <div
                  key={group.id}
                  className={`groups-item ${selectedGroupId === group.id ? "active" : ""}`}
                  onClick={() => setSelectedGroupId(group.id)}
                >
                  <div className="groups-item-avatar">
                    {group.cover_image ? <img src={getImageUrl(group.cover_image)} alt={group.name} /> : <span>{getInitials(group.name)}</span>}
                  </div>
                  <div className="groups-item-info">
                    <div className="groups-item-top">
                      <span className="groups-item-name">{group.name}</span>
                      {group.last_message && (
                        <span className="groups-item-time">{formatListTime(group.last_message.created_at)}</span>
                      )}
                    </div>
                    <div className="groups-item-bottom">
                      <span className={`groups-item-preview ${unread > 0 ? "groups-item-preview--unread" : ""}`}>
                        {group.last_message
                          ? `${group.last_message.user_name ? group.last_message.user_name + ": " : ""}${group.last_message.content || t("groups.attachment", "Attachment")}`
                          : t("groups.membersCount", { count: group.members_count, defaultValue: `${group.members_count} members` })}
                      </span>
                      {unread > 0 ? (
                        <span className="groups-item-badge">{unread > 9 ? "9+" : unread}</span>
                      ) : (
                        <span className="groups-item-members">{group.members_count}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      <main className={`groups-main ${selectedGroup?.is_member ? "groups-main--chat" : ""}`}>
        {!selectedGroup ? (
          <div className="groups-welcome">
            <div className="groups-welcome-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h2>{t("groups.welcome.title", "Welcome to Groups")}</h2>
            <p>{t("groups.welcome.description", "Join groups, connect with people and start discussing topics that matter to you.")}</p>
            <button className="groups-explore-btn" onClick={() => setFilter("discover")}>
              {t("groups.welcome.explore", "Explore Groups")}
            </button>
          </div>
        ) : (
          <div className="groups-detail">
<div className="groups-detail-header">
              <button
                className="groups-back-btn"
                onClick={() => setSelectedGroupId(null)}
                aria-label={t("groups.back", "Back")}
              >
                ‹
              </button>
              <div className="groups-detail-avatar">
                {selectedGroup.cover_image ? (
                  <img src={getImageUrl(selectedGroup.cover_image)} alt={selectedGroup.name} />
                ) : (
                  <span>{getInitials(selectedGroup.name)}</span>
                )}
              </div>
              <div className="groups-detail-titles">
                <h2>{selectedGroup.name}</h2>
                <div className="groups-detail-meta">
{selectedGroup.is_member && groupMembers.length > 0 && (
                    <div className="groups-avatar-stack">
                      {groupMembers.slice(0, 3).map((m) => (
                        <div
                          key={m.id}
                          className="groups-avatar-stack-item"
                          onClick={() => navigate(`/profile/${m.id}`)}
                          title={m.name}
                        >
                          {m.profile_pic ? <img src={getImageUrl(m.profile_pic)} alt={m.name} /> : <span>{getInitials(m.name)}</span>}
                        </div>
                      ))}
                      {groupMembers.length > 3 && (
                        <div className="groups-avatar-stack-item groups-avatar-stack-more">+{groupMembers.length - 3}</div>
                      )}
                    </div>
                  )}
                  
                  <span>
                    {t("groups.membersCount", { count: selectedGroup.members_count, defaultValue: `${selectedGroup.members_count} Members` })}
                    {" · "}{t("groups.public", "Public")}
                  </span>
                </div>
              </div>

              {selectedGroup.is_member ? (
                <div className="groups-header-menu-wrap">
                  <button className="groups-header-menu-btn" onClick={() => setHeaderMenuOpen((v) => !v)} aria-label="Menu">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="5" r="1.6" />
                      <circle cx="12" cy="12" r="1.6" />
                      <circle cx="12" cy="19" r="1.6" />
                    </svg>
                  </button>
                 {headerMenuOpen && (
                    <>
                      <div className="groups-header-menu-overlay" onClick={() => setHeaderMenuOpen(false)} />
<div className="groups-header-menu">
                        <button className="groups-header-menu-item" onClick={() => handleShareGroup(selectedGroup)}>
                          {linkCopied ? t("groups.linkCopied", "Link copied!") : t("groups.shareGroup", "Share group")}
                        </button>
                        {selectedGroup.is_admin && (
                          <button className="groups-header-menu-item groups-header-menu-item--danger" onClick={() => handleDeleteGroup(selectedGroup.id)}>
                            {t("groups.deleteGroup", "Delete group")}
                          </button>
                        )}
                        <button className="groups-header-menu-item groups-header-menu-item--danger" onClick={() => handleLeave(selectedGroup.id)}>
                          {t("groups.leave", "Leave group")}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button className="groups-join-btn" onClick={(e) => handleJoin(selectedGroup.id, e)} disabled={joiningId === selectedGroup.id}>
                  {t("groups.join", "Join")}
                </button>
              )}
            </div>

            {selectedGroup.is_member ? (
              <GroupChat group={selectedGroup} authUserId={authUserId} onMessageSent={fetchGroups} />
            ) : (
              <div className="groups-detail-placeholder">
                {selectedGroup.description && <p className="groups-detail-description">{selectedGroup.description}</p>}
                <p>{t("groups.joinToChat", "Join this group to see and send messages.")}</p>
              </div>
            )}
          </div>
        )}
      </main>

      {showCreateModal && (
        <div className="groups-modal-overlay" onClick={() => setShowCreateModal(false)}>
<form className="groups-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleCreateGroup}>
            <h3>{t("groups.createGroup", "Create Group")}</h3>

            <label className="groups-modal-cover-picker">
              {newGroupCoverPreview ? (
                <img src={newGroupCoverPreview} alt="Cover preview" />
              ) : (
                <span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  {t("groups.addCoverPhoto", "Add cover photo")}
                </span>
              )}
              <input type="file" accept="image/*" onChange={handleCoverSelect} style={{ display: "none" }} />
            </label>

            <input
              type="text"
              placeholder={t("groups.namePlaceholder", "Group name")}
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              required
            />
            <textarea
              placeholder={t("groups.descriptionPlaceholder", "Description (optional)")}
              value={newGroupDescription}
              onChange={(e) => setNewGroupDescription(e.target.value)}
              rows={3}
            />
            <div className="groups-modal-actions">
              <button type="button" className="groups-modal-cancel" onClick={() => setShowCreateModal(false)}>
                {t("groups.cancel", "Cancel")}
              </button>
              <button type="submit" className="groups-modal-submit" disabled={creating || !newGroupName.trim()}>
                {creating ? t("common.loading", "Loading...") : t("groups.create", "Create")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default GroupsPanel;