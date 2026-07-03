import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const appName = ref('CDC 配置管理平台')
  const version = ref('1.0.0')
  const env = ref(import.meta.env.MODE)

  return { appName, version, env }
})
