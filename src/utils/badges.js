export const BADGE_TIERS = [
  { id: 'community_builder', icon: 'star', color: ['#fbbf24', '#f59e0b'], name: 'Community Builder', threshold: 3 },
  { id: 'campus_influencer', icon: 'medal', color: ['#94a3b8', '#64748b'], name: 'Campus Influencer', threshold: 10 },
  { id: 'student_ambassador', icon: 'trophy', color: ['#fbbf24', '#d97706'], name: 'Student Ambassador', threshold: 25 },
  { id: 'founding_member', icon: 'gem', color: ['#38bdf8', '#0ea5e9'], name: 'Founding Member', threshold: 50 },
  { id: 'studmo_legend', icon: 'crown', color: ['#a855f7', '#7c3aed'], name: 'Studmo Legend', threshold: 100 },
];

export function getBadgeProgress(referralCount) {
  return BADGE_TIERS.map((tier, index) => {
    const unlocked = referralCount >= tier.threshold;
    const prevThreshold = index === 0 ? 0 : BADGE_TIERS[index - 1].threshold;
    const progress = Math.min(
      100,
      Math.round(((referralCount - prevThreshold) / (tier.threshold - prevThreshold)) * 100)
    );
    return { ...tier, unlocked, progress: Math.max(0, progress) };
  });
}

export function getNextBadge(referralCount) {
  return BADGE_TIERS.find(tier => referralCount < tier.threshold) || null;
}


export function getBadgeForCount(referralCount) {
  const unlocked = BADGE_TIERS.filter(tier => referralCount >= tier.threshold);
  return unlocked.length > 0 ? unlocked[unlocked.length - 1] : null;
}