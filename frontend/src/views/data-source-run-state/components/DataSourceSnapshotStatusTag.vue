<template>
  <el-tooltip :content="`原始状态：${snapshotStatus}`" placement="top">
    <span class="dss-status-tag">
      <el-tag :type="tagType" effect="light" size="small">{{ label }}</el-tag>
    </span>
  </el-tooltip>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StatusToken } from '@/types/dataSourceSnapshot'

const props = defineProps<{
  /** 归一类别 token（API §6 statusCategory）。 */
  statusCategory: StatusToken
  /** 数据库原始状态值（如 SNAPSHOT_RUNNING），任意行均可悬浮查看（DSS-REQ-030，AC-028）。 */
  snapshotStatus: string
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
