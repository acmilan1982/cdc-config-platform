export interface MenuItem {
  path: string
  title: string
  icon: string
}

export interface MenuGroup {
  title: string
  items: MenuItem[]
}

export const menuGroups: MenuGroup[] = [
  {
    title: '配置管理',
    items: [
      { path: '/config/data-source', title: '数据源管理', icon: 'DataAnalysis' },
      { path: '/config/client', title: '客户端配置', icon: 'Monitor' },
      { path: '/config/subscribe', title: '数据订阅', icon: 'Connection' },
      { path: '/config/server', title: '服务端配置', icon: 'Setting' }
    ]
  },
  {
    title: '运行监控',
    items: [
      { path: '/monitor/cdc-node', title: 'CDC 节点状态', icon: 'Odometer' },
      { path: '/monitor/data-source-state', title: '数据源运行状态', icon: 'DataLine' },
      { path: '/monitor/topic-offset', title: 'Topic 偏移量', icon: 'TrendCharts' },
      { path: '/monitor/log-query', title: '日志查询', icon: 'Document' }
    ]
  }
]
