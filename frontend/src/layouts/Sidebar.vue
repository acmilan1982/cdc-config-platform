<template>
  <div class="sidebar">
    <div class="brand">
      <span class="brand-text">
        CDC 数据同步平台
      </span>
    </div>

    <el-menu
      :default-active="currentPath"
      :router="true"
      background-color="transparent"
      text-color="#cbd5e1"
      active-text-color="#ffffff"
      class="sidebar-menu"
      @select="onMenuSelect"
    >
      <template v-for="group in menuGroups" :key="group.title">
        <el-menu-item-group :title="group.title" class="menu-group">
          <el-menu-item
            v-for="item in group.items"
            :key="item.path"
            :index="item.path"
          >
            <el-icon><component :is="resolveIcon(item.icon)" /></el-icon>
            <span>{{ item.title }}</span>
          </el-menu-item>
        </el-menu-item-group>
      </template>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import { useRoute } from 'vue-router'
import { menuGroups } from '@/config/menu'
import { triggerLogQueryReinit } from '@/views/log-query/reinitBus'
import {
  DataAnalysis,
  Monitor,
  Connection,
  Setting,
  Odometer,
  DataLine,
  TrendCharts,
  Document,
} from '@element-plus/icons-vue'

const route = useRoute()

const currentPath = computed(() => route.path)

const iconMap: Record<string, Component> = {
  DataAnalysis,
  Monitor,
  Connection,
  Setting,
  Odometer,
  DataLine,
  TrendCharts,
  Document,
}

function resolveIcon(name: string): Component | undefined {
  return iconMap[name]
}

/**
 * 再次点击当前"日志查询"菜单项时触发页面完整重新初始化（LQ-UI-142~146 / LQ-AC-181）。
 * `:router="true"` 下同路由点击不会重挂载组件，通过事件总线通知页面。
 */
function onMenuSelect(index: string) {
  if (index === '/monitor/log-query' && route.path === '/monitor/log-query') {
    triggerLogQueryReinit()
  }
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 220px;
  background-color: var(--app-sidebar-bg);
  display: flex;
  flex-direction: column;
  z-index: 100;
  overflow: hidden;
}

.brand {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--app-logo-bg);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  overflow: hidden;
  white-space: nowrap;
  flex-shrink: 0;
}

.brand-text {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
}

.sidebar-menu {
  flex: 1;
  width: 220px;
  overflow-y: auto;
  overflow-x: hidden;
  border-right: none;
  padding: 8px 0;
}

.sidebar-menu :deep(.el-menu-item-group__title) {
  color: var(--app-menu-group-text);
  font-size: 12px;
  line-height: 1.4;
  padding: 16px 24px 6px;
  letter-spacing: 1px;
}

.sidebar-menu :deep(.el-menu-item) {
  position: relative;
  height: 44px;
  line-height: 44px;
  margin: 2px 10px;
  border-radius: 8px;
  color: var(--app-menu-text);
  transition: background-color 0.2s, color 0.2s;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background-color: var(--app-menu-hover-bg);
  color: var(--app-menu-text);
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background-color: var(--app-menu-active-bg);
  color: var(--app-menu-active-text);
}

.sidebar-menu :deep(.el-menu-item.is-active::before) {
  content: '';
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 18px;
  border-radius: 999px;
  background-color: var(--app-menu-active-bar);
}

.sidebar-menu :deep(.el-menu-item:focus-visible) {
  outline: none;
  box-shadow: inset 0 0 0 2px var(--app-menu-active-bar);
}
</style>
