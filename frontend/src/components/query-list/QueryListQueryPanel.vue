<template>
  <div class="ql-q-panel" :class="{ 'ql-q-panel--plain': plain }">
    <div class="ql-q-panel__flow">
      <slot />
      <div v-if="hasActions" class="ql-q-panel__actions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'

/**
 * 查询条件区容器（SHARED_COMPONENT_DESIGN §7.4.2）：只提供字段组的流式换行区域与操作区位置，
 * 并提供可选的嵌入式卡片视觉。不生成标签、不设控件宽度、不持有请求。
 */
const props = withDefaults(
  defineProps<{
    /** 'card' = 嵌入式卡片（背景 #F4F4F5 / 圆角 8px / 无阴影 / padding 10px 16px）；'plain' = 透明。 */
    variant?: 'card' | 'plain'
  }>(),
  { variant: 'card' },
)

const slots = useSlots()
const plain = computed(() => props.variant === 'plain')
const hasActions = computed(() => Boolean(slots.actions))
</script>

<style scoped>
.ql-q-panel {
  border-radius: var(--ql-q-panel-radius, 8px);
  background: var(--ql-q-panel-bg, #f4f4f5);
  padding: var(--ql-q-panel-padding, 10px 16px);
}

.ql-q-panel--plain {
  background: transparent;
  padding: 0;
}

/* 字段组整体换行：每个字段组自身 flex:0 0 auto，容器负责行间/列间间距。 */
.ql-q-panel__flow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ql-q-panel-gap, 8px 14px);
}

/* 操作组作为一个整体 flex item：内部两按钮永不拆散，宽度不足时整组换行。 */
.ql-q-panel__actions {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
}
</style>
