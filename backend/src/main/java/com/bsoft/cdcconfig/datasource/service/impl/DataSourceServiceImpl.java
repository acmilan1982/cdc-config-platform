package com.bsoft.cdcconfig.datasource.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.bsoft.cdcconfig.common.exception.BusinessException;
import com.bsoft.cdcconfig.datasource.connection.ConnectionTester;
import com.bsoft.cdcconfig.datasource.converter.DataSourceConverter;
import com.bsoft.cdcconfig.datasource.dto.BizAttrSaveDTO;
import com.bsoft.cdcconfig.datasource.dto.DataSourceCreateDTO;
import com.bsoft.cdcconfig.datasource.dto.DataSourceUpdateDTO;
import com.bsoft.cdcconfig.datasource.dto.TestConnectionDTO;
import com.bsoft.cdcconfig.datasource.entity.DataSource;
import com.bsoft.cdcconfig.datasource.enums.DataSourceCategoryEnum;
import com.bsoft.cdcconfig.datasource.enums.DataSourceTypeEnum;
import com.bsoft.cdcconfig.datasource.exception.DataSourceErrorCode;
import com.bsoft.cdcconfig.datasource.mapper.DataSourceMapper;
import com.bsoft.cdcconfig.datasource.query.DataSourceQuery;
import com.bsoft.cdcconfig.datasource.service.DataSourceService;
import com.bsoft.cdcconfig.datasource.vo.BizAttrVO;
import com.bsoft.cdcconfig.datasource.vo.DataSourceDetailVO;
import com.bsoft.cdcconfig.datasource.vo.DataSourceListVO;
import com.bsoft.cdcconfig.datasource.vo.TargetOptionVO;
import com.bsoft.cdcconfig.datasource.vo.TestConnectionResultVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

@Service
public class DataSourceServiceImpl implements DataSourceService {

    private static final Logger log = LoggerFactory.getLogger(DataSourceServiceImpl.class);

    private final DataSourceMapper dataSourceMapper;
    private final ConnectionTester connectionTester;

    public DataSourceServiceImpl(DataSourceMapper dataSourceMapper,
                                 ConnectionTester connectionTester) {
        this.dataSourceMapper = dataSourceMapper;
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
        String submittedId = dto.getDataSourceId();
        if (!StringUtils.hasText(submittedId)) {
            throw new BusinessException(400, "数据源ID不能为空");
        }
        String name = dto.getDataSourceName();
        String category = dto.getDataSourceCategory();
        String type = dto.getDataSourceType();

        // 是否修改 ID 按原始字符串精确比较：DS01 -> ds01 视为允许的大小写修改
        String effectiveId = originalId;
        if (!submittedId.equals(originalId)) {
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
                // 跨字段缺失属于参数校验错误，按 HTTP 400 / code=400，不伪造 40002
                throw new BusinessException(400, "密码为空时必须提供原数据源ID");
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

    /** 名称忽略大小写唯一性检查覆盖表中全部记录，不限制 FG_ACTIVE='1'。 */
    private void assertNameUnavailable(String name, String excludeDataSourceId) {
        LambdaQueryWrapper<DataSource> wrapper = new LambdaQueryWrapper<>();
        wrapper.apply("UPPER(DATA_SOURCE_NAME) = UPPER({0})", name);
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
}
