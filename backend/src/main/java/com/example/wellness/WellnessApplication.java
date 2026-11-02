package com.example.wellness;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * คลาสหลักของ Spring Boot Application
 *
 * @EnableAsync: เปิดใช้งานการทำงานเบื้องหลัง (Background Task)
 *               เพื่อให้เซอร์วิสอย่าง EmailService
 *               สามารถส่งอีเมลได้แบบไม่บล็อกหน้าจอผู้ใช้งาน
 */
@SpringBootApplication
@EnableAsync
public class WellnessApplication {

	public static void main(String[] args) {
		SpringApplication.run(WellnessApplication.class, args);
	}

}
