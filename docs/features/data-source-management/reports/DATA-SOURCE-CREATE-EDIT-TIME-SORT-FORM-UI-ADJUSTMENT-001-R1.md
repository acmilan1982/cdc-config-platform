# DATA-SOURCE-CREATE-EDIT-TIME-SORT-FORM-UI-ADJUSTMENT-001-R1 执行报告

- 任务编号：`DATA-SOURCE-CREATE-EDIT-TIME-SORT-FORM-UI-ADJUSTMENT-001-R1`
- 任务性质：`BUG_FIX_AND_RUNTIME_REVIEW`——上一轮实现（`DATA-SOURCE-CREATE-EDIT-TIME-SORT-FORM-UI-ADJUSTMENT-001`）在项目负责人**真实页面目测**中发现的单一缺陷定向修复 + 回归保护 + 临时服务复测入口更新
- 日期：2026-09-20
- 分支：`develop`
- 授权基准提交：`807a5a58e373e522fe8b591569e22728a6662ed6`
- 结果提交：本报告所在提交（具体 Commit ID 与推送核验见任务结果块 `result_commit_id` / `remote_commit_id` / `ahead_behind`）
- Push 状态：普通推送至 `origin/develop`；未强推、未改写历史

> 本报告是 Agent 执行记录，**不是**复审通过、项目负责人批准或正式验收结论。
> 统一状态：`implementation_status=IMPLEMENTED_PENDING_USER_REVIEW`、`formal_acceptance_execution_status=NOT_RUN`、`new_adjustment_acceptance_status=ALL_NOT_RUN`、`project_owner_visual_review_status=FAILED_FOUND_DEFECT_THEN_R1_FIXED_PENDING_RETEST`。
> **修复后尚未重新目测**：本报告与自动化测试结果**不等于**页面复测通过。
> 未置 `PASS` / `ACCEPTED` / `IMPLEMENTED_ACCEPTED` / 生产可用。数据源管理 Feature 整体正式验收状态**未**改变。

---

## 1. 项目负责人真实页面复现

项目负责人在真实页面（`http://192.168.174.70:5173/config/data-source`）打开**新增数据源**弹窗进行目测时复现：

- 密码输入框**已经填写**；
- 点击“创建”后仍被前端阻止，弹窗未关闭、未发起新增请求；
- 密码输入框下方显示英文错误提示：

```text
password is required
```

截图事实由项目负责人在本任务提示词中提供，作为缺陷存在的直接证据。本 R1 只修复该缺陷，未扩展需求、未执行正式验收。

## 2. 任务开始前 Git 与环境现场

| 项目 | 值 |
|---|---|
| 任务开始前 `HEAD` | `807a5a58e373e522fe8b591569e22728a6662ed6` |
| 分支 | `develop` |
| ahead/behind | `0 0`（相对 `origin/develop`） |
| 远程 `refs/heads/develop` | `807a5a58e373e522fe8b591569e22728a6662ed6`（与本地 `HEAD` 一致） |

- 实际基线提交与提示词授权基准一致，身份条件全部满足。
- 工作区存在**任务外**既有改动：` M .claude/settings.local.json`、未跟踪 `?? docs/prompts/`。这两项属于用户现场，与本任务无关，全程**未修改、未暂存、未提交**，保持原样。
- 未执行 `git pull` / `fetch` / `merge` / `rebase` / `reset` / `clean` / `stash` / `checkout`。

环境（全部使用服务器预装版本，未安装、未升级、未替换任何基础环境）：

| 项目 | 值 |
|---|---|
| Node | v24.17.0（`/opt/node`） |
| npm | 11.13.0 |

前端本轮**未**执行 `npm install` / `npm ci`（`node_modules` 已存在），**未**修改 `package.json` 与锁文件。本任务**不涉及**后端代码，未执行后端测试或后端构建。

## 3. 根因（`CONFIRMED_REQUIRED_PROP_VALIDATED_MISSING_EDITOR_FORM_PASSWORD`）

修复前 `frontend/src/views/data-source/DataSourcePage.vue` 的相关事实：

1. `el-form` 的 `model` 是 `editorForm`；
2. `editorForm` **不包含** `password` 字段（密码输入绑定的是独立状态 `passwordInput`）；
3. 密码的既有业务校验 `validatePassword()` 读取的也是 `passwordInput`（`editorRules.password = [{ validator: validatePassword, trigger: 'blur' }]`）；
4. 上一轮为显示新增模式红色星号，在密码 `el-form-item` 上新增了 `:required="!isEdit"`。

