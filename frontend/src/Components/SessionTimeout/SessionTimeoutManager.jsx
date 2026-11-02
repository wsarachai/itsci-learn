import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import AdminStatusModal from "../AdminStatusModal/AdminStatusModal";

import { clearDashboardCache } from "../../pages/Dashboard/Dashboard";
import { clearWellnessHubCache } from "../../pages/ListWellnesshub/ListWellnesshub";
import { clearMainRouteCache } from "../../pages/ListMainroute/ListMainroute";
import { clearAdminArticleCache } from "../../pages/ListOfficialArticle/ListOfficialArticle";
import { clearAccountRequestsCache } from "../../pages/ListAccountRequest/ListAccountRequest";
import { resetPrefetchFlag } from "../../utils/adminPrefetcher";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 นาที
const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // ส่ง ping ทุก 5 นาทีเมื่อมีการใช้งาน
const ACTIVITY_THROTTLE_MS = 2500; // Throttle การบันทึกเวลาขยับเมาส์
const CHECK_INTERVAL_MS = 5000; // ตรวจสอบความเคลื่อนไหวทุก 5 วินาที
const STORAGE_KEY = "wellness_last_activity_time";

// 🌿 รายการเส้นทางที่ต้องใช้การจัดการเซสชัน (เฉพาะแอดมินและสถานประกอบการเท่านั้น ฝั่งผู้ใช้ไม่ต้อง)
const ADMIN_ROUTE_PREFIXES = [
  "/dashboard",
  "/listwellnesshub",
  "/add-wellness",
  "/createmainroute",
  "/listmainroute",
  "/editmainroute",
  "/createofficialarticle",
  "/listofficialarticle",
  "/editofficialarticle",
  "/listaccountrequest",
  "/account-requests",
];

const PROVIDER_ROUTE_PREFIXES = [
  "/provider/dashboard",
];

const isAdminRoute = (pathname) => {
  const path = (pathname || "").toLowerCase();
  return ADMIN_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix));
};

const isProviderRoute = (pathname) => {
  const path = (pathname || "").toLowerCase();
  return PROVIDER_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix));
};

