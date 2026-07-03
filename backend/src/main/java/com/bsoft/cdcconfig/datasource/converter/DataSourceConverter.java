package com.bsoft.cdcconfig.datasource.converter;

import com.bsoft.cdcconfig.datasource.dto.DataSourceCreateDTO;
import com.bsoft.cdcconfig.datasource.dto.DataSourceExtendDTO;
import com.bsoft.cdcconfig.datasource.dto.DataSourceUpdateDTO;
import com.bsoft.cdcconfig.datasource.entity.DataSource;
import com.bsoft.cdcconfig.datasource.entity.DataSourceExtend;
import com.bsoft.cdcconfig.datasource.enums.DataSourceCategoryEnum;
import com.bsoft.cdcconfig.datasource.vo.DataSourceDetailVO;
import com.bsoft.cdcconfig.datasource.vo.DataSourceExtendVO;
import com.bsoft.cdcconfig.datasource.vo.DataSourceListVO;

public class DataSourceConverter {

    public static DataSourceListVO toListVO(DataSource ds, DataSourceExtend extend) {
        if (ds == null) return null;
        DataSourceListVO vo = new DataSourceListVO();
        vo.setDataSourceId(ds.getDataSourceId());
        vo.setDataSourceName(ds.getDataSourceName());
        vo.setDataSourceCategory(ds.getDataSourceCategory());
        vo.setDataSourceType(ds.getDataSourceType());
        vo.setDataSourceOrg(ds.getDataSourceOrg());
        vo.setDataSourceHost(ds.getDataSourceHost());
        vo.setDataSourcePort(ds.getDataSourcePort());
        vo.setDataSourceUserName(ds.getDataSourceUserName());
        vo.setDataSourceServiceName(ds.getDataSourceServiceName());
        vo.setFgActive(ds.getFgActive());
        vo.setExtendConfigured(extend != null);
        return vo;
    }

    public static DataSourceDetailVO toDetailVO(DataSource ds, DataSourceExtend extend) {
        if (ds == null) return null;
        DataSourceDetailVO vo = new DataSourceDetailVO();
        vo.setDataSourceId(ds.getDataSourceId());
        vo.setDataSourceName(ds.getDataSourceName());
        vo.setDataSourceCategory(ds.getDataSourceCategory());
        vo.setDataSourceType(ds.getDataSourceType());
        vo.setDataSourceOrg(ds.getDataSourceOrg());
        vo.setDataSourceHost(ds.getDataSourceHost());
        vo.setDataSourcePort(ds.getDataSourcePort());
        vo.setDataSourceUserName(ds.getDataSourceUserName());
        vo.setDataSourceServiceName(ds.getDataSourceServiceName());
        vo.setFgActive(ds.getFgActive());
        vo.setSourceApp(ds.getSourceApp());
        vo.setDataSourceBizAttr(ds.getDataSourceBizAttr());

        if (extend != null) {
            vo.setExtendExists(true);
            DataSourceExtendVO extendVO = new DataSourceExtendVO();
            extendVO.setTableNamingStrategy(extend.getTableNamingStrategy());
            extendVO.setTableNamePrefix(extend.getTableNamePrefix());
            extendVO.setTableNameSuffix(extend.getTableNameSuffix());
            vo.setExtend(extendVO);
        } else {
            vo.setExtendExists(false);
            vo.setExtend(null);
        }
        return vo;
    }

    public static DataSource toEntity(DataSourceCreateDTO dto) {
        if (dto == null) return null;
        DataSource ds = new DataSource();
        ds.setDataSourceId(dto.getDataSourceId());
        ds.setDataSourceName(dto.getDataSourceName());
        ds.setDataSourceCategory(DataSourceCategoryEnum.normalize(dto.getDataSourceCategory()));
        ds.setDataSourceType(dto.getDataSourceType().toUpperCase());
        ds.setDataSourceOrg(dto.getDataSourceOrg());
        ds.setDataSourceHost(dto.getDataSourceHost());
        ds.setDataSourcePort(dto.getDataSourcePort());
        ds.setDataSourceUserName(dto.getDataSourceUserName());
        ds.setDataSourcePassword(dto.getDataSourcePassword());
        ds.setDataSourceServiceName(dto.getDataSourceServiceName());
        ds.setSourceApp(dto.getSourceApp());
        ds.setDataSourceBizAttr(dto.getDataSourceBizAttr());
        ds.setFgActive("1");
        return ds;
    }

    public static DataSourceExtend toExtendEntity(String dataSourceId, DataSourceExtendDTO dto) {
        if (dto == null) return null;
        DataSourceExtend extend = new DataSourceExtend();
        extend.setDataSourceId(dataSourceId);
        extend.setTableNamingStrategy(dto.getTableNamingStrategy());
        extend.setTableNamePrefix(dto.getTableNamePrefix());
        extend.setTableNameSuffix(dto.getTableNameSuffix());
        return extend;
    }

    public static void mergeToEntity(DataSource ds, DataSourceUpdateDTO dto) {
        if (dto.getDataSourceId() != null && !dto.getDataSourceId().isEmpty()) {
            ds.setDataSourceId(dto.getDataSourceId());
        }
        ds.setDataSourceName(dto.getDataSourceName());
        ds.setDataSourceCategory(DataSourceCategoryEnum.normalize(dto.getDataSourceCategory()));
        ds.setDataSourceType(dto.getDataSourceType().toUpperCase());
        ds.setDataSourceOrg(dto.getDataSourceOrg());
        ds.setDataSourceHost(dto.getDataSourceHost());
        ds.setDataSourcePort(dto.getDataSourcePort());
        ds.setDataSourceUserName(dto.getDataSourceUserName());
        ds.setDataSourceServiceName(dto.getDataSourceServiceName());
        ds.setSourceApp(dto.getSourceApp());
        ds.setDataSourceBizAttr(dto.getDataSourceBizAttr());
        if (dto.getDataSourcePassword() != null && !dto.getDataSourcePassword().isEmpty()) {
            ds.setDataSourcePassword(dto.getDataSourcePassword());
        }
    }

    public static void mergeToExtendEntity(DataSourceExtend extend, DataSourceExtendDTO dto) {
        extend.setTableNamingStrategy(dto.getTableNamingStrategy());
        extend.setTableNamePrefix(dto.getTableNamePrefix());
        extend.setTableNameSuffix(dto.getTableNameSuffix());
    }
}
