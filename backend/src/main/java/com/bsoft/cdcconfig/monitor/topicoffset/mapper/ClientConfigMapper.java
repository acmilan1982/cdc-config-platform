package com.bsoft.cdcconfig.monitor.topicoffset.mapper;

import com.bsoft.cdcconfig.monitor.topicoffset.model.ClientConfigRow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * CDC_CLIENT_MULTIPLE 只读 Mapper：显式列投影（CLIENT_ID/CLIENT_DESC/FG_ACTIVE），读取全部行（含停用）。
 */
@Mapper
public interface ClientConfigMapper {

    @Select("SELECT CLIENT_ID AS clientId, CLIENT_DESC AS clientDesc, FG_ACTIVE AS fgActive "
            + "FROM CDC_CLIENT_MULTIPLE")
    List<ClientConfigRow> selectAll();
}
