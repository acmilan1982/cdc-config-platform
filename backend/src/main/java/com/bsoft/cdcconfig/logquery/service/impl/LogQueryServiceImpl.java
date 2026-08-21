package com.bsoft.cdcconfig.logquery.service.impl;

import com.bsoft.cdcconfig.logquery.cursor.LogCursorBoundary;
import com.bsoft.cdcconfig.logquery.cursor.LogCursorCodec;
import com.bsoft.cdcconfig.logquery.cursor.LogCursorConditionMismatchException;
import com.bsoft.cdcconfig.logquery.cursor.LogCursorInvalidException;
import com.bsoft.cdcconfig.logquery.cursor.LogQueryFingerprint;
import com.bsoft.cdcconfig.logquery.dto.LogListQuery;
import com.bsoft.cdcconfig.logquery.enums.LogTypeEnum;
import com.bsoft.cdcconfig.logquery.exception.LogQueryBadRequestException;
import com.bsoft.cdcconfig.logquery.exception.LogQueryErrorCode;
import com.bsoft.cdcconfig.logquery.mapper.DataSourceRow;
import com.bsoft.cdcconfig.logquery.mapper.LogDetailRow;
import com.bsoft.cdcconfig.logquery.mapper.LogListRow;
import com.bsoft.cdcconfig.logquery.mapper.LogQueryMapper;
import com.bsoft.cdcconfig.logquery.mapper.RawMessageRow;
import com.bsoft.cdcconfig.logquery.service.LogQueryService;
import com.bsoft.cdcconfig.logquery.vo.DataSourceOptionVO;
import com.bsoft.cdcconfig.logquery.vo.DataSourceOptionsVO;
import com.bsoft.cdcconfig.logquery.vo.LogDetailVO;
import com.bsoft.cdcconfig.logquery.vo.LogListResponse;
import com.bsoft.cdcconfig.logquery.vo.LogListVO;
import com.bsoft.cdcconfig.logquery.vo.RawMessageVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.dao.QueryTimeoutException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.sql.SQLTimeoutException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Supplier;

/**
 * 日志查询服务实现（LQ-DESIGN-03）。
 * 无状态；条件规范化、时间半开区间与 7 天公式、日志类型白名单、
 * 数据源一次读取与映射、游标校验、CDC_LOG_ID 数值转换、结果组装均在此。
 */
@Service
public class LogQueryServiceImpl implements LogQueryService {

    private static final Logger log = LoggerFactory.getLogger(LogQueryServiceImpl.class);

    private static final DateTimeFormatter TIME_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final Duration MAX_SPAN = Duration.ofHours(7 * 24);
    private static final int PAGE_SIZE = 100;
    private static final int FETCH_LIMIT = 101;
    private static final int MAX_DATA_SOURCE_IDS = 100;
    private static final int MAX_TABLE_NAME_LENGTH = 64;
    private static final String UNDEFINED_NAME = "未定义名称";
    private static final String FG_ACTIVE_ENABLED = "1";
    private static final String CATEGORY_SOURCE = "SOURCE";
    private static final String CATEGORY_TARGET = "TARGET";
    private static final BigDecimal MAX_NUMBER_19_0 = new BigDecimal("9999999999999999999");

    private final LogQueryMapper mapper;
    private final LogCursorCodec cursorCodec;

    public LogQueryServiceImpl(LogQueryMapper mapper, @Lazy LogCursorCodec cursorCodec) {
        this.mapper = mapper;
        this.cursorCodec = cursorCodec;
    }

    @Override
    public DataSourceOptionsVO getDataSourceOptions() {
        List<DataSourceRow> rows = executeWithTimeoutMapping(mapper::selectAllDataSources);

        List<DataSourceOptionVO> sourceList = new ArrayList<>();
        List<DataSourceOptionVO> targetList = new ArrayList<>();
        for (DataSourceRow row : rows) {
            String category = trimToNull(row.getDataSourceCategory());
            if (!FG_ACTIVE_ENABLED.equals(row.getFgActive())) {
                continue;
            }
            DataSourceOptionVO vo = new DataSourceOptionVO();
            vo.setId(row.getDataSourceId());
            vo.setOrg(normalizeOrg(row.getDataSourceOrg()));
            if (CATEGORY_SOURCE.equalsIgnoreCase(category)) {
                sourceList.add(vo);
            } else if (CATEGORY_TARGET.equalsIgnoreCase(category)) {
                targetList.add(vo);
            }
        }
        sourceList.sort(orgComparator());
        targetList.sort(orgComparator());

        DataSourceOptionsVO result = new DataSourceOptionsVO();
        result.setSourceList(sourceList);
        result.setTargetList(targetList);
        return result;
    }

