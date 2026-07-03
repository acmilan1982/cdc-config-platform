<template>
  <div class="home-page">
    <div class="home-container">
      <el-card class="main-card">
        <template #header>
          <div class="card-header">
            <h1 class="app-title">{{ appStore.appName }}</h1>
          </div>
        </template>

        <el-alert
          :title="'前端工程已成功启动'"
          type="success"
          :closable="false"
          show-icon
          class="status-alert"
        />

        <el-descriptions
          title="技术栈信息"
          :column="2"
          border
          class="tech-info"
        >
          <el-descriptions-item label="当前阶段">前端骨架初始化</el-descriptions-item>
          <el-descriptions-item label="前端版本">{{ appStore.version }}</el-descriptions-item>
          <el-descriptions-item label="运行环境">{{ appStore.env }}</el-descriptions-item>
          <el-descriptions-item label="框架">Vue 3 + TypeScript</el-descriptions-item>
          <el-descriptions-item label="构建工具">Vite</el-descriptions-item>
          <el-descriptions-item label="UI 组件库">Element Plus</el-descriptions-item>
          <el-descriptions-item label="路由">Vue Router 4</el-descriptions-item>
          <el-descriptions-item label="状态管理">Pinia</el-descriptions-item>
          <el-descriptions-item label="HTTP 客户端">Axios</el-descriptions-item>
        </el-descriptions>

        <el-divider />

        <div class="backend-section">
          <h3>后端服务状态</h3>
          <el-tag v-if="backendStatus === 'checking'" type="info" size="large">
            正在检测...
          </el-tag>
          <el-tag v-else-if="backendStatus === 'up'" type="success" size="large">
            后端已连接 — {{ backendAppName }}
          </el-tag>
          <el-tag v-else type="danger" size="large">
            后端未连接
          </el-tag>
        </div>

        <el-divider />

        <div class="next-steps">
          <h3>后续开发模块</h3>
          <el-row :gutter="16" class="module-cards">
            <el-col :span="12">
              <el-card shadow="hover" class="module-card">
                <span class="module-label">配置管理</span>
                <p class="module-desc">数据源管理、客户端配置、数据订阅、服务端配置</p>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card shadow="hover" class="module-card">
                <span class="module-label">运行监控</span>
                <p class="module-desc">CDC 节点状态、数据源运行状态、Topic 偏移量、日志查询</p>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { checkHealth, type HealthInfo } from '@/services/health'

const appStore = useAppStore()
const backendStatus = ref<'checking' | 'up' | 'down'>('checking')
const backendAppName = ref('')

onMounted(async () => {
  const health: HealthInfo | null = await checkHealth()
  if (health && health.status === 'UP') {
    backendStatus.value = 'up'
    backendAppName.value = health.appName
  } else {
    backendStatus.value = 'down'
  }
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  padding: 24px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.home-container {
  width: 100%;
  max-width: 800px;
  margin-top: 40px;
}

.main-card {
  border-radius: 8px;
}

.card-header {
  text-align: center;
}

.app-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.status-alert {
  margin-bottom: 20px;
}

.tech-info {
  margin-bottom: 8px;
}

.backend-section {
  margin-bottom: 8px;
}

.backend-section h3,
.next-steps h3 {
  margin-bottom: 12px;
  font-size: 16px;
  color: #303133;
}

.module-cards {
  margin-top: 12px;
}

.module-card {
  margin-bottom: 12px;
}

.module-label {
  font-weight: 600;
  font-size: 15px;
  color: #409eff;
}

.module-desc {
  margin-top: 8px;
  color: #909399;
  font-size: 13px;
  line-height: 1.6;
}
</style>
