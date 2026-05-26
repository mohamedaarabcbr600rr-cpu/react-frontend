import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './LeftProfileColumn.css';
import logo from '../assets/logo.jpeg';

const LeftProfileColumn = ({
  user = null,
  getInitials,
  onProfileClick,
  openLogin,
}) => {
  const [imageError, setImageError] = useState(false);
  const { t } = useTranslation();

  if (!user) {
    return (
      <div className="left-profile">
        <div className="left-profile__visitor">
          <span className="left-profile__visitor-icon">👋</span>

          <h3 className="left-profile__visitor-title">
            {t('leftProfile.visitor.title')}
          </h3>

          <p className="left-profile__visitor-text">
            {t('leftProfile.visitor.text')}
          </p>

          <button
            className="left-profile__login-btn"
            onClick={openLogin}
          >
            {t('auth.login')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="left-profile">
      {/* HEADER PROFILE */}
      <div
        className="left-profile__header"
        onClick={onProfileClick}
      >
        <div className="left-profile__banner"></div>

        <div className="left-profile__avatar">
          {user.profile_pic && !imageError ? (
            <img
              src={user.profile_pic?.startsWith('http') ? user.profile_pic : `${import.meta.env.VITE_API_URL}${user.profile_pic}`}
              alt={user.name}
              className="left-profile__avatar-image"
              onError={() => setImageError(true)}
            />
          ) : (
            getInitials(user.name)
          )}
        </div>

        <h3 className="left-profile__name">
          {user.name}
        </h3>

        {user.username && (
          <p className="left-profile__username">
            @{user.username}
          </p>
        )}

        {user.bio && (
          <p className="left-profile__bio">
            {user.bio}
          </p>
        )}

         
          
         {user.link && (
  <a
    href={user.link}
    className="left-profile__link"
    target="_blank"
    rel="noopener noreferrer"
    onClick={(e) => e.stopPropagation()}
  >
    🔗{' '}
    {user.link.length > 35
      ? `${user.link.substring(0, 35)}...`
      : user.link}
  </a>
)}
      </div>

      {/* LOGO */}
      <div className="left-profile__coming-logo">
        <img
          src={logo}
          alt="Talib Logo"
          className="left-profile__coming-logo-image"
        />
      </div>
    </div>
  );
};

export default LeftProfileColumn;







