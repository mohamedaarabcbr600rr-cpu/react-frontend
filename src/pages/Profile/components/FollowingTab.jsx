// pages/Profile/components/FollowingTab.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './FollowingTab.css';

const FollowingTab = ({ following = [], onFollowToggle, currentUserId }) => {
  const navigate = useNavigate();

  const handleProfileClick = (userId, e) => {
    e?.stopPropagation();
    if (userId && navigate) {
      navigate(`/profile/${userId}`);
    }
  };

  const handleUnfollowClick = (e, user) => {
    e.preventDefault();
    e.stopPropagation();
    if (onFollowToggle) {
      onFollowToggle(user.id, user);
    }
  };

  const getImageUrl = (profilePic) => {
    if (!profilePic) return null;
    if (profilePic.startsWith('http')) return profilePic;
    if (profilePic.startsWith('/storage')) return `import.meta.env.VITE_API_URL${profilePic}`;
    return `import.meta.env.VITE_API_URL/storage/${profilePic}`;
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  if (!following || following.length === 0) {
    return (
      <div className="following-empty">
        <div className="following-empty-icon">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 16s-1.5-2-4-2-4 2-4 2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="9" y1="9" x2="9.01" y2="9" strokeLinecap="round"/>
            <line x1="15" y1="9" x2="15.01" y2="9" strokeLinecap="round"/>
          </svg>
        </div>
        <h3 className="following-empty-title">لا تتابع أحداً بعد</h3>
        <p className="following-empty-text">ابدأ بمتابعة أشخاص مثيرين للاهتمام</p>
      </div>
    );
  }

  return (
    <div className="following-container">
      {following.map((user, index) => {
        const imageUrl = getImageUrl(user.profile_pic);
        const hasImage = user.profile_pic;
        
        return (
          <div
            key={user.id}
            className="following-card"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div
              className="following-info"
              onClick={(e) => handleProfileClick(user.id, e)}
            >
              {/* Avatar */}
              <div className="following-avatar-wrapper">
                <div className="following-avatar">
                  {hasImage ? (
                    <img
                      src={imageUrl}
                      alt={user.name}
                      className="following-avatar-img"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className="following-avatar-fallback"
                    style={{ 
                      display: hasImage ? 'none' : 'flex',
                      background: `linear-gradient(135deg, #667eea, #764ba2)`
                    }}
                  >
                    {getInitials(user.name)}
                  </div>
                </div>
                {user.isOnline && <span className="following-online-badge"></span>}
              </div>

              {/* User Details */}
              <div className="following-details">
                <div className="following-name-row">
                  <h4 className="following-name">
                    {user.name || 'Utilisateur'}
                  </h4>
                  {user.isVerified && (
                    <span className="following-verified-badge">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="#0095f6">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    </span>
                  )}
                </div>

                {user.username && (
                  <p className="following-username">@{user.username}</p>
                )}

                {user.headline && (
                  <p className="following-headline">{user.headline}</p>
                )}

                {user.bio && (
                  <p className="following-bio">{user.bio}</p>
                )}

                {!user.headline && !user.bio && (
                  <p className="following-default">Membre</p>
                )}
              </div>
            </div>

            {/* Unfollow Button */}
            {user.id !== currentUserId && (
              <button
                className={`following-btn ${user.isFollowing ? 'following' : 'not-following'}`}
                onClick={(e) => handleUnfollowClick(e, user)}
              >
                {user.isFollowing ? (
                  <>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>متابَع</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round"/>
                      <circle cx="9" cy="7" r="4" strokeLinecap="round"/>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round"/>
                    </svg>
                    <span>متابعة</span>
                  </>
                )}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FollowingTab;



