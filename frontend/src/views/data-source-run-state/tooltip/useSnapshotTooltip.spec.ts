import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { useSnapshotTooltip, SNAPSHOT_TOOLTIP_DELAY_MS } from './useSnapshotTooltip'

/**
 * 页面级单实例受控 Tooltip 控制器（DSS-REQ-070，AC-076/077）：
 * 统一延迟 ~320ms；新 key 先关旧项；延迟窗内离开/records 替换/滚动/resize/隐藏/卸载均取消并关闭；
 * 任意时刻最多 1 个。纯逻辑测试用假定时器驱动延迟，无需真实等待。
 */

function hostEl(): HTMLElement {
  const el = document.createElement('div')
  document.body.appendChild(el)
  return el
}

function showOpts(el: HTMLElement, key = 'k', content = '完整内容') {
  return { key, content, el }
}

beforeEach(() => {
  document.body.innerHTML = ''
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllTimers()
  document.body.innerHTML = ''
})

async function flushDelay(): Promise<void> {
  await vi.advanceTimersByTimeAsync(SNAPSHOT_TOOLTIP_DELAY_MS)
  await nextTick()
}

describe('useSnapshotTooltip 显示与延迟（DSS-REQ-070④，AC-077）', () => {
  it('show 后延迟窗内不显示，超延迟才 reveal', async () => {
    const ctl = useSnapshotTooltip()
    const el = hostEl()
    ctl.show(showOpts(el, 'a', 'A'))
    await vi.advanceTimersByTimeAsync(SNAPSHOT_TOOLTIP_DELAY_MS - 1)
    expect(ctl.current.value).toBeNull()
    await vi.advanceTimersByTimeAsync(1)
    expect(ctl.current.value?.key).toBe('a')
    expect(ctl.current.value?.content).toBe('A')
    expect(ctl.current.value?.anchor.top).toBeGreaterThanOrEqual(0)
    ctl.destroy()
  })

  it('内容为空白/空字符串时直接关闭，不进入延迟', async () => {
    const ctl = useSnapshotTooltip()
    const el = hostEl()
    ctl.show(showOpts(el, 'a', '   '))
    await vi.advanceTimersByTimeAsync(SNAPSHOT_TOOLTIP_DELAY_MS)
    expect(ctl.current.value).toBeNull()
    ctl.destroy()
  })

  it('触发元素在 show 后移出文档不影响 reveal：锚点几何已在 show 时刻取样，延迟窗不依赖元素存活', async () => {
    const ctl = useSnapshotTooltip()
    const el = hostEl()
    ctl.show(showOpts(el, 'a', 'A'))
    el.remove()
    await flushDelay()
    expect(ctl.current.value?.key).toBe('a')
    expect(ctl.current.value?.content).toBe('A')
    ctl.destroy()
  })

  it('锚点在 show 时刻取样（非 reveal 时读取触发元素矩形）', async () => {
    const ctl = useSnapshotTooltip()
    const el = hostEl()
    const rect = { top: 11, left: 7, width: 30, height: 14, bottom: 25, right: 37 } as DOMRect
    const spy = vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(rect)
    ctl.show(showOpts(el, 'a', 'A'))
    el.remove()
    await flushDelay()
    expect(ctl.current.value?.anchor).toEqual({
      top: 11,
      left: 7,
      width: 30,
      height: 14,
      bottom: 25,
      right: 37,
    })
    expect(spy).toHaveBeenCalledTimes(1)
    spy.mockRestore()
    ctl.destroy()
  })
})

