package com.example.wellness.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * ตารางเก็บข้อมูลคำขอยื่นขอสร้างบัญชีสถานประกอบการ (account_requests)
 * 
 * คำอธิบายการใส่ Database Index (@Index):
 * เปรียบ Index เหมือน "สารบัญ / ดัชนีท้ายเล่ม" ช่วยให้ฐานข้อมูลกระโดดไปหาแถวที่ต้องการได้ทันที โดยไม่ต้องกวาดอ่านข้อมูลทีละแถวทั้งตาราง (Full Table Scan)
 * 1. idx_account_requests_status: เพิ่มความเร็วเวลาแอดมินกรองดูสถานะคำขอ (เช่น ดูเฉพาะที่ PENDING, APPROVED, REJECTED)
 * 2. idx_account_requests_username: เพิ่มความเร็วเวลาตรวจเช็คว่า Username นี้มีคนใช้งานหรือกำลังยื่นคำขออยู่หรือไม่
 * 3. idx_account_requests_license_status: คอมโพสิตอินเด็กซ์ (Composite Index) เพิ่มความเร็วเวลาตรวจว่าเลขใบอนุญาตนี้มีคำขอสถานะ PENDING อยู่หรือไม่
 */
@Entity
@Table(name = "account_requests", indexes = {
    @Index(name = "idx_account_requests_status", columnList = "request_status"),
    @Index(name = "idx_account_requests_username", columnList = "username"),
    @Index(name = "idx_account_requests_license_status", columnList = "license_id, request_status")
})
@Data
public class AccountRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "request_id")
    private Integer requestId;

    // ============================
    // ข้อมูลผู้สมัคร
    // ============================
    @Column(name = "requester_name", nullable = false, length = 255)
    private String requesterName;
    @Column(name = "user_email", nullable = false, length = 255)
    private String userEmail;

    @Column(name = "contact_information", length = 255)
    private String contactInformation;

    @Column(name = "tell_information", length = 10)
    private String tellInformation;
    @Column(name = "username", nullable = false, length = 100)
    private String username;

    @Column(name = "password", nullable = false, length = 100)
    private String password;

    // ============================
    // ข้อมูลสถานประกอบการ
    // ============================
    @Column(name = "license_id", length = 100)
    private String licenseId;
    @Column(name = "wellness_hub_name", nullable = false, length = 255)
    private String wellnessHubName;

    @Column(name = "address", nullable = false, length = 255)
    private String address;

    @Column(name = "google_maps_link", columnDefinition = "TEXT")
    private String googleMapsLink;

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

    @Column(name = "certificate_type", columnDefinition = "TEXT")
    private String certificateType;

    @Column(name = "operating_hours", columnDefinition = "TEXT")
    private String operatingHours;

    // ============================
    // เอกสารประกอบ
    // ============================
    @Column(name = "verification_documents", columnDefinition = "LONGTEXT")
    private String verificationDocuments;

    // ============================
    // Workflow
    // ============================

    /*
     * PENDING
     * APPROVED
     * REJECTED
     */
    @Column(name = "request_status", nullable = false, length = 20)
    private String requestStatus;

    @Column(name = "rejection_reason", length = 255)
    private String rejectionReason;

    @Column(name = "processed_date")
    private LocalDateTime processedDate;

    // ============================
    // ความสัมพันธ์
    // ============================

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne
    @JoinColumn(name = "district_id")
    private District district;

}