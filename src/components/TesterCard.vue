<template>
  <div
    class="tester-card"
    :class="{
      'is-dropped': tester.dropped,
      'is-completed': status === 'completed' && !tester.dropped,
      'is-broken': status === 'broken' && !tester.dropped,
    }"
  >
    <div class="card-top">
      <div class="card-name-row">
        <span class="card-name">{{ tester.name }}</span>
        <span class="badge" :class="tester.type === 'Exchange' ? 'badge-exchange' : 'badge-local'">
          {{ t(tester.type === 'Exchange' ? 'exchange' : 'local') }}
        </span>
        <span v-if="status === 'completed'" class="badge badge-completed">{{ t('completed') }}</span>
        <span v-else-if="status === 'broken'" class="badge badge-broken">{{ t('streakBroken') }}</span>
        <span v-else-if="tester.dropped" class="badge badge-dropped">{{ t('dropped') }}</span>
      </div>
      <div class="card-icons">
        <button class="btn-icon" @click="handleExport" :title="t('exportCsv')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
        <button class="btn-icon" @click="$emit('edit', tester)" title="Edit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="btn-icon btn-icon--danger" @click="confirmDelete" title="Delete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    </div>

    <div v-if="tester.platform" class="card-platform">{{ tester.platform }}</div>
    <div v-if="tester.description" class="card-description">{{ tester.description }}</div>

    <div v-if="tester.tags?.length" class="card-tags">
      <span v-for="tag in tester.tags" :key="tag" class="tag-chip">{{ tag }}</span>
    </div>

    <div class="card-meta-row">
      <span class="card-joined">{{ t('joined') }} {{ formattedJoinDate }}</span>
    </div>

    <!-- 每日进度方块：绿色=对方活跃，蓝点/蓝底=已回测 -->
    <div class="tracks-block">
      <div class="track-line-head">
        <span class="track-line-title">{{ t('day') }} {{ currentDay }} {{ t('of') }} {{ tester.totalDays }}</span>
        <span class="track-line-meta">{{ t('replyTotalCount', { n: repliedCount }) }}</span>
      </div>
      <div
        class="day-boxes-wrap"
        :class="{ 'is-collapsed': needsCollapse && !isExpanded, 'is-expanded': needsCollapse && isExpanded }"
      >
        <div class="day-boxes">
          <div
            v-for="n in tester.totalDays"
            :key="n"
            class="day-box"
            :class="getBoxClasses(n)"
            :title="dayBoxTitle(n)"
          />
        </div>
      </div>

      <div class="box-legend">
        <span class="legend-item"><i class="legend-swatch legend-swatch--active"></i>{{ t('boxLegendActive') }}</span>
        <span class="legend-item"><i class="legend-swatch legend-swatch--both"></i>{{ t('boxLegendBoth') }}</span>
        <span class="legend-item"><i class="legend-swatch legend-swatch--reply"></i>{{ t('boxLegendReplyOnly') }}</span>
      </div>

      <button
        v-if="needsCollapse"
        type="button"
        class="day-boxes-toggle"
        @click="isExpanded = !isExpanded"
      >
        {{ isExpanded ? t('collapseDays') : t('expandDays', { n: tester.totalDays }) }}
      </button>

      <div v-if="!tester.dropped && status !== 'completed'" class="track-actions-wrap">
        <div class="track-actions-labels">
          <span>{{ t('btnLabelTheir') }}</span>
          <span>{{ t('btnLabelMine') }}</span>
        </div>
        <div class="track-actions">
          <button
            class="btn-active-today"
            :class="{ activated: isActiveTodayChecked }"
            @click="store.toggleActiveToday(tester.id)"
          >
            <span v-if="isActiveTodayChecked" class="btn-check">✓</span>
            {{ t('activeToday') }}
          </button>
          <button
            class="btn-i-replied"
            :class="{ activated: isIRepliedChecked }"
            @click="store.toggleIReplied(tester.id)"
          >
            <span v-if="isIRepliedChecked" class="btn-check">✓</span>
            {{ isIRepliedChecked ? t('unmarkReplyToday') : t('markReplyToday') }}
          </button>
        </div>
      </div>
    </div>

    <div class="card-footer-row">
      <button class="btn-mark-dropped" :class="{ restore: tester.dropped }" @click="store.toggleDropped(tester.id)">
        {{ tester.dropped ? t('undoDrop') : t('markDropped') }}
      </button>
    </div>

    <Transition name="fade">
      <div v-if="showDeleteConfirm" class="delete-confirm-overlay" @click.self="showDeleteConfirm = false">
        <div class="delete-confirm-box">
          <p>{{ t('deleteConfirm') }}</p>
          <div class="delete-confirm-btns">
            <button class="btn btn-ghost" style="flex:1" @click="showDeleteConfirm = false">{{ t('cancel') }}</button>
            <button class="btn btn-danger" style="flex:1" @click="doDelete">{{ t('confirmDropBtn') }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTestersStore } from '../stores/useTesters'
