package com.example.wellness.service;

import com.example.wellness.dto.PagedResult;
import com.example.wellness.dto.WellnessHubDTO;
import com.example.wellness.dto.WellnessHubSummaryDTO;
import com.example.wellness.model.*;
import com.example.wellness.repository.*;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.transaction.Transactional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class WellnessHubService {

    private final WellnessHubRepository wellnessHubRepository;
    private final EmergencyServiceRepository emergencyServiceRepository;
    private final AccountRequestRepository accountRequestRepository;
    private final CategoryRepository categoryRepository;
    private final DistrictRepository districtRepository;
    private final AccountGeneratorService accountGeneratorService;
    private final SupabaseStorageService supabaseStorageService;

    public WellnessHubService(
            WellnessHubRepository wellnessHubRepository,
            EmergencyServiceRepository emergencyServiceRepository,
            AccountRequestRepository accountRequestRepository,
            CategoryRepository categoryRepository,
            DistrictRepository districtRepository,
            AccountGeneratorService accountGeneratorService,
            SupabaseStorageService supabaseStorageService) {
        this.wellnessHubRepository = wellnessHubRepository;
        this.emergencyServiceRepository = emergencyServiceRepository;
        this.accountRequestRepository = accountRequestRepository;
        this.categoryRepository = categoryRepository;
        this.districtRepository = districtRepository;
        this.accountGeneratorService = accountGeneratorService;
        this.supabaseStorageService = supabaseStorageService;
    }

    /**
     * สร้างรหัสสถานประกอบการถัดไป (เช่น 10001, 10002)
     * - synchronized: ป้องกันกรณีมีคนกดสร้างหรือขอรหัสพร้อมกัน แล้วได้เลขซ้ำกัน
     * - ใช้คำสั่ง findMaxNumericLicenseId() เพื่อให้ฐานข้อมูลคำนวณหาค่าสูงสุด (MAX) โดยตรง ประหยัด RAM และทำงานรวดเร็ว
     */
    public synchronized String generateNextLicenseId() {
        try {
            Integer maxId = wellnessHubRepository.findMaxNumericLicenseId();
            if (maxId != null && maxId >= 10000) {
                return String.valueOf(maxId + 1);
            }
        } catch (Exception e) {
            log.warn("⚠️ Failed to execute atomic findMaxNumericLicenseId query, falling back: {}", e.getMessage());
        }

        // Fallback ในกรณีที่คำสั่ง Native SQL เกิดข้อผิดพลาด
        List<String> hubIds = wellnessHubRepository.findAllLicenseIds();
        List<String> serviceIds = emergencyServiceRepository.findAllLicenseIds();

        int maxId = 10000;
        if (hubIds != null) {
            for (String id : hubIds) {
                if (id != null) {
                    try {
                        int val = Integer.parseInt(id.replaceAll("\\D+", ""));
                        if (val > maxId) {
                            maxId = val;
                        }
                    } catch (NumberFormatException ignored) {
                    }
                }
            }
        }
        if (serviceIds != null) {
            for (String id : serviceIds) {
                if (id != null) {
                    try {
                        int val = Integer.parseInt(id.replaceAll("\\D+", ""));
                        if (val > maxId) {
                            maxId = val;
                        }
                    } catch (NumberFormatException ignored) {
                    }
                }
            }
        }
        return String.valueOf(maxId + 1);
    }

    private static final Set<String> EMERGENCY_CATEGORY_IDS = Set.of("EM01", "EM02");

    private boolean isEmergencyCategory(Category category) {
        return category != null
                && category.getCategoryId() != null
                && EMERGENCY_CATEGORY_IDS.contains(
                        category.getCategoryId().toUpperCase());
    }

    private List<WellnessHubSummaryDTO> sortWellnessHubSummaryList(List<WellnessHubSummaryDTO> list) {
        if (list == null) {
            return new ArrayList<>();
        }

        return list.stream().sorted((a, b) -> {
            LocalDateTime timeA = a.getUpdatedAt() != null ? a.getUpdatedAt() : a.getCreatedAt();
            LocalDateTime timeB = b.getUpdatedAt() != null ? b.getUpdatedAt() : b.getCreatedAt();

            if (timeA != null && timeB != null) {
                int cmp = timeB.compareTo(timeA);
                if (cmp != 0) {
                    return cmp;
                }
            } else if (timeA == null && timeB != null) {
                return 1;
            } else if (timeA != null && timeB == null) {
                return -1;
            }

            String idA = a.getLicenseId() != null ? a.getLicenseId() : "";
            String idB = b.getLicenseId() != null ? b.getLicenseId() : "";
            return idB.compareTo(idA);
        }).toList();
    }

    public List<WellnessHubSummaryDTO> listWellnessHub() {
        List<WellnessHubSummaryDTO> results = new ArrayList<>(wellnessHubRepository.findAllWellnessHubSummaries());
        List<WellnessHubSummaryDTO> emergencyResults = emergencyServiceRepository.findAllEmergencySummaries();

        results.addAll(emergencyResults);
        return sortWellnessHubSummaryList(results);
    }

    public List<WellnessHubSummaryDTO> listWellnessHub(Map<String, Object> payload) {
        if (payload == null) {
            return listWellnessHub();
        }

        String keyword = payload.get("search") != null
                ? payload.get("search").toString().trim()
                : null;
        if (keyword != null && keyword.isEmpty()) {
            keyword = null;
        }

        String categoryIdStr = payload.get("categoryId") != null
                ? payload.get("categoryId").toString().trim()
                : null;
        if (categoryIdStr != null && categoryIdStr.isEmpty()) {
            categoryIdStr = null;
        }

        Integer districtId = null;
        if (payload.get("districtId") != null) {
            String dStr = payload.get("districtId").toString().trim();
            if (!dStr.isEmpty()) {
                try {
                    districtId = Integer.parseInt(dStr);
                } catch (NumberFormatException ignored) {
                    districtId = null;
                }
            }
        }

        // 1. Query filtered WellnessHub directly from DB (DTO projection)
        List<WellnessHubSummaryDTO> results = new ArrayList<>(
                wellnessHubRepository.searchWellnessHubSummaries(keyword, categoryIdStr, districtId));

        // 2. Query filtered EmergencyService directly from DB (if category is null or emergency category)
        boolean checkEmergency = (categoryIdStr == null
                || EMERGENCY_CATEGORY_IDS.contains(categoryIdStr.toUpperCase()));
        if (checkEmergency) {
            List<WellnessHubSummaryDTO> emergencyResults = emergencyServiceRepository
                    .searchEmergencySummaries(keyword, categoryIdStr, districtId);
            results.addAll(emergencyResults);
        }

        return sortWellnessHubSummaryList(results);
    }

    public WellnessHub viewWellnessHubDetail(String id) {
        if (id == null || id.trim().isEmpty()) {
            return null;
        }

        WellnessHub wellnessHub = wellnessHubRepository
                .findById(id)
                .orElse(null);

        if (wellnessHub != null) {
            return wellnessHub;
        }

        EmergencyService emergencyService = emergencyServiceRepository
                .findById(id)
                .orElse(null);

        if (emergencyService != null) {
            return convertEmergencyToWellnessHub(emergencyService);
        }

        return null;
    }

    @Transactional
    public WellnessHub createWellnessHub(WellnessHub wellnessHub) {
        // 1. licenseId: required, อังกฤษ/ตัวเลขเท่านั้น, ไม่มีช่องว่าง, 10–13 ตัว
        if (wellnessHub.getLicenseId() == null || wellnessHub.getLicenseId().trim().isEmpty()) {
            throw new IllegalArgumentException("กรุณาระบุเลขใบอนุญาตประกอบกิจการ");
        }
        String licenseId = wellnessHub.getLicenseId().trim();
        if (!licenseId.matches("^[a-zA-Z0-9]{10,13}$")) {
            throw new IllegalArgumentException(
                    "เลขใบอนุญาตต้องเป็นภาษาอังกฤษหรือตัวเลข 10-13 ตัวอักษร และไม่มีช่องว่าง");
        }
        wellnessHub.setLicenseId(licenseId);

        // ตรวจ licenseId ซ้ำใน DB
        if (wellnessHubRepository.existsById(licenseId)
                || emergencyServiceRepository.existsById(licenseId)) {
            throw new IllegalArgumentException("เลขใบอนุญาตนี้มีอยู่ในระบบแล้ว");
        }

        // 2. wellnessHubName: required, 5–100 ตัว
        if (wellnessHub.getWellnessHubName() == null || wellnessHub.getWellnessHubName().trim().isEmpty()) {
            throw new IllegalArgumentException("กรุณาระบุชื่อสถานประกอบการ");
        }
        String wellnessHubName = wellnessHub.getWellnessHubName().trim();
        if (wellnessHubName.length() < 5 || wellnessHubName.length() > 100) {
            throw new IllegalArgumentException("ชื่อสถานประกอบการต้องมีความยาว 5-100 ตัวอักษร");
        }
        wellnessHub.setWellnessHubName(wellnessHubName);

        // ตรวจชื่อซ้ำใน DB ด้วย existsByWellnessHubNameIgnoreCase
        if (wellnessHubRepository.existsByWellnessHubNameIgnoreCase(wellnessHubName)
                || emergencyServiceRepository.existsByWellnessHubNameIgnoreCase(wellnessHubName)) {
            throw new IllegalArgumentException("ชื่อสถานประกอบการนี้มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น");
        }

        // 3. Category: ค่าเริ่มต้น "นวดและสปา", ต้องเลือกจาก Dropdown ใน DB
        if (wellnessHub.getCategory() == null || wellnessHub.getCategory().getCategoryId() == null
                || wellnessHub.getCategory().getCategoryId().trim().isEmpty()) {
            throw new IllegalArgumentException("กรุณาเลือกหมวดหมู่");
        }
        String categoryId = wellnessHub.getCategory().getCategoryId().trim().toUpperCase();
        Category managedCategory = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("ไม่พบหมวดหมู่รหัส " + categoryId));
        wellnessHub.setCategory(managedCategory);

        // 4. District: ต้องเลือกจากข้อมูล District ในระบบ
        if (wellnessHub.getDistrict() == null || wellnessHub.getDistrict().getDistrictId() == null) {
            throw new IllegalArgumentException("กรุณาเลือกอำเภอ");
        }
        Integer districtId = wellnessHub.getDistrict().getDistrictId();
        District managedDistrict = districtRepository.findById(districtId)
                .orElseThrow(() -> new IllegalArgumentException("ไม่พบอำเภอรหัส " + districtId));
        wellnessHub.setDistrict(managedDistrict);

        // 5. address: required, 10–255 ตัว, มีช่องว่างได้
        if (wellnessHub.getAddress() == null || wellnessHub.getAddress().trim().isEmpty()) {
            throw new IllegalArgumentException("กรุณาระบุที่อยู่");
        }
        String address = wellnessHub.getAddress().trim();
        if (address.length() < 10 || address.length() > 255) {
            throw new IllegalArgumentException("ที่อยู่ต้องมีความยาว 10-255 ตัวอักษร");
        }
        wellnessHub.setAddress(address);

        // 5.1 wellnessHubDescription: optional, if provided max 255 characters
        if (wellnessHub.getWellnessHubDescription() != null && !wellnessHub.getWellnessHubDescription().trim().isEmpty()) {
            String desc = wellnessHub.getWellnessHubDescription().trim();
            if (desc.length() > 255) {
                throw new IllegalArgumentException("รายละเอียดสถานประกอบการต้องมีความยาวไม่เกิน 255 ตัวอักษร");
            }
            wellnessHub.setWellnessHubDescription(desc);
        } else {
            wellnessHub.setWellnessHubDescription(null);
        }

        // 6. googleMapsLink: required, ต้องเป็น "#" หรือ Google Maps URL ที่ถูกต้อง
        if (wellnessHub.getGoogleMapsLink() == null || wellnessHub.getGoogleMapsLink().trim().isEmpty()) {
            throw new IllegalArgumentException("กรุณาระบุลิงก์ Google Maps หรือใส่ #");
        }
        String googleMapsLink = wellnessHub.getGoogleMapsLink().trim();
        if (!googleMapsLink.equals("#")) {
            if (googleMapsLink.contains(" ")) {
                throw new IllegalArgumentException("ลิงก์ Google Maps ต้องไม่มีช่องว่าง");
            }
            if (!googleMapsLink.matches("^https?://.*")) {
                throw new IllegalArgumentException(
                        "ลิงก์ Google Maps ต้องเป็น URL ที่ถูกต้อง (ขึ้นต้นด้วย http:// หรือ https://) หรือใส่ #");
            }

            // ตรวจลิงก์ Google Maps ซ้ำใน DB ด้วย existsByGoogleMapsLink (ยกเว้น #)
            if (wellnessHubRepository.existsByGoogleMapsLink(googleMapsLink)
                    || emergencyServiceRepository.existsByGoogleMapsLink(googleMapsLink)) {
                throw new IllegalArgumentException("ลิงก์ Google Maps นี้มีอยู่ในระบบแล้ว กรุณาใช้ลิงก์อื่น");
            }

            // 7. & 8. latitude & longitude: required, -90 ถึง 90, -180 ถึง 180
            if (wellnessHub.getWellnessHubLatitude() == null || wellnessHub.getWellnessHubLongitude() == null) {
                extractCoordinates(wellnessHub);
            }

            if (wellnessHub.getWellnessHubLatitude() == null || wellnessHub.getWellnessHubLongitude() == null) {
                throw new IllegalArgumentException(
                        "ไม่สามารถดึงพิกัดจากลิงก์ Google Maps ได้ กรุณาตรวจสอบลิงก์ Google Maps หรือใส่ #");
            }

            Double lat = wellnessHub.getWellnessHubLatitude();
            Double lng = wellnessHub.getWellnessHubLongitude();

            if (lat < 17.0 || lat > 20.5) {
                throw new IllegalArgumentException("ละติจูดต้องอยู่ในพื้นที่จังหวัดเชียงใหม่ (ระหว่าง 17.0 ถึง 20.5)");
            }
            if (lng < 98.0 || lng > 100.0) {
                throw new IllegalArgumentException("ลองจิจูดต้องอยู่ในพื้นที่จังหวัดเชียงใหม่ (ระหว่าง 98.0 ถึง 100.0)");
            }
        } else {
            wellnessHub.setWellnessHubLatitude(null);
            wellnessHub.setWellnessHubLongitude(null);
        }
        wellnessHub.setGoogleMapsLink(googleMapsLink);

        boolean isEmergency = isEmergencyCategory(wellnessHub.getCategory());

        // 🔑 Auto-generate Username if not provided
        if (wellnessHub.getUsername() == null || wellnessHub.getUsername().trim().isEmpty()) {
            String prefix = isEmergency ? "ES_" : "WH_";
            String candidateUsername = prefix + licenseId;
            int suffix = 1;
            while (wellnessHubRepository.existsByUsername(candidateUsername)
                    || emergencyServiceRepository.existsByUsername(candidateUsername)) {
                candidateUsername = prefix + licenseId + "_" + suffix++;
            }
            wellnessHub.setUsername(candidateUsername);
        }

        // 🔐 Auto-generate Password if not provided
        if (wellnessHub.getPassword() == null || wellnessHub.getPassword().trim().isEmpty()) {
            wellnessHub.setPassword(accountGeneratorService.generateRandomPassword());
        }

        if (wellnessHub.getCreatedAt() == null) {
            wellnessHub.setCreatedAt(LocalDateTime.now());
        }
        if (wellnessHub.getUpdatedAt() == null) {
            wellnessHub.setUpdatedAt(LocalDateTime.now());
        }
        if (wellnessHub.getStatus() == null || wellnessHub.getStatus().trim().isEmpty()) {
            wellnessHub.setStatus("ACTIVE");
        }

        // Upload images to Supabase Storage if Base64
        if (wellnessHub.getWellnessHubImg() != null && !wellnessHub.getWellnessHubImg().trim().isEmpty()) {
            validateImage(wellnessHub.getWellnessHubImg().trim());
            wellnessHub.setWellnessHubImg(supabaseStorageService.uploadBase64OrReturnUrl(wellnessHub.getWellnessHubImg(), "wellness_hubs"));
        }
        if (wellnessHub.getWellnessHubGallery() != null && !wellnessHub.getWellnessHubGallery().trim().isEmpty()) {
            validateGallery(wellnessHub.getWellnessHubGallery().trim());
            wellnessHub.setWellnessHubGallery(supabaseStorageService.uploadGalleryBase64OrReturnUrl(wellnessHub.getWellnessHubGallery(), "wellness_hubs"));
        }

        if (isEmergency) {
            EmergencyService emergency = convertToEmergency(wellnessHub);
            emergencyServiceRepository.save(emergency);
            return wellnessHub;
        }

        return wellnessHubRepository.save(wellnessHub);
    }

    private void extractCoordinates(WellnessHub hub) {
        String originalUrl = hub.getGoogleMapsLink();

        if (originalUrl == null || originalUrl.trim().isEmpty() || originalUrl.trim().equals("#")) {
            hub.setWellnessHubLatitude(null);
            hub.setWellnessHubLongitude(null);
            return;
        }

        String finalUrl = originalUrl.trim();

        if (finalUrl.contains("goo.gl") || finalUrl.contains("maps.app.goo.gl") || finalUrl.contains("maps.app")) {
            finalUrl = expandShortUrl(finalUrl);
        }

        // 1. หมุดสถานที่จริง (!3d, !4d) - ความสำคัญสูงสุด (เอาหมุดตัวสุดท้ายซึ่งเป็นสถานที่เป้าหมาย)
        Pattern patternPlace = Pattern.compile("!3d(-?\\d+(?:\\.\\d+)?)[^!]*!4d(-?\\d+(?:\\.\\d+)?)");
        Matcher matcherPlace = patternPlace.matcher(finalUrl);

        // 2. Query พิกัดระบุตรงๆ (?q=, ?query=, ?ll=, ?destination=, ?daddr=)
        Pattern patternQuery = Pattern.compile("[?&](?:q|query|ll|destination|daddr)=(-?\\d+(?:\\.\\d+)?),(-?\\d+(?:\\.\\d+)?)");
        Matcher matcherQuery = patternQuery.matcher(finalUrl);

        // 3. Fallback: พิกัดกึ่งกลางกล้อง/หน้าจอ (@lat,lng)
        Pattern patternAt = Pattern.compile("@(-?\\d+(?:\\.\\d+)?),(-?\\d+(?:\\.\\d+)?)");
        Matcher matcherAt = patternAt.matcher(finalUrl);

        // 4. Direction/Search/Place path หรือระบุพิกัดใน path โดยตรง
        Pattern patternDir = Pattern.compile("/(?:dir|search|place)/[^/]*/(-?\\d+(?:\\.\\d+)?),(-?\\d+(?:\\.\\d+)?)");
        Pattern patternDirect = Pattern.compile("/(-?\\d+(?:\\.\\d+)?),(-?\\d+(?:\\.\\d+)?)");
        Matcher matcherDir = patternDir.matcher(finalUrl);

        Double lat = null;
        Double lng = null;

        while (matcherPlace.find()) {
            lat = Double.parseDouble(matcherPlace.group(1));
            lng = Double.parseDouble(matcherPlace.group(2));
        }

        if (lat == null || lng == null) {
            while (matcherQuery.find()) {
                lat = Double.parseDouble(matcherQuery.group(1));
                lng = Double.parseDouble(matcherQuery.group(2));
            }
        }

        if (lat == null || lng == null) {
            if (matcherAt.find()) {
                lat = Double.parseDouble(matcherAt.group(1));
                lng = Double.parseDouble(matcherAt.group(2));
            }
        }

        if (lat == null || lng == null) {
            while (matcherDir.find()) {
                lat = Double.parseDouble(matcherDir.group(1));
                lng = Double.parseDouble(matcherDir.group(2));
            }
        }

        if (lat == null || lng == null) {
            Matcher matcherDirect = patternDirect.matcher(finalUrl);
            while (matcherDirect.find()) {
                lat = Double.parseDouble(matcherDirect.group(1));
                lng = Double.parseDouble(matcherDirect.group(2));
            }
        }

        if (isValidCoordinate(lat, lng)) {
            hub.setWellnessHubLatitude(lat);
            hub.setWellnessHubLongitude(lng);
            System.out.println("✅ สกัดพิกัดสำเร็จ: lat=" + lat + ", lng=" + lng);
        } else {
            hub.setWellnessHubLatitude(null);
            hub.setWellnessHubLongitude(null);
            System.out.println("⚠️ พิกัดไม่ถูกต้อง ตั้งค่าเป็น NULL");
        }
    }

    private void extractCoordinates(EmergencyService emergency) {
        String originalUrl = emergency.getGoogleMapsLink();

        if (originalUrl == null || originalUrl.trim().isEmpty() || originalUrl.trim().equals("#")) {
            emergency.setWellnessHubLatitude(null);
            emergency.setWellnessHubLongitude(null);
            return;
        }

        String finalUrl = originalUrl.trim();

        if (finalUrl.contains("goo.gl") || finalUrl.contains("maps.app.goo.gl") || finalUrl.contains("maps.app")) {
            finalUrl = expandShortUrl(finalUrl);
        }

        Pattern patternPlace = Pattern.compile("!3d(-?\\d+(?:\\.\\d+)?)[^!]*!4d(-?\\d+(?:\\.\\d+)?)");
        Pattern patternQuery = Pattern.compile("[?&](?:q|query|ll|destination|daddr)=(-?\\d+(?:\\.\\d+)?),(-?\\d+(?:\\.\\d+)?)");
        Pattern patternAt = Pattern.compile("@(-?\\d+(?:\\.\\d+)?),(-?\\d+(?:\\.\\d+)?)");
        Pattern patternDir = Pattern.compile("/(?:dir|search|place)/[^/]*/(-?\\d+(?:\\.\\d+)?),(-?\\d+(?:\\.\\d+)?)");
        Pattern patternDirect = Pattern.compile("/(-?\\d+(?:\\.\\d+)?),(-?\\d+(?:\\.\\d+)?)");

        Matcher matcherPlace = patternPlace.matcher(finalUrl);
        Matcher matcherQuery = patternQuery.matcher(finalUrl);
        Matcher matcherAt = patternAt.matcher(finalUrl);
        Matcher matcherDir = patternDir.matcher(finalUrl);

        Double latitude = null;
        Double longitude = null;

        while (matcherPlace.find()) {
            latitude = Double.parseDouble(matcherPlace.group(1));
            longitude = Double.parseDouble(matcherPlace.group(2));
        }

        if (latitude == null || longitude == null) {
            while (matcherQuery.find()) {
                latitude = Double.parseDouble(matcherQuery.group(1));
                longitude = Double.parseDouble(matcherQuery.group(2));
            }
        }

        if (latitude == null || longitude == null) {
            if (matcherAt.find()) {
                latitude = Double.parseDouble(matcherAt.group(1));
                longitude = Double.parseDouble(matcherAt.group(2));
            }
        }

        if (latitude == null || longitude == null) {
            while (matcherDir.find()) {
                latitude = Double.parseDouble(matcherDir.group(1));
                longitude = Double.parseDouble(matcherDir.group(2));
            }
        }

        if (latitude == null || longitude == null) {
            Matcher matcherDirect = patternDirect.matcher(finalUrl);
            while (matcherDirect.find()) {
                latitude = Double.parseDouble(matcherDirect.group(1));
                longitude = Double.parseDouble(matcherDirect.group(2));
            }
        }

        if (isValidCoordinate(latitude, longitude)) {
            emergency.setWellnessHubLatitude(latitude);
            emergency.setWellnessHubLongitude(longitude);
        } else {
            emergency.setWellnessHubLatitude(null);
            emergency.setWellnessHubLongitude(null);
        }
    }

    private boolean isValidCoordinate(Double lat, Double lng) {
        return lat != null
                && lng != null
                && !lat.isNaN()
                && !lng.isNaN()
                && !(lat == 0.0 && lng == 0.0)
                && lat >= 17.0 && lat <= 20.5
                && lng >= 98.0 && lng <= 100.0;
    }

    private String expandShortUrl(String shortenedUrl) {
        if (shortenedUrl == null || (!shortenedUrl.startsWith("http://") && !shortenedUrl.startsWith("https://"))) {
            return shortenedUrl;
        }
        String currentUrl = shortenedUrl.trim();
        int maxRedirects = 5;

        for (int i = 0; i < maxRedirects; i++) {
            if (!currentUrl.contains("goo.gl") && !currentUrl.contains("maps.app")) {
                break;
            }

            try {
                URL url = new URL(currentUrl);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setInstanceFollowRedirects(false);
                connection.setRequestMethod("GET");
                connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
                connection.setConnectTimeout(5000);
                connection.setReadTimeout(5000);
                connection.connect();

                String location = connection.getHeaderField("Location");
                connection.disconnect();

                if (location != null && !location.trim().isEmpty()) {
                    currentUrl = location.trim();
                } else {
                    break;
                }
            } catch (Exception e) {
                System.err.println("⚠️ ไม่สามารถขยาย Short URL: " + e.getMessage());
                break;
            }
        }

        return currentUrl;
    }

    @Transactional
    public WellnessHub editWellnessHub(String id, WellnessHub updatedData) {
        return editWellnessHub(id, updatedData, false);
    }

    @Transactional
    public WellnessHub editWellnessHub(
            String id,
            WellnessHub updatedData,
            boolean isProvider) {
        if (id == null || id.trim().isEmpty() || updatedData == null) {
            return null;
        }
        id = id.trim();

        WellnessHub oldHub = wellnessHubRepository.findById(id).orElse(null);
        EmergencyService oldEmergency = emergencyServiceRepository.findById(id).orElse(null);

        if (oldHub == null && oldEmergency == null) {
            return null;
        }

        // Provider Whitelist Edit Mode
        if (isProvider) {
            // 1. address: required, 10–255
            if (updatedData.getAddress() == null || updatedData.getAddress().trim().isEmpty()) {
                throw new IllegalArgumentException("กรุณาระบุที่อยู่");
            }
            String address = updatedData.getAddress().trim();
            if (address.length() < 10 || address.length() > 255) {
                throw new IllegalArgumentException("ที่อยู่ต้องมีความยาว 10-255 ตัวอักษร");
            }

            // 2. telInformation: required, 9-10 digits, no whitespace
            if (updatedData.getTelInformation() == null || updatedData.getTelInformation().trim().isEmpty()) {
                throw new IllegalArgumentException("กรุณาระบุเบอร์โทรศัพท์");
            }
            String tel = updatedData.getTelInformation().trim();
            if (!tel.matches("^(1669|[0-9]{3,4}|[0-9]{9,10})$")) {
                throw new IllegalArgumentException("เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก หรือเบอร์ฉุกเฉิน (เช่น 1669) และไม่มีช่องว่าง");
            }

            // 3. contactInformation: optional, if provided 3–255
            String contact = null;
            if (updatedData.getContactInformation() != null && !updatedData.getContactInformation().trim().isEmpty()) {
                contact = updatedData.getContactInformation().trim();
                if (contact.length() < 3 || contact.length() > 255) {
                    throw new IllegalArgumentException("ช่องทางการติดต่อต้องมีความยาว 3-255 ตัวอักษร");
                }
            }

            // 4. wellnessHubDescription: optional, if provided max 255
            String desc = null;
            if (updatedData.getWellnessHubDescription() != null
                    && !updatedData.getWellnessHubDescription().trim().isEmpty()) {
                desc = updatedData.getWellnessHubDescription().trim();
                if (desc.length() > 255) {
                    throw new IllegalArgumentException("รายละเอียดสถานประกอบการต้องมีความยาวไม่เกิน 255 ตัวอักษร");
                }
            }

            // 5. googleMapsLink: required, valid Google Maps URL or #, no whitespace
            if (updatedData.getGoogleMapsLink() == null || updatedData.getGoogleMapsLink().trim().isEmpty()) {
                throw new IllegalArgumentException("กรุณาระบุลิงก์ Google Maps หรือใส่ #");
            }
            String googleMapsLink = updatedData.getGoogleMapsLink().trim();
            if (!googleMapsLink.equals("#")) {
                if (googleMapsLink.contains(" ")) {
                    throw new IllegalArgumentException("ลิงก์ Google Maps ต้องไม่มีช่องว่าง");
                }
                if (!googleMapsLink.matches("^https?://.*")) {
                    throw new IllegalArgumentException(
                            "ลิงก์ Google Maps ต้องเป็น URL ที่ถูกต้อง (ขึ้นต้นด้วย http:// หรือ https://) หรือใส่ #");
                }
            }

            // 6. latitude & longitude: optional (ถ้าใส่ # ให้ lat/lng เป็น null)
            Double lat = null;
            Double lng = null;
            if (!googleMapsLink.equals("#")) {
                WellnessHub temp = new WellnessHub();
                temp.setGoogleMapsLink(googleMapsLink);
                extractCoordinates(temp);
                lat = temp.getWellnessHubLatitude();
                lng = temp.getWellnessHubLongitude();

                if (lat == null || lng == null) {
                    lat = updatedData.getWellnessHubLatitude();
                    lng = updatedData.getWellnessHubLongitude();
                }
                if (lat != null && (lat < 17.0 || lat > 20.5)) {
                    throw new IllegalArgumentException("ละติจูดต้องอยู่ในพื้นที่จังหวัดเชียงใหม่ (ระหว่าง 17.0 ถึง 20.5)");
                }
                if (lng != null && (lng < 98.0 || lng > 100.0)) {
                    throw new IllegalArgumentException("ลองจิจูดต้องอยู่ในพื้นที่จังหวัดเชียงใหม่ (ระหว่าง 98.0 ถึง 100.0)");
                }
            }

            // 7. wellnessHubImg: optional, png/jpg/jpeg, <= 20MB
            String img = null;
            if (updatedData.getWellnessHubImg() != null) {
                if (!updatedData.getWellnessHubImg().trim().isEmpty()) {
                    validateImage(updatedData.getWellnessHubImg().trim());
                    img = supabaseStorageService.uploadBase64OrReturnUrl(updatedData.getWellnessHubImg().trim(), "wellness_hubs");
                } else {
                    img = "";
                }
            }

            // 7.1 wellnessHubGallery: optional
            String gallery = null;
            if (updatedData.getWellnessHubGallery() != null) {
                if (!updatedData.getWellnessHubGallery().trim().isEmpty()) {
                    validateGallery(updatedData.getWellnessHubGallery().trim());
                    gallery = supabaseStorageService.uploadGalleryBase64OrReturnUrl(updatedData.getWellnessHubGallery().trim(), "wellness_hubs");
                } else {
                    gallery = "";
                }
            }

            // 8. operatingHours: validate Mon-Sun
            String opHours = null;
            if (updatedData.getOperatingHours() != null && !updatedData.getOperatingHours().trim().isEmpty()) {
                validateOperatingHours(updatedData.getOperatingHours().trim());
                opHours = updatedData.getOperatingHours().trim();
            }

            String oldName = oldHub != null ? oldHub.getWellnessHubName()
                    : (oldEmergency != null ? oldEmergency.getWellnessHubName() : null);
            String name = updatedData.getWellnessHubName() != null ? updatedData.getWellnessHubName().trim() : null;
            if (name != null && !name.isEmpty()) {
                if (name.length() < 5 || name.length() > 100) {
                    throw new IllegalArgumentException("ชื่อสถานประกอบการต้องมีความยาว 5-100 ตัวอักษร");
                }
                // ตรวจชื่อซ้ำเฉพาะเมื่อเปลี่ยนชื่อใหม่
                if (oldName == null || !name.equalsIgnoreCase(oldName.trim())) {
                    if (wellnessHubRepository.existsByWellnessHubNameIgnoreCaseAndLicenseIdNot(name, id)
                            || emergencyServiceRepository.existsByWellnessHubNameIgnoreCaseAndLicenseIdNot(name, id)) {
                        throw new IllegalArgumentException("ชื่อสถานประกอบการนี้มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น");
                    }
                }
            }

            // 9. Username validation and update (if provided)
            String newUsername = null;
            if (updatedData.getUsername() != null && !updatedData.getUsername().trim().isEmpty()) {
                newUsername = updatedData.getUsername().trim();
                if (newUsername.contains(" ")) {
                    throw new IllegalArgumentException("Username ต้องไม่มีช่องว่าง");
                }
                if (newUsername.length() < 4 || newUsername.length() > 20) {
                    throw new IllegalArgumentException("Username ต้องมีความยาว 4-20 ตัวอักษร");
                }
                String currentUsername = oldHub != null ? oldHub.getUsername()
                        : (oldEmergency != null ? oldEmergency.getUsername() : null);
                if (currentUsername == null || !newUsername.equalsIgnoreCase(currentUsername.trim())) {
                    WellnessHub existingHub = wellnessHubRepository.findByUsername(newUsername);
                    EmergencyService existingEmergency = emergencyServiceRepository.findByUsername(newUsername);
                    if ((existingHub != null && !existingHub.getLicenseId().equals(id))
                            || (existingEmergency != null && !existingEmergency.getLicenseId().equals(id))) {
                        throw new IllegalArgumentException("Username นี้ถูกใช้งานแล้วในระบบ กรุณาใช้ชื่ออื่น");
                    }
                }
            }

            // 10. Password validation and update (if provided)
            String newPassword = null;
            if (updatedData.getPassword() != null && !updatedData.getPassword().trim().isEmpty()) {
                newPassword = updatedData.getPassword().trim();
                if (newPassword.contains(" ")) {
                    throw new IllegalArgumentException("Password ต้องไม่มีช่องว่าง");
                }
                if (newPassword.length() != 8) {
                    throw new IllegalArgumentException("Password ต้องมีความยาว 8 ตัวอักษรเท่านั้น");
                }
            }

            // Apply fields to oldHub or oldEmergency
            if (oldHub != null) {
                if (name != null && !name.isEmpty()) {
                    oldHub.setWellnessHubName(name);
                }
                if (newUsername != null) {
                    oldHub.setUsername(newUsername);
                }
                if (newPassword != null) {
                    oldHub.setPassword(newPassword);
                }
                oldHub.setAddress(address);
                oldHub.setTelInformation(tel);
                oldHub.setContactInformation(contact);
                oldHub.setWellnessHubDescription(desc);
                oldHub.setGoogleMapsLink(googleMapsLink);
                oldHub.setWellnessHubLatitude(lat);
                oldHub.setWellnessHubLongitude(lng);
                if (img != null) {
                    oldHub.setWellnessHubImg(img.isEmpty() ? null : img);
                }
                if (gallery != null) {
                    oldHub.setWellnessHubGallery(gallery);
                }
                if (opHours != null) {
                    oldHub.setOperatingHours(opHours);
                }
                if (updatedData.getCertificateType() != null) {
                    oldHub.setCertificateType(updatedData.getCertificateType());
                }
                oldHub.setUpdatedAt(LocalDateTime.now());
                return wellnessHubRepository.save(oldHub);
            } else {
                if (name != null && !name.isEmpty()) {
                    oldEmergency.setWellnessHubName(name);
                }
                if (newUsername != null) {
                    oldEmergency.setUsername(newUsername);
                }
                if (newPassword != null) {
                    oldEmergency.setPassword(newPassword);
                }
                oldEmergency.setAddress(address);
                oldEmergency.setTelInformation(tel);
                oldEmergency.setContactInformation(contact);
                oldEmergency.setWellnessHubDescription(desc);
                oldEmergency.setGoogleMapsLink(googleMapsLink);
                oldEmergency.setWellnessHubLatitude(lat);
                oldEmergency.setWellnessHubLongitude(lng);
                if (img != null) {
                    oldEmergency.setWellnessHubImg(img.isEmpty() ? null : img);
                }
                if (gallery != null) {
                    oldEmergency.setWellnessHubGallery(gallery);
                }
                if (opHours != null) {
                    oldEmergency.setOperatingHours(opHours);
                }
                if (updatedData.getCertificateType() != null) {
                    oldEmergency.setCertificateType(updatedData.getCertificateType());
                }
                oldEmergency.setUpdatedAt(LocalDateTime.now());
                EmergencyService saved = emergencyServiceRepository.save(oldEmergency);
                return convertEmergencyToWellnessHub(saved);
            }
        }

        // Admin Edit Logic (preserve existing functionality)
        // 1. licenseId: ห้ามเปลี่ยน
        if (updatedData.getLicenseId() != null && !id.equals(updatedData.getLicenseId().trim())) {
            throw new IllegalArgumentException("ไม่สามารถเปลี่ยนเลขใบอนุญาตได้");
        }

        String oldName = oldHub != null ? oldHub.getWellnessHubName()
                : (oldEmergency != null ? oldEmergency.getWellnessHubName() : null);

        // 2. wellnessHubName: required, 5–100 ตัว
        String name = updatedData.getWellnessHubName() != null && !updatedData.getWellnessHubName().trim().isEmpty()
                ? updatedData.getWellnessHubName().trim()
                : oldName;

        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("กรุณาระบุชื่อสถานประกอบการ");
        }
        name = name.trim();
        if (name.length() < 5 || name.length() > 100) {
            throw new IllegalArgumentException("ชื่อสถานประกอบการต้องมีความยาว 5-100 ตัวอักษร");
        }
        // ตรวจชื่อซ้ำเฉพาะเมื่อเปลี่ยนชื่อใหม่ต่างจากชื่อเดิมของตัวเอง
        if (oldName == null || !name.equalsIgnoreCase(oldName.trim())) {
            if (wellnessHubRepository.existsByWellnessHubNameIgnoreCaseAndLicenseIdNot(name, id)
                    || emergencyServiceRepository.existsByWellnessHubNameIgnoreCaseAndLicenseIdNot(name, id)) {
                throw new IllegalArgumentException("ชื่อสถานประกอบการนี้มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น");
            }
        }

        // 3. Category: optional ในหน้าแก้ไข (ถ้าไม่ระบุ ให้คงของเดิมไว้)
        Category targetCategory = null;
        if (updatedData.getCategory() != null
                && updatedData.getCategory().getCategoryId() != null
                && !updatedData.getCategory().getCategoryId().trim().isEmpty()) {

            String categoryId = updatedData.getCategory().getCategoryId().trim().toUpperCase();
            targetCategory = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new IllegalArgumentException("ไม่พบหมวดหมู่รหัส " + categoryId));

        } else if (oldHub != null) {
            targetCategory = oldHub.getCategory();
        } else if (oldEmergency != null) {
            targetCategory = oldEmergency.getCategory();
        }

        // 4. District: optional ในหน้าแก้ไข (ถ้าไม่ระบุ ให้คงของเดิมไว้)
        District targetDistrict = null;
        if (updatedData.getDistrict() != null
                && updatedData.getDistrict().getDistrictId() != null) {

            Integer districtId = updatedData.getDistrict().getDistrictId();
            targetDistrict = districtRepository.findById(districtId)
                    .orElseThrow(() -> new IllegalArgumentException("ไม่พบอำเภอรหัส " + districtId));

        } else if (oldHub != null) {
            targetDistrict = oldHub.getDistrict();
        } else if (oldEmergency != null) {
            targetDistrict = oldEmergency.getDistrict();
        }

        // 5. address: optional, สูงสุด 255 ตัวอักษร (ถ้ามีระบุ)
        String address = null;
        if (updatedData.getAddress() != null && !updatedData.getAddress().trim().isEmpty()) {
            address = updatedData.getAddress().trim();
            if (address.length() > 255) {
                throw new IllegalArgumentException("ที่อยู่ต้องมีความยาวไม่เกิน 255 ตัวอักษร");
            }
        }

        // 6. telInformation: optional, ตัวเลข 9-10 หลัก หรือเบอร์ฉุกเฉิน ไม่มีช่องว่าง (ถ้ามีระบุ)
        String tel = null;
        if (updatedData.getTelInformation() != null && !updatedData.getTelInformation().trim().isEmpty()) {
            tel = updatedData.getTelInformation().trim();
            if (!tel.matches("^(1669|[0-9]{3,4}|[0-9]{9,10})$")) {
                throw new IllegalArgumentException("เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก หรือเบอร์ฉุกเฉิน (เช่น 1669) และไม่มีช่องว่าง");
            }
        }

        // 7. googleMapsLink: required, ต้องเป็น "#" หรือ Google Maps URL ที่ถูกต้อง
        if (updatedData.getGoogleMapsLink() == null || updatedData.getGoogleMapsLink().trim().isEmpty()) {
            throw new IllegalArgumentException("กรุณาระบุลิงก์ Google Maps หรือใส่ #");
        }
        String googleMapsLink = updatedData.getGoogleMapsLink().trim();
        if (!googleMapsLink.equals("#")) {
            if (googleMapsLink.contains(" ")) {
                throw new IllegalArgumentException("ลิงก์ Google Maps ต้องไม่มีช่องว่าง");
            }
            if (!googleMapsLink.matches("^https?://.*")) {
                throw new IllegalArgumentException(
                        "ลิงก์ Google Maps ต้องเป็น URL ที่ถูกต้อง (ขึ้นต้นด้วย http:// หรือ https://) หรือใส่ #");
            }
        }

        // 8. latitude & longitude: optional (ถ้าใส่ # ให้ lat/lng เป็น null)
        Double lat = null;
        Double lng = null;
        if (!googleMapsLink.equals("#")) {
            WellnessHub temp = new WellnessHub();
            temp.setGoogleMapsLink(googleMapsLink);
            extractCoordinates(temp);
            lat = temp.getWellnessHubLatitude();
            lng = temp.getWellnessHubLongitude();

            if (lat == null || lng == null) {
                lat = updatedData.getWellnessHubLatitude();
                lng = updatedData.getWellnessHubLongitude();
            }
            if (lat != null && (lat < 17.0 || lat > 20.5)) {
                throw new IllegalArgumentException("ละติจูดต้องอยู่ในพื้นที่จังหวัดเชียงใหม่ (ระหว่าง 17.0 ถึง 20.5)");
            }
            if (lng != null && (lng < 98.0 || lng > 100.0)) {
                throw new IllegalArgumentException("ลองจิจูดต้องอยู่ในพื้นที่จังหวัดเชียงใหม่ (ระหว่าง 98.0 ถึง 100.0)");
            }
        }

        // 8.1 wellnessHubDescription: optional, if provided max 255
        String adminDesc = null;
        if (updatedData.getWellnessHubDescription() != null && !updatedData.getWellnessHubDescription().trim().isEmpty()) {
            adminDesc = updatedData.getWellnessHubDescription().trim();
            if (adminDesc.length() > 255) {
                throw new IllegalArgumentException("รายละเอียดสถานประกอบการต้องมีความยาวไม่เกิน 255 ตัวอักษร");
            }
        }
        updatedData.setWellnessHubDescription(adminDesc);

        // Username validation and update (if provided)
        String newAdminUsername = null;
        if (updatedData.getUsername() != null && !updatedData.getUsername().trim().isEmpty()) {
            newAdminUsername = updatedData.getUsername().trim();
            if (newAdminUsername.contains(" ")) {
                throw new IllegalArgumentException("Username ต้องไม่มีช่องว่าง");
            }
            if (newAdminUsername.length() < 4 || newAdminUsername.length() > 20) {
                throw new IllegalArgumentException("Username ต้องมีความยาว 4-20 ตัวอักษร");
            }
            String currentUsername = oldHub != null ? oldHub.getUsername()
                    : (oldEmergency != null ? oldEmergency.getUsername() : null);
            if (currentUsername == null || !newAdminUsername.equalsIgnoreCase(currentUsername.trim())) {
                WellnessHub existingHub = wellnessHubRepository.findByUsername(newAdminUsername);
                EmergencyService existingEmergency = emergencyServiceRepository.findByUsername(newAdminUsername);
                if ((existingHub != null && !existingHub.getLicenseId().equals(id))
                        || (existingEmergency != null && !existingEmergency.getLicenseId().equals(id))) {
                    throw new IllegalArgumentException("Username นี้ถูกใช้งานแล้วในระบบ กรุณาใช้ชื่ออื่น");
                }
            }
            updatedData.setUsername(newAdminUsername);
        }

        // Password validation and update (if provided)
        if (updatedData.getPassword() != null && !updatedData.getPassword().trim().isEmpty()) {
            String newAdminPassword = updatedData.getPassword().trim();
            if (newAdminPassword.contains(" ")) {
                throw new IllegalArgumentException("Password ต้องไม่มีช่องว่าง");
            }
            if (newAdminPassword.length() != 8) {
                throw new IllegalArgumentException("Password ต้องมีความยาว 8 ตัวอักษรเท่านั้น");
            }
            updatedData.setPassword(newAdminPassword);
        }

        updatedData.setWellnessHubName(name);
        updatedData.setAddress(address);
        updatedData.setTelInformation(tel);
        updatedData.setGoogleMapsLink(googleMapsLink);
        updatedData.setWellnessHubLatitude(lat);
        updatedData.setWellnessHubLongitude(lng);

        boolean targetIsEmergency = isEmergencyCategory(targetCategory);

        if (oldEmergency != null && targetIsEmergency) {
            updateEmergencyFields(oldEmergency, updatedData);
            oldEmergency.setCategory(targetCategory);
            oldEmergency.setDistrict(targetDistrict);

            EmergencyService savedEmergency = emergencyServiceRepository.save(oldEmergency);
            return convertEmergencyToWellnessHub(savedEmergency);
        }

        if (oldEmergency != null && !targetIsEmergency) {
            updateEmergencyFields(oldEmergency, updatedData);
            oldEmergency.setCategory(targetCategory);
            oldEmergency.setDistrict(targetDistrict);

            WellnessHub newHub = convertEmergencyToWellnessHub(oldEmergency);
            newHub.setLicenseId(id);
            newHub.setCategory(targetCategory);
            newHub.setDistrict(targetDistrict);

            emergencyServiceRepository.delete(oldEmergency);
            return wellnessHubRepository.save(newHub);
        }

        if (oldHub != null && targetIsEmergency) {
            applyWellnessHubUpdates(oldHub, updatedData);
            oldHub.setCategory(targetCategory);
            oldHub.setDistrict(targetDistrict);

            EmergencyService emergency = convertToEmergency(oldHub);
            emergency.setLicenseId(id);
            emergency.setCategory(targetCategory);
            emergency.setDistrict(targetDistrict);

            wellnessHubRepository.delete(oldHub);

            EmergencyService savedEmergency = emergencyServiceRepository.save(emergency);
            return convertEmergencyToWellnessHub(savedEmergency);
        }

        applyWellnessHubUpdates(oldHub, updatedData);
        oldHub.setCategory(targetCategory);
        oldHub.setDistrict(targetDistrict);

        return wellnessHubRepository.save(oldHub);
    }

    private void validateImage(String img) {
        if (img == null || img.trim().isEmpty()) {
            return;
        }
        String raw = img.trim();
        if (raw.startsWith("data:")) {
            String lower = raw.toLowerCase();
            if (!lower.startsWith("data:image/jpeg") && !lower.startsWith("data:image/jpg") && !lower.startsWith("data:image/png")) {
                throw new IllegalArgumentException("ต้องเป็นไฟล์รูปภาพนามสกุล .png, .jpg และ .jpeg เท่านั้น");
            }
            if (raw.length() > 28_000_000) {
                throw new IllegalArgumentException("ขนาดรูปภาพต้องไม่เกิน 20 MB");
            }
        }
    }

    private void validateGallery(String galleryJson) {
        if (galleryJson == null || galleryJson.trim().isEmpty()) {
            return;
        }
        String trimmed = galleryJson.trim();
        if (!trimmed.startsWith("[")) {
            validateImage(trimmed);
            return;
        }
        try {
            ObjectMapper mapper = new ObjectMapper();
            List<?> list = mapper.readValue(trimmed, List.class);
            if (list != null) {
                for (Object item : list) {
                    if (item instanceof String dataUrl) {
                        validateImage(dataUrl);
                    }
                }
            }
        } catch (Exception e) {
            if (e instanceof IllegalArgumentException iae) {
                throw iae;
            }
        }
    }

    private void validateOperatingHours(String operatingHoursJson) {
        if (operatingHoursJson == null || operatingHoursJson.trim().isEmpty()) {
            return;
        }
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(operatingHoursJson);
            if (!root.isObject()) {
                throw new IllegalArgumentException("รูปแบบเวลาเปิด-ปิดไม่ถูกต้อง");
            }
            String[] days = { "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday" };
            Pattern timePattern = Pattern.compile("^([01]\\d|2[0-3]):[0-5]\\d$");

            for (String day : days) {
                JsonNode dayNode = root.get(day);
                if (dayNode != null && dayNode.isObject()) {
                    boolean active = dayNode.has("active") && dayNode.get("active").asBoolean();
                    if (active) {
                        String open = dayNode.has("open") ? dayNode.get("open").asText("").trim() : "";
                        String close = dayNode.has("close") ? dayNode.get("close").asText("").trim() : "";
                        if (open.isEmpty() || close.isEmpty()) {
                            throw new IllegalArgumentException("กรุณาระบุเวลาเปิดและเวลาปิดให้ครบถ้วน");
                        }
                        if (!timePattern.matcher(open).matches() || !timePattern.matcher(close).matches()) {
                            throw new IllegalArgumentException("รูปแบบเวลาเปิด-ปิดต้องเป็น HH:mm");
                        }
                    }
                }
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("รูปแบบเวลาเปิด-ปิดไม่ถูกต้อง");
        }
    }

    private void applyWellnessHubUpdates(
            WellnessHub target,
            WellnessHub updatedData) {

        target.setWellnessHubName(updatedData.getWellnessHubName());
        target.setAddress(updatedData.getAddress());
        target.setTelInformation(updatedData.getTelInformation());
        target.setGoogleMapsLink(updatedData.getGoogleMapsLink());
        target.setWellnessHubLatitude(updatedData.getWellnessHubLatitude());
        target.setWellnessHubLongitude(updatedData.getWellnessHubLongitude());

        if (updatedData.getWellnessHubDescription() != null) {
            target.setWellnessHubDescription(updatedData.getWellnessHubDescription().trim());
        }
        if (updatedData.getWellnessHubImg() != null) {
            target.setWellnessHubImg(updatedData.getWellnessHubImg().trim().isEmpty() ? null : updatedData.getWellnessHubImg().trim());
        }
        if (updatedData.getWellnessHubGallery() != null) {
            target.setWellnessHubGallery(updatedData.getWellnessHubGallery().trim().isEmpty() ? null : updatedData.getWellnessHubGallery().trim());
        }
        if (updatedData.getCertificateType() != null) {
            target.setCertificateType(updatedData.getCertificateType());
        }
        if (updatedData.getStatus() != null) {
            target.setStatus(updatedData.getStatus());
        }
        if (updatedData.getContactInformation() != null) {
            target.setContactInformation(updatedData.getContactInformation());
        }
        if (updatedData.getOperatingHours() != null) {
            target.setOperatingHours(updatedData.getOperatingHours());
        }

        if (updatedData.getUsername() != null && !updatedData.getUsername().trim().isEmpty()) {
            target.setUsername(updatedData.getUsername().trim());
        }
        if (updatedData.getPassword() != null && !updatedData.getPassword().trim().isEmpty()) {
            target.setPassword(updatedData.getPassword().trim());
        }

        target.setUpdatedAt(LocalDateTime.now());
    }

    private void updateEmergencyFields(EmergencyService target, WellnessHub source) {
        if (source.getWellnessHubName() != null)
            target.setWellnessHubName(source.getWellnessHubName());
        if (source.getUsername() != null && !source.getUsername().trim().isEmpty())
            target.setUsername(source.getUsername().trim());
        if (source.getPassword() != null && !source.getPassword().trim().isEmpty())
            target.setPassword(source.getPassword().trim());
        if (source.getAddress() != null)
            target.setAddress(source.getAddress());
        if (source.getContactInformation() != null)
            target.setContactInformation(source.getContactInformation());
        if (source.getTelInformation() != null)
            target.setTelInformation(source.getTelInformation());
        if (source.getGoogleMapsLink() != null)
            target.setGoogleMapsLink(source.getGoogleMapsLink());
        if (source.getWellnessHubDescription() != null)
            target.setWellnessHubDescription(source.getWellnessHubDescription());
        if (source.getWellnessHubImg() != null) {
            target.setWellnessHubImg(source.getWellnessHubImg().trim().isEmpty() ? null : source.getWellnessHubImg().trim());
        }
        if (source.getWellnessHubGallery() != null) {
            target.setWellnessHubGallery(source.getWellnessHubGallery().trim().isEmpty() ? null : source.getWellnessHubGallery().trim());
        }
        if (source.getCertificateType() != null)
            target.setCertificateType(source.getCertificateType());
        if (source.getOperatingHours() != null)
            target.setOperatingHours(source.getOperatingHours());
        if (source.getStatus() != null)
            target.setStatus(source.getStatus());

        if (source.getWellnessHubLatitude() != null) {
            target.setWellnessHubLatitude(source.getWellnessHubLatitude());
        }
        if (source.getWellnessHubLongitude() != null) {
            target.setWellnessHubLongitude(source.getWellnessHubLongitude());
        }

        target.setUpdatedAt(LocalDateTime.now());
    }

    @Transactional
    public boolean updateStatus(String id, String newStatus) {
        if (id == null || id.trim().isEmpty() || newStatus == null || newStatus.trim().isEmpty()) {
            return false;
        }

        String cleanStatus = newStatus.trim().toUpperCase();
        if (!"ACTIVE".equals(cleanStatus) && !"INACTIVE".equals(cleanStatus) && !"SUSPENDED".equals(cleanStatus)) {
            return false;
        }

        if (emergencyServiceRepository.existsById(id)) {
            EmergencyService service = emergencyServiceRepository.findById(id).orElse(null);
            if (service != null) {
                service.setStatus(cleanStatus);
                service.setUpdatedAt(LocalDateTime.now());
                emergencyServiceRepository.save(service);
                return true;
            }
        } else {
            WellnessHub hub = wellnessHubRepository.findById(id).orElse(null);
            if (hub != null) {
                hub.setStatus(cleanStatus);
                hub.setUpdatedAt(LocalDateTime.now());
                wellnessHubRepository.save(hub);
                return true;
            }
        }

        return false;
    }

    @Transactional
    public boolean deleteWellnessHub(String id) {
        boolean deleted = false;
        if (emergencyServiceRepository.existsById(id)) {
            emergencyServiceRepository.deleteById(id);
            deleted = true;
        } else {
            WellnessHub hub = wellnessHubRepository.findById(id).orElse(null);
            if (hub != null) {
                wellnessHubRepository.delete(hub);
                deleted = true;
            }
        }

        if (deleted) {
            List<AccountRequest> requests = accountRequestRepository.findByLicenseIdOrderByRequestIdDesc(id);
            if (requests != null && !requests.isEmpty()) {
                for (AccountRequest req : requests) {
                    req.setRequestStatus("REJECTED");
                    req.setRejectionReason("สถานประกอบการถูกลบโดยผู้ดูแลระบบ");
                    req.setProcessedDate(LocalDateTime.now());
                }
                accountRequestRepository.saveAll(requests);
            }
            return true;
        }
        return false;
    }

    private EmergencyService convertToEmergency(WellnessHub hub) {
        EmergencyService emergency = new EmergencyService();

        emergency.setLicenseId(hub.getLicenseId());
        emergency.setUsername(hub.getUsername());
        emergency.setPassword(hub.getPassword());
        emergency.setWellnessHubName(hub.getWellnessHubName());
        emergency.setAddress(hub.getAddress());
        emergency.setContactInformation(hub.getContactInformation());
        emergency.setTelInformation(hub.getTelInformation());
        emergency.setGoogleMapsLink(hub.getGoogleMapsLink());
        emergency.setWellnessHubDescription(hub.getWellnessHubDescription());
        emergency.setWellnessHubImg(hub.getWellnessHubImg());
        emergency.setWellnessHubGallery(hub.getWellnessHubGallery());
        emergency.setWellnessHubLatitude(hub.getWellnessHubLatitude());
        emergency.setWellnessHubLongitude(hub.getWellnessHubLongitude());
        emergency.setCertificateType(hub.getCertificateType());
        emergency.setOperatingHours(hub.getOperatingHours());
        emergency.setCategory(hub.getCategory());
        emergency.setDistrict(hub.getDistrict());
        emergency.setCreatedAt(hub.getCreatedAt());
        emergency.setUpdatedAt(hub.getUpdatedAt());
        emergency.setStatus(hub.getStatus() != null && !hub.getStatus().trim().isEmpty() ? hub.getStatus() : "ACTIVE");

        return emergency;
    }

    private WellnessHub convertEmergencyToWellnessHub(EmergencyService emergency) {
        WellnessHub hub = new WellnessHub();

        hub.setLicenseId(emergency.getLicenseId());
        hub.setUsername(emergency.getUsername());
        hub.setPassword(emergency.getPassword());
        hub.setWellnessHubName(emergency.getWellnessHubName());
        hub.setAddress(emergency.getAddress());
        hub.setContactInformation(emergency.getContactInformation());
        hub.setTelInformation(emergency.getTelInformation());
        hub.setGoogleMapsLink(emergency.getGoogleMapsLink());
        hub.setWellnessHubDescription(emergency.getWellnessHubDescription());
        hub.setWellnessHubImg(emergency.getWellnessHubImg());
        hub.setWellnessHubGallery(emergency.getWellnessHubGallery());
        hub.setWellnessHubLatitude(emergency.getWellnessHubLatitude());
        hub.setWellnessHubLongitude(emergency.getWellnessHubLongitude());
        hub.setCertificateType(emergency.getCertificateType());
        hub.setOperatingHours(emergency.getOperatingHours());
        hub.setCategory(emergency.getCategory());
        hub.setDistrict(emergency.getDistrict());
        hub.setCreatedAt(emergency.getCreatedAt());
        hub.setUpdatedAt(emergency.getUpdatedAt());
        hub.setStatus(emergency.getStatus() != null && !emergency.getStatus().trim().isEmpty() ? emergency.getStatus()
                : "ACTIVE");

        return hub;
    }

    // @PostConstruct
    public void migrateOldGoogleMapsLinks() {
        System.out.println("==================================================");
        System.out.println("🔄 [Data Migration] เริ่มตรวจสอบพิกัดข้อมูลเก่า");

        int wellnessSuccessCount = 0;
        int wellnessFailedCount = 0;

        int emergencySuccessCount = 0;
        int emergencyFailedCount = 0;

        List<WellnessHub> allHubs = wellnessHubRepository.findAll();

        for (WellnessHub hub : allHubs) {
            if (!shouldMigrateCoordinates(
                    hub.getGoogleMapsLink(),
                    hub.getWellnessHubLatitude(),
                    hub.getWellnessHubLongitude())) {
                continue;
            }

            try {
                extractCoordinates(hub);

                if (hub.getWellnessHubLatitude() != null && hub.getWellnessHubLongitude() != null) {
                    wellnessSuccessCount++;
                    System.out.println("✅ Wellness Hub: [" + hub.getWellnessHubName() + "] อัปเดตพิกัดสำเร็จ");
                } else {
                    wellnessFailedCount++;
                    System.out.println("🟡 Wellness Hub: [" + hub.getWellnessHubName() + "] ไม่สามารถสกัดพิกัดได้");
                }

                wellnessHubRepository.save(hub);
                Thread.sleep(500);

            } catch (InterruptedException exception) {
                System.err.println("❌ การ Migration ถูกขัดจังหวะ: " + exception.getMessage());
                Thread.currentThread().interrupt();
                break;
            } catch (Exception exception) {
                wellnessFailedCount++;
                System.err.println("❌ เกิดข้อผิดพลาดที่ Wellness Hub [" + hub.getWellnessHubName() + "]: " + exception.getMessage());
            }
        }

        List<EmergencyService> allEmergencyServices = emergencyServiceRepository.findAll();

        for (EmergencyService emergency : allEmergencyServices) {
            if (!shouldMigrateCoordinates(
                    emergency.getGoogleMapsLink(),
                    emergency.getWellnessHubLatitude(),
                    emergency.getWellnessHubLongitude())) {
                continue;
            }

            try {
                extractCoordinates(emergency);

                if (emergency.getWellnessHubLatitude() != null && emergency.getWellnessHubLongitude() != null) {
                    emergencySuccessCount++;
                    System.out.println("✅ Emergency Service: [" + emergency.getWellnessHubName() + "] อัปเดตพิกัดสำเร็จ");
                } else {
                    emergencyFailedCount++;
                    System.out.println("🟡 Emergency Service: [" + emergency.getWellnessHubName() + "] ไม่สามารถสกัดพิกัดได้");
                }

                emergencyServiceRepository.save(emergency);
                Thread.sleep(500);

            } catch (InterruptedException exception) {
                System.err.println("❌ การ Migration ถูกขัดจังหวะ: " + exception.getMessage());
                Thread.currentThread().interrupt();
                break;
            } catch (Exception exception) {
                emergencyFailedCount++;
                System.err.println("❌ เกิดข้อผิดพลาดที่ Emergency Service [" + emergency.getWellnessHubName() + "]: " + exception.getMessage());
            }
        }

        System.out.println("==================================================");
        System.out.println("🎉 [Data Migration] ตรวจสอบข้อมูลเก่าเสร็จสิ้น");
        System.out.println("🟢 Wellness Hub สำเร็จ: " + wellnessSuccessCount + " รายการ");
        System.out.println("🟡 Wellness Hub ไม่สำเร็จ: " + wellnessFailedCount + " รายการ");
        System.out.println("🟢 Emergency Service สำเร็จ: " + emergencySuccessCount + " รายการ");
        System.out.println("🟡 Emergency Service ไม่สำเร็จ: " + emergencyFailedCount + " รายการ");
        System.out.println("==================================================");
    }

    private boolean shouldMigrateCoordinates(
            String googleMapsLink,
            Double latitude,
            Double longitude) {
        if (googleMapsLink == null || googleMapsLink.trim().isEmpty()) {
            return false;
        }

        String normalizedLink = googleMapsLink.trim().toLowerCase();

        boolean validUrl = normalizedLink.startsWith("http://") || normalizedLink.startsWith("https://");
        boolean missingCoordinates = latitude == null || longitude == null;

        return validUrl && missingCoordinates;
    }

    /*
     * ========== MOBILE =====================
     */

    @Value("${google.maps.api-key:}")
    private String googleApiKey;

    // ลำดับวัน
    private static final List<String> DAY_ORDER = List.of(
            "monday", "tuesday", "wednesday", "thursday",
            "friday", "saturday", "sunday");

    // ชื่อวันภาษาไทย
    private static final Map<String, String> DAY_NAME_MAP = Map.of(
            "monday", "จันทร์",
            "tuesday", "อังคาร",
            "wednesday", "พุธ",
            "thursday", "พฤหัสบดี",
            "friday", "ศุกร์",
            "saturday", "เสาร์",
            "sunday", "อาทิตย์");
    private List<String> categoryIds;

    public List<WellnessHubDTO> getWellnessHubs() {
        return wellnessHubRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public WellnessHubDTO getWellnessHubDetail(String id) {
        WellnessHub hub = wellnessHubRepository.findById(id)
                .orElse(null);
        if (hub == null) {
            EmergencyService emer = emergencyServiceRepository.findById(id)
                    .orElseThrow(() -> new NoSuchElementException("ไม่พบข้อมูลสถานประกอบการ"));
            hub = convertEmergencyToWellnessHub(emer);
        }
        return convertToDTO(hub);
    }

    public List<WellnessHubDTO> searchHubs(String keyword) {
        return // ถูก — เรียกผ่าน object ที่ @Autowired ไว้
        wellnessHubRepository.searchByNameStartingWithAndHasAddress(keyword)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ==================== SEARCH WITH FILTER ====================

    public PagedResult searchWellnessHub(String keyword, String categoryId, Integer districtId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        String kw = (keyword == null || keyword.trim().isEmpty()) ? "" : keyword;
        Page<WellnessHub> result = wellnessHubRepository.searchWithFilter(kw, categoryId, districtId, pageable);

        PagedResult pagedResult = new PagedResult();
        pagedResult.setContent(result.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList()));
        pagedResult.setCurrentPage(result.getNumber());
        pagedResult.setTotalPages(result.getTotalPages());
        pagedResult.setTotalElements(result.getTotalElements());

        return pagedResult;
    }

    // ==================== TRAVEL TRIP ====================

    public PagedResult getHubsAlongRoute(Integer originId, Integer destId, int page, int size) {
        District origin = districtRepository.findById(originId)
                .orElseThrow(() -> new NoSuchElementException("ไม่พบอำเภอต้นทาง"));
        District dest = districtRepository.findById(destId)
                .orElseThrow(() -> new NoSuchElementException("ไม่พบอำเภอปลายทาง"));

        List<WellnessHub> allHubs = wellnessHubRepository.findHubsForRouteCalculation(originId, destId);

        RestTemplate restTemplate = new RestTemplate();
        String url = String.format(
                "https://maps.googleapis.com/maps/api/directions/json?origin=%f,%f&destination=%f,%f&key=%s",
                origin.getLatitude(), origin.getLongitude(),
                dest.getLatitude(), dest.getLongitude(),
                googleApiKey);

        JsonNode response = restTemplate.getForObject(url, JsonNode.class);
        List<double[]> routePoints = new ArrayList<>();

        if (response != null && response.has("routes") && response.get("routes").size() > 0) {
            String encodedPolyline = response.get("routes").get(0)
                    .get("overview_polyline").get("points").asText();
            routePoints = MapUtils.decodePolyline(encodedPolyline);
        }

        final List<double[]> finalRoutePoints = routePoints;

        List<WellnessHub> filteredHubs = allHubs.stream().filter(hub -> {
            if (hub.getDistrict() != null) {
                if (hub.getDistrict().getDistrictId().equals(originId) ||
                        hub.getDistrict().getDistrictId().equals(destId)) {
                    return true;
                }
            }

            if (!finalRoutePoints.isEmpty() &&
                    hub.getWellnessHubLatitude() != null &&
                    hub.getWellnessHubLongitude() != null) {
                for (double[] point : finalRoutePoints) {
                    double distance = MapUtils.calculateDistanceKm(
                            hub.getWellnessHubLatitude().doubleValue(),
                            hub.getWellnessHubLongitude().doubleValue(),
                            point[0], point[1]);
                    if (distance <= 8.0)
                        return true; // 🆕 เปลี่ยนจาก 5.0 เป็น 8.0
                }
            }
            return false;
        }).collect(Collectors.toList());

        int start = Math.min(page * size, filteredHubs.size());
        int end = Math.min((page + 1) * size, filteredHubs.size());

        List<WellnessHubDTO> pageContent = filteredHubs.subList(start, end).stream()
                .map(this::convertToSimpleDTO) // 🆕 เปลี่ยนจาก convertToDTO
                .collect(Collectors.toList());

        PagedResult pagedResult = new PagedResult();
        pagedResult.setContent(pageContent);
        pagedResult.setCurrentPage(page);
        pagedResult.setTotalElements((long) filteredHubs.size());
        pagedResult.setTotalPages((int) Math.ceil((double) filteredHubs.size() / size));

        return pagedResult;
    }

    // ==================== CONVERT TO DTO ====================

    private WellnessHubDTO convertToDTO(WellnessHub hub) {
        WellnessHubDTO dto = new WellnessHubDTO();
        dto.setLicenseId(hub.getLicenseId());
        dto.setWellnessHubName(hub.getWellnessHubName());
        dto.setAddress(hub.getAddress());
        dto.setTelInformation(hub.getTelInformation());

        dto.setWellnessHubLatitude(hub.getWellnessHubLatitude() != null
                ? hub.getWellnessHubLatitude().doubleValue()
                : 0.0);
        dto.setWellnessHubLongitude(hub.getWellnessHubLongitude() != null
                ? hub.getWellnessHubLongitude().doubleValue()
                : 0.0);

        if (hub.getCategory() != null) {
            dto.setCategory(hub.getCategory().getCategoryName());
        } else {
            dto.setCategory("ไม่ระบุหมวดหมู่");
        }

        // รูปภาพ
        if (hub.getWellnessHubImg() != null && !hub.getWellnessHubImg().isEmpty()) {
            String raw = hub.getWellnessHubImg();
            if (raw.startsWith("[")) {
                try {
                    ObjectMapper mapper = new ObjectMapper();
                    List<String> imgList = mapper.readValue(raw, new TypeReference<List<String>>() {
                    });
                    dto.setWellnessHubImg(imgList);
                } catch (Exception e) {
                    dto.setWellnessHubImg(List.of(raw));
                }
            } else {
                dto.setWellnessHubImg(List.of(raw));
            }
        } else {
            dto.setWellnessHubImg(List.of());
        }

        // ==================== เวลาเปิด-ปิด ====================
        String operatingHours = hub.getOperatingHours();

        if (operatingHours != null && operatingHours.trim().startsWith("{")) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                JsonNode root = mapper.readTree(operatingHours);

                String today = LocalDate.now(ZoneId.of("Asia/Bangkok"))
                        .getDayOfWeek()
                        .toString()
                        .toLowerCase();

                // 🆕 set openTime และ isOpen
                JsonNode todayNode = root.get(today);
                if (todayNode != null && todayNode.get("active").asBoolean()) {
                    String open = todayNode.get("open").asText();
                    String close = todayNode.get("close").asText();
                    String timeRange = open + "-" + close;
                    dto.setOpenTime(timeRange);
                    dto.setIsOpen(calculateIsOpen(timeRange));
                } else {
                    dto.setOpenTime("ปิดวันนี้");
                    dto.setIsOpen(false);
                }

                // weeklySchedule
                List<WellnessHubDTO.DayScheduleDTO> schedule = DAY_ORDER.stream()
                        .map(day -> {
                            WellnessHubDTO.DayScheduleDTO s = new WellnessHubDTO.DayScheduleDTO();
                            s.setDayOfWeek(day);
                            s.setDayNameThai(DAY_NAME_MAP.getOrDefault(day, day));
                            s.setToday(day.equals(today));

                            JsonNode dayNode = root.get(day);
                            if (dayNode != null && dayNode.get("active").asBoolean()) {
                                s.setOpenTime(dayNode.get("open").asText());
                                s.setCloseTime(dayNode.get("close").asText());
                            }
                            return s;
                        })
                        .collect(Collectors.toList());

                dto.setWeeklySchedule(schedule);
            } catch (Exception e) {
                dto.setOpenTime("ไม่มีข้อมูลเวลาเปิด-ปิด");
                dto.setIsOpen(false);
                dto.setWeeklySchedule(List.of());
            }
        } else {
            dto.setOpenTime("ไม่มีข้อมูลเวลาเปิด-ปิด");
            dto.setIsOpen(false);
            dto.setWeeklySchedule(List.of());
        }

        return dto;
    }

    private boolean calculateIsOpen(String timeRange) {
        if (timeRange == null || timeRange.isBlank() || !timeRange.contains("-"))
            return false;
        try {
            String cleanTime = timeRange.replace(".", ":").replaceAll(" ", "");
            String[] parts = cleanTime.split("-");
            String closeStr = (parts[1].equals("0:00") || parts[1].equals("00:00"))
                    ? "23:59"
                    : parts[1];

            LocalTime openTime = LocalTime.parse(parts[0]);
            LocalTime closeTime = LocalTime.parse(closeStr);
            LocalTime now = LocalTime.now(ZoneId.of("Asia/Bangkok"));

            if (closeTime.isBefore(openTime)) {
                return now.isAfter(openTime) || now.isBefore(closeTime);
            }
            return !now.isBefore(openTime) && !now.isAfter(closeTime);
        } catch (Exception e) {
            return false;
        }

    }

    private WellnessHubDTO convertToSimpleDTO(WellnessHub hub) {
        WellnessHubDTO dto = new WellnessHubDTO();
        dto.setLicenseId(hub.getLicenseId());
        dto.setWellnessHubName(hub.getWellnessHubName());
        dto.setAddress(hub.getAddress());
        dto.setTelInformation(hub.getTelInformation() != null ? hub.getTelInformation() : "");
        dto.setWellnessHubLatitude(hub.getWellnessHubLatitude() != null
                ? hub.getWellnessHubLatitude().doubleValue()
                : 0.0);
        dto.setWellnessHubLongitude(hub.getWellnessHubLongitude() != null
                ? hub.getWellnessHubLongitude().doubleValue()
                : 0.0);
        if (hub.getCategory() != null) {
            dto.setCategory(hub.getCategory().getCategoryName());
        } else {
            dto.setCategory("");
        }

        if (hub.getWellnessHubImg() != null && !hub.getWellnessHubImg().isEmpty()) {
            String raw = hub.getWellnessHubImg();
            if (raw.startsWith("[")) {
                try {
                    ObjectMapper mapper = new ObjectMapper();
                    List<String> imgList = mapper.readValue(raw, new TypeReference<List<String>>() {
                    });
                    dto.setWellnessHubImg(imgList.isEmpty() ? List.of() : List.of(imgList.get(0)));
                } catch (Exception e) {
                    dto.setWellnessHubImg(List.of());
                }
            } else {
                dto.setWellnessHubImg(List.of(raw));
            }
        } else {
            dto.setWellnessHubImg(List.of());
        }

        dto.setWeeklySchedule(List.of());
        dto.setIsOpen(false);
        dto.setOpenTime("");
        return dto;
    }

    public List<WellnessHubDTO> getHubsByDistricts(List<Integer> districtIds, List<String> categoryIds) {
        if (categoryIds == null || categoryIds.isEmpty()) {
            return List.of(); // ถ้าไม่มี category ส่งมา ไม่ดึงอะไรเลย
        }

        List<WellnessHub> hubs = wellnessHubRepository.findByDistrictIdsAndCategoryIds(districtIds, categoryIds);

        return hubs.stream()
                .map(this::convertToSimpleDTO)
                .collect(Collectors.toList());
    }

}