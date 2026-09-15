<template>
  <div class="main-layout">
    <Sidebar />
    <div class="layout-right" :class="{ collapsed: appStore.sidebarCollapsed }">
      <HeaderBar />
      <!-- 数据源运行状态页的真实主内容纵向滚动容器仍是本 .content-area（overflow-y: auto）；
           `.dss-stable-gutter` 仅在 name=DataSourceRunState 时加上，其他路由保持默认行为。 -->
      <div class="content-area" :class="{ 'dss-stable-gutter': isDataSourceRunState }">
        <div class="content-card">
          <router-view />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import Sidebar from './Sidebar.vue'
import HeaderBar from './HeaderBar.vue'

const appStore = useAppStore()
const route = useRoute()

/**
 * 仅“数据源运行状态”路由需要稳定滚动条槽位：查询结果行数变化 → 本容器纵向滚动条出现/消失 →
 * 主内容可用 clientWidth 变化 → Element Plus 重新分配弹性列宽 → 表头列水平位移。
 * 本容器即真实页面纵向滚动容器，故槽位加在此处；其他路由不加，保持默认行为。
 */
const isDataSourceRunState = computed(() => route.name === 'DataSourceRunState')
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

/* Feature 私有路由作用域滚动条槽位（DSS-REQ-090）：只有同时带 .dss-stable-gutter 的 .content-area
   才保留稳定纵向滚动条槽位，使滚动条在长/短结果之间出现或消失时不改变 clientWidth。
   通用 .content-area 不声明 scrollbar-gutter，其他路由保持浏览器默认行为；
   不使用 overflow-y: scroll 永久强制滚动条，也不做运行时宽度补偿。 */
.content-area.dss-stable-gutter {
  scrollbar-gutter: stable;
}

.content-card {
  background-color: #fff;
  border-radius: 4px;
  min-height: 100%;
  padding: 20px;
}
</style>
