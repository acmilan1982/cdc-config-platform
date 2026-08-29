package com.bsoft.cdcconfig.datasource.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.bsoft.cdcconfig.common.exception.BusinessException;
import com.bsoft.cdcconfig.datasource.connection.ConnectionTester;
import com.bsoft.cdcconfig.datasource.converter.DataSourceConverter;
import com.bsoft.cdcconfig.datasource.dto.BizAttrSaveDTO;
import com.bsoft.cdcconfig.datasource.dto.DataSourceCreateDTO;
import com.bsoft.cdcconfig.datasource.dto.DataSourceUpdateDTO;
import com.bsoft.cdcconfig.datasource.dto.NamingStrategyDTO;
import com.bsoft.cdcconfig.datasource.dto.TestConnectionDTO;
import com.bsoft.cdcconfig.datasource.entity.DataSource;
import com.bsoft.cdcconfig.datasource.entity.DataSourceExtend;
import com.bsoft.cdcconfig.datasource.enums.DataSourceCategoryEnum;
import com.bsoft.cdcconfig.datasource.enums.DataSourceTypeEnum;
import com.bsoft.cdcconfig.datasource.enums.TableNamingStrategyEnum;
import com.bsoft.cdcconfig.datasource.exception.DataSourceErrorCode;
import com.bsoft.cdcconfig.datasource.mapper.DataSourceExtendMapper;
import com.bsoft.cdcconfig.datasource.mapper.DataSourceMapper;
import com.bsoft.cdcconfig.datasource.query.DataSourceQuery;
import com.bsoft.cdcconfig.datasource.service.DataSourceService;
import com.bsoft.cdcconfig.datasource.vo.BizAttrVO;
import com.bsoft.cdcconfig.datasource.vo.DataSourceDetailVO;
import com.bsoft.cdcconfig.datasource.vo.DataSourceListVO;
import com.bsoft.cdcconfig.datasource.vo.NamingStrategyVO;
import com.bsoft.cdcconfig.datasource.vo.TargetOptionVO;
import com.bsoft.cdcconfig.datasource.vo.TestConnectionResultVO;
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
public class DataSourceServiceImpl implements DataSourceService {

    private static final Logger log = LoggerFactory.getLogger(DataSourceServiceImpl.class);

    private final DataSourceMapper dataSourceMapper;
    private final DataSourceExtendMapper extendMapper;
    private final ConnectionTester connectionTester;

    public DataSourceServiceImpl(DataSourceMapper dataSourceMapper,
                                 DataSourceExtendMapper extendMapper,
                                 ConnectionTester connectionTester) {
        this.dataSourceMapper = dataSourceMapper;
        this.extendMapper = extendMapper;
        this.connectionTester = connectionTester;
    }

    // ---- list ----

    @Override
    public List<DataSourceListVO> list(DataSourceQuery query) {
        LambdaQueryWrapper<DataSource> wrapper = new LambdaQueryWrapper<>();

        String id = trim(query.getId());
        if (StringUtils.hasText(id)) {
            wrapper.apply("UPPER(DATA_SOURCE_ID) LIKE UPPER('%' || {0} || '%') ESCAPE '\\'", escapeLike(id));
        }
        String name = trim(query.getName());
        if (StringUtils.hasText(name)) {
            wrapper.apply("UPPER(DATA_SOURCE_NAME) LIKE UPPER('%' || {0} || '%') ESCAPE '\\'", escapeLike(name));
        }
        String host = trim(query.getHost());
        if (StringUtils.hasText(host)) {
            wrapper.apply("UPPER(DATA_SOURCE_HOST) LIKE UPPER('%' || {0} || '%') ESCAPE '\\'", escapeLike(host));
        }

        wrapper.eq(DataSource::getFgActive, "1");
        wrapper.orderByAsc(DataSource::getDataSourceId);

        List<DataSource> records = dataSourceMapper.selectList(wrapper);
        List<DataSourceListVO> result = new ArrayList<>(records.size());
        for (DataSource ds : records) {
            result.add(DataSourceConverter.toListVO(ds));
        }
        return result;
    }

    // ---- detail ----

