package com.example.wellness.controller;

import com.example.wellness.dto.PagedResult;
import com.example.wellness.dto.ResponseObject;
import com.example.wellness.dto.WellnessHubDTO;
import com.example.wellness.dto.WellnessHubSummaryDTO;
import com.example.wellness.model.WellnessHub;
import com.example.wellness.service.WellnessHubService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/wellness-hubs")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class WellnessHubController {

    private final WellnessHubService wellnessHubService;

    public WellnessHubController(
            WellnessHubService wellnessHubService) {
        this.wellnessHubService = wellnessHubService;
    }

    /*
     * =====================================================
     * ดึงรายการทั้งหมด
     * =====================================================
     *
     * Service จะรวมข้อมูลจาก:
     * - wellness_hubs
     * - emergency_services
     */
    @GetMapping
    public ResponseEntity<List<WellnessHubSummaryDTO>> listWellnessHub() {
        List<WellnessHubSummaryDTO> results = wellnessHubService.listWellnessHub();

        return ResponseEntity.ok(results);
    }

    /*
     * =====================================================
     * ค้นหาสถานประกอบการ
     * =====================================================
     *
     * รองรับทั้ง Wellness Hub และ Emergency Service
     */
    @PostMapping("/search")
    public ResponseEntity<List<WellnessHubSummaryDTO>> listWellnessHub(
            @RequestBody(required = false) Map<String, Object> payload) {
        List<WellnessHubSummaryDTO> results = wellnessHubService
                .listWellnessHub(payload);

        return ResponseEntity.ok(results);
    }

    /*
     * =====================================================
     * ดูรายละเอียดตามเลขใบอนุญาต
     * =====================================================
     *
     * Service จะตรวจทั้งสองตาราง
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> viewWellnessHubDetail(
            @PathVariable String id) {
        WellnessHub result = wellnessHubService.viewWellnessHubDetail(id);

        if (result == null) {
            return ResponseEntity
                    .notFound()
                    .build();
        }

        return ResponseEntity.ok(toResponseMap(result));
    }

    /*
     * =====================================================
     * สร้างรหัสและชื่อผู้ใช้งานอัตโนมัติสำหรับเพิ่มสถานประกอบการ
     * =====================================================
     */
    @GetMapping("/next-license-id")
    public ResponseEntity<?> getNextLicenseId() {
        String nextId = wellnessHubService.generateNextLicenseId();
        String username = "WH_" + nextId;
        return ResponseEntity.ok(Map.of(
                "licenseId", nextId,
                "username", username));
    }

    /*
     * =====================================================
     * สร้างสถานประกอบการ
     * =====================================================
     *
     * หมวดทั่วไป:
     * -> wellness_hubs
     *
     * EM01 / EM02:
     * -> emergency_services
     */
    @PostMapping
    public ResponseEntity<?> createWellnessHub(
            @RequestBody WellnessHub hub) {
        try {
            WellnessHub createdHub = wellnessHubService
                    .createWellnessHub(hub);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(toResponseMap(createdHub));

        } catch (IllegalArgumentException exception) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    exception.getMessage()));
        } catch (Exception exception) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(
                            Map.of(
                                    "message",
                                    "ไม่สามารถบันทึกข้อมูลสถานประกอบการได้ กรุณาลองใหม่อีกครั้ง"));
        }
    }

    /*
     * =====================================================
     * แก้ไขสถานประกอบการ
     * =====================================================
     *
     * รองรับ:
     * - Wellness -> Wellness
     * - Wellness -> Emergency
     * - Emergency -> Emergency
     * - Emergency -> Wellness
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> editWellnessHub(
            @PathVariable String id,
            @RequestBody WellnessHub hub,
            HttpServletRequest httpRequest) {
        try {
            HttpSession session = httpRequest.getSession(false);
            String adminUsername = session != null ? (String) session.getAttribute("adminUsername") : null;
            String providerLicenseId = session != null ? (String) session.getAttribute("providerLicenseId") : null;

            if (adminUsername == null && providerLicenseId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "กรุณาเข้าสู่ระบบ"));
            }

            boolean isProvider = (adminUsername == null && providerLicenseId != null);
            if (isProvider && !providerLicenseId.equals(id)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "ท่านไม่มีสิทธิ์จัดการข้อมูลสถานประกอบการนี้"));
            }

            WellnessHub updatedHub = wellnessHubService
                    .editWellnessHub(
                            id,
                            hub,
                            isProvider);

            if (updatedHub == null) {
                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(
                                Map.of(
                                        "message",
                                        "ไม่พบข้อมูลสถานประกอบการ"));
            }

            return ResponseEntity.ok(toResponseMap(updatedHub));

        } catch (IllegalArgumentException exception) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    exception.getMessage() != null && !exception.getMessage().trim().isEmpty()
                                            ? exception.getMessage()
                                            : "กรุณากรอกข้อมูลให้ถูกต้อง"));
        } catch (Exception exception) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(
                            Map.of(
                                    "message",
                                    exception.getMessage() != null && !exception.getMessage().trim().isEmpty()
                                            ? exception.getMessage()
                                            : "ไม่สามารถแก้ไขข้อมูลสถานประกอบการได้ กรุณาลองใหม่อีกครั้ง"));
        }
    }

    private Map<String, Object> toResponseMap(WellnessHub hub) {
        if (hub == null)
            return null;
        Map<String, Object> map = new java.util.LinkedHashMap<>();
        map.put("licenseId", hub.getLicenseId());
        String username = hub.getUsername();
        if (username == null || username.trim().isEmpty()) {
            boolean isEmer = hub.getCategory() != null && hub.getCategory().getCategoryId() != null
                    && ("EM01".equalsIgnoreCase(hub.getCategory().getCategoryId().trim())
                            || "EM02".equalsIgnoreCase(hub.getCategory().getCategoryId().trim()));
            username = (isEmer ? "ES_" : "WH_") + hub.getLicenseId();
        }
        map.put("username", username);
        map.put("password", hub.getPassword());
        map.put("wellnessHubName", hub.getWellnessHubName());
        map.put("address", hub.getAddress());
        map.put("contactInformation", hub.getContactInformation());
        map.put("googleMapsLink", hub.getGoogleMapsLink());
        map.put("telInformation", hub.getTelInformation());
        map.put("wellnessHubDescription", hub.getWellnessHubDescription());
        map.put("wellnessHubImg", hub.getWellnessHubImg());
        map.put("wellnessHubGallery", hub.getWellnessHubGallery());
        map.put("wellnessHubLatitude", hub.getWellnessHubLatitude());
        map.put("wellnessHubLongitude", hub.getWellnessHubLongitude());
        map.put("status", hub.getStatus());
        map.put("certificateType", hub.getCertificateType());
        map.put("category", hub.getCategory());
        map.put("district", hub.getDistrict());
        map.put("operatingHours", hub.getOperatingHours());
        map.put("createdAt", hub.getCreatedAt());
        map.put("updatedAt", hub.getUpdatedAt());
        return map;
    }

    /*
     * =====================================================
     * ปรับปรุงสถานะสถานประกอบการ (ระงับ / เปิดใช้งาน)
     * =====================================================
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        try {
            String status = body != null ? body.get("status") : null;
            if (status == null || status.trim().isEmpty()) {
                return ResponseEntity
                        .badRequest()
                        .body(Map.of("message", "กรุณาระบุสถานะ"));
            }

            boolean updated = wellnessHubService.updateStatus(id, status);

            if (!updated) {
                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "ไม่พบสถานประกอบการ หรือสถานะไม่ถูกต้อง"));
            }

            return ResponseEntity.ok(Map.of(
                    "message", "อัปเดตสถานะสถานประกอบการสำเร็จ",
                    "status", status.trim().toUpperCase()));

        } catch (RuntimeException exception) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", exception.getMessage()));
        }
    }

    /*
     * =====================================================
     * ลบสถานประกอบการ
     * =====================================================
     *
     * Service จะตรวจว่าอยู่ตารางใดแล้วลบให้ถูกต้อง
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable String id) {
        try {
            boolean deleted = wellnessHubService
                    .deleteWellnessHub(id);

            if (!deleted) {
                return ResponseEntity
                        .notFound()
                        .build();
            }

            return ResponseEntity
                    .noContent()
                    .build();

        } catch (RuntimeException exception) {
            return ResponseEntity
                    .status(
                            HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(
                            Map.of(
                                    "message",
                                    exception.getMessage()));
        }
    }

    /*
     * เปิดใช้ชั่วคราวเมื่อต้องการสั่ง Migration เอง
     *
     * หลัง Migration สำเร็จ ควรปิด Endpoint นี้
     */
    // @PostMapping("/migrate-old-links")
    // public ResponseEntity<Map<String, Object>> runMigration() {

    // wellnessHubService
    // .migrateOldGoogleMapsLinks();

    // return ResponseEntity.ok(
    // Map.of(
    // "status", "completed",
    // "message",
    // "ตรวจสอบและอัปเดตพิกัดเรียบร้อยแล้ว"));
    // }

    /*
     * 
     * =========== MOBILE ===================================
     * 
     */

    @GetMapping("/user")
    public ResponseEntity<ResponseObject> getAllWellnessHubs() {
        try {
            List<WellnessHubDTO> dtos = wellnessHubService.getWellnessHubs();
            return new ResponseEntity<>(new ResponseObject(true, "ดึงข้อมูลสถานประกอบการทั้งหมดสำเร็จ", dtos),
                    HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(new ResponseObject(false, "เกิดข้อผิดพลาดในการดึงข้อมูล", null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 2. ดึงข้อมูลรายร้านตาม ID
    @GetMapping("/user/{id}")
    public ResponseEntity<ResponseObject> getWellnessHubDetail(@PathVariable String id) {
        try {
            WellnessHubDTO dto = wellnessHubService.getWellnessHubDetail(id);
            return new ResponseEntity<>(new ResponseObject(true, "ดึงข้อมูลสถานประกอบการรหัส " + id + " สำเร็จ", dto),
                    HttpStatus.OK);
        } catch (Exception e) {
            if (e instanceof NoSuchElementException) {
                return new ResponseEntity<>(new ResponseObject(false, "ไม่พบข้อมูลสถานประกอบการที่ระบุ", null),
                        HttpStatus.NOT_FOUND);
            }
            return new ResponseEntity<>(new ResponseObject(false, "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์", null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ✅ เปลี่ยนเป็น DTO เหมือน endpoint อื่น
    // แทนที่ /search เดิม หรือเพิ่ม endpoint ใหม่
    @GetMapping("/search")
    public ResponseEntity<ResponseObject> searchHubs(
            @RequestParam(required = false, defaultValue = "") String keyword,
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) Integer districtId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        try {
            PagedResult result = wellnessHubService
                    .searchWellnessHub(keyword, categoryId, districtId, page, size);
            return new ResponseEntity<>(
                    new ResponseObject(true, "ค้นหาสำเร็จ", result),
                    HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(
                    new ResponseObject(false, "เกิดข้อผิดพลาดในการค้นหา", null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }



    @GetMapping("/route")
    public ResponseEntity<PagedResult> getHubsForRoute(
            @RequestParam Integer originId,
            @RequestParam Integer destId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PagedResult result = wellnessHubService.getHubsAlongRoute(originId, destId, page, size);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/by-districts")
    public ResponseEntity<?> getHubsByDistricts(
            @RequestParam String districtId,
            @RequestParam(required = false) String categoryId) {
        try {
            List<Integer> ids = Arrays.stream(districtId.split(","))
                    .map(Integer::parseInt)
                    .collect(Collectors.toList());

            List<String> catIds = (categoryId != null && !categoryId.isEmpty())
                    ? Arrays.asList(categoryId.split(","))
                    : null;

            List<WellnessHubDTO> result = wellnessHubService
                    .getHubsByDistricts(ids, catIds);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("เกิดข้อผิดพลาด: " + e.getMessage());
        }
    }
}