import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import SnapshotTooltipHost from './SnapshotTooltipHost.vue'
import { computeTooltipPlacement } from './tooltipPosition'
import type { TooltipAnchor } from './tooltipPosition'

/**
 * 页面级单实例 Tooltip Host 回归（R1-01）：
 * - 无固定 420px 上限：内容以 max-content 单行为主，仅超安全视口才由 CSS 换行（真实像素见 R1 浏览器证据，
 *   jsdom 不做文本排版，本文件覆盖 Host 的定位/隐藏时序/单实例与无 title 契约）；
 * - 目标 A→B 切换必须先进入不可见定位态，测量后按 B 新锚点一次性定位，不停留在 A 坐标（AC-076/077）。
 * 说明：不 attachTo，使 Teleport 目标 body 位于应用容器之外而真正迁入 document.body（与 Table spec 同法）。
 */
function anchor(top: number, left: number, width = 20, height = 20): TooltipAnchor {
  return { top, left, width, height, bottom: top + height, right: left + width }
}

const WIDTH = 240
const HEIGHT = 40

const A = { key: 'a', content: 'AAAA', anchor: anchor(100, 200) }
const B = { key: 'b', content: 'BBBB', anchor: anchor(300, 500) }
const EXPECTED_A = computeTooltipPlacement(A.anchor, { width: WIDTH, height: HEIGHT }, { width: 1000, height: 600 })
const EXPECTED_B = computeTooltipPlacement(B.anchor, { width: WIDTH, height: HEIGHT }, { width: 1000, height: 600 })

function hostEl(): HTMLElement | null {
  return document.querySelector('.dss-single-tooltip[data-tt-host="1"]')
}

function readStyle(): { visibility: string; left: string; top: string } {
  const el = hostEl()
  if (!el) return { visibility: 'hidden', left: '', top: '' }
  return {
    visibility: el.style.visibility || '',
    left: el.style.left || '',
    top: el.style.top || '',
  }
}

async function flush(): Promise<void> {
  await nextTick()
  await nextTick()
}

beforeEach(() => {
  document.body.innerHTML = ''
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 })
  // jsdom 不做排版：让 Host 测量拿到确定性的 border-box 尺寸（真实像素由浏览器证据覆盖）
  Object.defineProperty(window.HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get() {
      return WIDTH
    },
  })
  Object.defineProperty(window.HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get() {
      return HEIGHT
    },
  })
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('SnapshotTooltipHost 首次揭示（R1-01，AC-076/077）', () => {
  it('reveal 前为不可见定位态，完成测量后一次性按锚点可见定位；host 恒为 1', async () => {
    const wrapper = mount(SnapshotTooltipHost, { props: { target: null } })
    expect(hostEl()).toBeNull() // 无目标不渲染

    await wrapper.setProps({ target: A })
    // 测量窗口：内容已切入但尚未完成定位 → 处于不可见定位态
    const mid = readStyle()
    expect(mid.visibility).toBe('hidden')

    await flush()
    const s = readStyle()
    // 测量完成：可见且坐标 = 期望（宽度含 border-box 240）
    expect(s.visibility).not.toBe('hidden')
    expect(Number.parseInt(s.left, 10)).toBe(EXPECTED_A.left)
    expect(Number.parseInt(s.top, 10)).toBe(EXPECTED_A.top)
    expect(hostEl()?.textContent).toBe('AAAA')
    expect(document.querySelectorAll('.dss-single-tooltip[data-tt-host="1"]').length).toBe(1)
    wrapper.unmount()
  })

  it('host 内容不携带原生 title，且为 role=tooltip 单实例', async () => {
    const wrapper = mount(SnapshotTooltipHost, { props: { target: A } })
    await flush()
    const el = hostEl()
    expect(el).not.toBeNull()
    expect(el!.getAttribute('role')).toBe('tooltip')
    expect(el!.querySelectorAll('[title]').length).toBe(0)
    expect(document.querySelectorAll('.dss-single-tooltip').length).toBe(1)
    wrapper.unmount()
  })
})

describe('SnapshotTooltipHost 目标切换无旧坐标残影（R1-01，AC-077）', () => {
  it('A→B 切换：测量前先进入不可见定位态，随后按 B 新锚点一次性定位，不停留在 A 坐标', async () => {
    expect(EXPECTED_A.left).not.toBe(EXPECTED_B.left)
    const wrapper = mount(SnapshotTooltipHost, { props: { target: A } })
    await flush()
    expect(Number.parseInt(readStyle().left, 10)).toBe(EXPECTED_A.left)

    // 内容已切到 B：若仍沿用 A 坐标即为“旧坐标闪现”；R1 要求此刻必须已回到不可见定位态。
    await wrapper.setProps({ target: B })
    const mid = readStyle()
    expect(mid.visibility).toBe('hidden')
    expect(Number.parseInt(mid.left, 10)).not.toBe(EXPECTED_A.left)

    // 测量完成：一次性定位到 B 新锚点，内容为 B，host 仍唯一。
    await flush()
    const s = readStyle()
    expect(s.visibility).not.toBe('hidden')
    expect(Number.parseInt(s.left, 10)).toBe(EXPECTED_B.left)
    expect(Number.parseInt(s.top, 10)).toBe(EXPECTED_B.top)
    expect(hostEl()?.textContent).toBe('BBBB')
    expect(document.querySelectorAll('.dss-single-tooltip[data-tt-host="1"]').length).toBe(1)
    wrapper.unmount()
  })

  it('目标切换为空：host 即时移除，不留旧定位', async () => {
    const wrapper = mount(SnapshotTooltipHost, { props: { target: A } })
    await flush()
    expect(hostEl()).not.toBeNull()
    await wrapper.setProps({ target: null })
    await flush()
    expect(hostEl()).toBeNull()
    expect(document.querySelectorAll('.dss-single-tooltip[data-tt-host="1"]').length).toBe(0)
    wrapper.unmount()
  })
})
