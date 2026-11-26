import { h } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import pinia from '@/stores'
import { useTabsStore } from '@/stores/tabs'

/** 关闭最后一个标签后进入的公共空工作区（不产生业务标签，可从侧栏重新打开页面）。 */
const EmptyWorkspaceView = {
  name: 'EmptyWorkspaceView',
  render: () => h('div', { class: 'empty-workspace-view' })
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/config/data-source'
  },
  {
    path: '/config/data-source',
    name: 'DataSource',
    component: () => import('@/views/data-source/DataSourcePage.vue'),
    meta: { title: '数据源管理', group: '配置管理' }
  },
  {
    path: '/config/client',
    name: 'ClientConfig',
    component: () => import('@/views/client-config/ClientConfigPage.vue'),
    meta: { title: '探针端管理', group: '配置管理' }
  },
  {
    path: '/config/subscribe',
    name: 'DataSubscribe',
    component: () => import('@/views/data-subscribe/DataSubscribePage.vue'),
    meta: { title: '数据订阅', group: '配置管理' }
  },
  {
    path: '/config/server',
    name: 'ServerConfig',
    component: () => import('@/views/server-config/ServerConfigPage.vue'),
    meta: { title: '中心端配置', group: '配置管理' }
  },
  {
    path: '/monitor/cdc-node',
    name: 'CdcNodeStatus',
    component: () => import('@/views/cdc-node-status/CdcNodeStatusPage.vue'),
    meta: { title: 'CDC 节点状态', group: '运行监控' }
  },
  {
    path: '/monitor/data-source-state',
    name: 'DataSourceRunState',
    component: () => import('@/views/data-source-run-state/DataSourceRunStatePage.vue'),
    meta: { title: '源库快照状态', group: '运行监控', stableScrollbarGutter: true }
  },
  {
    path: '/monitor/topic-offset',
    name: 'TopicOffset',
    component: () => import('@/views/topic-offset/TopicOffsetPage.vue'),
    meta: { title: '数据同步进度', group: '运行监控' }
  },
  {
    path: '/monitor/log-query',
    name: 'LogQuery',
    component: () => import('@/views/log-query/LogQueryPage.vue'),
    meta: { title: '日志查询', group: '运行监控' }
  },
  {
    path: '/monitor/job-failure',
    name: 'JobFailure',
    component: () => import('@/views/monitor/job-failure/index.vue'),
    meta: { title: '故障监控', group: '运行监控' }
  },
  {
    path: '/monitor/job-failure/detail',
    name: 'JobFailureDetail',
    component: () => import('@/views/monitor/job-failure/detail.vue'),
    meta: { title: '故障过程详情', group: '运行监控' }
  },
  {
    path: '/monitor/job-failure/history',
    name: 'JobFailureHistory',
    component: () => import('@/views/monitor/job-failure/history.vue'),
    meta: { title: '故障历史', group: '运行监控' }
  },
  {
    path: '/monitor/job-failure/history/list',
    name: 'JobFailureHistoryList',
    component: () => import('@/views/monitor/job-failure/history-list.vue'),
    meta: { title: '数据源故障历史', group: '运行监控' }
  },
  {
    path: '/monitor/job-failure/process/:faultRootId',
    name: 'JobFailureProcessDetail',
    component: () => import('@/views/monitor/job-failure/detail.vue'),
    meta: { title: '故障过程详情', group: '运行监控' }
  },
  {
    path: '/workspace',
    name: 'Workspace',
    component: EmptyWorkspaceView,
    meta: { title: '', group: '', emptyWorkspace: true }
  },
  {
    path: '/large-screen',
    name: 'LargeScreen',
    component: () => import('@/views/large-screen/LargeScreenPage.vue'),
    meta: { title: 'CDC 数据同步统计大屏', standalone: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

/**
 * 页面标签同步：在导航确认前写入标签状态（含首屏、前进/后退、重定向与查询参数变化），
 * 使 MainLayout 的 keep-alive include 在目标页面渲染前即已就绪。
 * 独立路由（standalone，如 /large-screen）沿用其原有布局，不参与标签。
 */
router.beforeEach((to) => {
  if (to.meta.standalone === true) return
  const tabs = useTabsStore(pinia)
  if (to.meta.emptyWorkspace === true) {
    tabs.clearActive()
    return
  }
  const title = typeof to.meta.title === 'string' ? to.meta.title : ''
  if (title) {
    tabs.open(to.path, title)
  }
})

export default router
