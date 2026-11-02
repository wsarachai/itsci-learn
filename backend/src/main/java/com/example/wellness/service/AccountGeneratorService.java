package com.example.wellness.service;

import com.example.wellness.model.EmergencyService;
import com.example.wellness.model.WellnessHub;
import com.example.wellness.repository.EmergencyServiceRepository;
import com.example.wellness.repository.WellnessHubRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class AccountGeneratorService {

    private final WellnessHubRepository wellnessHubRepository;
    private final EmergencyServiceRepository emergencyServiceRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
    private static final String DIGITS = "0123456789";
    private static final String SPECIAL = "@#$%&*!_";
    private static final String ALL_CHARS = UPPERCASE + LOWERCASE + DIGITS + SPECIAL;

    private final SecureRandom random = new SecureRandom();

    public AccountGeneratorService(
            WellnessHubRepository wellnessHubRepository,
            EmergencyServiceRepository emergencyServiceRepository,
            PasswordEncoder passwordEncoder) {
        this.wellnessHubRepository = wellnessHubRepository;
        this.emergencyServiceRepository = emergencyServiceRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Map<String, Object> generateAccounts() {
        int wellnessHubCount = generateWellnessHubAccounts();
        int emergencyServiceCount = generateEmergencyServiceAccounts();

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Generate account completed");
        response.put("wellnessHubGenerated", wellnessHubCount);
        response.put("emergencyServiceGenerated", emergencyServiceCount);

        return response;
    }

    private int generateWellnessHubAccounts() {
        List<WellnessHub> hubs = wellnessHubRepository.findAll();
        int count = 0;

        for (WellnessHub hub : hubs) {
            String username = "WH_" + hub.getLicenseId();
            String password = generateRandomPassword();

            hub.setUsername(username);
            hub.setPassword(passwordEncoder.encode(password));
            hub.setStatus("ACTIVE");

            wellnessHubRepository.save(hub);
            count++;
        }

        return count;
    }

    private int generateEmergencyServiceAccounts() {
        List<EmergencyService> services = emergencyServiceRepository.findAll();
        int count = 0;

        for (EmergencyService service : services) {
            String username = "ES_" + service.getLicenseId();
            String password = generateRandomPassword();

            service.setUsername(username);
            service.setPassword(passwordEncoder.encode(password));
            service.setStatus("ACTIVE");

            emergencyServiceRepository.save(service);
            count++;
        }

        return count;
    }

    /**
     * สร้างรหัสผ่าน 8 ตัวอักษร:
     * - มีตัวพิมพ์ใหญ่, ตัวพิมพ์เล็ก, ตัวเลข, อักขระพิเศษ อย่างน้อยประเภทละ 1 ตัว
     * - ทุกตัวอักษรในรหัสผ่านต้องไม่ซ้ำกัน (Distinct characters)
     */
    public String generateRandomPassword() {
        List<Character> passwordChars = new ArrayList<>();
        Set<Character> usedChars = new HashSet<>();

        // 1. สุ่มตัวบังคับ 4 กลุ่มแรก (พิมพ์ใหญ่, พิมพ์เล็ก, ตัวเลข, อักขระพิเศษ)
        char upper = getRandomChar(UPPERCASE, usedChars);
        usedChars.add(upper);
        passwordChars.add(upper);

        char lower = getRandomChar(LOWERCASE, usedChars);
        usedChars.add(lower);
        passwordChars.add(lower);

        char digit = getRandomChar(DIGITS, usedChars);
        usedChars.add(digit);
        passwordChars.add(digit);

        char special = getRandomChar(SPECIAL, usedChars);
        usedChars.add(special);
        passwordChars.add(special);

        // 2. สุ่มตัวที่เหลืออีก 4 ตัวจากตัวอักษรทั้งหมด
        // โดยต้องไม่ซ้ำกับตัวที่มีอยู่เดิม
        while (passwordChars.size() < 8) {
            char ch = getRandomChar(ALL_CHARS, usedChars);
            usedChars.add(ch);
            passwordChars.add(ch);
        }

        // 3. สลับตำแหน่ง (Shuffle) เพื่อไม่ให้เรียง pattern เดิมเสมอ
        Collections.shuffle(passwordChars, random);

        StringBuilder sb = new StringBuilder();
        for (char ch : passwordChars) {
            sb.append(ch);
        }

        return sb.toString();
    }

    private char getRandomChar(String source, Set<Character> usedChars) {
        char ch;
        do {
            ch = source.charAt(random.nextInt(source.length()));
        } while (usedChars.contains(ch));
        return ch;
    }
}