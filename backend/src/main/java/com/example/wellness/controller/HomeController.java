package com.example.wellness.controller;

import com.example.wellness.dto.OfficialArticleSummaryDTO;
import com.example.wellness.model.MainRoute;
import com.example.wellness.model.OfficialArticle;
import com.example.wellness.service.HomeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/home")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class HomeController {

    private final HomeService homeService;

    /*
     * Constructor Injection
     * Spring จะนำ HomeService มาใส่ให้อัตโนมัติ
     * ไม่จำเป็นต้องใช้ @Autowired
     */
    public HomeController(HomeService homeService) {
        this.homeService = homeService;
    }

    /*
     * =====================================================
     * API ดึงข้อมูลทั้งหมดสำหรับหน้า Home
     * =====================================================
     *
     * GET /api/home
     *
     * ส่งกลับ:
     * - recommendedRoutes
     * - latestArticles
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getHomeData() {
        Map<String, Object> homeData = homeService.getHomeData();
        return ResponseEntity.ok(homeData);
    }

    @GetMapping("/search")
    public ResponseEntity<?> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "ALL") String type) {
        try {
            Map<String, Object> result = homeService.search(q, type);

            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException exception) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    exception.getMessage()));
        }
    }

    /*
     * =====================================================
     * API ดึงเฉพาะเส้นทางแนะนำ
     * =====================================================
     *
     * GET /api/home/recommended-routes
     */
    @GetMapping("/recommended-routes")
    public ResponseEntity<List<Map<String, Object>>> getRecommendedRoutes() {
        List<Map<String, Object>> recommendedRoutes = homeService.getRecommendedRoutes();
        return ResponseEntity.ok(recommendedRoutes);
    }

    /*
     * =====================================================
     * API ดึงเฉพาะบทความล่าสุด
     * =====================================================
     *
     * GET /api/home/latest-articles
     */
    @GetMapping("/latest-articles")
    public ResponseEntity<List<OfficialArticleSummaryDTO>> getLatestArticles() {
        List<OfficialArticleSummaryDTO> latestArticles = homeService.getLatestArticles();
        return ResponseEntity.ok(latestArticles);
    }

    /*
     * =====================================================
     * API ดึงเส้นทางทั้งหมด
     * =====================================================
     *
     * GET /api/home/routes
     */
    @GetMapping("/routes")
    public ResponseEntity<List<Map<String, Object>>> getAllRoutes() {
        List<Map<String, Object>> routes = homeService.getAllRoutes();
        return ResponseEntity.ok(routes);
    }

    /*
     * =====================================================
     * API ดึงบทความทั้งหมด
     * =====================================================
     *
     * GET /api/home/articles
     */
    @GetMapping("/articles")
    public ResponseEntity<List<OfficialArticleSummaryDTO>> getAllArticles() {
        List<OfficialArticleSummaryDTO> articles = homeService.getAllArticles();
        return ResponseEntity.ok(articles);
    }

    /*
     * =====================================================
     * API ดึงรายละเอียดเส้นทางท่องเที่ยว
     * =====================================================
     *
     * GET /api/home/routes/{routeId}
     */
    @GetMapping("/routes/{routeId}")
    public ResponseEntity<?> getRouteDetail(
            @PathVariable Integer routeId) {
        if (routeId == null || routeId <= 0) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    "รหัสเส้นทางไม่ถูกต้อง"));
        }

        Map<String, Object> routeDetail = homeService.getRouteDetail(routeId);

        if (routeDetail == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(
                            Map.of(
                                    "message",
                                    "ไม่พบข้อมูลเส้นทาง"));
        }

        return ResponseEntity.ok(routeDetail);
    }

    /*
     * =====================================================
     * API ดึงรายละเอียดสถานประกอบการ
     * =====================================================
     *
     * GET /api/home/wellness-hubs/{licenseId}
     */
    @GetMapping("/wellness-hubs/{licenseId}")
    public ResponseEntity<?> getWellnessHubDetail(
            @PathVariable String licenseId) {
        if (licenseId == null || licenseId.trim().isEmpty()) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    "รหัสสถานประกอบการไม่ถูกต้อง"));
        }

        Map<String, Object> wellnessHub = homeService.getWellnessHubDetail(licenseId);

        if (wellnessHub == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(
                            Map.of(
                                    "message",
                                    "ไม่พบข้อมูลสถานประกอบการ"));
        }

        return ResponseEntity.ok(wellnessHub);
    }
}