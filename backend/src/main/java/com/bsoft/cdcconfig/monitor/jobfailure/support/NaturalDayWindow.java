package com.bsoft.cdcconfig.monitor.jobfailure.support;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;

/**
 * 故障历史自然日时间窗口（JFM-ADJ-273～276）。
 * 单次请求只确定一次 now/todayStart/last7DaysStart/last30DaysStart。
 * now 截断到秒，与 Oracle DATE（秒精度）比较时避免纳秒遗漏边界事件。
 * 业务时区沿用后端生效时区（Clock 注入，当前为 Clock.systemDefaultZone()）。
 */
public final class NaturalDayWindow {

    private final LocalDateTime now;
    private final LocalDateTime todayStart;
    private final LocalDateTime last7DaysStart;
    private final LocalDateTime last30DaysStart;

    private NaturalDayWindow(LocalDateTime now, LocalDateTime todayStart,
                             LocalDateTime last7DaysStart, LocalDateTime last30DaysStart) {
        this.now = now;
        this.todayStart = todayStart;
        this.last7DaysStart = last7DaysStart;
        this.last30DaysStart = last30DaysStart;
    }

    public static NaturalDayWindow of(Clock clock) {
        ZonedDateTime zdt = clock.instant().atZone(clock.getZone());
        LocalDate today = zdt.toLocalDate();
        LocalDateTime now = zdt.toLocalDateTime().truncatedTo(ChronoUnit.SECONDS);
        return new NaturalDayWindow(
                now,
                today.atStartOfDay(),
                today.minusDays(6).atStartOfDay(),
                today.minusDays(29).atStartOfDay());
    }

    /** 构造指定时区下的自然日窗口，供测试使用。 */
    public static NaturalDayWindow of(LocalDateTime now, ZoneId zone) {
        LocalDate today = now.toLocalDate();
        return new NaturalDayWindow(
                now.truncatedTo(ChronoUnit.SECONDS),
                today.atStartOfDay(),
                today.minusDays(6).atStartOfDay(),
                today.minusDays(29).atStartOfDay());
    }

    public LocalDateTime getNow() { return now; }
    public LocalDateTime getTodayStart() { return todayStart; }
    public LocalDateTime getLast7DaysStart() { return last7DaysStart; }
    public LocalDateTime getLast30DaysStart() { return last30DaysStart; }

    public boolean inToday(LocalDateTime firstFailureTime) {
        return inWindow(firstFailureTime, todayStart);
    }

    public boolean inLast7Days(LocalDateTime firstFailureTime) {
        return inWindow(firstFailureTime, last7DaysStart);
    }

    public boolean inLast30Days(LocalDateTime firstFailureTime) {
        return inWindow(firstFailureTime, last30DaysStart);
    }

    public boolean inWindow(LocalDateTime firstFailureTime, LocalDateTime start) {
        if (firstFailureTime == null) {
            return false;
        }
        return !firstFailureTime.isBefore(start) && !firstFailureTime.isAfter(now);
    }
}
