package com.example.wellness.controller;

import com.example.wellness.model.District;
import com.example.wellness.service.DistrictService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/districts")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class DistrictController {

    private final DistrictService districtService;

    public DistrictController(DistrictService districtService) {
        this.districtService = districtService;
    }

    @GetMapping
    public List<District> listAlldistrict() {
        return districtService.listAlldistrict();
    }
}