export default function SessionTimeoutManager() {
  const location = useLocation();
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [sessionRole, setSessionRole] = useState(null); // 'admin' | 'provider' | null

  const lastActivityRef = useRef(Date.now());
  const lastHeartbeatRef = useRef(Date.now());
  const lastThrottleRef = useRef(0);
  const isLoggingOutRef = useRef(false);

  // 🌿 ตรวจสอบว่าขณะนี้กำลังอยู่ในหน้าที่ต้องจัดการเซสชันหรือไม่
  // ฝั่งผู้ใช้ทั่วไป (Public Pages) เช่น หน้าแรก, เส้นทาง, บทความ ฯลฯ จะคืนค่า null เสมอ เพื่อไม่ให้เซสชันมารบกวน
  const checkAuthRole = useCallback(() => {
    const pathname = location.pathname;

    // 1. หน้าฝั่ง Admin
    if (isAdminRoute(pathname)) {
      const hasAdmin = Boolean(
        localStorage.getItem("adminUser") ||
        localStorage.getItem("username") ||
        localStorage.getItem("adminName")
      );
      return hasAdmin ? "admin" : null;
    }

    // 2. หน้าฝั่งสถานประกอบการ
    if (isProviderRoute(pathname)) {
      const hasProvider = Boolean(
        localStorage.getItem("wellnessProvider") ||
        localStorage.getItem("wellnessProviderLicenseId")
      );
      return hasProvider ? "provider" : null;
    }

    // 3. หน้าฝั่งผู้ใช้ทั่วไป -> ไม่ใช้เซสชันเด็ดขาด
    return null;
  }, [location.pathname]);

  // เคลียร์ข้อมูล Session ทั้งหมดในหน่วยความจำและ LocalStorage
  const clearLocalSessions = useCallback((role) => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      if (role === "admin") {
        localStorage.removeItem("adminUser");
        localStorage.removeItem("adminName");
        localStorage.removeItem("username");
        localStorage.removeItem("role");
        localStorage.removeItem("token");
        localStorage.removeItem("showWelcome");

        // เคลียร์ Cache ทุกหน้าที่ Prefetch ไว้
        clearDashboardCache();
        clearWellnessHubCache();
        clearMainRouteCache();
        clearAdminArticleCache();
        clearAccountRequestsCache();
        resetPrefetchFlag();
      } else if (role === "provider") {
        localStorage.removeItem("wellnessProvider");
        localStorage.removeItem("wellnessProviderLicenseId");
        localStorage.removeItem("wellnessProviderName");
      }
    } catch {
      // ignore
    }
  }, []);

  // ฟังก์ชันดำเนินการเมื่อหมดเวลา 30 นาที (Auto-Logout เฉพาะ Admin / สถานประกอบการ)
  const handleTimeoutLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return;

    const currentRole = checkAuthRole();
    if (!currentRole) {
      // ถ้าไม่ได้อยู่ในหน้า Admin หรือ สถานประกอบการ ไม่ต้องทำงาน
      return;
    }

    isLoggingOutRef.current = true;
    setSessionRole(currentRole);

    // แจ้ง Backend ปิด Session (ไม่ต้องรอคำตอบ)
    try {
      if (currentRole === "admin") {
        axios.post("/api/admin/logout", {}, { withCredentials: true }).catch(() => {});
      } else if (currentRole === "provider") {
        axios.post("/api/wellness-hub-auth/logout", {}, { withCredentials: true }).catch(() => {});
      }
    } catch {
      // ignore
    }

    clearLocalSessions(currentRole);
    setShowModal(true);
  }, [checkAuthRole, clearLocalSessions]);

  // ฟังก์ชันอัปเดตเวลากิจกรรมล่าสุดของผู้ใช้
  const handleUserActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;

    // Throttle การเขียนลง localStorage เพื่อประสิทธิภาพสูงสุด
    if (now - lastThrottleRef.current > ACTIVITY_THROTTLE_MS) {
      lastThrottleRef.current = now;
      try {
        localStorage.setItem(STORAGE_KEY, now.toString());
      } catch {
        // ignore
      }
    }
  }, []);

  // ฟังก์ชัน Keep-Alive Heartbeat (สะกิดต่ออายุ Session ฝั่งเซิร์ฟเวอร์ทุก 5 นาทีถ้ายังมีการขยับ)
  const sendKeepAlivePing = useCallback(async (role) => {
    try {
      if (role === "admin") {
        await axios.get("/api/admin/ping", {
          withCredentials: true,
          timeout: 10000,
        });
      } else if (role === "provider") {
        await axios.get("/api/wellness-hub-auth/ping", {
          withCredentials: true,
          timeout: 10000,
        });
      }
    } catch (err) {
      // หากเซิร์ฟเวอร์ตอบ 401 แปลว่าเซสชันตายแล้ว
      if (err.response?.status === 401 && !isLoggingOutRef.current) {
        handleTimeoutLogout();
      }
    }
  }, [handleTimeoutLogout]);

  // 1. ดักจับ Event การกระทำของผู้ใช้บนหน้าจอ (ทำงานเฉพาะในหน้า Admin หรือ สถานประกอบการ)
  useEffect(() => {
    const role = checkAuthRole();
    if (!role) {
      // ถ้าเป็นหน้าผู้ใช้ทั่วไป ปิด Modal ทันที และไม่ผูก Event Listener ใดๆ
      setShowModal(false);
      isLoggingOutRef.current = false;
      return;
    }

    // เริ่มต้นบันทึกเวลาเมื่ออยู่ในหน้า Admin / สถานประกอบการ
    const now = Date.now();
    lastActivityRef.current = now;
    lastHeartbeatRef.current = now;
    isLoggingOutRef.current = false;

    try {
      localStorage.setItem(STORAGE_KEY, now.toString());
    } catch {
      // ignore
    }

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
      "wheel",
    ];

    events.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
    };
  }, [checkAuthRole, handleUserActivity, location.pathname]);

  // 2. Loop ตรวจสอบ Inactivity และส่ง Heartbeat
  useEffect(() => {
    const interval = setInterval(() => {
      const role = checkAuthRole();
      if (!role) return; // ไม่ใช่หน้า Admin/สถานประกอบการ ข้ามไปเลย

      const now = Date.now();
      const storedTimeStr = localStorage.getItem(STORAGE_KEY);
      const storedTime = storedTimeStr ? parseInt(storedTimeStr, 10) : lastActivityRef.current;
      const lastActive = Math.max(lastActivityRef.current, storedTime || 0);

      const idleDuration = now - lastActive;

      // ก) หากไม่มีการทำรายการเกิน 30 นาที ให้ Logout ทันที
      if (idleDuration >= IDLE_TIMEOUT_MS) {
        handleTimeoutLogout();
        return;
      }

      // ข) หากยังมีการใช้งาน และผ่านไปเกิน 5 นาทีนับจาก Heartbeat ล่าสุด ให้ส่ง ping ไปสะกิด Backend
      if (now - lastHeartbeatRef.current >= HEARTBEAT_INTERVAL_MS) {
        lastHeartbeatRef.current = now;
        sendKeepAlivePing(role);
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [checkAuthRole, handleTimeoutLogout, sendKeepAlivePing]);

  const handleModalConfirm = () => {
    setShowModal(false);
    isLoggingOutRef.current = false;

    if (sessionRole === "provider") {
      navigate("/provider/login", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  };

  // 🌿 ป้องกันการแสดง Modal บนหน้าผู้ใช้ทั่วไปเด็ดขาด (แสดงเฉพาะ Admin หรือ สถานประกอบการ)
  const isProtectedPath = isAdminRoute(location.pathname) || isProviderRoute(location.pathname);
  if (!isProtectedPath || !showModal) {
    return null;
  }

  const roleText = sessionRole === "provider" ? "สถานประกอบการ" : "ผู้ดูแลระบบ";

  return (
    <AdminStatusModal
      isOpen={showModal}
      type="warning"
      title="เซสชันหมดอายุเนื่องจากไม่มีการใช้งาน"
      message={`ระบบตรวจพบว่าไม่มีการเคลื่อนไหวหรือทำรายการบนหน้าจอ${roleText}นานเกิน 30 นาที เพื่อความปลอดภัยของข้อมูล ระบบได้ออกจากระบบอัตโนมัติ กรุณาเข้าสู่ระบบใหม่อีกครั้ง`}
      confirmText="เข้าสู่ระบบใหม่"
      onConfirm={handleModalConfirm}
      showCloseButton={false}
    />
  );
}
