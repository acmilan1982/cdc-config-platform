<template>
  <div class="placeholder-page">
    <div class="page-title-area">
      <h2 class="page-title">{{ title }}</h2>
      <el-tag :type="info.nature === '只读' ? 'info' : 'success'" size="small">
        {{ info.nature }}
      </el-tag>
      <el-tag type="warning" size="small">待模块开发前设计</el-tag>
    </div>

    <el-descriptions :column="2" border size="small" class="page-info">
      <el-descriptions-item label="所属模块">{{ group }}</el-descriptions-item>
      <el-descriptions-item label="页面性质">
        <el-tag :type="info.nature === '只读' ? 'info' : ''" size="small">
          {{ info.nature }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="页面结构">{{ info.structure }}</el-descriptions-item>
      <el-descriptions-item label="涉及数据源">{{ info.tables }}</el-descriptions-item>
      <el-descriptions-item label="页面说明" :span="2">{{ info.desc }}</el-descriptions-item>
    </el-descriptions>

    <el-divider />

    <el-alert
      title="当前状态"
      description="此页面尚未开发具体业务功能，将在后续模块设计阶段完成字段级规格设计后实现。"
      type="warning"
      :closable="false"
      show-icon
    />
  </div>
</template>

<script setup lang="ts">
export interface PlaceholderInfo {
  nature: string
  structure: string
  tables: string
  desc: string
}

defineProps<{
  title: string
  group: string
  info: PlaceholderInfo
}>()
</script>

<style scoped>
.placeholder-page {
  max-width: 960px;
}

.page-title-area {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.page-info {
  margin-bottom: 8px;
}
</style>
