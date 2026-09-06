-- DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001-R1 / R1-02 只读查重（无写操作）
-- 目标库由负责人当面确认：仅本项目内网库（DB_NAME=prod / 主机 snoopy-linux），Schema=CDC。
-- 目的：以独立前缀 dssr1-0906- 的完整主键清单逐表查重，结果须全为 0（不覆盖任何已有记录）。
-- 本文件不含任何连接凭据。

set pagesize 200 linesize 320 verify off feedback on
col why format a40
col hits format 9999

-- CDC_DATA_SOURCE_RUN_STATE 复合主键 (CLIENT_ID, DATA_SOURCE_ID) 查重
SELECT 'RUN_STATE dssr1-0906- 前缀碰撞' AS why, COUNT(*) AS hits
FROM CDC_DATA_SOURCE_RUN_STATE
WHERE CLIENT_ID IN ('c-dssr1-0906-a','c-dssr1-0906-b','c-dssr1-0906-c','c-dssr1-0906-d','c-dssr1-0906-e','c-dssr1-0906-miss1','c-dssr1-0906-miss2')
   OR DATA_SOURCE_ID IN ('s-dssr1-0906-1','s-dssr1-0906-2','s-dssr1-0906-3','s-dssr1-0906-4','s-dssr1-0906-5','s-dssr1-0906-m1','s-dssr1-0906-m2','s-dssr1-0906-m3')
UNION ALL
-- CDC_CLIENT_MULTIPLE 主键 CLIENT_ID 查重（仅本次要新建的 5 个停用探针）
SELECT 'CLIENT_MULTIPLE 新探针主键碰撞', COUNT(*)
FROM CDC_CLIENT_MULTIPLE
WHERE CLIENT_ID IN ('c-dssr1-0906-a','c-dssr1-0906-b','c-dssr1-0906-c','c-dssr1-0906-d','c-dssr1-0906-e')
UNION ALL
-- CDC_DATA_SOURCE 主键 DATA_SOURCE_ID 查重（仅本次要新建的 5 个停用源配置）
SELECT 'DATA_SOURCE 新源主键碰撞', COUNT(*)
FROM CDC_DATA_SOURCE
WHERE DATA_SOURCE_ID IN ('s-dssr1-0906-1','s-dssr1-0906-2','s-dssr1-0906-3','s-dssr1-0906-4','s-dssr1-0906-5');
exit
