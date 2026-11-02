package com.example.wellness.service;

import com.example.wellness.dto.OfficialArticleSummaryDTO;
import com.example.wellness.model.OfficialArticle;
import com.example.wellness.repository.OfficialArticleRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
public class OfficialArticleService {

    private static final Set<String> ALLOWED_CATEGORIES = Set.of(
            "ข่าวประชาสัมพันธ์",
            "กิจกรรมสุขภาพ",
            "โปรโมชั่น",
            "บทความสุขภาพ"
    );

    private final OfficialArticleRepository repository;
    private final SupabaseStorageService supabaseStorageService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public OfficialArticleService(OfficialArticleRepository repository, SupabaseStorageService supabaseStorageService) {
        this.repository = repository;
        this.supabaseStorageService = supabaseStorageService;
    }

    public List<OfficialArticleSummaryDTO> listOfficialArticle() {
        return listOfficialArticle(null, null);
    }

    // ดึงบทความทั้งหมด หรือค้นหาตามเงื่อนไขที่ DB ด้วย DTO projection
    public List<OfficialArticleSummaryDTO> listOfficialArticle(String keyword, String category) {
        String trimmedKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        String trimmedCategory = (category != null && !category.trim().isEmpty()) ? category.trim() : null;

        if (trimmedKeyword == null && trimmedCategory == null) {
            return repository.findAllSummaries();
        } else {
            return repository.searchArticleSummaries(trimmedKeyword, trimmedCategory);
        }
    }

    // ดึงตาม id
    public OfficialArticle viewArticleDetail(Integer id) {
        return repository.findById(id).orElse(null);
    }

    // สร้างบทความใหม่
    @Transactional
    public OfficialArticle createOfficialArticle(OfficialArticle article, String currentAdminUsername) {
        if (article == null) {
            throw new IllegalArgumentException("กรุณาระบุข้อมูลบทความ");
        }

        // 1. articleTitle: required, 10–100 ตัว (สามารถมีอักขระพิเศษได้)
        if (article.getArticleTitle() == null || article.getArticleTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("กรุณาระบุหัวข้อบทความ");
        }
        String title = article.getArticleTitle().trim();
        if (title.length() < 10 || title.length() > 100) {
            throw new IllegalArgumentException("หัวข้อบทความต้องมีความยาว 10-100 ตัวอักษร");
        }
        article.setArticleTitle(title);

        // 2. articleDetail: required, 50–2,500 ตัว
        if (article.getArticleDetail() == null || article.getArticleDetail().trim().isEmpty()) {
            throw new IllegalArgumentException("กรุณาระบุรายละเอียดบทความ");
        }
        String plainDetail = extractPlainText(article.getArticleDetail());
        if (plainDetail.length() < 50 || plainDetail.length() > 2500) {
            throw new IllegalArgumentException("รายละเอียดบทความต้องมีความยาว 50-2,500 ตัวอักษร");
        }

        // 3. articleCategory: ต้องเป็นค่าที่ระบบกำหนด
        if (article.getArticleCategory() == null || article.getArticleCategory().trim().isEmpty()) {
            article.setArticleCategory("ข่าวประชาสัมพันธ์");
        } else {
            String category = article.getArticleCategory().trim();
            if (!ALLOWED_CATEGORIES.contains(category)) {
                throw new IllegalArgumentException("หมวดหมู่บทความไม่ถูกต้อง");
            }
            article.setArticleCategory(category);
        }

        // 4. Validate images (optional, png/jpg/jpeg, <=20MB, total <= 5)
        validateImages(article.getImg(), article.getArticleImages());

        // 4.1 Upload images to Supabase Storage
        if (article.getImg() != null && !article.getImg().trim().isEmpty()) {
            article.setImg(supabaseStorageService.uploadBase64OrReturnUrl(article.getImg(), "articles"));
        }
        if (article.getArticleImages() != null && !article.getArticleImages().trim().isEmpty()) {
            article.setArticleImages(supabaseStorageService.uploadGalleryBase64OrReturnUrl(article.getArticleImages(), "articles"));
        }

        // 5. author: ใช้ adminUsername จาก Session
        if (currentAdminUsername != null && !currentAdminUsername.trim().isEmpty()) {
            article.setAuthor(currentAdminUsername.trim());
        } else if (article.getAuthor() == null || article.getAuthor().trim().isEmpty()) {
            article.setAuthor("Admin");
        }

        // 6. publishDate: กำหนดโดยระบบ
        article.setPublishDate(LocalDateTime.now());

        return repository.save(article);
    }

