<template>
  <div class="filter-panel">
    <div class="filter-section">
      <div class="filter-section-head">
        <span class="filter-section-label">{{ t('filterByStatus') }}</span>
        <button
          v-if="hasStatusFilter"
          type="button"
          class="filter-clear-btn"
          @click="store.clearStatusFilters()"
        >{{ t('filterClear') }}</button>
      </div>
      <div class="status-filter-grid">
        <button
          type="button"
          class="status-filter-btn btn-active-today"
          :class="{ activated: activeTodayFilter === true }"
          @click="store.setActiveTodayFilter(true)"
        >{{ t('filterActiveYes') }}</button>
        <button
          type="button"
          class="status-filter-btn btn-active-today"
          :class="{ activated: activeTodayFilter === false }"
          @click="store.setActiveTodayFilter(false)"
        >{{ t('filterActiveNo') }}</button>
        <button
          type="button"
          class="status-filter-btn btn-i-replied"
          :class="{ activated: repliedTodayFilter === true }"
          @click="store.setRepliedTodayFilter(true)"
        >{{ t('filterReplyYes') }}</button>
        <button
          type="button"
          class="status-filter-btn btn-i-replied"
          :class="{ activated: repliedTodayFilter === false }"
          @click="store.setRepliedTodayFilter(false)"
        >{{ t('filterReplyNo') }}</button>
      </div>
    </div>

    <div v-if="allTags.length > 0" class="filter-section">
      <div class="filter-section-label">{{ t('filterByTag') }}</div>
      <div class="filter-bar">
        <button
          class="filter-tag"
          :class="{ active: !tagFilter }"
          @click="store.setTagFilter(null)"
        >{{ t('all') }}</button>
        <button
          v-for="tag in allTags"
          :key="tag"
          class="filter-tag"
          :class="{ active: tagFilter === tag }"
          @click="store.setTagFilter(tag)"
        >{{ tag }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTestersStore } from '../stores/useTesters'
import { useI18n } from '../i18n/index'

const store = useTestersStore()
const { t } = useI18n()

const allTags = computed(() => store.allTags)
const tagFilter = computed(() => store.tagFilter)
const activeTodayFilter = computed(() => store.activeTodayFilter)
const repliedTodayFilter = computed(() => store.repliedTodayFilter)
const hasStatusFilter = computed(() =>
  store.activeTodayFilter !== null || store.repliedTodayFilter !== null
)
</script>

<style scoped>
.filter-panel {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.filter-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.45rem;
}

.filter-section-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
}

.filter-clear-btn {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
}
.filter-clear-btn:hover { color: var(--text-secondary); }

.status-filter-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.status-filter-btn {
  font-size: 0.72rem;
  padding: 0.48rem 0.35rem;
  cursor: pointer;
}
</style>
