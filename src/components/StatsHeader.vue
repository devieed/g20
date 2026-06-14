<template>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">{{ t('activeTesters') }}</div>
      <div class="stat-value" :class="activeTesterCount >= targetCount ? 'val-green' : 'val-orange'">
        {{ activeTesterCount }}<span class="stat-denom">/{{ targetCount }}</span>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-label">{{ t('daysDone', { n: settings.defaultDays }) }}</div>
      <div class="stat-value" :class="doneTesterCount > 0 ? 'val-green' : ''">
        {{ doneTesterCount }}
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-label">{{ t('checkedToday') }}</div>
      <div class="stat-value" :class="checkedTodayCount > 0 ? 'val-blue' : ''">
        {{ checkedTodayCount }}<span class="stat-denom">/{{ activeTesterCount }}</span>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-label">{{ t('estPassDate') }}</div>
      <div v-if="estPassDate" class="stat-value val-green stat-value--sm">
        {{ daysUntilPass }} {{ t('days') }}
      </div>
      <div v-else class="stat-value stat-value--empty">—</div>
      <div v-if="estPassDate" class="stat-sub">{{ formatDate(estPassDate, locale) }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTestersStore } from '../stores/useTesters'
import { useI18n } from '../i18n/index'
import { formatDate } from '../utils/date'

const store = useTestersStore()
const { t, locale } = useI18n()

const activeTesterCount = computed(() => store.activeTesterCount)
const doneTesterCount = computed(() => store.doneTesterCount)
const checkedTodayCount = computed(() => store.checkedTodayCount)
const estPassDate = computed(() => store.estPassDate)
const daysUntilPass = computed(() => store.daysUntilPass)
const settings = computed(() => store.settings)
const targetCount = computed(() => store.settings.targetCount)
</script>

<style scoped>
.stat-denom {
  color: var(--text-muted);
  font-size: 0.6em;
  font-weight: 400;
  margin-left: 1px;
}

.stat-value--sm { font-size: clamp(1.1rem, 2.5vw, 1.35rem) !important; }
.stat-value--empty { color: var(--text-muted); font-size: 1.1rem !important; font-weight: 400 !important; }

.val-green { color: var(--green); }
.val-orange { color: var(--orange); }
.val-blue { color: var(--blue); }
</style>
