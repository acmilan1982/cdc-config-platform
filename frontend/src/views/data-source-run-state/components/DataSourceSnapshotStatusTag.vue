<template>
  <span class="dss-status-tag">
    <el-tag :type="tagType" effect="light" size="small">
      <!-- R3 符号：显式局部元素 + 固定宽度槽，三状态中文文字起点对齐；符号为辅助视觉 aria-hidden，中文文字是主要语义 -->
      <span
        class="dss-status-symbol"
        :class="{ 'dss-status-symbol--dot': isRunning }"
        aria-hidden="true"
      >{{ symbol }}</span>{{ label }}
    </el-tag>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StatusToken } from '@/types/dataSourceSnapshot'

/**
 * 快照状态标签（纯展示，DSS-REQ-035/036/038）：
 * 本组件不再私自创建独立 Tooltip；任意行的数据库原始状态值经页面级单实例 Tooltip Host 展示
 * （由表格在状态单元格层触发，UI §13.5/§13.6，DSS-REQ-070）。
 *
 * R3 调整三（§8）：保持文字/颜色/背景/圆角/原始状态 Tooltip 与映射不变，仅调整前导符号与字重。
 * 符号 → RUNNING=● / COMPLETED=✓ / UNKNOWN=?，随各自文字同色，放入固定宽度槽使三种文字起点对齐；
 * 符号用显式局部元素承载（aria-hidden，无图标库），中文文字仍是主要可访问语义。
 * RUNNING 的 ● 以更小字号呈现，保留原实心圆点的紧凑视觉尺寸，不改变状态 Tag 总高。
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

const SYMBOL: Record<StatusToken, string> = {
  RUNNING: '●',
  COMPLETED: '✓',
  UNKNOWN: '?',
}

const meta = computed<StatusMeta>(() => META[props.statusCategory] ?? META.UNKNOWN)
const label = computed(() => meta.value.label)
const tagType = computed(() => meta.value.type)
/** 未识别 token 仍统一落入 UNKNOWN 的既有兜底逻辑（DSS-REQ-038），符号同步兜底为 '?'。 */
const symbol = computed(() => SYMBOL[props.statusCategory] ?? SYMBOL.UNKNOWN)
const isRunning = computed(() => props.statusCategory === 'RUNNING')
</script>

<!-- Linear 原型徽章化（纯视觉试验）：仍为 <el-tag>（type/effect/size/背景/文字色不变），仅收窄本组件子树外观。
     前导符号为 el-tag 默认插槽内显式局部 <span>（aria-hidden），无图标库、无新依赖。 -->
<style scoped>
.dss-status-tag {
  display: inline-flex;
  align-items: center;
}
.dss-status-tag :deep(.el-tag) {
  height: 20px;
  line-height: 20px;
  padding: 0 9px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  /* R3：状态文字统一 600 字重（§8） */
  font-weight: 600;
}
/* 符号槽 + 中文文字作为一个 flex 行：固定符号宽度保证三状态文字起点对齐，gap 控制符号与文字间距 */
.dss-status-tag :deep(.el-tag__content) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
/* 固定宽度符号槽：三状态符号（●/✓/?）各自居中，文字从槽后同一起点开始 */
.dss-status-symbol {
  flex: 0 0 auto;
  width: 14px;
  text-align: center;
  line-height: 1;
  /* 符号与各自文字同色（inherit 自动取自 el-tag 分型文字色） */
  color: inherit;
}
/* RUNNING ● 保留原实心圆点紧凑视觉尺寸：以更小字号渲染，槽内居中，不放大圆点 */
.dss-status-symbol--dot {
  font-size: 8px;
}
.dss-status-tag :deep(.el-tag--primary) {
  background: #e0f2fe;
  color: #0369a1;
}
.dss-status-tag :deep(.el-tag--success) {
  background: #ecfdf5;
  color: #047857;
}
.dss-status-tag :deep(.el-tag--warning) {
  background: #fef3c7;
  color: #b45309;
}
</style>
