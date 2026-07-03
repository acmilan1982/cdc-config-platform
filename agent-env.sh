#!/usr/bin/env bash

# CDC配置管理平台 Agent 运行环境
# 使用方式：source /agent/cdc-config-platform/agent-env.sh

# Java environment
export JAVA_HOME=/usr/java/latest
export JRE_HOME="$JAVA_HOME/jre"
export PATH="$JAVA_HOME/bin:$PATH"

# Maven environment
export MAVEN_HOME=/usr/local/maven
export PATH="$MAVEN_HOME/bin:$PATH"

# Oracle Instant Client environment
export ORACLE_HOME=/opt/oracle/instantclient
export TNS_ADMIN="$ORACLE_HOME/network/admin"

# SQL*Plus 输出使用 UTF-8，便于 SSH、PyCharm 和脚本读取。
# 数据库逆向分析阶段必须验证中文表注释和字段注释是否正常显示。
export NLS_LANG=AMERICAN_AMERICA.AL32UTF8

# Linux进程统一使用UTF-8
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# Oracle动态链接库
export LD_LIBRARY_PATH="/opt/oracle/compat-lib/usr/lib64:$ORACLE_HOME:${LD_LIBRARY_PATH:-}"
export PATH="$ORACLE_HOME:$PATH"

# Node.js
export NODE_HOME=/opt/node
export PATH="$NODE_HOME/bin:$PATH"

# npm cache and registry
# 当前用户必须对该目录具有读写权限。
export NPM_CONFIG_CACHE=/data/npm-cache
export NPM_CONFIG_REGISTRY=https://registry.npmmirror.com
