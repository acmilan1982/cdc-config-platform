package com.bsoft.cdcconfig.datasource.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.bsoft.cdcconfig.common.page.PageResult;
import com.bsoft.cdcconfig.datasource.converter.DataSourceConverter;
import com.bsoft.cdcconfig.datasource.dto.DataSourceCreateDTO;
import com.bsoft.cdcconfig.datasource.dto.DataSourceExtendDTO;
import com.bsoft.cdcconfig.datasource.dto.DataSourceUpdateDTO;
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
import com.bsoft.cdcconfig.datasource.vo.DataSourceDetailVO;
import com.bsoft.cdcconfig.datasource.vo.DataSourceListVO;
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
    private final DataSourceExtendMapper extendMapper;

    public DataSourceServiceImpl(DataSourceMapper dataSourceMapper, DataSourceExtendMapper extendMapper) {
        this.dataSourceMapper = dataSourceMapper;
        this.extendMapper = extendMapper;
    }

    private DataSourceExtend findExtend(String dataSourceId) {
        List<DataSourceExtend> list = extendMapper.selectList(
                new LambdaQueryWrapper<DataSourceExtend>()
                        .eq(DataSourceExtend::getDataSourceId, dataSourceId)
                        .last("AND ROWNUM = 1"));
        return list.isEmpty() ? null : list.get(0);
    }

    @Override
    public PageResult<DataSourceListVO> queryPage(DataSourceQuery query) {
        LambdaQueryWrapper<DataSource> wrapper = new LambdaQueryWrapper<>();

        String dsId = query.getDataSourceId();
        if (StringUtils.hasText(dsId)) {
            wrapper.eq(DataSource::getDataSourceId, dsId);
        }

        String dsName = query.getDataSourceName();
        if (StringUtils.hasText(dsName)) {
            wrapper.like(DataSource::getDataSourceName, dsName);
        }

        wrapper.orderByAsc(DataSource::getDataSourceId);

        Page<DataSource> page = new Page<>(query.getPageNum(), query.getPageSize());
        Page<DataSource> result = dataSourceMapper.selectPage(page, wrapper);

        List<DataSourceListVO> voList = new ArrayList<>();
        for (DataSource ds : result.getRecords()) {
            DataSourceExtend extend = findExtend(ds.getDataSourceId());
            voList.add(DataSourceConverter.toListVO(ds, extend));
        }

        return new PageResult<>(voList, result.getTotal(), result.getCurrent(), result.getSize());
    }

    @Override
    public DataSourceDetailVO getDetail(String dataSourceId) {
        DataSource ds = dataSourceMapper.selectById(dataSourceId);
        if (ds == null) {
            throw DataSourceErrorCode.notFound(dataSourceId);
        }

        DataSourceExtend extend = findExtend(dataSourceId);

        return DataSourceConverter.toDetailVO(ds, extend);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void create(DataSourceCreateDTO dto) {
        // uniqueness
        DataSource existing = dataSourceMapper.selectById(dto.getDataSourceId());
        if (existing != null) {
            throw DataSourceErrorCode.idDuplicate(dto.getDataSourceId());
        }

        DataSource nameDup = dataSourceMapper.selectOne(
                new LambdaQueryWrapper<DataSource>()
                        .eq(DataSource::getDataSourceName, dto.getDataSourceName()));
        if (nameDup != null) {
            throw DataSourceErrorCode.nameDuplicate(dto.getDataSourceName());
        }

        // validate enums
        if (!DataSourceCategoryEnum.isValid(dto.getDataSourceCategory())) {
            throw DataSourceErrorCode.invalidCategory();
        }
        if (!DataSourceTypeEnum.isValid(dto.getDataSourceType())) {
            throw DataSourceErrorCode.invalidType();
        }

        // validate extend
        DataSourceExtendDTO extDto = dto.getExtend();
        if (extDto == null) {
            throw DataSourceErrorCode.extendRequired();
        }
        if (!TableNamingStrategyEnum.isValid(extDto.getTableNamingStrategy())) {
            throw DataSourceErrorCode.invalidNamingStrategy();
        }

        // save main
        DataSource ds = DataSourceConverter.toEntity(dto);
        int rows = dataSourceMapper.insert(ds);
        if (rows != 1) {
            throw new RuntimeException("新增数据源失败");
        }

        // save extend
        DataSourceExtend extend = DataSourceConverter.toExtendEntity(dto.getDataSourceId(), extDto);
        int extRows = extendMapper.insert(extend);
        if (extRows != 1) {
            throw new RuntimeException("新增扩展配置失败");
        }

        log.info("Created data source: {}", dto.getDataSourceId());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(String originalId, DataSourceUpdateDTO dto) {
        DataSource ds = dataSourceMapper.selectById(originalId);
        if (ds == null) {
            throw DataSourceErrorCode.notFound(originalId);
        }

        String newId = dto.getDataSourceId();
        boolean idChanged = StringUtils.hasText(newId) && !newId.equals(originalId);

        if (idChanged) {
            DataSource dup = dataSourceMapper.selectById(newId);
            if (dup != null) {
                throw DataSourceErrorCode.idDuplicate(newId);
            }
        }

        // name uniqueness
        DataSource nameDup = dataSourceMapper.selectOne(
                new LambdaQueryWrapper<DataSource>()
                        .eq(DataSource::getDataSourceName, dto.getDataSourceName())
                        .ne(DataSource::getDataSourceId, originalId));
        if (nameDup != null) {
            throw DataSourceErrorCode.nameDuplicate(dto.getDataSourceName());
        }

        // validate enums
        if (!DataSourceCategoryEnum.isValid(dto.getDataSourceCategory())) {
            throw DataSourceErrorCode.invalidCategory();
        }
        if (!DataSourceTypeEnum.isValid(dto.getDataSourceType())) {
            throw DataSourceErrorCode.invalidType();
        }

        // validate extend
        DataSourceExtendDTO extDto = dto.getExtend();
        if (extDto == null) {
            throw DataSourceErrorCode.extendRequired();
        }
        if (!TableNamingStrategyEnum.isValid(extDto.getTableNamingStrategy())) {
            throw DataSourceErrorCode.invalidNamingStrategy();
        }

        // ---- extend table ----
        DataSourceExtend extend = findExtend(originalId);

        if (extend != null) {
            DataSourceConverter.mergeToExtendEntity(extend, extDto);
            extend.setDataSourceId(idChanged ? newId : originalId);
            LambdaUpdateWrapper<DataSourceExtend> extWrapper = new LambdaUpdateWrapper<>();
            extWrapper.eq(DataSourceExtend::getDataSourceId, originalId);
            extendMapper.update(extend, extWrapper);
        } else {
            // historical data missing extend — insert
            extend = DataSourceConverter.toExtendEntity(
                    idChanged ? newId : originalId, extDto);
            extendMapper.insert(extend);
        }

        // ---- main table ----
        DataSourceConverter.mergeToEntity(ds, dto);
        LambdaUpdateWrapper<DataSource> mainWrapper = new LambdaUpdateWrapper<>();
        mainWrapper.eq(DataSource::getDataSourceId, originalId);
        dataSourceMapper.update(ds, mainWrapper);

        log.info("Updated data source: {} -> {}", originalId, idChanged ? newId : originalId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(String dataSourceId) {
        DataSource ds = dataSourceMapper.selectById(dataSourceId);
        if (ds == null) {
            throw DataSourceErrorCode.notFound(dataSourceId);
        }

        // delete extend first
        LambdaQueryWrapper<DataSourceExtend> extWrapper = new LambdaQueryWrapper<>();
        extWrapper.eq(DataSourceExtend::getDataSourceId, dataSourceId);
        extendMapper.delete(extWrapper);

        // delete main
        dataSourceMapper.deleteById(dataSourceId);

        log.info("Deleted data source: {}", dataSourceId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void enable(String dataSourceId) {
        DataSource ds = dataSourceMapper.selectById(dataSourceId);
        if (ds == null) {
            throw DataSourceErrorCode.notFound(dataSourceId);
        }

        LambdaUpdateWrapper<DataSource> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(DataSource::getDataSourceId, dataSourceId);
        wrapper.set(DataSource::getFgActive, "1");
        dataSourceMapper.update(null, wrapper);

        log.info("Enabled data source: {}", dataSourceId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void disable(String dataSourceId) {
        DataSource ds = dataSourceMapper.selectById(dataSourceId);
        if (ds == null) {
            throw DataSourceErrorCode.notFound(dataSourceId);
        }

        LambdaUpdateWrapper<DataSource> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(DataSource::getDataSourceId, dataSourceId);
        wrapper.set(DataSource::getFgActive, "0");
        dataSourceMapper.update(null, wrapper);

        log.info("Disabled data source: {}", dataSourceId);
    }
}