Element Plus 的 `el-form-item` 在其 `required` 属性不为 `undefined` 且既有规则不含 `required` 键时，会追加一条**无 message 的隐式必填规则**，并以 `prop="password"` 取值，即校验 `editorForm.password`。由于 `editorForm.password` 恒为 `undefined`，该隐式规则**始终失败**，并触发 async-validator 的英文默认提示 `password is required`（模板 `%s is required`）。该失败发生在 `onSaveEditor()` 的 `await form.validate()` 门槛处，因此**即使密码已填写**提交仍被阻止。

结论：这不是后端问题，也不是用户输入问题；是上一轮“星号显示实现”与既有“密码独立状态模型”冲突。附带产物是该表单项获得 Element Plus 的 `is-required` 框架状态类。

> 证据链：`node_modules/element-plus/es/components/form/src/form-item.vue_vue_type_script_setup_true_lang.mjs` 中 `normalizedRules` 在 `required !== void 0` 且无规则含 `required` 键时 `rules.push({ required })`，`isRequired` 即由该规则数组推导（`is-required` 类的来源），二者同源。

## 4. 定向修复

只修改 `frontend/src/views/data-source/DataSourcePage.vue`：

1. **删除**密码 `el-form-item` 上的 `:required="!isEdit"`；
2. 改为**纯视觉、无校验副作用**的局部类：

```vue
<el-form-item
  label="密码"
  prop="password"
  :class="{ 'editor-password-required-mark': !isEdit }"
>
```

3. 在 `<style scoped>` 中新增局部伪元素星号（与既有 `:deep(.editor-dialog …)` 约定一致，限定在主弹窗内，无全局泄漏）：

```css
:deep(.editor-dialog .editor-password-required-mark .el-form-item__label)::before {
  content: "*";
  color: var(--el-color-danger);
  margin-right: 4px;
}
```

编译核对（`npm run build` 产物 `dist/assets/DataSourcePage-*.css`）：

```css
[data-v-9c65c310] .editor-dialog .editor-password-required-mark .el-form-item__label:before{content:"*";color:var(--el-color-danger);margin-right:4px}
```

满足约束：新增模式显示一个红色星号；编辑模式不显示；**不使用** `required` 属性；**不添加** `is-required` 框架状态类；**不生成**任何额外校验规则；选择器限定 `.editor-dialog`，不影响其他字段、其他弹窗或其他页面。

保留不变的既有语义（逐项核对）：

| 语义 | 状态 |
|---|---|
| 新增模式密码必须填写 | 不变（由 `validatePassword()` 承担） |
| 新增模式空密码提示中文 `请输入密码` | 不变 |
| 编辑模式未修改密码允许保存，请求体不携带 `password` | 不变（`if (passwordEdited.value)` 守卫未动） |
| 编辑模式主动修改密码后清空提示 `请输入新密码` | 不变 |
| 编辑态固定掩码、聚焦/失焦、未保存判断、连接测试 | 均不变 |
| 密码输入仍绑定 `passwordInput`，掩码不写入表单模型 | 不变 |

明确**未做**（按任务禁止项逐条核对）：未删除或放宽 `validatePassword()`；未向 `editorForm` 写入伪造密码；未把 `*********` 掩码当真实密码提交；未捕获/吞掉 `form.validate()` 异常；未硬编码绕过密码校验；未修改后端业务代码、数据库、接口契约、依赖或锁文件；未顺手修复其他问题或做无关重构。

## 5. 回归测试保护

修改 `frontend/src/views/data-source/dataSource.spec.ts`（`+72 / -3`）：

1. **删除上一版的错误测试**：原 “新增模式密码带 Element Plus 必填标识，编辑模式不带” 以 `expect(createItem.className).toContain('is-required')` **断言了缺陷本身**，已整段替换。
2. 新增「新增模式密码星号来自专用视觉 class，不带 `required` 属性与 `is-required` 状态类」：断言新增模式密码表单项含 `editor-password-required-mark`、**不含** `is-required`、**无** `required` 属性、标签文本不含 `*`；编辑模式两者皆无。
3. 新增「专用视觉 class 的星号规则存在于 scoped 样式且不引入校验」：断言 `.editor-password-required-mark` 规则含 `::before` / `content: "*"` / `var(--el-color-danger)` 且不含 `is-required`（样式源码静态断言，作为补充而非唯一依据）。
4. 新增「新增模式填写密码后创建：不再出现 `password is required`，密码按 trim 提交」：填齐全部必填项并以 `'  secret  '` 填写密码后点击“创建”，断言不出现 `password is required`、无 `.form-error`、`createDataSource` 恰好调用一次、请求体 `password === 'secret'`。
5. 修订「新增模式空密码被既有校验阻断」：保留既有中文 `请输入密码` 与不调用 `createDataSource` 断言，并**补充** “不出现英文 `password is required`”。
6. 保留既有「编辑模式不显示必填标识且未修改密码可保存、请求不含 `password`」与「打开编辑…未改密码保存请求不含 `password`」用例。
7. 新增「编辑模式主动修改密码后清空：仍提示 `请输入新密码`，且不提交」。

