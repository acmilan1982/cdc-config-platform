<template>
  <div class="sidebar" :class="{ collapsed: appStore.sidebarCollapsed }">
    <div class="brand">
      <span class="brand-text">
        {{ appStore.sidebarCollapsed ? 'CDC' : 'CDC 配置管理平台' }}
      </span>
    </div>

    <el-menu
      :default-active="currentPath"
      :collapse="appStore.sidebarCollapsed"
      :router="true"
      background-color="#304156"
      text-color="#bfcbd9"
      active-text-color="#409eff"
      class="sidebar-menu"
    >
      <template v-for="group in menuGroups" :key="group.title">
        <el-menu-item-group :title="group.title" class="menu-group">
          <el-menu-item
            v-for="item in group.items"
            :key="item.path"
            :index="item.path"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.title }}</span>
          </el-menu-item>
        </el-menu-item-group>
      </template>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { menuGroups } from '@/config/menu'

const appStore = useAppStore()
const route = useRoute()

const currentPath = computed(() => route.path)
</script>

<style scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 220px;
  background-color: #304156;
  display: flex;
  flex-direction: column;
  transition: width 0.28s;
  z-index: 100;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 64px;
}

.brand {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
  white-space: nowrap;
}

.brand-text {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
}

.sidebar-menu {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  border-right: none;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 220px;
}

.menu-group :deep(.el-menu-item-group__title) {
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
  padding: 12px 20px 4px;
}
</style>
