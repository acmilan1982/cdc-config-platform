/**
 * 同路由"再次点击当前菜单"重新初始化事件总线（LQ-UI-142~146 / LQ-AC-181）。
 * 左侧菜单再次点击当前"日志查询"项时不会触发 vue-router 重挂载，
 * 因此通过该总线通知 LogQueryPage 执行完整重新初始化，不依赖组件卸载重挂载。
 */
type ReinitHandler = () => void

const handlers = new Set<ReinitHandler>()

export function onLogQueryReinit(handler: ReinitHandler): () => void {
  handlers.add(handler)
  return () => {
    handlers.delete(handler)
  }
}

export function triggerLogQueryReinit(): void {
  for (const handler of [...handlers]) {
    handler()
  }
}