    @Override
    public LogListResponse searchLogs(LogListQuery query) {
        // 1. 日志类型白名单（HTTP 层已校验，这里兜底）
        LogTypeEnum logType = requireLogType(query.getLogType());

        // 2. 时间：存在 + 格式 + 顺序 + 半开区间 + 7 天公式
        LocalDateTime startTime = parseTimeRequired(query.getStartTime());
        LocalDateTime endTime = parseTimeRequired(query.getEndTime());
        if (startTime.isAfter(endTime)) {
            throw LogQueryErrorCode.timeOrderInvalid();
        }
        LocalDateTime endExclusive = endTime.plusSeconds(1);
        if (Duration.between(startTime, endExclusive).compareTo(MAX_SPAN) > 0) {
            throw LogQueryErrorCode.timeSpanExceeded();
        }

        // 3. 可选条件：ID 数组 ≤100 且元素合法并去重；表名规范化且 ≤64
        List<String> sourceDataSourceIds = normalizeDataSourceIds(query.getSourceDataSourceIds());
        String sourceTableName = normalizeTableName(query.getSourceTableName());
        List<String> targetDataSourceIds = normalizeDataSourceIds(query.getTargetDataSourceIds());
        String targetTableName = normalizeTableName(query.getTargetTableName());

        // 4. 恰好读取一次数据源全表，构建全量名称映射与有效 source/target 候选集合
        List<DataSourceRow> dataSourceRows = executeWithTimeoutMapping(mapper::selectAllDataSources);
        Map<String, String> nameMap = new HashMap<>();
        Set<String> sourceCandidates = new HashSet<>();
        Set<String> targetCandidates = new HashSet<>();
        for (DataSourceRow row : dataSourceRows) {
            nameMap.put(row.getDataSourceId(), row.getDataSourceOrg());
            String category = trimToNull(row.getDataSourceCategory());
            if (FG_ACTIVE_ENABLED.equals(row.getFgActive())) {
                if (CATEGORY_SOURCE.equalsIgnoreCase(category)) {
                    sourceCandidates.add(row.getDataSourceId());
                } else if (CATEGORY_TARGET.equalsIgnoreCase(category)) {
                    targetCandidates.add(row.getDataSourceId());
                }
            }
        }

        // 5. 已选 ID 必须属于对应有效候选集合
        for (String id : sourceDataSourceIds) {
            if (!sourceCandidates.contains(id)) {
                throw LogQueryErrorCode.dataSourceIdsInvalid();
            }
        }
        for (String id : targetDataSourceIds) {
            if (!targetCandidates.contains(id)) {
                throw LogQueryErrorCode.dataSourceIdsInvalid();
            }
        }

        // 6. 游标：签名/版本/logType/条件指纹校验（仅提供时）
        final LocalDateTime cursorTargetTime;
        final BigDecimal cursorCdcLogId;
        if (StringUtils.hasText(query.getCursor())) {
            String fingerprint = buildFingerprint(logType, startTime, endExclusive,
                    sourceDataSourceIds, sourceTableName, targetDataSourceIds, targetTableName);
            LogCursorBoundary boundary;
            try {
                boundary = cursorCodec.decodeAndVerify(query.getCursor(), logType.getValue(), fingerprint);
            } catch (LogCursorInvalidException e) {
                throw LogQueryErrorCode.cursorInvalid();
            } catch (LogCursorConditionMismatchException e) {
                throw LogQueryErrorCode.cursorConditionMismatch();
            }
            cursorTargetTime = boundary.getTargetTime();
            cursorCdcLogId = boundary.getCdcLogId();
        } else {
            cursorTargetTime = null;
            cursorCdcLogId = null;
        }

        // 7. 轻量列表 SQL，固定排序，FETCH FIRST 101
        List<LogListRow> rows = executeWithTimeoutMapping(() -> mapper.selectLogList(
                logType.getTableName(), startTime, endExclusive,
                sourceDataSourceIds, sourceTableName,
                targetDataSourceIds, targetTableName,
                cursorTargetTime, cursorCdcLogId));

        // 8. 组装：100 条上限 + hasNext + nextCursor（边界为第 100 条）
        boolean hasNext = rows.size() > PAGE_SIZE;
        int limit = hasNext ? PAGE_SIZE : rows.size();
        List<LogListVO> items = new ArrayList<>(limit);
        for (int i = 0; i < limit; i++) {
            items.add(toListVO(rows.get(i), nameMap));
        }
        String nextCursor = null;
        if (hasNext) {
            LogListRow boundaryRow = rows.get(PAGE_SIZE - 1);
            String fingerprint = buildFingerprint(logType, startTime, endExclusive,
                    sourceDataSourceIds, sourceTableName, targetDataSourceIds, targetTableName);
            nextCursor = cursorCodec.encode(logType.getValue(), fingerprint,
                    boundaryRow.getTargetTime(), boundaryRow.getCdcLogId());
        }
        return new LogListResponse(items, hasNext, nextCursor);
    }

