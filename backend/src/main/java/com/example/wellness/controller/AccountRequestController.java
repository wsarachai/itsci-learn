package com.example.wellness.controller;

import com.example.wellness.model.AccountRequest;
import com.example.wellness.service.AccountRequestService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/account-requests")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class AccountRequestController {

    private final AccountRequestService service;

    public AccountRequestController(AccountRequestService service) {
        this.service = service;
    }

    // =========================
    // Track Request (Public API)
    // =========================
    @GetMapping("/track")
    public ResponseEntity<?> trackRequestStatus(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String query) {
        try {
            String targetUsername = (username != null && !username.trim().isEmpty()) ? username : query;
            List<AccountRequest> requests = service.trackRequestStatus(targetUsername);

            List<Map<String, Object>> results = requests.stream()
                    .map(request -> {
                        Map<String, Object> map = new LinkedHashMap<>();

                        String licenseId = getLicenseId(request);

                        map.put("requestId", request.getRequestId());
                        map.put("username", request.getUsername());
                        map.put("requesterName", request.getRequesterName());
                        map.put("licenseId", licenseId);
                        map.put("wellnessHubName", request.getWellnessHubName());
                        map.put("requestStatus", request.getRequestStatus());
                        map.put("rejectionReason", request.getRejectionReason());
                        map.put("processedDate", request.getProcessedDate());
                        map.put("userEmail", maskEmail(request.getUserEmail()));

                        return map;
                    })
                    .toList();

            return ResponseEntity.ok(results);

        } catch (RuntimeException exception) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", exception.getMessage()));
        }
    }

    // =========================
    // Create Request
    // =========================
    @PostMapping
    public ResponseEntity<?> requestWellnessHubAccount(@RequestBody Map<String, Object> payload) {
        try {
            AccountRequest savedRequest = service.requestWellnessHubAccount(payload);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("success", true);
            response.put("requestId", savedRequest.getRequestId());
            response.put("requestStatus", savedRequest.getRequestStatus());
            response.put("message", "ส่งข้อมูลสำเร็จ!!");

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(response);

        } catch (RuntimeException exception) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", exception.getMessage()));
        }
    }

    // =========================
    // List Account Request
    // =========================
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listAccountRequest(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {
        List<Map<String, Object>> result = service.listAccountRequest(keyword, status);
        return ResponseEntity.ok(result);
    }

    // =========================
    // Detail
    // =========================
    @GetMapping("/{id}")
    public ResponseEntity<?> getRequestById(@PathVariable Integer id) {
        if (id == null || id <= 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "ไม่พบข้อมูลคำขออนุมัติ"));
        }
        AccountRequest request = service.getRequestById(id);
        if (request == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "ไม่พบข้อมูลคำขออนุมัติ"));
        }
        return ResponseEntity.ok(request);
    }

    // =========================
    // Approve
    // =========================
    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveAccountRequest(@PathVariable Integer id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "ไม่พบข้อมูลคำขออนุมัติ"));
            }
            AccountRequest savedRequest = service.approveAccountRequest(id);
            if (savedRequest == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "ไม่พบข้อมูลคำขออนุมัติ"));
            }
            return ResponseEntity.ok(savedRequest);
        } catch (RuntimeException exception) {
            String message = exception.getMessage();
            if ("ไม่พบข้อมูลคำขออนุมัติ".equals(message)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", message));
            }
            if (message != null && (message.contains("ได้รับการอนุมัติแล้ว") || message.contains("อนุมัติแล้ว") || message.contains("ถูกปฏิเสธ"))) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", message));
            }
            return ResponseEntity.badRequest().body(Map.of("message", message != null ? message : "ข้อมูลไม่ถูกต้อง"));
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง"));
        }
    }

    // =========================
    // Reject
    // =========================
    @PutMapping("/{id}/reject")
    public ResponseEntity<?> reject(
            @PathVariable Integer id,
            @RequestParam(required = false) String reason) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "ไม่พบข้อมูลคำขออนุมัติ"));
            }
            AccountRequest savedRequest = service.rejectRequest(id, reason);
            if (savedRequest == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "ไม่พบข้อมูลคำขออนุมัติ"));
            }
            return ResponseEntity.ok(savedRequest);
        } catch (RuntimeException exception) {
            String message = exception.getMessage();
            if ("ไม่พบข้อมูลคำขออนุมัติ".equals(message)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", message));
            }
            if (message != null && (message.contains("ได้รับการอนุมัติแล้ว") || message.contains("อนุมัติแล้ว") || message.contains("ถูกปฏิเสธไปแล้ว") || message.contains("ถูกปฏิเสธ"))) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", message));
            }
            return ResponseEntity.badRequest().body(Map.of("message", message != null ? message : "ข้อมูลไม่ถูกต้อง"));
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง"));
        }
    }

    // =========================
    // Notify Request Result
    // =========================
    @PostMapping("/{id}/notify")
    public ResponseEntity<?> notifyRequestResult(@PathVariable Integer id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "ไม่พบข้อมูลคำขออนุมัติ"));
            }
            com.example.wellness.model.Notification notification = service.notifyRequestResult(id);
            return ResponseEntity.ok(Map.of(
                    "message", "ส่งอีเมลแจ้งผลสำเร็จ",
                    "notificationId", notification.getNotificationId(),
                    "status", notification.getNotificationStatus(),
                    "notifyDate", notification.getNotifydate()
            ));
        } catch (RuntimeException exception) {
            String message = exception.getMessage();
            if ("ไม่พบข้อมูลคำขออนุมัติ".equals(message)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", message));
            }
            if (message != null && (message.contains("PENDING") || message.contains("ได้ส่งอีเมลแจ้งผล") || message.contains("ไปแล้ว"))) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", message));
            }
            if (message != null && (message.contains("ไม่ถูกต้อง") || message.contains("ไม่พบเหตุผล"))) {
                return ResponseEntity.badRequest().body(Map.of("message", message));
            }
            if ("การส่งล้มเหลว".equals(message) || (message != null && message.contains("เกิดข้อผิดพลาดในการบันทึกข้อมูล"))) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", message));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", message != null ? message : "การส่งล้มเหลว"));
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง"));
        }
    }

    // =========================
    // Helper Methods
    // =========================
    private String getLicenseId(AccountRequest request) {
        return request.getLicenseId();
    }

    private String maskEmail(String email) {
        if (email == null || email.isBlank() || !email.contains("@")) {
            return null;
        }

        String[] parts = email.split("@", 2);
        String username = parts[0];
        String maskedUsername;

        if (username.length() <= 2) {
            maskedUsername = username.charAt(0) + "***";
        } else {
            maskedUsername = username.substring(0, 2) + "***";
        }

        return maskedUsername + "@" + parts[1];
    }
}