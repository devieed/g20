<template>
  <div id="app-root" :dir="isRTL ? 'rtl' : 'ltr'" :class="{ rtl: isRTL }">
    <div class="app-shell">
      <div class="app-container">
        <!-- ===== HEADER ===== -->
        <header class="app-header">
          <div class="app-header-brand">
            <div class="app-logo" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.9"/>
                <rect x="11" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.5"/>
                <rect x="1" y="11" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.5"/>
                <rect x="11" y="11" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.3"/>
              </svg>
            </div>
            <div class="app-header-left">
              <h1>{{ t('title') }}</h1>
              <div class="app-header-subtitle">
                {{ t('subtitle', { n: store.settings.targetCount, days: store.settings.defaultDays }) }}
              </div>
            </div>
          </div>
          <div class="app-header-right">
            <button class="settings-btn" @click="showSettings = true" :title="t('settingsTitle')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
            <div class="lang-selector" ref="langSelectorRef">
              <button class="lang-btn" @click="showLangMenu = !showLangMenu">
                <span class="lang-dot"></span>
                <span>{{ effectiveLang }}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              <Transition name="fade">
                <div v-if="showLangMenu" class="lang-dropdown">
                  <button
                    class="lang-option"
                    :class="{ active: store.settings.language === 'auto' }"
                    @click="setLang('auto')"
                  >{{ t('auto') }}</button>
                  <button
                    v-for="lang in SUPPORTED_LANGS"
                    :key="lang"
                    class="lang-option"
                    :class="{ active: store.settings.language === lang }"
                    @click="setLang(lang)"
                  >{{ LANG_NAMES[lang] }}</button>
                </div>
              </Transition>
            </div>
          </div>
        </header>

        <!-- ===== STATS ===== -->
        <StatsHeader />

        <!-- ===== WORKSPACE ===== -->
        <div class="workspace">
          <aside class="workspace-sidebar">
            <div class="tip-box">
              <span class="tip-text">{{ t('tip') }}</span>
            </div>

            <div class="today-panel card">
              <div class="today-date">{{ todayFormatted }}</div>
              <div v-if="store.activeTesterCount > 0" class="today-tiles">
                <div
                  class="today-tile tile-active"
                  :class="{ 'is-done': store.allCheckedToday }"
                >
                  <span class="tile-value">{{ store.checkedTodayCount }}/{{ store.activeTesterCount }}</span>
                  <span class="tile-label">{{ t('trackTheirTest') }}</span>
                </div>
                <div
                  class="today-tile tile-reply"
                  :class="{ 'is-done': store.repliedTodayCount === store.activeTesterCount }"
                >
                  <span class="tile-value">{{ store.repliedTodayCount }}/{{ store.activeTesterCount }}</span>
                  <span class="tile-label">{{ t('trackMyReply') }}</span>
                </div>
              </div>
              <p v-if="todayHint" class="today-hint">{{ todayHint }}</p>
            </div>

            <FilterBar />
          </aside>

          <main class="workspace-main">
            <div class="tester-grid">
              <div v-if="store.activeTestersList.length === 0 && !store.showDropped" class="empty-state">
                <div class="empty-state-text">{{ t('noTesters') }}</div>
              </div>

              <TransitionGroup name="list" tag="div" class="tester-cards">
                <TesterCard
                  v-for="tester in store.filteredTesters"
                  :key="tester.id"
                  :tester="tester"
                  @edit="openEdit"
                />
              </TransitionGroup>

              <div v-if="store.droppedTestersList.length > 0" class="section-divider">
                <div class="section-divider-line"></div>
                <button class="section-divider-btn" @click="store.toggleShowDropped()">
                  {{ store.showDropped ? t('hideDropped') : t('showDropped') }}
                  ({{ store.droppedTestersList.length }})
                </button>
                <div class="section-divider-line"></div>
              </div>

              <button class="add-tester-btn" @click="openAdd">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                {{ t('addTester') }}
              </button>
            </div>
          </main>
        </div>

        <footer class="app-footer">{{ t('footer') }} · G20</footer>
      </div>
    </div>

    <Transition name="fade">
      <AddTesterModal
        v-if="showAddModal || editingTester"
        :tester="editingTester"
        @close="closeModal"
      />
    </Transition>

    <Transition name="fade">
      <SettingsModal v-if="showSettings" @close="showSettings = false" />
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useTestersStore } from './stores/useTesters'
import { useI18n, SUPPORTED_LANGS, LANG_NAMES } from './i18n/index'
import { formatToday } from './utils/date'
import { SITE_TAGLINE } from './utils/site'
import StatsHeader from './components/StatsHeader.vue'
import FilterBar from './components/FilterBar.vue'
import TesterCard from './components/TesterCard.vue'
import AddTesterModal from './components/AddTesterModal.vue'
import SettingsModal from './components/SettingsModal.vue'

const store = useTestersStore()
const { t, effectiveLang, locale, isRTL } = useI18n()

const showAddModal = ref(false)
const editingTester = ref(null)
const showSettings = ref(false)
const showLangMenu = ref(false)
const langSelectorRef = ref(null)

const todayFormatted = computed(() => formatToday(locale.value))

const todayHint = computed(() => {
  const total = store.activeTesterCount
  if (total === 0) return ''
  if (store.mutualDoneTodayCount === total) return ''
  if (!store.allCheckedToday) {
    return t('todayHintWaiting', { n: store.uncheckedTodayCount })
  }
  return t('todayHintReply', { n: store.pendingReplyTodayCount })
})

function openAdd() {
  editingTester.value = null
  showAddModal.value = true
}

function openEdit(tester) {
  editingTester.value = tester
  showAddModal.value = false
}

function closeModal() {
  showAddModal.value = false
  editingTester.value = null
}

function setLang(lang) {
  store.updateSettings({ language: lang })
  showLangMenu.value = false
}

function handleClickOutside(e) {
  if (langSelectorRef.value && !langSelectorRef.value.contains(e.target)) {
    showLangMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

watch(
  effectiveLang,
  () => {
    document.title = `${t('title')} — ${SITE_TAGLINE}`
  },
  { immediate: true },
)
</script>
