package com.bsoft.cdcconfig.logquery.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 日志查询 Mapper（LQ-DESIGN-04）。
 * 只接受已验证的固定表枚举常量与绑定参数；tableName 只能来自 LogTypeEnum。
 */
@Mapper
public interface LogQueryMapper {

    List<LogListRow> selectLogList(
            @Param("tableName") String tableName,
            @Param("startTime") LocalDateTime startTime,
            @Param("endExclusive") LocalDateTime endExclusive,
            @Param("sourceDataSourceIds") List<String> sourceDataSourceIds,
            @Param("sourceTableName") String sourceTableName,
            @Param("targetDataSourceIds") List<String> targetDataSourceIds,
            @Param("targetTableName") String targetTableName,
            @Param("cursorTargetTime") LocalDateTime cursorTargetTime,
            @Param("cursorCdcLogId") BigDecimal cursorCdcLogId);

    List<DataSourceRow> selectAllDataSources();

    LogDetailRow selectLogDetail(
            @Param("tableName") String tableName,
            @Param("cdcLogId") BigDecimal cdcLogId);

    RawMessageRow selectRawMessage(
            @Param("tableName") String tableName,
            @Param("cdcLogId") BigDecimal cdcLogId);
}
