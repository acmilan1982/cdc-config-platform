import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// 独立于 vite.config.ts 的测试配置：jsdom 环境 + 与业务一致的 @ 别名与 Vue 插件。
// 未开启 globals，测试文件显式 `import { ... } from 'vitest'`，避免污染类型环境。
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['src/test/setup.ts'],
  },
})
