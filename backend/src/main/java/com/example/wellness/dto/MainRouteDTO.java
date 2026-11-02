package com.example.wellness.dto;

import lombok.Data;

import java.util.List;

@Data
public class MainRouteDTO {
    private Integer routeId;
    private String routeName;
    private String routeDescription;
    private List<String> categoryId; // เช่น ["C04","C05","C01"]
    private List<RoutePointDTO> routePoints;
    private String routeImage;
    private Integer pinCount; // 🆕 จำนวนจุดแวะ (จาก column pin_count ที่มีอยู่แล้วใน entity)

    @Data
    public static class RoutePointDTO {
        private Integer orderNumber;
        private Integer districtId;
        private String districtName;
        private Double latitude;
        private Double longitude;
    }

}