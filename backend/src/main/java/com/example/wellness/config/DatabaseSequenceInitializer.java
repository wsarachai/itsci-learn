package com.example.wellness.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * คลาสสำหรับตรวจสอบและสร้าง Sequence อัตโนมัติให้กับตารางต่างๆ ใน PostgreSQL (Supabase)
 * เพื่อป้องกัน Error: null value in column violates not-null constraint
 */
@Component
@Slf4j
public class DatabaseSequenceInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseSequenceInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        try {
            ensureTableSequence("account_requests", "request_id", "account_requests_request_id_seq");
            ensureTableSequence("notification", "notification_id", "notification_notification_id_seq");
            ensureTableSequence("official_articles", "article_id", "official_articles_article_id_seq");
            ensureTableSequence("main_routes", "route_id", "main_routes_route_id_seq");
            ensureTableSequence("main_route_details", "id", "main_route_details_id_seq");
        } catch (Exception e) {
            log.warn("DatabaseSequenceInitializer warning: {}", e.getMessage());
        }
    }

    private void ensureTableSequence(String tableName, String columnName, String sequenceName) {
        try {
            // 1. สร้าง Sequence หากยังไม่มี
            jdbcTemplate.execute(String.format("CREATE SEQUENCE IF NOT EXISTS %s;", sequenceName));

            // 2. ปรับค่าเริ่มต้นของ Sequence ให้มากกว่า MAX ปัจจุบันที่มีอยู่ในตาราง
            String syncSql = String.format(
                "SELECT setval('%s', COALESCE((SELECT MAX(%s) FROM %s), 0) + 1, false);",
                sequenceName, columnName, tableName
            );
            jdbcTemplate.execute(syncSql);

            // 3. ผูก Sequence เป็นค่า Default ให้กับคอลัมน์ Primary Key
            String alterSql = String.format(
                "ALTER TABLE %s ALTER COLUMN %s SET DEFAULT nextval('%s');",
                tableName, columnName, sequenceName
            );
            jdbcTemplate.execute(alterSql);

            log.info("DatabaseSequenceInitializer: Successfully verified sequence {} for {}.{}", sequenceName, tableName, columnName);
        } catch (Exception ex) {
            log.warn("DatabaseSequenceInitializer: Could not update sequence for {}.{}: {}", tableName, columnName, ex.getMessage());
        }
    }
}
