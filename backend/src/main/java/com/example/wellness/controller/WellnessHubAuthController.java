package com.example.wellness.controller;

import com.example.wellness.model.WellnessHub;
import com.example.wellness.service.WellnessHubAuthService;
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

import java.util.Map;

@RestController
@RequestMapping("/api/wellness-hub-auth")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class WellnessHubAuthController {

    private final WellnessHubAuthService service;

    public WellnessHubAuthController(WellnessHubAuthService service) {
        this.service = service;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody(required = false) WellnessHub request, HttpServletRequest httpRequest) {
        if (request == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "กรุณากรอกข้อมูลให้ถูกต้อง"));
        }

        try {
            Map<String, Object> response = service.login(
                    request.getUsername(),
                    request.getPassword());

            HttpSession session = httpRequest.getSession(true);
            if (response.get("licenseId") != null) {
                session.setAttribute("providerLicenseId", String.valueOf(response.get("licenseId")));
            }
            if (response.get("username") != null) {
                session.setAttribute("providerUsername", String.valueOf(response.get("username")));
            }

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "กรุณากรอกข้อมูลให้ถูกต้อง"));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง"));
        }
    }

    @GetMapping("/ping")
    public ResponseEntity<?> ping(HttpServletRequest httpRequest) {
        HttpSession session = httpRequest.getSession(false);
        if (session == null || session.getAttribute("providerLicenseId") == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่"));
        }
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Session active",
                "licenseId", session.getAttribute("providerLicenseId")
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest httpRequest) {
        HttpSession session = httpRequest.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "ออกจากระบบสำเร็จ"
        ));
    }
}