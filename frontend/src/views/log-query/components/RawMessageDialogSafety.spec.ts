import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const source = readFileSync(
  resolve(process.cwd(), 'src/views/log-query/components/RawMessageDialog.vue'),
  'utf-8',
)

describe('原始消息纯文本安全展示（LQ-DESIGN-182）', () => {
  it('不使用 v-html，以文本插值渲染', () => {
    expect(source).not.toMatch(/v-html/)
    expect(source).toMatch(/\{\{\s*displayText\s*\}\}/)
    expect(source).toContain('<pre')
  })
})
