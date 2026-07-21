import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "../axios";
import { getBadgeProgress, getNextBadge } from "../utils/badges";
import './InviteEarnCard.css';

const IconCopy = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const IconCheck = ({ size = 16, color = "#ffffff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconStar = ({ size = 22, color = "#ffffff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z" />
  </svg>
);

const IconMedal = ({ size = 22, color = "#ffffff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="15" r="6" fill={color} stroke="none" opacity="0.25" />
    <circle cx="12" cy="15" r="6" />
    <path d="M9 9L6 2M15 9l3-7" />
    <path d="M10.5 15l1 1.5L14 13.5" />
  </svg>
);

const IconTrophy = ({ size = 22, color = "#ffffff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 21h8M12 17v4" />
    <path d="M7 4h10v6a5 5 0 0 1-10 0V4z" fill={color} opacity="0.25" />
    <path d="M7 4h10v6a5 5 0 0 1-10 0V4z" />
    <path d="M7 6H4a2 2 0 0 0 2 4M17 6h3a2 2 0 0 1-2 4" />
  </svg>
);

const IconGem = ({ size = 22, color = "#ffffff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 3h12l4 6-10 12L2 9z" fill={color} opacity="0.25" />
    <path d="M6 3h12l4 6-10 12L2 9z" />
    <path d="M2 9h20M9 3l3 6-3 12M15 3l-3 6 3 12" />
  </svg>
);

const IconCrown = ({ size = 22, color = "#ffffff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 8l4 4 5-7 5 7 4-4-2 11H5L3 8z" fill={color} opacity="0.25" />
    <path d="M3 8l4 4 5-7 5 7 4-4-2 11H5L3 8z" />
    <path d="M5 19h14" />
  </svg>
);

const BADGE_ICONS = {
  star: IconStar,
  medal: IconMedal,
  trophy: IconTrophy,
  gem: IconGem,
  crown: IconCrown,
};

const InviteEarnCard = ({ user, compact = false }) => {
  const [stats, setStats] = useState(null);
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/referral/stats');
        setStats(res.data);
      } catch (err) {
        console.error("Erreur referral stats:", err);
      }
    };
    fetchStats();
  }, [user?.id]);

  if (!user || !stats) return null;

  const badges = getBadgeProgress(stats.referral_count);
  const nextBadge = getNextBadge(stats.referral_count);

  const handleCopy = () => {
    navigator.clipboard.writeText(stats.referral_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Rejoins-moi sur Studmo',
          text: t('invite.shareText', "Rejoins-moi sur Studmo, la plateforme d'apprentissage entre étudiants !"),
          url: stats.referral_link,
        });
      } catch (err) {
        // user cancelled share — no-op
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className={`invite-card ${compact ? 'invite-card--compact' : ''}`}>
      <div className="invite-card__header">
        <span className="invite-card__title">🎁 {t('invite.title', 'Invite & Earn Badges')}</span>
      </div>

      <div className="invite-card__badges">
        {badges.map((badge) => {
          const Icon = BADGE_ICONS[badge.icon];
          const [c1, c2] = badge.color;
          return (
            <div key={badge.id} className={`invite-badge ${badge.unlocked ? 'invite-badge--unlocked' : ''}`}>
              <div
                className="invite-badge__icon"
                style={{
                  background: badge.unlocked
                    ? `linear-gradient(135deg, ${c1}, ${c2})`
                    : 'linear-gradient(135deg, #e2e8f0, #cbd5e1)',
                  boxShadow: badge.unlocked ? `0 4px 14px ${c2}55` : 'none',
                }}
              >
                <Icon size={20} color="#ffffff" />
              </div>
              <div className="invite-badge__info">
                <div className="invite-badge__name">
                  {badge.name}
                  {badge.unlocked && (
                    <span className="invite-badge__check">
                      <IconCheck size={11} />
                    </span>
                  )}
                </div>
                <div className="invite-badge__requirement">
                  {t('invite.invitations', '{{count}} invitations', { count: badge.threshold })}
                </div>
                {!badge.unlocked && (
                  <div className="invite-badge__progress-row">
                    <div className="invite-badge__bar">
                      <div
                        className="invite-badge__bar-fill"
                        style={{ width: `${badge.progress}%`, background: `linear-gradient(90deg, ${c1}, ${c2})` }}
                      />
                    </div>
                    <span className="invite-badge__count">{stats.referral_count} / {badge.threshold}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {nextBadge && (
        <div className="invite-card__next">
          {stats.referral_count === 0
            ? t('invite.nextBadgeFirst', '{{count}} more invites to unlock your first badge! 🌟', {
                count: nextBadge.threshold - stats.referral_count,
              })
            : t('invite.nextBadge', '{{count}} more invites to unlock {{name}}! 🌟', {
                count: nextBadge.threshold - stats.referral_count,
                name: nextBadge.name,
              })}
        </div>
      )}

      <div className="invite-card__link-row">
        <input type="text" className="invite-card__link-input" value={stats.referral_link} readOnly />
        <button className={`invite-card__copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
          {copied ? <IconCheck size={14} color="#22c55e" /> : <IconCopy size={14} />}
        </button>
      </div>

      <button className="invite-card__cta" onClick={handleShare}>
        {t('invite.inviteFriends', 'Invite Friends')}
      </button>
    </div>
  );
};

export default InviteEarnCard;