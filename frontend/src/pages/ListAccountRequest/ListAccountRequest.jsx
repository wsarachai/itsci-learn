import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleExclamation,
  faMagnifyingGlass,
  faRotate,
  faSpinner,
  faPenToSquare,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";

import "./ListAccountRequest.css";
import AdminSidebar from "../../Components/AdminSidebar/AdminSidebar";

const API_URL = "/api/account-requests";
const ROWS_PER_PAGE = 10;

// In-Memory Cache for Account Requests
let accountRequestsCache = null;
export const clearAccountRequestsCache = () => {
  accountRequestsCache = null;
};

function ListAccountRequest() {
  const navigate = useNavigate();
  const location = useLocation();

  const [accountRequests, setAccountRequests] = useState(() => accountRequestsCache || []);
  const [adminName, setAdminName] = useState("Admin");

  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");

  const [currentPage, setCurrentPage] = useState(1);

  const [isLoading, setIsLoading] = useState(() => !accountRequestsCache);
  const [errorMessage, setErrorMessage] = useState("");

  // 🌟 State สำหรับ Popup ดูเหตุผลที่ไม่อนุมัติ
  const [showRejectReasonPopup, setShowRejectReasonPopup] = useState(false);
  const [selectedRejectRequest, setSelectedRejectRequest] = useState(null);

  // 🌟 State สำหรับ Popup ยืนยันออกจากระบบ
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);

  useEffect(() => {
    const storedAdminName = localStorage.getItem("adminName");
    if (storedAdminName) {
      setAdminName(storedAdminName);
    }

    fetchAccountRequests("", "PENDING", false);
  }, []);

  // 🌟 รับข้อมูลสถานะที่เปลี่ยนจากหน้าพิจารณา
  // เพื่ออัปเดตเฉพาะรายการนั้นโดยไม่ต้องโหลด List ใหม่ทั้งหมด
  useEffect(() => {
    if (!location.state?.updatedRequestId || !location.state?.requestStatus) {
      return;
    }

    accountRequestsCache = null;
    const updatedRequestId = Number(location.state.updatedRequestId);
    const requestStatus = normalizeStatus(location.state.requestStatus);

    setAccountRequests((previousRequests) => {
      return previousRequests.map((request) => {
        if (Number(request.requestId) !== updatedRequestId) {
          return request;
        }

        return {
          ...request,
          requestStatus,
          rejectionReason:
            requestStatus === "REJECTED"
              ? location.state.rejectionReason || request.rejectionReason
              : null,
        };
      });
    });
  }, [
    location.state?.updatedRequestId,
    location.state?.requestStatus,
    location.state?.rejectionReason,
  ]);

  const fetchAccountRequests = async (
    keyword = searchKeyword,
    status = statusFilter,
    forceRefresh = false,
  ) => {
    const isDefault = !keyword && status === "PENDING";

    if (accountRequestsCache && isDefault && !forceRefresh) {
      setAccountRequests(accountRequestsCache);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      setErrorMessage("");

      const params = {};
      if (keyword && keyword.trim()) {
        params.keyword = keyword.trim();
      }
      if (status && status.trim()) {
        params.status = status.trim();
      }

      const response = await axios.get(API_URL, { params });
      const data = response.data;
      const normalizedData = Array.isArray(data) ? data : [];

      if (isDefault) {
        accountRequestsCache = normalizedData;
      }

      setAccountRequests(normalizedData);
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการโหลดคำร้อง:", error);
      setAccountRequests([]);
      if (error.response?.status === 401) {
        setErrorMessage("ไม่มีสิทธิ์เข้าถึง (กรุณาเข้าสู่ระบบในฐานะ Admin)");
      } else {
        setErrorMessage(
          error.response?.data?.message ||
          error.message ||
          "เกิดข้อผิดพลาดในการโหลดข้อมูลคำร้อง",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const normalizeStatus = (status) => {
    if (!status) {
      return "PENDING";
    }

    return String(status).trim().toUpperCase();
  };

  const getStatusText = (status) => {
    const normalizedStatus = normalizeStatus(status);

    switch (normalizedStatus) {
      case "APPROVED":
        return "อนุมัติแล้ว";

      case "REJECTED":
        return "ไม่อนุมัติ";

      case "PENDING":
      default:
        return "รอพิจารณา";
    }
  };

  const getStatusClassName = (status) => {
    const normalizedStatus = normalizeStatus(status);

    switch (normalizedStatus) {
      case "APPROVED":
        return "request-status-approved";

      case "REJECTED":
        return "request-status-rejected";

      case "PENDING":
      default:
        return "request-status-pending";
    }
  };

  const getLicenseId = (request) => {
    return (
      request.licenseId ??
      request.wellnessHub?.licenseId ??
      request.emergencyService?.licenseId ??
      "-"
    );
  };

  const getWellnessHubName = (request) => {
    return (
      request.wellnessHubName ??
      request.wellnessHub?.wellnessHubName ??
      request.emergencyService?.wellnessHubName ??
      "-"
    );
  };

  const getRequesterName = (request) => {
    return (
      request.requesterName ??
      request.contactInformation ??
      "-"
    );
  };

  const getTelephone = (request) => {
    return (
      request.telInformation ??
      request.tellInformation ??
      request.emergencyService?.telInformation ??
      "-"
    );
  };

  const pendingCount = useMemo(() => {
    return accountRequests.filter((request) => {
      const status = normalizeStatus(request.requestStatus || request.status);
      return status === "PENDING";
    }).length;
  }, [accountRequests]);

  const totalPages = Math.max(
    1,
    Math.ceil(accountRequests.length / ROWS_PER_PAGE),
  );

  const firstRowIndex = (currentPage - 1) * ROWS_PER_PAGE;

  const currentRows = accountRequests.slice(
    firstRowIndex,
    firstRowIndex + ROWS_PER_PAGE,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchAccountRequests(searchKeyword, statusFilter);
  };

  const handleStatusChange = (newStatus) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
    fetchAccountRequests(searchKeyword, newStatus);
  };

  const handleResetFilter = () => {
    setSearchKeyword("");
    setStatusFilter("PENDING");
    setCurrentPage(1);
    fetchAccountRequests("", "PENDING");
  };

  const handleApproveRequest = (requestId) => {
    navigate(`/account-requests/${requestId}/approve`);
  };

  const handleShowRejectReason = (request) => {
    setSelectedRejectRequest(request);
    setShowRejectReasonPopup(true);
  };

  const handleCloseRejectReason = () => {
    setShowRejectReasonPopup(false);
    setSelectedRejectRequest(null);
  };

  // 🌟 เปิด Popup ยืนยันออกจากระบบ
  const handleLogout = () => {
    setShowLogoutPopup(true);
  };

  // 🌟 ยืนยันออกจากระบบ
  const handleConfirmLogout = () => {
    localStorage.clear();
    setShowLogoutPopup(false);
    navigate("/login");
  };

  return (
    <div className="account-request-page">
      {/* 🌟 Popup แสดงเหตุผลที่ไม่อนุมัติ */}
      {showRejectReasonPopup && selectedRejectRequest && (
        <div className="popup-bg" onClick={handleCloseRejectReason}>
          <div
            className="popup reject-popup"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="popup-icon error">
              <FontAwesomeIcon icon={faCircleExclamation} />
            </div>

            <h3>เหตุผลที่ไม่อนุมัติคำร้อง</h3>

            <p>
              สถานประกอบการ{" "}
              <strong>{getWellnessHubName(selectedRejectRequest)}</strong>
            </p>

            <div
              style={{
                marginTop: "16px",
                padding: "14px 16px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                color: "#334155",
                lineHeight: "1.7",
                textAlign: "left",
              }}
            >
              {selectedRejectRequest.rejectionReason || "ไม่ได้ระบุเหตุผล"}
            </div>

            <div className="popup-buttons">
              <button
                type="button"
                className="confirm-btn"
                onClick={handleCloseRejectReason}
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminSidebar
        activeMenu="account-requests"
        pendingCount={pendingCount}
      />

      <main className="account-request-main">
        <div className="account-request-container">
          <header className="account-request-header">
            <h2>บัญชีรายชื่อคำร้องขอเปิดใช้งานระบบ (List Account Request)</h2>

            <p>ระบบบริหารจัดการข้อมูลสุขภาพ จังหวัดเชียงใหม่</p>
          </header>

          <section className="account-request-filter-bar">
            <input
              type="text"
              className="account-request-filter-input"
              placeholder="ค้นหาชื่อสถานประกอบการ เลขใบอนุญาต ผู้ยื่นคำร้อง หรืออีเมล..."
              value={searchKeyword}
              onChange={(event) => {
                setSearchKeyword(event.target.value);
                setCurrentPage(1);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSearch();
                }
              }}
            />

            <select
              className="account-request-filter-select"
              value={statusFilter}
              onChange={(event) => handleStatusChange(event.target.value)}
            >
              <option value="">-- สถานะทั้งหมด --</option>
              <option value="PENDING">รอพิจารณา</option>
              <option value="APPROVED">อนุมัติแล้ว</option>
              <option value="REJECTED">ไม่อนุมัติ</option>
            </select>

            <button
              type="button"
              className="account-request-search-button"
              onClick={handleSearch}
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} />
              ค้นหา
            </button>

            <button
              type="button"
              className="account-request-reset-button"
              onClick={handleResetFilter}
            >
              <FontAwesomeIcon icon={faRotate} />
              ล้างค่า
            </button>
          </section>

          {errorMessage && (
            <div className="account-request-error-box">
              <FontAwesomeIcon icon={faCircleExclamation} />

              <span>{errorMessage}</span>

              <button type="button" onClick={() => fetchAccountRequests(searchKeyword, statusFilter)}>
                ลองใหม่
              </button>
            </div>
          )}

          <section className="account-request-table-card">
            <table className="account-request-table">
              <thead>
                <tr>
                  <th className="request-column-number">ลำดับ</th>
                  <th className="request-column-license">เลขใบอนุญาต</th>
                  <th className="request-column-name">ชื่อสถานประกอบการ</th>
                  <th className="request-column-contact">ผู้ยื่นคำร้อง</th>
                  <th className="request-column-tel">เบอร์โทรศัพท์</th>
                  <th className="request-column-email">อีเมล</th>
                  <th className="request-column-status">สถานะ</th>
                  <th className="request-column-action">การพิจารณา</th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="8" className="account-request-loading">
                      <FontAwesomeIcon icon={faSpinner} spin />
                      กำลังโหลดข้อมูลคำร้อง...
                    </td>
                  </tr>
                ) : errorMessage ? (
                  <tr>
                    <td colSpan="8" className="account-request-empty">
                      <FontAwesomeIcon icon={faCircleExclamation} />
                      {errorMessage}
                    </td>
                  </tr>
                ) : currentRows.length > 0 ? (
                  currentRows.map((request, index) => {
                    const status = normalizeStatus(request.requestStatus);

                    return (
                      <tr key={request.requestId}>
                        <td className="text-center request-number-cell">
                          {firstRowIndex + index + 1}
                        </td>

                        <td className="text-center">{getLicenseId(request)}</td>

                        <td className="request-name-cell">
                          <strong>{getWellnessHubName(request)}</strong>
                        </td>

                        <td className="text-center">
                          {getRequesterName(request)}
                        </td>

                        <td className="text-center">{getTelephone(request)}</td>

                        <td className="text-center">
                          {request.userEmail || "-"}
                        </td>

                        <td className="text-center">
                          <span className={getStatusClassName(status)}>
                            [ {getStatusText(status)} ]
                          </span>
                        </td>

                        <td>
                          <div className="account-request-action-group">
                            {status === "PENDING" && (
                              <button
                                type="button"
                                className="account-request-consider-button"
                                onClick={() =>
                                  handleApproveRequest(request.requestId)
                                }
                              >
                                <FontAwesomeIcon icon={faPenToSquare} />
                                พิจารณา
                              </button>
                            )}

                            {status === "APPROVED" && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  color: "#15803d",
                                  fontWeight: "600",
                                  fontSize: "13px",
                                }}
                              >
                                <FontAwesomeIcon icon={faCircleCheck} />
                                อนุมัติแล้ว
                              </span>
                            )}

                            {status === "REJECTED" && (
                              <button
                                type="button"
                                className="account-request-view-button"
                                onClick={() => handleShowRejectReason(request)}
                              >
                                <FontAwesomeIcon icon={faCircleExclamation} />
                                ดูเหตุผล
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="account-request-empty">
                      <FontAwesomeIcon icon={faCircleExclamation} />
                      ไม่พบข้อมูลคำขอสถานประกอบการ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {!isLoading && totalPages > 1 && (
            <div className="account-request-pagination">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => page - 1)}
              >
                ก่อนหน้า
              </button>

              <span>
                หน้า {currentPage} จาก {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((page) => page + 1)}
              >
                ถัดไป
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ListAccountRequest;