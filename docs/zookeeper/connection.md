# ZooKeeper 连接信息

> 分析任务：ZK_MONITOR_ANALYSIS_001
> 分析时间：2026-07-16 17:11 CST

## 客户端环境

| 项目 | 值 |
|------|-----|
| ZooKeeper 客户端版本 | 3.5.6 |
| 客户端目录 | /opt/zookeeper/apache-zookeeper-3.5.6-bin |
| 客户端命令 | /opt/zookeeper/apache-zookeeper-3.5.6-bin/bin/zkCli.sh |
| Java 版本 | 1.8.0_202 |

## 连接参数

| 项目 | 值 |
|------|-----|
| 连接地址 | 192.168.174.51:2181 |
| 分析根路径 | /bsoft-cdc |
| 认证 | 无 |
| 网络验证 | TCP 端口可达 |

## 连接结果

- 连接状态：成功
- Session ID：0x1000001c7c50019（示例）
- Session Timeout：30000ms
- 连接协议：无 SASL 认证

## 只读约束

本次分析严格遵守只读规则：
- 使用命令：`ls`、`get`、`stat`
- 未执行任何写操作（create、set、delete 等）
- 未修改 ACL 或认证
- 未访问 /bsoft-cdc 之外的业务路径

## 分析范围

递归分析 /bsoft-cdc 下全部子节点，包括：
- 节点路径与层级
- 节点数据内容
- Stat 元数据（czxid、mzxid、ctime、mtime、ephemeralOwner 等）
- 数据格式判断
