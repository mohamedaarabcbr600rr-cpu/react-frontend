import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "../axios";
import { getBadgeProgress, getNextBadge } from "../utils/badges";
import './InviteEarnCard.css';

// ... (icônes inchangées) ...

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
          title: t("invite.shareTitle"),
          text: t("invite.shareText"),
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
        <span className="invite-card__title">🎁 {t("invite.title")}</span>
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
                  {t(`invite.badges.${badge.id}.name`, badge.name)}
                  {badge.unlocked && (
                    <span className="invite-badge__check">
                      <IconCheck size={11} />
                    </span>
                  )}
                </div>
                <div className="invite-badge__requirement">
                  {t("invite.invitations", { count: badge.threshold })}
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
            ? t("invite.nextBadgeFirst", { count: nextBadge.threshold - stats.referral_count })
            : t("invite.nextBadge", {
                count: nextBadge.threshold - stats.referral_count,
                name: t(`invite.badges.${nextBadge.id}.name`, nextBadge.name),
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
        {t("invite.inviteFriends")}
      </button>
    </div>
  );
};

export default InviteEarnCard;