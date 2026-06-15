<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-sheet">
        <div class="modal-handle"></div>
        <div class="modal-header">
          <h2>{{ isEdit ? t('editTesterTitle') : t('addTesterTitle') }}</h2>
          <button class="btn-icon" @click="$emit('close')">✕</button>
        </div>
        <div class="modal-body">
          <!-- Name -->
          <div class="form-group">
            <label class="form-label">{{ t('name') }}</label>
            <input
              ref="nameInput"
              type="text"
              class="form-input"
              v-model="form.name"
              :placeholder="t('namePlaceholder')"
              maxlength="60"
              autocomplete="off"
            />
          </div>

          <!-- Platform -->
          <div class="form-group">
            <label class="form-label">{{ t('platform') }}</label>
            <input
              type="text"
              class="form-input"
              v-model="form.platform"
              :placeholder="t('platformPlaceholder')"
              maxlength="80"
              autocomplete="off"
            />
          </div>

          <!-- Description -->
          <div class="form-group">
            <label class="form-label">{{ t('description') }}</label>
            <textarea
              class="form-input form-textarea"
              v-model="form.description"
              :placeholder="t('descriptionPlaceholder')"
              maxlength="300"
              rows="3"
            />
            <div class="form-hint">{{ t('descriptionHint') }}</div>
          </div>

          <!-- Type -->
          <div class="form-group">
            <label class="form-label">{{ t('type') }}</label>
            <div class="type-toggle">
              <button
                class="type-opt"
                :class="{ 'active-exchange': form.type === 'Exchange' }"
                @click="form.type = 'Exchange'"
              >{{ t('exchange') }}</button>
              <button
                class="type-opt"
                :class="{ 'active-local': form.type === 'Local' }"
                @click="form.type = 'Local'"
              >{{ t('local') }}</button>
            </div>
          </div>

          <!-- Tags -->
          <div class="form-group">
            <label class="form-label">{{ t('tags') }}</label>
            <input
              type="text"
              class="form-input"
              v-model="tagsInput"
              :placeholder="t('tagsHint')"
              autocomplete="off"
            />
            <div class="form-hint">{{ t('tagsHint') }}</div>
            <div v-if="parsedTags.length" class="tags-preview">
              <span v-for="tag in parsedTags" :key="tag" class="tag-chip">{{ tag }}</span>
            </div>
          </div>

          <!-- Total Days -->
          <div class="form-group">
            <label class="form-label">{{ t('totalDays') }}</label>
            <div class="number-input-row">
              <button class="number-step-btn" @click="adjustDays(-1)">−</button>
              <input
                type="number"
                class="form-input"
                v-model.number="form.totalDays"
                min="1"
                :max="MAX_TOTAL_DAYS"
                @blur="form.totalDays = clampTotalDays(form.totalDays, store.settings.defaultDays)"
              />
              <button class="number-step-btn" @click="adjustDays(1)">+</button>
            </div>
          </div>

          <template v-if="!isEdit">
            <div class="form-group">
              <label class="form-label">{{ t('preCompletedDays') }}</label>
              <div class="number-input-row">
                <button class="number-step-btn" @click="adjustPreCompleted(-1)">−</button>
                <input
                  type="number"
                  class="form-input"
                  v-model.number="form.preCompletedDays"
                  min="0"
                  :max="form.totalDays"
                  @blur="clampPreCompleted()"
                />
                <button class="number-step-btn" @click="adjustPreCompleted(1)">+</button>
              </div>
              <div class="form-hint">{{ t('preCompletedDaysHint') }}</div>
            </div>
          </template>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="$emit('close')">{{ t('cancel') }}</button>
          <button
            class="btn btn-primary"
            :disabled="!form.name.trim()"
            @click="submit"
          >{{ isEdit ? t('save') : t('add') }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useTestersStore } from '../stores/useTesters'
import { useI18n } from '../i18n/index'
import { clampTotalDays, MAX_TOTAL_DAYS } from '../utils/constants'

const props = defineProps({
  tester: { type: Object, default: null },
})
const emit = defineEmits(['close'])

const store = useTestersStore()
const { t } = useI18n()

const isEdit = computed(() => !!props.tester)

const form = ref({
  name: props.tester?.name || '',
  platform: props.tester?.platform || '',
  description: props.tester?.description || '',
  type: props.tester?.type || 'Exchange',
  totalDays: props.tester?.totalDays || store.settings.defaultDays,
  preCompletedDays: 0,
})

watch(() => form.value.totalDays, () => {
  clampPreCompleted()
})

const tagsInput = ref(props.tester?.tags?.join(', ') || '')

const parsedTags = computed(() =>
  tagsInput.value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
)

const nameInput = ref(null)

onMounted(() => {
  setTimeout(() => nameInput.value?.focus(), 50)
})

function adjustDays(delta) {
  form.value.totalDays = clampTotalDays(form.value.totalDays + delta, store.settings.defaultDays)
}

function clampPreCompleted() {
  const max = form.value.totalDays
  form.value.preCompletedDays = Math.max(0, Math.min(max, Number(form.value.preCompletedDays) || 0))
}

function adjustPreCompleted(delta) {
  form.value.preCompletedDays = Math.max(
    0,
    Math.min(form.value.totalDays, (form.value.preCompletedDays || 0) + delta),
  )
}

function submit() {
  if (!form.value.name.trim()) return
  const data = {
    ...form.value,
    tags: parsedTags.value,
    totalDays: clampTotalDays(form.value.totalDays, store.settings.defaultDays),
  }
  if (isEdit.value) {
    store.updateTester(props.tester.id, data)
  } else {
    store.addTester({
      ...data,
      preCompletedDays: form.value.preCompletedDays || 0,
    })
  }
  emit('close')
}
</script>

<style scoped>
.tags-preview {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 4px;
}
.form-textarea {
  resize: vertical;
  min-height: 72px;
  line-height: 1.5;
}
</style>
