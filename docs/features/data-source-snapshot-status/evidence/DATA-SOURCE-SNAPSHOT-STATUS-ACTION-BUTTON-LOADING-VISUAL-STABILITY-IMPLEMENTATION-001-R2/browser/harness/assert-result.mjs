// Page-free CLI over the shared strict assertion module:
//   node assert-result.mjs <result.json> [analysis-out.txt]
// Reads an already-collected strict-matrix-shaped result, runs the SAME judgement used by the real browser
// harness (./assertions.mjs), prints the failures, and exits 0 only when every hard assertion passed.
// The page-free negative self-test spawns this to obtain a real, observed process exit code.
import { readFileSync, writeFileSync } from 'node:fs'
import { evaluateStrictResult } from './assertions.mjs'

const input = process.argv[2]
const out = process.argv[3]
if (!input) {
  console.error('usage: node assert-result.mjs <result.json> [analysis-out.txt]')
  process.exit(2)
}

const result = JSON.parse(readFileSync(input, 'utf8'))
const verdict = evaluateStrictResult(result)

const lines = []
lines.push(`input=${input}`)
lines.push(`checks_passed=${verdict.check_count}`)
lines.push(`assertion_failure_count=${verdict.failure_count}`)
lines.push(`RESULT=${verdict.passed ? 'ALL_HARD_ASSERTIONS_PASSED' : 'ASSERTION_FAILURES'}`)
for (const f of verdict.failures) {
  lines.push(`  FAIL ${f.field} | ${f.viewport} | actual=${JSON.stringify(f.actual)} | expected=${JSON.stringify(f.expected)}`)
}
const text = lines.join('\n') + '\n'
process.stdout.write(text)
if (out) writeFileSync(out, text)

process.exit(verdict.passed ? 0 : 1)
