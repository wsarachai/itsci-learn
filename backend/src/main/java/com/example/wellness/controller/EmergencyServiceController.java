package com.example.wellness.controller;

import com.example.wellness.dto.EmergencyServiceDTO;
import com.example.wellness.model.EmergencyService;

import com.example.wellness.repository.EmergencyServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/api/v1/emergency-services", "/api/emergency-services"})
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
// @RequiredArgsConstructor
public class EmergencyServiceController {

    private final EmergencyServiceRepository emergencyServiceRepository;

    public EmergencyServiceController(EmergencyServiceRepository emergencyServiceRepository) {
        this.emergencyServiceRepository = emergencyServiceRepository;
    }

    @GetMapping
    public ResponseEntity<?> getAllEmergencyServices() {
        try {
            List<EmergencyServiceDTO> result = emergencyServiceRepository
                    .findAllEmergencyServices()
                    .stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("เกิดข้อผิดพลาด: " + e.getMessage());
        }
    }

    @GetMapping("/by-districts")
    public ResponseEntity<?> getByDistricts(
            @RequestParam String districtId) {
        try {
            List<Integer> ids = Arrays.stream(districtId.split(","))
                    .map(Integer::parseInt)
                    .collect(Collectors.toList());

            List<EmergencyServiceDTO> result = emergencyServiceRepository
                    .findByDistrictIds(ids)
                    .stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("เกิดข้อผิดพลาด: " + e.getMessage());
        }
    }

    private EmergencyServiceDTO convertToDTO(EmergencyService e) {
        EmergencyServiceDTO dto = new EmergencyServiceDTO();
        dto.setLicenseId(e.getLicenseId());
        dto.setName(e.getWellnessHubName());
        dto.setWellnessHubName(e.getWellnessHubName());
        dto.setAddress(e.getAddress());
        dto.setTelInformation(e.getTelInformation());
        dto.setContactInformation(e.getContactInformation());
        dto.setWellnessHubDescription(e.getWellnessHubDescription());
        dto.setGoogleMapsLink(e.getGoogleMapsLink());

        Double lat = e.getWellnessHubLatitude() != null ? e.getWellnessHubLatitude().doubleValue() : 0.0;
        Double lng = e.getWellnessHubLongitude() != null ? e.getWellnessHubLongitude().doubleValue() : 0.0;
        dto.setLatitude(lat);
        dto.setLongitude(lng);
        dto.setWellnessHubLatitude(lat);
        dto.setWellnessHubLongitude(lng);

        if (e.getCategory() != null) {
            dto.setType(e.getCategory().getCategoryId());
            dto.setCategoryId(e.getCategory().getCategoryId());
            dto.setCategoryName(e.getCategory().getCategoryName());
            dto.setCategoryKey(e.getCategory().getCategoryId());
        }

        if (e.getDistrict() != null) {
            dto.setDistrictId(e.getDistrict().getDistrictId());
            dto.setDistrictName(e.getDistrict().getDistrictName());
        }

        boolean isSkyDoc = (e.getCategory() != null && "SKY_DOCTOR".equalsIgnoreCase(e.getCategory().getCategoryId()))
                || (e.getWellnessHubName() != null && e.getWellnessHubName().toLowerCase().contains("sky doctor"))
                || (e.getLicenseId() != null && e.getLicenseId().toUpperCase().contains("SKYDOC"));
        dto.setIsSkyDoctor(isSkyDoc);
        dto.setStatus(e.getStatus() != null ? e.getStatus() : "ACTIVE");

        return dto;
    }
}
