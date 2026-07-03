<template>
  <PlaceholderPage title="数据源运行状态" group="运行监控" :info="info" />
</template>

<script setup lang="ts">
import PlaceholderPage from '@/components/PlaceholderPage.vue'

const info = {
  nature: '只读',
  structure: '列表 + 详情（如适用）',
  tables: 'CDC_DATA_SOURCE_RUN_STATE',
  desc: '监控数据源的实时运行状态。由外部程序维护，前端只读查询。支持唯一定位时跳转到配置页。'
}
</script>
