/**
 * 隔离夹具入口：用项目 node_modules 中的**真实** Vue 与 Element Plus 发行版
 * 渲染 fixture.html 中的组件 DOM（组件写法全在 HTML 里，本文件只负责挂载）。
 *
 * 不加载任何业务页面、不使用业务数据、不发任何网络写请求。
 */
import { createApp } from 'vue'
import ElementPlus from 'element-plus'

createApp({}).use(ElementPlus).mount('#app')

// 供 driver 轮询的就绪标记（挂载为同步，随后等一帧让 el-dialog 的 Teleport/过渡完成）。
window.__fixtureMounted = true
