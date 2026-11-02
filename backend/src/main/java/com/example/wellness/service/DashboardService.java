package com.example.wellness.service;

import com.example.wellness.model.EmergencyService;
import com.example.wellness.model.WellnessHub;
import com.example.wellness.repository.AccountRequestRepository;
import com.example.wellness.repository.EmergencyServiceRepository;
import com.example.wellness.repository.MainRouteRepository;
import com.example.wellness.repository.WellnessHubRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

        private static final String STATUS_PENDING = "PENDING";
        private static final String STATUS_APPROVED = "APPROVED";
        private static final String STATUS_REJECTED = "REJECTED";

        private final WellnessHubRepository wellnessHubRepository;
        private final EmergencyServiceRepository emergencyServiceRepository;
        private final MainRouteRepository mainRouteRepository;
        private final AccountRequestRepository accountRequestRepository;

        public DashboardService(
                        WellnessHubRepository wellnessHubRepository,
                        EmergencyServiceRepository emergencyServiceRepository,
                        MainRouteRepository mainRouteRepository,
                        AccountRequestRepository accountRequestRepository) {
                this.wellnessHubRepository = wellnessHubRepository;
                this.emergencyServiceRepository = emergencyServiceRepository;
                this.mainRouteRepository = mainRouteRepository;
                this.accountRequestRepository = accountRequestRepository;
        }

        @Transactional(readOnly = true)
        public Map<String, Object> getDashboardSummary() {
                // ดึงข้อมูลทั้งหมดเพียงครั้งเดียวด้วย JOIN FETCH เพื่อป้องกัน N+1 queries ข้ามอินเทอร์เน็ต
                List<WellnessHub> allHubs = wellnessHubRepository.findAllWithCategoryAndDistrict();
                List<EmergencyService> allEmergency = emergencyServiceRepository.findAllWithCategoryAndDistrict();

                long totalWellnessHubs = allHubs.size() + allEmergency.size();
                long totalMainRoutes = mainRouteRepository.count();
                long totalAccountRequests = accountRequestRepository.count();

                long pendingAccountRequests = accountRequestRepository
                                .countByRequestStatusIgnoreCase(STATUS_PENDING);

                long approvedAccountRequests = accountRequestRepository
                                .countByRequestStatusIgnoreCase(STATUS_APPROVED);

                long rejectedAccountRequests = accountRequestRepository
                                .countByRequestStatusIgnoreCase(STATUS_REJECTED);

                double approvedPercentage = calculatePercentage(approvedAccountRequests, totalAccountRequests);
                double rejectedPercentage = calculatePercentage(rejectedAccountRequests, totalAccountRequests);
                double pendingPercentage = calculatePercentage(pendingAccountRequests, totalAccountRequests);

                List<Map<String, Object>> wellnessHubsByCategory = getWellnessHubsByCategory(
                                allHubs, allEmergency, totalWellnessHubs);
                List<Map<String, Object>> wellnessHubsByDistrict = getWellnessHubsByDistrict(
                                allHubs, allEmergency);

                Map<String, Object> response = new LinkedHashMap<>();
                response.put("totalWellnessHubs", totalWellnessHubs);
                response.put("totalMainRoutes", totalMainRoutes);
                response.put("totalAccountRequests", totalAccountRequests);
                response.put("pendingAccountRequests", pendingAccountRequests);
                response.put("approvedAccountRequests", approvedAccountRequests);
                response.put("rejectedAccountRequests", rejectedAccountRequests);
                response.put("pendingPercentage", pendingPercentage);
                response.put("approvedPercentage", approvedPercentage);
                response.put("rejectedPercentage", rejectedPercentage);
                response.put("wellnessHubsByCategory", wellnessHubsByCategory);
                response.put("wellnessHubsByDistrict", wellnessHubsByDistrict);

                return response;
        }

        private List<Map<String, Object>> getWellnessHubsByCategory(
                        List<WellnessHub> allHubs,
                        List<EmergencyService> allEmergency,
                        long totalWellnessHubs) {

                Map<String, Map<String, Object>> categoryResults = new LinkedHashMap<>();

                for (WellnessHub wellnessHub : allHubs) {
                        if (wellnessHub.getCategory() == null ||
                                        wellnessHub.getCategory().getCategoryId() == null) {
                                continue;
                        }

                        addCategoryCount(
                                        categoryResults,
                                        wellnessHub.getCategory().getCategoryId(),
                                        wellnessHub.getCategory().getCategoryName());
                }

                for (EmergencyService emergencyService : allEmergency) {
                        if (emergencyService.getCategory() == null ||
                                        emergencyService.getCategory().getCategoryId() == null) {
                                continue;
                        }

                        addCategoryCount(
                                        categoryResults,
                                        emergencyService.getCategory().getCategoryId(),
                                        emergencyService.getCategory().getCategoryName());
                }

                List<Map<String, Object>> results = new ArrayList<>();

                for (Map<String, Object> categoryResult : categoryResults.values()) {
                        long wellnessHubCount = convertToLong(
                                        categoryResult.get("wellnessHubCount"));

                        categoryResult.put(
                                        "percentage",
                                        calculatePercentage(
                                                        wellnessHubCount,
                                                        totalWellnessHubs));

                        results.add(categoryResult);
                }

                results.sort(
                                Comparator.comparingLong(
                                                result -> -convertToLong(
                                                                result.get("wellnessHubCount"))));

                return results;
        }

        private void addCategoryCount(
                        Map<String, Map<String, Object>> categoryResults,
                        String categoryId,
                        String categoryName) {

                Map<String, Object> categoryResult = categoryResults.get(categoryId);

                if (categoryResult == null) {
                        categoryResult = new LinkedHashMap<>();
                        categoryResult.put("categoryId", categoryId);
                        categoryResult.put("categoryName", categoryName);
                        categoryResult.put("wellnessHubCount", 0L);
                        categoryResults.put(categoryId, categoryResult);
                }

                long currentCount = convertToLong(categoryResult.get("wellnessHubCount"));
                categoryResult.put("wellnessHubCount", currentCount + 1);
        }

        private List<Map<String, Object>> getWellnessHubsByDistrict(
                        List<WellnessHub> allHubs,
                        List<EmergencyService> allEmergency) {

                Map<Integer, Map<String, Object>> districtResults = new LinkedHashMap<>();
                Map<Integer, Map<String, Map<String, Object>>> categoryResultsByDistrict = new LinkedHashMap<>();

                for (WellnessHub wellnessHub : allHubs) {
                        if (wellnessHub.getDistrict() == null ||
                                        wellnessHub.getDistrict().getDistrictId() == null) {
                                continue;
                        }

                        Integer districtId = wellnessHub.getDistrict().getDistrictId();
                        String districtName = wellnessHub.getDistrict().getDistrictName();

                        districtResults.computeIfAbsent(districtId, id -> {
                                Map<String, Object> map = new LinkedHashMap<>();
                                map.put("districtId", id);
                                map.put("districtName", districtName);
                                map.put("wellnessHubCount", 0L);
                                return map;
                        });

                        Map<String, Object> distResult = districtResults.get(districtId);
                        distResult.put("wellnessHubCount", convertToLong(distResult.get("wellnessHubCount")) + 1);

                        if (wellnessHub.getCategory() != null &&
                                        wellnessHub.getCategory().getCategoryId() != null) {
                                addDistrictCategoryCount(
                                                categoryResultsByDistrict,
                                                districtId,
                                                wellnessHub.getCategory().getCategoryId(),
                                                wellnessHub.getCategory().getCategoryName());
                        }
                }

                for (EmergencyService emergencyService : allEmergency) {
                        if (emergencyService.getDistrict() == null ||
                                        emergencyService.getDistrict().getDistrictId() == null) {
                                continue;
                        }

                        Integer districtId = emergencyService.getDistrict().getDistrictId();
                        String districtName = emergencyService.getDistrict().getDistrictName();

                        districtResults.computeIfAbsent(districtId, id -> {
                                Map<String, Object> map = new LinkedHashMap<>();
                                map.put("districtId", id);
                                map.put("districtName", districtName);
                                map.put("wellnessHubCount", 0L);
                                return map;
                        });

                        Map<String, Object> distResult = districtResults.get(districtId);
                        distResult.put("wellnessHubCount", convertToLong(distResult.get("wellnessHubCount")) + 1);

                        if (emergencyService.getCategory() != null &&
                                        emergencyService.getCategory().getCategoryId() != null) {
                                addDistrictCategoryCount(
                                                categoryResultsByDistrict,
                                                districtId,
                                                emergencyService.getCategory().getCategoryId(),
                                                emergencyService.getCategory().getCategoryName());
                        }
                }

                List<Map<String, Object>> combinedResults = new ArrayList<>();

                for (Map.Entry<Integer, Map<String, Object>> entry : districtResults.entrySet()) {
                        Integer districtId = entry.getKey();
                        Map<String, Object> districtResult = entry.getValue();

                        Map<String, Map<String, Object>> categoryResults = categoryResultsByDistrict.getOrDefault(
                                        districtId,
                                        new LinkedHashMap<>());

                        List<Map<String, Object>> categoryList = new ArrayList<>(
                                        categoryResults.values());

                        categoryList.sort(
                                        Comparator.comparingLong(
                                                        category -> -convertToLong(
                                                                        category.get("wellnessHubCount"))));

                        districtResult.put("categoryList", categoryList);
                        combinedResults.add(districtResult);
                }

                combinedResults.sort(
                                Comparator.comparingLong(
                                                district -> -convertToLong(
                                                                district.get("wellnessHubCount"))));

                return combinedResults;
        }

        private void addDistrictCategoryCount(
                        Map<Integer, Map<String, Map<String, Object>>> categoryResultsByDistrict,
                        Integer districtId,
                        String categoryId,
                        String categoryName) {

                Map<String, Map<String, Object>> categoryResults = categoryResultsByDistrict.computeIfAbsent(
                                districtId,
                                key -> new LinkedHashMap<>());

                Map<String, Object> categoryResult = categoryResults.get(categoryId);

                if (categoryResult == null) {
                        categoryResult = new LinkedHashMap<>();
                        categoryResult.put("categoryId", categoryId);
                        categoryResult.put("categoryName", categoryName);
                        categoryResult.put("wellnessHubCount", 0L);
                        categoryResults.put(categoryId, categoryResult);
                }

                long currentCount = convertToLong(categoryResult.get("wellnessHubCount"));
                categoryResult.put("wellnessHubCount", currentCount + 1);
        }

        private Integer convertToInteger(Object value) {
                if (value == null) {
                        return null;
                }
                if (value instanceof Number number) {
                        return number.intValue();
                }
                return Integer.valueOf(value.toString());
        }

        private long convertToLong(Object value) {
                if (value == null) {
                        return 0L;
                }
                if (value instanceof Number number) {
                        return number.longValue();
                }
                return Long.parseLong(value.toString());
        }

        private double calculatePercentage(long amount, long total) {
                if (total <= 0) {
                        return 0.0;
                }
                return BigDecimal.valueOf(amount)
                                .multiply(BigDecimal.valueOf(100))
                                .divide(
                                                BigDecimal.valueOf(total),
                                                2,
                                                RoundingMode.HALF_UP)
                                .doubleValue();
        }
}