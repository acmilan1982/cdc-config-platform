package com.bsoft.cdcconfig.logquery.config;

import com.bsoft.cdcconfig.logquery.cursor.LogCursorBoundary;
import com.bsoft.cdcconfig.logquery.cursor.LogCursorCodec;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * R1-05 密钥配置行为（LQ-API-52 / DESIGN §7.1）：
 * 外部 Spring 属性绑定、非空可用、空白 fail-closed 且无默认密钥、
 * 同值重启等价、@Lazy 下仅扫描/注入代理不误用默认密钥、实际调用才 fail-closed。
 * enabled 开关（LQ-API-170）：默认 false、外部配置绑定、fail-closed。
 */
class LogQueryConfigTest {

    private static final DateTimeFormatter TIME_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private static final String SECRET = "r1-test-secret-value";
    private static final String LOG_TYPE = "error";
    private static final String FINGERPRINT = "fp";
    private static final LocalDateTime TARGET_TIME =
            LocalDateTime.parse("2026-08-20 10:00:00", TIME_FORMAT);
    private static final BigDecimal CDC_LOG_ID = new BigDecimal("1");

    private final ApplicationContextRunner contextRunner =
            new ApplicationContextRunner()
                    .withUserConfiguration(LogQueryConfig.class, ConfigBinding.class, LazyConsumerConfig.class);

    @EnableConfigurationProperties(LogQueryProperties.class)
    static class ConfigBinding {
    }

    /**
     * 模拟 LogQueryServiceImpl 的 @Lazy 构造器注入：仅注入代理，不触发实例化。
     */
    @Configuration
    static class LazyConsumerConfig {
        @Bean
        LazyConsumer lazyConsumer(@Lazy LogCursorCodec codec) {
            return new LazyConsumer(codec);
        }
    }

    static class LazyConsumer {
        private final LogCursorCodec codec;

        LazyConsumer(LogCursorCodec codec) {
            this.codec = codec;
        }

        String use() {
            return codec.encode(LOG_TYPE, FINGERPRINT, TARGET_TIME, CDC_LOG_ID);
        }
    }

    @Test
    void property_bindsCursorSecretFromExternalConfig() {
        contextRunner.withPropertyValues("cdc.log-query.cursor-secret=" + SECRET)
                .run(context -> {
                    LogQueryProperties props = context.getBean(LogQueryProperties.class);
                    assertThat(props.getCursorSecret()).isEqualTo(SECRET);
                });
    }

    @Test
    void nonEmptySecret_createsCodec_thatEncodesAndDecodes() {
        contextRunner.withPropertyValues("cdc.log-query.cursor-secret=" + SECRET)
                .run(context -> {
                    LogCursorCodec codec = context.getBean(LogCursorCodec.class);
                    String cursor = codec.encode(LOG_TYPE, FINGERPRINT, TARGET_TIME, CDC_LOG_ID);
                    LogCursorBoundary b = codec.decodeAndVerify(cursor, LOG_TYPE, FINGERPRINT);
                    assertThat(b.getTargetTime()).isEqualTo(TARGET_TIME);
                    assertThat(b.getCdcLogId()).isEqualByComparingTo(CDC_LOG_ID);
                });
    }

    @Test
    void blankSecret_failsClosed_noDefaultKey() {
        contextRunner.withPropertyValues("cdc.log-query.cursor-secret=")
                .run(context -> {
                    assertThat(context).hasSingleBean(LogCursorCodec.class);
                    assertThatThrownBy(() -> context.getBean(LogCursorCodec.class))
                            .isInstanceOf(BeanCreationException.class)
                            .hasRootCauseInstanceOf(IllegalStateException.class);
                });
        contextRunner.withPropertyValues("cdc.log-query.cursor-secret=   ")
                .run(context -> {
                    assertThatThrownBy(() -> context.getBean(LogCursorCodec.class))
                            .isInstanceOf(BeanCreationException.class)
                            .hasRootCauseInstanceOf(IllegalStateException.class);
                });
    }

    @Test
    void noSecretProperty_lazyProxyScansAndInjects_codecFailsClosedOnUse() {
        contextRunner.run(context -> {
            // @Lazy：未实际使用游标时，仅扫描 + 注入代理不因密钥缺失而失败
            assertThat(context).hasSingleBean(LogCursorCodec.class);
            assertThat(context.getBean(LazyConsumer.class)).isNotNull();
            // 一旦真正调用游标编码，缺失密钥必须 fail-closed（不能生成无签名/默认签名游标）
            assertThatThrownBy(() -> context.getBean(LazyConsumer.class).use())
                    .isInstanceOf(BeanCreationException.class)
                    .hasRootCauseInstanceOf(IllegalStateException.class);
        });
    }

    @Test
    void enabled_unset_defaultsToFalse() {
        contextRunner.run(context -> {
            LogQueryProperties props = context.getBean(LogQueryProperties.class);
            assertThat(props.isEnabled()).isFalse();
        });
    }

    @Test
    void enabled_true_bindsTrue() {
        contextRunner.withPropertyValues("cdc.log-query.enabled=true")
                .run(context -> {
                    LogQueryProperties props = context.getBean(LogQueryProperties.class);
                    assertThat(props.isEnabled()).isTrue();
                });
    }

    @Test
    void enabled_false_bindsFalse() {
        contextRunner.withPropertyValues("cdc.log-query.enabled=false")
                .run(context -> {
                    LogQueryProperties props = context.getBean(LogQueryProperties.class);
                    assertThat(props.isEnabled()).isFalse();
                });
    }

    @Test
    void sameSecretValue_newCodecVerifiesOldCursor() {
        contextRunner.withPropertyValues("cdc.log-query.cursor-secret=" + SECRET)
                .run(context -> {
                    LogCursorCodec codecA = context.getBean(LogCursorCodec.class);
                    String cursor = codecA.encode(LOG_TYPE, FINGERPRINT, TARGET_TIME, CDC_LOG_ID);
                    new ApplicationContextRunner()
                            .withUserConfiguration(LogQueryConfig.class, ConfigBinding.class, LazyConsumerConfig.class)
                            .withPropertyValues("cdc.log-query.cursor-secret=" + SECRET)
                            .run(context2 -> {
                                LogCursorCodec codecB = context2.getBean(LogCursorCodec.class);
                                LogCursorBoundary b = codecB.decodeAndVerify(cursor, LOG_TYPE, FINGERPRINT);
                                assertThat(b.getCdcLogId()).isEqualByComparingTo(CDC_LOG_ID);
                            });
                });
    }
}
