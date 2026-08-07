package com.bsoft.cdcconfig.largescreen.stats.algorithm;

import com.bsoft.cdcconfig.largescreen.stats.mapper.StatsWatermarkMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WatermarkCasUpdaterTest {

    @Mock
    private StatsWatermarkMapper statsWatermarkMapper;

    @InjectMocks
    private WatermarkCasUpdater updater;

    @Test
    void casUpdateOneRowSuccess() {
        when(statsWatermarkMapper.casUpdate(eq("T"), eq("CORRECT"),
                eq(0L), eq(100L), anyInt(), anyString()))
                .thenReturn(1);

        assertDoesNotThrow(() ->
                updater.casUpdate("T", "CORRECT", 0L, 100L, 50, "batch-1"));
    }

    @Test
    void casUpdateZeroRowsThrows() {
        when(statsWatermarkMapper.casUpdate(eq("T"), eq("CORRECT"),
                eq(0L), eq(100L), anyInt(), anyString()))
                .thenReturn(0);

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> updater.casUpdate("T", "CORRECT", 0L, 100L, 50, "batch-1"));
        assertTrue(ex.getMessage().contains("expected 1 row"));
    }

    @Test
    void casUpdateMultipleRowsThrows() {
        when(statsWatermarkMapper.casUpdate(eq("T"), eq("ERROR"),
                eq(50L), eq(200L), anyInt(), anyString()))
                .thenReturn(2);

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> updater.casUpdate("T", "ERROR", 50L, 200L, 75, "batch-2"));
        assertTrue(ex.getMessage().contains("expected 1 row"));
    }
}
