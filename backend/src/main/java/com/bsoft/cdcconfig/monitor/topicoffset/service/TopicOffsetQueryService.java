package com.bsoft.cdcconfig.monitor.topicoffset.service;

import com.bsoft.cdcconfig.monitor.topicoffset.query.TopicOffsetQuery;
import com.bsoft.cdcconfig.monitor.topicoffset.vo.CandidateGroupVO;
import com.bsoft.cdcconfig.monitor.topicoffset.vo.TopicOffsetPageVO;

/**
 * 数据同步进度只读查询服务。仅两个只读 GET 语义，无任何写方法面。
 */
public interface TopicOffsetQueryService {

    TopicOffsetPageVO queryOffsets(TopicOffsetQuery query);

    CandidateGroupVO queryCandidates();
}
