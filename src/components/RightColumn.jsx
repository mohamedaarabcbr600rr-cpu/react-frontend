import React, { useState, useEffect } from "react";
import axios from "../axios";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import './RightColumn.css';

// ─── SVG Icon Components ───────────────────────────────────────────────────────

const IconLock = ({ size = 28, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconUsers = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconStar = ({ size = 32, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconArrowRight = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

// ──────────────────────────────────────────────────────────────────────────────

const RightColumn = ({ user = null, openLogin, onProfileClick }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [imageErrors, setImageErrors] = useState({});
  const [loading, setLoading] = useState({});
  const [currentUserFollowing, setCurrentUserFollowing] = useState([]);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchUserFollowing = async () => {
      if (!user) return;
      try {
        const res = await axios.get(`/api/users/${user.id}/following`);
        setCurrentUserFollowing(res.data);
      } catch (err) {
        console.error("Erreur lors de la récupération des following:", err);
      }
    };
    fetchUserFollowing();
  }, [user?.id]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await axios.get("/api/users/suggestions");

        const filtered = Array.isArray(res.data) && user
          ? res.data.filter(u => u.id !== user.id)
          : Array.isArray(res.data) ? res.data : [];

        const withFollow = filtered.map(u => ({
          ...u,
          isFollowing: currentUserFollowing.some(following => following.id === u.id),
          profile_pic: u.profile_pic || null
        }));

        setSuggestions(withFollow.slice(0, 5));
      } catch (err) {
        console.error("Erreur:", err);
      }
    };

    if (user) {
      fetchSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [user?.id, currentUserFollowing]);

  const handleProfileClick = (userId) => {
    if (!user) {
      openLogin();
      return;
    }
    if (onProfileClick) {
      onProfileClick(userId);
    } else {
      navigate(`/profile/${userId}`);
    }
  };

  const handleFollow = async (userId) => {
    if (!user) {
      openLogin();
      return;
    }
    if (loading[userId]) return;
    setLoading(prev => ({ ...prev, [userId]: true }));
    try {
      const isCurrentlyFollowing = currentUserFollowing.some(f => f.id === userId);
      if (isCurrentlyFollowing) {
        await axios.delete(`/api/users/${userId}/follow`);
        setCurrentUserFollowing(prev => prev.filter(f => f.id !== userId));
      } else {
        await axios.post(`/api/users/${userId}/follow`);
        const userRes = await axios.get(`/api/users/${userId}`);
        setCurrentUserFollowing(prev => [...prev, { ...userRes.data, isFollowing: true }]);
      }
      setSuggestions(prev =>
        prev.map(s =>
          s.id === userId ? { ...s, isFollowing: !isCurrentlyFollowing } : s
        )
      );
    } catch (err) {
      console.error("Erreur lors du follow/unfollow:", err);
      if (err.response?.status === 401) openLogin();
    } finally {
      setLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const getImageUrl = (profilePic) => {
    if (!profilePic) return null;
    if (profilePic.startsWith('http://') || profilePic.startsWith('https://')) return profilePic;
    if (profilePic.startsWith('/storage')) return `${import.meta.env.VITE_API_URL}${profilePic}`;
    if (profilePic.startsWith('storage/')) return `${import.meta.env.VITE_API_URL}/${profilePic}`;
    return `${import.meta.env.VITE_API_URL}/storage/${profilePic}`;
  };

  const getAvatarUrl = (name) => {
    const encodedName = encodeURIComponent(name || 'User');
    return `https://ui-avatars.com/api/?background=0a66c2&color=fff&rounded=true&size=48&bold=true&name=${encodedName}`;
  };

  const footerLinks = [
    { labelKey: 'footer.about',         path: '/about'         },
    { labelKey: 'footer.accessibility', path: '/accessibility' },
    { labelKey: 'footer.terms',         path: '/terms'         },
    { labelKey: 'footer.privacy',       path: '/privacy'       },
  ];

  return (
    <div className="right-column">
      {!user && (
        <div className="right-column__login-msg">
          <span className="right-column__login-icon">
            <IconLock size={28} color="#0a66c2" />
          </span>
          <h4 className="right-column__login-title">
            {t("rightColumn.loginTitle")}
          </h4>
          <p className="right-column__login-text">
            {t("rightColumn.loginText")}
          </p>
          <button
            className="right-column__login-btn"
            onClick={openLogin}
          >
            {t("auth.login")}
          </button>
        </div>
      )}

      <div className="right-column__title">
        <IconUsers size={18} color="#0a66c2" />
        {user ? t("rightColumn.suggestionsForYou") : t("rightColumn.popular")}
      </div>

      {suggestions.length > 0 ? (
        suggestions.map((suggestion) => {
          const imageUrl = getImageUrl(suggestion.profile_pic);
          const hasImage = suggestion.profile_pic && !imageErrors[suggestion.id];
          const isLoading = loading[suggestion.id];

          return (
            <div key={suggestion.id} className="right-column__suggestion">
              <div
                className="right-column__suggestion-avatar"
                onClick={() => handleProfileClick(suggestion.id)}
                style={{ cursor: 'pointer' }}
              >
                {hasImage ? (
                  <img
                    src={imageUrl}
                    alt={suggestion.name}
                    className="right-column__suggestion-image"
                    onError={() => setImageErrors(prev => ({ ...prev, [suggestion.id]: true }))}
                    loading="lazy"
                  />
                ) : (
                  <img
                    src={getAvatarUrl(suggestion.name)}
                    alt={suggestion.name}
                    className="right-column__suggestion-image"
                    loading="lazy"
                  />
                )}
              </div>

              <div
                className="right-column__suggestion-info"
                onClick={() => handleProfileClick(suggestion.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="right-column__suggestion-name">
                  {suggestion.name || t("common.user")}
                </div>
                <div className="right-column__suggestion-title">
                  {suggestion.bio || suggestion.headline || t("rightColumn.defaultTitle")}
                </div>
              </div>

              <button
                className={`right-column__follow-btn ${suggestion.isFollowing ? 'right-column__follow-btn--following' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleFollow(suggestion.id);
                }}
                disabled={isLoading}
              >
                {isLoading
                  ? "..."
                  : (suggestion.isFollowing ? t("rightColumn.following") : t("rightColumn.follow"))}
              </button>
            </div>
          );
        })
      ) : (
        <div className="right-column__empty">
          <span className="right-column__empty-icon">
            {user
              ? <IconStar size={32} color="#9ca3af" />
              : <IconLock size={32} color="#9ca3af" />
            }
          </span>
          <div>
            {user
              ? t("rightColumn.empty")
              : t("rightColumn.loginToSee")}
          </div>
        </div>
      )}

      <div
        className="right-column__view-all"
        onClick={() => user ? navigate('/reseau') : openLogin()}
      >
        {t("rightColumn.viewAll")} <IconArrowRight size={13} />
      </div>

      <div className="right-column__divider"></div>

      <footer className="right-column__footer">
        <nav
          className="right-column__footer-links"
          aria-label="Site information"
        >
          {footerLinks.map(({ labelKey, path }) => (
            <Link
              key={path}
              to={path}
              className="right-column__footer-link"
            >
              {t(labelKey)}
            </Link>
          ))}
        </nav>
        <div className="right-column__footer-copyright">
          {t("footer.copyright")}
        </div>
      </footer>
    </div>
  );
};

export default RightColumn;