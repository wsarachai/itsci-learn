import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import axiosInstance from "axios";

import "./ListMainroute.css";
import AdminSidebar from "../../Components/AdminSidebar/AdminSidebar";
import AdminStatusModal from "../../Components/AdminStatusModal/AdminStatusModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPenToSquare,
  faTrashCan,
  faSpinner,
  faCircleExclamation,
} from "@fortawesome/free-solid-svg-icons";

// 🌟 1. ประกาศตัวแปร In-Memory Cache ไว้นอก Component
let mainRouteCache = null;

export const setMainRouteCache = (data) => {
  mainRouteCache = data;
};

// ฟังก์ชันสำหรับเรียกเคลียร์ Cache จากหน้า CreateMainRoute หรือ EditMainRoute
export const clearMainRouteCache = () => {
  mainRouteCache = null;
};

const ListMainRoute = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [routes, setRoutes] = useState(() => mainRouteCache || []);
  const [loading, setLoading] = useState(() => !mainRouteCache);
  const [hasError, setHasError] = useState(false);

  // State สำหรับจัดการ Popup ยืนยันการลบ
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);

  // State สำหรับเก็บชื่อแอดมิน
  const [adminName, setAdminName] = useState("admin02");

  // Status Modal State
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  // โหลดข้อมูลแอดมิน
  useEffect(() => {
    const storedAdmin = localStorage.getItem("adminName");
    if (storedAdmin) {
      setAdminName(storedAdmin);
    }
  }, []);

  // 🌟 2. ปรับฟังก์ชันดึงข้อมูลให้รองรับ Cache (Stale-While-Revalidate) และ forceRefresh
  const fetchMainRouteList = async (forceRefresh = false) => {
    if (mainRouteCache && !forceRefresh) {
      setRoutes(mainRouteCache);
      setLoading(false);
      setHasError(false);
    } else {
      setLoading(true);
    }

    setHasError(false);
    try {
      const res = await axiosInstance.get(
        "/api/main-routes",
      );
      const routeData = res.data || [];

      mainRouteCache = routeData; // บันทึกลง Cache
      setRoutes(routeData);
      setHasError(false);
    } catch (err) {
      console.error("❌ ขัดข้องในการดึงข้อมูลตารางทะเบียนเส้นทางสุขภาพ", err);
      if (!mainRouteCache) {
        setHasError(true);
        setStatusModal({
          isOpen: true,
          type: "error",
          title: "เกิดข้อผิดพลาด",
          message: "เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // 🌟 3. เรียกโหลดข้อมูลรอบแรก (ดึงจาก Cache ถ้ามี)
  useEffect(() => {
    fetchMainRouteList();
  }, []);

  // 🌟 เรียงลำดับข้อมูลตามวันที่แก้ไขล่าสุด (updatedAt -> createdAt -> routeId)
  const sortedRoutes = useMemo(() => {
    if (!routes || routes.length === 0) return [];

    return [...routes].sort((first, second) => {
      const firstDate = new Date(
        first.updatedAt || first.createdAt || 0,
      ).getTime();

      const secondDate = new Date(
        second.updatedAt || second.createdAt || 0,
      ).getTime();

      const validFirstDate = Number.isNaN(firstDate) ? 0 : firstDate;
      const validSecondDate = Number.isNaN(secondDate) ? 0 : secondDate;

      if (validSecondDate !== validFirstDate) {
        return validSecondDate - validFirstDate;
      }

      return (second.routeId || 0) - (first.routeId || 0);
    });
  }, [routes]);

  // ฟังก์ชันออกจากระบบ
  const handleLogout = () => {
    if (window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
      localStorage.removeItem("adminName");
      mainRouteCache = null; // เคลียร์ Cache เมื่อออกจากระบบ
      navigate("/admin/login");
    }
  };

  // 🌟 4. ฟังก์ชันลบข้อมูลเส้นทาง (สั่ง forceRefresh = true เพื่อดึงข้อมูลสดจาก Backend)
  const handleDeleteRoute = async () => {
    if (!selectedRoute) return;

    try {
      await axiosInstance.delete(
        `/api/main-routes/${selectedRoute.routeId}`,
      );

      setShowDeletePopup(false);
      setSelectedRoute(null);

      // บังคับดึงข้อมูลใหม่หลังลบสำเร็จ
      await fetchMainRouteList(true);

      setStatusModal({
        isOpen: true,
        type: "success",
        title: "สำเร็จ",
        message: "ลบข้อมูลเส้นทางสำเร็จ",
      });
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการลบเส้นทาง", err);

      setShowDeletePopup(false);
      setSelectedRoute(null);

      setStatusModal({
        isOpen: true,
        type: "error",
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถลบข้อมูลเส้นทางได้ กรุณาลองอีกครั้ง",
      });
    }
  };

  return (
    <div className="gov-admin-layout">

      {/* เมนูด้านข้าง (Sidebar) */}
      <AdminSidebar activeMenu="routes" />

      {/* พื้นที่เนื้อหาหลัก */}
      <main className="gov-main-content">
        <div className="gov-container">
          <header className="gov-header">
            <h2>บัญชีรายชื่อเส้นทางสุขภาพ (List Main Route)</h2>
            <p>ระบบบริการจัดการข้อมูลสุขภาพ จังหวัดเชียงใหม่</p>
          </header>

          <div className="action-bar-top">
            <Link to="/createMainRoute" className="gov-btn-add-route-new">
              <i
                className="fa-solid fa-plus"
                style={{ marginRight: "6px" }}
              ></i>{" "}
              เพิ่มเส้นทางใหม่
            </Link>
          </div>
        </div>

        <div className="gov-table-container-card">
          <table className="gov-custom-data-table">
            <thead>
              <tr>
                <th style={{ width: "5%", textAlign: "center" }}>
                  ลำดับ
                </th>
                <th style={{ width: "19%" }}>ชื่อเส้นทางสุขภาพ</th>
                <th style={{ width: "20%" }}>หมวดหมู่ทั้งหมดในเส้นทาง</th>
                <th style={{ width: "16%" }}>อำเภอในเส้นทาง</th>
                <th style={{ width: "8%", textAlign: "center" }}>
                  จำนวนจุด
                </th>
                <th style={{ width: "8%", textAlign: "center" }}>ผู้สร้าง</th>
                <th style={{ width: "9%", textAlign: "center" }}>
                  วันที่แก้ไข
                </th>
                <th style={{ width: "8%", textAlign: "center" }}>สถานะ</th>
                <th style={{ width: "7%", textAlign: "center" }}>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="9"
                    className="gov-loading-row"
                    style={{
                      textAlign: "center",
                      padding: "30px 0",
                      color: "#666",
                    }}
                  >
                    <i
                      className="fa-solid fa-spinner fa-spin"
                      style={{ marginRight: "8px" }}
                    ></i>{" "}
                    กำลังโหลดข้อมูลระบบ...
                  </td>
                </tr>
              ) : hasError ? (
                <tr>
                  <td
                    colSpan="9"
                    style={{
                      textAlign: "center",
                      color: "#ef4444",
                      padding: "40px 0",
                      fontSize: "14px",
                    }}
                  >
                    ❌ เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง
                  </td>
                </tr>
              ) : sortedRoutes.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    style={{
                      textAlign: "center",
                      color: "#94a3b8",
                      padding: "40px 0",
                      fontSize: "14px",
                    }}
                  >
                    ไม่พบข้อมูลเส้นทางท่องเที่ยวหลัก
                  </td>
                </tr>
              ) : (
                sortedRoutes.map((item, index) => (
                  <tr key={item.routeId || index}>
                    <td style={{ textAlign: "center", fontWeight: "bold" }}>
                      {index + 1}
                    </td>
                    <td style={{ fontWeight: "bold" }}>{item.routeName}</td>
                    <td>
                      {item.categoriesPassed || item.routeDescription || "-"}
                    </td>
                    <td>{item.districtsPassed || "-"}</td>
                    <td style={{ textAlign: "center" }}>{item.pinCount || 0}</td>
                    <td style={{ textAlign: "center" }}>{item.createdBy || "-"}</td>
                    <td style={{ textAlign: "center" }}>
                      {item.updatedAt
                        ? new Date(item.updatedAt).toLocaleDateString("th-TH")
                        : item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString("th-TH")
                        : "-"}
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        fontWeight: "bold",
                        color: "#166534",
                        whiteSpace: "nowrap",
                      }}
                    >
                      [ เปิดใช้งาน ]
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          justifyContent: "center",
                        }}
                      >
                        <button
                          className="gov-table-action-btn edit-blue"
                          onClick={() =>
                            navigate(`/editMainRoute/${item.routeId}`)
                          }
                        >
                          <FontAwesomeIcon icon={faPenToSquare} />
                          แก้ไข
                        </button>
                        <button
                          className="gov-table-action-btn delete-red"
                          onClick={() => {
                            setSelectedRoute(item);
                            setShowDeletePopup(true);
                          }}
                        >
                          <FontAwesomeIcon icon={faTrashCan} />
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Popup ยืนยันการลบ */}
      {showDeletePopup && selectedRoute && (
        <div className="route-delete-modal-overlay" role="dialog" aria-modal="true">
          <div className="route-delete-modal">
            <div className="route-delete-icon">
              <FontAwesomeIcon icon={faTrashCan} />
            </div>

            <h3 className="route-delete-title">ยืนยันการลบเส้นทางสุขภาพ</h3>

            <div className="route-delete-body">
              <p className="route-delete-desc">คุณต้องการลบเส้นทางสุขภาพ</p>
              <div className="route-delete-name-card">
                {selectedRoute?.routeName || "-"}
              </div>
              <p className="route-delete-warning-note">
                ข้อมูลที่ลบแล้วไม่สามารถกู้คืนได้
              </p>
            </div>

            <div className="route-delete-actions">
              <button
                type="button"
                className="btn-route-delete-cancel"
                onClick={() => {
                  setShowDeletePopup(false);
                  setSelectedRoute(null);
                }}
              >
                ยกเลิก
              </button>

              <button
                type="button"
                className="btn-route-delete-confirm"
                onClick={handleDeleteRoute}
              >
                ยืนยันลบ
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

export default ListMainRoute;
