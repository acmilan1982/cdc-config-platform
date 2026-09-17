# SA-001 基准、隔离与服务（对应原 AC-001）

## 1. Git 三方一致性

```bash
git ls-remote origin refs/heads/develop
# 0a1cd99640a5cfa08280a95c23ca3c7231ea6a73	refs/heads/develop

cd /agent/query-list-page-shared-tooltip-hover-reliability-correction-001
git rev-parse HEAD
# 0a1cd99640a5cfa08280a95c23ca3c7231ea6a73
git status --short
# (空)
```

| 项 | 值 |
|---|---|
| `expected_base_commit_id` | `0a1cd99640a5cfa08280a95c23ca3c7231ea6a73` |
| 本地验收 HEAD | 同上 |
| 远程 `origin/develop` | 同上 |
| 三方一致性 | 一致（未漂移到更新提交，未 pull/merge/rebase） |

## 2. 隔离工作区

```text
worktree_path=/agent/query-list-page-shared-tooltip-hover-reliability-correction-001
worktree_head=0a1cd99640a5cfa08280a95c23ca3c7231ea6a73
worktree_mode=detached HEAD
worktree_clean_status=CLEAN
```

复用了修正任务留下的工作区（HEAD 精确、工作区干净、detached、无其他任务占用、前后端均来自该提交），
未新建 worktree，未 reset / stash / clean / 修改 / 删除任何既有 worktree。

## 3. 任务前主工作区与 worktree 记录

```bash
git -C /agent/cdc-config-platform rev-parse HEAD
# 4222b0a24b927aca6f62ff348fd8549b73d4156c
git -C /agent/cdc-config-platform branch --show-current
# develop
git -C /agent/cdc-config-platform status --short | wc -l
# 116

git -C /agent/query-list-page-shared-tooltip-hover-reliability-correction-001 worktree list --porcelain | grep -c '^worktree '
# 71
```

主工作区的 116 项既有改动为任务前已存在，属既定状态，本轮**未**触碰。
71 个注册 worktree 中不包含本轮删除的任何条目——本轮未清理任何 worktree。

## 4. 环境预检

```text
git    git version 2.47.3
java   java version "1.8.0_202"   (JAVA_HOME=/usr/java/latest)
mvn    Apache Maven 3.8.8         (/usr/local/maven)
node   v24.17.0                   (/opt/node)
npm    11.13.0
locale LANG=en_US.UTF-8
```

未安装 / 升级 / 替换任何运行工具或依赖。

## 5. 项目负责人人工检查环境来源证明

```bash
ss -lntp | grep -E ':5173|:8080'
# LISTEN 0.0.0.0:5173  users:(("MainThread",pid=47425,fd=19))
# LISTEN *:8080        users:(("java",pid=47301,fd=23))

ps -o pid,ppid,user,args -p 47425,47301
# 47425 47411 root node .../correction-001/frontend/node_modules/.bin/vite --host 0.0.0.0 --port 5173 --strictPort
# 47301     1 root java -jar .../correction-001/backend/target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar

readlink /proc/47425/cwd  # /agent/...-correction-001/frontend
readlink /proc/47301/cwd  # /agent/...-correction-001/backend
```

两个进程的 cwd、启动命令、监听地址均可证明来自 `0a1cd996` 工作区，且使用了 `--strictPort`；
据此按任务 §6 将其**用作**真实浏览器验收环境，并在验收后**保持运行、未停止**。

## 6. 服务健康

```bash
curl --noproxy '*' -o /dev/null -w '%{http_code}' http://192.168.174.70:5173/monitor/data-source-state
# 200
curl --noproxy '*' -o /dev/null -w '%{http_code}' http://127.0.0.1:5173/monitor/data-source-state
# 200
curl --noproxy '*' -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/api/monitor/data-source-run-state/list
# 200
```

后端为真实业务响应（返回 30 条记录），非前端回退页或错误页。
