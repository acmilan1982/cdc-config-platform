<template>
  <div class="header-bar">
    <div class="header-left">
      <el-icon
        class="collapse-btn"
        role="button"
        tabindex="0"
        :aria-label="appStore.sidebarCollapsed ? '展开侧栏' : '折叠侧栏'"
        :aria-expanded="!appStore.sidebarCollapsed"
        @click="appStore.toggleSidebar"
        @keydown.enter.prevent="appStore.toggleSidebar"
        @keydown.space.prevent="appStore.toggleSidebar"
      >
        <Fold v-if="!appStore.sidebarCollapsed" />
        <Expand v-else />
      </el-icon>
      <el-breadcrumb v-if="title || group" separator="/" class="breadcrumb">
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
import { useAppStore } from '@/stores/app'
import { Fold, Expand } from '@element-plus/icons-vue'

const appStore = useAppStore()
const route = useRoute()

const title = computed(() => route.meta?.title as string || '')
const group = computed(() => route.meta?.group as string || '')
</script>

<style scoped>
.header-bar {
  height: 48px;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
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

.collapse-btn {
  font-size: 20px;
  color: #606266;
  cursor: pointer;
  flex-shrink: 0;
}

.collapse-btn:hover {
  color: #409eff;
}

.collapse-btn:focus-visible {
  outline: 2px solid #409eff;
  outline-offset: 2px;
  border-radius: 2px;
}

.breadcrumb {
  font-size: 14px;
}

.header-right {
  display: flex;
  align-items: center;
}
</style>
