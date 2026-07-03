<template>
  <PlaceholderPage title="Topic 偏移量" group="运行监控" :info="info" />
</template>

<script setup lang="ts">
import PlaceholderPage from '@/components/PlaceholderPage.vue'

const info = {
  nature: '只读',
  structure: '列表 + 分页',
  tables: 'CDC_TOPIC_OFFSET',
  desc: '监控 Kafka Topic 消费偏移量。展示各中心端的消费进度，支持分页和自动刷新。'
}
</script>
