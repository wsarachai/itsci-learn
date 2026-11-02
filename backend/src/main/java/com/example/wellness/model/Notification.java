package com.example.wellness.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * ตารางเก็บข้อมูลการแจ้งเตือน (notification)
 * 
 * คำอธิบายการใส่ Database Index (@Index):
 * 1. idx_notification_request_id: เพิ่มความเร็วเวลาดึงประวัติการแจ้งเตือนที่ผูกกับรหัสคำขอ (request_id)
 * 2. idx_notification_status: เพิ่มความเร็วเวลาค้นหาหรือตรวจสอบสถานะการแจ้งเตือน
 */
@Entity
@Table(name = "notification", indexes = {
    @Index(name = "idx_notification_request_id", columnList = "request_id"),
    @Index(name = "idx_notification_status", columnList = "notificationStatus")
})
@Data
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer notificationId;

    @Column(nullable = false)
    private LocalDateTime notifydate;

    @Column(nullable = false, length = 255)
    private String messageBody;

    @Column(nullable = false, length = 50)
    private String notificationStatus;

    @ManyToOne
    @JoinColumn(name = "request_id")
    private AccountRequest accountRequest;
}