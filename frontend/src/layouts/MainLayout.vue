<template>
  <div class="main-layout">
    <Sidebar />
    <div class="layout-right" :class="{ collapsed: appStore.sidebarCollapsed }">
      <HeaderBar />
      <div class="content-area">
        <div class="content-card">
          <router-view />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import Sidebar from './Sidebar.vue'
import HeaderBar from './HeaderBar.vue'

const appStore = useAppStore()
</script>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.layout-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin-left: 220px;
  transition: margin-left 0.28s;
}

.layout-right.collapsed {
  margin-left: 64px;
}

.content-area {
  flex: 1;
  padding: 16px 20px;
  overflow-y: auto;
  background-color: #f0f2f5;
}

.content-card {
  background-color: #fff;
  border-radius: 4px;
  min-height: 100%;
  padding: 20px;
}
</style>
