<template>
  <PlaceholderPage title="日志查询" group="运行监控" :info="info" />
</template>

<script setup lang="ts">
import PlaceholderPage from '@/components/PlaceholderPage.vue'

const info = {
  nature: '只读',
  structure: '双 Tab：错误日志 / 正确日志',
  tables: 'CDC_LOG_ERROR、CDC_LOG_CORRECT',
  desc: '查询 CDC 操作日志。错误日志 Tab 对应 CDC_LOG_ERROR，正确日志 Tab 对应 CDC_LOG_CORRECT。两表结构相同，共享筛选条件框架。'
}
</script>
