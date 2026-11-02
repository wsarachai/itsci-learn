package com.example.wellness;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class AdminSecurityEndpointTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testExportDatabase_WithoutLogin_ShouldReturn401() throws Exception {
        mockMvc.perform(post("/api/admin/export-database"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("กรุณาเข้าสู่ระบบ"));
    }

    @Test
    void testMigrateStorage_WithoutLogin_ShouldReturn401() throws Exception {
        mockMvc.perform(post("/api/admin/migrate-storage"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("กรุณาเข้าสู่ระบบ"));
    }

    @Test
    void testExportDatabase_WithAdminLogin_ShouldBeAllowed() throws Exception {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("adminUsername", "admin");

        mockMvc.perform(post("/api/admin/export-database").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"));
    }

    @Test
    void testMigrateStorage_WithAdminLogin_ShouldBeAllowed() throws Exception {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("adminUsername", "admin");

        mockMvc.perform(post("/api/admin/migrate-storage").session(session))
                .andExpect(status().isOk());
    }
}