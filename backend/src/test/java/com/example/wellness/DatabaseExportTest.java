package com.example.wellness;

import com.example.wellness.service.DatabaseExportService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.File;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
public class DatabaseExportTest {

    @Autowired
    private DatabaseExportService databaseExportService;

    @Test
    void testExportDatabase() {
        // บันทึกไฟล์ที่ workspace root
        String rootPath = "../../migration_backup.sql";
        Map<String, Object> result = databaseExportService.exportDatabaseToSql(rootPath);
        System.out.println("Export Result (Root): " + result);

        // บันทึกไฟล์ที่ backend folder ด้วย
        String backendPath = "migration_backup.sql";
        Map<String, Object> resultBackend = databaseExportService.exportDatabaseToSql(backendPath);
        System.out.println("Export Result (Backend): " + resultBackend);

        assertEquals("SUCCESS", result.get("status"));
        assertTrue(new File(rootPath).exists());
    }

    @Test
    void testExportAllDataSql() {
        // รายชื่อ 11 ตารางตามที่ระบุ
        java.util.List<String> selectedTables = java.util.List.of(
            "categories",
            "districts",
            "admins",
            "emergency_services",
            "wellness_hubs",
            "account_requests",
            "main_routes",
            "main_route_categories",
            "main_route_details",
            "official_articles",
            "notification"
        );

        // บันทึกไฟล์ all_data.sql ที่ workspace root
        String rootPath = "../../all_data.sql";
        Map<String, Object> result = databaseExportService.exportSelectedTablesDataToSql(rootPath, selectedTables);
        System.out.println("Export Selected Tables Result (Root): " + result);

        // บันทึกไฟล์ all_data.sql ที่ backend ด้วย
        String backendPath = "all_data.sql";
        Map<String, Object> resultBackend = databaseExportService.exportSelectedTablesDataToSql(backendPath, selectedTables);
        System.out.println("Export Selected Tables Result (Backend): " + resultBackend);

        assertEquals("SUCCESS", result.get("status"));
        assertTrue(new File(rootPath).exists());
    }
}
