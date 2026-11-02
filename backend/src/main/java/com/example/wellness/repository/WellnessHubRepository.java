package com.example.wellness.repository;

import com.example.wellness.model.WellnessHub;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface WellnessHubRepository
        extends JpaRepository<WellnessHub, String> {

    boolean existsByUsername(String username);

    boolean existsByWellnessHubNameIgnoreCase(String wellnessHubName);

    boolean existsByWellnessHubNameIgnoreCaseAndLicenseIdNot(String wellnessHubName, String licenseId);

    boolean existsByGoogleMapsLink(String googleMapsLink);

    boolean existsByGoogleMapsLinkIgnoreCase(String googleMapsLink);

    @Query("SELECT CASE WHEN COUNT(w) > 0 THEN true ELSE false END FROM WellnessHub w " +
            "WHERE w.wellnessHubLatitude IS NOT NULL AND w.wellnessHubLongitude IS NOT NULL " +
            "AND ABS(w.wellnessHubLatitude - :lat) < 0.0001 AND ABS(w.wellnessHubLongitude - :lng) < 0.0001")
    boolean existsNearCoordinates(@Param("lat") double lat, @Param("lng") double lng);

    @Query("SELECT w.licenseId FROM WellnessHub w")
    List<String> findAllLicenseIds();

    @Query(value = """
            SELECT GREATEST(
                COALESCE((SELECT MAX(CAST(NULLIF(regexp_replace(license_id, '\\D', '', 'g'), '') AS INTEGER)) FROM wellness_hubs WHERE license_id ~ '\\d'), 10000),
                COALESCE((SELECT MAX(CAST(NULLIF(regexp_replace(license_id, '\\D', '', 'g'), '') AS INTEGER)) FROM emergency_services WHERE license_id ~ '\\d'), 10000)
            )
            """, nativeQuery = true)
    Integer findMaxNumericLicenseId();

    @Query("SELECT w FROM WellnessHub w " +
            "LEFT JOIN FETCH w.category " +
            "LEFT JOIN FETCH w.district " +
            "WHERE (w.status IS NULL OR TRIM(w.status) = '' OR UPPER(TRIM(w.status)) = 'ACTIVE') " +
            "AND ((w.wellnessHubLatitude IS NOT NULL AND w.wellnessHubLongitude IS NOT NULL " +
            "      AND w.wellnessHubLatitude <> 0 AND w.wellnessHubLongitude <> 0) " +
            "     OR (w.district.districtId IN (:originId, :destId)))")
    List<WellnessHub> findHubsForRouteCalculation(@Param("originId") Integer originId, @Param("destId") Integer destId);

    WellnessHub findByUsername(String username);

    @Query("""
            SELECT new map(
                d.districtId AS districtId,
                d.districtName AS districtName,
                COUNT(w) AS wellnessHubCount
            )
            FROM District d
            LEFT JOIN WellnessHub w
                ON w.district.districtId = d.districtId
            GROUP BY
                d.districtId,
                d.districtName
            ORDER BY
                d.districtName ASC
            """)
    List<Map<String, Object>> countWellnessHubsByDistrict();

    List<WellnessHub> findByDistrict_DistrictIdInAndCategory_CategoryIdIn(
            List<Integer> districtIds,
            List<String> categoryIds);


    List<WellnessHub> findByWellnessHubNameContaining(String keyword);

    @Query("SELECT w FROM WellnessHub w " +
            "WHERE (LOWER(w.wellnessHubName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "   OR LOWER(w.address) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND w.address IS NOT NULL " +
            "AND TRIM(w.address) <> '' " +
            "AND TRIM(w.address) <> 'ไม่ระบุ' " +
            "ORDER BY " +
            "   CASE WHEN LOWER(w.wellnessHubName) LIKE LOWER(CONCAT(:keyword, '%')) THEN 0 " +
            "        WHEN LOWER(w.wellnessHubName) LIKE LOWER(CONCAT('%', :keyword, '%')) THEN 1 " +
            "        ELSE 2 END ASC, " +
            "   w.wellnessHubName ASC")
    List<WellnessHub>
    searchByNameStartingWithAndHasAddress(@Param("keyword") String keyword);

    @Query("SELECT DISTINCT w FROM WellnessHub w " +
            "LEFT JOIN FETCH w.category c " +
            "LEFT JOIN FETCH w.district d " +
            "WHERE (:keyword IS NULL OR :keyword = '' OR LOWER(w.wellnessHubName) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (:categoryId IS NULL OR :categoryId = '' OR UPPER(c.categoryId) = UPPER(:categoryId)) " +
            "AND (:districtId IS NULL OR d.districtId = :districtId)")
    List<WellnessHub> searchWithFilter(
            @Param("keyword") String keyword,
            @Param("categoryId") String categoryId,
            @Param("districtId") Integer districtId
    );

    @Query("SELECT w FROM WellnessHub w " +
            "WHERE (:keyword IS NULL OR :keyword = '' OR " +
            "   LOWER(w.wellnessHubName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "   OR LOWER(w.address) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND w.address IS NOT NULL " +
            "AND TRIM(w.address) <> '' " +
            "AND TRIM(w.address) <> 'ไม่ระบุ' " +
            "AND (:categoryId IS NULL OR w.category.categoryId = :categoryId) " +
            "AND (:districtId IS NULL OR w.district.districtId = :districtId) " +
            "ORDER BY w.wellnessHubName ASC")
    Page<WellnessHub> searchWithFilter(
            @Param("keyword") String keyword,
            @Param("categoryId") String categoryId,
            @Param("districtId") Integer districtId,
            Pageable pageable
    );

    @Query("SELECT w FROM WellnessHub w " +
            "JOIN FETCH w.category " +
            "JOIN FETCH w.district " +
            "WHERE w.district.districtId IN :districtId " +
            "AND w.category.categoryId IN :categoryId " +
            "AND w.wellnessHubLatitude IS NOT NULL " +
            "AND w.wellnessHubLongitude IS NOT NULL " +
            "AND w.wellnessHubLatitude <> 0 " +
            "AND w.wellnessHubLongitude <> 0")
    List<WellnessHub> findByDistrictIdsAndCategoryIds(
            @Param("districtId") List<Integer> districtIds,
            @Param("categoryId") List<String> categoryIds
    );

    @Query("""
            SELECT DISTINCT w FROM WellnessHub w
            LEFT JOIN FETCH w.category c
            LEFT JOIN FETCH w.district d
            WHERE LOWER(w.wellnessHubName) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(w.wellnessHubDescription) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(w.address) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(c.categoryName) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(d.districtName) LIKE LOWER(CONCAT('%', :keyword, '%'))
            ORDER BY w.wellnessHubName ASC
            """)
    List<WellnessHub> searchPublicHubs(@Param("keyword") String keyword);

    @Query("SELECT DISTINCT w FROM WellnessHub w LEFT JOIN FETCH w.category LEFT JOIN FETCH w.district")
    List<WellnessHub> findAllWithCategoryAndDistrict();

    @Query("""
            SELECT new com.example.wellness.dto.WellnessHubSummaryDTO(
                w.licenseId,
                w.wellnessHubName,
                w.address,
                w.contactInformation,
                w.telInformation,
                w.googleMapsLink,
                w.wellnessHubImg,
                w.wellnessHubLatitude,
                w.wellnessHubLongitude,
                w.status,
                w.certificateType,
                w.operatingHours,
                w.category,
                w.district,
                w.createdAt,
                w.updatedAt
            )
            FROM WellnessHub w
            LEFT JOIN w.category c
            LEFT JOIN w.district d
            """)
    List<com.example.wellness.dto.WellnessHubSummaryDTO> findAllWellnessHubSummaries();

    @Query("""
            SELECT new com.example.wellness.dto.WellnessHubSummaryDTO(
                w.licenseId,
                w.wellnessHubName,
                w.address,
                w.contactInformation,
                w.telInformation,
                w.googleMapsLink,
                w.wellnessHubImg,
                w.wellnessHubLatitude,
                w.wellnessHubLongitude,
                w.status,
                w.certificateType,
                w.operatingHours,
                w.category,
                w.district,
                w.createdAt,
                w.updatedAt
            )
            FROM WellnessHub w
            LEFT JOIN w.category c
            LEFT JOIN w.district d
            WHERE (:keyword IS NULL OR :keyword = '' OR LOWER(w.wellnessHubName) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND (:categoryId IS NULL OR :categoryId = '' OR UPPER(c.categoryId) = UPPER(:categoryId))
              AND (:districtId IS NULL OR d.districtId = :districtId)
            """)
    List<com.example.wellness.dto.WellnessHubSummaryDTO> searchWellnessHubSummaries(
            @Param("keyword") String keyword,
            @Param("categoryId") String categoryId,
            @Param("districtId") Integer districtId
    );

    @Query("SELECT w FROM WellnessHub w LEFT JOIN FETCH w.category LEFT JOIN FETCH w.district WHERE w.licenseId = :licenseId")
    java.util.Optional<WellnessHub> findByIdWithCategoryAndDistrict(@Param("licenseId") String licenseId);
}