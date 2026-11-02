package com.example.wellness.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class WellnessHubDTO {

    private String licenseId;

    private String wellnessHubName;

    private String category;


    @JsonProperty("is_open")
    private Boolean isOpen;

    // ✨ บังคับให้เป็น "open_time"
    @JsonProperty("open_time")
    private String openTime;

    private String address;

    private Double wellnessHubLatitude;

    private Double wellnessHubLongitude;

    private String telInformation;

    // รองรับการเก็บรูปภาพหลายรูป (สัมพันธ์กับ List<String> ใน Dart)
    private List<String> wellnessHubImg;

    private List<DayScheduleDTO> weeklySchedule;

    @Data
    public static class DayScheduleDTO {
        private String dayOfWeek;     // "monday", "tuesday", ...
        private String dayNameThai;   // "จันทร์", "อังคาร", ...
        private String openTime;      // "10:00"
        private String closeTime;     // "22:00"
        private boolean isToday;      // true ถ้าเป็นวันนี้
    }


}