    @Override
    public LogDetailVO getLogDetail(String logTypeStr, String cdcLogIdStr) {
        LogTypeEnum logType = requireLogType(logTypeStr);
        BigDecimal cdcLogId = parseCdcLogId(cdcLogIdStr);
        LogDetailRow row = executeWithTimeoutMapping(
                () -> mapper.selectLogDetail(logType.getTableName(), cdcLogId));
        if (row == null) {
            throw LogQueryErrorCode.logRecordNotFound();
        }
        return toDetailVO(row);
    }

    @Override
    public RawMessageVO getRawMessage(String logTypeStr, String cdcLogIdStr) {
        LogTypeEnum logType = requireLogType(logTypeStr);
        BigDecimal cdcLogId = parseCdcLogId(cdcLogIdStr);
        RawMessageRow row = executeWithTimeoutMapping(
                () -> mapper.selectRawMessage(logType.getTableName(), cdcLogId));
        if (row == null) {
            throw LogQueryErrorCode.logRecordNotFound();
        }
        RawMessageVO vo = new RawMessageVO();
        vo.setCdcLogId(row.getCdcLogId() == null ? null : row.getCdcLogId().toPlainString());
        vo.setRawMessage(row.getRawMessage() == null ? "" : row.getRawMessage());
        return vo;
    }

    // ---- 校验与规范化 ----

    private static LogTypeEnum requireLogType(String logType) {
        LogTypeEnum e = LogTypeEnum.fromValue(logType);
        if (e == null) {
            throw LogQueryErrorCode.logTypeInvalid(logType);
        }
        return e;
    }

    private static LocalDateTime parseTimeRequired(String value) {
        if (!StringUtils.hasText(value)) {
            throw LogQueryErrorCode.timeRangeRequired();
        }
        try {
            return LocalDateTime.parse(value.trim(), TIME_FORMAT);
        } catch (DateTimeParseException e) {
            throw LogQueryErrorCode.timeRangeRequired();
        }
    }

