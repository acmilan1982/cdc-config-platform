# CLIENT-CONFIG-DESCRIPTION-SAVE-BOUNDARY-ACCEPTANCE-001 证据索引

- 任务：`CLIENT-CONFIG-DESCRIPTION-SAVE-BOUNDARY-ACCEPTANCE-001`
- 目标：`/config/client` 的 `CCFG-AC-131` 描述保存边界定向验收
- 目标对象：别名 `OWNER_TEST_B`（由仓库外候选映射绑定，不按列表顺序/行号）
- 结论：**前置阻断，未执行任何业务写入**。原描述为 NULL，授权编辑接口拒绝空描述（业务码 `40102`），无法安全恢复原值，故按任务前置停止，不覆盖原记录。`CCFG-AC-131` 维持 `BLOCKED`。

## 文件

| 文件 | 内容 |
|---|---|
| `probe-description-save-preconditions.py` | 只读 GET 前置探针；从仓库外候选映射精确绑定身份；不发起任何写请求 |
| `precondition-results.json` | 脱敏结果：别名、ID/源哈希、长度、前置布尔、恢复可行性 |
| `env-and-version.txt` | 运行现场（git HEAD、服务 PID/监听、jar 哈希/时间戳、版本） |
| `SHA256SUMS.txt` | 本目录证据 SHA256 校验清单 |

## 脱敏边界

- 真实 clientId、数据源 ID、描述前像与原始 GET 响应仅存于仓库外 `/root/cdc-description-save-boundary-001/`（目录 700、文件 600）。
- 本目录仅提交稳定别名、SHA256 哈希、长度与一致性布尔，不含真实 ID/源/机构/描述文本。
- 未做数据库 `LENGTHB` 实查；持久化事实来自只读 GET 回读与后端源码校验规则。

## 复现

```bash
python3 probe-description-save-preconditions.py
```

退出码 `3` 表示原描述 NULL 不可恢复的预期阻断；退出码 `0` 表示前置通过。
