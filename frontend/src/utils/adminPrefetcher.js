import axios from "axios";
import { setDashboardCache } from "../pages/Dashboard/Dashboard";
import { setAdminArticlesCache } from "../pages/ListOfficialArticle/ListOfficialArticle";
import { setWellnessHubCache } from "../pages/ListWellnesshub/ListWellnesshub";
import { setMainRouteCache } from "../pages/ListMainroute/ListMainroute";

const API_BASE_URL = "/api";

let isPrefetching = false;
let hasPrefetched = false;

/**
 * โหลดข้อมูลหน้ารายการต่างๆ ของ Admin ไว้ล่วงหน้าในพื้นหลัง (Background Preload)
 * เพื่อให้เวลาแอดมินคลิกเปลี่ยนแท็บ สามารถเปิดดูข้อมูลได้ทันทีใน 0 วินาที
 */
export const prefetchAdminData = () => {
  if (isPrefetching || hasPrefetched) return;
  isPrefetching = true;

  // รัน Request พร้อมกันแบบ Non-blocking ใน Background
  const prefetchTasks = [
    // 1. โหลดข้อมูลแดชบอร์ดล่วงหน้า
    axios
      .get(`${API_BASE_URL}/admin/dashboard`, { timeout: 15000 })
      .then((res) => {
        if (res.data) {
          setDashboardCache(res.data);
        }
      })
      .catch(() => {}),

    // 2. โหลดรายการบทความล่วงหน้า
    axios
      .get(`${API_BASE_URL}/articles`, { timeout: 15000 })
      .then((res) => {
        if (Array.isArray(res.data)) {
          setAdminArticlesCache(res.data);
        }
      })
      .catch(() => {}),

    // 3. โหลดรายการสถานประกอบการล่วงหน้า
    axios
      .post(
        `${API_BASE_URL}/wellness-hubs/search`,
        { search: null, categoryId: null, districtId: null },
        { timeout: 15000 }
      )
      .then((res) => {
        if (Array.isArray(res.data)) {
          setWellnessHubCache(res.data);
        }
      })
      .catch(() => {}),

    // 4. โหลดรายการเส้นทางล่วงหน้า
    axios
      .get(`${API_BASE_URL}/main-routes`, { timeout: 15000 })
      .then((res) => {
        if (Array.isArray(res.data)) {
          setMainRouteCache(res.data);
        }
      })
      .catch(() => {}),
  ];

  Promise.allSettled(prefetchTasks).finally(() => {
    isPrefetching = false;
    hasPrefetched = true;
  });
};

export const resetPrefetchFlag = () => {
  hasPrefetched = false;
  isPrefetching = false;
};
