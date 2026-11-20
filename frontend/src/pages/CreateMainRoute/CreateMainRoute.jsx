import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axiosInstance from "axios";
import L from "leaflet";
import "leaflet-routing-machine";
import { getCategoryMarkerIcon } from "../../utils/categoryMarkerIcons";
import "./CreateMainRoute.css";
import AdminSidebar from "../../Components/AdminSidebar/AdminSidebar";
import AdminStatusModal from "../../Components/AdminStatusModal/AdminStatusModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo, faXmark } from "@fortawesome/free-solid-svg-icons";
import { clearMainRouteCache } from "../ListMainroute/ListMainroute";
import { clearDashboardCache } from "../Dashboard/Dashboard";

// 🌟 1. ค่าคงที่และ Helper function ด้านนอก Component
const REQUIRED_EMERGENCY_CATEGORY_IDS = ["EM01", "EM02"];

const mergeRequiredCategories = (categoryIds = []) => {
  return [
    ...new Set([
      ...categoryIds.map(String),
      ...REQUIRED_EMERGENCY_CATEGORY_IDS,
    ]),
  ];
};

// ตรวจสอบความถูกต้องของพิกัดก่อนนำไปนับและปักหมุด
const hasValidCoordinates = (hub) => {
  const rawLatitude = hub?.wellnessHubLatitude;
  const rawLongitude = hub?.wellnessHubLongitude;

  if (
    rawLatitude === null ||
    rawLatitude === undefined ||
    rawLongitude === null ||
    rawLongitude === undefined ||
    String(rawLatitude).trim() === "" ||
    String(rawLongitude).trim() === ""
  ) {
    return false;
  }

  const latitude = Number(rawLatitude);
  const longitude = Number(rawLongitude);

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    !(latitude === 0 && longitude === 0) &&
    latitude >= 17.0 &&
    latitude <= 20.5 &&
    longitude >= 98.0 &&
    longitude <= 100.0
  );
};

// ตรวจสอบว่าสถานประกอบการมีคุณสมบัติครบถ้วนสำหรับแสดงบนแผนที่ (สถานะ ACTIVE + มีลิงก์ Google Maps + มีพิกัด ละติจูด ลองติจูด ที่ถูกต้อง)
const isValidHubForMap = (hub) => {
  if (!hub) return false;

  // 1. สถานะเปิดทำการ (ACTIVE) เท่านั้น
  const status = hub.status ? String(hub.status).trim().toLowerCase() : "active";
  if (status !== "active" && status !== "เปิดใช้งาน") {
    return false;
  }

  // 2. ต้องมีลิงก์ Google Maps
  const gmapsLink = hub.googleMapsLink ? String(hub.googleMapsLink).trim() : "";
  if (!gmapsLink || gmapsLink === "null" || gmapsLink === "undefined") {
    return false;
  }

  // 3. ต้องมีพิกัดที่ถูกต้อง
  return hasValidCoordinates(hub);
};

