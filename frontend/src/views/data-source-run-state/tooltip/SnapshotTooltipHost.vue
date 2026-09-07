<template>
  <Teleport to="body">
    <div
      v-if="target"
      ref="boxEl"
      class="dss-single-tooltip"
      role="tooltip"
      data-tt-host="1"
      :style="posStyle"
      @mouseenter.prevent.stop
      @mouseleave.prevent.stop
    >
      <div class="dss-single-tooltip__content">{{ target.content }}</div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { computeTooltipPlacement } from './tooltipPosition'
import type { SnapshotTooltipState } from './useSnapshotTooltip'

/**
 * 页面级单实例受控 Tooltip Host（DSS-REQ-070，AC-076/077）：
 * 页面唯一；Teleport 到 body 避免被表格 overflow 裁切；pointer-events:none 不可交互；
 * 对视口四边避让；内容默认单行（pre-line + max-content + max-width），仅当物理宽度超安全视口时换行。
 */
const props = defineProps<{
  target: SnapshotTooltipState | null
}>()

const boxEl = ref<HTMLElement | null>(null)
const posStyle = ref('visibility:hidden')

async function applyLayout(): Promise<void> {
  await nextTick()
  if (!props.target || !boxEl.value) return
  const rect = boxEl.value.getBoundingClientRect()
  const width = boxEl.value.offsetWidth || rect.width || 0
  const height = boxEl.value.offsetHeight || rect.height || 0
  const vw = window.innerWidth || rect.width || 0
  const vh = window.innerHeight || rect.height || 0
  const p = computeTooltipPlacement(props.target.anchor, { width, height }, { width: vw, height: vh })
  posStyle.value = `left:${Math.round(p.left)}px;top:${Math.round(p.top)}px`
}

watch(
  () => props.target,
  () => {
    if (props.target) {
      void applyLayout()
    }
  },
  { flush: 'post' },
)
</script>

<style scoped>
.dss-single-tooltip {
  position: fixed;
  z-index: 3000;
  box-sizing: border-box;
  max-width: min(420px, calc(100vw - 16px));
  padding: 6px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #ffffff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
  color: #303133;
  font-size: 13px;
  line-height: 1.5;
  width: max-content;
  pointer-events: none;
  white-space: pre-line;
  overflow-wrap: anywhere;
}
</style>
