package com.example.wellness.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "wellness_hubs", indexes = {
    @Index(name = "idx_wellness_hubs_status", columnList = "status"),
    @Index(name = "idx_wellness_hubs_category", columnList = "category_id"),
    @Index(name = "idx_wellness_hubs_district", columnList = "district_id"),
    @Index(name = "idx_wellness_hubs_name", columnList = "wellness_hub_name")
})
@Data
public class WellnessHub {

    @Id
    @Column(name = "license_id", length = 100)
    private String licenseId; // ตรงกับ "เลขใบอนุญาตประกอบกิจการ" ในฟอร์ม

    @Column(name = "wellness_hub_name", nullable = false, length = 255)
    private String wellnessHubName;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "contact_information", length = 255)
    private String contactInformation;

    @Column(name = "google_maps_link", columnDefinition = "TEXT")
    private String googleMapsLink;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(name = "password", length = 100)
    private String password;

    @Column(name = "tel_information", length = 10)
    private String telInformation;

    @Column(name = "username", length = 100)
    private String username;

    @Column(name = "wellness_hub_description", columnDefinition = "TEXT")
    private String wellnessHubDescription;

    @Column(name = "wellness_hub_img", columnDefinition = "LONGTEXT")
    private String wellnessHubImg;

    @Column(name = "wellness_hub_gallery", columnDefinition = "LONGTEXT")
    private String wellnessHubGallery;

    @Column(name = "wellness_hub_latitude")
    private Double wellnessHubLatitude;

    @Column(name = "wellness_hub_longitude")
    private Double wellnessHubLongitude;

    @Column(name = "status", length = 20)
    private String status;

    // ✨ ฟิลด์ที่ลืม: เพิ่มคอลัมน์เก็บประเภทใบรับรองศูนย์เวลเนส
    @Column(name = "certificate_type", columnDefinition = "TEXT")
    private String certificateType;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne
    @JoinColumn(name = "district_id")
    private District district;

    // เพิ่มตัวนี้เข้าไปในไฟล์ WellnessHub.java
    @Column(name = "operating_hours", columnDefinition = "TEXT")
    private String operatingHours;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (status == null || status.trim().isEmpty()) {
            status = "ACTIVE";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}