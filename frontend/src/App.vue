<template>
  <router-view v-if="isStandalone" />
  <MainLayout v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'

const route = useRoute()
const isStandalone = computed(() => route.meta?.standalone === true)
</script>