    @Override
    public DataSourceDetailVO getDetail(String dataSourceId) {
        DataSource ds = requireActiveRecord(trim(dataSourceId));
        return DataSourceConverter.toDetailVO(ds);
    }

    // ---- create ----

    @Override
    @Transactional(rollbackFor = Exception.class)
    public String create(DataSourceCreateDTO dto) {
        trimInPlace(dto);
        String id = dto.getDataSourceId();
        String name = dto.getDataSourceName();
        String category = dto.getDataSourceCategory();
        String type = dto.getDataSourceType();

        assertIdUnavailable(id);
        assertNameUnavailable(name, null);

        if (!DataSourceCategoryEnum.isValid(category)) {
            throw DataSourceErrorCode.invalidCategory();
        }
        assertTypeCompatible(category, type);

        DataSource ds = DataSourceConverter.toEntity(dto, name, "1");
        int rows = dataSourceMapper.insert(ds);
        if (rows != 1) {
            throw DataSourceErrorCode.saveFailed();
        }
        log.info("Created data source: {}", id);
        return id;
    }

    // ---- update ----

    @Override
    @Transactional(rollbackFor = Exception.class)
    public String update(String originalDataSourceId, DataSourceUpdateDTO dto) {
        String originalId = trim(originalDataSourceId);
        requireActiveRecord(originalId);

        trimInPlace(dto);
        String name = dto.getDataSourceName();
        String category = dto.getDataSourceCategory();
        String type = dto.getDataSourceType();

        String submittedId = StringUtils.hasText(dto.getDataSourceId()) ? dto.getDataSourceId() : originalId;
        String effectiveId = originalId;
        if (!submittedId.equalsIgnoreCase(originalId)) {
            assertIdUnavailableExcluding(submittedId, originalId);
            effectiveId = submittedId;
        }
        assertNameUnavailable(name, originalId);

        if (!DataSourceCategoryEnum.isValid(category)) {
            throw DataSourceErrorCode.invalidCategory();
        }
        assertTypeCompatible(category, type);

        LambdaUpdateWrapper<DataSource> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(DataSource::getDataSourceId, originalId)
                .eq(DataSource::getFgActive, "1")
                .set(DataSource::getDataSourceName, name)
                .set(DataSource::getDataSourceCategory, DataSourceCategoryEnum.normalize(category))
                .set(DataSource::getDataSourceType, DataSourceConverter.normalizeType(type))
                .set(DataSource::getDataSourceHost, dto.getHost())
                .set(DataSource::getDataSourcePort, dto.getPort() == null ? null : String.valueOf(dto.getPort()))
                .set(DataSource::getDataSourceUserName, dto.getUserName())
                .set(DataSource::getDataSourceServiceName, dto.getServiceName());
        if (!effectiveId.equals(originalId)) {
            wrapper.set(DataSource::getDataSourceId, effectiveId);
        }
        if (StringUtils.hasText(dto.getPassword())) {
            wrapper.set(DataSource::getDataSourcePassword, dto.getPassword());
        }

        int rows = dataSourceMapper.update(null, wrapper);
        if (rows != 1) {
            throw DataSourceErrorCode.notFound(originalId);
        }
        log.info("Updated data source: {} -> {}", originalId, effectiveId);
        return effectiveId;
    }

    // ---- delete ----

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(String dataSourceId) {
        String id = trim(dataSourceId);
        requireActiveRecord(id);
        int rows = dataSourceMapper.delete(
                new LambdaQueryWrapper<DataSource>()
                        .eq(DataSource::getDataSourceId, id)
                        .eq(DataSource::getFgActive, "1"));
        if (rows != 1) {
            throw DataSourceErrorCode.deleteFailed();
        }
        log.info("Deleted data source: {}", id);
    }

    // ---- test connection ----

