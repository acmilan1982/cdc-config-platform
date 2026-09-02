package com.bsoft.cdcconfig.monitor.topicoffset.mapper;

import com.bsoft.cdcconfig.monitor.topicoffset.model.TopicOffsetRow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * CDC_TOPIC_OFFSET 只读 Mapper（不继承 BaseMapper，仅注解 @Select，DESIGN §5.2）。
 * 固定排序 KAFKA_TOPIC ASC, SERVER_ID ASC；NEXT_OFFSET/UPDATED_AT 由 Oracle TO_CHAR 确定性字符串化。
 */
@Mapper
public interface TopicOffsetMapper {

    @Select("SELECT SERVER_ID AS serverId, KAFKA_TOPIC AS kafkaTopic, "
            + "TO_CHAR(NEXT_OFFSET, 'FM99999999999999999990', 'NLS_NUMERIC_CHARACTERS=''.,''') AS nextOffsetStr, "
            + "TO_CHAR(UPDATED_AT, 'YYYY-MM-DD HH24:MI:SS') AS updatedAtStr "
            + "FROM CDC.CDC_TOPIC_OFFSET "
            + "ORDER BY KAFKA_TOPIC ASC, SERVER_ID ASC")
    List<TopicOffsetRow> selectAll();
}
