package com.example.wellness.repository;

import com.example.wellness.model.Admin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AdminRepository extends JpaRepository<Admin, String> {
    // ฟังก์ชันสำหรับหา Admin ด้วย username และ password
    Optional<Admin> findByUsernameAndPassword(String username, String password);
}