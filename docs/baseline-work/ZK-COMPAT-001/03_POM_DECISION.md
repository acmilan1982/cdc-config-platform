# 03_POM_DECISION — ZK-COMPAT-001-R2 POM 裁决与建议

## 1. 裁决

**建议采用 Curator 全部组件 2.13.0 / ZooKeeper Client 3.4.14 方案，保留当前 pom.xml 中的 Curator/ZK 版本属性修改。**

提交和推送仍须等待人工验收。

## 2. 裁决依据

### 2.1 生产约束

- 生产环境 ZK 为 3.4.14，短期内不可升级
- 生产环境曾出现 Curator 4.3.0 无法连接 ZK 3.4.14 的实际运行问题
- 客户端/服务端同版本（3.4.14）是最保守可靠的选择

### 2.2 依赖统一状态

| 检查项 | 状态 |
|---|---|
| 当前实际声明、解析和加载的Curator组件均为2.13.0；curator-recipes未声明、未解析、未加载 | PASS |
| ZK Client 3.4.14 | PASS |
| Curator 4.3.0 残留 | 无 |
| curator-recipes 跨版本混用 | 不存在（未声明、未解析） |
| Runtime classpath 不含 curator-test | PASS |
| Runtime classpath 不含 Curator 4.3.0 | PASS |

### 2.3 验证证据

| 证据层 | 结果 |
|---|---|
| 编译 | PASS |
| 测试 | PRE-EXISTING_FAILURE（2 类，经 HEAD 基线确认与 Curator/ZK 无关） |
| 跳过测试的打包 | PASS |
| 项目配置解析（application-dev.yml → 占位符解析 → Bean） | PASS |
| 项目 Bean 层（真实 curatorFramework() 方法） | PASS |
| Client 层（ZooKeeperReadOnlyClient） | PASS |
| Service 层（getClients(), 69ms） | PASS |
| ZK 写操作 | 无 |
| 新增代码 | 无 |

### 2.4 为什么不恢复 Curator 4.3.0

1. **生产已知问题**：Curator 4.3.0 + ZK 3.4.14 在实际生产中出现过连接失败，开发环境探针通过不等于生产可靠。
2. **版本对齐**：ZK 3.4.14 服务端 + ZK 3.4.14 客户端 + Curator 2.13.0 是该版本周期内验证最充分的组合。
3. **功能充分性**：项目 ZK 使用场景为纯只读，Curator 2.13.0 完全满足。
4. **无版本混用风险**：不再存在 Curator 4.3.0 残留（原报告声称的 curator-recipes 4.3.0 混用经 R1/R2 证实不存在）。

## 3. 验证范围与剩余风险

### 3.1 已验证

| 场景 | 结果 |
|---|---|
| 连接建立（73ms, CONNECTED） | PASS |
| checkExists / getChildren / getData | PASS |
| ZooKeeperReadOnlyClient 完整 API | PASS |
| ZooKeeperMonitorServiceImpl.getClients() | PASS |
| 客户端正常关闭 | PASS |
| Runtime classpath 版本一致性 | PASS |

### 3.2 未验证

| 场景 | 说明 |
|---|---|
| Curator Recipes API | 项目不使用，curator-recipes 未声明 |
| ZK 写操作 | 项目不使用 |
| ZK 集群故障转移 | 当前为 standalone 模式 |
| 长时间运行稳定性 | 需要在完整应用启动后验证 |
| 网络分区恢复 | 需要专项测试 |

### 3.3 Recipes API 剩余风险

curator-recipes 不在 classpath。如未来需要 Recipes 功能，应在 pom.xml 中显式声明并重新验证与 ZK 3.4.14 的兼容性：

```xml
<dependency>
    <groupId>org.apache.curator</groupId>
    <artifactId>curator-recipes</artifactId>
    <version>${curator.version}</version>
</dependency>
```

### 3.4 log4j 1.2.17 遗留风险

log4j 1.2.17 由 ZooKeeper 3.4.14 传递引入，属于已停止维护的遗留风险。本任务不扩大范围修改，登记为后续依赖治理事项。

## 4. 建议保留的 pom.xml 差异

```diff
-        <curator.version>4.3.0</curator.version>
-        <zookeeper.version>3.5.6</zookeeper.version>
+        <curator.version>2.13.0</curator.version>
+        <zookeeper.version>3.4.14</zookeeper.version>

-        <!-- ZooKeeper (match production 3.5.6) -->
+        <!-- ZooKeeper (match production 3.4.14) -->
```

其他依赖声明无需修改（已正确使用 `${curator.version}` 和 `${zookeeper.version}` 属性）。

## 5. 提交前仍需人工验收

- 提交和推送尚未执行，等待人工明确指令
- 人工应在 Windows IDEA 中拉取 develop 分支进行 Review
- pom.xml 中与 Curator/ZK 无关的其他未提交修改不在本任务裁决范围
