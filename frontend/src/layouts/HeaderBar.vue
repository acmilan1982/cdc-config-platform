<template>
  <div class="header-bar">
    <div class="header-left">
      <el-breadcrumb v-if="title || group" separator="/" class="breadcrumb">
        <el-breadcrumb-item v-if="group" :to="{ path: '' }">{{ group }}</el-breadcrumb-item>
        <el-breadcrumb-item>{{ title }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div class="header-right">
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const title = computed(() => route.meta?.title as string || '')
const group = computed(() => route.meta?.group as string || '')
</script>

<style scoped>
.header-bar {
  height: 48px;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
}

.breadcrumb {
  font-size: 14px;
}

.header-right {
  display: flex;
  align-items: center;
}
</style>
