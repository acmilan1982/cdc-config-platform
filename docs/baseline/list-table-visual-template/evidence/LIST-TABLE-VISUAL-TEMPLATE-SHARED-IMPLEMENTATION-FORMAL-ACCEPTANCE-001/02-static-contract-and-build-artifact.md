# 02 — 生产构建与产物层核验（LTVT-FA-006 支撑证据）

> 原始日志：`/tmp/ltvt-fa-001/fa006-build.txt`、`/tmp/ltvt-fa-001/fa006-scan.txt`、`/tmp/ltvt-fa-001/build-artifact-scan.json`
> 扫描工具：`docs/baseline/list-table-visual-template/reports/evidence/LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-AND-DATA-SOURCE-REFERENCE-INTEGRATION-001/scripts/scan-build-artifacts.mjs`（既有脚本，未修改）
> 对比基准产物：`/tmp/ltvt-baseline/frontend/dist`（由接入前提交 `ae6439b` 隔离副本构建）

## 1. 生产构建

```bash
cd /agent/cdc-config-platform/frontend
npm run build
```

原始结果尾部：

```text
dist/assets/DataSourcePage-BgNh9VuW.js   29.77 kB │ gzip: 9.12 kB
✓ built in 17.11s
EXIT=0
```

`vue-tsc` 类型检查与 `vite build` 均成功，退出码 `0`。

## 2. 产物层扫描

```bash
node .../scripts/scan-build-artifacts.mjs \
  --dist /agent/cdc-config-platform/frontend/dist \
  --baseline-dist /tmp/ltvt-baseline/frontend/dist \
  --out /tmp/ltvt-fa-001
```

原始结论：

```text
BUILD_ARTIFACT_SCAN ok=true implRules=4080 baselineRules=4080 newRules=4 removedRules=4 \
  publicRules=4@assets/DataSourcePage-DonW-FIj.css newGlobalRules=0 tokenDeclarations=0 \
  tokenLiteralFiles=assets/DataSourcePage-DonW-FIj.css
```

10 项检查全部为 `true`：

| 检查 | 含义 | 结果 |
| --- | --- | --- |
| `public_rules_are_exactly_4` | 公共选择器恰好 4 条 | true |
| `public_rules_in_single_chunk` | 4 条同处一个产物分块 | true |
| `public_chunk_is_data_source_page` | 该分块即数据源管理页 | true |
| `public_chunk_has_no_unqualified_ep_rule` | 公共分块内无未限定 EP 规则 | true |
| `no_new_global_rule` | 无新增全局规则 | true |
| `removed_rules_are_only_the_replaced_local_ones` | 被移除规则仅为被逐值等价替代的局部规则 | true |
| `no_token_declaration_in_artifact` | 产物中无令牌声明 | true |
| `no_root_scope_token_declaration` | 无 `:root/body` 级令牌声明 | true |
| `token_literals_only_in_enabled_page_css` | 令牌字面量仅出现在启用页 CSS | true |
| `no_token_literal_in_any_js` | 任何 JS 中均无令牌字面量 | true |

## 3. 新增 / 移除规则集逐条

新增（4 条，全部带根类限定，均位于唯一分块 `assets/DataSourcePage-DonW-FIj.css`）：

```text
.lt-main-table[data-v-2d647f7a]
.lt-main-table[data-v-2d647f7a] .el-table__header th .cell
.lt-main-table[data-v-2d647f7a] td.el-table__cell
.lt-main-table[data-v-2d647f7a] th.el-table__cell
```

移除（4 条，全部为被替代的局部 `.data-table` 规则，位于接入前分块）：

```text
.data-table[data-v-9c65c310]
.data-table[data-v-9c65c310] .el-table__header th .cell
.data-table[data-v-9c65c310] td.el-table__cell
.data-table[data-v-9c65c310] th.el-table__cell
```

`newGlobalRules=[]`、`removedNotDataTable=[]`、`unqualifiedInPublicChunk=[]`、`tokenDeclarations=[]`、`rootScopeTokenDeclarations=[]` —— **零全局泄漏**。

## 4. 令牌字面量分布

产物中令牌字面量（9 个）**只**出现在 `assets/DataSourcePage-DonW-FIj.css`（即启用页面的分块 CSS），且该文件不存在任何 `--lt-*:` 声明式赋值：令牌仅作为 `var(--lt-*, fallback)` 被消费。`token_literals_only_in_enabled_page_css` 与 `no_token_declaration_in_artifact` 同时为真，证明公共层既不引入全局令牌，也不产生跨页面污染。
