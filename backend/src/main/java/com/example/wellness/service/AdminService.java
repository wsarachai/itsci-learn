package com.example.wellness.service;

import com.example.wellness.model.Admin;
import com.example.wellness.repository.AdminRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AdminService {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminService(AdminRepository adminRepository, PasswordEncoder passwordEncoder) {
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Optional<Admin> login(String username, String password) {
        if (username == null || password == null) {
            return Optional.empty();
        }
        Optional<Admin> adminOpt = adminRepository.findById(username.trim());
        if (adminOpt.isEmpty()) {
            return Optional.empty();
        }
        Admin admin = adminOpt.get();
        String storedPassword = admin.getPassword();

        // 1. ตรวจสอบแบบ BCrypt Hash
        if (storedPassword != null && (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$"))) {
            if (passwordEncoder.matches(password, storedPassword)) {
                return Optional.of(admin);
            }
            return Optional.empty();
        }

        // 2. ตรวจสอบแบบ Plaintext เดิม และทำ Transparent Upgrade เป็น BCrypt อัตโนมัติ
        if (storedPassword != null && storedPassword.equals(password)) {
            admin.setPassword(passwordEncoder.encode(password));
            adminRepository.save(admin);
            return Optional.of(admin);
        }

        return Optional.empty();
    }
}