package com.bsoft.cdcconfig.largescreen.stats.lifecycle;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.bsoft.cdcconfig.largescreen.stats.config.StatsTaskConfig;
import com.bsoft.cdcconfig.largescreen.stats.entity.StatsTaskConfigEntity;
import com.bsoft.cdcconfig.largescreen.stats.mapper.StatsTaskConfigMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StatsTaskConfigLoaderTest {

    @Mock
    private StatsTaskConfigMapper configMapper;

    private StatsTaskConfigLoader loader;

    @BeforeEach
    void setUp() {
        loader = new StatsTaskConfigLoader(configMapper);
    }

    private StatsTaskConfigEntity createValidEntity() {
        StatsTaskConfigEntity e = new StatsTaskConfigEntity();
        e.setTaskCode("LARGE_SCREEN_STATS");
        e.setTaskName("Test");
        e.setEnabled(1);
        e.setStartupDelayMinutes(10);
        e.setScheduleIntervalMinutes(60);
        e.setSafetyDelayMinutes(30);
        e.setBatchSize(200000);
        e.setMaxBatchesPerRun(10);
        e.setMaxRunDurationSeconds(900);
        return e;
    }

    @Test
    void loadOnceCalledTwiceOnlyQueriesDbOnce() {
        when(configMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.singletonList(createValidEntity()));

        loader.loadOnce();
        loader.loadOnce();

        verify(configMapper, times(1)).selectList(any(LambdaQueryWrapper.class));
    }

    @Test
    void validConfigReturnsImmutableSnapshot() {
        when(configMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.singletonList(createValidEntity()));

        StatsTaskConfig config = loader.loadOnce();

        assertEquals("LARGE_SCREEN_STATS", config.getTaskCode());
        assertEquals(1, config.getEnabled());
        assertEquals(10, config.getStartupDelayMinutes());
        assertEquals(200000, config.getBatchSize());
        assertEquals(900, config.getMaxRunDurationSeconds());
        assertTrue(loader.isLoaded());
        assertFalse(loader.isFailed());
    }

    @Test
    void configNotFoundThrowsException() {
        when(configMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.emptyList());

        assertThrows(StatsConfigLoadException.class, () -> loader.loadOnce());
        assertFalse(loader.isLoaded());
        assertTrue(loader.isFailed());
    }

    @Test
    void multipleConfigRowsThrowsException() {
        when(configMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Arrays.asList(createValidEntity(), createValidEntity()));

        assertThrows(StatsConfigLoadException.class, () -> loader.loadOnce());
        assertTrue(loader.isFailed());
    }

    @Test
    void disabledTaskLoadsSuccessfully() {
        StatsTaskConfigEntity e = createValidEntity();
        e.setEnabled(0);
        when(configMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.singletonList(e));

        StatsTaskConfig config = loader.loadOnce();

        assertEquals(0, config.getEnabled());
        assertTrue(loader.isLoaded());
    }

    @Test
    void nullNumericFieldThrowsException() {
        StatsTaskConfigEntity e = createValidEntity();
        e.setBatchSize(null);
        when(configMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.singletonList(e));

        assertThrows(StatsConfigLoadException.class, () -> loader.loadOnce());
        assertTrue(loader.isFailed());
    }

    @Test
    void outOfRangeValueThrows() {
        StatsTaskConfigEntity e = createValidEntity();
        e.setMaxBatchesPerRun(200); // exceeds CHECK 1-100
        when(configMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.singletonList(e));

        assertThrows(StatsConfigLoadException.class, () -> loader.loadOnce());
        assertTrue(loader.isFailed());
    }

    @Test
    void failedStateThrowsCachedExceptionWithoutQueryingDb() {
        when(configMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.emptyList());

        // First call: fails
        StatsConfigLoadException firstEx = assertThrows(StatsConfigLoadException.class,
                () -> loader.loadOnce());
        assertTrue(loader.isFailed());

        // Second call: throws cached exception WITHOUT querying DB again
        StatsConfigLoadException secondEx = assertThrows(StatsConfigLoadException.class,
                () -> loader.loadOnce());
        // Mapper should only have been called once
        verify(configMapper, times(1)).selectList(any(LambdaQueryWrapper.class));
        assertSame(firstEx, secondEx); // same cached exception instance
    }

    @Test
    void configNotReloadedDuringRuntime() {
        when(configMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.singletonList(createValidEntity()));

        StatsTaskConfig c1 = loader.loadOnce();
        StatsTaskConfig c2 = loader.loadOnce();

        assertSame(c1, c2);
        verify(configMapper, times(1)).selectList(any(LambdaQueryWrapper.class));
    }

    @Test
    void concurrentLoadOnceOnlyOneDbQuery() throws Exception {
        AtomicInteger dbCallCount = new AtomicInteger(0);
        when(configMapper.selectList(any(LambdaQueryWrapper.class))).thenAnswer(inv -> {
            dbCallCount.incrementAndGet();
            Thread.sleep(50); // simulate DB latency
            return Collections.singletonList(createValidEntity());
        });

        int threadCount = 10;
        CountDownLatch latch = new CountDownLatch(threadCount);
        Thread[] threads = new Thread[threadCount];
        AtomicReference<Exception> failure = new AtomicReference<>();

        for (int i = 0; i < threadCount; i++) {
            threads[i] = new Thread(() -> {
                try {
                    latch.countDown();
                    latch.await();
                    loader.loadOnce();
                } catch (Exception ex) {
                    failure.set(ex);
                }
            });
            threads[i].start();
        }

        for (Thread t : threads) {
            t.join();
        }

        assertNull(failure.get());
        assertEquals(1, dbCallCount.get());
        assertTrue(loader.isLoaded());
    }

    @Test
    void concurrentLoadOnceFailureCachesException() throws Exception {
        when(configMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.emptyList());

        int threadCount = 5;
        CountDownLatch latch = new CountDownLatch(threadCount);
        Thread[] threads = new Thread[threadCount];

        for (int i = 0; i < threadCount; i++) {
            threads[i] = new Thread(() -> {
                try {
                    latch.countDown();
                    latch.await();
                    assertThrows(StatsConfigLoadException.class, () -> loader.loadOnce());
                } catch (Exception ignored) {}
            });
            threads[i].start();
        }

        for (Thread t : threads) {
            t.join();
        }

        verify(configMapper, times(1)).selectList(any(LambdaQueryWrapper.class));
        assertTrue(loader.isFailed());
    }
}
