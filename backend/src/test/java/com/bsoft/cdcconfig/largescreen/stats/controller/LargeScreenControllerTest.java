package com.bsoft.cdcconfig.largescreen.stats.controller;

import com.bsoft.cdcconfig.largescreen.stats.service.LargeScreenService;
import com.bsoft.cdcconfig.largescreen.stats.vo.DashboardVO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(LargeScreenController.class)
class LargeScreenControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private LargeScreenService largeScreenService;

    @Test
    void dashboardReturnsOk() throws Exception {
        when(largeScreenService.getDashboard()).thenReturn(new DashboardVO());

        mockMvc.perform(get("/api/large-screen/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").exists());
    }

    @Test
    void dashboardContainsRequiredFields() throws Exception {
        DashboardVO vo = new DashboardVO();
        vo.setDataStatus("EMPTY");
        vo.setTitle("Test");
        when(largeScreenService.getDashboard()).thenReturn(vo);

        mockMvc.perform(get("/api/large-screen/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.dataStatus").value("EMPTY"))
                .andExpect(jsonPath("$.data.title").value("Test"));
    }
}
