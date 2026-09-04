package com.bsoft.cdcconfig.clientconfig.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.bsoft.cdcconfig.clientconfig.entity.CdcClientConfig;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 探针端管理 Feature 自己的 Mapper。列表关键词使用绑定参数 + ESCAPE '\' 的字面量包含匹配，
 * 全程绑定参数，无字符串插值、无用户输入拼接（CCFG-DB-008 / CCFG-DB-021）。
 */
@Mapper
public interface CdcClientConfigMapper extends BaseMapper<CdcClientConfig> {

    /**
     * 条件读取：keyword 非空时对 CLIENT_ID/CLIENT_DESC 做不区分大小写字面量包含；
     * status 为 ENABLED/DISABLED 时精确匹配 FG_ACTIVE；均缺省时读全表。固定按 CLIENT_ID DESC。
     * pattern 由应用层对 Trim 后关键词小写化并转义 %/_/\ 后包裹为 %..% 传入。
     */
    @Select("<script>"
            + "SELECT CLIENT_ID, CLIENT_DESC, DATA_SOURCE_ID, FG_ACTIVE FROM CDC_CLIENT_MULTIPLE"
            + "<where>"
            + "<if test='keyword != null'>"
            + " AND (LOWER(CLIENT_ID) LIKE #{pattern} ESCAPE '\\' OR LOWER(CLIENT_DESC) LIKE #{pattern} ESCAPE '\\')"
            + "</if>"
            + "<if test='status == \"ENABLED\"'> AND FG_ACTIVE = '1'</if>"
            + "<if test='status == \"DISABLED\"'> AND FG_ACTIVE = '0'</if>"
            + "</where>"
            + " ORDER BY CLIENT_ID DESC"
            + "</script>")
    List<CdcClientConfig> selectByKeywordAndStatus(@Param("keyword") String keyword,
                                                   @Param("pattern") String pattern,
                                                   @Param("status") String status);

    /**
     * 写前全量重读（新增/编辑/启用：目标 DML 前在同一普通短事务内读取全部记录做当次检查）。
     */
    @Select("SELECT CLIENT_ID, CLIENT_DESC, DATA_SOURCE_ID, FG_ACTIVE"
            + " FROM CDC_CLIENT_MULTIPLE ORDER BY CLIENT_ID")
    List<CdcClientConfig> selectFullScan();
}