    @Override
    public TestConnectionResultVO testConnection(TestConnectionDTO dto) {
        trimInPlace(dto);
        String type = dto.getDataSourceType();
        if (!DataSourceTypeEnum.isValid(type)) {
            throw DataSourceErrorCode.invalidType();
        }

        String password = dto.getPassword();
        if (!StringUtils.hasText(password)) {
            String originalId = dto.getOriginalDataSourceId();
            if (!StringUtils.hasText(originalId)) {
                throw new BusinessException(DataSourceErrorCode.INVALID_TYPE,
                        "密码为空时必须提供原数据源ID");
            }
            DataSource record = dataSourceMapper.selectOne(
                    new LambdaQueryWrapper<DataSource>()
                            .eq(DataSource::getDataSourceId, originalId)
                            .eq(DataSource::getFgActive, "1"));
            if (record == null) {
                throw DataSourceErrorCode.notFound(originalId);
            }
            password = record.getDataSourcePassword();
        }

        return connectionTester.test(type, dto.getHost(), dto.getPort(),
                dto.getUserName(), password, dto.getServiceName());
    }

    // ---- target options ----

    @Override
    public List<TargetOptionVO> targetOptions() {
        List<DataSource> records = dataSourceMapper.selectList(
                new LambdaQueryWrapper<DataSource>()
                        .eq(DataSource::getFgActive, "1")
                        .apply("UPPER(DATA_SOURCE_CATEGORY) = 'TARGET'")
                        .orderByAsc(DataSource::getDataSourceId));
        List<TargetOptionVO> result = new ArrayList<>(records.size());
        for (DataSource ds : records) {
            result.add(DataSourceConverter.toTargetOptionVO(ds));
        }
        return result;
    }

    // ---- biz attr ----

