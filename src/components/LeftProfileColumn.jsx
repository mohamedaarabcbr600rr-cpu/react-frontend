import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './LeftProfileColumn.css';
import logo from '../assets/logo.jpg';
import InviteEarnCard from './InviteEarnCard';
import TopReferrers from './TopReferrers';

const IconWelcome = ({ size = 28, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IconLink = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

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
          <span className="left-profile__visitor-icon">
  <IconWelcome size={28} color="#6366f1" />
</span>

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
    <div className="left-column-stack">
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
    <span style={{ display: 'inline-flex', verticalAlign: '-2px', marginRight: 4 }}>
  <IconLink size={13} color="currentColor" />
</span>
{user.link.length > 35
  ? `${user.link.substring(0, 35)}...`
  : user.link}
  </a>
)}
      </div>

</div>

    <InviteEarnCard user={user} />
    <TopReferrers user={user} />
    </div>
  );
};

export default LeftProfileColumn;







