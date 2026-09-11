import { describe, it, expect } from 'vitest'
import {
  FIELD_TRUNCATE_CODE_POINTS,
  TIME_DASH,
  codePointLength,
  formatEpochToHms,
  formatTimeOrDash,
  truncateCodePoints,
} from './format'

describe('format 时间空值与最近成功刷新格式化（DSS-REQ-031/032/033/055，AC-029/030/052）', () => {
  it('null/undefined/空串 → --；字符串原样透传（不改写业务时间值）', () => {
    expect(formatTimeOrDash(null)).toBe('--')
    expect(formatTimeOrDash(undefined)).toBe('--')
    expect(formatTimeOrDash('')).toBe('--')
    expect(formatTimeOrDash('2026-08-18 08:00:00')).toBe('2026-08-18 08:00:00')
  })

  it('TIME_DASH 常量与空值占位一致', () => {
    expect(TIME_DASH).toBe('--')
  })

  it('epoch → HH:mm:ss（补零）', () => {
    // 2026-09-06 08:05:09 本地时区
    const d = new Date(2026, 8, 6, 8, 5, 9)
    expect(formatEpochToHms(d.getTime())).toBe('08:05:09')
  })

  it('null/非有限值 → --（从未成功占位）', () => {
    expect(formatEpochToHms(null)).toBe('--')
    expect(formatEpochToHms(undefined)).toBe('--')
    expect(formatEpochToHms(Number.NaN)).toBe('--')
  })
})

describe('format 统一字段级截断（DSS-REQ-085，AC-098）', () => {
  const cp = (s: string, n: number) => s.repeat(n)

  it('常量固定为 20 个 code point', () => {
    expect(FIELD_TRUNCATE_CODE_POINTS).toBe(20)
  })

  it('边界：≤20 显示原文不追加省略号；21/22/100 取前 20 个 code point + 英文三点 ...', () => {
    for (const n of [0, 1, 19, 20]) {
      const s = cp('a', n)
      expect(truncateCodePoints(s)).toBe(s)
      expect(truncateCodePoints(s)).not.toContain('...')
    }
    for (const n of [21, 22, 100]) {
      expect(truncateCodePoints(cp('a', n))).toBe(cp('a', 20) + '...')
    }
  })

  it('省略号为英文三点，不是单字符 …', () => {
    expect(truncateCodePoints(cp('a', 21))).toBe(cp('a', 20) + '...')
    expect(truncateCodePoints(cp('a', 21))).not.toContain('…')
  })

  it('中文字符按 1 个 code point 计（20 个中文完整显示、21 个才截断）', () => {
    expect(codePointLength(cp('中', 20))).toBe(20)
    expect(truncateCodePoints(cp('中', 20))).toBe(cp('中', 20))
    expect(truncateCodePoints(cp('中', 21))).toBe(cp('中', 20) + '...')
  })

  it('代理对（补充平面）按 1 个 code point 计且不被拆开：25 个 emoji → 20 个完整 emoji + ...', () => {
    const emoji = cp('😀', 25)
    expect(codePointLength(emoji)).toBe(25)
    const out = truncateCodePoints(emoji)
    expect(out).toBe(cp('😀', 20) + '...')
    // 保留部分逐 code point 校验：全部是完整 emoji，无落单代理码元
    expect(Array.from(out.slice(0, -3))).toEqual(Array.from({ length: 20 }, () => '😀'))
  })

  it('按 code point 而非 UTF-16 code unit 判定超限', () => {
    const mixed = '中'.repeat(10) + '😀'.repeat(10)
    expect(mixed.length).toBe(30) // UTF-16 code unit
    expect(codePointLength(mixed)).toBe(20) // code point
    expect(truncateCodePoints(mixed)).toBe(mixed) // 恰好 20 code point → 原文
    expect(truncateCodePoints(mixed + '中')).toBe(mixed + '...')
  })

  it('空串与单字符原样返回', () => {
    expect(truncateCodePoints('')).toBe('')
    expect(truncateCodePoints('a')).toBe('a')
  })
})
