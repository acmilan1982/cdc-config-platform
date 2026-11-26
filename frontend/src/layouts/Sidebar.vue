<template>
  <div class="sidebar">
    <div class="brand">
      <span class="brand-text">CDC 配置管理平台</span>
    </div>

    <el-menu
      :default-active="currentPath"
      :router="true"
      background-color="#232C38"
      text-color="#D5DDE7"
      active-text-color="#B5D7FF"
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
import { menuGroups } from '@/config/menu'
import { triggerLogQueryReinit } from '@/views/log-query/reinitBus'

const route = useRoute()

const currentPath = computed(() => route.path)

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
/* A 版深石板灰侧栏配色，统一收敛为局部主题变量，便于悬停/选中/分组状态复用。 */
.sidebar {
  --sidebar-bg: #232c38;
  --sidebar-item-text: #d5dde7;
  --sidebar-item-hover-bg: rgba(255, 255, 255, 0.06);
  --sidebar-item-active-bg: #364a61;
  --sidebar-item-active-text: #b5d7ff;
  --sidebar-group-text: #a4b0c0;
  --sidebar-brand-text: #f4f7fb;

  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 220px;
  background-color: var(--sidebar-bg);
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
  background-color: var(--sidebar-bg);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
  white-space: nowrap;
}

.brand-text {
  color: var(--sidebar-brand-text);
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
}

/* 选中菜单：圆角蓝灰底 + 浅蓝字；普通菜单 / 悬停 / 键盘焦点状态清晰可辨。 */
.sidebar-menu :deep(.el-menu-item) {
  margin: 2px 8px;
  border-radius: 6px;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  color: var(--sidebar-item-text);
}

.sidebar-menu :deep(.el-menu-item span) {
  white-space: nowrap;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background-color: var(--sidebar-item-hover-bg);
  color: #fff;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background-color: var(--sidebar-item-active-bg);
  color: var(--sidebar-item-active-text);
  font-weight: 500;
}

.sidebar-menu :deep(.el-menu-item.is-active:hover) {
  background-color: #3d5571;
  color: var(--sidebar-item-active-text);
}

.sidebar-menu :deep(.el-menu-item:focus-visible) {
  outline: 2px solid var(--sidebar-item-active-text);
  outline-offset: -2px;
}

.menu-group :deep(.el-menu-item-group__title) {
  color: var(--sidebar-group-text);
  font-size: 12px;
  padding: 12px 20px 4px;
  white-space: nowrap;
  overflow: hidden;
}
</style>
