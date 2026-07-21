import React from "react";
import { getBadgeForCount } from "../utils/badges";

const IconStar = ({ size = 14, color = "#ffffff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z" />
  </svg>
);
const IconMedal = ({ size = 14, color = "#ffffff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="15" r="6" fill={color} stroke="none" opacity="0.25" />
    <circle cx="12" cy="15" r="6" />
    <path d="M9 9L6 2M15 9l3-7" />
  </svg>
);
const IconTrophy = ({ size = 14, color = "#ffffff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 4h10v6a5 5 0 0 1-10 0V4z" fill={color} opacity="0.25" />
    <path d="M7 4h10v6a5 5 0 0 1-10 0V4z" />
    <path d="M7 6H4a2 2 0 0 0 2 4M17 6h3a2 2 0 0 1-2 4" />
  </svg>
);
const IconGem = ({ size = 14, color = "#ffffff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 3h12l4 6-10 12L2 9z" fill={color} opacity="0.25" />
    <path d="M6 3h12l4 6-10 12L2 9z" />
  </svg>
);
const IconCrown = ({ size = 14, color = "#ffffff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 8l4 4 5-7 5 7 4-4-2 11H5L3 8z" fill={color} opacity="0.25" />
    <path d="M3 8l4 4 5-7 5 7 4-4-2 11H5L3 8z" />
  </svg>
);

const BADGE_ICONS = { star: IconStar, medal: IconMedal, trophy: IconTrophy, gem: IconGem, crown: IconCrown };

const UserBadge = ({ referralCount, size = 16 }) => {
  const badge = getBadgeForCount(referralCount || 0);
  if (!badge) return null;

  const Icon = BADGE_ICONS[badge.icon] || IconStar;
  const [c1, c2] = badge.color;

  return (
    <span
      className="user-badge"
      title={badge.name}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
        flexShrink: 0,
        marginLeft: 4,
        boxShadow: `0 1px 4px ${c2}55`,
      }}
    >
      <Icon size={size * 0.65} color="#ffffff" />
    </span>
  );
};

export default UserBadge;