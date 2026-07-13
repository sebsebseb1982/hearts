/**
 * Computes a rotate+lower transform for card `index` of `total` so a hand renders as a fan:
 * cards rotate outward from the center and dip down at the edges (like a hand held pivoting
 * from below), with the spread capped so a full 13-card hand doesn't over-rotate.
 */
export function fanTransform(index, total, { maxAnglePerCard = 6, maxTotalAngle = 46, dipPerDegree = 1.1 } = {}) {
  if (total <= 1) return { angle: 0, dip: 0 };
  const center = (total - 1) / 2;
  const step = Math.min(maxAnglePerCard, maxTotalAngle / (total - 1));
  const angle = (index - center) * step;
  const dip = Math.abs(angle) * dipPerDegree;
  return { angle, dip };
}
