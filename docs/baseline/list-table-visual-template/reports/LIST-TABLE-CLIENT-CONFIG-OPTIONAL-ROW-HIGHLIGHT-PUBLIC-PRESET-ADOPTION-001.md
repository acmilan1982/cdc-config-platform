# 报告：§13 公共可选单行高亮预设首个页面接入（模板侧交叉引用）

- `task_code=CLIENT-CONFIG-OPTIONAL-ROW-HIGHLIGHT-PUBLIC-PRESET-ADOPTION-001`
- 分支：`develop`；任务类型：**页面接入 + 契约测试 + 最小文档同步**（本文件仅为**模板侧交叉引用**，完整证据与页面细节见 Feature 侧报告）
- 起始提交（base）：`ebf34d970d720aa124dc7a1ea94ba811dcf21584`

> **边界声明**：**公共代码复审通过 ≠ 页面接入完成 ≠ 项目负责人已目测 ≠ 正式验收通过 ≠ 批准任何页面迁移。**

## 1. 事实

- `SHARED_COMPONENT_DESIGN.md` §13.3 **公共可选单行固定高亮视觉预设**（公共 CSS 提交 `f35fb5a…`，已通过 ChatGPT 远程代码复审 `APPROVED`）本轮**首次**被一个业务页面接线采用；
- **范围**：**仅** `/config/client`（探针端管理）**主列表**——表级 `lt-row-highlight` 与根类 `lt-main-table` **并列**、被固定行由 `rowClassName` 提供行级 `lt-row-highlight__row`（双层显式 opt-in）；弹窗列表**不**接入；
- 该页面**移除**其五条私有高亮视觉规则，视觉改由公共 §13.3 预设**单独**承载；页面视觉取值与既有交互行为**无回归**；
- **公共契约未改**：未修改公共 CSS 规则、9 个 `--lt-*` 令牌、4 个内部 helper 类与 `!important`（仍 0）。

## 2. 状态与计数（改后复测）

- 模板**状态块**新增（§13 页面接入现状）：`..._page_integration_status=PARTIAL_CLIENT_CONFIG_MAIN_LIST_ONLY_ADOPTED_PENDING_CHATGPT_REVIEW_AND_OWNER_VISUAL_CHECK`；
- **§13 页面积分接入状态 ≠ 模板级页面迁移状态**：模板级 `page_migration_status=NOT_STARTED` / `page_migration_authorization_status=NOT_GRANTED` / `pilot_page_selection_status=NOT_DECIDED` 与模板级 `current_next_entry`（`NONE_SHARED_IMPLEMENTATION_FINAL_ACCEPTED_AND_CLOSED_NO_PAGE_MIGRATION_AUTHORIZED`）**保持原措辞**；
- **四通道标记计数逐值不变**（各通道不混算）：通道1 `REFERENCE_FACT 28 / TEMPLATE_DRAFT 0 / TEMPLATE_APPROVED 43 / PROPOSED_NOT_IMPLEMENTED 7`；通道2 `SHARED_DESIGN_APPROVED 81`；通道3 `REFERENCE_FACT 26`；通道4 `PROPOSED_NOT_IMPLEMENTED 8`；
- `lt_token_count=9`、`lt_internal_helper_class_count=4`、`!important` 计数 `0` **不变**。

## 3. 参考（不复制完整证据）

- Feature 侧实现报告：`docs/features/client-config/reports/CLIENT-CONFIG-OPTIONAL-ROW-HIGHLIGHT-PUBLIC-PRESET-ADOPTION-001.md`
- 脱敏只读证据包：`docs/features/client-config/reports/evidence/CLIENT-CONFIG-OPTIONAL-ROW-HIGHLIGHT-PUBLIC-PRESET-ADOPTION-001/`
  （真实无头 Chromium 只读核验**实际页面**，37/37 检查通过、写请求计数 0）

## 4. 未改变项

- 模板基础共享实现的 `shared_implementation_status=IMPLEMENTED_ACCEPTED` / `final_acceptance_status=ACCEPTED_BY_PROJECT_OWNER` 范围**保持原样**；
- §12 三点入口现行实现状态 `IMPLEMENTED_PENDING_USER_ACCEPTANCE` **保持**；§12.1 三点触发器**禁用态视觉**仍**未实现**、由 `CCFG-AC-157` 保持 `BLOCKED` 表达；
- `/config/data-source`**未**接入公共预设，其「更多」仍是**文字入口**（三点改造属**另一会话**）；
- 隔离合成数据浏览器证据**不得**记为真实业务页面接入；本页接入为**真实页面**、数据仅来自**只读**合成桩；
- 历史报告与历史证据**未回写**。

## 5. 下一入口

```text
optional_extension_chain_next_step=CHATGPT_REMOTE_CLIENT_CONFIG_OPTIONAL_ROW_HIGHLIGHT_PUBLIC_PRESET_ADOPTION_REVIEW
optional_extension_chain_next_step_scope=CLIENT_CONFIG_MAIN_LIST_SECTION_13_PUBLIC_PRESET_ADOPTION_CODE_REVIEW_ONLY
```

**页面接入并推送 ≠ 远程复审通过 ≠ 项目负责人已目测 ≠ 正式验收通过。**
