package com.example.wellness.dto;

import lombok.Data;

import java.util.List;

@Data
public class FilterResponseDTO {
    private List<CategoryItem> categories;
    private List<DistrictItem> districts;

    @Data
    public static class CategoryItem {
        private Integer categoryId;
        private String categoryName;
    }

    @Data
    public static class DistrictItem {
        private Integer districtId;
        private String districtName;
    }
}