package com.bsoft.cdcconfig.subscription.exception;

import com.bsoft.cdcconfig.common.exception.BusinessException;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 25 个业务错误码编号唯一性、数量与关键工厂方法（API.md §7）。
 */
class SubscriptionErrorCodeTest {

    @Test
    void shouldHaveExactly25DistinctCodeConstants() throws Exception {
        Field[] fields = SubscriptionErrorCode.class.getDeclaredFields();
        int count = 0;
        Set<Integer> values = new HashSet<>();
        for (Field field : fields) {
            int mods = field.getModifiers();
            if (Modifier.isStatic(mods) && Modifier.isFinal(mods) && field.getType() == int.class) {
                count++;
                values.add(field.getInt(null));
            }
        }
        assertEquals(25, count, "错误码常量数量必须为 25");
        assertEquals(25, values.size(), "错误码编号必须唯一");
    }

    @Test
    void shouldNotContainConcurrentModified40910() throws Exception {
        Field[] fields = SubscriptionErrorCode.class.getDeclaredFields();
        for (Field field : fields) {
            int mods = field.getModifiers();
            if (Modifier.isStatic(mods) && Modifier.isFinal(mods) && field.getType() == int.class) {
                int value = field.getInt(null);
                assertTrue(value != 40910, "不得残留已取消的 40910 CONCURRENT_MODIFIED 错误码");
            }
        }
    }

    @Test
    void keyCodesShouldHaveExpectedValues() {
        assertEquals(40300, SubscriptionErrorCode.SUBSCRIPTION_VALIDATION_FAILED);
        assertEquals(40310, SubscriptionErrorCode.DESC_EMPTY);
        assertEquals(40311, SubscriptionErrorCode.DESC_TOO_LONG);
        assertEquals(40312, SubscriptionErrorCode.SOURCE_REQUIRED);
        assertEquals(40313, SubscriptionErrorCode.TARGET_REQUIRED);
        assertEquals(40314, SubscriptionErrorCode.SOURCE_TABLE_REQUIRED);
        assertEquals(40315, SubscriptionErrorCode.INVALID_TABLE_FORMAT);
        assertEquals(40316, SubscriptionErrorCode.NAME_CONTAINS_COMMA_OR_DOT);
        assertEquals(40317, SubscriptionErrorCode.DUPLICATE_TABLE_WITHIN_RECORD);
        assertEquals(40318, SubscriptionErrorCode.DUPLICATE_TARGET_WITHIN_RECORD);
        assertEquals(40320, SubscriptionErrorCode.SOURCE_NOT_FOUND_OR_INACTIVE);
        assertEquals(40321, SubscriptionErrorCode.TARGET_NOT_FOUND_OR_INACTIVE);
        assertEquals(40322, SubscriptionErrorCode.SOURCE_CATEGORY_MISMATCH);
        assertEquals(40323, SubscriptionErrorCode.TARGET_CATEGORY_MISMATCH);
        assertEquals(40330, SubscriptionErrorCode.TABLE_NOT_FOUND_IN_SOURCE);
        assertEquals(40331, SubscriptionErrorCode.TABLE_NOT_ACCESSIBLE);
        assertEquals(40340, SubscriptionErrorCode.SOURCE_CONNECTION_FAILED);
        assertEquals(40341, SubscriptionErrorCode.SCHEMA_LOAD_FAILED);
        assertEquals(40350, SubscriptionErrorCode.ANOMALY_NOT_EDITABLE);
        assertEquals(40351, SubscriptionErrorCode.ANOMALY_NOT_DELETABLE);
        assertEquals(40352, SubscriptionErrorCode.ANOMALY_NOT_VIEWABLE);
        assertEquals(40353, SubscriptionErrorCode.ANOMALY_NOT_PREVIEWABLE);
        assertEquals(40430, SubscriptionErrorCode.SUBSCRIPTION_NOT_FOUND);
        assertEquals(50040, SubscriptionErrorCode.SAVE_FAILED);
        assertEquals(50041, SubscriptionErrorCode.DELETE_FAILED);
    }

    @Test
    void factoryMethodsShouldReturnCodeAndExactMessage() {
        assertBusiness(SubscriptionErrorCode.validationFailed(2), 40300, "存在 2 个校验失败项，请修正后重试");
        assertBusiness(SubscriptionErrorCode.descEmpty(), 40310, "订阅描述不能为空");
        assertBusiness(SubscriptionErrorCode.descTooLong(), 40311, "订阅描述超过 255 字符上限");
        assertBusiness(SubscriptionErrorCode.sourceRequired(), 40312, "必须且只能选择一个源库");
        assertBusiness(SubscriptionErrorCode.targetRequired(), 40313, "必须至少选择一个目标库");
        assertBusiness(SubscriptionErrorCode.sourceTableRequired(), 40314, "必须至少选择一张源表");
        assertBusiness(SubscriptionErrorCode.invalidTableFormat(), 40315, "源表输入结构或 Schema/表名格式非法");
        assertBusiness(SubscriptionErrorCode.nameContainsCommaOrDot(), 40316,
                "数据源ID、Schema名或表名不能包含英文逗号或组件内部英文句点");
        assertBusiness(SubscriptionErrorCode.duplicateTableWithinRecord(), 40317, "记录内存在重复源表");
        assertBusiness(SubscriptionErrorCode.duplicateTargetWithinRecord(), 40318, "记录内存在重复目标库");
        assertBusiness(SubscriptionErrorCode.sourceNotFoundOrInactive(), 40320, "源库不存在或已停用");
        assertBusiness(SubscriptionErrorCode.targetNotFoundOrInactive(), 40321, "目标库不存在或已停用");
        assertBusiness(SubscriptionErrorCode.sourceCategoryMismatch(), 40322, "源库类别不正确");
        assertBusiness(SubscriptionErrorCode.targetCategoryMismatch(), 40323, "目标库类别不正确");
        assertBusiness(SubscriptionErrorCode.tableNotFoundInSource(), 40330, "源表中存在当前源库不存在的表");
        assertBusiness(SubscriptionErrorCode.tableNotAccessible(), 40331, "源表中存在当前账号不可访问的表");
        assertBusiness(SubscriptionErrorCode.sourceConnectionFailed("连接超时"), 40340, "源库连接失败：连接超时");
        assertBusiness(SubscriptionErrorCode.schemaLoadFailed("无法连接"), 40341, "Schema/表加载失败：无法连接");
        assertBusiness(SubscriptionErrorCode.anomalyNotEditable(), 40350, "多源库异常记录不支持编辑");
        assertBusiness(SubscriptionErrorCode.anomalyNotDeletable(), 40351, "多源库异常记录不支持删除");
        assertBusiness(SubscriptionErrorCode.anomalyNotViewable(), 40352, "多源库异常记录不支持查看");
        assertBusiness(SubscriptionErrorCode.anomalyNotPreviewable(), 40353, "多源库异常记录不支持删除预览");
        assertBusiness(SubscriptionErrorCode.subscriptionNotFound(), 40430, "订阅记录不存在或已被删除");
        assertBusiness(SubscriptionErrorCode.saveFailed(), 50040, "保存失败");
        assertBusiness(SubscriptionErrorCode.deleteFailed(), 50041, "删除失败");
    }

    private static void assertBusiness(BusinessException e, int code, String message) {
        assertEquals(code, e.getCode());
        assertEquals(message, e.getMessage());
    }
}
