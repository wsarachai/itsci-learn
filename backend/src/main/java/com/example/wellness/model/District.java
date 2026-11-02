package com.example.wellness.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "districts") // เปลี่ยนเป็นพหูพจน์ตาม Best Practice
@Data
public class District {
    
    @Id
    @Column(name = "district_id")
    private Integer districtId;

    @Column(name = "district_name", nullable = false, length = 100)
    private String districtName;

    @Column(nullable = false)
    private Double latitude; // เปลี่ยนจาก Float เป็น Double เพื่อความแม่นยำของพิกัด

    @Column(name = "longitude", nullable = false) // แก้คำผิดจาก longtitude เป็น longitude
    private Double longitude; 
}