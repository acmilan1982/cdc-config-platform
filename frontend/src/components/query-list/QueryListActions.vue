<template>
  <div class="ql-actions">
    <el-button
      type="primary"
      class="ql-actions__query"
      :style="queryStyle"
      :aria-busy="queryLoading ? 'true' : undefined"
      :aria-disabled="busy ? 'true' : undefined"
      @click="onQuery"
    >
      <span class="ql-btn-spinner" :class="{ 'is-visible': queryLoading }" aria-hidden="true"></span>
      <span class="ql-action-label">{{ queryText }}</span>
    </el-button>
    <el-button
      class="ql-actions__reset"
      :style="resetStyle"
      :aria-disabled="busy ? 'true' : undefined"
      @click="onReset"
    >
      <span class="ql-action-label">{{ resetText }}</span>
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * 查询 / 重置操作区（SHARED_COMPONENT_DESIGN §7.4.3、§7.5）：两个按钮本体由本组件渲染，
 * 以保证固定宽度四值同锁与 Loading 几何稳定契约不被调用方破坏。
 * 宽度四值同锁与可选高度以**内联样式**表达（宽度取各自 prop，高度无公共默认值；
 * 未传 `heightPx` 时**不输出**任何 `height` 样式）；其余视觉全部由 `--ql-*` 令牌钉死，
 * 不依赖 Element Plus 默认主题，也不通过 `.dss-*` / 全局选择器穿透覆盖。
 */
const props = withDefaults(
  defineProps<{
    /** 查询按钮文案。默认 '查询'。非标准文案必须显式给出宽度。 */
    queryText?: string
    /** 重置按钮文案。默认 '重置'。 */
    resetText?: string
    /** 查询按钮固定宽度（px）。默认 62。 */
    queryWidthPx?: number
    /** 重置按钮固定宽度（px）。默认 62。 */
    resetWidthPx?: number
    /** 仅“查询”按钮显示 Loading 指示器。默认 false。 */
    queryLoading?: boolean
    /** 任一实际请求在途：两个按钮均被功能阻断。默认 false。 */
    busy?: boolean
    /** 可选的显式高度（px）。无公共默认值：未传时不输出任何 height 样式。 */
    heightPx?: number
  }>(),
  {
    queryText: '查询',
    resetText: '重置',
    queryWidthPx: 62,
    resetWidthPx: 62,
    queryLoading: false,
    busy: false,
    heightPx: undefined,
  },
)

const emit = defineEmits<{
  /** 查询按钮被激活且未被阻断。 */
  query: []
  /** 重置按钮被激活且未被阻断。 */
  reset: []
}>()

/** 固定宽度四值同锁 + 禁止拉伸/压缩（§7.5.1、§7.5.2）。 */
function widthLock(px: number): string {
  return `width:${px}px;min-width:${px}px;max-width:${px}px;flex-basis:${px}px;flex-grow:0;flex-shrink:0;box-sizing:border-box`
}

const queryStyle = computed(() =>
  props.heightPx === undefined ? widthLock(props.queryWidthPx) : `${widthLock(props.queryWidthPx)};height:${props.heightPx}px`,
)
const resetStyle = computed(() =>
  props.heightPx === undefined ? widthLock(props.resetWidthPx) : `${widthLock(props.resetWidthPx)};height:${props.heightPx}px`,
)

function onQuery(): void {
  if (props.busy) return
  emit('query')
}

function onReset(): void {
  if (props.busy) return
  emit('reset')
}
</script>

<style scoped>
.ql-actions {
  display: inline-flex;
  align-items: center;
  gap: var(--ql-actions-gap, 8px);
  flex: 0 0 auto;
}

/* 查询：深色主按钮。position:relative 使常驻指示器以本按钮为包含块。 */
.ql-actions__query {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--ql-actions-query-bg, #09090b);
  border: 1px solid var(--ql-actions-query-border, #09090b);
  color: var(--ql-actions-query-fg, #ffffff);
  font-weight: var(--ql-actions-font-weight, 500);
  border-radius: var(--ql-actions-radius, 6px);
  padding: var(--ql-actions-query-padding, 0 16px);
}

.ql-actions__query:hover,
.ql-actions__query:focus {
  background: var(--ql-actions-query-bg-hover, #27272a);
  border: 1px solid var(--ql-actions-query-border-hover, #27272a);
  color: var(--ql-actions-query-fg-hover, #ffffff);
}

/* 重置：浅灰底次按钮。 */
.ql-actions__reset {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--ql-actions-reset-bg, #e4e4e7);
  border: 1px solid var(--ql-actions-reset-border, transparent);
  color: var(--ql-actions-reset-fg, #3f3f46);
  font-weight: var(--ql-actions-font-weight, 500);
  border-radius: var(--ql-actions-radius, 6px);
  padding: var(--ql-actions-reset-padding, 0 14px);
}

.ql-actions__reset:hover,
.ql-actions__reset:focus {
  background: var(--ql-actions-reset-bg-hover, #d9d9dd);
  border: 1px solid var(--ql-actions-reset-border-hover, transparent);
  color: var(--ql-actions-reset-fg-hover, #3f3f46);
}

/* 独立固定居中文字节点：四态内容恒定。 */
.ql-action-label {
  white-space: nowrap;
}
</style>

<style scoped src="./query-list-spinner.css"></style>
