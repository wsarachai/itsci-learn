package com.example.wellness.service;

import com.example.wellness.model.*;
import com.example.wellness.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
// @RequiredArgsConstructor
@Slf4j
public class StorageMigrationService {

    private final SupabaseStorageService supabaseStorageService;
    private final OfficialArticleRepository officialArticleRepository;
    private final WellnessHubRepository wellnessHubRepository;
    private final EmergencyServiceRepository emergencyServiceRepository;
    private final AccountRequestRepository accountRequestRepository;

    public StorageMigrationService(
            SupabaseStorageService supabaseStorageService,
            OfficialArticleRepository officialArticleRepository,
            WellnessHubRepository wellnessHubRepository,
            EmergencyServiceRepository emergencyServiceRepository,
            AccountRequestRepository accountRequestRepository) {
        this.supabaseStorageService = supabaseStorageService;
        this.officialArticleRepository = officialArticleRepository;
        this.wellnessHubRepository = wellnessHubRepository;
        this.emergencyServiceRepository = emergencyServiceRepository;
        this.accountRequestRepository = accountRequestRepository;
    }

    /**
     * ดำเนินการย้ายรูปภาพ Base64 เดิมทั้งหมดในฐานข้อมูลขึ้น Supabase Storage
     * และอัปเดต Public URL กลับลงตาราง
     */
    @Transactional
    public Map<String, Object> migrateAllBase64Images() {
        log.info("🚀 Starting Base64 to Supabase Storage migration...");

        int migratedArticles = migrateOfficialArticles();
        int migratedHubs = migrateWellnessHubs();
        int migratedEmergency = migrateEmergencyServices();
        int migratedRequests = migrateAccountRequests();

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("status", "SUCCESS");
        report.put("message", "ย้ายรูปภาพ Base64 ไปยัง Supabase Storage สำเร็จเรียบร้อยแล้ว");
        report.put("officialArticlesUpdated", migratedArticles);
        report.put("wellnessHubsUpdated", migratedHubs);
        report.put("emergencyServicesUpdated", migratedEmergency);
        report.put("accountRequestsUpdated", migratedRequests);
        report.put("totalUpdated", migratedArticles + migratedHubs + migratedEmergency + migratedRequests);

        log.info("🏁 Migration completed successfully! Report: {}", report);
        return report;
    }

    private int migrateOfficialArticles() {
        List<OfficialArticle> articles = officialArticleRepository.findAll();
        int count = 0;

        for (OfficialArticle article : articles) {
            boolean updated = false;

            if (isBase64(article.getImg())) {
                String url = supabaseStorageService.uploadBase64OrReturnUrl(article.getImg(), "articles");
                article.setImg(url);
                updated = true;
            }

            if (hasBase64(article.getArticleImages())) {
                String galleryUrls = supabaseStorageService.uploadGalleryBase64OrReturnUrl(article.getArticleImages(), "articles");
                article.setArticleImages(galleryUrls);
                updated = true;
            }

            if (updated) {
                officialArticleRepository.save(article);
                count++;
            }
        }
        return count;
    }

    private int migrateWellnessHubs() {
        List<WellnessHub> hubs = wellnessHubRepository.findAll();
        int count = 0;

        for (WellnessHub hub : hubs) {
            boolean updated = false;

            if (isBase64(hub.getWellnessHubImg())) {
                String url = supabaseStorageService.uploadBase64OrReturnUrl(hub.getWellnessHubImg(), "wellness_hubs");
                hub.setWellnessHubImg(url);
                updated = true;
            }

            if (hasBase64(hub.getWellnessHubGallery())) {
                String galleryUrls = supabaseStorageService.uploadGalleryBase64OrReturnUrl(hub.getWellnessHubGallery(), "wellness_hubs");
                hub.setWellnessHubGallery(galleryUrls);
                updated = true;
            }

            if (updated) {
                wellnessHubRepository.save(hub);
                count++;
            }
        }
        return count;
    }

    private int migrateEmergencyServices() {
        List<EmergencyService> services = emergencyServiceRepository.findAll();
        int count = 0;

        for (EmergencyService service : services) {
            boolean updated = false;

            if (isBase64(service.getWellnessHubImg())) {
                String url = supabaseStorageService.uploadBase64OrReturnUrl(service.getWellnessHubImg(), "wellness_hubs");
                service.setWellnessHubImg(url);
                updated = true;
            }

            if (hasBase64(service.getWellnessHubGallery())) {
                String galleryUrls = supabaseStorageService.uploadGalleryBase64OrReturnUrl(service.getWellnessHubGallery(), "wellness_hubs");
                service.setWellnessHubGallery(galleryUrls);
                updated = true;
            }

            if (updated) {
                emergencyServiceRepository.save(service);
                count++;
            }
        }
        return count;
    }

    private int migrateAccountRequests() {
        List<AccountRequest> requests = accountRequestRepository.findAll();
        int count = 0;

        for (AccountRequest request : requests) {
            boolean updated = false;

            if (isBase64(request.getWellnessHubImg())) {
                String url = supabaseStorageService.uploadBase64OrReturnUrl(request.getWellnessHubImg(), "wellness_hubs");
                request.setWellnessHubImg(url);
                updated = true;
            }

            if (hasBase64(request.getWellnessHubGallery())) {
                String galleryUrls = supabaseStorageService.uploadGalleryBase64OrReturnUrl(request.getWellnessHubGallery(), "wellness_hubs");
                request.setWellnessHubGallery(galleryUrls);
                updated = true;
            }

            if (isBase64(request.getVerificationDocuments())) {
                String docUrl = supabaseStorageService.uploadBase64OrReturnUrl(request.getVerificationDocuments(), "documents");
                request.setVerificationDocuments(docUrl);
                updated = true;
            }

            if (updated) {
                accountRequestRepository.save(request);
                count++;
            }
        }
        return count;
    }

    private boolean isBase64(String value) {
        if (value == null || value.trim().isEmpty()) {
            return false;
        }
        String trimmed = value.trim();
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/uploads/")) {
            return false;
        }
        return trimmed.startsWith("data:") || trimmed.length() > 200;
    }

    private boolean hasBase64(String value) {
        if (value == null || value.trim().isEmpty()) {
            return false;
        }
        String trimmed = value.trim();
        return trimmed.contains("data:") || isBase64(trimmed);
    }
}
