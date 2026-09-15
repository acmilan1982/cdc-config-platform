#!/usr/bin/env bash
# §9.1 版本证明：证明所服务源码、进程 cwd、工作树 HEAD 三者都属于本任务隔离 worktree，
# 不以 HTTP 200 代替版本证明。
#
#   用法: version-proof.sh <worktree-root> <frontend-url-origin> <out-dir>
set -uo pipefail

WT="${1:?worktree root required}"
ORIGIN="${2:?origin required}"
OUT="${3:?out dir required}"

mkdir -p "$OUT"
REPORT="$OUT/version-proof.txt"
: > "$REPORT"

emit() { echo "$*" | tee -a "$REPORT"; }

source /agent/cdc-config-platform/agent-env.sh >/dev/null 2>&1

emit "=== version proof $(date -Is) ==="
emit "worktree_root=$WT"
emit "origin=$ORIGIN"

# --- 1. 工作树 HEAD / 分支 ---
emit "--- git worktree ---"
emit "head=$(git -C "$WT" rev-parse HEAD)"
emit "head_short=$(git -C "$WT" rev-parse --short HEAD)"
emit "branch=$(git -C "$WT" rev-parse --abbrev-ref HEAD)"
emit "describe=$(git -C "$WT" describe --always --dirty --tags 2>/dev/null || echo n/a)"
emit "status_short_begin"
git -C "$WT" status --short | tee -a "$REPORT"
emit "status_short_end"
emit "worktree_list_begin"
git -C "$WT" worktree list --porcelain | tee -a "$REPORT"
emit "worktree_list_end"

# --- 2. 进程 cwd 证明 ---
emit "--- listener pid / cwd ---"
for port in 5173 8080; do
  pid="$(ss -lntp 2>/dev/null | awk -v p=":$port" '$0 ~ p {print $0}' | grep -oP 'pid=\K[0-9]+' | head -1)"
  if [ -z "${pid:-}" ]; then
    emit "port_${port}:NO_LISTENER"
    continue
  fi
  emit "port_${port}_pid=$pid"
  emit "port_${port}_cmd=$(tr '\0' ' ' < "/proc/$pid/cmdline" 2>/dev/null)"
  emit "port_${port}_user=$(stat -c '%U' "/proc/$pid" 2>/dev/null)"
  emit "port_${port}_cwd=$(readlink "/proc/$pid/cwd" 2>/dev/null)"
  emit "port_${port}_cwd_matches_worktree=$([ "$(readlink "/proc/$pid/cwd" 2>/dev/null)" = "$WT" ] || [ "$(readlink "/proc/$pid/cwd" 2>/dev/null)" = "$WT/frontend" ] || [ "$(readlink "/proc/$pid/cwd" 2>/dev/null)" = "$WT/backend" ] && echo yes || echo no)"
done

# --- 3. 所服务源码字节证明（Vite ?raw 模块 vs 工作树文件）---
emit "--- served source byte proof ---"
node - "$WT" "$ORIGIN" <<'NODE' | tee -a "$REPORT"
import { readFileSync } from 'node:fs'
const [wt, origin] = process.argv.slice(2)
const targets = [
  ['src/layouts/MainLayout.vue', '/src/layouts/MainLayout.vue'],
  ['src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue',
   '/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue'],
]
import { createHash } from 'node:crypto'
const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex')
for (const [rel, urlPath] of targets) {
  const local = readFileSync(`${wt}/frontend/${rel}`, 'utf8')
  const res = await fetch(`${origin}${urlPath}?raw`)
  const text = await res.text()
  // Vite 的 ?raw 模块形态为 `export default "<escaped>";`，其后还跟随一行
  // `//# sourceMappingURL=data:application/json;base64,...`；必须先把该行去掉再还原原始源码，
  // 否则还原失败会退化成“用模块文本比源文件”，得出无意义的 byte_identical=false。
  const marker = 'export default '
  let form = 'plain'
  let served = text
  if (text.startsWith(marker)) {
    form = 'module'
    let body = text.slice(marker.length)
    const smi = body.indexOf('\n//# sourceMappingURL=')
    if (smi >= 0) body = body.slice(0, smi)
    served = JSON.parse(body.trim().replace(/;$/, ''))
  }
  console.log(`file=${rel}`)
  console.log(`  http_status=${res.status}`)
  console.log(`  served_form=${form}`)
  console.log(`  local_bytes=${Buffer.byteLength(local)}`)
  console.log(`  served_bytes=${Buffer.byteLength(served)}`)
  console.log(`  local_sha256=${sha(local)}`)
  console.log(`  served_sha256=${sha(served)}`)
  console.log(`  byte_identical=${served === local}`)
  console.log(`  served_contains_gutter_class=${served.includes('dss-stable-gutter')}`)
  console.log(`  served_contains_scrollbar_gutter_stable=${served.includes('scrollbar-gutter: stable')}`)
}
// 服务端模块图：确认浏览器真正加载的模块与 scoped 样式模块都带本工作树的新增内容
const modRes = await fetch(`${origin}/src/layouts/MainLayout.vue`)
const modText = await modRes.text()
console.log(`module_transformed_status=${modRes.status}`)
console.log(`module_transformed_sha256=${sha(modText)}`)
console.log(`module_transformed_gutter_class_occurrences=${(modText.match(/dss-stable-gutter/g) ?? []).length}`)

const cssUrl = `${origin}/src/layouts/MainLayout.vue?vue&type=style&index=0&scoped=true&lang.css`
const cssRes = await fetch(cssUrl)
const cssText = await cssRes.text()
console.log(`scoped_style_status=${cssRes.status}`)
console.log(`scoped_style_sha256=${sha(cssText)}`)
console.log(`scoped_style_contains_scrollbar_gutter_stable=${cssText.includes('scrollbar-gutter: stable')}`)
console.log(`scoped_style_contains_gutter_selector=${cssText.includes('.content-area.dss-stable-gutter')}`)
console.log(`scoped_style_unconditional_stable_on_content_area=${/\.content-area\s*\{[^}]*scrollbar-gutter/.test(cssText)}`)
NODE

# --- 4. 本地构建产物哈希（源码一致性辅助证据）---
emit "--- source hashes ---"
for f in \
  frontend/src/layouts/MainLayout.vue \
  frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue; do
  emit "md5 $(md5sum "$WT/$f" | awk '{print $1}') $f"
done

emit "=== version proof end ==="
