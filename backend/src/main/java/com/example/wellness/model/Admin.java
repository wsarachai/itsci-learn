package com.example.wellness.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
// เปลี่ยนชื่อ table เป็น "admins" (เติม s) เพื่อหลีกเลี่ยงคำสงวนของ Postgres
// และช่วยให้จัดการสิทธิ์ใน Supabase ได้ง่ายขึ้นค่ะ
@Table(name = "admins") 
@Data
public class Admin {
    
    @Id
    // สำหรับ PostgreSQL แนะนำให้ระบุ @Column ให้ชัดเจน
    // ถ้า username เป็น PK และเป็น String อยู่แล้ว ไม่ต้องแก้เยอะค่ะ
    @Column(name = "username", length = 10)
    private String username;

    // ขยายความยาวเป็น 100 เพื่อรองรับ BCrypt Hash
    @Column(name = "password", nullable = false, length = 100)
    private String password;
}