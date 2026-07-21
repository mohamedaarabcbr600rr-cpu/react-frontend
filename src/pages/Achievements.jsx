import React from 'react';
import { useTranslation } from 'react-i18next';
import InviteEarnCard from '../components/InviteEarnCard';
import TopReferrers from '../components/TopReferrers';
import './Achievements.css';

const IconTrophy = ({ size = 28, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 21h8M12 17v4" />
    <path d="M7 4h10v6a5 5 0 0 1-10 0V4z" />
    <path d="M7 6H4a2 2 0 0 0 2 4M17 6h3a2 2 0 0 1-2 4" />
  </svg>
);

const Achievements = ({ user }) => {
  const { t } = useTranslation();

  return (
    <div className="achievements-page">
      <div className="achievements-page__header">
        <IconTrophy size={26} color="#7c3aed" />
        <div>
          <h1 className="achievements-page__title">
            {t('achievements.title', 'Achievements')}
          </h1>
          <p className="achievements-page__subtitle">
            {t('achievements.subtitle', 'Gagne des badges, invite tes amis et grimpe dans le classement')}
          </p>
        </div>
      </div>

      <InviteEarnCard user={user} />
      <TopReferrers user={user} />
    </div>
  );
};

export default Achievements;