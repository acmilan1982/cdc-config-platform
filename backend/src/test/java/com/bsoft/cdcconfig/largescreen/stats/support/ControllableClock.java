package com.bsoft.cdcconfig.largescreen.stats.support;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Test-only clock that allows programmatic time advancement.
 * Used to verify V06 time-limit behavior without Thread.sleep(180000).
 */
public class ControllableClock extends Clock {

    private final ZoneId zone;
    private final AtomicLong millis;

    public ControllableClock(long initialMillis, ZoneId zone) {
        this.zone = zone;
        this.millis = new AtomicLong(initialMillis);
    }

    public void advance(long deltaMs) {
        millis.addAndGet(deltaMs);
    }

    public void set(long newMillis) {
        millis.set(newMillis);
    }

    @Override
    public ZoneId getZone() {
        return zone;
    }

    @Override
    public Clock withZone(ZoneId zone) {
        return new ControllableClock(millis.get(), zone);
    }

    @Override
    public Instant instant() {
        return Instant.ofEpochMilli(millis.get());
    }

    @Override
    public long millis() {
        return millis.get();
    }
}