### 5.1 回归有效性验证（首次失败证据）

为确认新测试**真能**捕获该缺陷，在提交前临时把 `:required="!isEdit"` 加回密码表单项并定向重跑 `-t "新增模式"`，得到**首次失败证据**：

```text
× 新增模式密码星号来自专用视觉 class，不带 required 属性与 is-required 状态类
  → expected 'el-form-item is-required asterisk-lef…' not to contain 'is-required'
- is-required
+ el-form-item is-required asterisk-left el-form-item--label-right editor-password-required-mark
```

随后立即移除该临时 `required` 属性，恢复最终实现（最终代码中该属性**不存在**）。

### 5.2 测试环境边界（如实记录，不弱化断言）

本仓库 `DataSourcePage.vue` 第 768-772 行已明确注释：**jsdom 下 element-plus 外部化后 async-validator 的 ESM/CJS 互操作会令 `el-form` 的 `validate()` 静默通过**，因此提交门槛不依赖 `el-form` 而另用 `validateWithSchema()`。这意味着 jsdom 用例**无法**复现浏览器中 `form.validate()` 报出英文 `password is required` 的现场。因此本 R1 的回归保护由两层构成：

- **根因层（真实失败）**：以框架状态类 `is-required` 的有无断言隐式必填规则是否被生成——该断言在缺陷存在时**确实失败**（见 §5.1）；
- **行为层（提交路径）**：以真实点击“创建”的提交路径断言不出现 `password is required`、密码按 trim 提交。

测试未仅静态确认 CSS 文本存在，也未为通过而弱化任何业务断言。

## 6. 自动化测试与构建

| 步骤 | 命令（`frontend/` 目录） | 结果 |
|---|---|---|
| 1 | `npm test -- --run src/views/data-source/dataSource.spec.ts` | `Tests 109 passed (109)`，`Test Files 1 passed (1)` |
| 2 | `npm test -- --run` | `Test Files 56 passed (56)`，`Tests 1044 passed (1044)` |
| 3 | `npm run build` | `✓ built in 16.69s`（成功；仅有既有的 chunk > 500 kB 提示） |

- 步骤 1 相对上一轮由 106 条增至 109 条（删除 1 条错误测试、新增 3 条、并保留原有条目）。
- 步骤 2 为修复后的空闲全量测试，无失败、无跳过、无遗留 flake 报告。
- 步骤 3 产物中已核验局部星号选择器编译结果（本报告 §4 第 3 条）。
- 本任务**未**执行后端测试或后端构建（R1 禁止修改后端，后端代码零变化）。

## 7. 实际修改文件

```text
frontend/src/views/data-source/DataSourcePage.vue      |  15 + / 1 -   (修复 + 局部 CSS)
frontend/src/views/data-source/dataSource.spec.ts      |  72 + / 3 -   (回归测试)
docs/features/data-source-management/README.md         |   3 + / 0 -   (§2.4 状态键与目测说明、§5 变更记录)
docs/features/data-source-management/ACCEPTANCE.md     |   1 + / 0 -   (§7 变更记录)
docs/features/data-source-management/UI.md             |  24 + / 4 -   (§13.3 按最终机制改写、§13.2 指向补充、§14.2 修复链)
docs/features/data-source-management/reports/DATA-SOURCE-CREATE-EDIT-TIME-SORT-FORM-UI-ADJUSTMENT-001-R1.md | 新增
```

- 后端主代码/测试、`REQUIREMENTS.md`、`DESIGN.md`、`API.md`、`DATABASE.md`、`package.json`、锁文件、环境文件**均未修改**。
- 未新增需求编号或验收编号；`DS-REQ-178~188` 保持原批准内容；`DS-AC-183~199` 继续全部 `NOT_RUN`。

## 8. 数据与外部系统边界

