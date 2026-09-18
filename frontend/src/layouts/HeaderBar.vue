<template>
  <div class="header-bar">
    <div class="header-left">
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item v-if="group" :to="{ path: '' }">{{ group }}</el-breadcrumb-item>
        <el-breadcrumb-item>{{ title }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div class="header-right">
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const title = computed(() => route.meta?.title as string || '')
const group = computed(() => route.meta?.group as string || '')
</script>

<style scoped>
.header-bar {
  height: 48px;
  background-color: var(--app-surface-bg);
  border-bottom: 1px solid var(--app-border);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.breadcrumb {
  font-size: 14px;
}

.header-right {
  display: flex;
  align-items: center;
}
</style>
