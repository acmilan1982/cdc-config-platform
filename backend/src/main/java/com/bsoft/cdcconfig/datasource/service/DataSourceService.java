package com.bsoft.cdcconfig.datasource.service;

import com.bsoft.cdcconfig.common.api.ApiResponse;
import com.bsoft.cdcconfig.common.page.PageResult;
import com.bsoft.cdcconfig.datasource.dto.DataSourceCreateDTO;
import com.bsoft.cdcconfig.datasource.dto.DataSourceUpdateDTO;
import com.bsoft.cdcconfig.datasource.query.DataSourceQuery;
import com.bsoft.cdcconfig.datasource.vo.DataSourceDetailVO;
import com.bsoft.cdcconfig.datasource.vo.DataSourceListVO;

public interface DataSourceService {

    PageResult<DataSourceListVO> queryPage(DataSourceQuery query);

    DataSourceDetailVO getDetail(String dataSourceId);

    void create(DataSourceCreateDTO dto);

    void update(String originalDataSourceId, DataSourceUpdateDTO dto);

    void delete(String dataSourceId);

    void enable(String dataSourceId);

    void disable(String dataSourceId);
}
