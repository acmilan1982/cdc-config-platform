<template>
  <div class="ql-page">
    <header v-if="showHeader" class="ql-page__header">
      <slot name="header">
        <h2 class="ql-page__title">{{ title }}</h2>
        <p v-if="showDescription" class="ql-page__description">
          <slot name="description">{{ description }}</slot>
        </p>
      </slot>
      <slot name="header-extra" />
    </header>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'

/**
 * 页面外壳（SHARED_COMPONENT_DESIGN §7.4.1）：只渲染页头与页面主体的纵向间距，业务零知识。
 * 默认槽内容**逐一**成为 `.ql-page` 的直接子节点——不生成 `.ql-page__body` 或任何其它包装层，
 * 否则两种状态（正常内容 3 个直接子节点 / 首载失败 2 个）与根级 `gap` 几何都会被改变。
 */
const props = withDefaults(
  defineProps<{
    /** 页面标题。空字符串且未提供 #header 时，页头区不渲染。 */
    title?: string
    /** 页面描述。未提供或为空时不渲染描述行。 */
    description?: string
  }>(),
  { title: '', description: '' },
)

const slots = useSlots()

const showHeader = computed(() => props.title !== '' || Boolean(slots.header))
const showDescription = computed(() => props.description !== '' || Boolean(slots.description))
</script>

<style scoped>
.ql-page {
  display: flex;
  flex-direction: column;
  gap: var(--ql-page-gap, 12px);
  padding: var(--ql-page-padding, 14px 16px);
  border-radius: var(--ql-page-radius, 10px);
  background: var(--ql-page-background, transparent);
}

.ql-page__title {
  margin: var(--ql-title-margin, 0);
  font-size: var(--ql-title-size, 20px);
  font-weight: var(--ql-title-weight, 650);
  letter-spacing: var(--ql-title-letter-spacing, -0.01em);
  color: var(--ql-title-color, #09090b);
}

.ql-page__description {
  margin: var(--ql-desc-margin, 4px 0 0);
  font-size: var(--ql-desc-size, 13px);
  color: var(--ql-desc-color, #71717a);
  line-height: var(--ql-desc-line-height, 1.5);
}
</style>
