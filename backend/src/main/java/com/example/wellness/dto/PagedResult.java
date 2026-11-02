package com.example.wellness.dto;

import lombok.Data;

import java.util.List;

@Data
public class PagedResult {
    private List<WellnessHubDTO> content;
    private int currentPage;
    private int totalPages;
    private long totalElements;
}