package com.example.wellness.service;

import com.example.wellness.dto.MainRouteDTO;
import com.example.wellness.model.Category;
import com.example.wellness.model.District;
import com.example.wellness.model.MainRoute;
import com.example.wellness.model.MainRouteDetail;
import com.example.wellness.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MainRouteService {

    // 🌟 6. เพิ่มค่าคงที่สำหรับหมวดฉุกเฉิน
    private static final List<String> REQUIRED_EMERGENCY_CATEGORY_IDS = List.of("EM01", "EM02");

    private final MainRouteRepository mainRouteRepository;
    private final DistrictRepository districtRepository;
    private final CategoryRepository categoryRepository;
    private final WellnessHubRepository wellnessHubRepository;
    private final EmergencyServiceRepository emergencyServiceRepository;
    private final MainRouteDetailRepository mainRouteDetailRepository; // 🆕 เพิ่มบรรทัดนี้
    private final SupabaseStorageService supabaseStorageService;
    private final ObjectMapper objectMapper;

    public MainRouteService(
            MainRouteRepository mainRouteRepository,
            DistrictRepository districtRepository,
            CategoryRepository categoryRepository,
            WellnessHubRepository wellnessHubRepository,
            EmergencyServiceRepository emergencyServiceRepository,
            MainRouteDetailRepository mainRouteDetailRepository,
            SupabaseStorageService supabaseStorageService) {
        this.mainRouteRepository = mainRouteRepository;
        this.districtRepository = districtRepository;
        this.categoryRepository = categoryRepository;
        this.wellnessHubRepository = wellnessHubRepository;
        this.emergencyServiceRepository = emergencyServiceRepository;
        this.mainRouteDetailRepository = mainRouteDetailRepository;
        this.supabaseStorageService = supabaseStorageService;
        this.objectMapper = new ObjectMapper();
    }

    // 🌟 6. เพิ่ม Helper Normalize เพื่อรวม EM01 และ EM02 เสมอ
    private List<String> normalizeCategoryIds(Object categoryIdsRaw) {
        LinkedHashSet<String> categoryIds = new LinkedHashSet<>();

        if (categoryIdsRaw instanceof List<?> rawList) {
            rawList.stream()
                    .filter(Objects::nonNull)
                    .map(Object::toString)
                    .map(String::trim)
                    .filter(value -> !value.isEmpty())
                    .forEach(categoryIds::add);
        } else if (categoryIdsRaw != null) {
            String value = categoryIdsRaw.toString().trim();
            if (!value.isEmpty()) {
                categoryIds.add(value);
            }
        }

        categoryIds.addAll(REQUIRED_EMERGENCY_CATEGORY_IDS);

        return new ArrayList<>(categoryIds);
    }

    public List<MainRoute> getAllMainRoutes() {
        return mainRouteRepository.findAll();
    }

    @Transactional(readOnly = true)
    public MainRoute getMainRouteById(Integer id) {
        MainRoute route = mainRouteRepository.findByIdWithDetailsAndDistricts(id)
                .orElseGet(() -> mainRouteRepository.findById(id).orElse(null));
        if (route != null && route.getDetails() != null) {
            List<MainRouteDetail> deduplicated = new ArrayList<>(route.getDetails().stream()
                    .filter(d -> d != null && d.getOrderNumber() != null)
                    .collect(Collectors.toMap(
                            MainRouteDetail::getOrderNumber,
                            d -> d,
                            (existing, replacement) -> existing,
                            TreeMap::new
                    )).values());
            route.setDetails(deduplicated);
        }
        return route;
    }

    // 🏛️ เมธอดสำหรับดึงข้อมูลสรุปไปแสดงที่หน้าตาราง ListMainRoute
    public List<Map<String, Object>> listMainRoute() {

        List<MainRoute> routes = mainRouteRepository.findAllWithDetailsAndDistricts();
        routes.sort((a, b) -> {
            LocalDateTime timeA = a.getUpdatedAt() != null ? a.getUpdatedAt() : a.getCreatedAt();
            LocalDateTime timeB = b.getUpdatedAt() != null ? b.getUpdatedAt() : b.getCreatedAt();
            if (timeA != null && timeB != null) {
                return timeB.compareTo(timeA);
            }
            if (timeA == null && timeB != null) return 1;
            if (timeA != null && timeB == null) return -1;
            return Integer.compare(b.getRouteId() != null ? b.getRouteId() : 0, a.getRouteId() != null ? a.getRouteId() : 0);
        });

        List<Map<String, Object>> resultList = new ArrayList<>();

        for (MainRoute route : routes) {

            Map<String, Object> map = new HashMap<>();

            map.put("routeId", route.getRouteId());
            map.put("routeName", route.getRouteName());
            map.put("routeDescription", route.getRouteDescription());
            map.put("routeImage", route.getRouteImage());

            String districtsPassed = route.getDetails() != null
                    ? route.getDetails().stream()
                            .filter(d -> d != null && d.getDistrict() != null && d.getOrderNumber() != null)
                            .collect(Collectors.toMap(
                                    MainRouteDetail::getOrderNumber,
                                    d -> d,
                                    (existing, replacement) -> existing,
                                    TreeMap::new
                            ))
                            .values().stream()
                            .map(d -> "อ." + d.getDistrict().getDistrictName())
                            .collect(Collectors.joining(" -> "))
                    : "";

            map.put("districtsPassed", districtsPassed.isEmpty() ? "ยังไม่ได้กำหนดอำเภอ" : districtsPassed);

            String categoriesPassed = route.getCategories() != null && !route.getCategories().isEmpty()
                    ? route.getCategories().stream()
                            .map(Category::getCategoryName)
                            .filter(Objects::nonNull)
                            .filter(name -> !name.trim().isEmpty())
                            .collect(Collectors.joining(", "))
                    : "ยังไม่ได้กำหนดหมวดหมู่";

            map.put("categoriesPassed", categoriesPassed);
            map.put("createdBy", route.getCreatedBy());
            map.put("createdAt", route.getCreatedAt());
            map.put("updatedAt", route.getUpdatedAt());
            map.put("pinCount", route.getPinCount());

            resultList.add(map);
        }

        return resultList;
    }

    // 🌟 7. แก้การนับหมุดให้รวมทั้ง wellness_hubs และ emergency_services
    private void calculatePinCount(MainRoute route) {

        final List<String> categoryIds = new ArrayList<>();

        if (route.getCategories() != null) {
            categoryIds.addAll(
                    route.getCategories().stream()
                            .map(Category::getCategoryId)
                            .filter(Objects::nonNull)
                            .toList()
            );
        }

        // รวม EM01 และ EM02 เสมอ
        categoryIds.addAll(REQUIRED_EMERGENCY_CATEGORY_IDS);

        List<String> distinctCategoryIds = categoryIds.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .distinct()
                .toList();

        List<Integer> districtIds = route.getDetails()
                .stream()
                .filter(detail -> detail.getDistrict() != null)
                .map(detail -> detail.getDistrict().getDistrictId())
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        if (districtIds.isEmpty() || distinctCategoryIds.isEmpty()) {
            route.setPinCount(0);
            return;
        }

        long wellnessHubCount = wellnessHubRepository.findByDistrict_DistrictIdInAndCategory_CategoryIdIn(
                        districtIds, distinctCategoryIds)
                .stream()
                .filter(this::isValidHubForPinCount)
                .count();

        long emergencyServiceCount = emergencyServiceRepository.findByDistrict_DistrictIdInAndCategory_CategoryIdIn(
                        districtIds, distinctCategoryIds)
                .stream()
                .filter(this::isValidEmergencyForPinCount)
                .count();

        route.setPinCount(
                (int) (wellnessHubCount + emergencyServiceCount));
    }

    private boolean isValidGoogleMapsLink(String link) {
        if (link == null) return false;
        String trimmed = link.trim();
        return !trimmed.isEmpty() && !trimmed.startsWith("#") && !"null".equalsIgnoreCase(trimmed);
    }

    private boolean isValidHubForPinCount(com.example.wellness.model.WellnessHub hub) {
        if (hub == null) return false;
        if (hub.getStatus() != null && !hub.getStatus().trim().isEmpty() && !"ACTIVE".equalsIgnoreCase(hub.getStatus().trim())) {
            return false;
        }
        if (!isValidGoogleMapsLink(hub.getGoogleMapsLink())) {
            return false;
        }
        return isValidCoordinate(hub.getWellnessHubLatitude(), hub.getWellnessHubLongitude());
    }

    private boolean isValidEmergencyForPinCount(com.example.wellness.model.EmergencyService emergency) {
        if (emergency == null) return false;
        if (emergency.getStatus() != null && !emergency.getStatus().trim().isEmpty() && !"ACTIVE".equalsIgnoreCase(emergency.getStatus().trim())) {
            return false;
        }
        if (!isValidGoogleMapsLink(emergency.getGoogleMapsLink())) {
            return false;
        }
        return isValidCoordinate(emergency.getWellnessHubLatitude(), emergency.getWellnessHubLongitude());
    }

    private boolean isValidCoordinate(
            Double latitude,
            Double longitude) {
        return latitude != null
                && longitude != null
                && !latitude.isNaN()
                && !longitude.isNaN()
                && !(latitude == 0.0 && longitude == 0.0)
                && latitude >= 17.0
                && latitude <= 20.5
                && longitude >= 98.0
                && longitude <= 100.0;
    }

    // 🟢 เมธอดสร้างเส้นทางท่องเที่ยวใหม่
    @Transactional
    public MainRoute createMainRoute(Map<String, Object> payload) {
        if (payload == null) {
            throw new IllegalArgumentException("กรุณาระบุข้อมูลเส้นทาง");
        }

        // 1. routeName: required, 5–50 ตัว
        Object nameObj = payload.get("routeName");
        if (nameObj == null || nameObj.toString().trim().isEmpty()) {
            throw new IllegalArgumentException("กรุณาระบุชื่อเส้นทาง");
        }
        String routeName = nameObj.toString().trim();
        if (routeName.length() < 5 || routeName.length() > 50) {
            throw new IllegalArgumentException("ชื่อเส้นทางต้องมีความยาว 5-50 ตัวอักษร");
        }

        // 2. routeDescription: optional, แต่ถ้ามีต้อง 10–255 ตัว
        Object descObj = payload.get("routeDescription");
        String routeDescription = "";
        if (descObj != null && !descObj.toString().trim().isEmpty()) {
            routeDescription = descObj.toString().trim();
            if (routeDescription.length() < 10 || routeDescription.length() > 255) {
                throw new IllegalArgumentException("รายละเอียดเส้นทางต้องมีความยาว 10-255 ตัวอักษร");
            }
        }

        // 3. District: ต้องมีอย่างน้อย 2 อำเภอ
        List<Map<String, Object>> detailsRaw = (List<Map<String, Object>>) payload.get("details");
        if (detailsRaw == null || detailsRaw.size() < 2) {
            throw new IllegalArgumentException("กรุณาเลือกอำเภออย่างน้อย 2 อำเภอ");
        }

        MainRoute route = convertPayloadToEntity(payload);
        route.setRouteName(routeName);
        route.setRouteDescription(routeDescription);

        route.setCreatedAt(LocalDateTime.now());
        route.setUpdatedAt(LocalDateTime.now());
        route.setCreatedBy(
                payload.get("createdBy") != null ? payload.get("createdBy").toString() : "admin");

        if (route.getDetails() != null) {
            for (MainRouteDetail detail : route.getDetails()) {
                detail.setMainRoute(route);
            }
        }

        calculatePinCount(route);

        return mainRouteRepository.save(route);
    }

    // 🟡 เมธอดแก้ไขอัปเดตทับข้อมูลเดิม
    @Transactional
    public MainRoute editMainRoute(Integer id, Map<String, Object> payload) {
        if (payload == null) {
            throw new IllegalArgumentException("กรุณาระบุข้อมูลเส้นทาง");
        }

        MainRoute oldRoute = mainRouteRepository.findById(id).orElse(null);
        if (oldRoute == null) {
            return null;
        }

        // 1. routeName: required, 5–50 ตัว
        Object nameObj = payload.get("routeName");
        if (nameObj == null || nameObj.toString().trim().isEmpty()) {
            throw new IllegalArgumentException("กรุณาระบุชื่อเส้นทาง");
        }
        String routeName = nameObj.toString().trim();
        if (routeName.length() < 5 || routeName.length() > 50) {
            throw new IllegalArgumentException("ชื่อเส้นทางต้องมีความยาว 5-50 ตัวอักษร");
        }

        // 2. routeDescription: optional แต่ถ้ามีต้อง 10–255 ตัว
        Object descObj = payload.get("routeDescription");
        String routeDescription = "";
        if (descObj != null && !descObj.toString().trim().isEmpty()) {
            routeDescription = descObj.toString().trim();
            if (routeDescription.length() < 10 || routeDescription.length() > 255) {
                throw new IllegalArgumentException("รายละเอียดเส้นทางต้องมีความยาว 10-255 ตัวอักษร");
            }
        }

        // 3. District: ต้องมีอย่างน้อย 2 อำเภอ
        List<Map<String, Object>> detailsRaw = (List<Map<String, Object>>) payload.get("details");
        if (detailsRaw == null || detailsRaw.size() < 2) {
            throw new IllegalArgumentException("กรุณาเลือกอำเภออย่างน้อย 2 อำเภอ");
        }

        MainRoute incomingRoute = convertPayloadToEntity(payload);

        oldRoute.setRouteName(routeName);
        oldRoute.setRouteDescription(routeDescription);
        oldRoute.setCategories(incomingRoute.getCategories());
        if (payload.containsKey("routeImage")) {
            oldRoute.setRouteImage(incomingRoute.getRouteImage());
        }

        oldRoute.getDetails().clear();

        if (incomingRoute.getDetails() != null) {
            for (MainRouteDetail detail : incomingRoute.getDetails()) {
                detail.setMainRoute(oldRoute);
                oldRoute.getDetails().add(detail);
            }
        }

        oldRoute.setUpdatedAt(LocalDateTime.now());

        calculatePinCount(oldRoute);

        return mainRouteRepository.save(oldRoute);
    }

    // 🛠️ 6. ปรับปรุงตรรกะแปลง Payload เป็น Entity ให้บังคับเซฟ EM01, EM02 เสมอ
    private MainRoute convertPayloadToEntity(Map<String, Object> payload) {
        MainRoute route = new MainRoute();

        route.setRouteName(payload.get("routeName") != null ? payload.get("routeName").toString().trim() : "");
        route.setRouteDescription(
                payload.get("routeDescription") != null
                        ? payload.get("routeDescription").toString().trim()
                        : "");

        // Set route image if provided in payload (รองรับทั้ง Base64 และ Supabase Storage Public URL)
        if (payload.get("routeImage") != null) {
            String rawImage = payload.get("routeImage").toString().trim();
            if (!rawImage.isEmpty()) {
                if (rawImage.startsWith("data:")) {
                    if (!rawImage.startsWith("data:image/png") && !rawImage.startsWith("data:image/jpeg") && !rawImage.startsWith("data:image/jpg")) {
                        throw new IllegalArgumentException("ต้องเป็นไฟล์รูปภาพนามสกุล .png, .jpg และ .jpeg เท่านั้น");
                    }
                    if (rawImage.length() > 28_000_000) {
                        throw new IllegalArgumentException("ขนาดไฟล์รูปภาพต้องไม่เกิน 20 MB");
                    }
                }
                route.setRouteImage(supabaseStorageService.uploadBase64OrReturnUrl(rawImage, "routes"));
            }
        }

        List<String> categoryIds = normalizeCategoryIds(payload.get("categoryIds"));
        List<Category> foundCategories = categoryRepository.findAllById(categoryIds);
        Set<String> foundIds = foundCategories.stream()
                .map(c -> c.getCategoryId().toUpperCase())
                .collect(Collectors.toSet());

        for (String catId : categoryIds) {
            if (!foundIds.contains(catId.trim().toUpperCase())) {
                throw new IllegalArgumentException("ไม่พบหมวดหมู่รหัส " + catId);
            }
        }
        route.setCategories(new HashSet<>(foundCategories));

        List<MainRouteDetail> detailList = new ArrayList<>();
        List<Map<String, Object>> detailsRaw = (List<Map<String, Object>>) payload.get("details");

        if (detailsRaw != null) {
            Set<Integer> orderNumbers = new HashSet<>();
            Set<Integer> districtIds = new HashSet<>();
            for (Map<String, Object> raw : detailsRaw) {
                if (raw.get("orderNumber") == null || raw.get("districtId") == null) {
                    throw new IllegalArgumentException("ข้อมูลลำดับอำเภอไม่ถูกต้อง");
                }
                MainRouteDetail detail = new MainRouteDetail();

                int orderNumber = Integer.parseInt(raw.get("orderNumber").toString());
                if (!orderNumbers.add(orderNumber)) {
                    throw new IllegalArgumentException("ลำดับอำเภอต้องไม่ซ้ำกัน");
                }
                detail.setOrderNumber(orderNumber);

                Integer districtId = Integer.parseInt(raw.get("districtId").toString());
                if (!districtIds.add(districtId)) {
                    throw new IllegalArgumentException("ไม่สามารถเลือกอำเภอซ้ำกันในเส้นทางได้");
                }
                District dist = districtRepository.findById(districtId)
                        .orElseThrow(() -> new IllegalArgumentException("ไม่พบอำเภอรหัส " + districtId));

                detail.setDistrict(dist);
                detailList.add(detail);
            }
        }

        route.setDetails(detailList);

        return route;
    }

    // 🗑️ เมธอดสำหรับลบข้อมูลเส้นทางสุขภาพหลัก
    @Transactional
    public boolean deleteMainRoute(Integer id) {
        if (mainRouteRepository.existsById(id)) {
            mainRouteRepository.deleteById(id);
            return true;
        }

        return false;
    }

    /*
     * ================= MOBILE ====================
     * 
     */

    public List<MainRouteDTO> listMainRouteUser() {
        return mainRouteRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public MainRouteDTO getRouteById(Integer routeId) {
        MainRoute route = mainRouteRepository.findById(routeId)
                .orElseThrow(() -> new NoSuchElementException("ไม่พบเส้นทาง"));
        return convertToDTO(route);
    }

    private MainRouteDTO convertToDTO(MainRoute route) {
        MainRouteDTO dto = new MainRouteDTO();
        dto.setRouteId(route.getRouteId());
        dto.setRouteName(route.getRouteName());
        dto.setRouteDescription(route.getRouteDescription());
        dto.setRouteImage(route.getRouteImage());
        dto.setPinCount(route.getPinCount());

        if (route.getCategories() != null) {
            List<String> categoryIds = route.getCategories().stream()
                    .map(Category::getCategoryId)
                    .filter(Objects::nonNull)
                    .toList();
            dto.setCategoryId(categoryIds);
        } else {
            dto.setCategoryId(List.of());
        }

        // route points เหมือนเดิม

        List<MainRouteDetail> details = mainRouteDetailRepository
                .findByMainRouteRouteIdOrderByOrderNumberAsc(route.getRouteId());

        List<MainRouteDTO.RoutePointDTO> points = details.stream()
                .map(detail -> {
                    MainRouteDTO.RoutePointDTO point = new MainRouteDTO.RoutePointDTO();
                    point.setOrderNumber(detail.getOrderNumber());
                    if (detail.getDistrict() != null) {
                        point.setDistrictId(detail.getDistrict().getDistrictId());
                        point.setDistrictName(detail.getDistrict().getDistrictName());
                        point.setLatitude(detail.getDistrict().getLatitude());
                        point.setLongitude(detail.getDistrict().getLongitude());
                    }
                    return point;
                })
                .collect(Collectors.toList());

        dto.setRoutePoints(points);
        return dto;
    }
}