// 📏 คำนวณระยะทางระหว่าง 2 พิกัดด้วยสูตร Haversine (กิโลเมตร)
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const numLat1 = Number(lat1);
  const numLon1 = Number(lon1);
  const numLat2 = Number(lat2);
  const numLon2 = Number(lon2);
  if (isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)) return 0;

  const R = 6371; // รัศมีโลกเฉลี่ย (km)
  const dLat = ((numLat2 - numLat1) * Math.PI) / 180;
  const dLon = ((numLon2 - numLon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((numLat1 * Math.PI) / 180) *
      Math.cos((numLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// 🗺️ คำนวณระยะทางรวมของเส้นทางตามลำดับอำเภอ (กิโลเมตร)
const calculateTotalRouteDistance = (routeList) => {
  if (!Array.isArray(routeList) || routeList.length < 2) return 0;
  let totalKm = 0;
  for (let i = 0; i < routeList.length - 1; i++) {
    const from = routeList[i];
    const to = routeList[i + 1];
    const lat1 = Number(from.district?.latitude ?? from.latitude);
    const lon1 = Number(from.district?.longitude ?? from.longitude);
    const lat2 = Number(to.district?.latitude ?? to.latitude);
    const lon2 = Number(to.district?.longitude ?? to.longitude);
    totalKm += calculateDistanceKm(lat1, lon1, lat2, lon2);
  }
  return totalKm;
};

// ⚡ จัดเรียงลำดับเส้นทางอัตโนมัติแบบอิสระทุกจุด (Multi-Start TSP + Full 2-Opt + Node Relocation)
// ช่วยสลับจุดเริ่มต้น จุดสิ้นสุด และจุดระหว่างทางได้อย่างอิสระ เพื่อให้เส้นทางเป็นเส้นตรงต่อเนื่อง ไม่วิ่งวนย้อนไปมา
const optimizeRouteOrder = (routeList) => {
  if (!Array.isArray(routeList) || routeList.length <= 2) return routeList;

  const getLat = (item) => Number(item?.district?.latitude ?? item?.latitude);
  const getLng = (item) => Number(item?.district?.longitude ?? item?.longitude);

  const getDist = (a, b) => {
    const latA = getLat(a);
    const lngA = getLng(a);
    const latB = getLat(b);
    const lngB = getLng(b);
    if (!Number.isFinite(latA) || !Number.isFinite(lngA) || !Number.isFinite(latB) || !Number.isFinite(lngB)) {
      return Infinity;
    }
    return calculateDistanceKm(latA, lngA, latB, lngB);
  };

  const calculatePathDistance = (path) => {
    if (!Array.isArray(path) || path.length < 2) return 0;
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const d = getDist(path[i], path[i + 1]);
      total += Number.isFinite(d) ? d : 0;
    }
    return total;
  };

  // 1. สร้างเส้นทางเริ่มต้นด้วย Nearest Neighbor จากจุดเริ่มต้นใดๆ
  const buildNearestNeighbor = (startIdx) => {
    const unvisited = [...routeList];
    const path = [unvisited.splice(startIdx, 1)[0]];

    while (unvisited.length > 0) {
      const current = path[path.length - 1];
      let nearestIndex = 0;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const d = getDist(current, unvisited[i]);
        if (d < minDistance) {
          minDistance = d;
          nearestIndex = i;
        }
      }

      path.push(unvisited.splice(nearestIndex, 1)[0]);
    }
    return path;
  };

  // 2. ปรับปรุงเส้นทางด้วย 2-Opt และ Node Relocation (สลับ/ย้ายตำแหน่งได้อย่างอิสระทุกจุดเพื่อตัดการย้อนศร)
  const improveRoute = (initialRoute) => {
    let current = [...initialRoute];
    let improved = true;
    let iterations = 0;

    while (improved && iterations < 80) {
      improved = false;
      iterations++;

      // 2.1 2-Opt Reversal (กลับด้านลำดับย่อย รวมถึงจุดเริ่มต้นและสิ้นสุด)
      for (let i = 0; i < current.length - 1; i++) {
        for (let k = i + 1; k < current.length; k++) {
          const newRoute = [
            ...current.slice(0, i),
            ...current.slice(i, k + 1).reverse(),
            ...current.slice(k + 1),
          ];

          if (calculatePathDistance(newRoute) < calculatePathDistance(current) - 0.02) {
            current = newRoute;
            improved = true;
            break;
          }
        }
        if (improved) break;
      }

      if (improved) continue;

      // 2.2 Node Relocation (หยิบจุดที่อยู่ผิดตำแหน่ง ย้ายไปแทรกในตำแหน่งที่เหมาะสมที่สุด)
      for (let fromIdx = 0; fromIdx < current.length; fromIdx++) {
        const node = current[fromIdx];
        const remaining = current.filter((_, idx) => idx !== fromIdx);

        for (let toIdx = 0; toIdx <= remaining.length; toIdx++) {
          if (toIdx === fromIdx) continue;
          const newRoute = [
            ...remaining.slice(0, toIdx),
            node,
            ...remaining.slice(toIdx),
          ];

          if (calculatePathDistance(newRoute) < calculatePathDistance(current) - 0.02) {
            current = newRoute;
            improved = true;
            break;
          }
        }
        if (improved) break;
      }
    }

    return current;
  };

  // 3. ค้นหาแนวเส้นทางจากทุกจุดเริ่มต้น เพื่อหาแนวเส้นทางตรงที่ประหยัดและไม่วิ่งย้อนศรที่สุด
  let bestRoute = null;
  let minTotalDistance = Infinity;

  for (let s = 0; s < routeList.length; s++) {
    const candidateRoute = improveRoute(buildNearestNeighbor(s));
    const dist = calculatePathDistance(candidateRoute);
    if (dist < minTotalDistance) {
      minTotalDistance = dist;
      bestRoute = candidateRoute;
    }
  }

  // 4. รักษาทิศทางภาพรวม: หากจุดแรกเดิมที่ผู้ใช้เลือกไว้ อยู่ใกล้กับปลายทางของ bestRoute มากกว่าต้นทาง ให้กลับด้าน (reverse) เพื่อให้ทิศทางสอดคล้องกับเจตนาตั้งต้น
  if (bestRoute && routeList.length > 0) {
    const originalFirst = routeList[0];
    const origLat = getLat(originalFirst);
    const origLng = getLng(originalFirst);
    if (Number.isFinite(origLat) && Number.isFinite(origLng)) {
      const distToHead = calculateDistanceKm(origLat, origLng, getLat(bestRoute[0]), getLng(bestRoute[0]));
      const distToTail = calculateDistanceKm(origLat, origLng, getLat(bestRoute[bestRoute.length - 1]), getLng(bestRoute[bestRoute.length - 1]));
      if (distToTail < distToHead) {
        bestRoute = [...bestRoute].reverse();
      }
    }
  }

  return bestRoute || routeList;
};

const CreateMainRoute = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const routingControlRef = useRef(null);

  // States แบบฟอร์ม
  const [routeName, setRouteName] = useState("");
  const [routeDescription, setRouteDescription] = useState("");
  const [selectDistrictValue, setSelectDistrictValue] = useState("");
  const [adminName, setAdminName] = useState("admin02");

  // States ทะเบียนข้อมูลหลักจาก DB
  const [categories, setCategories] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wellnessHubs, setWellnessHubs] = useState([]);

  // States จัดลำดับและรายการควบคุมหน้าบ้าน (เฉพาะหมวดหมู่ที่ผู้ใช้เลือกได้)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);

  const [orderedRouteDetails, setOrderedRouteDetails] = useState([]);
  const [errors, setErrors] = useState({});

  const [loadingRoute, setLoadingRoute] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });
  const [showLegendModal, setShowLegendModal] = useState(false);
  const [optimizationFeedback, setOptimizationFeedback] = useState("");

  // Image upload states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageFileName, setImageFileName] = useState("");
  const [imageExistingName, setImageExistingName] = useState("");
  const [imageError, setImageError] = useState("");

  // Refs จัดการเลเยอร์ Leaflet
  const districtMarkersRef = useRef({});
  const placeMarkersRef = useRef({});

  // ฟังก์ชันแยกประเภทหมวดหมู่ ดึงสี ไอคอน และเช็คหมวดฉุกเฉิน
  const getCategoryStyle = (categoryId, categoryName = "") => {
    const key = (categoryId || "").toString().toUpperCase();
    const name = (categoryName || "").toString().toUpperCase();

    if (
      key.includes("EM02") ||
      key.includes("ALS") ||
      name.includes("ADVANCED") ||
      name.includes("HOSPITAL") ||
      name.includes("โรงพยาบาล")
    ) {
      return {
        color: "#BD0915",
        icon: "fa-hospital",
        isEmergency: true,
        label: "ALS (โรงพยาบาล)",
      };
    }

    if (
      key.includes("EM01") ||
      key.includes("BLS") ||
      name.includes("BASIC") ||
      name.includes("RESCUE") ||
      name.includes("กู้ภัย")
    ) {
      return {
        color: "#C98600",
        icon: "fa-truck-medical",
        isEmergency: true,
        label: "BLS (หน่วยกู้ภัย)",
      };
    }

    if (
      key.includes("C01") ||
      name.includes("SPA") ||
      name.includes("MASSAGE") ||
      name.includes("นวด") ||
      name.includes("สปา")
    ) {
      return {
        color: "#E02873",
        icon: "fa-spa",
        isEmergency: false,
        label: "นวด/สปาเพื่อสุขภาพ",
      };
    }

    if (
      key.includes("C03") ||
      name.includes("REST") ||
      name.includes("FOOD") ||
      name.includes("อาหาร")
    ) {
      return {
        color: "#0B7D31",
        icon: "fa-utensils",
        isEmergency: false,
        label: "อาหารและเครื่องดื่ม",
      };
    }

    if (
      key.includes("C04") ||
      name.includes("HOTEL") ||
      name.includes("ACCOM") ||
      name.includes("ที่พัก")
    ) {
      return {
        color: "#5E27AB",
        icon: "fa-bed",
        isEmergency: false,
        label: "ที่พักฟื้นฟูสุขภาพ",
      };
    }

    if (
      key.includes("C02") ||
      name.includes("CLINIC") ||
      name.includes("คลินิก")
    ) {
      return {
        color: "#004CB4",
        icon: "fa-notes-medical",
        isEmergency: false,
        label: "คลินิก/สถานพยาบาล",
      };
    }

    if (
      key.includes("C05") ||
      name.includes("ATTRACTION") ||
      name.includes("TOURIS") ||
      name.includes("TOURISM") ||
      name.includes("TOURIST") ||
      name.includes("TRAVEL") ||
      name.includes("ท่องเที่ยว")
    ) {
      return {
        color: "#009BB0",
        icon: "fa-map-location-dot",
        isEmergency: false,
        label: "สถานที่ท่องเที่ยว",
      };
    }

    return {
      color: "#009BB0",
      icon: "fa-location-dot",
      isEmergency: false,
      label: categoryName || "อื่นๆ",
    };
  };

  function normalizeRouteImage(value) {
    if (!value) return "";
    const normalizedValue = String(value).trim();
    if (
      normalizedValue.startsWith("http://") ||
      normalizedValue.startsWith("https://") ||
      normalizedValue.startsWith("blob:")
    ) {
      return normalizedValue;
    }
    if (normalizedValue.startsWith("/uploads/")) {
      return `${normalizedValue}`;
    }
    return `/uploads/routes/${normalizedValue}`;
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์รูปภาพได้"));
      reader.readAsDataURL(file);
    });
  }

  const handleImageChange = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const isImage =
      ["image/jpeg", "image/png", "image/jpg"].includes(file.type) ||
      /\.(png|jpe?g)$/i.test(file.name);
    if (!isImage) {
      setImageError("ต้องเป็นไฟล์รูปภาพนามสกุล .png, .jpg และ .jpeg เท่านั้น");
      event.target.value = "";
      return;
    }

    const maxBytes = 20 * 1024 * 1024;
    if (file.size > maxBytes) {
      setImageError("ขนาดไฟล์ต้องไม่เกิน 20 MB");
      event.target.value = "";
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setImageFile(file);
      setImagePreview(dataUrl);
      setImageFileName(file.name);
      setImageError("");
    } catch (err) {
      console.error("ไม่สามารถอ่านไฟล์รูปภาพได้", err);
      setImageError("ไม่สามารถอ่านไฟล์ได้ กรุณาลองอีกครั้ง");
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    setImageFileName("");
    setImageExistingName("");
    setImageError("");
  };

  // โหลด Master Data และ Route เดิม (ถ้ามี id) พร้อมกันในรอบเดียว
  useEffect(() => {
    const controller = new AbortController();
    const storedAdmin = localStorage.getItem("adminName");
    if (storedAdmin) setAdminName(storedAdmin);

    const fetchAllData = async () => {
      setLoadingRoute(true);
      setStatusModal({
        isOpen: true,
        type: "loading",
        title: id ? "กำลังโหลดข้อมูลเส้นทาง..." : "กำลังโหลดข้อมูลระบบ...",
        message: id
          ? "กรุณารอสักครู่ ระบบกำลังดึงแผนที่ หมวดหมู่ และข้อมูลเส้นทางเดิม"
          : "กรุณารอสักครู่ ระบบกำลังโหลดข้อมูลหมวดหมู่และอำเภอ",
      });

      try {
        // รวมคำขอ API ทั้งหมดให้โหลดพร้อมกันในรอบเดียว
        const requests = [
          axiosInstance.get("/api/categories", { signal: controller.signal }),
          axiosInstance.get("/api/districts", { signal: controller.signal }),
          axiosInstance.get("/api/wellness-hubs", { signal: controller.signal }),
        ];

        if (id) {
          requests.push(
            axiosInstance.get(`/api/main-routes/${id}`, { signal: controller.signal })
          );
        }

        const [catRes, distRes, hubRes, routeRes] = await Promise.all(requests);
        if (controller.signal.aborted) return;

        const currentDistricts = distRes.data || [];
        setCategories(catRes.data || []);
        setDistricts(currentDistricts);
        setWellnessHubs(hubRes.data || []);

        // จัดการข้อมูลเส้นทางเดิม (ถ้าเป็นการเปิดหน้าเพื่อ Edit)
        if (id && routeRes?.data) {
          const data = routeRes.data;
          setRouteName(data.routeName || "");
          setRouteDescription(data.routeDescription || "");

          if (data.routeImage) {
            setImageExistingName(data.routeImage);
            setImagePreview(normalizeRouteImage(data.routeImage));
            setImageFileName(data.routeImage);
          }

          // ดึงหมวดหมู่เดิม (รองรับทั้ง categories จากตาราง main_route_categories, categoryIds array, และ categoryId เดิม)
          let extractedCategoryIds = [];
          if (Array.isArray(data.categoryIds) && data.categoryIds.length > 0) {
            extractedCategoryIds = data.categoryIds;
          } else if (Array.isArray(data.categories) && data.categories.length > 0) {
            extractedCategoryIds = data.categories.map((cat) =>
              typeof cat === "object" && cat !== null ? cat.categoryId : String(cat)
            );
          } else if (data.categoryId) {
            try {
              const parsedCategoryIds = JSON.parse(data.categoryId);
              extractedCategoryIds = Array.isArray(parsedCategoryIds)
                ? parsedCategoryIds
                : [parsedCategoryIds];
            } catch {
              extractedCategoryIds = [String(data.categoryId)];
            }
          }

          if (extractedCategoryIds.length > 0) {
            const selectableCategoryIds = extractedCategoryIds
              .map(String)
              .filter((catId) => !REQUIRED_EMERGENCY_CATEGORY_IDS.includes(catId));
            setSelectedCategoryIds(selectableCategoryIds);
          } else {
            setSelectedCategoryIds([]);
          }

          if (data.details && data.details.length > 0) {
            // ป้องกันปัญหาอำเภอซ้ำซ้อนจาก Cartesian Product ในการดึงข้อมูล
            const uniqueDetailsMap = new Map();
            data.details.forEach((detail) => {
              const districtId = detail.district?.districtId ?? detail.districtId;
              const orderNum = detail.orderNumber;
              const key = districtId != null ? `dist_${districtId}` : `order_${orderNum}`;
              if (!uniqueDetailsMap.has(key)) {
                uniqueDetailsMap.set(key, detail);
              }
            });

            const sortedDetails = Array.from(uniqueDetailsMap.values()).sort(
              (a, b) => Number(a.orderNumber || 0) - Number(b.orderNumber || 0),
            );

            const seenDistrictIds = new Set();
            const mappedDistricts = sortedDetails
              .map((detail) => {
                const districtId = detail.district?.districtId ?? detail.districtId;
                if (!districtId || seenDistrictIds.has(String(districtId))) {
                  return null;
                }
                seenDistrictIds.add(String(districtId));
                return currentDistricts.find(
                  (d) => String(d.districtId) === String(districtId),
                );
              })
              .filter(Boolean);

            setOrderedRouteDetails(mappedDistricts);
          }
        }

        setStatusModal((prev) => ({ ...prev, isOpen: false }));
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("ดึงข้อมูลล้มเหลว", err);
        const is404 = err.response && err.response.status === 404;
        setStatusModal({
          isOpen: true,
          type: "error",
          title: is404 ? "ไม่พบข้อมูลเส้นทาง" : "เกิดข้อผิดพลาดในการโหลดข้อมูล",
          message: is404
            ? "ไม่พบข้อมูลเส้นทางหลักที่ต้องการแก้ไข กรุณาตรวจสอบรหัสเส้นทางอีกครั้ง"
            : "ไม่สามารถดึงข้อมูลระบบได้ กรุณาลองใหม่อีกครั้ง",
        });
      } finally {
        if (!controller.signal.aborted) {
          setLoadingRoute(false);
        }
      }
    };

    fetchAllData();
    return () => controller.abort();
  }, [id]);

  // Initial Leaflet Map (ใช้การตั้งค่าและ Tile Layer เดียวกับหน้า RouteDetail)
  useEffect(() => {
    if (!mapRef.current && mapContainerRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
        touchZoom: true,
        doubleClickZoom: true,
        dragging: true,
        keyboard: true,
      }).setView([18.7883, 98.9853], 11);

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          opacity: 0.78,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        },
      ).addTo(mapRef.current);

      setTimeout(() => {
        if (mapRef.current) mapRef.current.invalidateSize();
      }, 200);
    }

    return () => {
      if (routingControlRef.current && mapRef.current) {
        try {
          routingControlRef.current.setWaypoints([]);
          mapRef.current.removeControl(routingControlRef.current);
        } catch (error) { }
        routingControlRef.current = null;
      }

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // วาดเส้น วางหมุดอำเภอ และปักหมุดสถานที่บนแผนที่
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // 1. หมุดจุดตรวจระดับอำเภอ
    Object.values(districtMarkersRef.current).forEach((marker) => {
      if (map.hasLayer(marker)) map.removeLayer(marker);
    });
    districtMarkersRef.current = {};

    orderedRouteDetails.forEach((dist, idx) => {
      const rawLatitude = dist.district?.latitude ?? dist.latitude;
      const rawLongitude = dist.district?.longitude ?? dist.longitude;
      const name = dist.district?.districtName ?? dist.districtName;

      if (
        rawLatitude === null ||
        rawLatitude === undefined ||
        rawLongitude === null ||
        rawLongitude === undefined ||
        String(rawLatitude).trim() === "" ||
        String(rawLongitude).trim() === ""
      ) {
        return;
      }

      const latitude = Number(rawLatitude);
      const longitude = Number(rawLongitude);

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < 17.0 ||
        latitude > 20.5 ||
        longitude < 98.0 ||
        longitude > 100.0
      ) {
        return;
      }

      const marker = L.circleMarker([latitude, longitude], {
        radius: 11,
        color: "#ffffff",
        weight: 3,
        fillColor: "#1a2332",
        fillOpacity: 1,
      }).addTo(map).bindPopup(`
            <div style="font-family:'Sarabun',sans-serif; text-align:center; padding:2px;">
              <span style="font-size:11px; color:#64748b; font-weight:bold; display:block;">
                จุดที่ ${idx + 1}
              </span>
              <strong style="font-size:14px; color:#0f172a;">
                อำเภอ${name}
              </strong>
            </div>
          `);

      districtMarkersRef.current[name] = marker;
    });

    // 2. Leaflet Routing Machine
    if (routingControlRef.current) {
      try {
        routingControlRef.current.setWaypoints([]);
        if (map && map.removeControl) {
          map.removeControl(routingControlRef.current);
        }
      } catch (error) { }
      routingControlRef.current = null;
    }

    const waypoints = orderedRouteDetails
      .map((district) => {
        const rawLatitude = district.district?.latitude ?? district.latitude;
        const rawLongitude = district.district?.longitude ?? district.longitude;

        if (
          rawLatitude === null ||
          rawLatitude === undefined ||
          rawLongitude === null ||
          rawLongitude === undefined ||
          String(rawLatitude).trim() === "" ||
          String(rawLongitude).trim() === ""
        ) {
          return null;
        }

        const latitude = Number(rawLatitude);
        const longitude = Number(rawLongitude);

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude) ||
          latitude < 17.0 ||
          latitude > 20.5 ||
          longitude < 98.0 ||
          longitude > 100.0
        ) {
          return null;
        }

        return L.latLng(latitude, longitude);
      })
      .filter(Boolean);

    if (waypoints.length >= 2 && map) {
      try {
        routingControlRef.current = L.Routing.control({
          waypoints: waypoints,
          router: L.Routing.osrmv1({
            serviceUrl: "https://router.project-osrm.org/route/v1",
          }),
          lineOptions: {
            styles: [
              {
                color: "#000000",
                weight: 7,
                opacity: 0.9,
              },
              {
                color: "#147D72",
                weight: 4,
                opacity: 1,
              },
            ],
          },
          createMarker: () => null,
          show: false,
          addWaypoints: false,
          draggableWaypoints: false,
          fitSelectedRoutes: false,
        }).addTo(map);
      } catch (err) {
        console.error("ขัดข้องในการวาดเส้นถนน", err);
      }
    }

    if (waypoints.length > 0) {
      try {
        map.fitBounds(L.latLngBounds(waypoints), {
          padding: [40, 40],
        });
      } catch (error) { }
    }

    // 3. หมุดสถานประกอบการ
    Object.values(placeMarkersRef.current).forEach((marker) => {
      if (map.hasLayer(marker)) map.removeLayer(marker);
    });
    placeMarkersRef.current = {};

    if (orderedRouteDetails.length > 0) {
      const activeDistrictIds = orderedRouteDetails.map((district) =>
        String(district.district?.districtId ?? district.districtId),
      );

      const matchedHubs = wellnessHubs.filter((hub) => {
        const hubDistId =
          hub.district?.districtId !== null &&
            hub.district?.districtId !== undefined
            ? String(hub.district.districtId)
            : null;

        const hubCatId =
          hub.category?.categoryId !== null &&
            hub.category?.categoryId !== undefined
            ? String(hub.category.categoryId)
            : null;

        const catName = hub.category?.categoryName || "";
        const style = getCategoryStyle(hubCatId, catName);
        const isEmergency =
          style.isEmergency ||
          REQUIRED_EMERGENCY_CATEGORY_IDS.includes(String(hubCatId));

        return (
          activeDistrictIds.includes(hubDistId) &&
          !isEmergency &&
          selectedCategoryIds.includes(String(hubCatId)) &&
          isValidHubForMap(hub)
        );
      });

      matchedHubs.forEach((hub) => {
        const latitude = Number(hub.wellnessHubLatitude);
        const longitude = Number(hub.wellnessHubLongitude);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return;
        }

        const catId = hub.category?.categoryId || "";
        const catName = hub.category?.categoryName || "";
        const styleInfo = getCategoryStyle(catId, catName);

        const customIcon = getCategoryMarkerIcon(catId || catName, [32, 44]);

        const popupHtml = `
            <div style="font-family:'Sarabun',sans-serif; padding:2px; min-width:140px;">
              <strong style="font-size:13px; color:#111; display:block; margin-bottom:4px;">
                ${hub.wellnessHubName}
              </strong>

              <span style="font-size:11px; color:#666; display:block;">
                อ.${hub.district?.districtName || hub.districtName || ""}
              </span>

              <span style="font-size:12px; color:${styleInfo.color}; font-weight:bold; display:block; margin-top:4px;">
                ${catName || styleInfo.label}
              </span>
            </div>
          `;

        placeMarkersRef.current[hub.licenseId] = L.marker(
          [latitude, longitude],
          { icon: customIcon },
        )
          .addTo(map)
          .bindPopup(popupHtml);
      });
    }
  }, [orderedRouteDetails, selectedCategoryIds, wellnessHubs]);

  const handleLogout = () => {
    if (window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
      localStorage.removeItem("adminName");
      navigate("/admin/login");
    }
  };

  const getCountForCategory = (catId) => {
    const activeDistrictIds = orderedRouteDetails.map((district) =>
      String(district.district?.districtId ?? district.districtId),
    );

    return wellnessHubs.filter((hub) => {
      const hubDistId =
        hub.district?.districtId !== null &&
          hub.district?.districtId !== undefined
          ? String(hub.district.districtId)
          : null;

      const hubCatId =
        hub.category?.categoryId !== null &&
          hub.category?.categoryId !== undefined
          ? String(hub.category.categoryId)
          : null;

      return (
        activeDistrictIds.includes(hubDistId) &&
        String(hubCatId) === String(catId) &&
        isValidHubForMap(hub)
      );
    }).length;
  };

  const getCountForDistrict = (districtId) => {
    return wellnessHubs.filter((hub) => {
      const hubDistId =
        hub.district?.districtId !== null &&
          hub.district?.districtId !== undefined
          ? String(hub.district.districtId)
          : null;

      const hubCatId =
        hub.category?.categoryId !== null &&
          hub.category?.categoryId !== undefined
          ? String(hub.category.categoryId)
          : null;

      const catName = hub.category?.categoryName || "";
      const style = getCategoryStyle(hubCatId, catName);
      const isEmergency =
        style.isEmergency ||
        REQUIRED_EMERGENCY_CATEGORY_IDS.includes(String(hubCatId));

      return (
        String(hubDistId) === String(districtId) &&
        !isEmergency &&
        selectedCategoryIds.includes(String(hubCatId)) &&
        isValidHubForMap(hub)
      );
    }).length;
  };

  const getTotalPinsCount = () => {
    const activeDistrictIds = orderedRouteDetails.map((district) =>
      String(district.district?.districtId ?? district.districtId),
    );

    return wellnessHubs.filter((hub) => {
      const hubDistId =
        hub.district?.districtId !== null &&
          hub.district?.districtId !== undefined
          ? String(hub.district.districtId)
          : null;

      const hubCatId =
        hub.category?.categoryId !== null &&
          hub.category?.categoryId !== undefined
          ? String(hub.category.categoryId)
          : null;

      const catName = hub.category?.categoryName || "";
      const style = getCategoryStyle(hubCatId, catName);
      const isEmergency =
        style.isEmergency ||
        REQUIRED_EMERGENCY_CATEGORY_IDS.includes(String(hubCatId));

      return (
        activeDistrictIds.includes(hubDistId) &&
        !isEmergency &&
        selectedCategoryIds.includes(String(hubCatId)) &&
        isValidHubForMap(hub)
      );
    }).length;
  };

  const selectedCategories = categories.filter((category) => {
    const categoryId = String(category.categoryId);
    const catName = category.categoryName || "";
    const style = getCategoryStyle(categoryId, catName);
    const isEmergency =
      style.isEmergency ||
      REQUIRED_EMERGENCY_CATEGORY_IDS.includes(categoryId);

    return (
      !isEmergency &&
      selectedCategoryIds.includes(categoryId)
    );
  });

  const handleCategoryToggle = (catId) => {
    const normalizedCategoryId = String(catId);
    if (REQUIRED_EMERGENCY_CATEGORY_IDS.includes(normalizedCategoryId)) return;

    setSelectedCategoryIds((previousCategoryIds) => {
      if (previousCategoryIds.includes(normalizedCategoryId)) {
        return previousCategoryIds.filter(
          (categoryId) => categoryId !== normalizedCategoryId,
        );
      }
      return [...previousCategoryIds, normalizedCategoryId];
    });

    if (errors.categories) {
      setErrors((previousErrors) => ({
        ...previousErrors,
        categories: "",
      }));
    }
  };

  const handleAddDistrictToOrderList = () => {
    if (!selectDistrictValue) return;

    const isDuplicate = orderedRouteDetails.some(
      (district) =>
        String(district.district?.districtId ?? district.districtId) ===
        String(selectDistrictValue),
    );

    if (isDuplicate) {
      setErrors({
        ...errors,
        orderedDistricts: "อำเภอนี้ถูกจัดอยู่ในลำดับเส้นทางเรียบร้อยแล้ว",
      });
      return;
    }

    const targetDistrict = districts.find(
      (district) => String(district.districtId) === String(selectDistrictValue),
    );

    if (targetDistrict) {
      setOrderedRouteDetails([...orderedRouteDetails, targetDistrict]);
      setSelectDistrictValue("");
      setErrors({
        ...errors,
        orderedDistricts: "",
      });
    }
  };

  const handleMoveOrderStep = (index, direction) => {
    const updated = [...orderedRouteDetails];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= updated.length) return;

    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setOrderedRouteDetails(updated);
  };

  const handleRemoveDistrictFromList = (districtId) => {
    setOrderedRouteDetails(
      orderedRouteDetails.filter(
        (district) =>
          String(district.district?.districtId ?? district.districtId) !==
          String(districtId),
      ),
    );
  };

  // 📍 คำนวณระยะทางรวมของเส้นทางปัจจุบัน (กม.)
  const totalRouteDistance = useMemo(() => {
    return calculateTotalRouteDistance(orderedRouteDetails);
  }, [orderedRouteDetails]);

  // 💡 แนะนำอำเภอถัดไปที่ใกล้ที่สุด (Smart Next District Suggestions)
  const suggestedNextDistricts = useMemo(() => {
    if (orderedRouteDetails.length === 0 || districts.length === 0) return [];

    // ดึงอำเภอล่าสุดที่เป็นปลายเส้นทาง
    const lastDistrict = orderedRouteDetails[orderedRouteDetails.length - 1];
    const lastLat = Number(
      lastDistrict.district?.latitude ?? lastDistrict.latitude,
    );
    const lastLng = Number(
      lastDistrict.district?.longitude ?? lastDistrict.longitude,
    );
    if (!lastLat || !lastLng) return [];

    // ดึงรายการ districtId ที่อยู่ในเส้นทางแล้ว
    const selectedIds = new Set(
      orderedRouteDetails.map((d) =>
        String(d.district?.districtId ?? d.districtId),
      ),
    );

    // คำนวณระยะห่างไปยังอำเภอที่ยังไม่ได้เลือก
    return districts
      .filter(
        (d) =>
          !selectedIds.has(String(d.districtId)) && d.latitude && d.longitude,
      )
      .map((d) => ({
        ...d,
        distanceKm: calculateDistanceKm(
          lastLat,
          lastLng,
          Number(d.latitude),
          Number(d.longitude),
        ),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 4); // แนะนำ 4 อำเภอที่ใกล้ที่สุด
  }, [orderedRouteDetails, districts]);

  // จัดเรียงลำดับเส้นทางอัตโนมัติ (Auto Sort / Optimize Route)
  const handleAutoSortRoute = () => {
    if (orderedRouteDetails.length < 3) {
      setOptimizationFeedback(
        "เลือกอย่างน้อย 3 อำเภอเพื่อจัดเรียงเส้นทางให้มีประสิทธิภาพสูงสุด",
      );
      setTimeout(() => setOptimizationFeedback(""), 3500);
      return;
    }

    const oldDistance = calculateTotalRouteDistance(orderedRouteDetails);
    const optimized = optimizeRouteOrder(orderedRouteDetails);
    const newDistance = calculateTotalRouteDistance(optimized);
    const savedKm = oldDistance - newDistance;

    setOrderedRouteDetails(optimized);
    if (savedKm > 0.5) {
      setOptimizationFeedback(
        `จัดเส้นทางใหม่ ประหยัดระยะทางได้ ~${savedKm.toFixed(1)} กม. (ระยะทางรวม ~${newDistance.toFixed(1)} กม.)`,
      );
    } else {
      setOptimizationFeedback(
        `จัดเรียงตามลำดับที่เหมาะสมเรียบร้อย (~${newDistance.toFixed(1)} กม.)`,
      );
    }
    setTimeout(() => setOptimizationFeedback(""), 4500);
  };

  // ➕ เพิ่มอำเภอที่ระบบแนะนำลงในเส้นทางโดยตรง
  const handleAddSuggestedDistrict = (district) => {
    if (!district) return;
    const targetId = String(district.districtId ?? district.district?.districtId);
    const isDuplicate = orderedRouteDetails.some(
      (d) => String(d.districtId ?? d.district?.districtId) === targetId,
    );
    if (isDuplicate) return;

    setOrderedRouteDetails((prev) => [...prev, district]);
    if (errors.orderedDistricts) {
      setErrors((prev) => ({ ...prev, orderedDistricts: "" }));
    }
  };

  // 🌟 ฟังก์ชันจัดการ Submit Form อัปเดตและบันทึกภาพปก
  const handleSubmitFinalForm = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    const trimmedRouteName = routeName.trim();
    const trimmedDescription = routeDescription.trim();

    // 1. ตรวจสอบจำนวนอำเภอ (อย่างน้อย 2 อำเภอ)
    if (orderedRouteDetails.length < 2) {
      setStatusModal({
        isOpen: true,
        type: "warning",
        title: "กรุณาเลือกอำเภออย่างน้อย 2 อำเภอ",
        message: "กรุณาเลือกอำเภออย่างน้อย 2 อำเภอ",
      });
      return;
    }

    // 2. ตรวจสอบชื่อเส้นทาง: 5-50 ตัวอักษร
    if (!trimmedRouteName || trimmedRouteName.length < 5 || trimmedRouteName.length > 50) {
      setStatusModal({
        isOpen: true,
        type: "warning",
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        message: "กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อเส้นทางความยาว 5–50 ตัวอักษร)",
      });
      return;
    }

    // 3. ตรวจสอบรายละเอียดเส้นทาง: ว่างได้ แต่ถ้ามีต้อง 10–255 ตัวอักษร
    if (trimmedDescription.length > 0 && (trimmedDescription.length < 10 || trimmedDescription.length > 255)) {
      setStatusModal({
        isOpen: true,
        type: "warning",
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        message: "กรุณากรอกข้อมูลให้ครบถ้วน (รายละเอียดเส้นทางความยาว 10–255 ตัวอักษร)",
      });
      return;
    }

    setIsSubmitting(true);
    setStatusModal({
      isOpen: true,
      type: "loading",
      title: id ? "กำลังบันทึกการแก้ไข..." : "กำลังบันทึกข้อมูลเส้นทาง...",
      message: "กรุณารอสักครู่ ระบบกำลังประมวลผลและจัดเก็บข้อมูลเส้นทางสุขภาพ",
    });

    try {
      let finalRouteImage = imageExistingName || "";

      // หากมีการเลือกไฟล์รูปใหม่ ให้ทำการ Upload ก่อนบันทึก
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);

        const uploadResponse = await axiosInstance.post(
          "/api/main-routes/upload-image",
          formData,
        );

        const uploadedFilename = uploadResponse.data?.filename;

        if (!uploadedFilename) {
          setIsSubmitting(false);
          setStatusModal({
            isOpen: true,
            type: "error",
            title: id ? "ไม่สามารถแก้ไขข้อมูลได้" : "บันทึกเส้นทางไม่สำเร็จ",
            message: id
              ? "ไม่สามารถแก้ไขข้อมูลเส้นทางหลักได้ กรุณาลองใหม่อีกครั้ง"
              : "บันทึกเส้นทางไม่สำเร็จ กรุณาลองอีกครั้ง",
          });
          return;
        }

        finalRouteImage = String(uploadedFilename).trim();
      }

      const categoryIdsForSave = mergeRequiredCategories(selectedCategoryIds);

      const finalPayload = {
        routeName: trimmedRouteName,
        routeDescription: trimmedDescription,
        routeImage: finalRouteImage,
        categoryIds: categoryIdsForSave,
        details: orderedRouteDetails.map((dist, idx) => ({
          orderNumber: idx + 1,
          districtId: dist.district?.districtId ?? dist.districtId,
        })),
      };

      if (id) {
        await axiosInstance.put(
          `/api/main-routes/${id}`,
          finalPayload,
        );
        clearMainRouteCache();
        clearDashboardCache();

        setIsSubmitting(false);
        setStatusModal({
          isOpen: true,
          type: "success",
          title: "แก้ไขข้อมูลเส้นทางสำเร็จ",
          message: "ระบบได้บันทึกและปรับปรุงข้อมูลเส้นทางเรียบร้อยแล้ว",
        });
        return;
      }

      await axiosInstance.post(
        "/api/main-routes",
        finalPayload,
      );
      clearMainRouteCache();
      clearDashboardCache();

      setIsSubmitting(false);
      setStatusModal({
        isOpen: true,
        type: "success",
        title: "บันทึกข้อมูลเส้นทางสำเร็จ",
        message: "ระบบได้บันทึกข้อมูลเส้นทางใหม่เรียบร้อยแล้ว",
      });
    } catch (err) {
      console.error("ไม่สามารถบันทึกข้อมูลเส้นทางได้", err);
      setIsSubmitting(false);
      if (id) {
        const is400 = err.response && err.response.status === 400;
        const errorMessage = is400
          ? (err.response?.data?.message || "กรุณากรอกข้อมูลให้ครบถ้วน")
          : "ไม่สามารถแก้ไขข้อมูลเส้นทางหลักได้ กรุณาลองใหม่อีกครั้ง";
        setStatusModal({
          isOpen: true,
          type: is400 ? "warning" : "error",
          title: is400 ? "กรุณากรอกข้อมูลให้ครบถ้วน" : "ไม่สามารถแก้ไขข้อมูลได้",
          message: errorMessage,
        });
      } else {
        const is400 = err.response && err.response.status === 400;
        const errorMessage = is400
          ? (err.response?.data?.message || "กรุณากรอกข้อมูลให้ครบถ้วน")
          : "บันทึกเส้นทางไม่สำเร็จ กรุณาลองอีกครั้ง";
        setStatusModal({
          isOpen: true,
          type: is400 ? "warning" : "error",
          title: is400 ? "กรุณากรอกข้อมูลให้ครบถ้วน" : "บันทึกเส้นทางไม่สำเร็จ",
          message: errorMessage,
        });
      }
    }
  };

  return (
    <div className="gov-admin-layout">
      <AdminSidebar activeMenu="routes" />

      <main className="gov-main-content">
        <div className="gov-header-panel">
          <h2>
            {id
              ? "แก้ไขเส้นทางสุขภาพ (Edit Route)"
              : "เพิ่มเส้นทางสุขภาพใหม่ (Create Route)"}
          </h2>
          <span style={{ fontSize: "13px", color: "#666" }}>
            ระบบบริการจัดการข้อมูลสุขภาพ จังหวัดเชียงใหม่
          </span>
        </div>

        <div className="gov-gis-container">
          <div className="gov-map-panel">
            {/* 📍 ปุ่มลอยมุมขวาบนของแผนที่ สไตล์ Admin สี่เหลี่ยมมุมฉาก */}
            <button
              type="button"
              onClick={() => setShowLegendModal(true)}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                zIndex: 500,
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "7px 14px",
                backgroundColor: "#ffffff",
                color: "#14532d",
                border: "1.5px solid #14532d",
                borderRadius: "0px",
                fontSize: "13px",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
                transition: "all 0.15s ease",
              }}
              title="คำอธิบายสัญลักษณ์หมุด"
            >
              <FontAwesomeIcon icon={faCircleInfo} style={{ color: "#14532d", fontSize: "14px" }} />
              <span>คำอธิบายสัญลักษณ์หมุด</span>
            </button>

            <div id="map" ref={mapContainerRef} className="gov-map-frame"></div>

            {/* สรุปจำนวนหมุด */}
            <div
              className="gov-route-summary-box"
              style={{
                marginTop: "15px",
                padding: "15px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
              }}
            >
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  marginBottom: "10px",
                  color: "#1e293b",
                }}
              >
                สรุปจำนวนหมุดในเส้นทาง
              </h3>

              <table
                style={{
                  width: "100%",
                  fontSize: "13px",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid #cbd5e1",
                      textAlign: "left",
                    }}
                  >
                    <th style={{ paddingBottom: "5px" }}>หมวดหมู่</th>
                    <th style={{ paddingBottom: "5px", textAlign: "right" }}>
                      จำนวนที่พบ
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {selectedCategories.map((category) => (
                    <tr
                      key={category.categoryId}
                      style={{ borderBottom: "1px solid #e2e8f0" }}
                    >
                      <td style={{ padding: "6px 0" }}>
                        {category.categoryName}
                      </td>
                      <td
                        style={{
                          padding: "6px 0",
                          textAlign: "right",
                          fontWeight: "600",
                        }}
                      >
                        {getCountForCategory(category.categoryId)} แห่ง
                      </td>
                    </tr>
                  ))}

                  <tr
                    style={{
                      fontWeight: "bold",
                      color: "#1e293b",
                      borderTop: "2px solid #cbd5e1",
                    }}
                  >
                    <td style={{ paddingTop: "8px" }}>รวมทั้งหมด</td>
                    <td
                      style={{
                        paddingTop: "8px",
                        textAlign: "right",
                        color: "#2563eb",
                      }}
                    >
                      {getTotalPinsCount()} แห่ง
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="gov-form-panel">
            <form onSubmit={handleSubmitFinalForm}>
              <div className="gov-form-group">
                <label className="gov-label-bold">ชื่อเส้นทางสุขภาพ*</label>
                <input
                  type="text"
                  maxLength={50}
                  className={`gov-input-text ${errors.routeName ? "gov-input-border-error" : ""
                    }`}
                  value={routeName}
                  onChange={(event) => setRouteName(event.target.value)}
                  placeholder="ระบุชื่อเส้นทาง เช่น กินนวดสบาย พร้าว - แม่ริม - เมือง"
                />
                <span className="gov-char-counter">
                  {routeName.length}/50
                </span>
                {errors.routeName && (
                  <span className="gov-error-label">{errors.routeName}</span>
                )}
              </div>

              <div className="gov-form-group">
                <label className="gov-label-bold">รายละเอียดเส้นทาง</label>
                <textarea
                  maxLength={255}
                  className="gov-input-text"
                  style={{
                    minHeight: "80px",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                  value={routeDescription}
                  onChange={(event) => setRouteDescription(event.target.value)}
                  placeholder="ระบุรายละเอียดเพิ่มเติม หรือคำแนะนำของเส้นทางสุขภาพหลักนี้..."
                />
                <span className="gov-char-counter">
                  {routeDescription.length}/255
                </span>
              </div>

              {/* SECTION 1: ลำดับอำเภอที่ผ่าน */}
              <div className="gov-form-group">
                <div className="gov-section-title-row">
                  <label className="gov-label-bold" style={{ margin: 0 }}>
                    1. ลำดับอำเภอที่ผ่าน (Route Track)*
                  </label>
                  {orderedRouteDetails.length >= 2 && (
                    <span className="gov-route-distance-badge">
                      <i className="fa-solid fa-route"></i> ระยะทางรวม ~{totalRouteDistance.toFixed(1)} กม.
                    </span>
                  )}
                </div>

                <div className="gov-district-selector-block">
                  <select
                    className="gov-dropdown-select"
                    value={selectDistrictValue}
                    onChange={(event) =>
                      setSelectDistrictValue(event.target.value)
                    }
                  >
                    <option value="">-- เลือกรายการอำเภอหลัก --</option>
                    {districts.map((district) => (
                      <option
                        key={district.districtId}
                        value={String(district.districtId)}
                      >
                        อ.{district.districtName}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="gov-btn-add-item"
                    onClick={handleAddDistrictToOrderList}
                  >
                    เพิ่ม
                  </button>
                </div>

                {/* แถบแนะนำอำเภอถัดไป (Smart Next District Suggestions) */}
                {suggestedNextDistricts.length > 0 && (
                  <div className="gov-suggested-districts-container">
                    <span className="gov-suggested-title">
                      <i className="fa-solid fa-location-arrow"></i> แนะนำอำเภอถัดไปที่ใกล้ที่สุด:
                    </span>
                    <div className="gov-suggested-chips-row">
                      {suggestedNextDistricts.map((d) => (
                        <button
                          key={d.districtId}
                          type="button"
                          className="gov-suggested-chip"
                          onClick={() => handleAddSuggestedDistrict(d)}
                          title={`คลิกเพื่อเพิ่ม อ.${d.districtName} (ระยะทาง ~${d.distanceKm.toFixed(1)} กม.)`}
                        >
                          <span className="gov-chip-name">+ อ.{d.districtName}</span>
                          <span className="gov-chip-dist">(~{d.distanceKm.toFixed(1)} กม.)</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* แถบเครื่องมือช่วยจัดเส้นทาง (Auto Sort) */}
                {orderedRouteDetails.length >= 2 && (
                  <div className="gov-route-optimize-toolbar">
                    <button
                      type="button"
                      className="gov-btn-optimize-sort"
                      onClick={handleAutoSortRoute}
                      title="คำนวณและจัดลำดับอำเภอใหม่อัตโนมัติ เพื่อให้ได้เส้นทางที่สั้นและต่อเนื่องที่สุด"
                    >
                      <i className="fa-solid fa-wand-magic-sparkles"></i> จัดเส้นทางอัตโนมัติ
                    </button>
                  </div>
                )}

                {/* ข้อความ Feedback เมื่อกดจัดเส้นทาง */}
                {optimizationFeedback && (
                  <div className="gov-optimize-feedback-toast">
                    {optimizationFeedback}
                  </div>
                )}

                <div
                  className={`gov-order-list-container ${errors.orderedDistricts ? "gov-input-border-error" : ""
                    }`}
                >
                  {orderedRouteDetails.map((dist, index) => {
                    const currentDistId =
                      dist.district?.districtId ?? dist.districtId;
                    const currentDistName =
                      dist.district?.districtName ?? dist.districtName;
                    const districtHubsCount =
                      getCountForDistrict(currentDistId);

                    return (
                      <div
                        key={currentDistId}
                        className="gov-order-row"
                        style={{ padding: "10px 12px" }}
                      >
                        <div className="gov-order-left">
                          <div className="gov-badge-number">{index + 1}</div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                            }}
                          >
                            <span
                              className="gov-order-name"
                              style={{ fontWeight: "600" }}
                            >
                              อำเภอ{currentDistName}
                            </span>
                            <span
                              style={{
                                fontSize: "11px",
                                color: "#475569",
                                marginTop: "1px",
                              }}
                            >
                              {districtHubsCount} จุดตรวจพบ
                            </span>
                          </div>
                        </div>

                        <div className="gov-order-actions">
                          <button
                            type="button"
                            className="gov-btn-arrow"
                            onClick={() => handleMoveOrderStep(index, -1)}
                            disabled={index === 0}
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            className="gov-btn-arrow"
                            onClick={() => handleMoveOrderStep(index, 1)}
                            disabled={index === orderedRouteDetails.length - 1}
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            className="gov-btn-delete-item-red"
                            onClick={() =>
                              handleRemoveDistrictFromList(currentDistId)
                            }
                          >
                            <i className="fa-solid fa-circle-xmark"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {orderedRouteDetails.length === 0 && (
                    <p
                      style={{
                        textAlign: "center",
                        color: "#888",
                        fontSize: "13px",
                        margin: "15px 0",
                      }}
                    >
                      ยังไม่มีอำเภอถูกจัดอยู่ในโครงสร้างเส้นทาง
                    </p>
                  )}
                </div>

                {errors.orderedDistricts && (
                  <span className="gov-error-label">
                    {errors.orderedDistricts}
                  </span>
                )}
              </div>

              {/* SECTION 2: ประเภทสถานที่ */}
              <div className="gov-form-group">
                <label className="gov-label-bold">
                  2. ประเภทสถานที่ที่จะแสดง (หมุดบนแผนที่)*
                </label>

                <div
                  className={`gov-category-grid ${errors.categories ? "gov-input-border-error" : ""
                    }`}
                >
                  {categories
                    .filter((category) => {
                      const catIdStr = String(category.categoryId);
                      const catName = category.categoryName || "";
                      const styleInfo = getCategoryStyle(catIdStr, catName);
                      return (
                        !REQUIRED_EMERGENCY_CATEGORY_IDS.includes(catIdStr) &&
                        !styleInfo.isEmergency
                      );
                    })
                    .map((category) => {
                      const catIdStr = String(category.categoryId);
                      const styleInfo = getCategoryStyle(
                        category.categoryId,
                        category.categoryName,
                      );
                      const isChecked = selectedCategoryIds.includes(catIdStr);
                      const currentCount = getCountForCategory(
                        category.categoryId,
                      );

                      return (
                        <div
                          key={category.categoryId}
                          className={`gov-category-card ${isChecked ? "gov-selected" : ""
                            }`}
                          onClick={() => handleCategoryToggle(catIdStr)}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            padding: "10px",
                            cursor: "pointer",
                            borderLeft: `4px solid ${styleInfo.color}`,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              width: "100%",
                            }}
                          >
                            <input
                              type="checkbox"
                              className="gov-custom-checkbox"
                              checked={isChecked}
                              readOnly
                            />
                            <span
                              className="gov-category-text"
                              style={{
                                fontWeight: "600",
                                color: "#0f172a",
                              }}
                            >
                              {category.categoryName}
                            </span>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              width: "100%",
                              marginTop: "4px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "11px",
                                color: isChecked ? "#1e3a8a" : "#64748b",
                                marginLeft: "22px",
                              }}
                            >
                              ({currentCount} แห่ง)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {errors.categories && (
                  <span className="gov-error-label">{errors.categories}</span>
                )}
              </div>

              {/* SECTION 3: Image upload for route */}
              <div className="gov-route-image-section">
                <div className="gov-route-image-header">
                  <div>
                    <label className="gov-label-bold">รูปภาพปกเส้นทาง</label>
                    <p className="gov-route-image-description">
                      ใช้เป็นภาพหลักสำหรับแสดงเส้นทางในหน้าเว็บไซต์
                    </p>
                  </div>
                  <span className="gov-route-image-badge">
                    <i className="fa-regular fa-image"></i>
                    รูปปก 1 รูป
                  </span>
                </div>

                <div className="gov-route-image-content">
                  <div className="gov-route-image-preview">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="ตัวอย่างรูปภาพปกเส้นทาง"
                        className="gov-route-image-preview-img"
                      />
                    ) : (
                      <div className="gov-route-image-empty">
                        <div className="gov-route-image-empty-icon">
                          <i className="fa-regular fa-image"></i>
                        </div>
                        <strong>ยังไม่มีรูปภาพ</strong>
                        <span>เลือกรูปเพื่อดูตัวอย่างก่อนบันทึก</span>
                      </div>
                    )}
                  </div>

                  <div className="gov-route-image-actions">
                    <div className="gov-route-image-buttons">
                      <label className="gov-route-image-upload-button">
                        <i className="fa-solid fa-cloud-arrow-up"></i>
                        {imagePreview ? "เปลี่ยนรูปภาพ" : "เลือกรูปภาพ"}
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                          onChange={handleImageChange}
                          hidden
                        />
                      </label>

                      {imagePreview && (
                        <button
                          type="button"
                          className="gov-route-image-remove-button"
                          onClick={removeImage}
                        >
                          <i className="fa-solid fa-trash"></i>
                          ลบรูป
                        </button>
                      )}
                    </div>

                    <p className="gov-route-image-hint">
                      รองรับ JPG, PNG • ขนาดสูงสุด 20 MB
                    </p>

                    {imageFileName && (
                      <div className="gov-route-image-file">
                        <i className="fa-solid fa-paperclip"></i>
                        <span title={imageFileName}>{imageFileName}</span>
                      </div>
                    )}

                    {imageError && (
                      <div className="gov-route-image-error">
                        <i className="fa-solid fa-circle-exclamation"></i>
                        {imageError}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="gov-submit-bar">
                <button
                  type="submit"
                  className="gov-btn-save"
                  disabled={isSubmitting}
                  style={isSubmitting ? { opacity: 0.7, cursor: "not-allowed" } : {}}
                >
                  {isSubmitting ? "กำลังบันทึก..." : (id ? "บันทึกการแก้ไข" : "บันทึกข้อมูลเส้นทาง")}
                </button>

                <Link to="/listMainRoute" className="gov-btn-cancel">
                  ยกเลิก
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* 🏛️ ป๊อปอัปแจ้งเตือนสถานะสำหรับแอดมิน (Admin Status Modal) */}
      <AdminStatusModal
        isOpen={statusModal.isOpen}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        confirmText={statusModal.type === "success" ? "กลับสู่หน้ารายการ" : "ตกลง"}
        cancelText="ปิด"
        isEdit={!!id}
        onConfirm={() => {
          if (statusModal.type === "success") {
            setStatusModal((prev) => ({ ...prev, isOpen: false }));
            navigate("/listMainRoute");
          } else {
            setStatusModal((prev) => ({ ...prev, isOpen: false }));
          }
        }}
        onClose={() => setStatusModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* 📌 ป๊อปอัปคำอธิบายสัญลักษณ์หมุด (Administrative Theme) */}
      {showLegendModal && (
        <div
          onClick={() => setShowLegendModal(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(3px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            boxSizing: "border-box"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "520px",
              maxHeight: "85vh",
              backgroundColor: "#ffffff",
              borderRadius: "0px",
              boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.35)",
              border: "1px solid #333",
              borderTop: "5px solid #14532d",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden"
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#f8fafc"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FontAwesomeIcon icon={faCircleInfo} style={{ color: "#14532d", fontSize: "16px" }} />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#14532d" }}>
                  ความหมายของพิกัดหมุดสัญลักษณ์
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLegendModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  fontSize: "16px",
                  padding: "4px 8px",
                  borderRadius: "0px"
                }}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            {/* Body */}
            <div
              style={{
                padding: "20px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "16px"
              }}
            >
              {/* จุดตรวจสอบอำเภอ */}
              <div>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  จุดตรวจและเส้นทาง
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: "#fafafa", borderRadius: "0px", border: "1px solid #999" }}>
                  <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#1a2332", border: "2px solid #ffffff", boxShadow: "0 0 3px rgba(0,0,0,0.3)", display: "inline-block" }} />
                  <span style={{ fontSize: "13.5px", color: "#333", fontWeight: "500" }}>จุดตรวจสอบระดับอำเภอ</span>
                </div>
              </div>

              {/* หมวดหมู่สถานประกอบการ */}
              <div>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  หมวดหมู่สถานประกอบการเพื่อสุขภาพ
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: "#fafafa", borderRadius: "0px", border: "1px solid #999" }}>
                    <span style={{ width: "14px", height: "14px", borderRadius: "50%", background: "#E02873", display: "inline-block", flexShrink: 0 }} />
                    <span style={{ fontSize: "13.5px", color: "#333" }}>นวด/สปาเพื่อสุขภาพ (C01)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: "#fafafa", borderRadius: "0px", border: "1px solid #999" }}>
                    <span style={{ width: "14px", height: "14px", borderRadius: "50%", background: "#0B7D31", display: "inline-block", flexShrink: 0 }} />
                    <span style={{ fontSize: "13.5px", color: "#333" }}>อาหารและเครื่องดื่ม (C03)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: "#fafafa", borderRadius: "0px", border: "1px solid #999" }}>
                    <span style={{ width: "14px", height: "14px", borderRadius: "50%", background: "#5E27AB", display: "inline-block", flexShrink: 0 }} />
                    <span style={{ fontSize: "13.5px", color: "#333" }}>ที่พักฟื้นฟูสุขภาพ (C04)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: "#fafafa", borderRadius: "0px", border: "1px solid #999" }}>
                    <span style={{ width: "14px", height: "14px", borderRadius: "50%", background: "#004CB4", display: "inline-block", flexShrink: 0 }} />
                    <span style={{ fontSize: "13.5px", color: "#333" }}>คลินิก/สถานพยาบาล (C02)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: "#fafafa", borderRadius: "0px", border: "1px solid #999" }}>
                    <span style={{ width: "14px", height: "14px", borderRadius: "50%", background: "#009BB0", display: "inline-block", flexShrink: 0 }} />
                    <span style={{ fontSize: "13.5px", color: "#333" }}>สถานที่ท่องเที่ยว (C05)</span>
                  </div>
                </div>
              </div>


            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateMainRoute;
