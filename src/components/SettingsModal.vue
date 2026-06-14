<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-sheet">
        <div class="modal-handle"></div>
        <div class="modal-header">
          <h2>{{ t('settingsTitle') }}</h2>
          <button class="btn-icon" @click="$emit('close')">✕</button>
        </div>
        <div class="modal-body">
          <!-- Language -->
          <div class="form-group">
            <label class="form-label">{{ t('language') }}</label>
            <div class="lang-grid">
              <button
                v-for="lang in ['auto', ...SUPPORTED_LANGS]"
                :key="lang"
                class="lang-grid-opt"
                :class="{ active: settings.language === lang }"
                @click="settings.language = lang"
              >{{ LANG_NAMES[lang] }}</button>
            </div>
          </div>

          <!-- Target testers -->
          <div class="form-group">
            <label class="form-label">{{ t('targetTesters') }}</label>
            <div class="number-input-row">
              <button class="number-step-btn" @click="adjust('targetCount', -1)">−</button>
              <input
                type="number"
                class="form-input"
                v-model.number="settings.targetCount"
                min="1"
                max="100"
              />
              <button class="number-step-btn" @click="adjust('targetCount', 1)">+</button>
            </div>
          </div>

          <!-- Default days -->
          <div class="form-group">
            <label class="form-label">{{ t('defaultDays') }}</label>
            <div class="number-input-row">
              <button class="number-step-btn" @click="adjust('defaultDays', -1)">−</button>
              <input
                type="number"
                class="form-input"
                v-model.number="settings.defaultDays"
                min="1"
                :max="MAX_TOTAL_DAYS"
                @blur="store.updateSettings({ defaultDays: clampTotalDays(settings.defaultDays, 14) })"
              />
              <button class="number-step-btn" @click="adjust('defaultDays', 1)">+</button>
            </div>
          </div>

          <div class="settings-legal">
            <div class="settings-legal-title">{{ t('legalSection') }}</div>
            <div class="settings-legal-links">
              <a
                class="settings-legal-link"
                :href="LEGAL_PAGES.about"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ t('aboutG20') }}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
              <a
                class="settings-legal-link"
                :href="LEGAL_PAGES.privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ t('privacyPolicy') }}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
              <a
                class="settings-legal-link"
                :href="LEGAL_PAGES.terms"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ t('termsOfUse') }}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="$emit('close')">{{ t('save') }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useTestersStore } from '../stores/useTesters'
import { useI18n, SUPPORTED_LANGS, LANG_NAMES } from '../i18n/index'
import { clampTotalDays, MAX_TOTAL_DAYS } from '../utils/constants'
import { LEGAL_PAGES } from '../utils/site'

defineEmits(['close'])

const store = useTestersStore()
const { t } = useI18n()

const settings = computed(() => store.settings)

function adjust(field, delta) {
  const val = settings.value[field] + delta
  if (field === 'defaultDays') {
    store.updateSettings({ defaultDays: clampTotalDays(val, settings.value.defaultDays) })
  } else {
    store.updateSettings({ [field]: Math.max(1, Math.min(100, val)) })
  }
}
</script>

<style scoped>
.lang-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.lang-grid-opt {
  padding: 0.45rem 0.5rem;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  text-align: center;
  transition: all var(--transition);
  line-height: 1.3;
}
.lang-grid-opt:hover { color: var(--text); border-color: var(--border); }
.lang-grid-opt.active {
  background: var(--bg-card-hover);
  color: var(--text);
  border-color: var(--border);
  font-weight: 500;
}

.settings-legal {
  margin-top: 0.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-subtle);
}

.settings-legal-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 0.35rem;
}

.settings-legal-links {
  display: flex;
  flex-direction: column;
}

.settings-legal-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.55rem 0;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  border-bottom: 1px solid var(--border-subtle);
  transition: color var(--transition);
}

.settings-legal-link:last-child { border-bottom: none; }
.settings-legal-link:hover { color: var(--text); }
.settings-legal-link svg { opacity: 0.45; flex-shrink: 0; }
.settings-legal-link:hover svg { opacity: 0.75; }
</style>
