import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "../axios";
import { useNavigate } from "react-router-dom";
import "./Reseau.css";

const Reseau = ({ user, openLogin }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [followingList, setFollowingList] = useState([]);
  const [followLoading, setFollowLoading] = useState({});
  const [imageErrors, setImageErrors] = useState({});
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Récupérer tous les utilisateurs et les following
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Option 1: Utiliser l'API suggestions si /api/users n'existe pas
        // Cela récupère tous les utilisateurs sauf l'utilisateur connecté et ceux qu'il suit déjà
        const usersRes = await axios.get("/api/users/suggestions");
        
        // Transformer les données
        let allUsers = [];
        if (Array.isArray(usersRes.data)) {
          allUsers = usersRes.data.filter(u => u.id !== user.id);
        }
        
        // Récupérer les following de l'utilisateur pour avoir la liste complète
        const followingRes = await axios.get(`/api/users/${user.id}/following`);
        const followingIds = followingRes.data.map(f => f.id);
        setFollowingList(followingRes.data);
        
        // Ajouter le statut isFollowing à chaque utilisateur
        const usersWithFollowStatus = allUsers.map(u => ({
          ...u,
          isFollowing: followingIds.includes(u.id),
          profile_pic: u.profile_pic || null
        }));
        
        setUsers(usersWithFollowStatus);
        setFilteredUsers(usersWithFollowStatus);
      } catch (err) {
        console.error(t('reseau.errors.loadError'), err);
        
        // Option 2: Fallback - utiliser following + followers
        try {
          const [followingRes, followersRes] = await Promise.all([
            axios.get(`/api/users/${user.id}/following`),
            axios.get(`/api/users/${user.id}/followers`)
          ]);
          
          // Fusionner les deux listes sans doublons
          const allUsersMap = new Map();
          
          followingRes.data.forEach(u => {
            allUsersMap.set(u.id, { ...u, isFollowing: true });
          });
          
          followersRes.data.forEach(u => {
            if (allUsersMap.has(u.id)) {
              allUsersMap.set(u.id, { ...allUsersMap.get(u.id), ...u });
            } else {
              allUsersMap.set(u.id, { ...u, isFollowing: false });
            }
          });
          
          const allUsersArray = Array.from(allUsersMap.values());
          setUsers(allUsersArray);
          setFilteredUsers(allUsersArray);
        } catch (fallbackErr) {
          console.error(t('reseau.errors.fallbackError'), fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  // Filtrer les utilisateurs par recherche
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const handleFollow = async (targetUser) => {
    if (!user) {
      openLogin();
      return;
    }
    
    if (followLoading[targetUser.id]) return;
    
    setFollowLoading(prev => ({ ...prev, [targetUser.id]: true }));
    
    try {
      if (targetUser.isFollowing) {
        // Unfollow
        await axios.delete(`/api/users/${targetUser.id}/follow`);
        setFollowingList(prev => prev.filter(f => f.id !== targetUser.id));
      } else {
        // Follow
        await axios.post(`/api/users/${targetUser.id}/follow`);
        setFollowingList(prev => [...prev, targetUser]);
      }
      
      // Mettre à jour le statut dans les listes
      setUsers(prev => prev.map(u => 
        u.id === targetUser.id ? { ...u, isFollowing: !u.isFollowing } : u
      ));
      setFilteredUsers(prev => prev.map(u => 
        u.id === targetUser.id ? { ...u, isFollowing: !u.isFollowing } : u
      ));
      
    } catch (err) {
      console.error(t('reseau.errors.followError'), err);
      if (err.response?.status === 401) {
        openLogin();
      }
    } finally {
      setFollowLoading(prev => ({ ...prev, [targetUser.id]: false }));
    }
  };

  const handleProfileClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const getImageUrl = (profilePic) => {
    if (!profilePic) return null;
    if (profilePic.startsWith('http')) return profilePic;
    if (profilePic.startsWith('/storage')) return `${import.meta.env.VITE_API_URL}${profilePic}`;
    return `${import.meta.env.VITE_API_URL}/storage/${profilePic}`;
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  if (!user) {
    return (
      <div className="reseau-login-required">
        <div className="reseau-login-card">
          <span className="reseau-login-icon">🔒</span>
          <h2>{t('reseau.loginRequired.title')}</h2>
          <p>{t('reseau.loginRequired.text')}</p>
          <button className="reseau-login-btn" onClick={openLogin}>
            {t('auth.login')}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="reseau-loading">
        <div className="reseau-spinner"></div>
        <p>{t('reseau.loading')}</p>
      </div>
    );
  }

  return (
    <div className="reseau-container">
      <div className="reseau-header">
        <h1 className="reseau-title">{t('reseau.title')}</h1>
        <p className="reseau-subtitle">
          {t('reseau.subtitle')}
        </p>
        
        <div className="reseau-search">
          <div className="reseau-search-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <input
            type="text"
            className="reseau-search-input"
            placeholder={t('reseau.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="reseau-search-clear"
              onClick={() => setSearchTerm("")}
              aria-label={t('reseau.clearSearch')}
            >
              ✕
            </button>
          )}
        </div>
        
        <div className="reseau-stats">
          <span>{t('reseau.memberCount', { count: filteredUsers.length })}</span>
        </div>
      </div>
      
      <div className="reseau-grid">
        {filteredUsers.length === 0 ? (
          <div className="reseau-empty">
            <div className="reseau-empty-icon">🔍</div>
            <h3>{t('reseau.empty.title')}</h3>
            <p>{t('reseau.empty.text')}</p>
          </div>
        ) : (
          filteredUsers.map((member) => {
            const imageUrl = getImageUrl(member.profile_pic);
            const hasImage = member.profile_pic && !imageErrors[member.id];
            const isLoading = followLoading[member.id];
            
            return (
              <div key={member.id} className="reseau-card">
                <div 
                  className="reseau-card-avatar"
                  onClick={() => handleProfileClick(member.id)}
                >
                  {hasImage ? (
                    <img
                      src={imageUrl}
                      alt={member.name}
                      className="reseau-avatar-img"
                      onError={() => setImageErrors(prev => ({ ...prev, [member.id]: true }))}
                    />
                  ) : (
                    <div 
                      className="reseau-avatar-placeholder"
                      style={{ background: `linear-gradient(135deg, #667eea, #764ba2)` }}
                    >
                      {getInitials(member.name)}
                    </div>
                  )}
                  {member.isOnline && <span className="reseau-online-dot"></span>}
                </div>
                
                <div className="reseau-card-info">
                  <h3 
                    className="reseau-card-name"
                    onClick={() => handleProfileClick(member.id)}
                  >
                    {member.name || t('reseau.defaultUser')}
                  </h3>
                  {member.username && (
                    <p className="reseau-card-username">@{member.username}</p>
                  )}
                  {member.headline && (
                    <p className="reseau-card-bio">{member.headline}</p>
                  )}
                  {member.bio && !member.headline && (
                    <p className="reseau-card-bio">{member.bio}</p>
                  )}
                </div>
                
                <button
                  className={`reseau-follow-btn ${member.isFollowing ? 'following' : ''}`}
                  onClick={() => handleFollow(member)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="reseau-btn-spinner"></span>
                  ) : member.isFollowing ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {t('reseau.following')}
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round"/>
                        <circle cx="9" cy="7" r="4" strokeLinecap="round"/>
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round"/>
                      </svg>
                      {t('reseau.follow')}
                    </>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Reseau;







