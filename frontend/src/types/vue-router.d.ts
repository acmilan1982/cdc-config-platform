import 'vue-router'

/**
 * 路由元数据增强（SHARED_COMPONENT_DESIGN §7.7.2）：
 * 稳定滚动条槽由路由显式声明，未声明 / `false` 的路由一律保持浏览器默认 `scrollbar-gutter: auto`。
 */
declare module 'vue-router' {
  interface RouteMeta {
    /**
     * 稳定滚动条槽显式启用开关。
     * true → 真实纵向滚动容器保留稳定滚动条槽（scrollbar-gutter: stable）；
     * 省略 / false → 浏览器默认（scrollbar-gutter: auto）。
     */
    stableScrollbarGutter?: boolean
  }
}
