#!/bin/bash

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


# SQLPlus输出UTF-8，便于SSH、Python和PyCharm正确读取
export NLS_LANG=AMERICAN_AMERICA.AL32UTF8

# Linux进程统一使用UTF-8
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8




# 使用默认空值，避免LD_LIBRARY_PATH未定义时报错
export LD_LIBRARY_PATH="/opt/oracle/compat-lib/usr/lib64:$ORACLE_HOME:${LD_LIBRARY_PATH:-}"

# Oracle命令加入PATH
export PATH="$ORACLE_HOME:$PATH"


# Node.js
export NODE_HOME=/opt/node
export PATH=$NODE_HOME/bin:$PATH

# npm cache
export NPM_CONFIG_CACHE=/data/npm-cache

# npm registry
export NPM_CONFIG_REGISTRY=https://registry.npmmirror.com
