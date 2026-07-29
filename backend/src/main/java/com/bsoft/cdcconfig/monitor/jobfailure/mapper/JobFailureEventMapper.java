package com.bsoft.cdcconfig.monitor.jobfailure.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.bsoft.cdcconfig.monitor.jobfailure.entity.JobFailureEvent;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface JobFailureEventMapper extends BaseMapper<JobFailureEvent> {
}
