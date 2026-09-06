package com.bsoft.cdcconfig.monitor.datasourcerunstate.mapper;

import com.bsoft.cdcconfig.monitor.datasourcerunstate.model.DataSourceRunStateRow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * CDC_DATA_SOURCE_RUN_STATE 只读 Mapper（DATABASE §10）。驱动主表，无 WHERE 全量读取，
 * 绝不以关联 JOIN/WHERE 裁剪行。三个 DATE 字段由 Oracle TO_CHAR 确定性字符串化，Java 只透传。
 */
@Mapper
public interface DataSourceRunStateMapper {

    @Select("SELECT CLIENT_ID AS clientId, DATA_SOURCE_ID AS dataSourceId, "
            + "SNAPSHOT_STATUS AS snapshotStatus, "
            + "TO_CHAR(SNAPSHOT_LAST_SEEN_AT, 'YYYY-MM-DD HH24:MI:SS') AS snapshotLastSeenAt, "
            + "TO_CHAR(SNAPSHOT_COMPLETED_AT, 'YYYY-MM-DD HH24:MI:SS') AS snapshotCompletedAt, "
            + "TO_CHAR(UPDATED_AT, 'YYYY-MM-DD HH24:MI:SS') AS updatedAt "
            + "FROM CDC_DATA_SOURCE_RUN_STATE")
    List<DataSourceRunStateRow> selectAll();
}
