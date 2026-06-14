<template>
  <div v-if="allTags.length > 0" class="filter-bar">
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
</template>

<script setup>
import { computed } from 'vue'
import { useTestersStore } from '../stores/useTesters'
import { useI18n } from '../i18n/index'

const store = useTestersStore()
const { t } = useI18n()

const allTags = computed(() => store.allTags)
const tagFilter = computed(() => store.tagFilter)
</script>
