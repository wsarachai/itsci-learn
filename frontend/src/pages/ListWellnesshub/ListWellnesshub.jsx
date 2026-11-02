import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./ListWellnesshub.css";
import AdminSidebar from "../../Components/AdminSidebar/AdminSidebar";
import AdminStatusModal from "../../Components/AdminStatusModal/AdminStatusModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faMagnifyingGlass,
  faRotate,
  faCircleExclamation,
  faPenToSquare,
  faTrashCan,
  faBan,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";

// 1. ตัวแปรเก็บ Cache และฟังก์ชัน Clear Cache สำหรับ export ไปใช้หน้าอื่น (Add/Edit)
let wellnessHubCache = null;

export const setWellnessHubCache = (data) => {
  wellnessHubCache = data;
};

export const clearWellnessHubCache = () => {
  wellnessHubCache = null;
};

const ListWellnessHub = () => {
  const [listwellnesshub, setListWellnessHub] = useState(() => wellnessHubCache || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(() => !wellnessHubCache);
  const [adminName, setAdminName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;
  const navigate = useNavigate();
  const location = useLocation();

  // State สำหรับจัดการ Popup ยืนยันการระงับ/เปิดใช้งานสถานประกอบการ
  const [showStatusPopup, setShowStatusPopup] = useState(false);
  const [selectedHub, setSelectedHub] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // State ตัวเลือกและค่าการกรอง
  const [categories, setCategories] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  // Status Modal State
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  // State สำหรับจัดการ Error เมื่อโหลดข้อมูลไม่สำเร็จ
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 2. ฟังก์ชันโหลดข้อมูลพร้อมระบบตรวจสอบ Cache (Stale-While-Revalidate)
  const loadData = async (
    search = searchQuery,
    cat = selectedCategory,
    dist = selectedDistrict,
    forceRefresh = false,
  ) => {
    const isDefaultFilter = !search && !cat && !dist;

    if (wellnessHubCache && isDefaultFilter && !forceRefresh) {
      setListWellnessHub(wellnessHubCache);
      setIsLoading(false);
      setHasError(false);
      setErrorMessage("");
    } else {
      setIsLoading(true);
    }

    setHasError(false);
    setErrorMessage("");

    try {
      const response = await axios.post(
        "/api/wellness-hubs/search",
        {
          search: search || null,
          categoryId: cat || null,
          districtId: dist || null,
        },
      );

      const data = Array.isArray(response.data) ? response.data : [];

      if (isDefaultFilter) {
        wellnessHubCache = data;
      }

      setListWellnessHub(data);
      setHasError(false);
      setErrorMessage("");
    } catch (error) {
      console.error("Error fetching data:", error);
      if (!wellnessHubCache || !isDefaultFilter) {
        setHasError(true);
        setErrorMessage("เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง");
        setListWellnessHub([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const [catResponse, distResponse] = await Promise.all([
        axios.get("/api/categories"),
        axios.get("/api/districts"),
      ]);
      setCategories(Array.isArray(catResponse.data) ? catResponse.data : []);
      setDistricts(Array.isArray(distResponse.data) ? distResponse.data : []);
    } catch (error) {
      console.error("Error loading filter options:", error);
    }
  };

  // 3. แยก useEffect สำหรับโหลดข้อมูลครั้งแรกเมื่อ mount
  useEffect(() => {
    loadData();
    loadFilterOptions();
    const storedName = localStorage.getItem("adminName");
    if (storedName) setAdminName(storedName);
  }, []);

  const handleLogout = () => {
    if (window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
      localStorage.clear();
      navigate("/login");
    }
  };

  const isStatusActive = (status) => {
    if (!status || String(status).trim() === "") return true;
    return String(status).trim().toLowerCase() === "active";
  };

  const filteredData = useMemo(() => {
    if (!listwellnesshub || listwellnesshub.length === 0) return [];
    return [...listwellnesshub].sort((a, b) => {
      const getTime = (item) => {
        const dateVal = item.updatedAt || item.createdAt;
        if (!dateVal) return 0;
        if (Array.isArray(dateVal)) {
          const [y, m, d, h = 0, min = 0, s = 0] = dateVal;
          return new Date(y, m - 1, d, h, min, s).getTime();
        }
        if (typeof dateVal === "string") {
          const time = new Date(dateVal).getTime();
          if (!Number.isNaN(time)) return time;
        }
        if (typeof dateVal === "number") return dateVal;
        return 0;
      };

      const timeA = getTime(a);
      const timeB = getTime(b);

      // 1. เรียงตามวันเวลาที่เพิ่มหรือแก้ไขล่าสุด (มากไปน้อย)
      if (timeB !== timeA) {
        return timeB - timeA;
      }

      // 2. หากเป็นวันเวลาเดียวกัน เรียงตามรหัสสถานประกอบการ (licenseId)
      const idA = a.licenseId != null ? String(a.licenseId).trim() : "";
      const idB = b.licenseId != null ? String(b.licenseId).trim() : "";

      const numA = Number(idA);
      const numB = Number(idB);
      if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
        return numB - numA;
      }
      return idB.localeCompare(idA, undefined, { numeric: true });
    });
  }, [listwellnesshub]);

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  // 4. ฟังก์ชันยืนยันการระงับ / เปิดใช้งานสถานประกอบการ พร้อมล้าง Cache และ Force Refresh
  const confirmToggleStatusHub = async () => {
    if (!selectedHub || isUpdatingStatus) return;

    const currentlyActive = isStatusActive(selectedHub.status);
    const targetStatus = currentlyActive ? "SUSPENDED" : "ACTIVE";

    try {
      setIsUpdatingStatus(true);

      await axios.put(
        `/api/wellness-hubs/${selectedHub.licenseId}/status`,
        { status: targetStatus }
      );

      setShowStatusPopup(false);
      setSelectedHub(null);

      // ล้าง Cache และโหลดใหม่แบบ forceRefresh
      wellnessHubCache = null;
      await loadData(searchQuery, selectedCategory, selectedDistrict, true);

      setStatusModal({
        isOpen: true,
        type: "success",
        title: "สำเร็จ",
        message: currentlyActive
          ? "ระงับการใช้งานสถานประกอบการเรียบร้อยแล้ว"
          : "เปิดใช้งานสถานประกอบการเรียบร้อยแล้ว",
      });
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการเปลี่ยนสถานะสถานประกอบการ", error);

      setShowStatusPopup(false);
      setSelectedHub(null);

      setStatusModal({
        isOpen: true,
        type: "error",
        title: "เกิดข้อผิดพลาด",
        message:
          error.response?.data?.message ||
          "ไม่สามารถเปลี่ยนสถานะได้ กรุณาลองอีกครั้ง",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="admin-layout">

      <AdminSidebar activeMenu="wellness-hubs" />

      <div className="main-content">
        <div className="gov-container">
          <header className="gov-header">
            <h2>บัญชีรายชื่อสถานประกอบการ (List Wellness Hub)</h2>
            <p>ระบบบริหารจัดการข้อมูลสุขภาพ จังหวัดเชียงใหม่</p>
          </header>

          <div className="action-bar-top">
            <button
              className="btn-gov-add"
              onClick={() => navigate("/add-wellness")}
            >
              <i className="fa-solid fa-plus"></i> เพิ่มสถานประกอบการใหม่
            </button>
          </div>

          <div className="gov-filter-bar">
            <input
              type="text"
              className="gov-input"
              placeholder="ค้นหาชื่อสถานประกอบการ..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setCurrentPage(1);
                  loadData(searchQuery, selectedCategory, selectedDistrict);
                }
              }}
            />

            <select
              className="gov-select"
              value={selectedCategory}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedCategory(value);
                setCurrentPage(1);
                loadData(searchQuery, value, selectedDistrict);
              }}
            >
              <option value="">-- หมวดหมู่ทั้งหมด --</option>
              {categories.map((cat) => (
                <option key={cat.categoryId} value={cat.categoryId}>
                  {cat.categoryName}
                </option>
              ))}
            </select>

            <select
              className="gov-select"
              value={selectedDistrict}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedDistrict(value);
                setCurrentPage(1);
                loadData(searchQuery, selectedCategory, value);
              }}
            >
              <option value="">-- อำเภอทั้งหมด --</option>
              {districts.map((dist) => (
                <option key={dist.districtId} value={dist.districtId}>
                  {dist.districtName}
                </option>
              ))}
            </select>

            <button
              className="btn-gov-search"
              onClick={() => {
                setCurrentPage(1);
                loadData(searchQuery, selectedCategory, selectedDistrict);
              }}
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} /> ค้นหา
            </button>

            <button
              className="btn-gov-search"
              style={{ backgroundColor: "#6c757d" }}
              title="ล้างค่าตัวกรองและรีเฟรชข้อมูลล่าสุด"
              disabled={isLoading}
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("");
                setSelectedDistrict("");
                setCurrentPage(1);
                wellnessHubCache = null;
                loadData("", "", "", true);
              }}
            >
              <FontAwesomeIcon icon={faRotate} spin={isLoading} /> ล้างค่า / รีเฟรช
            </button>
          </div>

          <div className="gov-table-container">
            <table className="list-table">
              <thead>
                <tr>
                  <th width="10%" className="text-center">
                    รหัสสถานประกอบการ
                  </th>
                  <th width="35%">ชื่อสถานประกอบการ</th>
                  <th width="20%">หมวดหมู่</th>
                  <th width="15%">อำเภอ</th>
                  <th width="12%">สถานะ</th>
                  <th width="8%">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="gov-loading-row"
                      style={{
                        textAlign: "center",
                        padding: "30px 0",
                        color: "#666",
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faSpinner}
                        spin
                        style={{ marginRight: "8px" }}
                      />{" "}
                      กำลังโหลดข้อมูลระบบ...
                    </td>
                  </tr>
                ) : currentRows.length > 0 ? (
                  currentRows.map((hub, index) => (
                    <tr key={hub.licenseId ?? index}>
                      <td
                        className="text-center"
                        style={{ fontWeight: "600", color: "#495057" }}
                      >
                        {hub.licenseId ?? "-"}
                      </td>
                      <td>
                        <strong>{hub.wellnessHubName ?? "ไม่ระบุชื่อ"}</strong>
                      </td>
                      <td>{hub.category?.categoryName ?? "-"}</td>
                      <td className="text-center">
                        {hub.district?.districtName ?? "-"}
                      </td>
                      <td className="text-center">
                        <span
                          className="status-text"
                          style={{
                            color: isStatusActive(hub.status)
                              ? "#1c7430"
                              : "#c82333",
                          }}
                        >
                          {isStatusActive(hub.status)
                            ? "[ เปิดใช้งาน ]"
                            : "[ ระงับการใช้งาน ]"}
                        </span>
                      </td>
                      <td>
                        <div className="action-group">
                          <button
                            className="btn-edit"
                            onClick={() =>
                              navigate(`/listWellnesshub/edit/${hub.licenseId}`)
                            }
                          >
                            <FontAwesomeIcon icon={faPenToSquare} />
                            แก้ไข
                          </button>
                          {isStatusActive(hub.status) ? (
                            <button
                              type="button"
                              className="btn-delete btn-suspend"
                              onClick={() => {
                                setSelectedHub(hub);
                                setShowStatusPopup(true);
                              }}
                            >
                              <FontAwesomeIcon icon={faBan} />
                              ระงับ
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-activate"
                              onClick={() => {
                                setSelectedHub(hub);
                                setShowStatusPopup(true);
                              }}
                            >
                              <FontAwesomeIcon icon={faCircleCheck} />
                              เปิดใช้งาน
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : hasError ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center"
                      style={{
                        padding: "30px",
                        color: "#dc3545",
                        fontWeight: "bold",
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faCircleExclamation}
                        style={{ marginRight: "8px" }}
                      />{" "}
                      {errorMessage || "เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง"}
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center"
                      style={{
                        padding: "30px",
                        color: "#dc3545",
                        fontWeight: "bold",
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faCircleExclamation}
                        style={{ marginRight: "8px" }}
                      />{" "}
                      ไม่พบข้อมูลสถานประกอบการ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="gov-pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                ก่อนหน้า
              </button>
              <span>
                หน้า {currentPage} จาก {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                ถัดไป
              </button>
            </div>
          )}
        </div>
      </div>

      {showStatusPopup && selectedHub && (
        <div className="hub-delete-modal-overlay" role="dialog" aria-modal="true">
          <div className={`hub-delete-modal ${!isStatusActive(selectedHub.status) ? "hub-delete-modal--activate" : ""}`}>
            <div className={`hub-delete-icon ${!isStatusActive(selectedHub.status) ? "hub-delete-icon--activate" : ""}`}>
              <FontAwesomeIcon icon={isStatusActive(selectedHub.status) ? faBan : faCircleCheck} />
            </div>

            <h3 className="hub-delete-title">
              {isStatusActive(selectedHub.status)
                ? "ยืนยันการระงับสถานประกอบการ"
                : "ยืนยันการเปิดใช้งานสถานประกอบการ"}
            </h3>

            <div className="hub-delete-body">
              <p className="hub-delete-desc">
                {isStatusActive(selectedHub.status)
                  ? "คุณต้องการระงับการใช้งานสถานประกอบการ"
                  : "คุณต้องการเปิดใช้งานสถานประกอบการ"}
              </p>
              <div className={`hub-delete-name-card ${!isStatusActive(selectedHub.status) ? "hub-delete-name-card--activate" : ""}`}>
                {selectedHub.wellnessHubName || "-"}
              </div>
              <p className={`hub-delete-warning-note ${!isStatusActive(selectedHub.status) ? "hub-delete-warning-note--activate" : ""}`}>
                {isStatusActive(selectedHub.status)
                  ? "สถานประกอบการที่ถูกระงับจะไม่แสดงบนแผนที่และเส้นทางท่องเที่ยว"
                  : "สถานประกอบการจะกลับมาแสดงบนแผนที่และเส้นทางท่องเที่ยวตามปกติ"}
              </p>
            </div>

            <div className="hub-delete-actions">
              <button
                type="button"
                className="btn-hub-delete-cancel"
                disabled={isUpdatingStatus}
                onClick={() => {
                  setShowStatusPopup(false);
                  setSelectedHub(null);
                }}
              >
                ยกเลิก
              </button>

              <button
                type="button"
                className={isStatusActive(selectedHub.status) ? "btn-hub-delete-confirm" : "btn-hub-activate-confirm"}
                disabled={isUpdatingStatus}
                onClick={confirmToggleStatusHub}
              >
                {isUpdatingStatus ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin /> กำลังดำเนินการ...
                  </>
                ) : isStatusActive(selectedHub.status) ? (
                  "ยืนยันระงับ"
                ) : (
                  "ยืนยันเปิดใช้งาน"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminStatusModal
        isOpen={statusModal.isOpen}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() =>
          setStatusModal((previous) => ({
            ...previous,
            isOpen: false,
          }))
        }
      />
    </div>
  );
};

export default ListWellnessHub;
