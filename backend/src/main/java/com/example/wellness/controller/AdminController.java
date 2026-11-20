package com.example.wellness.controller;

import com.example.wellness.model.Admin;
import com.example.wellness.service.AccountGeneratorService;
import com.example.wellness.service.AdminService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class AdminController {

    private final AdminService adminService;
    private final AccountGeneratorService accountGeneratorService;
    private final com.example.wellness.service.StorageMigrationService storageMigrationService;
    private final com.example.wellness.service.DatabaseExportService databaseExportService;

    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9]{3,20}$");
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^.{1,100}$");

    public AdminController(AdminService adminService,
            AccountGeneratorService accountGeneratorService,
            com.example.wellness.service.StorageMigrationService storageMigrationService,
            com.example.wellness.service.DatabaseExportService databaseExportService) {
        this.adminService = adminService;
        this.accountGeneratorService = accountGeneratorService;
        this.storageMigrationService = storageMigrationService;
        this.databaseExportService = databaseExportService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody(required = false) Map<String, Object> payload,
            HttpServletRequest request) {
        if (payload == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", "ข้อมูลไม่ถูกต้อง"));
        }

        Object usernameObj = payload.get("username");
        Object passwordObj = payload.get("password");

        String username = usernameObj != null ? usernameObj.toString().trim() : "";
        String password = passwordObj != null ? passwordObj.toString() : "";

        // 1. Validation รูปแบบ/ความยาว/ค่าว่าง
        if (!USERNAME_PATTERN.matcher(username).matches() || !PASSWORD_PATTERN.matcher(password).matches()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", "ข้อมูลไม่ถูกต้อง"));
        }

        // 2. ตรวจสอบกับฐานข้อมูล
        Optional<Admin> adminOpt = adminService.login(username, password);
        if (adminOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "ขออภัย Username หรือ Password ไม่ถูกต้อง"));
        }

        Admin admin = adminOpt.get();

        // 3. สร้าง Session และบันทึก adminUsername
        HttpSession session = request.getSession(true);
        session.setAttribute("adminUsername", admin.getUsername());

        // 4. Response โดยไม่ส่ง Entity และไม่ส่ง password
        Map<String, Object> responseData = new LinkedHashMap<>();
        responseData.put("username", admin.getUsername());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "เข้าสู่ระบบสำเร็จ",
                "data", responseData));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "ออกจากระบบสำเร็จ"));
    }

    @GetMapping("/ping")
    public ResponseEntity<?> ping(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("adminUsername") == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่"));
        }
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Session active",
                "username", session.getAttribute("adminUsername")));
    }

    @PostMapping("/generate-account")
    public ResponseEntity<?> generateAccount() {
        return ResponseEntity.ok(accountGeneratorService.generateAccounts());
    }

    @PostMapping("/migrate-storage")
    public ResponseEntity<?> migrateStorage() {
        return ResponseEntity.ok(storageMigrationService.migrateAllBase64Images());
    }

    @PostMapping("/export-database")
    public ResponseEntity<?> exportDatabase() {
        String defaultPath = "migration_backup.sql";
        return ResponseEntity.ok(databaseExportService.exportDatabaseToSql(defaultPath));
    }
}