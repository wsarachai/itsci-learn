package com.example.wellness.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "main_routes") // ปรับเป็นพหูพจน์เพื่อให้เข้าชุดกับตารางอื่น
@Data
public class MainRoute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "route_id")
    private Integer routeId; // คงไว้เป็น Integer ตามเดิม

    @Column(name = "route_name", nullable = false, length = 50)
    private String routeName;

    @Column(name = "route_description", nullable = true, length = 255)

    private String routeDescription;

    @Column(name = "route_image", columnDefinition = "TEXT")
    private String routeImage;
    @Column(name = "pin_count")
    private Integer pinCount;
    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "main_route_categories",
        joinColumns = @JoinColumn(name = "route_id"),
        inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    private java.util.Set<Category> categories = new java.util.HashSet<>();

    @OneToMany(mappedBy = "mainRoute", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MainRouteDetail> details = new ArrayList<>();

    @Transient
    public List<String> getCategoryIds() {
        if (categories == null) {
            return new ArrayList<>();
        }
        return categories.stream()
                .map(Category::getCategoryId)
                .filter(java.util.Objects::nonNull)
                .toList();
    }
}