import { useI18n } from '../i18n/index'
import { formatDate, getDateForDay } from '../utils/date'
import { downloadTesterCsv } from '../utils/export'
import { DAY_BOX_COLLAPSE_THRESHOLD } from '../utils/constants'

const props = defineProps({
  tester: { type: Object, required: true },
})
defineEmits(['edit'])

const store = useTestersStore()
const { t, locale } = useI18n()

const showDeleteConfirm = ref(false)
const isExpanded = ref(false)

const status = computed(() => store.getTesterStatus(props.tester))
const currentDay = computed(() => store.getTesterCurrentDay(props.tester))
const needsCollapse = computed(() => props.tester.totalDays > DAY_BOX_COLLAPSE_THRESHOLD)
const repliedCount = computed(() => store.getRepliedDaysCount(props.tester))

const isActiveTodayChecked = computed(() =>
  !!props.tester.checks[store.todayStr]?.activeToday
)
const isIRepliedChecked = computed(() =>
  !!props.tester.checks[store.todayStr]?.iReplied
)

const formattedJoinDate = computed(() =>
  formatDate(props.tester.joinedAt, locale.value)
)

function getBoxClasses(n) {
  const base = store.getDayBoxState(props.tester, n)
  const replied = store.hasReplyOnDay(props.tester, n)
  const active = store.hasActiveOnDay(props.tester, n)
  return {
    [base]: true,
    'has-reply': replied && active,
    'reply-only': replied && !active && base !== 'future',
  }
}

function dayBoxTitle(n) {
  const date = getDateForDay(props.tester.joinedAt, n)
  const check = props.tester.checks[date] || {}
  const parts = [`${t('day')} ${n} · ${date}`]
  if (check.activeToday) parts.push(t('activeToday'))
  if (check.iReplied) parts.push(t('markReplyToday'))
  return parts.join(' · ')
}

function handleExport() {
  downloadTesterCsv(props.tester)
}

function confirmDelete() {
  showDeleteConfirm.value = true
}

function doDelete() {
  store.removeTester(props.tester.id)
  showDeleteConfirm.value = false
}
</script>

<style scoped>
.delete-confirm-overlay {
  position: absolute;
  inset: 0;
  background: rgba(9, 9, 11, 0.92);
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
.delete-confirm-box { padding: 1rem; text-align: center; width: 100%; }
.delete-confirm-box p { margin-bottom: 0.75rem; font-weight: 600; color: var(--text); }
.delete-confirm-btns { display: flex; gap: 8px; }
.tester-card { position: relative; overflow: hidden; }
.btn-icon--danger { color: var(--red); opacity: 0.7; }
.btn-icon--danger:hover { opacity: 1; }

.card-description {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 6px;
  white-space: pre-wrap;
  word-break: break-word;
}

.tracks-block {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.track-line-head { display: flex; align-items: center; justify-content: space-between; }
.track-line-title { font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); }
.track-line-meta {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted);
}

.card-meta-row {
  margin-bottom: 0.35rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.box-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-top: 2px;
}
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.68rem;
  color: var(--text-muted);
}
.legend-swatch {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  border: 1.5px solid var(--day-empty-border);
  background: var(--day-empty-bg);
  flex-shrink: 0;
  position: relative;
}
.legend-swatch--active {
  background: var(--green);
  border-color: var(--green);
}
.legend-swatch--both {
  background: var(--green);
  border-color: var(--green);
}
.legend-swatch--both::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: 0;
  width: 5px;
  height: 5px;
  background: var(--blue);
  border-radius: 1px;
}
.legend-swatch--reply {
  background: var(--blue-dim);
  border-color: var(--blue);
}

.track-actions-wrap {
  padding-top: 0.35rem;
  border-top: 1px solid var(--border-subtle);
}

.track-actions-labels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-bottom: 5px;
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-muted);
  text-align: center;
}
.track-actions-labels span:first-child { color: var(--green); opacity: 0.85; }
.track-actions-labels span:last-child { color: var(--blue); opacity: 0.85; }

.track-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.btn-check {
  margin-right: 2px;
  font-weight: 700;
}

.day-boxes-wrap.is-collapsed { max-height: 34px; overflow: hidden; position: relative; }
.day-boxes-wrap.is-collapsed::after {
  content: '';
  position: absolute; left: 0; right: 0; bottom: 0; height: 12px;
  background: linear-gradient(to bottom, transparent, var(--bg-input));
  pointer-events: none;
}
.day-boxes-wrap.is-expanded { max-height: 100px; overflow-y: auto; padding-right: 2px; }

.day-boxes-toggle {
  align-self: flex-start;
  background: transparent; border: none;
  color: var(--text-muted); font-size: 0.72rem; font-weight: 600;
  padding: 0; cursor: pointer;
}
.day-boxes-toggle:hover { color: var(--text-secondary); }
</style>