describe('useSnapshotTooltip 单实例：新 key 先关旧项、离开关闭（DSS-REQ-070②③⑤，AC-076）', () => {
  it('快速切换 key：旧项即使已显示也即时关闭，再经延迟只显示新项（任意时刻 ≤1）', async () => {
    const ctl = useSnapshotTooltip()
    const elA = hostEl()
    const elB = hostEl()
    ctl.show(showOpts(elA, 'a', 'A'))
    await flushDelay()
    expect(ctl.current.value?.key).toBe('a')

    // 展示中直接切新 key：旧项先即时关闭，不残留
    ctl.show(showOpts(elB, 'b', 'B'))
    expect(ctl.current.value).toBeNull()
    await flushDelay()
    expect(ctl.current.value?.key).toBe('b')
    expect(ctl.current.value?.content).toBe('B')
    ctl.destroy()
  })

  it('切换 key 前旧项未 reveal：旧延迟被取消，只 reveal 新项', async () => {
    const ctl = useSnapshotTooltip()
    const elA = hostEl()
    const elB = hostEl()
    ctl.show(showOpts(elA, 'a', 'A'))
    await vi.advanceTimersByTimeAsync(100)
    ctl.show(showOpts(elB, 'b', 'B'))
    await flushDelay()
    expect(ctl.current.value?.key).toBe('b')
    ctl.destroy()
  })

  it('延迟窗内离开（show 后 hide）→ 取消延迟且不显示', async () => {
    const ctl = useSnapshotTooltip()
    const el = hostEl()
    ctl.show(showOpts(el, 'a', 'A'))
    ctl.hide()
    await flushDelay()
    expect(ctl.current.value).toBeNull()
    ctl.destroy()
  })

  it('已 reveal 后离开（hide）→ 即时关闭', async () => {
    const ctl = useSnapshotTooltip()
    const el = hostEl()
    ctl.show(showOpts(el, 'a', 'A'))
    await flushDelay()
    expect(ctl.current.value).not.toBeNull()
    ctl.hide()
    expect(ctl.current.value).toBeNull()
    ctl.destroy()
  })

  it('同一 key 重复触发以最后一次为准（不重复累积）', async () => {
    const ctl = useSnapshotTooltip()
    const el = hostEl()
    ctl.show(showOpts(el, 'a', 'A1'))
    ctl.show(showOpts(el, 'a', 'A2'))
    await flushDelay()
    expect(ctl.current.value?.content).toBe('A2')
    ctl.destroy()
  })
})

describe('useSnapshotTooltip 全局关闭事件（DSS-REQ-070⑤，AC-076）', () => {
  async function revealed(): Promise<{ ctl: ReturnType<typeof useSnapshotTooltip>; unbind: () => void }> {
    const ctl = useSnapshotTooltip()
    const unbind = ctl.bindGlobalClose()
    ctl.show(showOpts(hostEl(), 'a', 'A'))
    await flushDelay()
    expect(ctl.current.value).not.toBeNull()
    return { ctl, unbind }
  }

  it('window scroll（捕获层，覆盖表格容器滚动）关闭', async () => {
    const { ctl, unbind } = await revealed()
    window.dispatchEvent(new Event('scroll'))
    expect(ctl.current.value).toBeNull()
    unbind()
    ctl.destroy()
  })

  it('window resize 关闭', async () => {
    const { ctl, unbind } = await revealed()
    window.dispatchEvent(new Event('resize'))
    expect(ctl.current.value).toBeNull()
    unbind()
    ctl.destroy()
  })

  it('页面隐藏（document visibilitychange）关闭', async () => {
    const { ctl, unbind } = await revealed()
    document.dispatchEvent(new Event('visibilitychange'))
    expect(ctl.current.value).toBeNull()
    unbind()
    ctl.destroy()
  })

  it('解绑后不再响应全局事件', async () => {
    const { ctl, unbind } = await revealed()
    unbind()
    window.dispatchEvent(new Event('scroll'))
    expect(ctl.current.value).not.toBeNull()
    ctl.destroy()
  })
})

describe('useSnapshotTooltip 卸载清理（DSS-REQ-070⑤，AC-076）', () => {
  it('destroy 清空延迟与当前项；其后 show 被忽略，不再产生状态', async () => {
    const ctl = useSnapshotTooltip()
    ctl.show(showOpts(hostEl(), 'a', 'A'))
    ctl.destroy()
    await flushDelay()
    expect(ctl.current.value).toBeNull()

    ctl.show(showOpts(hostEl(), 'b', 'B'))
    await flushDelay()
    expect(ctl.current.value).toBeNull()
  })
})
