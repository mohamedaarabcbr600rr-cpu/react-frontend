import React, { useState, useEffect } from "react";
import axios from "../axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import './RightColumn.css';

const RightColumn = ({ user = null, openLogin, onProfileClick }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [imageErrors, setImageErrors] = useState({});
  const [loading, setLoading] = useState({});
  const [currentUserFollowing, setCurrentUserFollowing] = useState([]);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Récupérer les following de l'utilisateur connecté
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

        // Vérifier si l'utilisateur suit déjà cette personne
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
      const suggestion = suggestions.find(s => s.id === userId);
      const isCurrentlyFollowing = currentUserFollowing.some(f => f.id === userId);

      if (isCurrentlyFollowing) {
        // UNFOLLOW
        await axios.delete(`/api/users/${userId}/follow`);
        // Mettre à jour la liste des following
        setCurrentUserFollowing(prev => prev.filter(f => f.id !== userId));
      } else {
        // FOLLOW
        await axios.post(`/api/users/${userId}/follow`);
        // Ajouter à la liste des following
        const userRes = await axios.get(`/api/users/${userId}`);
        setCurrentUserFollowing(prev => [...prev, { ...userRes.data, isFollowing: true }]);
      }

      // Mettre à jour le state suggestions
      setSuggestions(prev =>
        prev.map(s =>
          s.id === userId ? { ...s, isFollowing: !isCurrentlyFollowing } : s
        )
      );
    } catch (err) {
      console.error("Erreur lors du follow/unfollow:", err);
      if (err.response?.status === 401) {
        openLogin();
      }
    } finally {
      setLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const getImageUrl = (profilePic) => {
    if (!profilePic) return null;
    if (profilePic.startsWith('http://') || profilePic.startsWith('https://')) return profilePic;
    if (profilePic.startsWith('/storage')) return `import.meta.env.VITE_API_URL${profilePic}`;
    if (profilePic.startsWith('storage/')) return `import.meta.env.VITE_API_URL/${profilePic}`;
    return `import.meta.env.VITE_API_URL/storage/${profilePic}`;
  };

  const getAvatarUrl = (name) => {
    const encodedName = encodeURIComponent(name || 'User');
    return `https://ui-avatars.com/api/?background=0a66c2&color=fff&rounded=true&size=48&bold=true&name=${encodedName}`;
  };

  const footerLinks = [
    t('footer.about'),
    t('footer.accessibility'),
    t('footer.terms'),
    t('footer.privacy')
  ];

  return (
    <div className="right-column">
      {!user && (
        <div className="right-column__login-msg">
          <span className="right-column__login-icon">🔒</span>
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
        <span>👥</span>
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
            {user ? "🌟" : "🔒"}
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
        {t("rightColumn.viewAll")} →
      </div>

      <div className="right-column__divider"></div>

      <div className="right-column__footer">
        <div className="right-column__footer-links">
          {footerLinks.map((link, index) => (
            <span key={index} className="right-column__footer-link">
              {link}
            </span>
          ))}
        </div>
        <div className="right-column__footer-copyright">
          {t("footer.copyright")}
        </div>
      </div>
    </div>
  );
};

export default RightColumn;

