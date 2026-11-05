package com.example.wellness.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@Service
@Slf4j
public class SupabaseStorageService {

    @Value("${supabase.url:https://csljpnypebwjgvoygqov.supabase.co}")
    private String supabaseUrl;

    @Value("${supabase.key:sb_publishable_iPzf-LZQfAiXoWK-HRfpMg_P7WHBfPS}")
    private String supabaseKey;

    @Value("${supabase.bucket:WELLNESS-IMAGES}")
    private String supabaseBucket;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * อัปโหลดไบนารีไฟล์ตรงไปยัง Supabase Storage Bucket
     * @param bytes ข้อมูลไฟล์ในรูปแบบไบต์
     * @param contentType MIME type เช่น image/jpeg, image/png
     * @param folder โฟลเดอร์ปลายทาง เช่น articles, wellness_hubs, documents
     * @param filename ชื่อไฟล์ปลายทาง
     * @return Public URL ของไฟล์บน Supabase Storage
     */
    public String uploadBytes(byte[] bytes, String contentType, String folder, String filename) {
        if (bytes == null || bytes.length == 0) {
            return null;
        }

        String cleanFolder = (folder != null && !folder.trim().isEmpty()) ? folder.trim() + "/" : "";
        String objectPath = cleanFolder + filename;
        String uploadUrl = supabaseUrl + "/storage/v1/object/" + supabaseBucket + "/" + objectPath;

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("apikey", supabaseKey);
            headers.set("Authorization", "Bearer " + supabaseKey);
            headers.setContentType(MediaType.parseMediaType(contentType != null ? contentType : "image/jpeg"));

            HttpEntity<byte[]> requestEntity = new HttpEntity<>(bytes, headers);
            ResponseEntity<String> response = restTemplate.exchange(uploadUrl, HttpMethod.POST, requestEntity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                String publicUrl = supabaseUrl + "/storage/v1/object/public/" + supabaseBucket + "/" + objectPath;
                log.info("✅ Uploaded file to Supabase Storage: {}", publicUrl);
                return publicUrl;
            } else {
                throw new RuntimeException("Supabase upload returned status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("❌ Failed to upload file to Supabase Storage: {}", e.getMessage());
            throw new RuntimeException("ไม่สามารถบันทึกไฟล์ลง Supabase Storage: " + e.getMessage(), e);
        }
    }

    /**
     * อัปโหลด Base64 Data URL หรือคืนค่าเดิมหากเป็น URL อยู่แล้ว
     * @param base64OrUrl สตริงรูปภาพ (Base64 data URL หรือ Public URL)
     * @param folder โฟลเดอร์ปลายทาง
     * @return Public URL
     */
    public String uploadBase64OrReturnUrl(String base64OrUrl, String folder) {
        if (base64OrUrl == null || base64OrUrl.trim().isEmpty()) {
            return null;
        }

        String trimmed = base64OrUrl.trim();

        // หากเป็น URL เดิมอยู่แล้ว ไม่ต้องอัปโหลดซ้ำ
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/uploads/")) {
            return trimmed;
        }

        // ตรวจสอบรูปแบบ Base64 Data URL เช่น data:image/png;base64,....
        String contentType = "image/jpeg";
        String extension = ".jpg";
        String base64Content = trimmed;

        if (trimmed.startsWith("data:")) {
            int commaIndex = trimmed.indexOf(',');
            if (commaIndex != -1) {
                String header = trimmed.substring(5, commaIndex);
                if (header.contains(";")) {
                    contentType = header.split(";")[0];
                }
                base64Content = trimmed.substring(commaIndex + 1);
            }
        }

        // ตรวจหานามสกุลไฟล์จาก MIME Type (เฉพาะ .png, .jpg, .jpeg และ .pdf สำหรับเอกสารยืนยันสิทธิ์)
        String lowerMime = contentType.toLowerCase();
        if (lowerMime.contains("png")) {
            extension = ".png";
            contentType = "image/png";
        } else if (lowerMime.contains("jpeg") || lowerMime.contains("jpg")) {
            extension = ".jpg";
            contentType = "image/jpeg";
        } else if (lowerMime.contains("pdf")) {
            extension = ".pdf";
            contentType = "application/pdf";
        } else {
            throw new IllegalArgumentException("ต้องเป็นไฟล์รูปภาพนามสกุล .png, .jpg และ .jpeg เท่านั้น");
        }

        try {
            byte[] decoded = Base64.getDecoder().decode(base64Content.replaceAll("\\s+", ""));
            long maxBytes = extension.equals(".pdf") ? (10L * 1024L * 1024L) : (20L * 1024L * 1024L);
            if (decoded.length > maxBytes) {
                long maxMb = maxBytes / (1024 * 1024);
                throw new IllegalArgumentException("ขนาดไฟล์ต้องไม่เกิน " + maxMb + " MB");
            }
            String filename = UUID.randomUUID() + extension;
            return uploadBytes(decoded, contentType, folder, filename);
        } catch (IllegalArgumentException e) {
            if (e.getMessage() != null && (e.getMessage().contains("ต้องเป็นไฟล์") || e.getMessage().contains("ขนาดไฟล์"))) {
                throw e;
            }
            log.warn("Invalid base64 string, keeping raw value: {}", e.getMessage());
            return trimmed;
        }
    }

