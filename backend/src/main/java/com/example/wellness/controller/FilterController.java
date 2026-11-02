package com.example.wellness.controller;

import com.example.wellness.repository.CategoryRepository;
import com.example.wellness.repository.DistrictRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


@RestController
@RequestMapping("/api/v1/filters")
// @RequiredArgsConstructor
public class FilterController {

    private final CategoryRepository categoryRepository;
    private final DistrictRepository districtRepository;

    public FilterController(CategoryRepository categoryRepository, DistrictRepository districtRepository) {
        this.categoryRepository = categoryRepository;
        this.districtRepository = districtRepository;
    }

        // ดึงรายการ Category ทั้งหมด
        @GetMapping("/categories")
        public ResponseEntity<?> getCategories() {
            List<Map<String, String>> result = categoryRepository.findAll()
                    .stream()
                    .map(c -> Map.of(
                            "categoryId", c.getCategoryId(),
                            "categoryName", c.getCategoryName()
                    ))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(result);
        }

        // ดึงรายการ District ทั้งหมด
        @GetMapping("/districts")
        public ResponseEntity<?> getDistricts() {
            List<Map<String, Object>> result = districtRepository.findAll()
                    .stream()
                    .map(d -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("districtId", d.getDistrictId());
                        map.put("districtName", d.getDistrictName());
                        return map;
                    })
                    .collect(Collectors.toList());
            return ResponseEntity.ok(result);
        }
    }
