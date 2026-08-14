<template>
  <el-tooltip :content="tooltipContent" placement="top" :show-after="300">
    <span class="ds-display" :class="{ 'ds-display--invalid': !dataSourceExists }">
      {{ label }}<span v-if="dataSourceExists && dataSourceActive === false" class="ds-display__suffix">&nbsp;(数据源未激活)</span>
    </span>
  </el-tooltip>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  dataSourceId: string
  dataSourceOrg?: string | null
  dataSourceExists: boolean
  dataSourceActive?: boolean | null
}>()

const tooltipContent = computed(() => `数据源 ID：${props.dataSourceId}`)

const label = computed(() => {
  if (!props.dataSourceExists) return '无效数据源'
  const org = props.dataSourceOrg
  return org && org.trim() ? org : '未定义名称'
})
</script>

<style scoped>
.ds-display {
  font-weight: 500;
  color: #303133;
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: default;
}
.ds-display--invalid {
  color: #f56c6c;
}
.ds-display__suffix {
  color: #f56c6c;
}
</style>