    /**
     * อัปโหลด Gallery ที่เป็น JSON Array ของ Base64 หรือ URLs
     * @param galleryJson JSON String array เช่น ["data:...", "https://..."]
     * @param folder โฟลเดอร์ปลายทาง
     * @return JSON String ของ URLs
     */
    public String uploadGalleryBase64OrReturnUrl(String galleryJson, String folder) {
        if (galleryJson == null || galleryJson.trim().isEmpty()) {
            return null;
        }

        String trimmed = galleryJson.trim();
        if (!trimmed.startsWith("[")) {
            // กรณีเป็น Base64 เดี่ยวๆ หรือ URL เดียว
            String url = uploadBase64OrReturnUrl(trimmed, folder);
            return url != null ? "[\"" + url + "\"]" : null;
        }

        try {
            List<Object> rawList = objectMapper.readValue(trimmed, new TypeReference<List<Object>>() {});
            List<String> uploadedUrls = new ArrayList<>();

            for (Object item : rawList) {
                if (item == null) continue;
                String itemStr = item.toString().trim();
                String url = uploadBase64OrReturnUrl(itemStr, folder);
                if (url != null) {
                    uploadedUrls.add(url);
                }
            }

            return objectMapper.writeValueAsString(uploadedUrls);
        } catch (Exception e) {
            log.warn("Failed to parse gallery JSON, handling as single: {}", e.getMessage());
            String singleUrl = uploadBase64OrReturnUrl(trimmed, folder);
            return singleUrl;
        }
    }

    /**
     * อัปโหลดรายการเอกสารยืนยันสิทธิ์ที่เป็น JSON Array ของ Objects [{type, name, data}] ไปยัง Supabase Storage
     * @param docsJson JSON String array เช่น [{"type":"...", "name":"...", "data":"data:..."}]
     * @param folder โฟลเดอร์ปลายทาง เช่น documents
     * @return JSON String ที่ data ถูกแทนที่ด้วย Supabase Public URLs
     */
    public String uploadVerificationDocumentsJsonOrReturnUrl(String docsJson, String folder) {
        if (docsJson == null || docsJson.trim().isEmpty()) {
            return null;
        }

        String trimmed = docsJson.trim();
        if (!trimmed.startsWith("[")) {
            // กรณีเป็น Base64 เดี่ยวๆ หรือ URL เดียว
            return uploadBase64OrReturnUrl(trimmed, folder);
        }

        try {
            List<Map<String, Object>> list = objectMapper.readValue(trimmed, new TypeReference<List<Map<String, Object>>>() {});
            List<Map<String, Object>> resultList = new ArrayList<>();

            for (Map<String, Object> doc : list) {
                if (doc == null) continue;
                Map<String, Object> newDoc = new LinkedHashMap<>(doc);
                Object dataObj = doc.get("data");
                if (dataObj != null && !dataObj.toString().trim().isEmpty()) {
                    String uploadedUrl = uploadBase64OrReturnUrl(dataObj.toString().trim(), folder);
                    newDoc.put("data", uploadedUrl);
                }
                resultList.add(newDoc);
            }

            return objectMapper.writeValueAsString(resultList);
        } catch (Exception e) {
            log.warn("Failed to process verification documents JSON, handling as raw/single: {}", e.getMessage());
            return uploadBase64OrReturnUrl(trimmed, folder);
        }
    }



    /**
     * ลบไฟล์ออกจาก Supabase Storage Bucket ตาม Public URL
     * @param publicUrl URL เต็มของไฟล์บน Supabase Storage
     * @return true หากลบสำเร็จ
     */
    public boolean deleteFile(String publicUrl) {
        if (publicUrl == null || publicUrl.trim().isEmpty()) {
            return false;
        }

        String marker = "/storage/v1/object/public/" + supabaseBucket + "/";
        if (publicUrl.contains(marker)) {
            try {
                int idx = publicUrl.indexOf(marker);
                String objectPath = publicUrl.substring(idx + marker.length());
                String deleteUrl = supabaseUrl + "/storage/v1/object/" + supabaseBucket;

                HttpHeaders headers = new HttpHeaders();
                headers.set("apikey", supabaseKey);
                headers.set("Authorization", "Bearer " + supabaseKey);
                headers.setContentType(MediaType.APPLICATION_JSON);

                Map<String, Object> body = Collections.singletonMap("prefixes", Collections.singletonList(objectPath));
                HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);

                ResponseEntity<String> response = restTemplate.exchange(deleteUrl, HttpMethod.DELETE, requestEntity, String.class);
                if (response.getStatusCode().is2xxSuccessful()) {
                    log.info("🗑️ Deleted file from Supabase Storage: {}", objectPath);
                    return true;
                }
            } catch (Exception e) {
                log.warn("⚠️ Failed to delete file from Supabase {}: {}", publicUrl, e.getMessage());
            }
            return false;
        }

