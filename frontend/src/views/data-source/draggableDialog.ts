/**
 * 为 Element Plus 弹窗启用“仅标题栏非控件区域可拖动”能力（DS-REQ-112）。
 *
 * 边界：
 * - 只有标题栏本身（不含关闭按钮 .el-dialog__headerbtn）发起拖动；
 *   弹窗内容区的输入框、选择器、表格、按钮不会误触发。
 * - 只响应鼠标主键，右键等操作不发起拖动。
 * - 拖动时弹窗不能完全拖出 viewport，标题栏始终完整可见。
 * - 浏览器尺寸变化后自动修正回可操作范围。
 * - 活动拖动期间注册的 window 级 mousemove/mouseup 由 stopActiveDrag() 统一管理：
 *   正常松开、新一轮拖动开始前以及 destroy() 时都会成对清理，
 *   弹窗/组件在鼠标尚未松开时卸载也不会残留指向旧 DOM 的窗口监听。
 * - 返回 destroy()；组件卸载或弹窗重开时调用以清理监听。
 *
 * 每次打开重新调用本函数会新建控制器并复位到默认居中位置（transform 清空）。
 */
export interface DialogDragController {
  destroy: () => void
}

const HEADER_SELECTOR = '.el-dialog__header'
const HEADER_BTN_SELECTOR = '.el-dialog__headerbtn'

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function enableDialogDrag(
  dialogEl: HTMLElement,
  options?: { headerSelector?: string },
): DialogDragController {
  const headerEl = dialogEl.querySelector<HTMLElement>(
    options?.headerSelector ?? HEADER_SELECTOR,
  )
  if (!headerEl) {
    return { destroy: () => undefined }
  }
  const dragHeader = headerEl

  let posX = 0
  let posY = 0

  // 活动拖动期间的 window 级监听引用；未在拖动中时为 null。
  let activeMoveHandler: ((ev: MouseEvent) => void) | null = null
  let activeUpHandler: ((ev: MouseEvent) => void) | null = null

  function applyTransform() {
    dialogEl.style.transform = `translate(${posX}px, ${posY}px)`
  }

  // 每次打开重新绑定即复位到默认居中位置（transform 清空）
  applyTransform()

  /** 成对移除活动拖动的 window 级监听，无活动拖动时为 no-op。 */
  function stopActiveDrag() {
    if (activeMoveHandler) {
      window.removeEventListener('mousemove', activeMoveHandler)
      activeMoveHandler = null
    }
    if (activeUpHandler) {
      window.removeEventListener('mouseup', activeUpHandler)
      activeUpHandler = null
    }
  }

  function beginDrag(e: MouseEvent) {
    // 只响应鼠标主键，避免右键等操作发起拖动
    if (e.button !== 0) {
      return
    }
    const target = e.target as HTMLElement
    if (target.closest(HEADER_BTN_SELECTOR)) {
      return
    }
    // 新一轮拖动开始前先清理任何残留的活动拖动
    stopActiveDrag()
    const savedX = posX
    const savedY = posY
    const startX = e.clientX
    const startY = e.clientY
    const headerRect = dragHeader.getBoundingClientRect()
    // 以“标题栏完整留在 viewport 内”为约束推导本次拖动的可移动范围
    const minX = savedX - headerRect.left
    const maxX = savedX + (window.innerWidth - headerRect.right)
    const minY = savedY - headerRect.top
    const maxY = savedY + (window.innerHeight - headerRect.bottom)

    function onMove(ev: MouseEvent) {
      posX = clamp(savedX + (ev.clientX - startX), minX, maxX)
      posY = clamp(savedY + (ev.clientY - startY), minY, maxY)
      applyTransform()
    }

    function onUp() {
      stopActiveDrag()
    }

    activeMoveHandler = onMove
    activeUpHandler = onUp
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function correctPosition() {
    const headerRect = dragHeader.getBoundingClientRect()
    if (headerRect.width === 0 && headerRect.height === 0) {
      return
    }
    const dx = clamp(0, -headerRect.left, window.innerWidth - headerRect.right)
    const dy = clamp(0, -headerRect.top, window.innerHeight - headerRect.bottom)
    if (dx !== 0 || dy !== 0) {
      posX += dx
      posY += dy
      applyTransform()
    }
  }

  dragHeader.addEventListener('mousedown', beginDrag)
  window.addEventListener('resize', correctPosition)

  return {
    destroy() {
      dragHeader.removeEventListener('mousedown', beginDrag)
      window.removeEventListener('resize', correctPosition)
      stopActiveDrag()
    },
  }
}