| 项目 | 状态 |
|---|---|
| 数据库访问 / 写入 | 无 |
| DDL / DML | 无 |
| 新增/编辑/删除/启用/停用/业务属性保存/命名策略写接口 | 未调用 |
| ZooKeeper / Kafka | 未访问 |
| 业务源库 / 目标库 | 未访问 |
| 配置 / 依赖 / 锁文件 / 环境文件 | 未修改 |
| 浏览器或 HTTP 冒烟是否真正提交新增数据源 | 否（仅只读可达性检查，未点击“创建”） |

## 9. 状态回写

```text
implementation_status=IMPLEMENTED_PENDING_USER_REVIEW
formal_acceptance_execution_status=NOT_RUN
new_adjustment_acceptance_status=ALL_NOT_RUN
project_owner_visual_review_status=FAILED_FOUND_DEFECT_THEN_R1_FIXED_PENDING_RETEST
```

- `README.md` §2.4 状态块新增 `project_owner_visual_review_status`，并追加项目负责人目测发现缺陷与 R1 修复说明。
- `UI.md` §13.3 由“`required` 属性实现星号”改写为最终视觉类机制并嵌入 R1 修复链；§13.2 星号说明补充“密码表单项为例外”；§14.2 追加修复记录。
- `ACCEPTANCE.md` §7 追加 R1 修复记录，明确 `DS-AC-195` 的预期结果**未被修改**、任何密码校验**未被放宽**。
- 既有验收不变量全部保持：`DS-AC-001~115` 为 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0`，`DS-AC-104` / `DS-AC-108` 仍为 `BLOCKED`，`DS-AC-116~140` 仍全部 `NOT_RUN`，`DS-AC-141~182` 仍为 42 条 `PASS`；数据源管理 Feature 整体正式验收状态**未**改为 `ACCEPTED`。
- 未写入 `PASS` / `ACCEPTED` / `IMPLEMENTED_ACCEPTED` / 正式验收完成 / 生产可用。

## 10. 运行服务与项目负责人复测入口

- 后端：本任务对后端代码**零变化**，PID `41661`（`127.0.0.1:8080`）经命令行/cwd/监听端口核对身份一致且健康，**保持运行、未重启**。
- 前端：旧前端进程（`41718` / `41707`，`0.0.0.0:5173`）在 R1 提交与构建成功后按**精确 PID** 停止（未使用 `pkill`/`killall`/模糊匹配）；随后从 R1 最终提交启动新的 Vite dev server，监听 `0.0.0.0:5173`，日志写入 R1 专属目录。
- 只读可达性冒烟：`127.0.0.1:8080/actuator/health`、`127.0.0.1:5173/config/data-source`、`192.168.174.70:5173/config/data-source`、经 Vite 代理的 `GET /api/data-sources` 均已核验返回 200；**未**点击“创建”，未触发任何真实写请求。
- 复测入口：

```text
http://192.168.174.70:5173/config/data-source
```

- 前后端保持运行，等待项目负责人重新测试**新增**与**编辑**弹窗的密码行为（新增：填密码可正常提交、空密码提示 `请输入密码`；编辑：不修改可保存、改后清空提示 `请输入新密码`）。

## 11. 已知边界与遗留项

- 本报告与自动化测试**不等于**页面复测通过：`project_owner_visual_review_status` 仍为 `FAILED_FOUND_DEFECT_THEN_R1_FIXED_PENDING_RETEST`，需项目负责人重新目测。
- jsdom 环境无法复现浏览器 `el-form` 校验现场（§5.2），根因层回归由框架状态类断言承担，已在报告中明示证据层级。
- 临时服务为目测用途，非部署交付；服务器此前已判定**不存在** cdc-config 既有运行环境（部署目标无法唯一确认），本任务未做任何部署动作。
- 后续：ChatGPT 从远程 Git 独立复审 R1 提交 → 项目负责人页面复测新增/编辑弹窗 → 另行决定是否正式执行 `DS-AC-183~199`。

## 12. 关联文档

- 上一轮执行报告：[`DATA-SOURCE-CREATE-EDIT-TIME-SORT-FORM-UI-ADJUSTMENT-001.md`](./DATA-SOURCE-CREATE-EDIT-TIME-SORT-FORM-UI-ADJUSTMENT-001.md)
- 功能入口与状态分层：[`../README.md`](../README.md)
- 验收基线：[`../ACCEPTANCE.md`](../ACCEPTANCE.md) §4.18、§7
- UI 基线：[`../UI.md`](../UI.md) §13.3、§13.2、§14.2
