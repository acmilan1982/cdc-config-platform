package com.bsoft.cdcconfig.subscription.converter;

import com.bsoft.cdcconfig.subscription.entity.DataSourceRef;
import com.bsoft.cdcconfig.subscription.entity.DataSubscribe;
import com.bsoft.cdcconfig.subscription.helper.DataSourceTableParser;
import com.bsoft.cdcconfig.subscription.helper.SubscriptionCsvHelper;
import com.bsoft.cdcconfig.subscription.vo.SchemaTableGroup;
import com.bsoft.cdcconfig.subscription.vo.SourceOptionVO;
import com.bsoft.cdcconfig.subscription.vo.SourceRefVO;
import com.bsoft.cdcconfig.subscription.vo.SubscriptionDeletePreviewVO;
import com.bsoft.cdcconfig.subscription.vo.SubscriptionDetailVO;
import com.bsoft.cdcconfig.subscription.vo.SubscriptionRowVO;
import com.bsoft.cdcconfig.subscription.vo.SubscriptionTargetOptionVO;
import com.bsoft.cdcconfig.subscription.vo.TargetRefVO;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 订阅 Entity &lt;-&gt; VO 转换（DESIGN §2.2）。数据源引用映射复用 {@link DataSourceRef}
 * 最小投影（DATA_SOURCE_ID / DATA_SOURCE_ORG / FG_ACTIVE），绝不加载含密码完整 Entity。
 */
public final class SubscriptionConverter {

    private static final DateTimeFormatter TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss").withZone(ZoneId.of("Asia/Shanghai"));

    private SubscriptionConverter() {
    }

    public static SourceOptionVO toSourceOptionVO(DataSourceRef ref) {
        SourceOptionVO vo = new SourceOptionVO();
        vo.setDataSourceId(ref.getDataSourceId());
        vo.setDataSourceOrg(ref.getDataSourceOrg());
        return vo;
    }

    public static SubscriptionTargetOptionVO toTargetOptionVO(DataSourceRef ref) {
        SubscriptionTargetOptionVO vo = new SubscriptionTargetOptionVO();
        vo.setDataSourceId(ref.getDataSourceId());
        vo.setDataSourceOrg(ref.getDataSourceOrg());
        return vo;
    }

    /**
     * 源库引用映射（DESIGN §4.8）：缺失 → NOT_FOUND（ORG=null，前端显示原始 ID）；
     * FG_ACTIVE != '1' → INACTIVE；否则 NORMAL。
     */
    public static SourceRefVO toSourceRefVO(DataSourceRef ref, String sourceId) {
        SourceRefVO vo = new SourceRefVO();
        vo.setDataSourceId(sourceId);
        if (ref == null) {
            vo.setStatus("NOT_FOUND");
        } else {
            vo.setDataSourceOrg(ref.getDataSourceOrg());
            vo.setStatus("1".equals(ref.getFgActive()) ? "NORMAL" : "INACTIVE");
        }
        return vo;
    }

    public static TargetRefVO toTargetRefVO(DataSourceRef ref, String targetId) {
        TargetRefVO vo = new TargetRefVO();
        vo.setDataSourceId(targetId);
        if (ref == null) {
            vo.setStatus("NOT_FOUND");
        } else {
            vo.setDataSourceOrg(ref.getDataSourceOrg());
            vo.setStatus("1".equals(ref.getFgActive()) ? "NORMAL" : "INACTIVE");
        }
        return vo;
    }

    /** 按 Schema 分组（保持首次出现顺序；表名保持原始顺序与大小写）。 */
    public static List<SchemaTableGroup> groupBySchema(List<DataSourceTableParser.TableEntry> entries) {
        Map<String, List<String>> grouped = new LinkedHashMap<>();
        for (DataSourceTableParser.TableEntry entry : entries) {
            grouped.computeIfAbsent(entry.getSchema(), k -> new ArrayList<>()).add(entry.getTableName());
        }
        List<SchemaTableGroup> result = new ArrayList<>(grouped.size());
        for (Map.Entry<String, List<String>> g : grouped.entrySet()) {
            SchemaTableGroup vo = new SchemaTableGroup();
            vo.setSchema(g.getKey());
            vo.setTables(g.getValue());
            result.add(vo);
        }
        return result;
    }

    /** ISO-8601 时间格式化（Asia/Shanghai）；null 返回 null。 */
    public static String formatTime(Date date) {
        return date == null ? null : TIME_FORMATTER.format(date.toInstant());
    }

