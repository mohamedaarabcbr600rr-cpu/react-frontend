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

const IconCheck = ({ size = 16, color = "#22c55e" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

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
        {badges.map((badge) => (
          <div key={badge.id} className={`invite-badge ${badge.unlocked ? 'invite-badge--unlocked' : ''}`}>
            <div className="invite-badge__emoji">{badge.emoji}</div>
            <div className="invite-badge__info">
              <div className="invite-badge__name">
                {badge.name}
                {badge.unlocked && <IconCheck size={14} />}
              </div>
              <div className="invite-badge__requirement">
                {t('invite.invitations', '{{count}} invitations', { count: badge.threshold })}
              </div>
              {!badge.unlocked && (
                <div className="invite-badge__bar">
                  <div className="invite-badge__bar-fill" style={{ width: `${badge.progress}%` }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {nextBadge && (
        <div className="invite-card__next">
          {t('invite.nextBadge', 'Plus que {{count}} invitations pour', { count: nextBadge.threshold - stats.referral_count })} {nextBadge.emoji} {nextBadge.name}
        </div>
      )}

      <div className="invite-card__link-row">
        <input type="text" className="invite-card__link-input" value={stats.referral_link} readOnly />
        <button className={`invite-card__copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
          {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
        </button>
      </div>

      <button className="invite-card__cta" onClick={handleShare}>
        {t('invite.inviteFriends', 'Invite Friends')}
      </button>
    </div>
  );
};

export default InviteEarnCard;