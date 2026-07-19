export const BADGE_TIERS = [
  { id: 'community_builder', emoji: '🌟', name: 'Community Builder', threshold: 3 },
  { id: 'campus_influencer', emoji: '🥈', name: 'Campus Influencer', threshold: 10 },
  { id: 'student_ambassador', emoji: '🥇', name: 'Student Ambassador', threshold: 25 },
  { id: 'founding_member', emoji: '💎', name: 'Founding Member', threshold: 50 },
  { id: 'studmo_legend', emoji: '👑', name: 'Studmo Legend', threshold: 100 },
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