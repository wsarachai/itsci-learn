package com.example.wellness.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.io.File;
import java.io.FileWriter;
import java.io.PrintWriter;
import java.sql.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
// @RequiredArgsConstructor
@Slf4j
public class DatabaseExportService {

    private final DataSource dataSource;

    public DatabaseExportService(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * ส่งออกโครงสร้างตาราง (DDL) และข้อมูลทั้งหมด (Data) ออกมาเป็นไฟล์ SQL
     * @param targetFilePath เส้นทางไฟล์ปลายทางที่จะบันทึก
     * @return สรุปผลการส่งออก (จำนวนตาราง, จำนวนแถวทั้งหมด, สถานะ)
     */
    public Map<String, Object> exportDatabaseToSql(String targetFilePath) {
        Map<String, Object> result = new LinkedHashMap<>();
        int totalTables = 0;
        long totalRows = 0;
        Map<String, Long> tableRowCounts = new LinkedHashMap<>();

        File targetFile = new File(targetFilePath);
        File parentDir = targetFile.getParentFile();
        if (parentDir != null && !parentDir.exists()) {
            parentDir.mkdirs();
        }

        try (Connection conn = dataSource.getConnection();
             PrintWriter out = new PrintWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(targetFile), java.nio.charset.StandardCharsets.UTF_8))) {

            DatabaseMetaData metaData = conn.getMetaData();
            String dbProduct = metaData.getDatabaseProductName() + " " + metaData.getDatabaseProductVersion();

            out.println("-- =============================================================================");
            out.println("-- WELLNESS ROUTE - SUPABASE DATABASE MIGRATION BACKUP");
            out.println("-- Generated on: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            out.println("-- Database Product: " + dbProduct);
            out.println("-- =============================================================================");
            out.println();
            out.println("BEGIN;");
            out.println();
            out.println("-- ปิดการตรวจสอบ Foreign Key และ Trigger ชั่วคราวระหว่างการนำเข้าข้อมูล");
            out.println("SET statement_timeout = 0;");
            out.println("SET lock_timeout = 0;");
            out.println("SET client_encoding = 'UTF8';");
            out.println("SET standard_conforming_strings = on;");
            out.println("SET check_function_bodies = false;");
            out.println("SET client_min_messages = warning;");
            out.println("SET session_replication_role = 'replica';");
            out.println();

            // 1. ดึงรายชื่อตารางทั้งหมดใน public schema
            List<String> tables = new ArrayList<>();
            try (ResultSet rs = metaData.getTables(null, "public", "%", new String[]{"TABLE"})) {
                while (rs.next()) {
                    String tableName = rs.getString("TABLE_NAME");
                    // ข้ามตารางระบบ supabase หรือ flyway/liquibase ถ้ามี
                    if (!tableName.startsWith("spatial_ref_sys") && !tableName.startsWith("_")) {
                        tables.add(tableName);
                    }
                }
            }

            // จัดเรียงตาราง
            Collections.sort(tables);
            totalTables = tables.size();

            // 2. สร้าง DDL (CREATE TABLE) สำหรับแต่ละตาราง
            out.println("-- =============================================================================");
            out.println("-- 1. TABLE STRUCTURES (DDL)");
            out.println("-- =============================================================================");
            out.println();

            for (String tableName : tables) {
                out.println("-- Table structure for: " + tableName);
                String ddl = generateCreateTableDdl(conn, metaData, tableName);
                out.println(ddl);
                out.println();
            }

            // 3. สร้างข้อมูล (INSERT DATA) สำหรับแต่ละตาราง
            out.println("-- =============================================================================");
            out.println("-- 2. TABLE DATA (INSERTS)");
            out.println("-- =============================================================================");
            out.println();

            for (String tableName : tables) {
                long rowsInTable = exportTableData(conn, tableName, out);
                tableRowCounts.put(tableName, rowsInTable);
                totalRows += rowsInTable;
            }

            // 4. รีเซ็ต Sequence สำหรับตารางที่มีคอลัมน์ auto-increment / serial
            out.println("-- =============================================================================");
            out.println("-- 3. RESTART SEQUENCES");
            out.println("-- =============================================================================");
            out.println();

            for (String tableName : tables) {
                exportSequenceReset(conn, metaData, tableName, out);
            }

            out.println("-- เปิดการตรวจสอบ Foreign Key และ Trigger กลับสู่สถานะปกติ");
            out.println("SET session_replication_role = 'origin';");
            out.println();
            out.println("COMMIT;");
            out.println();
            out.println("-- =============================================================================");
            out.println("-- MIGRATION BACKUP COMPLETED SUCCESSFULLY");
            out.println("-- =============================================================================");

            result.put("status", "SUCCESS");
            result.put("message", "ส่งออกฐานข้อมูลไปยัง " + targetFile.getAbsolutePath() + " สำเร็จเรียบร้อย");
            result.put("filePath", targetFile.getAbsolutePath());
            result.put("fileSizeBytes", targetFile.length());
            result.put("totalTables", totalTables);
            result.put("totalRows", totalRows);
            result.put("tables", tableRowCounts);

            log.info("✅ Database export completed successfully to {}: {} tables, {} rows",
                    targetFile.getAbsolutePath(), totalTables, totalRows);

        } catch (Exception e) {
            log.error("❌ Database export failed: {}", e.getMessage(), e);
            result.put("status", "ERROR");
            result.put("message", "การส่งออกฐานข้อมูลล้มเหลว: " + e.getMessage());
        }

        return result;
    }

