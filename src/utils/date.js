/**
 * 日期工具函数（使用本地时区，不依赖 UTC）
 */

/** 获取本地 YYYY-MM-DD 格式的今日日期 */
export function getTodayStr() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 日期字符串加 n 天（本地时区安全） */
export function addDays(dateStr, n) {
  const [y, mo, d] = dateStr.split('-').map(Number)
  const date = new Date(y, mo - 1, d)
  date.setDate(date.getDate() + n)
  return dateToStr(date)
}

/** Date 对象转 YYYY-MM-DD 字符串 */
export function dateToStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 根据加入日期和第几天（1-indexed）得到对应日期字符串 */
export function getDateForDay(joinedAt, dayNum) {
  return addDays(joinedAt, dayNum - 1)
}

/** 两个日期字符串之间相差天数（b - a） */
export function daysBetween(a, b) {
  const [y1, m1, d1] = a.split('-').map(Number)
  const [y2, m2, d2] = b.split('-').map(Number)
  const da = new Date(y1, m1 - 1, d1)
  const db = new Date(y2, m2 - 1, d2)
  return Math.round((db - da) / 86400000)
}

/** 根据加入日期计算当前是第几天（1-indexed，最小为1） */
export function getCurrentDayNum(joinedAt) {
  const today = getTodayStr()
  return Math.max(1, daysBetween(joinedAt, today) + 1)
}

/**
 * 格式化日期字符串用于展示
 * @param {string} dateStr - YYYY-MM-DD
 * @param {string} locale - BCP 47 locale string
 */
export function formatDate(dateStr, locale = 'en') {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })
}

/**
 * 格式化今天的日期展示（如 "14 Jun 2026"）
 */
export function formatToday(locale = 'en') {
  return new Date().toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })
}

/**
 * 判断测试员连续记录是否完好（每个过去的日子都有 activeToday）
 */
export function isStreakIntact(tester) {
  const today = getTodayStr()
  const dayNum = getCurrentDayNum(tester.joinedAt)
  const checkUntilDay = Math.min(dayNum - 1, tester.totalDays)
  for (let i = 1; i <= checkUntilDay; i++) {
    const dateStr = getDateForDay(tester.joinedAt, i)
    if (dateStr >= today) break
    if (!tester.checks[dateStr]?.activeToday) return false
  }
  return true
}

/** 统计已完成（activeToday 为 true）的天数 */
export function getCompletedDaysCount(tester) {
  return Object.values(tester.checks).filter(c => c.activeToday).length
}
