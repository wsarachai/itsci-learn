package com.example.wellness.dto;

import com.example.wellness.model.Category;
import com.example.wellness.model.District;

import java.time.LocalDateTime;

public class WellnessHubSummaryDTO {
    private String licenseId;
    private String wellnessHubName;
    private String address;
    private String contactInformation;
    private String telInformation;
    private String googleMapsLink;
    private String wellnessHubImg;
    private Double wellnessHubLatitude;
    private Double wellnessHubLongitude;
    private String status;
    private String certificateType;
    private String operatingHours;
    private Category category;
    private District district;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public WellnessHubSummaryDTO() {
    }

    public WellnessHubSummaryDTO(String licenseId, String wellnessHubName, String address,
                                String contactInformation, String telInformation, String googleMapsLink,
                                String wellnessHubImg, Double wellnessHubLatitude, Double wellnessHubLongitude,
                                String status, String certificateType, String operatingHours,
                                Category category, District district, LocalDateTime createdAt,
                                LocalDateTime updatedAt) {
        this.licenseId = licenseId;
        this.wellnessHubName = wellnessHubName;
        this.address = address;
        this.contactInformation = contactInformation;
        this.telInformation = telInformation;
        this.googleMapsLink = googleMapsLink;
        this.wellnessHubImg = wellnessHubImg;
        this.wellnessHubLatitude = wellnessHubLatitude;
        this.wellnessHubLongitude = wellnessHubLongitude;
        this.status = status;
        this.certificateType = certificateType;
        this.operatingHours = operatingHours;
        this.category = category;
        this.district = district;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getLicenseId() {
        return licenseId;
    }

    public void setLicenseId(String licenseId) {
        this.licenseId = licenseId;
    }

    public String getWellnessHubName() {
        return wellnessHubName;
    }

    public void setWellnessHubName(String wellnessHubName) {
        this.wellnessHubName = wellnessHubName;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getContactInformation() {
        return contactInformation;
    }

    public void setContactInformation(String contactInformation) {
        this.contactInformation = contactInformation;
    }

    public String getTelInformation() {
        return telInformation;
    }

    public void setTelInformation(String telInformation) {
        this.telInformation = telInformation;
    }

    public String getGoogleMapsLink() {
        return googleMapsLink;
    }

    public void setGoogleMapsLink(String googleMapsLink) {
        this.googleMapsLink = googleMapsLink;
    }

    public String getWellnessHubImg() {
        return wellnessHubImg;
    }

    public void setWellnessHubImg(String wellnessHubImg) {
        this.wellnessHubImg = wellnessHubImg;
    }

    public Double getWellnessHubLatitude() {
        return wellnessHubLatitude;
    }

    public void setWellnessHubLatitude(Double wellnessHubLatitude) {
        this.wellnessHubLatitude = wellnessHubLatitude;
    }

    public Double getWellnessHubLongitude() {
        return wellnessHubLongitude;
    }

    public void setWellnessHubLongitude(Double wellnessHubLongitude) {
        this.wellnessHubLongitude = wellnessHubLongitude;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCertificateType() {
        return certificateType;
    }

    public void setCertificateType(String certificateType) {
        this.certificateType = certificateType;
    }

    public String getOperatingHours() {
        return operatingHours;
    }

    public void setOperatingHours(String operatingHours) {
        this.operatingHours = operatingHours;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public District getDistrict() {
        return district;
    }

    public void setDistrict(District district) {
        this.district = district;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
