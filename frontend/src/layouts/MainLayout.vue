<template>
  <div class="main-layout">
    <Sidebar />
    <div class="layout-right">
      <HeaderBar />
      <div class="content-area">
        <div class="content-card">
          <router-view />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Sidebar from './Sidebar.vue'
import HeaderBar from './HeaderBar.vue'
</script>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.layout-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin-left: 220px;
}

.content-area {
  flex: 1;
  padding: 16px 20px;
  overflow-y: auto;
  background-color: var(--app-page-bg);
}

.content-card {
  background-color: var(--app-surface-bg);
  border: 1px solid var(--app-border);
  border-radius: var(--app-card-radius);
  box-shadow: var(--app-card-shadow);
  min-height: 100%;
  padding: 20px;
}
</style>
