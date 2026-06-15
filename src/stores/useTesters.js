import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { getTodayStr, getDateForDay, getCurrentDayNum, isStreakIntact, getCompletedDaysCount, addDays, dateToStr, setupTesterFromPreDays } from '../utils/date'
import { clampTotalDays } from '../utils/constants'
import { createDemoTester, hasUsedAppBefore, markOnboardingDone } from '../utils/demoTester'

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem('tester-tracker-' + key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem('tester-tracker-' + key, JSON.stringify(value))
  } catch {
    // ignore storage errors
  }
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

/** 仅首次打开网站时注入示例任务；老用户或已标记过的用户跳过 */
function applyFirstVisitDemo(testersRef) {
  if (hasUsedAppBefore()) {
    markOnboardingDone()
    return
  }
  testersRef.value.push(createDemoTester())
  markOnboardingDone()
}

export const useTestersStore = defineStore('testers', () => {
  const testers = ref(loadFromStorage('testers', []))
  applyFirstVisitDemo(testers)
  const settings = ref(loadFromStorage('settings', {
    language: 'auto',
    targetCount: 12,
    defaultDays: 14,
  }))
  const tagFilter = ref(null)
  /** null=不限, true=仅今日已活跃, false=仅今日未活跃 */
  const activeTodayFilter = ref(null)
  /** null=不限, true=仅今日已回测, false=仅今日未回测 */
  const repliedTodayFilter = ref(null)
  const showDropped = ref(false)

  // 自动持久化到 localStorage
  watch(testers, (v) => saveToStorage('testers', v), { deep: true })
  watch(settings, (v) => saveToStorage('settings', v), { deep: true })

  // ---- 计算属性 ----

  const todayStr = computed(() => getTodayStr())

  /** 非退出的测试员列表 */
  const activeTestersList = computed(() =>
    testers.value.filter(t => !t.dropped)
  )

  /** 已退出的测试员列表 */
  const droppedTestersList = computed(() =>
    testers.value.filter(t => t.dropped)
  )

  /** 活跃测试员数量（未退出且未完成） */
  const activeTesterCount = computed(() => activeTestersList.value.length)

  /** 已完成所有天数的测试员数量 */
  const doneTesterCount = computed(() =>
    activeTestersList.value.filter(t => getCompletedDaysCount(t) >= t.totalDays).length
  )

  /** 今日已标记 activeToday 的测试员数量 */
  const checkedTodayCount = computed(() =>
    activeTestersList.value.filter(t => t.checks[todayStr.value]?.activeToday).length
  )

  /** 预计最晚通过日期 */
  const estPassDate = computed(() => {
    if (activeTestersList.value.length === 0) return null
    let latest = null
    for (const t of activeTestersList.value) {
      const passDate = new Date(addDays(t.joinedAt, t.totalDays - 1))
      if (!latest || passDate > latest) latest = passDate
    }
    return latest ? dateToStr(latest) : null
  })

  /** 距离预计通过日期还有多少天 */
  const daysUntilPass = computed(() => {
    if (!estPassDate.value) return null
    const today = getTodayStr()
    if (estPassDate.value <= today) return 0
    const [y1, m1, d1] = today.split('-').map(Number)
    const [y2, m2, d2] = estPassDate.value.split('-').map(Number)
    const a = new Date(y1, m1 - 1, d1)
    const b = new Date(y2, m2 - 1, d2)
    return Math.ceil((b - a) / 86400000)
  })

  /** 所有标签（去重） */
  const allTags = computed(() => {
    const tags = new Set()
    testers.value.forEach(t => t.tags?.forEach(tag => tags.add(tag)))
    return [...tags].sort()
  })

  /** 根据标签与今日状态筛选；保持添加顺序，不做今日勾选排序 */
  const filteredTesters = computed(() => {
    let list = showDropped.value ? testers.value : activeTestersList.value
    if (tagFilter.value) {
      list = list.filter(t => t.tags?.includes(tagFilter.value))
    }
    if (activeTodayFilter.value !== null) {
      list = list.filter(t => !!t.checks[todayStr.value]?.activeToday === activeTodayFilter.value)
    }
    if (repliedTodayFilter.value !== null) {
      list = list.filter(t => !!t.checks[todayStr.value]?.iReplied === repliedTodayFilter.value)
    }
    const order = new Map(testers.value.map((t, i) => [t.id, i]))
    return [...list].sort((a, b) => {
      if (a.dropped !== b.dropped) return a.dropped ? 1 : -1
      return (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
    })
  })

  /** 今日是否所有活跃测试员都已检查 */
  const allCheckedToday = computed(() =>
    activeTestersList.value.length > 0 &&
    activeTestersList.value.every(t => t.checks[todayStr.value]?.activeToday)
  )

  /** 今日待检查的剩余数量 */
  const uncheckedTodayCount = computed(() =>
    activeTestersList.value.filter(t => !t.checks[todayStr.value]?.activeToday).length
  )

  /** 今日已标记 iReplied 的测试员数量 */
  const repliedTodayCount = computed(() =>
    activeTestersList.value.filter(t => t.checks[todayStr.value]?.iReplied).length
  )

  /** 今日双方互测都完成的数量 */
  const mutualDoneTodayCount = computed(() =>
    activeTestersList.value.filter(t => {
      const c = t.checks[todayStr.value]
      return c?.activeToday && c?.iReplied
    }).length
  )

  /** 今日还需回复（测对方）的数量 */
  const pendingReplyTodayCount = computed(() =>
    activeTestersList.value.filter(t => !t.checks[todayStr.value]?.iReplied).length
  )

  // ---- 操作 ----

  function addTester(data) {
    const totalDays = clampTotalDays(data.totalDays, settings.value.defaultDays)
    const preDays = Math.max(0, Math.min(Math.floor(Number(data.preCompletedDays) || 0), totalDays))
    const { joinedAt, checks } = setupTesterFromPreDays(preDays)
    testers.value.push({
      id: genId(),
      name: data.name.trim(),
      platform: (data.platform || '').trim(),
      description: (data.description || '').trim(),
      type: data.type || 'Exchange',
      tags: data.tags || [],
      totalDays,
      joinedAt,
      dropped: false,
      checks,
    })
  }

  function removeTester(id) {
    const idx = testers.value.findIndex(t => t.id === id)
    if (idx >= 0) testers.value.splice(idx, 1)
  }

  function updateTester(id, data) {
    const tester = testers.value.find(t => t.id === id)
    if (tester) {
      if (data.name !== undefined) tester.name = data.name.trim()
      if (data.platform !== undefined) tester.platform = data.platform.trim()
      if (data.description !== undefined) tester.description = data.description.trim()
      if (data.type !== undefined) tester.type = data.type
      if (data.tags !== undefined) tester.tags = data.tags
      if (data.totalDays !== undefined) tester.totalDays = clampTotalDays(data.totalDays, tester.totalDays)
    }
  }

  function toggleActiveToday(id) {
    const tester = testers.value.find(t => t.id === id)
    if (!tester || tester.dropped) return
    const today = todayStr.value
    if (!tester.checks[today]) {
      tester.checks[today] = { activeToday: false, iReplied: false }
    }
    tester.checks[today] = { ...tester.checks[today], activeToday: !tester.checks[today].activeToday }
  }

  function toggleIReplied(id) {
    const tester = testers.value.find(t => t.id === id)
    if (!tester || tester.dropped) return
    const today = todayStr.value
    if (!tester.checks[today]) {
      tester.checks[today] = { activeToday: false, iReplied: false }
    }
    tester.checks[today] = { ...tester.checks[today], iReplied: !tester.checks[today].iReplied }
  }

  function toggleDropped(id) {
    const tester = testers.value.find(t => t.id === id)
    if (tester) tester.dropped = !tester.dropped
  }

  function setTagFilter(tag) {
    tagFilter.value = tagFilter.value === tag ? null : tag
  }

  function setActiveTodayFilter(value) {
    activeTodayFilter.value = activeTodayFilter.value === value ? null : value
  }

  function setRepliedTodayFilter(value) {
    repliedTodayFilter.value = repliedTodayFilter.value === value ? null : value
  }

  function clearStatusFilters() {
    activeTodayFilter.value = null
    repliedTodayFilter.value = null
  }

  function updateSettings(data) {
    const next = { ...data }
    if (next.defaultDays !== undefined) {
      next.defaultDays = clampTotalDays(next.defaultDays, settings.value.defaultDays)
    }
    Object.assign(settings.value, next)
  }

  function toggleShowDropped() {
    showDropped.value = !showDropped.value
  }

  // 导出辅助函数供组件使用
  function getTesterStatus(tester) {
    const completedDays = getCompletedDaysCount(tester)
    if (completedDays >= tester.totalDays) return 'completed'
    if (tester.dropped) return 'dropped'
    if (!isStreakIntact(tester)) return 'broken'
    return 'active'
  }

  function getDayBoxState(tester, dayNum) {
    const today = todayStr.value
    const dateStr = getDateForDay(tester.joinedAt, dayNum)
    const check = tester.checks[dateStr]
    if (dateStr === today) return check?.activeToday ? 'today-active' : 'today'
    if (dateStr < today) return check?.activeToday ? 'active' : 'missed'
    return 'future'
  }

  function hasReplyOnDay(tester, dayNum) {
    const dateStr = getDateForDay(tester.joinedAt, dayNum)
    return !!tester.checks[dateStr]?.iReplied
  }

  function hasActiveOnDay(tester, dayNum) {
    const dateStr = getDateForDay(tester.joinedAt, dayNum)
    return !!tester.checks[dateStr]?.activeToday
  }

  function getRepliedDaysCount(tester) {
    return Object.values(tester.checks).filter(c => c.iReplied).length
  }

  /** 所有已回测日期，新到旧 */
  function getReplyDates(tester) {
    return Object.entries(tester.checks)
      .filter(([, c]) => c.iReplied)
      .map(([date]) => date)
      .sort((a, b) => b.localeCompare(a))
  }

  function getTesterCurrentDay(tester) {
    return Math.min(getCurrentDayNum(tester.joinedAt), tester.totalDays)
  }

  return {
    testers,
    settings,
    tagFilter,
    activeTodayFilter,
    repliedTodayFilter,
    showDropped,
    todayStr,
    activeTestersList,
    droppedTestersList,
    activeTesterCount,
    doneTesterCount,
    checkedTodayCount,
    estPassDate,
    daysUntilPass,
    allTags,
    filteredTesters,
    allCheckedToday,
    uncheckedTodayCount,
    repliedTodayCount,
    mutualDoneTodayCount,
    pendingReplyTodayCount,
    addTester,
    removeTester,
    updateTester,
    toggleActiveToday,
    toggleIReplied,
    toggleDropped,
    setTagFilter,
    setActiveTodayFilter,
    setRepliedTodayFilter,
    clearStatusFilters,
    updateSettings,
    toggleShowDropped,
    getTesterStatus,
    getDayBoxState,
    hasReplyOnDay,
    hasActiveOnDay,
    getRepliedDaysCount,
    getReplyDates,
    getTesterCurrentDay,
  }
})
