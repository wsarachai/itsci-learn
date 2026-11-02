import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import axios from "axios";

import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

// ฝั่งผู้ใช้ทั่วไป
import Navbar from "./Components/Navbar/Navbar";
import Footer from "./Components/Footer/Footer";
import HomePage from "./pages/HomePage/HomePage";

// ฝั่งแอดมิน
import LoginAdmin from "./pages/LoginAdmin/LoginAdmin";
import ListWellnessHub from "./pages/ListWellnesshub/ListWellnesshub";
import AddWellnessHub from "./pages/CreateWellnesshub/AddWellnessHub";
import EditWellnessHub from "./pages/EditWellnesshub/EditWellnesshub";
import CreateMainRoute from "./pages/CreateMainRoute/CreateMainRoute";
import ListMainRoute from "./pages/ListMainroute/ListMainroute";
import CreateOfficialArticle from "./pages/CreateArticleOfficial/CreateOfficialArticle";
import ListOfficialArticle from "./pages/ListOfficialArticle/ListOfficialArticle";
import ListAccountRequest from "./pages/ListAccountRequest/ListAccountRequest";
import ApproveAccountRequest from "./pages/ApproveAccountRequest/ApproveAccountRequest";
import Dashboard from "./pages/Dashboard/Dashboard";
import RouteDetail from "./pages/RouteDetail/RouteDetail";
import SearchResults from "./pages/SearchResults/SearchResults";
import WellnessHubDetail from "./pages/WellnessHubDetail/WellnessHubDetail";
import RequestWellnessHubAccount from "./pages/RequestWellnessHubAccount/RequestWellnessHubAccount";
import TrackAccountRequest from "./pages/TrackAccountRequest/TrackAccountRequest";
import RouteList from "./pages/RouteList/RouteList";
import ArticleList from "./pages/ArticleList/ArticleList";
import LoginWellnessHub from "./pages/LoginWellnessHub/LoginWellnessHub";
import ProviderDashboard from "./pages/ProviderDashboard/ProviderDashboard";
import ArticleDetail from "./pages/ArticleDetail/ArticleDetail";
import SessionTimeoutManager from "./Components/SessionTimeout/SessionTimeoutManager";

// ส่ง Session Cookie อัตโนมัติไปกับทุก Request
axios.defaults.withCredentials = true;

// ป้องกันการ Register Interceptor ซ้ำ
let isInterceptorRegistered = false;

if (!isInterceptorRegistered) {
  isInterceptorRegistered = true;

  // Interceptor ดักจับกรณี API ตอบ 401 Unauthorized สำหรับฝั่ง Admin และ สถานประกอบการเท่านั้น (ฝั่งผู้ใช้ไม่ต้อง)
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        const adminPrefixes = [
          "/dashboard",
          "/listWellnesshub",
          "/add-wellness",
          "/listMainRoute",
          "/createMainRoute",
          "/editMainRoute",
          "/listOfficialArticle",
          "/createOfficialArticle",
          "/editOfficialArticle",
          "/listAccountRequest",
          "/account-requests",
        ];

        const providerPrefixes = [
          "/provider/dashboard",
        ];

        const currentPath = window.location.pathname;
        const isAdminPath = adminPrefixes.some((path) =>
          currentPath.toLowerCase().startsWith(path.toLowerCase())
        );
        const isProviderPath = providerPrefixes.some((path) =>
          currentPath.toLowerCase().startsWith(path.toLowerCase())
        );

        // จัดการกรณีหลุดเซสชันเฉพาะฝั่งแอดมิน
        if (isAdminPath) {
          localStorage.removeItem("adminUser");
          localStorage.removeItem("adminName");
          localStorage.removeItem("username");
          localStorage.removeItem("role");
          localStorage.removeItem("token");

          sessionStorage.setItem(
            "session_timeout_message",
            "เซสชันหมดอายุเนื่องจากไม่มีการใช้งาน กรุณาเข้าสู่ระบบใหม่อีกครั้ง"
          );

          if (!currentPath.toLowerCase().startsWith("/login")) {
            window.location.href = "/login";
          }
        } else if (isProviderPath) {
          // จัดการกรณีหลุดเซสชันเฉพาะฝั่งสถานประกอบการ
          localStorage.removeItem("wellnessProvider");
          localStorage.removeItem("wellnessProviderLicenseId");
          localStorage.removeItem("wellnessProviderName");

          if (!currentPath.toLowerCase().startsWith("/provider/login")) {
            window.location.href = "/provider/login";
          }
        }
        // ฝั่งผู้ใช้ทั่วไป ไม่ต้อง redirect และไม่มีเซสชันมารบกวน
      }
      return Promise.reject(error);
    }
  );
}

