# 数据源新增／编辑主弹窗接入 `ced-dialog` 视觉验收收口

- 任务编号：`DATA-SOURCE-CED-DIALOG-VISUAL-ACCEPTANCE-CLOSEOUT-001`
- 日期：2026-11-25
- 性质：页面级人工视觉及表单交互验收记录 + 文档收口。**本地候选**，未合入、未推送、未部署。
- 关联任务：实现 `DATA-SOURCE-CREATE-EDIT-DIALOG-CED-ADOPTION-001`（候选提交 `5738b0f`）。

## 1. 结论

项目负责人已在 `http://192.168.174.70:5200/config/data-source` 试用并明确确认下列三项均符合预期，按通报范围记为**人工视觉及表单交互验收通过**：

1. 新增主弹窗的标签、密码星号、黑色「创建」按钮和「测试连接」对齐符合预期，空表单校验提示符合预期。
2. 双击打开的编辑主弹窗回填与密码掩码符合预期，取消和窗口内操作符合预期。
3. 从行尾三点打开的相关子弹窗（业务属性、目标库命名策略）维持原有视觉。

该结论为**候选本地人工验收**，**非** Feature 正式验收，**不**改变任何 `DS-AC-*` 状态。

## 2. 候选与远端／基线对应关系

| 项 | 值 |
|---|---|
| 任务工作树 | `/tmp/cdc-ced-ds-adoption-001`（detached HEAD） |
| 基线提交 | `bf5d32e500ee41f4beb660a0ddd6b72abbffd906` |
| 候选（实现）提交 | `5738b0f31fe1d69b70e9427d6b12bf724e0bb9d8` |
| 候选父提交 | `bf5d32e500ee41f4beb660a0ddd6b72abbffd906`（`git log` 确认 `5738b0f` 为 `bf5d32e` 的直接子提交） |
| 远端 `origin/develop` | `bf5d32e500ee41f4beb660a0ddd6b72abbffd906`（`git ls-remote` 与本地 `origin/develop` 一致） |
| 快进关系 | 可快进：`develop(bf5d32e) → 5738b0f → 本文档提交`，无分叉 |
| 实现改动面 | `DataSourcePage.vue`（+57/−，仅弹窗视觉与令牌）、`dataSource.spec.ts`、`create-edit-dialog-visual.spec.ts` |
| 预览对应 | Vite PID 6996 监听 `0.0.0.0:5200`（工作树运行）、只读 mock PID 8711 监听 `127.0.0.1:8080`；证据 `/tmp/cdc-ced-ds-adoption-001-preview/` |

## 3. 实现变更（before→after）

| 项 | before | after |
|---|---|---|
| 弹窗根类 | `class="editor-dialog"` | `class="editor-dialog ced-dialog"` |
| 标签排版 | 页私有 `:deep(.editor-dialog .el-form-item__label)` | 公共 `.ced-dialog .el-form-item__label`（结果 `14px`／`500`／`#3f3f46`／右对齐） |
| 密码星号 | 页私有 `editor-password-required-mark` 伪元素 | 公共 `ced-required-mark`（纯视觉、无 `required` 属性、无校验副作用） |
| 提交按钮 | 页私有 `.editor-submit-button:not(.is-disabled)` 三态色序 | 公共 `ced-submit`（`#09090b`／`#27272a`／`#18181b`，圆角 `6px`，字重 `500`） |
| 容器安全边距 | 无 `max-width` | 声明 `--ced-dialog-safety-inset: 48px`，由公共 `max-width` 生效 |

**页面级布局例外（保留，不并入模板）**：Element Plus `label-width="120px"`／`label-position="right"`（标签列宽仍由 EP 承载，不消费标签列宽／间距令牌）；`.test-bar { padding-left: 120px; }`；全局 `.form-error`（`role="alert"`）；弹窗宽度 `620px`；业务属性／命名策略子弹窗（`label-width="110px"`／`left`）零变化。

业务行为、字段集合与顺序、校验规则、请求时序、密码掩码、未保存确认、拖拽与子弹窗均不变。

## 4. 验证分层（如实记录）

