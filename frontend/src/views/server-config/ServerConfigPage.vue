<template>
  <PlaceholderPage title="服务端配置" group="配置管理" :info="info" />
</template>

<script setup lang="ts">
import PlaceholderPage from '@/components/PlaceholderPage.vue'

const info = {
  nature: '可维护',
  structure: '列表 + 详情 + 配置明细',
  tables: 'CDC_SERVER、CDC_SERVER_CONFIG',
  desc: '管理 CDC 中心端实例及其配置项。列表展示基本信息，详情页内嵌配置项表格。'
}
</script>
