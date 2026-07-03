<template>
  <PlaceholderPage title="CDC 节点状态" group="运行监控" :info="info" />
</template>

<script setup lang="ts">
import PlaceholderPage from '@/components/PlaceholderPage.vue'

const info = {
  nature: '只读',
  structure: '单页面，通过节点类型筛选',
  tables: '—',
  desc: '监控 CDC 节点在线状态，数据来自 ZooKeeper。客户端节点、探针节点和其他节点类型通过筛选切换。'
}
</script>
