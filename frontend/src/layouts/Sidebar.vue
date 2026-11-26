<template>
  <div class="sidebar" :class="{ collapsed }">
    <div class="brand">
      <span class="brand-text">
        {{ collapsed ? 'CDC' : 'CDC 配置管理平台' }}
      </span>
    </div>

    <el-menu
      ref="menuRef"
      :default-active="currentPath"
      :router="true"
      background-color="#232C38"
      text-color="#D5DDE7"
      active-text-color="#B5D7FF"
      class="sidebar-menu"
      :class="{ 'is-content-hidden': collapsed }"
      :inert="collapsed"
      :aria-hidden="collapsed"
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
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { menuGroups } from '@/config/menu'
import { triggerLogQueryReinit } from '@/views/log-query/reinitBus'

const appStore = useAppStore()
const route = useRoute()

const currentPath = computed(() => route.path)

/**
 * 折叠/展开为单状态瞬时切换：宽度、标题与菜单可见性由同一 `collapsed` 派生并在同一次渲染中更新，
 * 无过渡、无分阶段定时器，避免宽度动画逐帧改变主内容可用宽度而反复触发表格布局。
 * 折叠时立即把菜单移出焦点树（inert + visibility:hidden），并主动清理残留焦点。
 */
const collapsed = computed(() => appStore.sidebarCollapsed)
const menuRef = ref<{ $el?: HTMLElement } | null>(null)

function blurMenuFocus() {
  const menuEl = menuRef.value?.$el
  if (menuEl && document.activeElement && menuEl.contains(document.activeElement)) {
    ;(document.activeElement as HTMLElement).blur()
  }
}

watch(collapsed, (isCollapsed) => {
  if (isCollapsed) blurMenuFocus()
})

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

.sidebar.collapsed {
  width: 64px;
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

/* 侧栏宽度瞬时切换（无 transition），仅让固定在 220px 的菜单视觉层做短时滑入滑出；
   transform/opacity 不参与布局，因此主内容可用宽度只在切换瞬间变化一次，不会逐帧触发表格重排。
   菜单层保持固定宽度，展开过程中条目始终单行、无纵向跳动。 */
.sidebar-menu {
  flex: 1;
  width: 220px;
  overflow-y: auto;
  overflow-x: hidden;
  border-right: none;
  transition: transform 160ms ease, opacity 160ms ease;
  /* 主内容宽度一次性变化会让大表在同一帧重排（约百毫秒级）；提前提升为合成层，
     让滑入/淡出尽量由合成器推进，而不是等主线程重排结束后才开始。 */
  will-change: transform, opacity;
}

/* 折叠时整块菜单滑出并淡出，动画结束后再移出可见性与焦点树（inert 见模板）；
   动画期间立即禁止指针命中，避免可操作但正在离场的隐藏菜单。 */
.sidebar-menu.is-content-hidden {
  opacity: 0;
  transform: translateX(-16px);
  pointer-events: none;
  visibility: hidden;
  transition: transform 160ms ease, opacity 160ms ease, visibility 0s linear 160ms;
}

@media (prefers-reduced-motion: reduce) {
  .sidebar-menu,
  .sidebar-menu.is-content-hidden {
    transition: none;
    transform: none;
  }
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