    @Override
    public BizAttrVO getBizAttr(String dataSourceId) {
        DataSource ds = requireTargetRecord(trim(dataSourceId));
        BizAttrVO vo = new BizAttrVO();
        vo.setDataSourceId(ds.getDataSourceId());
        vo.setBizAttr(ds.getDataSourceBizAttr());
        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void saveBizAttr(String dataSourceId, BizAttrSaveDTO dto) {
        String id = trim(dataSourceId);
        requireTargetRecord(id);
        int rows = dataSourceMapper.update(null,
                new LambdaUpdateWrapper<DataSource>()
                        .eq(DataSource::getDataSourceId, id)
                        .eq(DataSource::getFgActive, "1")
                        .set(DataSource::getDataSourceBizAttr, dto.getBizAttr()));
        if (rows != 1) {
            throw DataSourceErrorCode.saveFailed();
        }
        log.info("Saved biz attr for data source: {}", id);
    }

    // ---- naming strategies ----

    @Override
    public List<NamingStrategyVO> listNamingStrategies(String sourceId) {
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
    public void createNamingStrategy(String sourceId, NamingStrategyDTO dto) {
        String sid = trim(sourceId);
        requireSourceRecord(sid);

        trimInPlace(dto);
        String targetId = dto.getTargetDataSourceId();
        assertValidTarget(targetId);
        String strategy = dto.getTableNamingStrategy();
        assertNamingStrategyFields(strategy, dto.getTableNamePrefix(), dto.getTableNameSuffix());

        Long count = countLogicalKey(sid, targetId);
        if (count == null || count == 0) {
            // allowed to insert
        } else if (count == 1) {
            throw DataSourceErrorCode.namingStrategyDuplicate();
        } else {
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
    public void updateNamingStrategy(String sourceId, String originalTargetId, NamingStrategyDTO dto) {
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
            throw DataSourceErrorCode.namingStrategyNotFound();
        }
        log.info("Updated naming strategy: source={}, target {} -> {}", sid, originalTarget, newTarget);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteNamingStrategy(String sourceId, String targetId) {
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
            throw DataSourceErrorCode.namingStrategyNotFound();
        }
        log.info("Deleted naming strategy: source={}, target={}", sid, target);
    }

    // ---- helpers ----

    private DataSource requireActiveRecord(String dataSourceId) {
        DataSource ds = dataSourceMapper.selectOne(
                new LambdaQueryWrapper<DataSource>()
                        .eq(DataSource::getDataSourceId, dataSourceId)
                        .eq(DataSource::getFgActive, "1"));
        if (ds == null) {
            throw DataSourceErrorCode.notFound(dataSourceId);
        }
        return ds;
    }

    private DataSource requireTargetRecord(String dataSourceId) {
        DataSource ds = requireActiveRecord(dataSourceId);
        if (!"TARGET".equalsIgnoreCase(ds.getDataSourceCategory())) {
            throw DataSourceErrorCode.roleNotApplicable();
        }
        return ds;
    }

    private DataSource requireSourceRecord(String sourceId) {
        DataSource ds = requireActiveRecord(sourceId);
        if (!"SOURCE".equalsIgnoreCase(ds.getDataSourceCategory())) {
            throw DataSourceErrorCode.roleNotApplicable();
        }
        return ds;
    }

    private void assertIdUnavailable(String id) {
        Long count = dataSourceMapper.selectCount(
                new LambdaQueryWrapper<DataSource>()
                        .apply("UPPER(DATA_SOURCE_ID) = UPPER({0})", id));
        if (count != null && count > 0) {
            throw DataSourceErrorCode.idDuplicate(id);
        }
    }

    private void assertIdUnavailableExcluding(String id, String excludeDataSourceId) {
        Long count = dataSourceMapper.selectCount(
                new LambdaQueryWrapper<DataSource>()
                        .apply("UPPER(DATA_SOURCE_ID) = UPPER({0})", id)
                        .ne(DataSource::getDataSourceId, excludeDataSourceId));
        if (count != null && count > 0) {
            throw DataSourceErrorCode.idDuplicate(id);
        }
    }

    private void assertNameUnavailable(String name, String excludeDataSourceId) {
        LambdaQueryWrapper<DataSource> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DataSource::getFgActive, "1")
                .apply("UPPER(DATA_SOURCE_NAME) = UPPER({0})", name);
        if (excludeDataSourceId != null) {
            wrapper.ne(DataSource::getDataSourceId, excludeDataSourceId);
        }
        Long count = dataSourceMapper.selectCount(wrapper);
        if (count != null && count > 0) {
            throw DataSourceErrorCode.nameDuplicate(name);
        }
    }

    private void assertTypeCompatible(String category, String type) {
        if (!DataSourceTypeEnum.isValid(type)) {
            throw DataSourceErrorCode.invalidType();
        }
        if ("SOURCE".equalsIgnoreCase(category) && !"ORACLE".equalsIgnoreCase(type)) {
            throw DataSourceErrorCode.invalidType();
        }
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

    private static String escapeLike(String value) {
        return value
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }

    private static void trimInPlace(DataSourceCreateDTO dto) {
        dto.setDataSourceId(trim(dto.getDataSourceId()));
        dto.setDataSourceName(trim(dto.getDataSourceName()));
        dto.setDataSourceCategory(trim(dto.getDataSourceCategory()));
        dto.setDataSourceType(trim(dto.getDataSourceType()));
        dto.setHost(trim(dto.getHost()));
        dto.setUserName(trim(dto.getUserName()));
        dto.setPassword(trim(dto.getPassword()));
        dto.setServiceName(trim(dto.getServiceName()));
    }

    private static void trimInPlace(DataSourceUpdateDTO dto) {
        dto.setDataSourceId(trim(dto.getDataSourceId()));
        dto.setDataSourceName(trim(dto.getDataSourceName()));
        dto.setDataSourceCategory(trim(dto.getDataSourceCategory()));
        dto.setDataSourceType(trim(dto.getDataSourceType()));
        dto.setHost(trim(dto.getHost()));
        dto.setUserName(trim(dto.getUserName()));
        dto.setPassword(trim(dto.getPassword()));
        dto.setServiceName(trim(dto.getServiceName()));
    }

    private static void trimInPlace(TestConnectionDTO dto) {
        dto.setDataSourceId(trim(dto.getDataSourceId()));
        dto.setOriginalDataSourceId(trim(dto.getOriginalDataSourceId()));
        dto.setDataSourceType(trim(dto.getDataSourceType()));
        dto.setHost(trim(dto.getHost()));
        dto.setUserName(trim(dto.getUserName()));
        dto.setPassword(trim(dto.getPassword()));
        dto.setServiceName(trim(dto.getServiceName()));
    }

    private static void trimInPlace(NamingStrategyDTO dto) {
        dto.setTargetDataSourceId(trim(dto.getTargetDataSourceId()));
        dto.setTableNamingStrategy(trim(dto.getTableNamingStrategy()));
        dto.setTableNamePrefix(trim(dto.getTableNamePrefix()));
        dto.setTableNameSuffix(trim(dto.getTableNameSuffix()));
    }
}
