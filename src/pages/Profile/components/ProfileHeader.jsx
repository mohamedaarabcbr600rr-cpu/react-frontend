// pages/Profile/components/ProfileHeader.jsx - Unified Profile Header
// Works for both own profile and other users' profiles
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import EditProfileModal from "./EditProfileModal";
import "./ProfileHeader.css";

const ProfileHeader = ({
  user,
  currentUser,
  getInitials,
  followersCount = 0,
  followingCount = 0,
  postsCount = 0,
  onUpdateUser,
  onTabChange,
  activeTab = "posts",
  onFollowToggle,
  following = [],
  onMessageClick,
  isFollowedByCurrentUser = false
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useTranslation();

  // Compute if this is the current user's own profile
  const isMyProfile = currentUser && user && currentUser.id === user.id;

  // Check if currently following this user
  const isFollowing = isFollowedByCurrentUser;

  const tabs = [
    { id: 'posts', label: t('profile.tabs.posts'), icon: 'grid' },
    { id: 'followers', label: t('profile.tabs.followers'), icon: 'users' },
    { id: 'following', label: t('profile.tabs.following'), icon: 'user' },
  ];

  const formatCount = (count) => {
    if (count >= 1000000) {
      return t('profile.formatCount.million', { count: (count / 1000000).toFixed(1) });
    }
    if (count >= 1000) {
      return t('profile.formatCount.thousand', { count: (count / 1000).toFixed(1) });
    }
    return count?.toString() || '0';
  };

  const getTabIcon = (iconName) => {
    switch (iconName) {
      case 'grid':
        return (
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
        );
      case 'users':
        return (
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'user':
        return (
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="profile-header">
      {/* Avatar Section */}
      <div className="profile-avatar-section">
        <div className="profile-avatar-wrapper">
          {user?.profile_pic ? (
            <img
              src={user?.profile_pic || "/default-avatar.png"}
              alt={user?.name || t('profile.user')}
              className="profile-avatar"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/default-avatar.png";
              }}
            />
          ) : (
            <div className="profile-avatar-placeholder">
              {getInitials(user?.name || 'U')}
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="profile-info-section">
        {/* Username Row with Actions */}
        <div className="profile-username-row">
          <h1 className="profile-username">{user?.username || user?.name || 'username'}</h1>

          {/* Conditional Actions based on profile ownership */}
          {isMyProfile ? (
            // Own profile - show Edit Profile button
            <button
              className="profile-edit-btn"
              onClick={() => setIsModalOpen(true)}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{t('profile.editProfile')}</span>
            </button>
          ) : (
            // Other user profile - show Follow/Unfollow and Message buttons
            <div className="profile-actions-row">
              <button
                className={`profile-follow-btn ${isFollowing ? 'following' : ''}`}
                onClick={() => onFollowToggle?.(user?.id, { id: user?.id, name: user?.name, profile_pic: user?.profile_pic })}
              >
                {isFollowing ? (
                  <>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    {t('profile.following')}
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <line x1="19" y1="8" x2="19" y2="14"/>
                      <line x1="22" y1="11" x2="16" y2="11"/>
                    </svg>
                    {t('profile.follow')}
                  </>
                )}
              </button>

              <button
                className="profile-message-btn"
                onClick={() => onMessageClick?.(user?.id)}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {t('profile.message')}
              </button>
            </div>
          )}
        </div>

        {/* Name */}
        <h2 className="profile-name">{user?.name || t('profile.userName')}</h2>

        {/* Stats Row */}
        <div className="profile-stats">
          <div className="profile-stat-item">
            <span className="profile-stat-number">{formatCount(postsCount)}</span>
            <span className="profile-stat-label">{t('profile.stats.posts')}</span>
          </div>
          <div className="profile-stat-item clickable" onClick={() => onTabChange?.('followers')}>
            <span className="profile-stat-number">{formatCount(followersCount)}</span>
            <span className="profile-stat-label">{t('profile.stats.followers')}</span>
          </div>
          <div className="profile-stat-item clickable" onClick={() => onTabChange?.('following')}>
            <span className="profile-stat-number">{formatCount(followingCount)}</span>
            <span className="profile-stat-label">{t('profile.stats.following')}</span>
          </div>
        </div>

        {/* Bio */}
        {user?.bio && (
          <p className="profile-bio">{user.bio}</p>
        )}

        {/* Link */}
        {user?.link && (
          <a
            href={user.link}
            className="profile-link"
            target="_blank"
            rel="noreferrer"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{user.link.replace(/^https?:\/\//, '')}</span>
          </a>
        )}

        {/* Own Profile - Show Settings Link */}
        {isMyProfile && (
          <Link to="/settings/profile" className="profile-settings-link">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            {t('profile.settings')}
          </Link>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="profile-tabs">
        <div className="profile-tabs-container">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange?.(tab.id)}
              aria-label={tab.label}
            >
              <span className="profile-tab-icon">
                {getTabIcon(tab.icon)}
              </span>
              <span className="profile-tab-label">{tab.label}</span>
            </button>
          ))}
          {activeTab && (
            <div
              className="profile-tab-indicator"
              style={{
                transform: `translateX(${tabs.findIndex(t => t.id === activeTab) * 100}%)`
              }}
            />
          )}
        </div>
      </div>

      {/* Edit Profile Modal - Only for own profile */}
      {isMyProfile && (
        <EditProfileModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          user={user}
          onUpdate={onUpdateUser}
        />
      )}
    </div>
  );
};

export default ProfileHeader;