// ปิดการจำตำแหน่ง Scroll อัตโนมัติของบราวเซอร์ ป้องกันหน้าจอเด้งลงล่างขณะโหลด
if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // บังคับปิด scroll restoration ซ้ำ
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // เลื่อนขึ้นบนสุดทันที
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });

    // ดักเรียกซ้ำเมื่อ DOM/Layout เริ่ม render เพื่อป้องกัน layout shift ดันลงล่าง
    const timer = setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
      });
    }, 50);

    return () => clearTimeout(timer);
  }, [pathname, search]);

  return null;
}

function PublicLayout({ children }) {
  return (
    <div
      className="public-layout-root"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      <Navbar />
      <div style={{ flex: "1 0 auto", width: "100%" }}>{children}</div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <SessionTimeoutManager />
      <div className="App">
        <Routes>
          {/* ฝั่งผู้ใช้ทั่วไป */}
          <Route
            path="/"
            element={
              <PublicLayout>
                <HomePage />
              </PublicLayout>
            }
          />
          <Route
            path="/wellness-routes/:routeId"
            element={
              <PublicLayout>
                <RouteDetail />
              </PublicLayout>
            }
          />

          <Route
            path="/search"
            element={
              <PublicLayout>
                <SearchResults />
              </PublicLayout>
            }
          />
          <Route
            path="/wellness-hubs/:hubId"
            element={
              <PublicLayout>
                <WellnessHubDetail />
              </PublicLayout>
            }
          />
          <Route
            path="/request-wellness-hub-account"
            element={
              <PublicLayout>
                <RequestWellnessHubAccount />
              </PublicLayout>
            }
          />
          <Route
            path="/request-wellness-hub-account/:licenseId"
            element={
              <PublicLayout>
                <RequestWellnessHubAccount />
              </PublicLayout>
            }
          />
          <Route
            path="/request-account"
            element={
              <PublicLayout>
                <RequestWellnessHubAccount />
              </PublicLayout>
            }
          />
          <Route
            path="/request-account/:licenseId"
            element={
              <PublicLayout>
                <RequestWellnessHubAccount />
              </PublicLayout>
            }
          />
          <Route
            path="/wellness-routes"
            element={
              <PublicLayout>
                <RouteList />
              </PublicLayout>
            }
          />
          <Route
            path="/articles"
            element={
              <PublicLayout>
                <ArticleList />
              </PublicLayout>
            }
          />
          <Route
            path="/articles/:articleId"
            element={
              <PublicLayout>
                <ArticleDetail />
              </PublicLayout>
            }
          />
          <Route
            path="/track-status"
            element={
              <PublicLayout>
                <TrackAccountRequest />
              </PublicLayout>
            }
          />
          {/* ฝั่งผู้ให้บริการ */}
          <Route path="/provider/login" element={<LoginWellnessHub />} />
          <Route path="/provider/dashboard" element={<ProviderDashboard />} />
          {/* ฝั่งแอดมิน */}
          <Route path="/login" element={<LoginAdmin />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/listWellnesshub" element={<ListWellnessHub />} />
          <Route path="/add-wellness" element={<AddWellnessHub />} />
          <Route
            path="/listWellnesshub/edit/:id"
            element={<EditWellnessHub />}
          />
          <Route path="/createMainRoute" element={<CreateMainRoute />} />
          <Route path="/listMainRoute" element={<ListMainRoute />} />
          <Route path="/editMainRoute/:id" element={<CreateMainRoute />} />
          <Route
            path="/createOfficialArticle"
            element={<CreateOfficialArticle />}
          />
          <Route
            path="/listOfficialArticle"
            element={<ListOfficialArticle />}
          />

          <Route
            path="/editOfficialArticle/:id"
            element={<CreateOfficialArticle />}
          />
          <Route path="/listAccountRequest" element={<ListAccountRequest />} />
          <Route
            path="/account-requests/:id/approve"
            element={<ApproveAccountRequest />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
