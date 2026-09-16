<template>
  <div class="ql-result-panel" :class="{ 'ql-result-panel--plain': plain }">
    <header class="ql-result-panel__header">
      <div v-if="showSummary" class="ql-result-panel__summary">
        <slot name="summary">{{ summaryText }}</slot>
      </div>
      <div class="ql-result-panel__toolbar">
        <slot name="toolbar" />
      </div>
    </header>
    <div class="ql-result-panel__error-slot">
      <slot v-if="showError" name="error">
        <span>{{ errorText }}</span>
      </slot>
    </div>
    <div class="ql-result-panel__divider"></div>
    <div class="ql-result-panel__body">
      <slot name="body" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'

/**
 * 结果区卡片容器（SHARED_COMPONENT_DESIGN §7.4.4）：头部（左摘要 + 右工具栏）、预留高度的提示槽、
 * 固定 1px 分隔线、带横向溢出能力的正文区（已并入原“稳定表格容器”候选项，不另建薄包装组件）。
 * 四段 DOM 顺序不可调整：header → error-slot → divider → body。
 */
const props = withDefaults(
  defineProps<{
    /** 左侧摘要文本。为空且无 #summary 槽时不渲染左区。 */
    summaryText?: string
    /** 内联收敛提示文本。为空时不渲染提示内容，但槽位高度保留。 */
    errorText?: string
    /** 'card' = 结果卡片（参考实现现状）；'plain' = 无卡片。 */
    variant?: 'card' | 'plain'
  }>(),
  { summaryText: '', errorText: '', variant: 'card' },
)

const slots = useSlots()
const plain = computed(() => props.variant === 'plain')
const showSummary = computed(() => props.summaryText !== '' || Boolean(slots.summary))
/** 提示槽容器**始终**渲染以保留 min-height；仅内容按需省略，避免空白文本节点。 */
const showError = computed(() => props.errorText !== '' || Boolean(slots.error))
</script>

<style scoped>
.ql-result-panel {
  display: flex;
  flex-direction: column;
  background: var(--ql-result-panel-bg, #ffffff);
  border-radius: var(--ql-result-panel-radius, 10px);
  box-shadow: var(--ql-result-panel-shadow, 0 1px 2px rgba(9, 9, 11, 0.04), 0 1px 3px rgba(9, 9, 11, 0.03));
}

.ql-result-panel--plain {
  background: transparent;
  border-radius: 0;
  box-shadow: none;
}

.ql-result-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ql-result-panel-header-gap, 12px 16px);
  flex-wrap: wrap;
  padding: var(--ql-result-panel-header-padding, 12px 16px 2px);
}

/* 左右两区为“布局透明”的 flex 容器：调用方内容若为 inline-flex（参考实现的摘要胶囊 / 刷新组）
   不会被降级为行内级元素而产生行盒与 strut，从而保持头部高度逐像素不变。 */
.ql-result-panel__summary {
  display: flex;
  align-items: center;
  flex: 0 1 auto;
  min-width: 0;
}

.ql-result-panel__toolbar {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
}

/* 预留高度槽位：提示出现/消失均不改变后续内容坐标。 */
.ql-result-panel__error-slot {
  min-height: var(--ql-result-panel-error-min-height, 22px);
  padding: var(--ql-result-panel-error-padding, 0 16px);
  display: flex;
  align-items: center;
}

.ql-result-panel__divider {
  height: var(--ql-result-panel-divider-height, 1px);
  background: var(--ql-result-panel-divider-color, #f0f0f1);
  margin: var(--ql-result-panel-divider-margin, 0 16px);
  flex: 0 0 auto;
}

/* 正文区同时承担原“稳定表格容器”的横向溢出职责；表格 min-width 属 Feature。 */
.ql-result-panel__body {
  width: 100%;
  min-width: var(--ql-result-panel-body-min-width, 0);
  box-sizing: border-box;
  padding: var(--ql-result-panel-body-padding, 10px 16px 14px);
  overflow-x: var(--ql-result-body-overflow-x, auto);
}
</style>
