package com.bsoft.cdcconfig.datasource.service;

import com.bsoft.cdcconfig.datasource.dto.BizAttrSaveDTO;
import com.bsoft.cdcconfig.datasource.dto.DataSourceCreateDTO;
import com.bsoft.cdcconfig.datasource.dto.DataSourceUpdateDTO;
import com.bsoft.cdcconfig.datasource.dto.NamingStrategyDTO;
import com.bsoft.cdcconfig.datasource.dto.TestConnectionDTO;
import com.bsoft.cdcconfig.datasource.query.DataSourceQuery;
import com.bsoft.cdcconfig.datasource.vo.BizAttrVO;
import com.bsoft.cdcconfig.datasource.vo.DataSourceDetailVO;
import com.bsoft.cdcconfig.datasource.vo.DataSourceListVO;
import com.bsoft.cdcconfig.datasource.vo.NamingStrategyVO;
import com.bsoft.cdcconfig.datasource.vo.TargetOptionVO;
import com.bsoft.cdcconfig.datasource.vo.TestConnectionResultVO;

import java.util.List;

public interface DataSourceService {

    List<DataSourceListVO> list(DataSourceQuery query);

    DataSourceDetailVO getDetail(String dataSourceId);

    String create(DataSourceCreateDTO dto);

    String update(String originalDataSourceId, DataSourceUpdateDTO dto);

    void delete(String dataSourceId);

    TestConnectionResultVO testConnection(TestConnectionDTO dto);

    List<TargetOptionVO> targetOptions();

    BizAttrVO getBizAttr(String dataSourceId);

    void saveBizAttr(String dataSourceId, BizAttrSaveDTO dto);

    List<NamingStrategyVO> listNamingStrategies(String sourceId);

    void createNamingStrategy(String sourceId, NamingStrategyDTO dto);

    void updateNamingStrategy(String sourceId, String originalTargetId, NamingStrategyDTO dto);

    void deleteNamingStrategy(String sourceId, String targetId);
}
