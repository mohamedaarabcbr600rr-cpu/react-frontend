// pages/Profile/components/FollowersTab.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './FollowersTab.css';

const FollowersTab = ({ followers = [], onFollowToggle, currentUserId }) => {
  const navigate = useNavigate();

  const handleProfileClick = (userId, e) => {
    e?.stopPropagation();
    if (userId && navigate) {
      navigate(`/profile/${userId}`);
    }
  };

  const handleFollowClick = (e, follower) => {
    e.preventDefault();
    e.stopPropagation();
    if (onFollowToggle) {
      onFollowToggle(follower.id, follower);
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

  if (!followers || followers.length === 0) {
    return (
      <div className="followers-empty">
        <div className="followers-empty-icon">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 className="followers-empty-title">لا يوجد متابعين بعد</h3>
        <p className="followers-empty-text">شارك محتوى مميز لكسب المتابعين</p>
      </div>
    );
  }

  return (
    <div className="followers-container">
      {followers.map((follower, index) => {
        const imageUrl = getImageUrl(follower.profile_pic);
        const hasImage = follower.profile_pic;
        
        return (
          <div
            key={follower.id}
            className="follower-card"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div
              className="follower-info"
              onClick={(e) => handleProfileClick(follower.id, e)}
            >
              {/* Avatar */}
              <div className="follower-avatar-wrapper">
                <div className="follower-avatar">
                  {hasImage ? (
                    <img
                      src={imageUrl}
                      alt={follower.name}
                      className="follower-avatar-img"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className="follower-avatar-fallback"
                    style={{ 
                      display: hasImage ? 'none' : 'flex',
                      background: `linear-gradient(135deg, #667eea, #764ba2)`
                    }}
                  >
                    {getInitials(follower.name)}
                  </div>
                </div>
                {follower.isOnline && <span className="follower-online-badge"></span>}
              </div>

              {/* User Details */}
              <div className="follower-details">
                <div className="follower-name-row">
                  <h4 className="follower-name">
                    {follower.name || 'Utilisateur'}
                  </h4>
                  {follower.isVerified && (
                    <span className="follower-verified-badge">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="#0095f6">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    </span>
                  )}
                </div>

                {follower.headline && (
                  <p className="follower-headline">{follower.headline}</p>
                )}

                {follower.bio && (
                  <p className="follower-bio">{follower.bio}</p>
                )}

                {!follower.headline && !follower.bio && (
                  <p className="follower-default">Membre</p>
                )}

                {follower.mutualFollowers > 0 && (
                  <span className="follower-mutual">
                    {follower.mutualFollowers} متابع مشترك
                  </span>
                )}
              </div>
            </div>

            {/* Follow Button */}
            {follower.id !== currentUserId && (
              <button
                className={`follower-btn ${follower.isFollowing ? 'following' : 'not-following'}`}
                onClick={(e) => handleFollowClick(e, follower)}
              >
                {follower.isFollowing ? (
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

export default FollowersTab;






