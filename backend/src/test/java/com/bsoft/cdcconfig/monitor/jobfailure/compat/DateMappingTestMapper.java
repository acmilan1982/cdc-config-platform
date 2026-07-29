package com.bsoft.cdcconfig.monitor.jobfailure.compat;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface DateMappingTestMapper extends BaseMapper<DateMappingTestEntity> {

    @Select("SELECT * FROM CDC_JOB_FAILURE_EVENT WHERE ROWNUM = 1")
    DateMappingTestEntity selectFirstEvent();
}