    /**
     * ส่งออกเฉพาะข้อมูล (Data-Only INSERTS) โดยสามารถยกเว้นตารางที่ไม่ต้องการได้ (เช่น member)
     * พร้อมปิด Trigger/FK ชั่วคราว และรีเซ็ต Sequence ให้อัตโนมัติ
     * 
     * @param targetFilePath เส้นทางไฟล์ปลายทาง (เช่น all_data.sql)
     * @param excludedTables ชุดชื่อตารางที่ต้องการยกเว้น (เช่น Set.of("member"))
     * @return สรุปผลการส่งออกข้อมูล
     */
    public Map<String, Object> exportDataOnlyToSql(String targetFilePath, Set<String> excludedTables) {
        Map<String, Object> result = new LinkedHashMap<>();
        int totalTables = 0;
        long totalRows = 0;
        Map<String, Long> tableRowCounts = new LinkedHashMap<>();

        File targetFile = new File(targetFilePath);
        File parentDir = targetFile.getParentFile();
        if (parentDir != null && !parentDir.exists()) {
            parentDir.mkdirs();
        }

        Set<String> excludedLower = new HashSet<>();
        if (excludedTables != null) {
            for (String ex : excludedTables) {
                if (ex != null) {
                    excludedLower.add(ex.trim().toLowerCase());
                }
            }
        }

        try (Connection conn = dataSource.getConnection();
             PrintWriter out = new PrintWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(targetFile), java.nio.charset.StandardCharsets.UTF_8))) {

            DatabaseMetaData metaData = conn.getMetaData();
            String dbProduct = metaData.getDatabaseProductName() + " " + metaData.getDatabaseProductVersion();

            out.println("-- =============================================================================");
            out.println("-- WELLNESS ROUTE - DATA-ONLY EXPORT (EXCLUDING: " + String.join(", ", excludedLower) + ")");
            out.println("-- Generated on: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            out.println("-- Database: " + dbProduct);
            out.println("-- =============================================================================");
            out.println();
            out.println("BEGIN;");
            out.println();
            out.println("SET statement_timeout = 0;");
            out.println("SET lock_timeout = 0;");
            out.println("SET client_encoding = 'UTF8';");
            out.println("SET standard_conforming_strings = on;");
            out.println("SET check_function_bodies = false;");
            out.println("SET client_min_messages = warning;");
            out.println("-- ปิด Trigger และ Foreign Key ตรวจสอบชั่วคราวระหว่าง Import");
            out.println("SET session_replication_role = 'replica';");
            out.println();

            // 1. ดึงรายชื่อตารางทั้งหมดใน public schema
            List<String> tables = new ArrayList<>();
            try (ResultSet rs = metaData.getTables(null, "public", "%", new String[]{"TABLE"})) {
                while (rs.next()) {
                    String tableName = rs.getString("TABLE_NAME");
                    if (!tableName.startsWith("spatial_ref_sys") && !tableName.startsWith("_")) {
                        if (!excludedLower.contains(tableName.toLowerCase())) {
                            tables.add(tableName);
                        }
                    }
                }
            }

            Collections.sort(tables);
            totalTables = tables.size();

            // 2. สร้างข้อมูล INSERT DATA สำหรับแต่ละตาราง
            out.println("-- =============================================================================");
            out.println("-- 1. DATA INSERTS");
            out.println("-- =============================================================================");
            out.println();

            for (String tableName : tables) {
                long rowsInTable = exportTableData(conn, tableName, out);
                tableRowCounts.put(tableName, rowsInTable);
                totalRows += rowsInTable;
            }

            // 3. รีเซ็ต Sequence
            out.println("-- =============================================================================");
            out.println("-- 2. RESET SEQUENCES (AUTO-INCREMENT COUNTERS)");
            out.println("-- =============================================================================");
            out.println();

            for (String tableName : tables) {
                exportSequenceReset(conn, metaData, tableName, out);
            }

            out.println();
            out.println("-- เปิดการตรวจสอบ Trigger และ Foreign Key กลับสู่ปกติ");
            out.println("SET session_replication_role = 'origin';");
            out.println();
            out.println("COMMIT;");
            out.println();
            out.println("-- =============================================================================");
            out.println("-- DATA-ONLY EXPORT COMPLETED SUCCESSFULLY (" + totalRows + " rows exported)");
            out.println("-- =============================================================================");

            result.put("status", "SUCCESS");
            result.put("message", "ส่งออกข้อมูลไปยัง " + targetFile.getAbsolutePath() + " สำเร็จเรียบร้อย");
            result.put("filePath", targetFile.getAbsolutePath());
            result.put("fileSizeBytes", targetFile.length());
            result.put("totalTables", totalTables);
            result.put("totalRows", totalRows);
            result.put("tables", tableRowCounts);

            log.info("✅ Data-only export completed successfully to {}: {} tables, {} rows",
                    targetFile.getAbsolutePath(), totalTables, totalRows);

        } catch (Exception e) {
            log.error("❌ Data-only export failed: {}", e.getMessage(), e);
            result.put("status", "ERROR");
            result.put("message", "การส่งออกข้อมูลล้มเหลว: " + e.getMessage());
        }

        return result;
    }

    /**
     * ส่งออกเฉพาะข้อมูล (Data-Only INSERTS) ของเฉพาะตารางที่ระบุเท่านั้น
     * พร้อมปิด Trigger/FK ชั่วคราว และรีเซ็ต Sequence ให้อัตโนมัติ
     * 
     * @param targetFilePath เส้นทางไฟล์ปลายทาง (เช่น all_data.sql)
     * @param targetTables รายชื่อตารางที่ต้องการส่งออกข้อมูล
     * @return สรุปผลการส่งออกข้อมูล
     */
    public Map<String, Object> exportSelectedTablesDataToSql(String targetFilePath, List<String> targetTables) {
        Map<String, Object> result = new LinkedHashMap<>();
        int totalTables = 0;
        long totalRows = 0;
        Map<String, Long> tableRowCounts = new LinkedHashMap<>();

        File targetFile = new File(targetFilePath);
        File parentDir = targetFile.getParentFile();
        if (parentDir != null && !parentDir.exists()) {
            parentDir.mkdirs();
        }

        try (Connection conn = dataSource.getConnection();
             PrintWriter out = new PrintWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(targetFile), java.nio.charset.StandardCharsets.UTF_8))) {

            DatabaseMetaData metaData = conn.getMetaData();
            String dbProduct = metaData.getDatabaseProductName() + " " + metaData.getDatabaseProductVersion();

            out.println("-- =============================================================================");
            out.println("-- WELLNESS ROUTE - DATA-ONLY EXPORT (SELECTED " + targetTables.size() + " TABLES)");
            out.println("-- Generated on: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            out.println("-- Database: " + dbProduct);
            out.println("-- Tables included: " + String.join(", ", targetTables));
            out.println("-- =============================================================================");
            out.println();
            out.println("BEGIN;");
            out.println();
            out.println("SET statement_timeout = 0;");
            out.println("SET lock_timeout = 0;");
            out.println("SET client_encoding = 'UTF8';");
            out.println("SET standard_conforming_strings = on;");
            out.println("SET check_function_bodies = false;");
            out.println("SET client_min_messages = warning;");
            out.println("-- ปิด Trigger และ Foreign Key ตรวจสอบชั่วคราวระหว่าง Import");
            out.println("SET session_replication_role = 'replica';");
            out.println();

            // 1. ตรวจสอบว่าตารางที่ระบุมีอยู่ในฐานข้อมูลจริง
            List<String> actualTables = new ArrayList<>();
            for (String requestedTable : targetTables) {
                try (ResultSet rs = metaData.getTables(null, "public", requestedTable, new String[]{"TABLE"})) {
                    if (rs.next()) {
                        actualTables.add(requestedTable);
                    } else {
                        log.warn("⚠️ Table '{}' not found in public schema", requestedTable);
                    }
                }
            }

            totalTables = actualTables.size();

            // 2. สร้างข้อมูล INSERT DATA สำหรับแต่ละตาราง
            out.println("-- =============================================================================");
            out.println("-- 1. DATA INSERTS");
            out.println("-- =============================================================================");
            out.println();

            for (String tableName : actualTables) {
                long rowsInTable = exportTableData(conn, tableName, out);
                tableRowCounts.put(tableName, rowsInTable);
                totalRows += rowsInTable;
            }

            // 3. รีเซ็ต Sequence
            out.println("-- =============================================================================");
            out.println("-- 2. RESET SEQUENCES (AUTO-INCREMENT COUNTERS)");
            out.println("-- =============================================================================");
            out.println();

            for (String tableName : actualTables) {
                exportSequenceReset(conn, metaData, tableName, out);
            }

            out.println();
            out.println("-- เปิดการตรวจสอบ Trigger และ Foreign Key กลับสู่ปกติ");
            out.println("SET session_replication_role = 'origin';");
            out.println();
            out.println("COMMIT;");
            out.println();
            out.println("-- =============================================================================");
            out.println("-- DATA-ONLY EXPORT COMPLETED SUCCESSFULLY (" + totalRows + " rows exported across " + totalTables + " tables)");
            out.println("-- =============================================================================");

            result.put("status", "SUCCESS");
            result.put("message", "ส่งออกข้อมูลเฉพาะตารางที่เลือกไปยัง " + targetFile.getAbsolutePath() + " สำเร็จเรียบร้อย");
            result.put("filePath", targetFile.getAbsolutePath());
            result.put("fileSizeBytes", targetFile.length());
            result.put("totalTables", totalTables);
            result.put("totalRows", totalRows);
            result.put("tables", tableRowCounts);

            log.info("✅ Selected tables data-only export completed successfully to {}: {} tables, {} rows",
                    targetFile.getAbsolutePath(), totalTables, totalRows);

        } catch (Exception e) {
            log.error("❌ Selected tables data-only export failed: {}", e.getMessage(), e);
            result.put("status", "ERROR");
            result.put("message", "การส่งออกข้อมูลล้มเหลว: " + e.getMessage());
        }

        return result;
    }

    private String generateCreateTableDdl(Connection conn, DatabaseMetaData metaData, String tableName) throws SQLException {
        StringBuilder ddl = new StringBuilder();
        ddl.append("CREATE TABLE IF NOT EXISTS public.\"").append(tableName).append("\" (\n");

        List<String> columnDefs = new ArrayList<>();

        // ดึง Primary Keys
        Set<String> primaryKeys = new HashSet<>();
        try (ResultSet pkRs = metaData.getPrimaryKeys(null, "public", tableName)) {
            while (pkRs.next()) {
                primaryKeys.add(pkRs.getString("COLUMN_NAME"));
            }
        }

        // ดึง Columns
        try (ResultSet colRs = metaData.getColumns(null, "public", tableName, "%")) {
            while (colRs.next()) {
                String colName = colRs.getString("COLUMN_NAME");
                String typeName = colRs.getString("TYPE_NAME");
                int colSize = colRs.getInt("COLUMN_SIZE");
                int decimalDigits = colRs.getInt("DECIMAL_DIGITS");
                int nullable = colRs.getInt("NULLABLE");
                String isAutoIncrement = colRs.getString("IS_AUTOINCREMENT");
                String columnDefault = colRs.getString("COLUMN_DEF");

                StringBuilder colDef = new StringBuilder();
                colDef.append("    \"").append(colName).append("\" ");

                // แปลงประเภทข้อมูลให้เข้ากับ PostgreSQL
                String pgType = mapToPgType(typeName, colSize, decimalDigits);
                if ("YES".equalsIgnoreCase(isAutoIncrement) || (columnDefault != null && columnDefault.contains("nextval("))) {
                    if (typeName.equalsIgnoreCase("bigint") || typeName.equalsIgnoreCase("int8")) {
                        colDef.append("BIGSERIAL");
                    } else {
                        colDef.append("SERIAL");
                    }
                } else {
                    colDef.append(pgType);

                    if (columnDefault != null && !columnDefault.isBlank()) {
                        colDef.append(" DEFAULT ").append(columnDefault);
                    }
                }

                if (nullable == DatabaseMetaData.columnNoNulls) {
                    colDef.append(" NOT NULL");
                }

                columnDefs.add(colDef.toString());
            }
        }

        // เพิ่ม Primary Key constraint
        if (!primaryKeys.isEmpty()) {
            StringBuilder pkDef = new StringBuilder("    CONSTRAINT \"").append(tableName).append("_pkey\" PRIMARY KEY (");
            int idx = 0;
            for (String pkCol : primaryKeys) {
                if (idx > 0) pkDef.append(", ");
                pkDef.append("\"").append(pkCol).append("\"");
                idx++;
            }
            pkDef.append(")");
            columnDefs.add(pkDef.toString());
        }

        ddl.append(String.join(",\n", columnDefs));
        ddl.append("\n);");

        return ddl.toString();
    }

    private String mapToPgType(String typeName, int colSize, int decimalDigits) {
        String lower = typeName.toLowerCase();
        if (lower.equals("varchar") || lower.equals("character varying")) {
            return colSize > 0 && colSize < 100000 ? "VARCHAR(" + colSize + ")" : "TEXT";
        }
        if (lower.equals("bpchar") || lower.equals("char") || lower.equals("character")) {
            return "CHAR(" + colSize + ")";
        }
        if (lower.equals("text")) return "TEXT";
        if (lower.equals("int4") || lower.equals("integer") || lower.equals("int")) return "INTEGER";
        if (lower.equals("int8") || lower.equals("bigint")) return "BIGINT";
        if (lower.equals("int2") || lower.equals("smallint")) return "SMALLINT";
        if (lower.equals("bool") || lower.equals("boolean")) return "BOOLEAN";
        if (lower.equals("float8") || lower.equals("double precision") || lower.equals("numeric") && decimalDigits > 0) {
            return decimalDigits > 0 ? "NUMERIC(" + colSize + ", " + decimalDigits + ")" : "DOUBLE PRECISION";
        }
        if (lower.equals("timestamp") || lower.equals("timestamp without time zone")) return "TIMESTAMP";
        if (lower.equals("timestamptz") || lower.equals("timestamp with time zone")) return "TIMESTAMPTZ";
        if (lower.equals("date")) return "DATE";
        if (lower.equals("time")) return "TIME";
        if (lower.equals("json") || lower.equals("jsonb")) return "JSONB";
        if (lower.equals("bytea")) return "BYTEA";
        return typeName.toUpperCase();
    }

    private long exportTableData(Connection conn, String tableName, PrintWriter out) throws SQLException {
        long count = 0;
        String query = "SELECT * FROM public.\"" + tableName + "\"";

        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(query)) {

            ResultSetMetaData rsMeta = rs.getMetaData();
            int colCount = rsMeta.getColumnCount();

            if (!rs.isBeforeFirst()) {
                out.println("-- No data in table: " + tableName);
                out.println();
                return 0;
            }

            out.println("-- Data for: " + tableName);

            // Columns Header
            StringBuilder colNames = new StringBuilder();
            for (int i = 1; i <= colCount; i++) {
                if (i > 1) colNames.append(", ");
                colNames.append("\"").append(rsMeta.getColumnName(i)).append("\"");
            }

            while (rs.next()) {
                StringBuilder rowValues = new StringBuilder();
                for (int i = 1; i <= colCount; i++) {
                    if (i > 1) rowValues.append(", ");
                    Object val = rs.getObject(i);
                    rowValues.append(formatSqlValue(val, rsMeta.getColumnType(i)));
                }

                out.println("INSERT INTO public.\"" + tableName + "\" (" + colNames + ") VALUES (" + rowValues + ");");
                count++;
            }

            out.println();
        }
        return count;
    }

    private String formatSqlValue(Object val, int sqlType) {
        if (val == null) {
            return "NULL";
        }
        if (val instanceof Boolean) {
            return (Boolean) val ? "TRUE" : "FALSE";
        }
        if (val instanceof Number) {
            return val.toString();
        }
        if (val instanceof byte[]) {
            byte[] bytes = (byte[]) val;
            StringBuilder hex = new StringBuilder("E'\\\\x");
            for (byte b : bytes) {
                hex.append(String.format("%02x", b));
            }
            hex.append("'");
            return hex.toString();
        }

        // String, Timestamp, Date, JSON, etc.
        String str = val.toString();
        String escaped = str.replace("'", "''");
        return "'" + escaped + "'";
    }

    private void exportSequenceReset(Connection conn, DatabaseMetaData metaData, String tableName, PrintWriter out) {
        try {
            // ค้นหาคอลัมน์ที่เป็น Primary Key และตรวจสอบว่ามี sequence ผูกอยู่จริงหรือไม่
            try (ResultSet pkRs = metaData.getPrimaryKeys(null, "public", tableName)) {
                if (pkRs.next()) {
                    String pkCol = pkRs.getString("COLUMN_NAME");
                    String checkSeqSql = "SELECT pg_get_serial_sequence('public.\"" + tableName + "\"', '" + pkCol + "')";
                    try (Statement stmt = conn.createStatement();
                         ResultSet seqRs = stmt.executeQuery(checkSeqSql)) {
                        if (seqRs.next()) {
                            String seqName = seqRs.getString(1);
                            // ออกคำสั่ง setval เฉพาะคอลัมน์ที่เป็น Serial / Auto-Increment (Sequence) เท่านั้น
                            if (seqName != null && !seqName.trim().isEmpty()) {
                                out.println("SELECT setval(pg_get_serial_sequence('public.\"" + tableName + "\"', '" + pkCol + "'), " +
                                        "COALESCE((SELECT MAX(\"" + pkCol + "\") FROM public.\"" + tableName + "\"), 1), " +
                                        "(SELECT COUNT(*) > 0 FROM public.\"" + tableName + "\")) " +
                                        "WHERE pg_get_serial_sequence('public.\"" + tableName + "\"', '" + pkCol + "') IS NOT NULL;");
                            }
                        }
                    }
                }
            }
        } catch (Exception ignored) {
        }
    }
}
