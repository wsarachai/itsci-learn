package com.example.wellness.repository;

import com.example.wellness.model.AccountRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccountRequestRepository
                extends JpaRepository<AccountRequest, Integer> {

        // =============================
        // List & Search
        // =============================

        List<AccountRequest> findAllByOrderByRequestIdDesc();

        List<AccountRequest> findByRequestStatusOrderByRequestIdDesc(
                        String requestStatus);

        @org.springframework.data.jpa.repository.Query("SELECT " +
                        "r.requestId, r.licenseId, r.wellnessHubName, r.requesterName, " +
                        "r.contactInformation, r.tellInformation, r.userEmail, " +
                        "r.requestStatus, r.rejectionReason, r.processedDate " +
                        "FROM AccountRequest r ORDER BY r.requestId DESC")
        List<Object[]> findAllSummariesByOrderByRequestIdDesc();

        @org.springframework.data.jpa.repository.Query("SELECT " +
                        "r.requestId, r.licenseId, r.wellnessHubName, r.requesterName, " +
                        "r.contactInformation, r.tellInformation, r.userEmail, " +
                        "r.requestStatus, r.rejectionReason, r.processedDate " +
                        "FROM AccountRequest r WHERE " +
                        "(:keyword IS NULL OR :keyword = '' OR " +
                        "LOWER(r.wellnessHubName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                        "LOWER(r.licenseId) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                        "LOWER(r.requesterName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                        "LOWER(r.userEmail) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                        "LOWER(r.tellInformation) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
                        "(:status IS NULL OR :status = '' OR UPPER(r.requestStatus) = UPPER(:status)) " +
                        "ORDER BY r.requestId DESC")
        List<Object[]> searchAccountRequestSummaries(
                        @org.springframework.data.repository.query.Param("keyword") String keyword,
                        @org.springframework.data.repository.query.Param("status") String status);

        // =============================
        // Count
        // =============================

        long countByRequestStatus(
                        String requestStatus);

        long countByRequestStatusIgnoreCase(
                        String requestStatus);

        // =============================
        // ตรวจคำขอซ้ำด้วย License ID
        // =============================

        boolean existsByLicenseIdAndRequestStatus(
                        String licenseId,
                        String requestStatus);

        List<AccountRequest> findByLicenseIdAndRequestStatusOrderByRequestIdDesc(
                        String licenseId,
                        String requestStatus);

        long deleteByLicenseIdAndRequestStatus(
                        String licenseId,
                        String requestStatus);

        void deleteByLicenseId(
                        String licenseId);

        // =============================
        // ตรวจ Username ซ้ำตามสถานะคำขอ
        // =============================

        boolean existsByUsernameIgnoreCaseAndRequestStatus(
                        String username,
                        String requestStatus);

        // =============================
        // Search
        // =============================

        List<AccountRequest> findByUsernameIgnoreCaseOrderByRequestIdDesc(
                        String username);

        List<AccountRequest> findByUsernameContainingIgnoreCaseOrderByRequestIdDesc(
                        String username);

        List<AccountRequest> findByWellnessHubNameContainingIgnoreCaseOrderByRequestIdDesc(
                        String wellnessHubName);

        List<AccountRequest> findByLicenseIdOrderByRequestIdDesc(
                        String licenseId);

}