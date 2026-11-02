package com.example.wellness.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * เซอร์วิสสำหรับส่งอีเมลแจ้งเตือนผลการอนุมัติ/ปฏิเสธคำขอ
 *
 * คำอธิบายการทำงาน:
 * 1. @Slf4j: ช่วยสร้างตัวแปร log ให้ใช้อัตโนมัติ (เช่น log.info, log.error) เพื่อบันทึกประวัติการส่งเมลลงคอนโซล
 * 2. @Async: สั่งให้ส่งอีเมลใน "เบื้องหลัง" (Background Thread)
 *    เพื่อไม่ให้หน้าจอของแอดมินหมุนค้างระหว่างรอเซิร์ฟเวอร์ต่อเน็ตกับ Gmail (แอดมินกดปุ๊บ หน้าจอเสร็จทันที)
 */
@Service
@Slf4j
@Async
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * ส่งอีเมลแจ้งเตือนเมื่อคำขอได้รับการอนุมัติ (แนบ Username / Password ให้ผู้ประกอบการ)
     */
    public void sendApproveEmail(
            String email,
            String wellnessHubName,
            String licenseId,
            String username,
            String password) {

        if (email == null || email.trim().isEmpty()) {
            log.warn("⚠️ ไม่สามารถส่งอีเมลอนุมัติได้: ไม่มีอีเมลผู้รับ");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("ผลการอนุมัติบัญชีสถานประกอบการ");
            message.setText("""
                    ระบบได้อนุมัติบัญชีสถานประกอบการของคุณแล้ว

                    ชื่อสถานประกอบการ:
                    %s

                    รหัสใบอนุญาตสถานประกอบการ:
                    %s

                    Username:
                    %s

                    Password:
                    %s
                    """.formatted(wellnessHubName, String.valueOf(licenseId), username, password));

            mailSender.send(message);
            log.info("📧 ส่งอีเมลแจ้งผลการอนุมัติสำเร็จไปยัง: {}", email);
        } catch (Exception e) {
            log.warn("⚠️ ไม่สามารถส่งอีเมลผ่าน SMTP ได้ ({}): กำลังบันทึกข้อมูลลง Console เพื่อการพัฒนา", e.getMessage());
            log.info("ℹ️ [ACCOUNT-APPROVED] Username: {}, Password: {}, LicenseId: {}, Email: {}", username, password, licenseId, email);
        }
    }

    /**
     * ส่งอีเมลแจ้งเตือนเมื่อคำขอถูกปฏิเสธ (พร้อมระบุเหตุผล)
     */
    public void sendRejectEmail(
            String email,
            String wellnessHubName,
            String licenseId,
            String reason) {

        if (email == null || email.trim().isEmpty()) {
            log.warn("⚠️ ไม่สามารถส่งอีเมลแจ้งการปฏิเสธได้: ไม่มีอีเมลผู้รับ");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("ผลการพิจารณาคำร้องขอสิทธิ์สถานประกอบการ");
            message.setText("""
                    คำร้องขอสิทธิ์สถานประกอบการของคุณไม่ได้รับการอนุมัติ

                    ชื่อสถานประกอบการ:
                    %s

                    รหัสใบอนุญาตสถานประกอบการ:
                    %s

                    เหตุผลที่ไม่อนุมัติ:
                    %s

                    --------------------------------------------------
                    คำแนะนำในการดำเนินการ:
                    ท่านสามารถตรวจสอบและแก้ไขข้อมูลหรือเอกสารประกอบให้ถูกต้องครบถ้วน
                    จากนั้นสามารถดำเนินการยื่นคำร้องขอสิทธิ์เข้ามาใหม่อีกครั้งผ่านทางเว็บไซต์ระบบได้
                    เมื่อท่านส่งข้อมูลเข้ามาใหม่ ระบบจะนำข้อมูลเข้าสู่กระบวนการ "รอพิจารณา" อีกครั้ง
                    """.formatted(wellnessHubName, String.valueOf(licenseId), reason));

            mailSender.send(message);
            log.info("📧 ส่งอีเมลแจ้งผลการปฏิเสธสำเร็จไปยัง: {}", email);
        } catch (Exception e) {
            log.error("❌ เกิดข้อผิดพลาดในการส่งอีเมลปฏิเสธไปยัง {}: {}", email, e.getMessage());
        }
    }

    /**
     * เมธอดรวมศูนย์สำหรับแจ้งผลคำขอ
     */
    public void notifyRequestResult(
            String email,
            String wellnessHubName,
            String licenseId,
            boolean isApproved,
            String username,
            String password,
            String reason) {
        if (isApproved) {
            sendApproveEmail(email, wellnessHubName, licenseId, username, password);
        } else {
            sendRejectEmail(email, wellnessHubName, licenseId, reason);
        }
    }
}