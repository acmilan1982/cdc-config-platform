package com.bsoft.cdcconfig.datasource.converter;

import com.bsoft.cdcconfig.datasource.dto.DataSourceCreateDTO;
import com.bsoft.cdcconfig.datasource.entity.DataSource;
import com.bsoft.cdcconfig.datasource.enums.DataSourceCategoryEnum;
import com.bsoft.cdcconfig.datasource.vo.DataSourceDetailVO;
import com.bsoft.cdcconfig.datasource.vo.DataSourceListVO;
import com.bsoft.cdcconfig.datasource.vo.TargetOptionVO;
import org.springframework.util.StringUtils;

public class DataSourceConverter {

    private DataSourceConverter() {
    }

    public static DataSourceListVO toListVO(DataSource ds) {
        if (ds == null) return null;
        DataSourceListVO vo = new DataSourceListVO();
        vo.setDataSourceId(ds.getDataSourceId());
        vo.setDataSourceName(ds.getDataSourceName());
        vo.setDataSourceCategory(DataSourceCategoryEnum.normalize(ds.getDataSourceCategory()));
        vo.setDataSourceType(normalizeType(ds.getDataSourceType()));
        vo.setHost(ds.getDataSourceHost());
        vo.setPort(parsePort(ds.getDataSourcePort()));
        vo.setUserName(ds.getDataSourceUserName());
        vo.setServiceName(ds.getDataSourceServiceName());
        return vo;
    }

    public static DataSourceDetailVO toDetailVO(DataSource ds) {
        if (ds == null) return null;
        DataSourceDetailVO vo = new DataSourceDetailVO();
        vo.setDataSourceId(ds.getDataSourceId());
        vo.setDataSourceName(ds.getDataSourceName());
        vo.setDataSourceCategory(DataSourceCategoryEnum.normalize(ds.getDataSourceCategory()));
        vo.setDataSourceType(normalizeType(ds.getDataSourceType()));
        vo.setHost(ds.getDataSourceHost());
        vo.setPort(parsePort(ds.getDataSourcePort()));
        vo.setUserName(ds.getDataSourceUserName());
        vo.setServiceName(ds.getDataSourceServiceName());
        return vo;
    }

    public static TargetOptionVO toTargetOptionVO(DataSource ds) {
        if (ds == null) return null;
        TargetOptionVO vo = new TargetOptionVO();
        vo.setDataSourceId(ds.getDataSourceId());
        vo.setDataSourceName(ds.getDataSourceName());
        vo.setDataSourceType(normalizeType(ds.getDataSourceType()));
        return vo;
    }

    public static DataSource toEntity(DataSourceCreateDTO dto, String dataSourceOrg, String fgActive) {
        if (dto == null) return null;
        DataSource ds = new DataSource();
        ds.setDataSourceId(dto.getDataSourceId());
        ds.setDataSourceName(dto.getDataSourceName());
        ds.setDataSourceCategory(DataSourceCategoryEnum.normalize(dto.getDataSourceCategory()));
        ds.setDataSourceType(normalizeType(dto.getDataSourceType()));
        ds.setDataSourceHost(dto.getHost());
        ds.setDataSourcePort(dto.getPort() == null ? null : String.valueOf(dto.getPort()));
        ds.setDataSourceUserName(dto.getUserName());
        ds.setDataSourcePassword(dto.getPassword());
        ds.setDataSourceServiceName(dto.getServiceName());
        ds.setDataSourceOrg(dataSourceOrg);
        ds.setFgActive(fgActive);
        return ds;
    }

    public static Integer parsePort(String raw) {
        if (!StringUtils.hasText(raw)) return null;
        try {
            return Integer.parseInt(raw.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public static String normalizeType(String raw) {
        return raw == null ? null : raw.toUpperCase();
    }
}
