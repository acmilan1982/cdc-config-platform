// Negative self-test for the acceptance judgement module (Prompt §7.4: sub-pixel displacement must not hide).
// It loads the REAL collected result and re-runs the SAME pure assertion module on mutated copies:
//   (a) untouched result                     -> must PASS (no false positive)
//   (b) one state's button width shifted by 0.001px -> must FAIL (no false negative / no rounding mask)
// Exit code 0 only when the module behaves exactly that way.
import { readFileSync } from 'node:fs'
import { evaluateAcceptanceResult } from './assertions.mjs'

const file = process.argv[2]
if (!file) { console.error('usage: node negative-selftest.mjs <acceptance-matrix.json>'); process.exit(2) }
const result = JSON.parse(readFileSync(file, 'utf8'))

const baseline = evaluateAcceptanceResult(result)

// Inject a 0.001px displacement into a single state's recorded rect width.
const mutated = JSON.parse(JSON.stringify(result))
const vpKey = '1920x1080'
const target = mutated.matrix[vpKey].states.find((s) => s.name === 'MANUAL_LOADING')
target.queryBtn.w = target.queryBtn.w + 0.001
target.refreshBtn.y = target.refreshBtn.y + 0.001
const afterMutation = evaluateAcceptanceResult(mutated)

const lines = []
lines.push('NEGATIVE SELF-TEST OF THE ACCEPTANCE ASSERTION MODULE')
lines.push(`input=${file}`)
lines.push(`(a) untouched result            : passed=${baseline.passed} failures=${baseline.failure_count} checks=${baseline.check_count}`)
lines.push(`(b) +0.001px width/y in ${vpKey}/MANUAL_LOADING : passed=${afterMutation.passed} failures=${afterMutation.failure_count}`)
lines.push('    detected failures:')
for (const f of afterMutation.failures) lines.push(`      ${f.field} | ${f.where} | actual=${JSON.stringify(f.actual)} expected=${JSON.stringify(f.expected)}`)

const ok = baseline.passed === true && afterMutation.passed === false && afterMutation.failure_count > 0
lines.push('')
lines.push(`SELF_TEST_RESULT=${ok ? 'PASS (module is falsifiable: clean passes, 0.001px displacement detected)' : 'FAIL'}`)
lines.push(`SELF_TEST_EXIT_CODE=${ok ? 0 : 1}`)
process.stdout.write(lines.join('\n') + '\n')
process.exit(ok ? 0 : 1)
