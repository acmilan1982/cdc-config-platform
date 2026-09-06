import { describe, it, expect } from 'vitest'
import { TIME_DASH, formatEpochToHms, formatTimeOrDash } from './format'

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
