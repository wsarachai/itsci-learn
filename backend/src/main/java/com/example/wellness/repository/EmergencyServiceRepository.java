package com.example.wellness.repository;

import com.example.wellness.model.EmergencyService;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmergencyServiceRepository
        extends JpaRepository<EmergencyService, String> {

    List<EmergencyService> findByDistrict_DistrictIdIn(
            List<Integer> districtIds);

    default List<EmergencyService> findByDistrictIds(List<Integer> districtIds) {
        return findByDistrict_DistrictIdIn(districtIds);
    }

    List<EmergencyService> findByCategory_CategoryIdIn(
            List<String> categoryIds);

    List<EmergencyService> findByDistrict_DistrictIdInAndCategory_CategoryIdIn(
            List<Integer> districtIds,
            List<String> categoryIds);

    boolean existsByUsername(String username);

    boolean existsByWellnessHubNameIgnoreCase(String wellnessHubName);

    boolean existsByWellnessHubNameIgnoreCaseAndLicenseIdNot(String wellnessHubName, String licenseId);

    boolean existsByGoogleMapsLink(String googleMapsLink);

    boolean existsByGoogleMapsLinkIgnoreCase(String googleMapsLink);

    @Query("SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END FROM EmergencyService e " +
            "WHERE e.wellnessHubLatitude IS NOT NULL AND e.wellnessHubLongitude IS NOT NULL " +
            "AND ABS(e.wellnessHubLatitude - :lat) < 0.0001 AND ABS(e.wellnessHubLongitude - :lng) < 0.0001")
    boolean existsNearCoordinates(@Param("lat") double lat, @Param("lng") double lng);

    @Query("SELECT e.licenseId FROM EmergencyService e")
    List<String> findAllLicenseIds();

    EmergencyService findByUsername(String username);


    @Query("SELECT e FROM EmergencyService e " +
            "WHERE e.district IS NOT NULL")
    List<EmergencyService> findAllEmergencyServices();

    @Query("SELECT DISTINCT e FROM EmergencyService e " +
            "LEFT JOIN FETCH e.category c " +
            "LEFT JOIN FETCH e.district d " +
            "WHERE (:keyword IS NULL OR :keyword = '' OR LOWER(e.wellnessHubName) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (:categoryId IS NULL OR :categoryId = '' OR UPPER(c.categoryId) = UPPER(:categoryId)) " +
            "AND (:districtId IS NULL OR d.districtId = :districtId)")
    List<EmergencyService> searchWithFilter(
            @Param("keyword") String keyword,
            @Param("categoryId") String categoryId,
            @Param("districtId") Integer districtId
    );

    @Query("""
            SELECT DISTINCT e FROM EmergencyService e
            LEFT JOIN FETCH e.category c
            LEFT JOIN FETCH e.district d
            WHERE LOWER(e.wellnessHubName) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(e.wellnessHubDescription) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(e.address) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(c.categoryName) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(d.districtName) LIKE LOWER(CONCAT('%', :keyword, '%'))
            ORDER BY e.wellnessHubName ASC
            """)
    List<EmergencyService> searchPublicEmergencyServices(@Param("keyword") String keyword);

    @Query("SELECT DISTINCT e FROM EmergencyService e LEFT JOIN FETCH e.category LEFT JOIN FETCH e.district")
    List<EmergencyService> findAllWithCategoryAndDistrict();

    @Query("""
            SELECT new com.example.wellness.dto.WellnessHubSummaryDTO(
                e.licenseId,
                e.wellnessHubName,
                e.address,
                e.contactInformation,
                e.telInformation,
                e.googleMapsLink,
                e.wellnessHubImg,
                e.wellnessHubLatitude,
                e.wellnessHubLongitude,
                COALESCE(e.status, 'ACTIVE'),
                e.certificateType,
                e.operatingHours,
                e.category,
                e.district,
                e.createdAt,
                e.updatedAt
            )
            FROM EmergencyService e
            LEFT JOIN e.category c
            LEFT JOIN e.district d
            """)
    List<com.example.wellness.dto.WellnessHubSummaryDTO> findAllEmergencySummaries();

    @Query("""
            SELECT new com.example.wellness.dto.WellnessHubSummaryDTO(
                e.licenseId,
                e.wellnessHubName,
                e.address,
                e.contactInformation,
                e.telInformation,
                e.googleMapsLink,
                e.wellnessHubImg,
                e.wellnessHubLatitude,
                e.wellnessHubLongitude,
                COALESCE(e.status, 'ACTIVE'),
                e.certificateType,
                e.operatingHours,
                e.category,
                e.district,
                e.createdAt,
                e.updatedAt
            )
            FROM EmergencyService e
            LEFT JOIN e.category c
            LEFT JOIN e.district d
            WHERE (:keyword IS NULL OR :keyword = '' OR LOWER(e.wellnessHubName) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND (:categoryId IS NULL OR :categoryId = '' OR UPPER(c.categoryId) = UPPER(:categoryId))
              AND (:districtId IS NULL OR d.districtId = :districtId)
            """)
    List<com.example.wellness.dto.WellnessHubSummaryDTO> searchEmergencySummaries(
            @Param("keyword") String keyword,
            @Param("categoryId") String categoryId,
            @Param("districtId") Integer districtId
    );

    @Query("SELECT e FROM EmergencyService e LEFT JOIN FETCH e.category LEFT JOIN FETCH e.district WHERE e.licenseId = :licenseId")
    java.util.Optional<EmergencyService> findByIdWithCategoryAndDistrict(@Param("licenseId") String licenseId);
}