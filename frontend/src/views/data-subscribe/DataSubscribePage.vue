<template>
  <PlaceholderPage title="数据订阅" group="配置管理" :info="info" />
</template>

<script setup lang="ts">
import PlaceholderPage from '@/components/PlaceholderPage.vue'

const info = {
  nature: '可维护',
  structure: '列表 + 详情',
  tables: 'CDC_DATA_SUBSCRIBE',
  desc: '管理数据订阅关系，定义源库到目标库的数据同步规则。包含 CLOB 字段，详情页完整展示。'
}
</script>
