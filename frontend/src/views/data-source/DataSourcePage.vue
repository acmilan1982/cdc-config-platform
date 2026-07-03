<template>
  <PlaceholderPage title="数据源管理" group="配置管理" :info="info" />
</template>

<script setup lang="ts">
import PlaceholderPage from '@/components/PlaceholderPage.vue'

const info = {
  nature: '可维护',
  structure: '主列表 + 扩展配置子页',
  tables: 'CDC_DATA_SOURCE、CDC_DATA_SOURCE_EXTEND',
  desc: '管理 CDC 平台的数据源配置，包括源库和目标库信息。扩展配置作为 1:1 子页展示。'
}
</script>
