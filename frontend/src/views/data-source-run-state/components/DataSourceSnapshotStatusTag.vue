<template>
  <span class="dss-status-tag">
    <el-tag :type="tagType" effect="light" size="small">{{ label }}</el-tag>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StatusToken } from '@/types/dataSourceSnapshot'

/**
 * 快照状态标签（纯展示，DSS-REQ-035/036/038）：
 * 本组件不再私自创建独立 Tooltip；任意行的数据库原始状态值经页面级单实例 Tooltip Host 展示
 * （由表格在状态单元格层触发，UI §13.5/§13.6，DSS-REQ-070）。
 */
const props = defineProps<{
  /** 归一类别 token（API §6 statusCategory）。 */
  statusCategory: StatusToken
}>()

interface StatusMeta {
  label: string
  type: 'primary' | 'success' | 'warning'
}

const META: Record<StatusToken, StatusMeta> = {
  RUNNING: { label: '快照进行中', type: 'primary' },
  COMPLETED: { label: '快照已完成', type: 'success' },
  UNKNOWN: { label: '未知状态', type: 'warning' },
}

const meta = computed<StatusMeta>(() => META[props.statusCategory] ?? META.UNKNOWN)
const label = computed(() => meta.value.label)
const tagType = computed(() => meta.value.type)
</script>
