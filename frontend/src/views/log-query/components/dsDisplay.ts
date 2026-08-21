/**
 * 数据源四态降级展示（LQ-UI-183 / LQ-DESIGN-180）：
 * 1. 名称有值且与 ID 不同 → 显示名称；
 * 2. 名称为空白 → 显示"未定义名称"；
 * 3. 名称缺失或名称等于 ID（后端未匹配到名称时回退为 ID）→ 显示原始 ID；
 * 4. 名称与 ID 皆缺失 → `--`。
 * 单元格 / Tooltip / 详情三处展示一致，不出现 `ID（ID）`。
 */

export function hasRealName(
  name: string | null | undefined,
  id: string | null | undefined,
): boolean {
  if (name === null || name === undefined) return false
  const trimmed = name.trim()
  if (trimmed === '') return false
  if (id !== null && id !== undefined && trimmed === id) return false
  return true
}

/** 单元格展示文本：`--` / 原始 ID / 未定义名称 / 名称 */
export function dsCellText(
  name: string | null | undefined,
  id: string | null | undefined,
): string {
  if (hasRealName(name, id)) {
    return (name as string).trim()
  }
  if (name !== null && name !== undefined && name.trim() === '') {
    return '未定义名称'
  }
  if (id) return id
  return '--'
}

/** Tooltip 文案：名称（可选） + 数据源 ID（可选） */
export function dsTooltipText(
  name: string | null | undefined,
  id: string | null | undefined,
): string {
  if (hasRealName(name, id)) {
    const realName = (name as string).trim()
    return id ? `${realName}  数据源 ID：${id}` : realName
  }
  if (id) return `数据源 ID：${id}`
  return '未定义名称'
}

/** 详情描述项文案：`名称（ID）`，名称缺失时只显示一次 ID */
export function dsDetailText(
  name: string | null | undefined,
  id: string | null | undefined,
): string {
  if (hasRealName(name, id)) {
    const realName = (name as string).trim()
    return id ? `${realName}（${id}）` : realName
  }
  if (name !== null && name !== undefined && name.trim() === '') {
    return id ? `未定义名称（${id}）` : '未定义名称'
  }
  return id ? id : '--'
}