- **负责人人工验收（2026-11-25，项目候选预览）**：三项均通过（见 §1）。预览主机 `192.168.174.70:5200`，Vite 监听 `0.0.0.0`。
- **候选实现阶段既有证据（本收口任务未重跑）**：
  - 定向测试 **333 项通过**；
  - 前端构建成功（含类型检查）；
  - Chrome 核对（`verify-results.json`）：弹窗类 `el-dialog editor-dialog ced-dialog`；标签 `14px/500/#3f3f46`、`text-align:right`、`width:120px`；提交按钮 `#09090b`、圆角 `6px`、字重 `500`；密码项 `ced-required-mark`、`required=false`、`::before` 为 `*`；`max-width` 按视口动态（1280 视口为 `1232px`）；`.test-bar` padding `120px`；取消／测试连接白底；六个空字段中文提示；编辑弹窗标题「编辑数据源」与回填掩码；三点子弹窗与探针端弹窗无外溢。
- **未执行（真实后端）**：预览使用**只读 API 测试替身**（GET 返回两条样例；所有非 GET 返回错误码 `50000`、不写任何库）。真实后端因开发 Oracle `192.168.174.65:1521` 连接被拒（Connection refused）未启动，**真实保存与真实连接测试仍未执行**。
- 测试替身验证**不等于**真实后端验证；上述 333 项与 Chrome 证据为**候选实现阶段**记录，本次仅引用、未重算。

## 5. 文档收口范围

| 文件 | 变更 |
|---|---|
| `docs/baseline/create-edit-dialog-visual-template/README.md` | 标题、状态块（`migrated_page_count=2`、数据源采用键）、第二页采用段、§4 分层、§5 证据行、§6 导航、§8 边界 |
| `docs/baseline/create-edit-dialog-visual-template/MIGRATION.md` | 标题、状态块、盘点块、§2 行、§2.1 计数、§3 步骤、§4 差异行、§5 授权边界 |
| `docs/features/data-source-management/README.md` | 新增 §2.7（状态块 + 接入事实／布局例外／人工验收／验证分层／边界）与 §5 变更记录行 |
| `docs/features/data-source-management/UI.md` | 新增 §13.7（接入说明）与 §14.6（变更记录） |
| `docs/features/data-source-management/ACCEPTANCE.md` | §4.18 追加“实现载体后续变更”说明与 §7 变更记录行（**不改**任何 `DS-AC` 状态） |
| `docs/features/data-source-management/reports/DATA-SOURCE-CED-DIALOG-VISUAL-ACCEPTANCE-CLOSEOUT-001.md` | 本报告（新增） |

## 6. 保护与边界

- **保留历史**：§2.1–§2.6、§13.0–§13.6、§14.1–§14.5 与既有验收记录逐字保留；`DS-AC-183~199` 维持 `PASS=17`、`final_acceptance_status=ACCEPTED`、`formal_acceptance_execution_status=EXECUTED_PASSED_LOCAL`；既有 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0` 与 `DS-AC-104`/`DS-AC-108` 两个 `BLOCKED` 逐字保留。
- **模板状态**：`formal_acceptance_execution_status=NOT_EXECUTED`（模板级正式验收未执行）；`public_vue_component_status=NOT_CREATED`；数据源接入记为 `IMPLEMENTED_LOCAL_CANDIDATE`、`PENDING_REMOTE_REVIEW`。
- **未授权**：其他页面／弹窗仍未获接入授权；模板级批量迁移与试点 `NOT_DECIDED`。
- 本任务为纯文档收口：未修改业务代码／测试／配置／依赖／锁文件；未访问数据库/ZK/Kafka/业务源库/目标库；未重跑测试或构建；未启停服务；未写入任何库。

## 7. 下一入口

`CHATGPT_REMOTE_DATA_SOURCE_CED_DIALOG_ADOPTION_AND_VISUAL_ACCEPTANCE_CLOSEOUT_REVIEW`——由 ChatGPT 从远程 Git 对本次文档收口与候选 `5738b0f` 作独立只读复审；合入、推送、部署与真实业务写入**另行授权**。
