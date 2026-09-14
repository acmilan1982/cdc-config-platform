// R2 §4.4 page-free NEGATIVE SELF-TEST.
//
// Proves that the strict judgement actually FAILS when a required invariant is violated — i.e. that R1's
// "exit=0" ambiguity ("ran to completion" vs "passed") is really closed. It needs no browser and no page:
// it takes the REAL collected result, injects a single 0.001 displacement into one required field
// (refresh_group_rect_delta.x, per the prompt's suggestion), and requires the shared assertion module — run
// through assert-result.mjs as a real child process — to return a NON-ZERO exit code.
//
//   node negative-self-test.mjs <real-strict-matrix.json> <out-dir>
//
// The mutated copy is written under an explicitly non-evidentiary name and carries a marker key, so it cannot
// be mistaken for real browser evidence. Expected end state: this script itself exits 0, having OBSERVED
// child exit codes 0 (untouched real result) and 1 (mutated result). The non-zero exit of the mutated
// judgement is the EXPECTED RESULT, not a failure of this test.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const input = process.argv[2]
const outDir = process.argv[3]
if (!input || !outDir) {
  console.error('usage: node negative-self-test.mjs <real-strict-matrix.json> <out-dir>')
  process.exit(2)
}
mkdirSync(outDir, { recursive: true })

const TARGET_VIEWPORT = '1280x800'
const TARGET_STATE = 'TIME_--'
const TARGET_FIELD = 'refresh_group_rect_delta.x'
const INJECTED = 0.001

const real = JSON.parse(readFileSync(input, 'utf8'))

// ---- build the mutated copy: one state's group.x moved by exactly +0.001
const mutated = JSON.parse(JSON.stringify(real))
const vp = mutated.matrix[TARGET_VIEWPORT]
if (!vp) throw new Error(`target viewport ${TARGET_VIEWPORT} missing from ${input}`)
const st = vp.states.find((s) => s.name === TARGET_STATE)
if (!st) throw new Error(`target state ${TARGET_STATE} missing from ${TARGET_VIEWPORT}`)
const before = st.group.x
st.group.x = before + INJECTED
// make the copy impossible to confuse with genuine browser output
mutated.__NEGATIVE_CONTROL__ = true
mutated.__NEGATIVE_CONTROL_NOTE__ =
  'CONSTRUCTED TEST INPUT - NOT BROWSER EVIDENCE. One required field was moved by +0.001 to prove the strict judgement fails.'

const mutatedPath = join(outDir, 'NEGATIVE-CONTROL-mutated-input.DO-NOT-USE-AS-EVIDENCE.json')
writeFileSync(mutatedPath, JSON.stringify(mutated, null, 2))

// ---- run the shared judgement twice as real child processes
const runChild = (file) =>
  spawnSync(process.execPath, [join(HERE, 'assert-result.mjs'), file], { encoding: 'utf8' })

const baseline = runChild(resolve(input))
const injected = runChild(mutatedPath)

const lines = []
lines.push('R2 NEGATIVE SELF-TEST (§4.4) — page-free proof that the strict judgement can fail')
lines.push(`real_result_input=${resolve(input)}`)
lines.push(`mutated_input=${mutatedPath}`)
lines.push(`mutation=${TARGET_VIEWPORT} / ${TARGET_STATE} / .group.x : ${before} -> ${before + INJECTED} (delta +${INJECTED})`)
lines.push(`required_field_asserted=${TARGET_FIELD}`)
lines.push('')
lines.push('--- control A: untouched real result through assert-result.mjs (expected exit 0) ---')
lines.push(`child_exit_code=${baseline.status}`)
lines.push(baseline.stdout.trimEnd())
lines.push('')
lines.push('--- control B: mutated result through assert-result.mjs (expected NON-ZERO) ---')
lines.push(`child_exit_code=${injected.status}`)
lines.push(injected.stdout.trimEnd())
lines.push('')

const controlAOk = baseline.status === 0
const controlBOk = typeof injected.status === 'number' && injected.status !== 0
const sawTargetField = injected.stdout.includes(TARGET_FIELD)

lines.push(
  `expected_non_zero_exit_observed=${controlBOk} (this non-zero exit IS the expected result of the negative control)`,
)
lines.push(`untouched_real_result_still_passes=${controlAOk}`)
lines.push(`target_field_reported_in_failures=${sawTargetField}`)
lines.push(`mutated_copy_is_marked_non_evidentiary=${mutatedPath.endsWith('DO-NOT-USE-AS-EVIDENCE.json')}`)
lines.push('')

if (controlAOk && controlBOk && sawTargetField) {
  lines.push('RESULT=NEGATIVE_CONTROL_BEHAVED_AS_EXPECTED')
} else {
  lines.push('RESULT=NEGATIVE_CONTROL_DID_NOT_BEHAVE_AS_EXPECTED')
}

const text = lines.join('\n') + '\n'
writeFileSync(join(outDir, 'negative-self-test.log'), text)
process.stdout.write(text)

// this script's own exit code describes the SELF-TEST verdict, not the mutated judgement's
if (controlAOk && controlBOk && sawTargetField) process.exit(0)
process.exit(1)
