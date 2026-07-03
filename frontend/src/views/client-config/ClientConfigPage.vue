<template>
  <PlaceholderPage title="客户端配置" group="配置管理" :info="info" />
</template>

<script setup lang="ts">
import PlaceholderPage from '@/components/PlaceholderPage.vue'

const info = {
  nature: '可维护',
  structure: '简单列表页',
  tables: 'CDC_CLIENT_MULTIPLE',
  desc: '管理 CDC 探针注册信息。CLIENT_ID 唯一标识每个探针实例。'
}
</script>
