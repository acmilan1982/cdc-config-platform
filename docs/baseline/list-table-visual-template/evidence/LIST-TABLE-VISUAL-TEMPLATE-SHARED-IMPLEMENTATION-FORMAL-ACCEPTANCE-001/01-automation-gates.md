# 01 — 自动化与源码契约门禁（LTVT-FA-002 ～ LTVT-FA-005 支撑证据）

> 原始日志：`/tmp/ltvt-fa-001/fa004-targeted.txt`、`/tmp/ltvt-fa-001/fa005-full.txt`
> 执行目录：`/agent/cdc-config-platform/frontend`（正式工作树，只读执行）
> 环境：Node.js / npm 来自 `/opt/node`，`npm run` 与 `npx vitest` 均未触发依赖安装。

## LTVT-FA-002 — 公共静态契约

命令：

```bash
cd /agent/cdc-config-platform/frontend
npx vitest run src/styles/list-table/list-table-visual.spec.ts
```

实测结果（含在 FA-004 定向执行内）：`src/styles/list-table/list-table-visual.spec.ts (12 tests)` **12/12 通过**，无 skipped。

12 项断言与通过条件逐项对应：

| # | 断言 | 验收要求 | 结果 |
| --- | --- | --- | --- |
| 1 | 公共根类与导出键存在 | 根类 `lt-main-table` | PASS |
| 2 | 令牌清单恰好 9 个且名称与批准设计逐一相符 | 9 个 `--lt-*` 令牌 | PASS |
| 3 | 每个令牌的消费点都带内联默认值，且默认值与批准设计一致 | `var(--lt-*, fallback)` | PASS |
| 4 | 公共层不声明任何 `--lt-*` 的值（只允许出现在 `var()` 内联回退中） | 公共层不声明令牌值 | PASS |
| 5 | 不存在裸 Element Plus 选择器，也不存在 `:root` / `html` / `body` / `*` 规则 | 无裸全局选择器 | PASS |
| 6 | 每条 `:deep(...)` 均由 `.lt-main-table` 限定 | 作用域限定 | PASS |
| 7 | 不出现任何禁止的业务类名前缀 | 无业务类名 | PASS |
| 8 | 不出现业务文案、业务列名或状态语义命名 | 无业务文案 | PASS |
| 9 | 公共源为纯 CSS，不含路由元数据、页面自动识别或隐式启用入口 | 无路由元数据 / 无隐式启用 | PASS |
| 10 | 不含 `!important` | 无 `!important` | PASS |
| 11 | 内部辅助类数量为 0（除根类外无其他 `lt-` 类选择器） | 0 个内部辅助类 | PASS |
| 12 | 公共预设规则在全 `frontend/src` 中只有唯一来源文件 | 唯一来源 | PASS |

## LTVT-FA-003 — 参考页组件契约

通过条件：`dataSource.spec.ts` 全部通过；业务类与公共类并存；Props/Slots/Events/Ref、空态、双击、固定操作列等既有行为不变。

实测：`src/views/data-source/dataSource.spec.ts (116 tests)` **116/116 通过**。

源码侧并存证据（只读检查）：

```text
frontend/src/views/data-source/DataSourcePage.vue:83   :class="['data-table', LT_MAIN_TABLE_CLASS]"
frontend/src/views/data-source/DataSourcePage.vue:477  import { LT_MAIN_TABLE_CLASS } from '@/styles/list-table'
frontend/src/views/data-source/DataSourcePage.vue:1659 <style scoped src="@/styles/list-table/list-table-visual.css">
```

业务类 `data-table` 与公共类 `lt-main-table` 同时存在于同一元素；`<style scoped src>` 只引入公共层，Feature 专属样式仍保留在本文件。

## LTVT-FA-004 — 前端定向测试

```bash
cd /agent/cdc-config-platform/frontend
npx vitest run src/views/data-source/dataSource.spec.ts src/styles/list-table/list-table-visual.spec.ts
```

原始结果：

```text
 Test Files  2 passed (2)
      Tests  128 passed (128)
   Duration  58.20s
```

与任务预期「2 文件 / 128 测试」完全一致。

## LTVT-FA-005 — 前端全量测试

```bash
cd /agent/cdc-config-platform/frontend
npx vitest run
```

原始结果：

```text
 Test Files  57 passed (57)
      Tests  1063 passed (1063)
   Duration  90.35s
EXIT=0
```

与任务预期「57 文件 / 1063 测试」完全一致，无 skipped、无 flaky、无测试计数漂移。

## 首次失败记录（§六第 1 条）

本组用例中 LTVT-FA-005 出现**一次**执行环境失败（与实现无关）：

```text
/tmp/ltvt-fa-001/fa005-attempt1-badcwd.txt
```

原因：后台 shell 起始工作目录不含 `frontend/`，`cd frontend` 失败导致 `EXIT=1` 且无输出。原始日志按要求保留、未被覆盖；随后在确认工作目录为 `/agent/cdc-config-platform/frontend` 后重新执行并通过。该次失败未修改任何代码、测试或断言，不属于 flaky 掩盖。
