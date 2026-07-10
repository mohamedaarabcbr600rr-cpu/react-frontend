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

       // APRÈS

const [usersRes, followingRes] = await Promise.all([

  axios.get("/api/users"),

  axios.get(`/api/users/${user.id}/following`)

]);


const followingIds = followingRes.data.map(f => f.id);

setFollowingList(followingRes.data);


const usersWithFollowStatus = usersRes.data.map(u => ({

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


  // Pick a deterministic, soft cover gradient for each member

  const getCoverGradient = (id) => {

    const palette = [

      "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 60%, #E0E7FF 100%)",

      "linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 60%, #DBEAFE 100%)",

      "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 60%, #E0E7FF 100%)",

      "linear-gradient(135deg, #ECFEFF 0%, #CFFAFE 60%, #DBEAFE 100%)",

      "linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 60%, #E0E7FF 100%)",

      "linear-gradient(135deg, #FEF7FF 0%, #FAE8FF 60%, #EDE9FE 100%)",

    ];

    if (id === undefined || id === null) return palette[0];

    const numericId = typeof id === "number" ? id : String(id).split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

    return palette[numericId % palette.length];

  };


  const formatCount = (n) => {

    if (n === undefined || n === null) return null;

    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";

    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";

    return String(n);

  };


  if (!user) {

    return (

      <div className="reseau-login-required">

        <div className="reseau-login-card">

          <span className="reseau-login-icon" aria-hidden="true">

            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">

              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>

              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>

            </svg>

          </span>

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

      <div className="reseau-container">

        <div className="reseau-header">

          <div className="reseau-skeleton reseau-skeleton-title"></div>

          <div className="reseau-skeleton reseau-skeleton-subtitle"></div>

          <div className="reseau-skeleton reseau-skeleton-search"></div>

        </div>

        <div className="reseau-grid">

          {Array.from({ length: 8 }).map((_, i) => (

            <div key={i} className="reseau-card reseau-card-skeleton" aria-hidden="true">

              <div className="reseau-skeleton reseau-skeleton-cover"></div>

              <div className="reseau-skeleton reseau-skeleton-avatar"></div>

              <div className="reseau-skeleton-body">

                <div className="reseau-skeleton reseau-skeleton-line reseau-skeleton-line-lg"></div>

                <div className="reseau-skeleton reseau-skeleton-line reseau-skeleton-line-sm"></div>

                <div className="reseau-skeleton reseau-skeleton-line reseau-skeleton-line-md"></div>

                <div className="reseau-skeleton reseau-skeleton-stats">

                  <div className="reseau-skeleton reseau-skeleton-stat"></div>

                  <div className="reseau-skeleton reseau-skeleton-stat"></div>

                  <div className="reseau-skeleton reseau-skeleton-stat"></div>

                </div>

                <div className="reseau-skeleton reseau-skeleton-button"></div>

              </div>

            </div>

          ))}

        </div>

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

          <div className="reseau-search-icon" aria-hidden="true">

            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

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

              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                <line x1="18" y1="6" x2="6" y2="18"/>

                <line x1="6" y1="6" x2="18" y2="18"/>

              </svg>

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

            <div className="reseau-empty-icon" aria-hidden="true">

              <svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">

                <circle cx="11" cy="11" r="8"/>

                <path d="m21 21-4.35-4.35"/>

                <circle cx="11" cy="11" r="3"/>

              </svg>

            </div>

            <h3>{t('reseau.empty.title')}</h3>

            <p>{t('reseau.empty.text')}</p>

          </div>

        ) : (

          filteredUsers.map((member) => {

            const imageUrl = getImageUrl(member.profile_pic);

            const hasImage = member.profile_pic && !imageErrors[member.id];

            const isLoading = followLoading[member.id];

            const followers = member.followers_count ?? member.followers;

            const following = member.following_count ?? member.following;

            const posts = member.posts_count ?? member.posts;

            const location = member.location || member.city;

            const headline = member.headline || member.bio;

            const hasAnyStat = followers !== undefined || following !== undefined || posts !== undefined;


            return (

              <article key={member.id} className="reseau-card">

                <div

                  className="reseau-card-cover"

                  style={{ background: getCoverGradient(member.id) }}

                  aria-hidden="true"

                />


                <div className="reseau-card-avatar-wrap">

                  <div

                    className="reseau-card-avatar"

                    onClick={() => handleProfileClick(member.id)}

                    role="button"

                    tabIndex={0}

                    onKeyDown={(e) => {

                      if (e.key === "Enter" || e.key === " ") {

                        e.preventDefault();

                        handleProfileClick(member.id);

                      }

                    }}

                    aria-label={member.name}

                  >

                    {hasImage ? (

                      <img

                        src={imageUrl}

                        alt={member.name}

                        className="reseau-avatar-img"

                        onError={() => setImageErrors(prev => ({ ...prev, [member.id]: true }))}

                      />

                    ) : (

                      <div className="reseau-avatar-placeholder">

                        {getInitials(member.name)}

                      </div>

                    )}

                    {member.isOnline && <span className="reseau-online-dot" aria-label="Online"></span>}

                  </div>

                </div>


                <div className="reseau-card-body">

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

                    {headline && (

                      <p className="reseau-card-bio">{headline}</p>

                    )}

                    {location && (

                      <p className="reseau-card-location">

                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">

                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>

                          <circle cx="12" cy="10" r="3"/>

                        </svg>

                        <span>{location}</span>

                      </p>

                    )}

                  </div>


                  {hasAnyStat && (

                    <div className="reseau-card-stats">

                      {followers !== undefined && followers !== null && (

                        <div className="reseau-stat">

                          <span className="reseau-stat-value">{formatCount(followers)}</span>

                          <span className="reseau-stat-label">{t('reseau.followers', { defaultValue: 'Followers' })}</span>

                        </div>

                      )}

                      {following !== undefined && following !== null && (

                        <div className="reseau-stat">

                          <span className="reseau-stat-value">{formatCount(following)}</span>

                          <span className="reseau-stat-label">{t('reseau.followingLabel', { defaultValue: 'Following' })}</span>

                        </div>

                      )}

                      {posts !== undefined && posts !== null && (

                        <div className="reseau-stat">

                          <span className="reseau-stat-value">{formatCount(posts)}</span>

                          <span className="reseau-stat-label">{t('reseau.posts', { defaultValue: 'Posts' })}</span>

                        </div>

                      )}

                    </div>

                  )}


                  <button

                    className={`reseau-follow-btn ${member.isFollowing ? 'following' : ''}`}

                    onClick={() => handleFollow(member)}

                    disabled={isLoading}

                  >

                    {isLoading ? (

                      <span className="reseau-btn-spinner" aria-hidden="true"></span>

                    ) : member.isFollowing ? (

                      <>

                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">

                          <path d="M20 6L9 17l-5-5"/>

                        </svg>

                        <span>{t('reseau.following')}</span>

                      </>

                    ) : (

                      <>

                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">

                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>

                          <circle cx="9" cy="7" r="4"/>

                          <line x1="19" y1="8" x2="19" y2="14"/>

                          <line x1="22" y1="11" x2="16" y2="11"/>

                        </svg>

                        <span>{t('reseau.follow')}</span>

                      </>

                    )}

                  </button>

                </div>

              </article>

            );

          })

        )}

      </div>

    </div>

  );

};


export default Reseau;