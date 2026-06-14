/** 测试任务最大天数 */
export const MAX_TOTAL_DAYS = 365

/** 超过此天数时，进度方块默认折叠 */
export const DAY_BOX_COLLAPSE_THRESHOLD = 42

export function clampTotalDays(value, fallback = 14) {
  const n = Number(value)
  if (!Number.isFinite(n)) return clampTotalDays(fallback, 14)
  return Math.max(1, Math.min(MAX_TOTAL_DAYS, Math.round(n)))
}
