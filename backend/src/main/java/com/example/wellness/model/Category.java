package com.example.wellness.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "categories") // เปลี่ยนจาก category เป็น categories เพื่อเลี่ยงคำสงวนและเป็นระเบียบ
@Data
public class Category {

    @Id
    @Column(name = "category_id", length = 10)
    private String categoryId; // PK: รหัสประเภท (เช่น C0001)

    @Column(name = "category_name", nullable = false, length = 255)
    private String categoryName; // ชื่อประเภท (เช่น สปา)
}