        try {
            String pathStr = publicUrl.trim();
            if (pathStr.startsWith("/uploads/")) {
                pathStr = pathStr.substring("/uploads/".length());
            } else if (pathStr.contains("/uploads/")) {
                pathStr = pathStr.substring(pathStr.indexOf("/uploads/") + "/uploads/".length());
            } else {
                return false;
            }
            java.nio.file.Path fileToDelete = java.nio.file.Paths.get("uploads", pathStr);
            boolean deleted = java.nio.file.Files.deleteIfExists(fileToDelete);
            if (deleted) {
                log.info("🗑️ Deleted file from local storage: {}", pathStr);
                return true;
            }
        } catch (Exception e) {
            log.warn("⚠️ Failed to delete file locally {}: {}", publicUrl, e.getMessage());
        }
        return false;
    }

    /**
     * ลบไฟล์หลายรายการออกจาก Supabase Storage
     * @param publicUrls รายการ URL ที่ต้องการลบ
     */
    public void deleteFiles(Collection<String> publicUrls) {
        if (publicUrls == null || publicUrls.isEmpty()) {
            return;
        }
        for (String url : publicUrls) {
            deleteFile(url);
        }
    }

    /**
     * สกัดรายการ Supabase Public URLs จาก JSON Array หรือ String เดี่ยว
     * @param jsonOrUrl ข้อความ URL หรือ JSON String
     * @return รายการ URL ของ Supabase ทั้งหมดที่พบ
     */
    public List<String> extractSupabaseUrls(String jsonOrUrl) {
        if (jsonOrUrl == null || jsonOrUrl.trim().isEmpty()) {
            return Collections.emptyList();
        }
        List<String> urls = new ArrayList<>();
        String marker = "/storage/v1/object/public/" + supabaseBucket + "/";
        String trimmed = jsonOrUrl.trim();
        if (!trimmed.startsWith("[")) {
            if (trimmed.contains(marker) || trimmed.startsWith("/uploads/")) {
                urls.add(trimmed);
            }
            return urls;
        }
        try {
            List<?> list = objectMapper.readValue(trimmed, List.class);
            for (Object item : list) {
                if (item instanceof String str && (str.contains(marker) || str.startsWith("/uploads/"))) {
                    urls.add(str);
                } else if (item instanceof Map<?, ?> map) {
                    Object data = map.get("data");
                    if (data != null && (data.toString().contains(marker) || data.toString().startsWith("/uploads/"))) {
                        urls.add(data.toString().trim());
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return urls;
    }

    /**
     * อัปโหลดไฟล์ MultipartFile ตรงไปยัง Supabase Storage Bucket
     * ตรวจสอบชนิดไฟล์ (เฉพาะ .png, .jpg, .jpeg) และขนาดไฟล์ไม่เกิน 20 MB
     * @param file ไฟล์ที่รับมาจาก Request
     * @param folder โฟลเดอร์ปลายทาง เช่น routes, articles
     * @return Public URL ของไฟล์บน Supabase Storage
     */
    public String uploadMultipartFile(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        // ตรวจสอบขนาดไฟล์ไม่เกิน 20 MB
        long maxBytes = 20L * 1024L * 1024L;
        if (file.getSize() > maxBytes) {
            throw new IllegalArgumentException("ขนาดไฟล์รูปภาพต้องไม่เกิน 20 MB");
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename().trim() : "";
        String extension = "";
        int dot = originalFilename.lastIndexOf('.');
        if (dot >= 0) {
            extension = originalFilename.substring(dot).toLowerCase();
        }

        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase() : "";

        boolean isAllowedExt = extension.equals(".png") || extension.equals(".jpg") || extension.equals(".jpeg");
        boolean isAllowedMime = contentType.equals("image/jpeg") || contentType.equals("image/jpg") || contentType.equals("image/png");

        if (!isAllowedExt && !isAllowedMime) {
            throw new IllegalArgumentException("ต้องเป็นไฟล์รูปภาพนามสกุล .png, .jpg และ .jpeg เท่านั้น");
        }

        // ปรับจูนนามสกุลและ MIME Type ให้ตรงกัน
        if (extension.equals(".png") || contentType.equals("image/png")) {
            extension = ".png";
            contentType = "image/png";
        } else {
            extension = ".jpg";
            contentType = "image/jpeg";
        }

        String filename = UUID.randomUUID() + extension;
        try {
            return uploadBytes(file.getBytes(), contentType, folder, filename);
        } catch (IOException e) {
            throw new RuntimeException("ไม่สามารถอ่านข้อมูลไบต์ของไฟล์: " + e.getMessage(), e);
        }
    }
}
