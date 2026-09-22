# 08 — 隔离回滚验证（LTVT-FA-013 支撑证据）

> 通过条件：在 `/tmp` 新建的临时克隆/工作树中验证参考页接入提交可独立回退；回退后业务类与四组本地规则恢复，公共类 / `style scoped src` / import 无残留；公共层可保留且未启用页面零影响；定向测试与构建通过。**不得在正式工作树执行回滚**。
> 原始日志：`/tmp/ltvt-fa-001/fa013-targeted.txt`、`/tmp/ltvt-fa-001/fa013-build.txt`、`/tmp/ltvt-fa-001/fa013-scan.txt`、`/tmp/ltvt-fa-001/rollback/build-artifact-scan.json`
> 隔离位置：`/tmp/ltvt-fa-001/rollback`（本任务在 `/tmp` 创建的独立克隆；正式工作树 `/agent/cdc-config-platform` 全程未被回滚）

## 1. 回退方式

在隔离克隆中执行**仅前端、仅参考页接入**的独立回退：

```bash
git -C /tmp/ltvt-fa-001/rollback checkout c6d752c^ -- \
  frontend/src/views/data-source/DataSourcePage.vue \
  frontend/src/views/data-source/dataSource.spec.ts
```

说明：实现提交 `c6d752c` 同时携带文档与前端改动，直接 `git revert c6d752c` 会与后续文档提交（`284b263` / `4b3b217` / `b36c521`）在文档路径上产生冲突（`UU` / `UD`）。因此改用**按路径反向取回**的方式，等价地只回退「参考页接入」这一件事，而**不**触碰公共层文件与后续文档。这正是「参考页接入可独立回退」的严格验证。

回退后隔离克隆相对接入前提交 `ae6439b` 的 `frontend/**` 差异只剩公共层三文件：

```text
frontend/src/styles/list-table/index.ts
frontend/src/styles/list-table/list-table-visual.css
frontend/src/styles/list-table/list-table-visual.spec.ts
```

即：参考页两个文件已完全回到接入前状态，公共层被完整保留。

## 2. 回退结果逐项核验

| 核验项 | 命令 | 实测 | 结果 |
| --- | --- | --- | --- |
| 公共类无残留 | `grep -c 'LT_MAIN_TABLE_CLASS\|lt-main-table\|list-table-visual' DataSourcePage.vue` | `0` | PASS |
| import 无残留 | 同上（同一 grep 覆盖 import 行） | `0` | PASS |
| `style scoped src` 无残留 | 同上 | `0` | PASS |
| 业务类恢复 | `grep -c 'class="data-table"' DataSourcePage.vue` | `1`（回到普通字符串类名，非数组形式） | PASS |
| 四组本地规则恢复 | `<style>` 块内 `.data-table` 出现 7 个选择器（基础规则 + 表头 `.cell` + `td.el-table__cell` + `th.el-table__cell` + `.el-tag` 组），构成被替代的四组基础规则 | 恢复 | PASS |
| 公共层保留 | `ls src/styles/list-table/` | `index.ts` / `list-table-visual.css` / `list-table-visual.spec.ts` 三文件均在 | PASS |
| 参考页测试文件无公共类 | `grep -c 'lt-main-table' dataSource.spec.ts` | `0` | PASS |

## 3. 回退后定向测试

```bash
cd /tmp/ltvt-fa-001/rollback/frontend
npx vitest run src/views/data-source/dataSource.spec.ts src/styles/list-table/list-table-visual.spec.ts
```

```text
 Test Files  2 passed (2)
      Tests  121 passed (121)
   Duration  42.33s
EXIT=0
```

121 = 接入前的 109（参考页）+ 公共层静态契约 12。参考页测试数由 116 回落到 109，与「接入新增的 7 条等价接入用例随接入一并回退」一致；公共层 12 项契约在**未启用**状态下仍全部通过，说明公共层本身不依赖参考页接入、可独立保留。

## 4. 回退后构建

```bash
cd /tmp/ltvt-fa-001/rollback/frontend
npm run build
```

```text
✓ built in 38.26s
EXIT=0
```

## 5. 回退产物扫描（含如实标注）

```bash
node .../scripts/scan-build-artifacts.mjs \
  --dist /tmp/ltvt-fa-001/rollback/frontend/dist \
  --baseline-dist /tmp/ltvt-baseline/frontend/dist \
  --out /tmp/ltvt-fa-001/rollback
```

原始输出：

```text
BUILD_ARTIFACT_SCAN ok=false implRules=4080 baselineRules=4080 newRules=0 removedRules=0 \
  publicRules=0@ newGlobalRules=0 tokenDeclarations=0 tokenLiteralFiles=
FAILED_CHECKS: public_rules_are_exactly_4, public_rules_in_single_chunk,
               removed_rules_are_only_the_replaced_local_ones, token_literals_only_in_enabled_page_css
```

**对该 `ok=false` 的分层说明**：该扫描脚本的比对模型是「接入后产物 vs 接入前产物」，其 4 项失败检查（`public_rules_are_exactly_4` / `public_rules_in_single_chunk` / `removed_rules_are_only_the_replaced_local_ones` / `token_literals_only_in_enabled_page_css`）均在断言**接入应当发生**。在回退场景下，产物与基准逐值相同的正确表现本就是 `newRules=0 / removedRules=0 / publicRules=0 / newGlobalRules=0 / tokenDeclarations=0`——这正是「回退后零影响」的直接证据，而不是隐藏的失败。

为避免工具期望错位被误读，另行补充**直接产物证据**：

```text
grep -rl 'lt-main-table' /tmp/ltvt-fa-001/rollback/frontend/dist | wc -l   → 0
grep -rl 'lt-main-table' /agent/cdc-config-platform/frontend/dist   | wc -l → 2
```

回退产物中**不存在任何**含 `lt-main-table` 的文件；接入产物中存在 2 个。两者对照给出确定的回退/接入差异证据。

## 6. 正式工作树未被回滚的声明

- 隔离位置为 `/tmp/ltvt-fa-001/rollback`（独立克隆，`git log -1` = `b36c521`）。
- 正式工作树 `/agent/cdc-config-platform` 全程**未**执行 `git checkout`、`git reset`、`git revert`、`stash` 或任何回滚类操作；业务代码、测试、配置、依赖与锁文件零变化。
- 该隔离克隆由本任务在 `/tmp` 创建，目标精确，证据采集完成后按 §十 处理（保留并报告路径）。