    public static SubscriptionRowVO toRowVO(DataSubscribe row, Map<String, DataSourceRef> refMap) {
        SubscriptionRowVO vo = new SubscriptionRowVO();
        vo.setDataSubId(row.getDataSubId());
        vo.setDataSubDesc(row.getDataSubDesc());

        boolean anomaly = SubscriptionCsvHelper.isMultiSourceAnomaly(row.getDataFromSourceId());
        vo.setAnomalyMultiSource(anomaly);

        DataSourceTableParser.ParseResult parsed = DataSourceTableParser.parse(row.getDataSourceTable());
        vo.setSourceTableCount(parsed.getTableCount());
        vo.setTablesBySchema(groupBySchema(parsed.getEntries()));
        vo.setRawUnparseableTables(parsed.getRawUnparseable());

        if (!anomaly) {
            List<String> sourceTokens = SubscriptionCsvHelper.splitTrimDropEmpty(row.getDataFromSourceId());
            if (!sourceTokens.isEmpty()) {
                String sourceId = sourceTokens.get(0);
                vo.setSource(toSourceRefVO(refMap.get(sourceId), sourceId));
            }
        }

        vo.setTargets(toTargetRefVOList(row.getDataToSourceId(), refMap));
        vo.setInsertTime(formatTime(row.getInsertTime()));
        vo.setUpdateTime(formatTime(row.getUpdateTime()));
        return vo;
    }

    public static SubscriptionDetailVO toDetailVO(DataSubscribe row, Map<String, DataSourceRef> refMap,
                                                  List<String> warnings) {
        SubscriptionDetailVO vo = new SubscriptionDetailVO();
        vo.setDataSubId(row.getDataSubId());
        vo.setDataSubDesc(row.getDataSubDesc());

        List<String> sourceTokens = SubscriptionCsvHelper.splitTrimDropEmpty(row.getDataFromSourceId());
        if (!sourceTokens.isEmpty()) {
            String sourceId = sourceTokens.get(0);
            vo.setSource(toSourceRefVO(refMap.get(sourceId), sourceId));
        }

        DataSourceTableParser.ParseResult parsed = DataSourceTableParser.parse(row.getDataSourceTable());
        vo.setTablesBySchema(groupBySchema(parsed.getEntries()));
        vo.setRawUnparseableTables(parsed.getRawUnparseable());

        vo.setTargets(toTargetRefVOList(row.getDataToSourceId(), refMap));
        vo.setInsertTime(formatTime(row.getInsertTime()));
        vo.setUpdateTime(formatTime(row.getUpdateTime()));
        vo.setWarnings(warnings);
        return vo;
    }

    public static SubscriptionDeletePreviewVO toDeletePreviewVO(DataSubscribe row,
                                                                Map<String, DataSourceRef> refMap,
                                                                List<String> warnings) {
        SubscriptionDeletePreviewVO vo = new SubscriptionDeletePreviewVO();
        vo.setDataSubId(row.getDataSubId());
        vo.setDataSubDesc(row.getDataSubDesc());

        List<String> sourceTokens = SubscriptionCsvHelper.splitTrimDropEmpty(row.getDataFromSourceId());
        if (!sourceTokens.isEmpty()) {
            String sourceId = sourceTokens.get(0);
            vo.setSource(toSourceRefVO(refMap.get(sourceId), sourceId));
        }

        DataSourceTableParser.ParseResult parsed = DataSourceTableParser.parse(row.getDataSourceTable());
        vo.setSchemaCount(distinctSchemaCount(parsed.getEntries()));
        vo.setTableCount(parsed.getTableCount());
        vo.setTargets(toTargetRefVOList(row.getDataToSourceId(), refMap));
        vo.setWarnings(warnings);
        return vo;
    }

    public static List<TargetRefVO> toTargetRefVOList(String csv, Map<String, DataSourceRef> refMap) {
        List<String> targetIds = SubscriptionCsvHelper.splitTrimDropEmpty(csv);
        List<TargetRefVO> result = new ArrayList<>(targetIds.size());
        for (String targetId : targetIds) {
            result.add(toTargetRefVO(refMap.get(targetId), targetId));
        }
        return result;
    }

    private static int distinctSchemaCount(List<DataSourceTableParser.TableEntry> entries) {
        LinkedHashMap<String, Boolean> seen = new LinkedHashMap<>();
        for (DataSourceTableParser.TableEntry entry : entries) {
            seen.put(entry.getSchema(), Boolean.TRUE);
        }
        return seen.size();
    }
}
