package com.bsoft.cdcconfig.datasource.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.bsoft.cdcconfig.common.exception.BusinessException;
import com.bsoft.cdcconfig.datasource.converter.DataSourceConverter;
import com.bsoft.cdcconfig.datasource.dto.NamingStrategyDTO;
import com.bsoft.cdcconfig.datasource.entity.DataSource;
import com.bsoft.cdcconfig.datasource.entity.DataSourceExtend;
import com.bsoft.cdcconfig.datasource.enums.TableNamingStrategyEnum;
import com.bsoft.cdcconfig.datasource.exception.DataSourceErrorCode;
import com.bsoft.cdcconfig.datasource.mapper.DataSourceExtendMapper;
import com.bsoft.cdcconfig.datasource.mapper.DataSourceMapper;
import com.bsoft.cdcconfig.datasource.service.DataSourceNamingStrategyService;
import com.bsoft.cdcconfig.datasource.vo.NamingStrategyVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class DataSourceNamingStrategyServiceImpl implements DataSourceNamingStrategyService {

    private static final Logger log = LoggerFactory.getLogger(DataSourceNamingStrategyServiceImpl.class);

    private final DataSourceExtendMapper extendMapper;
    private final DataSourceMapper dataSourceMapper;

    public DataSourceNamingStrategyServiceImpl(DataSourceExtendMapper extendMapper,
                                               DataSourceMapper dataSourceMapper) {
        this.extendMapper = extendMapper;
        this.dataSourceMapper = dataSourceMapper;
    }

    @Override
    public List<NamingStrategyVO> list(String sourceId) {
        String sid = trim(sourceId);
        requireSourceRecord(sid);

        List<DataSourceExtend> extendRecords = extendMapper.selectList(
                new LambdaQueryWrapper<DataSourceExtend>()
                        .eq(DataSourceExtend::getDataSourceId, sid));

        Set<String> targetIds = new LinkedHashSet<>();
        for (DataSourceExtend e : extendRecords) {
            if (StringUtils.hasText(e.getTargetDataSourceId())) {
                targetIds.add(e.getTargetDataSourceId());
            }
        }
        Map<String, DataSource> targetMap = Collections.emptyMap();
        if (!targetIds.isEmpty()) {
            List<DataSource> targets = dataSourceMapper.selectList(
                    new LambdaQueryWrapper<DataSource>()
                            .in(DataSource::getDataSourceId, targetIds));
            targetMap = new HashMap<>();
            for (DataSource t : targets) {
                targetMap.put(t.getDataSourceId(), t);
            }
        }

        List<NamingStrategyVO> result = new ArrayList<>(extendRecords.size());
        for (DataSourceExtend e : extendRecords) {
            NamingStrategyVO vo = new NamingStrategyVO();
            vo.setSourceDataSourceId(sid);
            vo.setTargetDataSourceId(e.getTargetDataSourceId());
            DataSource target = e.getTargetDataSourceId() == null ? null : targetMap.get(e.getTargetDataSourceId());
            if (target != null) {
                vo.setTargetDataSourceName(target.getDataSourceName());
                vo.setTargetDataSourceType(DataSourceConverter.normalizeType(target.getDataSourceType()));
            }
            vo.setTableNamingStrategy(e.getTableNamingStrategy());
            vo.setTableNamePrefix(e.getTableNamePrefix());
            vo.setTableNameSuffix(e.getTableNameSuffix());
            result.add(vo);
        }
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void create(String sourceId, NamingStrategyDTO dto) {
        String sid = trim(sourceId);
        requireSourceRecord(sid);

        trimInPlace(dto);
        String targetId = dto.getTargetDataSourceId();
        assertValidTarget(targetId);
        String strategy = dto.getTableNamingStrategy();
        assertNamingStrategyFields(strategy, dto.getTableNamePrefix(), dto.getTableNameSuffix());

        Long count = countLogicalKey(sid, targetId);
        if (count != null && count == 1) {
            throw DataSourceErrorCode.namingStrategyDuplicate();
        }
        if (count != null && count >= 2) {
            throw DataSourceErrorCode.namingStrategyMultiConflict();
        }

        DataSourceExtend extend = new DataSourceExtend();
        extend.setDataSourceId(sid);
        extend.setTargetDataSourceId(targetId);
        extend.setTableNamingStrategy(strategy);
        extend.setTableNamePrefix(resolvePrefix(strategy, dto.getTableNamePrefix()));
        extend.setTableNameSuffix(resolveSuffix(strategy, dto.getTableNameSuffix()));
        int rows = extendMapper.insert(extend);
        if (rows != 1) {
            throw DataSourceErrorCode.saveFailed();
        }
        log.info("Created naming strategy: source={}, target={}", sid, targetId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(String sourceId, String originalTargetId, NamingStrategyDTO dto) {
        String sid = trim(sourceId);
        String originalTarget = trim(originalTargetId);
        requireSourceRecord(sid);

        trimInPlace(dto);
        String newTarget = dto.getTargetDataSourceId();
        assertValidTarget(newTarget);
        String strategy = dto.getTableNamingStrategy();
        assertNamingStrategyFields(strategy, dto.getTableNamePrefix(), dto.getTableNameSuffix());

        Long originalCount = countLogicalKey(sid, originalTarget);
        if (originalCount == null || originalCount == 0) {
            throw DataSourceErrorCode.namingStrategyNotFound();
        }
        if (originalCount >= 2) {
            throw DataSourceErrorCode.namingStrategyMultiConflict();
        }

        if (!newTarget.equalsIgnoreCase(originalTarget)) {
            Long newKeyCount = extendMapper.selectCount(
                    new LambdaQueryWrapper<DataSourceExtend>()
                            .apply("UPPER(DATA_SOURCE_ID) = UPPER({0})", sid)
                            .apply("UPPER(TARGET_DATA_SOURCE_ID) = UPPER({0})", newTarget)
                            .apply("UPPER(TARGET_DATA_SOURCE_ID) <> UPPER({0})", originalTarget));
            if (newKeyCount != null && newKeyCount == 1) {
                throw DataSourceErrorCode.namingStrategyDuplicate();
            }
            if (newKeyCount != null && newKeyCount >= 2) {
                throw DataSourceErrorCode.namingStrategyMultiConflict();
            }
        }

        int rows = extendMapper.update(null,
                new LambdaUpdateWrapper<DataSourceExtend>()
                        .eq(DataSourceExtend::getDataSourceId, sid)
                        .eq(DataSourceExtend::getTargetDataSourceId, originalTarget)
                        .set(DataSourceExtend::getTargetDataSourceId, newTarget)
                        .set(DataSourceExtend::getTableNamingStrategy, strategy)
                        .set(DataSourceExtend::getTableNamePrefix, resolvePrefix(strategy, dto.getTableNamePrefix()))
                        .set(DataSourceExtend::getTableNameSuffix, resolveSuffix(strategy, dto.getTableNameSuffix())));
        if (rows != 1) {
            throw DataSourceErrorCode.saveFailed();
        }
        log.info("Updated naming strategy: source={}, target {} -> {}", sid, originalTarget, newTarget);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(String sourceId, String targetId) {
        String sid = trim(sourceId);
        String target = trim(targetId);
        requireSourceRecord(sid);

        Long count = countLogicalKey(sid, target);
        if (count == null || count == 0) {
            throw DataSourceErrorCode.namingStrategyNotFound();
        }
        if (count >= 2) {
            throw DataSourceErrorCode.namingStrategyMultiConflict();
        }

        int rows = extendMapper.delete(
                new LambdaQueryWrapper<DataSourceExtend>()
                        .eq(DataSourceExtend::getDataSourceId, sid)
                        .eq(DataSourceExtend::getTargetDataSourceId, target));
        if (rows != 1) {
            throw DataSourceErrorCode.deleteFailed();
        }
        log.info("Deleted naming strategy: source={}, target={}", sid, target);
    }

    // ---- helpers ----

    private DataSource requireSourceRecord(String sourceId) {
        DataSource ds = dataSourceMapper.selectOne(
                new LambdaQueryWrapper<DataSource>()
                        .eq(DataSource::getDataSourceId, sourceId)
                        .eq(DataSource::getFgActive, "1"));
        if (ds == null) {
            throw DataSourceErrorCode.notFound(sourceId);
        }
        if (!"SOURCE".equalsIgnoreCase(ds.getDataSourceCategory())) {
            throw DataSourceErrorCode.roleNotApplicable();
        }
        return ds;
    }

    private void assertValidTarget(String targetId) {
        DataSource target = dataSourceMapper.selectOne(
                new LambdaQueryWrapper<DataSource>()
                        .eq(DataSource::getDataSourceId, targetId)
                        .eq(DataSource::getFgActive, "1")
                        .apply("UPPER(DATA_SOURCE_CATEGORY) = 'TARGET'"));
        if (target == null) {
            throw DataSourceErrorCode.invalidTargetDataSource();
        }
    }

    private void assertNamingStrategyFields(String strategy, String prefix, String suffix) {
        if (!TableNamingStrategyEnum.isValid(strategy)) {
            throw DataSourceErrorCode.invalidNamingStrategy();
        }
        if (TableNamingStrategyEnum.CUSTOM_PREFIX_SUFFIX.getCode().equals(strategy)
                && (!StringUtils.hasText(prefix) || !StringUtils.hasText(suffix))) {
            throw new BusinessException(DataSourceErrorCode.INVALID_NAMING_STRATEGY,
                    "自定义命名策略必须填写前缀和后缀");
        }
    }

    private String resolvePrefix(String strategy, String prefix) {
        if (TableNamingStrategyEnum.TABLE_MERGE.getCode().equals(strategy)) {
            return "";
        }
        return prefix;
    }

    private String resolveSuffix(String strategy, String suffix) {
        if (TableNamingStrategyEnum.TABLE_MERGE.getCode().equals(strategy)) {
            return "";
        }
        return suffix;
    }

    private Long countLogicalKey(String sourceId, String targetId) {
        return extendMapper.selectCount(
                new LambdaQueryWrapper<DataSourceExtend>()
                        .apply("UPPER(DATA_SOURCE_ID) = UPPER({0})", sourceId)
                        .apply("UPPER(TARGET_DATA_SOURCE_ID) = UPPER({0})", targetId));
    }

    private static String trim(String value) {
        return value == null ? null : value.trim();
    }

    private static void trimInPlace(NamingStrategyDTO dto) {
        dto.setTargetDataSourceId(trim(dto.getTargetDataSourceId()));
        dto.setTableNamingStrategy(trim(dto.getTableNamingStrategy()));
        dto.setTableNamePrefix(trim(dto.getTableNamePrefix()));
        dto.setTableNameSuffix(trim(dto.getTableNameSuffix()));
    }
}
