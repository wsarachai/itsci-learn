package com.example.wellness.dto;

import lombok.Data;

@Data
public class EmergencyServiceDTO {
    private String licenseId;
    private String name;
    private String wellnessHubName;
    private String address;
    private String telInformation;
    private String contactInformation;
    private String wellnessHubDescription;
    private String googleMapsLink;
    private Double latitude;
    private Double longitude;
    private Double wellnessHubLatitude;
    private Double wellnessHubLongitude;
    private String type; // "BLS" หรือ "ALS"
    private String categoryId;
    private String categoryName;
    private String categoryKey;
    private Integer districtId;
    private String districtName;
    private Boolean isSkyDoctor;
    private String status;
}