    /**
     * 数据源 ID 数组：≤100、元素非空且格式合法、去重（LQ-API-35）。
     */
    private static List<String> normalizeDataSourceIds(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return Collections.emptyList();
        }
        if (ids.size() > MAX_DATA_SOURCE_IDS) {
            throw LogQueryErrorCode.dataSourceIdsInvalid();
        }
        LinkedHashSet<String> set = new LinkedHashSet<>();
        for (String id : ids) {
            if (id == null || id.trim().isEmpty()) {
                throw LogQueryErrorCode.dataSourceIdsInvalid();
            }
            set.add(id);
        }
        return new ArrayList<>(set);
    }

    /**
     * 表名：去除首尾空白；空文本视为未选择；长度 ≤64（LQ-API-37）。
     */
    private static String normalizeTableName(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        if (trimmed.length() > MAX_TABLE_NAME_LENGTH) {
            throw LogQueryErrorCode.tableNameInvalid();
        }
        return trimmed;
    }

    /**
     * CDC_LOG_ID：1~19 位十进制且 ≤ NUMBER(19,0) 最大值，否则 HTTP 400（LQ-API-99、LQ-DESIGN-18）。
     */
    public static BigDecimal parseCdcLogId(String value) {
        if (value == null || !value.matches("[0-9]{1,19}")) {
            throw new LogQueryBadRequestException("cdcLogId 必须为 1~19 位十进制字符串且在 NUMBER(19,0) 范围内");
        }
        BigDecimal id = new BigDecimal(value);
        if (id.compareTo(MAX_NUMBER_19_0) > 0) {
            throw new LogQueryBadRequestException("cdcLogId 超出 NUMBER(19,0) 范围");
        }
        return id;
    }

    private static String buildFingerprint(LogTypeEnum logType, LocalDateTime startTime,
                                           LocalDateTime endExclusive,
                                           List<String> sourceDataSourceIds, String sourceTableName,
                                           List<String> targetDataSourceIds, String targetTableName) {
        return LogQueryFingerprint.compute(logType.getValue(), startTime, endExclusive,
                sourceDataSourceIds, sourceTableName,
                targetDataSourceIds, targetTableName);
    }

    // ---- 名称映射与降级（LQ-API-64 / LQ-DESIGN-81） ----

    private static LogListVO toListVO(LogListRow row, Map<String, String> nameMap) {
        LogListVO vo = new LogListVO();
        vo.setCdcLogId(row.getCdcLogId() == null ? null : row.getCdcLogId().toPlainString());
        vo.setSourceDataSourceId(row.getSourceDataSourceId());
        vo.setSourceDataSourceName(resolveName(row.getSourceDataSourceId(), nameMap));
        vo.setSourceTableName(row.getSourceTableName());
        vo.setTargetDataSourceId(row.getTargetDataSourceId());
        vo.setTargetDataSourceName(resolveName(row.getTargetDataSourceId(), nameMap));
        vo.setTargetTableName(row.getTargetTableName());
        vo.setInstructionType(row.getInstructionType());
        vo.setLogSummary(row.getLogDetailSummary());
        vo.setHasLogDetail(row.getHasLogDetail() != null && row.getHasLogDetail());
        vo.setHasRawMessage(row.getHasRawMessage() != null && row.getHasRawMessage());
        vo.setOffset(row.getOffset());
        vo.setSourceTime(formatTime(row.getSourceTime()));
        vo.setKafkaEnqueueTime(formatTime(row.getKafkaEnqueueTime()));
        vo.setTargetTime(formatTime(row.getTargetTime()));
        vo.setInsertTime(formatTime(row.getInsertTime()));
        return vo;
    }

    private static LogDetailVO toDetailVO(LogDetailRow row) {
        LogDetailVO vo = new LogDetailVO();
        vo.setCdcLogId(row.getCdcLogId() == null ? null : row.getCdcLogId().toPlainString());
        vo.setSourceDataSourceId(row.getSourceDataSourceId());
        vo.setSourceTableName(row.getSourceTableName());
        vo.setTargetDataSourceId(row.getTargetDataSourceId());
        vo.setTargetTableName(row.getTargetTableName());
        vo.setInstructionType(row.getInstructionType());
        vo.setResultCode(row.getResultCode());
        vo.setOffset(row.getOffset());
        vo.setSourceTime(formatTime(row.getSourceTime()));
        vo.setKafkaEnqueueTime(formatTime(row.getKafkaEnqueueTime()));
        vo.setTargetTime(formatTime(row.getTargetTime()));
        vo.setInsertTime(formatTime(row.getInsertTime()));
        vo.setLogDetail(row.getLogDetail());
        return vo;
    }

    private static String resolveName(String rawId, Map<String, String> nameMap) {
        if (rawId == null) {
            return null;
        }
        if (!nameMap.containsKey(rawId)) {
            return rawId;
        }
        String org = nameMap.get(rawId);
        if (StringUtils.hasText(org)) {
            return org;
        }
        return UNDEFINED_NAME;
    }

    private static String formatTime(LocalDateTime t) {
        return t == null ? null : t.format(TIME_FORMAT);
    }

    private static String normalizeOrg(String org) {
        return StringUtils.hasText(org) ? org : null;
    }

    private static String trimToNull(String s) {
        if (s == null) {
            return null;
        }
        String trimmed = s.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static Comparator<DataSourceOptionVO> orgComparator() {
        return Comparator.comparing(DataSourceOptionVO::getOrg,
                Comparator.nullsLast(Comparator.naturalOrder()));
    }

    // ---- 超时与数据库访问失败映射（LQ-API-89 / 90） ----

    private <T> T executeWithTimeoutMapping(Supplier<T> supplier) {
        try {
            return supplier.get();
        } catch (RuntimeException e) {
            if (isQueryTimeout(e)) {
                log.warn("Log-query statement timeout: {}", e.getMessage());
                throw LogQueryErrorCode.queryTimeout();
            }
            log.error("Log-query database access failed", e);
            throw LogQueryErrorCode.databaseAccessFailed();
        }
    }

    private static boolean isQueryTimeout(Throwable t) {
        Throwable cur = t;
        while (cur != null) {
            if (cur instanceof QueryTimeoutException || cur instanceof SQLTimeoutException) {
                return true;
            }
            if (cur instanceof SQLException) {
                SQLException se = (SQLException) cur;
                if ("HYT00".equals(se.getSQLState()) || se.getErrorCode() == 1013) {
                    return true;
                }
            }
            cur = cur.getCause();
        }
        return false;
    }
}
