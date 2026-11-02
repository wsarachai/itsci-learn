package com.example.wellness.controller;

import com.example.wellness.dto.OfficialArticleSummaryDTO;
import com.example.wellness.model.OfficialArticle;
import com.example.wellness.service.OfficialArticleService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/articles")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class OfficialArticleController {

    private final OfficialArticleService service;

    public OfficialArticleController(OfficialArticleService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<OfficialArticleSummaryDTO>> listOfficialArticle(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "category", required = false) String category) {
        return ResponseEntity.ok(service.listOfficialArticle(keyword, category));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> viewArticleDetail(@PathVariable Integer id) {
        OfficialArticle article = service.viewArticleDetail(id);
        if (article == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "ไม่พบข้อมูลบทความ"));
        }
        return ResponseEntity.ok(article);
    }

    @PostMapping
    public ResponseEntity<?> createOfficialArticle(
            @RequestBody OfficialArticle article,
            HttpServletRequest request) {
        try {
            HttpSession session = request.getSession(false);
            String adminUsername = session != null ? (String) session.getAttribute("adminUsername") : null;

            OfficialArticle saved = service.createOfficialArticle(article, adminUsername);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "สร้างบทความไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> editOfficialArticle(
            @PathVariable Integer id,
            @RequestBody OfficialArticle article) {
        try {
            OfficialArticle updated = service.editOfficialArticle(id, article);
            if (updated != null) {
                return ResponseEntity.ok(updated);
            }
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "ไม่พบข้อมูลบทความ"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "ไม่สามารถแก้ไขข้อมูลบทความได้ กรุณาลองใหม่อีกครั้ง"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteArticle(@PathVariable Integer id) {
        try {
            boolean result = service.deleteArticle(id);
            if (result) {
                return ResponseEntity.ok(Map.of("message", "ลบบทความสำเร็จ"));
            }
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "ไม่พบข้อมูลบทความ"));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "ไม่สามารถลบบทความได้ กรุณาลองอีกครั้ง"));
        }
    }
}