    // แก้ไขบทความ
    @Transactional
    public OfficialArticle editOfficialArticle(Integer id, OfficialArticle data) {
        if (data == null) {
            throw new IllegalArgumentException("กรุณาระบุข้อมูลบทความ");
        }

        OfficialArticle oldArticle = repository.findById(id).orElse(null);
        if (oldArticle == null) {
            return null;
        }

        // 1. articleTitle: required 10–100 ตัว (สามารถมีอักขระพิเศษได้)
        if (data.getArticleTitle() == null || data.getArticleTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("กรุณาระบุหัวข้อบทความ");
        }
        String title = data.getArticleTitle().trim();
        if (title.length() < 10 || title.length() > 100) {
            throw new IllegalArgumentException("หัวข้อบทความต้องมีความยาว 10-100 ตัวอักษร");
        }
        oldArticle.setArticleTitle(title);

        // 2. articleDetail: required 20–2,500 ตัว
        if (data.getArticleDetail() == null || data.getArticleDetail().trim().isEmpty()) {
            throw new IllegalArgumentException("กรุณาระบุรายละเอียดบทความ");
        }
        String plainDetail = extractPlainText(data.getArticleDetail());
        if (plainDetail.length() < 20 || plainDetail.length() > 2500) {
            throw new IllegalArgumentException("รายละเอียดบทความต้องมีความยาว 20-2,500 ตัวอักษร");
        }
        oldArticle.setArticleDetail(data.getArticleDetail());

        // 3. articleCategory: ถ้าส่งมาใหม่ให้ตรวจสอบความถูกต้องแล้วอัปเดต ถ้าไม่ส่งมาให้คงหมวดหมู่เดิมไว้
        if (data.getArticleCategory() != null && !data.getArticleCategory().trim().isEmpty()) {
            String category = data.getArticleCategory().trim();
            if (!ALLOWED_CATEGORIES.contains(category)) {
                throw new IllegalArgumentException("หมวดหมู่บทความไม่ถูกต้อง");
            }
            oldArticle.setArticleCategory(category);
        }

        // 4. Validate images (รูปรวมเก่า + ใหม่ <= 5 รูป)
        validateImages(data.getImg(), data.getArticleImages());

        // 5. Images: ถ้าส่งรูปมา ให้อัปเดตไปยัง Supabase Storage หากไม่ส่งหรือว่าง ให้คงรูปเดิมไว้
        if (data.getImg() != null && !data.getImg().trim().isEmpty()) {
            oldArticle.setImg(supabaseStorageService.uploadBase64OrReturnUrl(data.getImg(), "articles"));
        }
        if (data.getArticleImages() != null && !data.getArticleImages().trim().isEmpty()) {
            oldArticle.setArticleImages(supabaseStorageService.uploadGalleryBase64OrReturnUrl(data.getArticleImages(), "articles"));
        }

        // 6. publishDate: อัปเดตเป็นเวลาปัจจุบันเมื่อมีการแก้ไข เพื่อให้แสดงอยู่บนสุดของรายการ
        oldArticle.setPublishDate(LocalDateTime.now());

        return repository.save(oldArticle);
    }

    // ลบ
    @Transactional
    public boolean deleteArticle(Integer id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return true;
        }
        return false;
    }

    private String extractPlainText(String html) {
        if (html == null) return "";
        return html.replaceAll("<[^>]*>", "").replaceAll("&nbsp;", " ").trim();
    }

    private void validateImages(String coverImg, String galleryJson) {
        int totalImages = 0;
        if (coverImg != null && !coverImg.trim().isEmpty()) {
            totalImages++;
            validateSingleImage(coverImg);
        }
        if (galleryJson != null && !galleryJson.trim().isEmpty()) {
            try {
                List<String> gallery = objectMapper.readValue(galleryJson, new TypeReference<List<String>>() {});
                if (gallery != null) {
                    totalImages += gallery.size();
                    for (String img : gallery) {
                        validateSingleImage(img);
                    }
                }
            } catch (Exception e) {
                // Ignore parse error
            }
        }
        if (totalImages > 5) {
            throw new IllegalArgumentException("รูปภาพรวมทั้งหมดต้องไม่เกิน 5 รูป");
        }
    }

    private void validateSingleImage(String imgStr) {
        if (imgStr == null || imgStr.trim().isEmpty()) return;
        // 20MB Base64 string limit is approx 28MB
        if (imgStr.length() > 28 * 1024 * 1024) {
            throw new IllegalArgumentException("ขนาดไฟล์รูปภาพต้องไม่เกิน 20 MB");
        }
        if (imgStr.startsWith("data:")) {
            if (!imgStr.startsWith("data:image/png") && !imgStr.startsWith("data:image/jpeg") && !imgStr.startsWith("data:image/jpg")) {
                throw new IllegalArgumentException("ต้องเป็นไฟล์รูปภาพนามสกุล .png, .jpg และ .jpeg เท่านั้น");
            }
        }
    }
}