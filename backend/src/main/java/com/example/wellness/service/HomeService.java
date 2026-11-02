package com.example.wellness.service;

import com.example.wellness.dto.OfficialArticleSummaryDTO;
import com.example.wellness.model.Category;
import com.example.wellness.model.District;
import com.example.wellness.model.EmergencyService;
import com.example.wellness.model.MainRoute;
import com.example.wellness.model.MainRouteDetail;
import com.example.wellness.model.OfficialArticle;
import com.example.wellness.model.WellnessHub;
import com.example.wellness.repository.CategoryRepository;
import com.example.wellness.repository.EmergencyServiceRepository;
import com.example.wellness.repository.HomeRepository;
import com.example.wellness.repository.MainRouteRepository;
import com.example.wellness.repository.WellnessHubRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class HomeService {

        private static final Set<String> ALLOWED_SEARCH_TYPES = Set.of(
                        "ALL",
                        "WELLNESS_HUB",
                        "ROUTE",
                        "ARTICLE");

        private final HomeRepository homeRepository;
        private final MainRouteRepository mainRouteRepository;
        private final CategoryRepository categoryRepository;
        private final WellnessHubRepository wellnessHubRepository;
        private final EmergencyServiceRepository emergencyServiceRepository;
        private final ObjectMapper objectMapper;

        public HomeService(
                        HomeRepository homeRepository,
                        MainRouteRepository mainRouteRepository,
                        CategoryRepository categoryRepository,
                        WellnessHubRepository wellnessHubRepository,
                        EmergencyServiceRepository emergencyServiceRepository,
                        ObjectMapper objectMapper) {
                this.homeRepository = homeRepository;
                this.mainRouteRepository = mainRouteRepository;
                this.categoryRepository = categoryRepository;
                this.wellnessHubRepository = wellnessHubRepository;
                this.emergencyServiceRepository = emergencyServiceRepository;
                this.objectMapper = objectMapper;
        }

        /*
         * =====================================================
         * ดึงข้อมูลทั้งหมดที่ใช้ในหน้า Home
         * =====================================================
         */
        public Map<String, Object> getHomeData() {
                List<MainRoute> recommendedRoutes = homeRepository.findRecommendedRoutes();
                List<OfficialArticleSummaryDTO> latestArticles = homeRepository.findLatestArticles();

                Map<String, Object> homeData = new LinkedHashMap<>();
                homeData.put("recommendedRoutes", recommendedRoutes);
                homeData.put("latestArticles", latestArticles);

                return homeData;
        }

        public List<Map<String, Object>> getRecommendedRoutes() {
                List<MainRoute> routes = homeRepository.findRecommendedRoutes();
                return convertRoutes(routes);
        }

        public List<Map<String, Object>> getAllRoutes() {
                List<MainRoute> routes = homeRepository.findAllRoutes();
                return convertRoutes(routes);
        }

        private List<Map<String, Object>> convertRoutes(List<MainRoute> routes) {
                if (routes == null || routes.isEmpty()) {
                        return new ArrayList<>();
                }

                return routes.stream()
                                .map(this::convertRouteHomeResult)
                                .toList();
        }

        private Map<String, Object> convertRouteHomeResult(MainRoute route) {
                Map<String, Object> map = new LinkedHashMap<>();

                if (route == null) {
                        return map;
                }

                map.put("routeId", route.getRouteId());
                map.put("routeName", route.getRouteName());

                putIfNotBlank(map, "routeDescription", route.getRouteDescription());
                putIfNotBlank(map, "routeImage", buildRouteImageUrl(route.getRouteImage()));

                map.put("pinCount", route.getPinCount() == null ? 0 : route.getPinCount());
                map.put("createdAt", route.getCreatedAt());
                map.put("updatedAt", route.getUpdatedAt());

                // districts: ordered by orderNumber (nulls last)
                List<MainRouteDetail> sortedDetails = route.getDetails() == null
                                ? new ArrayList<>()
                                : new ArrayList<>(route.getDetails().stream()
                                                .filter(detail -> detail != null && detail.getDistrict() != null && detail.getOrderNumber() != null)
                                                .collect(Collectors.toMap(
                                                                MainRouteDetail::getOrderNumber,
                                                                d -> d,
                                                                (existing, replacement) -> existing,
                                                                TreeMap::new
                                                )).values());

                List<Map<String, Object>> districtMaps = new ArrayList<>();

                for (MainRouteDetail detail : sortedDetails) {
                        Map<String, Object> d = new LinkedHashMap<>();
                        d.put("orderNumber", detail.getOrderNumber());
                        d.put("districtId", detail.getDistrict().getDistrictId());
                        d.put("districtName", detail.getDistrict().getDistrictName());
                        districtMaps.add(d);
                }

                map.put("districts", districtMaps);

                /*
                 * =====================================================
                 * Districts Passed
                 * =====================================================
                 */
                String districtsPassed = sortedDetails.stream()
                                .map(detail -> detail.getDistrict().getDistrictName())
                                .filter(name -> name != null && !name.trim().isEmpty())
                                .distinct()
                                .collect(Collectors.joining(" → ", "", ""));

                putIfNotBlank(map, "districtsPassed", districtsPassed);

                /*
                 * =====================================================
                 * Categories
                 * =====================================================
                 */
                List<Category> categories = route.getCategories() != null
                                ? new ArrayList<>(route.getCategories())
                                : new ArrayList<>();

                List<Map<String, Object>> categoryMaps = categories.stream()
                                .map(category -> {
                                        Map<String, Object> categoryMapEntry = new LinkedHashMap<>();
                                        categoryMapEntry.put("categoryId", category.getCategoryId());
                                        categoryMapEntry.put("categoryName", category.getCategoryName());
                                        return categoryMapEntry;
                                })
                                .toList();

                map.put("categories", categoryMaps);

                String categoriesPassed = categories.stream()
                                .map(Category::getCategoryName)
                                .filter(name -> name != null && !name.trim().isEmpty())
                                .collect(Collectors.joining(", "));

                putIfNotBlank(map, "categoriesPassed", categoriesPassed);

                return map;
        }

        public List<OfficialArticleSummaryDTO> getLatestArticles() {
                List<OfficialArticleSummaryDTO> list = homeRepository.findLatestArticles();
                return sanitizeSummaryList(list);
        }

        public List<OfficialArticleSummaryDTO> getAllArticles() {
                List<OfficialArticleSummaryDTO> list = homeRepository.findAllArticles();
                return sanitizeSummaryList(list);
        }

        private List<OfficialArticleSummaryDTO> sanitizeSummaryList(List<OfficialArticleSummaryDTO> list) {
                if (list == null) return new ArrayList<>();
                for (OfficialArticleSummaryDTO dto : list) {
                        if (dto != null && dto.getArticleDetail() != null) {
                                String clean = dto.getArticleDetail()
                                                .replaceAll("<[^>]*>", " ")
                                                .replaceAll("&nbsp;", " ")
                                                .replaceAll("\\s+", " ")
                                                .trim();
                                if (clean.length() > 200) {
                                        clean = clean.substring(0, 200) + "...";
                                }
                                dto.setArticleDetail(clean);
                        }
                }
                return list;
        }

        /*
         * =====================================================
         * รายละเอียดเส้นทางท่องเที่ยว
         * =====================================================
         */
        public Map<String, Object> getRouteDetail(Integer routeId) {
                if (routeId == null || routeId <= 0) {
                        return null;
                }

                MainRoute route = mainRouteRepository.findByIdWithDetailsAndDistricts(routeId).orElse(null);
                if (route == null) {
                        return null;
                }

                List<MainRouteDetail> sortedDetails = route.getDetails() == null
                                ? new ArrayList<>()
                                : new ArrayList<>(route.getDetails()
                                                .stream()
                                                .filter(detail -> detail != null && detail.getDistrict() != null && detail.getOrderNumber() != null)
                                                .collect(Collectors.toMap(
                                                                MainRouteDetail::getOrderNumber,
                                                                d -> d,
                                                                (existing, replacement) -> existing,
                                                                TreeMap::new
                                                )).values());

                List<String> categoryIds = route.getCategories() != null
                                ? route.getCategories().stream()
                                                .map(Category::getCategoryId)
                                                .filter(Objects::nonNull)
                                                .toList()
                                : new ArrayList<>();

                List<Integer> districtIds = sortedDetails.stream()
                                .map(MainRouteDetail::getDistrict)
                                .map(District::getDistrictId)
                                .filter(id -> id != null)
                                .distinct()
                                .toList();

                List<Category> categories = route.getCategories() != null
                                ? new ArrayList<>(route.getCategories())
                                : new ArrayList<>();

                List<WellnessHub> wellnessHubs = new ArrayList<>();

                if (!districtIds.isEmpty() && !categoryIds.isEmpty()) {
                        List<WellnessHub> wellnessHubResults = wellnessHubRepository
                                        .findByDistrict_DistrictIdInAndCategory_CategoryIdIn(
                                                        districtIds,
                                                        categoryIds)
                                        .stream()
                                        .filter(this::isValidForMap)
                                        .toList();

                        List<WellnessHub> emergencyResults = emergencyServiceRepository
                                        .findByDistrict_DistrictIdInAndCategory_CategoryIdIn(
                                                        districtIds,
                                                        categoryIds)
                                        .stream()
                                        .filter(this::isValidForMapEmergency)
                                        .map(this::convertEmergencyToWellnessHub)
                                        .toList();

                        wellnessHubs.addAll(wellnessHubResults);
                        wellnessHubs.addAll(emergencyResults);
                }

                List<Map<String, Object>> districtMaps = new ArrayList<>();

                for (MainRouteDetail detail : sortedDetails) {
                        District district = detail.getDistrict();

                        Map<String, Object> districtMap = new LinkedHashMap<>();
                        districtMap.put("orderNumber", detail.getOrderNumber());
                        districtMap.put("districtId", district.getDistrictId());
                        districtMap.put("districtName", district.getDistrictName());
                        districtMap.put("latitude", district.getLatitude());
                        districtMap.put("longitude", district.getLongitude());

                        long wellnessHubCount = wellnessHubs.stream()
                                        .filter(hub -> hub.getDistrict() != null &&
                                                        district.getDistrictId().equals(
                                                                        hub.getDistrict().getDistrictId()))
                                        .count();

                        districtMap.put("wellnessHubCount", wellnessHubCount);
                        districtMaps.add(districtMap);
                }

                List<Map<String, Object>> categoryMaps = categories.stream()
                                .map(category -> {
                                        Map<String, Object> categoryMap = new LinkedHashMap<>();
                                        categoryMap.put("categoryId", category.getCategoryId());
                                        categoryMap.put("categoryName", category.getCategoryName());
                                        return categoryMap;
                                })
                                .toList();

                List<Map<String, Object>> wellnessHubMaps = wellnessHubs.stream()
                                .map(this::convertWellnessHubToMap)
                                .toList();

                String startDistrict = districtMaps.isEmpty()
                                ? null
                                : String.valueOf(districtMaps.get(0).get("districtName"));

                String endDistrict = districtMaps.isEmpty()
                                ? null
                                : String.valueOf(
                                                districtMaps.get(districtMaps.size() - 1)
                                                                .get("districtName"));

                Map<String, Object> result = new LinkedHashMap<>();
                result.put("routeId", route.getRouteId());
                result.put("routeName", route.getRouteName());

                putIfNotBlank(result, "routeDescription", route.getRouteDescription());
                putIfNotBlank(result, "routeImage", buildRouteImageUrl(route.getRouteImage()));

                if (startDistrict != null) {
                        result.put("startDistrict", startDistrict);
                }

                if (endDistrict != null) {
                        result.put("endDistrict", endDistrict);
                }

                result.put("districtCount", districtMaps.size());
                result.put("wellnessHubCount", wellnessHubMaps.size());
                result.put("categories", categoryMaps);
                result.put("districts", districtMaps);
                result.put("wellnessHubs", wellnessHubMaps);

                if (route.getUpdatedAt() != null) {
                        result.put("updatedAt", route.getUpdatedAt());
                }

                return result;
        }

        /*
         * =====================================================
         * รายละเอียดสถานประกอบการ
         * =====================================================
         */
        public Map<String, Object> getWellnessHubDetail(String licenseId) {
                if (licenseId == null || licenseId.trim().isEmpty()) {
                        return null;
                }

                String cleanId = licenseId.trim();

                WellnessHub wellnessHub = wellnessHubRepository
                                .findByIdWithCategoryAndDistrict(cleanId)
                                .orElseGet(() -> wellnessHubRepository.findById(cleanId).orElse(null));

                if (wellnessHub != null) {
                        return convertWellnessHubToMap(wellnessHub);
                }

                EmergencyService emergencyService = emergencyServiceRepository
                                .findByIdWithCategoryAndDistrict(cleanId)
                                .orElseGet(() -> emergencyServiceRepository.findById(cleanId).orElse(null));

                if (emergencyService != null) {
                        return convertWellnessHubToMap(
                                        convertEmergencyToWellnessHub(emergencyService));
                }

                return null;
        }

        /*
         * =====================================================
         * ระบบค้นหา (Search System)
         * =====================================================
         */
        public Map<String, Object> search(
                        String keyword,
                        String type) {
                String normalizedKeyword = keyword == null
                                ? ""
                                : keyword.trim();

                String normalizedType = type == null
                                ? "ALL"
                                : type.trim().toUpperCase(Locale.ROOT);

                if (normalizedKeyword.isEmpty()) {
                        throw new IllegalArgumentException(
                                        "กรุณากรอกคำค้นหา");
                }

                if (normalizedKeyword.length() > 100) {
                        throw new IllegalArgumentException(
                                        "คำค้นหาต้องไม่เกิน 100 ตัวอักษร");
                }

                if (!ALLOWED_SEARCH_TYPES.contains(normalizedType)) {
                        throw new IllegalArgumentException(
                                        "ประเภทการค้นหาไม่ถูกต้อง");
                }

                String searchKeyword = normalizedKeyword.toLowerCase(Locale.ROOT);

                List<Map<String, Object>> routeResults = new ArrayList<>();
                List<Map<String, Object>> wellnessHubResults = new ArrayList<>();
                List<Map<String, Object>> articleResults = new ArrayList<>();

                /*
                 * ค้นหาเส้นทาง
                 */
                if (normalizedType.equals("ALL") ||
                                normalizedType.equals("ROUTE")) {
                        routeResults = homeRepository
                                        .findAllRoutes()
                                        .stream()
                                        .filter(route -> containsKeyword(
                                                        route.getRouteName(),
                                                        searchKeyword) ||
                                                        containsKeyword(
                                                                        route.getRouteDescription(),
                                                                        searchKeyword))
                                        .map(this::convertRouteSearchResult)
                                        .toList();
                }

                /*
                 * ค้นหาสถานประกอบการ (ยิง Query ตรงจาก Database)
                 */
                if (normalizedType.equals("ALL") ||
                                normalizedType.equals("WELLNESS_HUB")) {
                        List<WellnessHub> wellnessHubList = wellnessHubRepository
                                        .searchPublicHubs(searchKeyword);

                        List<WellnessHub> emergencyList = emergencyServiceRepository
                                        .searchPublicEmergencyServices(searchKeyword)
                                        .stream()
                                        .map(this::convertEmergencyToWellnessHub)
                                        .toList();

                        List<WellnessHub> allResults = new ArrayList<>(wellnessHubList);
                        allResults.addAll(emergencyList);

                        wellnessHubResults = allResults.stream()
                                        .filter(hub -> hub.getStatus() == null || hub.getStatus().trim().isEmpty() || "ACTIVE".equalsIgnoreCase(hub.getStatus().trim()))
                                        .map(this::convertWellnessHubToSearchResult)
                                        .toList();
                }

                /*
                 * ค้นหาบทความ
                 */
                if (normalizedType.equals("ALL") ||
                                normalizedType.equals("ARTICLE")) {
                        articleResults = homeRepository
                                        .findAllArticles()
                                        .stream()
                                        .filter(article -> containsKeyword(
                                                        article.getArticleTitle(),
                                                        searchKeyword) ||
                                                        containsKeyword(
                                                                        article.getArticleDetail(),
                                                                        searchKeyword)
                                                        ||
                                                        containsKeyword(
                                                                        article.getArticleCategory(),
                                                                        searchKeyword))
                                        .map(this::convertArticleSearchResult)
                                        .toList();
                }

                int totalResults = routeResults.size() +
                                wellnessHubResults.size() +
                                articleResults.size();

                Map<String, Object> response = new LinkedHashMap<>();

                response.put("keyword", normalizedKeyword);
                response.put("type", normalizedType);
                response.put("totalResults", totalResults);
                response.put("routeCount", routeResults.size());
                response.put("wellnessHubCount", wellnessHubResults.size());
                response.put("articleCount", articleResults.size());
                response.put("routes", routeResults);
                response.put("wellnessHubs", wellnessHubResults);
                response.put("articles", articleResults);

                return response;
        }

        /*
         * =====================================================
         * Helper Methods
         * =====================================================
         */
        private boolean containsKeyword(
                        String value,
                        String keyword) {
                if (value == null || keyword == null) {
                        return false;
                }

                return value.toLowerCase(Locale.ROOT).contains(keyword);
        }

        private String buildRouteImageUrl(String routeImage) {
                if (routeImage == null || routeImage.trim().isEmpty()) {
                        return null;
                }

                String normalizedImage = routeImage.trim();

                if (normalizedImage.startsWith("http://")
                                || normalizedImage.startsWith("https://")) {
                        return normalizedImage;
                }

                if (normalizedImage.startsWith("/uploads/")) {
                        return "http://localhost:8080" + normalizedImage;
                }

                return "http://localhost:8080/uploads/routes/" + normalizedImage;
        }

        private Map<String, Object> convertRouteSearchResult(MainRoute route) {
                Map<String, Object> map = new LinkedHashMap<>();

                map.put("routeId", route.getRouteId());
                map.put("routeName", route.getRouteName());

                putIfNotBlank(map, "routeDescription", route.getRouteDescription());
                putIfNotBlank(map, "routeImage", buildRouteImageUrl(route.getRouteImage()));

                map.put("pinCount", route.getPinCount() == null ? 0 : route.getPinCount());

                if (route.getDetails() != null && !route.getDetails().isEmpty()) {
                        String districtsPassed = route.getDetails()
                                        .stream()
                                        .filter(detail -> detail != null && detail.getDistrict() != null)
                                        .sorted(Comparator.comparing(
                                                        MainRouteDetail::getOrderNumber,
                                                        Comparator.nullsLast(Comparator.naturalOrder())))
                                        .map(detail -> "อ." + detail.getDistrict().getDistrictName())
                                        .distinct()
                                        .reduce((first, second) -> first + " → " + second)
                                        .orElse("");

                        putIfNotBlank(map, "districtsPassed", districtsPassed);
                }

                return map;
        }

        private Map<String, Object> convertArticleSearchResult(OfficialArticleSummaryDTO article) {
                Map<String, Object> map = new LinkedHashMap<>();

                map.put("articleId", article.getArticleId());
                map.put("articleTitle", article.getArticleTitle());

                putIfNotBlank(map, "articleDetail", article.getArticleDetail());
                putIfNotBlank(map, "articleCategory", article.getArticleCategory());
                putIfNotBlank(map, "img", article.getImg());

                if (article.getPublishDate() != null) {
                        map.put("publishDate", article.getPublishDate());
                }

                return map;
        }



        private Map<String, Object> convertWellnessHubToSearchResult(WellnessHub wellnessHub) {
                Map<String, Object> map = new LinkedHashMap<>();

                map.put("licenseId", wellnessHub.getLicenseId());
                map.put("wellnessHubName", wellnessHub.getWellnessHubName());

                putIfNotBlank(map, "wellnessHubDescription", wellnessHub.getWellnessHubDescription());
                putIfNotBlank(map, "address", wellnessHub.getAddress());
                putIfNotBlank(map, "wellnessHubImg", wellnessHub.getWellnessHubImg());
                putIfNotBlank(map, "img", wellnessHub.getWellnessHubImg());

                if (wellnessHub.getCategory() != null) {
                        map.put("categoryId", wellnessHub.getCategory().getCategoryId());
                        putIfNotBlank(map, "categoryName", wellnessHub.getCategory().getCategoryName());
                }

                if (wellnessHub.getDistrict() != null) {
                        map.put("districtId", wellnessHub.getDistrict().getDistrictId());
                        putIfNotBlank(map, "districtName", wellnessHub.getDistrict().getDistrictName());
                }

                return map;
        }

        private Map<String, Object> convertWellnessHubToMap(WellnessHub wellnessHub) {
                Map<String, Object> map = new LinkedHashMap<>();

                map.put("licenseId", wellnessHub.getLicenseId());
                map.put("wellnessHubName", wellnessHub.getWellnessHubName());

                putIfNotBlank(map, "wellnessHubDescription", wellnessHub.getWellnessHubDescription());
                putIfNotBlank(map, "address", wellnessHub.getAddress());
                putIfNotBlank(map, "contactInformation", wellnessHub.getContactInformation());
                putIfNotBlank(map, "telInformation", wellnessHub.getTelInformation());
                putIfNotBlank(map, "googleMapsLink", wellnessHub.getGoogleMapsLink());
                putIfNotBlank(map, "wellnessHubImg", wellnessHub.getWellnessHubImg());
                putIfNotBlank(map, "img", wellnessHub.getWellnessHubImg());
                putIfNotBlank(map, "coverImage", wellnessHub.getWellnessHubImg());
                putIfNotBlank(map, "wellnessHubGallery", wellnessHub.getWellnessHubGallery());
                putIfNotBlank(map, "certificateType", wellnessHub.getCertificateType());
                putIfNotBlank(map, "operatingHours", wellnessHub.getOperatingHours());

                if (wellnessHub.getWellnessHubLatitude() != null) {
                        map.put("latitude", wellnessHub.getWellnessHubLatitude());
                }

                if (wellnessHub.getWellnessHubLongitude() != null) {
                        map.put("longitude", wellnessHub.getWellnessHubLongitude());
                }

                if (wellnessHub.getCategory() != null) {
                        map.put("categoryId", wellnessHub.getCategory().getCategoryId());
                        map.put("categoryName", wellnessHub.getCategory().getCategoryName());
                }

                if (wellnessHub.getDistrict() != null) {
                        map.put("districtId", wellnessHub.getDistrict().getDistrictId());
                        map.put("districtName", wellnessHub.getDistrict().getDistrictName());
                }

                return map;
        }

        private WellnessHub convertEmergencyToWellnessHub(EmergencyService emergencyService) {
                WellnessHub wellnessHub = new WellnessHub();

                wellnessHub.setLicenseId(emergencyService.getLicenseId());
                wellnessHub.setWellnessHubName(emergencyService.getWellnessHubName());
                wellnessHub.setAddress(emergencyService.getAddress());
                wellnessHub.setContactInformation(emergencyService.getContactInformation());
                wellnessHub.setTelInformation(emergencyService.getTelInformation());
                wellnessHub.setGoogleMapsLink(emergencyService.getGoogleMapsLink());
                wellnessHub.setWellnessHubDescription(emergencyService.getWellnessHubDescription());
                wellnessHub.setWellnessHubImg(emergencyService.getWellnessHubImg());
                wellnessHub.setWellnessHubGallery(emergencyService.getWellnessHubGallery());
                wellnessHub.setWellnessHubLatitude(emergencyService.getWellnessHubLatitude());
                wellnessHub.setWellnessHubLongitude(emergencyService.getWellnessHubLongitude());
                wellnessHub.setCertificateType(emergencyService.getCertificateType());
                wellnessHub.setOperatingHours(emergencyService.getOperatingHours());
                wellnessHub.setCategory(emergencyService.getCategory());
                wellnessHub.setDistrict(emergencyService.getDistrict());
                wellnessHub.setStatus(emergencyService.getStatus());

                return wellnessHub;
        }

        private boolean isValidGoogleMapsLink(String link) {
                if (link == null) return false;
                String trimmed = link.trim();
                return !trimmed.isEmpty() && !trimmed.startsWith("#") && !"null".equalsIgnoreCase(trimmed);
        }

        private boolean isValidCoordinate(Double lat, Double lng) {
                if (lat == null || lng == null) return false;
                if (lat.isNaN() || lng.isNaN() || (lat == 0.0 && lng == 0.0)) return false;
                return lat >= 17.0 && lat <= 20.5 && lng >= 98.0 && lng <= 100.0;
        }

        private boolean isValidForMap(WellnessHub hub) {
                if (hub == null) return false;
                String status = hub.getStatus();
                if (status != null && !status.trim().isEmpty() && !"ACTIVE".equalsIgnoreCase(status.trim())) {
                        return false;
                }
                if (!isValidGoogleMapsLink(hub.getGoogleMapsLink())) {
                        return false;
                }
                return isValidCoordinate(hub.getWellnessHubLatitude(), hub.getWellnessHubLongitude());
        }

        private boolean isValidForMapEmergency(EmergencyService emergency) {
                if (emergency == null) return false;
                String status = emergency.getStatus();
                if (status != null && !status.trim().isEmpty() && !"ACTIVE".equalsIgnoreCase(status.trim())) {
                        return false;
                }
                if (!isValidGoogleMapsLink(emergency.getGoogleMapsLink())) {
                        return false;
                }
                return isValidCoordinate(emergency.getWellnessHubLatitude(), emergency.getWellnessHubLongitude());
        }

        private void putIfNotBlank(
                        Map<String, Object> map,
                        String key,
                        String value) {
                if (value != null && !value.trim().isEmpty()) {
                        map.put(key, value.trim());
                }
        }
}