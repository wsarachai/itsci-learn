import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import axios from "axios";
import L from "leaflet";
import "leaflet-routing-machine";
import {
  CircleAlert,
  RefreshCw,
  ArrowLeft,
  Info,
  Store,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import LoadingState from "../../Components/LoadingState/LoadingState";
import {
  getCategoryMarkerIcon,
  getCategoryMarkerImage,
} from "../../utils/categoryMarkerIcons";
import RouteHeroHeader from "./components/RouteHeroHeader";
import RouteMapToolbar from "./components/RouteMapToolbar";
import RouteHubCard from "./components/RouteHubCard";
import MapLegendModal from "./components/MapLegendModal";
import "./RouteDetail.css";

const API_BASE_URL = "/api";
const DEFAULT_CENTER = [18.7883, 98.9853];

export const SKY_DOCTOR_HUBS = [
  {
    licenseId: "SKYDOC-INTHANON-01",
    wellnessHubId: "SKYDOC-INTHANON-01",
    wellnessHubName: "จุดประสานการแพทย์ฉุกเฉินทางอากาศ (Sky Doctor) ยอดดอยอินทนนท์",
    districtName: "จอมทอง",
    address: "สถานีรายงานดอยอินทนนท์ กองทัพอากาศ ต.บ้านหลวง อ.จอมทอง จ.เชียงใหม่",
    wellnessHubLatitude: 18.5900577,
    wellnessHubLongitude: 98.4866806,
    telInformation: "1669, 053-286728",
    contactInformation: "ศูนย์กู้ชีพนเรนทร เชียงใหม่ / รพ.มหาราชนครเชียงใหม่",
    wellnessHubDescription: "ลานจอดเฮลิคอปเตอร์กู้ชีพฉุกเฉินทางอากาศ (Sky Doctor) ยอดดอยอินทนนท์ รองรับการลำเลียงผู้ป่วยวิกฤตบนดอยสูงส่งต่อ รพ.ศูนย์",
    googleMapsLink: "https://www.google.com/maps/place/18.5900577,98.4866806",
    isSkyDoctor: true,
    categoryKey: "SKY_DOCTOR",
    categoryName: "Sky Doctor (แพทย์ฉุกเฉินทางอากาศ)",
    status: "ACTIVE",
  },
  {
    licenseId: "SKYDOC-KIWFIN-02",
    wellnessHubId: "SKYDOC-KIWFIN-02",
    wellnessHubName: "จุดประสานการแพทย์ฉุกเฉินทางอากาศ (Sky Doctor) กิ่วฝิ่น",
    districtName: "แม่ออน",
    address: "หน่วยพิทักษ์อุทยานแห่งชาติแจ้ซ้อน (กิ่วฝิ่น) อ.แม่ออน จ.เชียงใหม่ / อ.เมืองปาน จ.ลำปาง",
    wellnessHubLatitude: 18.8687500,
    wellnessHubLongitude: 99.3512300,
    telInformation: "1669, 089-8513355",
    contactInformation: "ศูนย์รับแจ้งเหตุและสั่งการการแพทย์ฉุกเฉิน 1669",
    wellnessHubDescription: "จุดประสานและลานรับ-ส่งต่อผู้ป่วยฉุกเฉินทางอากาศแนวสันเขา กิ่วฝิ่น-แม่กำปอง เพื่อลดระยะเวลาส่งต่อโรงพยาบาลจากเส้นทางเขาสูงชัน",
    googleMapsLink: "https://www.google.com/maps/place/18.8687500,99.3512300",
    isSkyDoctor: true,
    categoryKey: "SKY_DOCTOR",
    categoryName: "Sky Doctor (แพทย์ฉุกเฉินทางอากาศ)",
    status: "ACTIVE",
  },
];

export const MASTER_CATEGORIES = [
  { id: "SPA", name: "นวด/สปาเพื่อสุขภาพ", color: "#E02873", icon: "fa-spa" },
  { id: "RESTAURANT", name: "อาหารและเครื่องดื่ม", color: "#0B7D31", icon: "fa-utensils" },
  { id: "HOTEL", name: "ที่พักฟื้นฟูสุขภาพ", color: "#5E27AB", icon: "fa-bed" },
  { id: "CLINIC", name: "คลินิก/สถานพยาบาล", color: "#004CB4", icon: "fa-notes-medical" },
  { id: "ATTRACTION", name: "สถานที่ท่องเที่ยว", color: "#009BB0", icon: "fa-map-location-dot" },
  { id: "SKY_DOCTOR", name: "Sky Doctor (แพทย์ฉุกเฉินทางอากาศ)", color: "#E11D48", icon: "fa-helicopter", alwaysVisible: true },
  { id: "HOSPITAL", name: "โรงพยาบาล (ALS)", color: "#BD0915", icon: "fa-hospital", alwaysVisible: true },
  { id: "RESCUE", name: "หน่วยกู้ภัย (BLS)", color: "#C98600", icon: "fa-truck-medical", alwaysVisible: true },
];

export function getCategoryStyle(categoryId = "") {
  const normalizedId = String(categoryId || "").trim().toUpperCase();

  if (normalizedId.includes("SKY") || normalizedId.includes("DOCTOR") || normalizedId.includes("ฮ.") || normalizedId.includes("แพทย์ฉุกเฉิน")) {
    return { name: "Sky Doctor (แพทย์ฉุกเฉินทางอากาศ)", color: "#E11D48" };
  }
  if (normalizedId.includes("C01") || normalizedId.includes("SPA") || normalizedId.includes("MASSAGE") || normalizedId.includes("นวด") || normalizedId.includes("สปา")) {
    return { name: "นวด/สปาเพื่อสุขภาพ", color: "#E02873" };
  }
  if (normalizedId.includes("C03") || normalizedId.includes("REST") || normalizedId.includes("FOOD") || normalizedId.includes("อาหาร")) {
    return { name: "อาหารและเครื่องดื่ม", color: "#0B7D31" };
  }
  if (normalizedId.includes("C04") || normalizedId.includes("HOTEL") || normalizedId.includes("ACCOM") || normalizedId.includes("ที่พัก")) {
    return { name: "ที่พักฟื้นฟูสุขภาพ", color: "#5E27AB" };
  }
  if (normalizedId.includes("C02") || normalizedId.includes("CLINIC") || normalizedId.includes("คลินิก")) {
    return { name: "คลินิก/สถานพยาบาล", color: "#004CB4" };
  }
  if (normalizedId.includes("C05") || normalizedId.includes("ATTRACTION") || normalizedId.includes("TOURIS") || normalizedId.includes("TOURISM") || normalizedId.includes("TOURIST") || normalizedId.includes("TRAVEL") || normalizedId.includes("ท่องเที่ยว")) {
    return { name: "สถานที่ท่องเที่ยว", color: "#009BB0" };
  }
  if (normalizedId.includes("EM02") || normalizedId.includes("HOSPITAL") || normalizedId.includes("โรงพยาบาล") || normalizedId.includes("ALS") || normalizedId.includes("ADVANCED")) {
    return { name: "โรงพยาบาล (ALS)", color: "#BD0915" };
  }
  if (normalizedId.includes("EM01") || normalizedId.includes("RESCUE") || normalizedId.includes("กู้ภัย") || normalizedId.includes("BLS") || normalizedId.includes("BASIC")) {
    return { name: "หน่วยกู้ภัย (BLS)", color: "#C98600" };
  }

  return { name: "อื่นๆ", color: "#64748B" };
}

function extractLatLng(item) {
  if (!item) return null;

  const lat = item.latitude ?? item.district?.latitude ?? item.wellnessHubLatitude ?? item.lat;
  const lng = item.longitude ?? item.district?.longitude ?? item.wellnessHubLongitude ?? item.lng;

  if (lat == null || lng == null || String(lat).trim() === "" || String(lng).trim() === "") {
    return null;
  }

  const parsedLat = Number(lat);
  const parsedLng = Number(lng);

  if (
    !Number.isFinite(parsedLat) ||
    !Number.isFinite(parsedLng) ||
    parsedLat < 17.0 ||
    parsedLat > 20.5 ||
    parsedLng < 98.0 ||
    parsedLng > 100.0
  ) {
    return null;
  }

  return { lat: parsedLat, lng: parsedLng };
}

function isMapReady(map, container) {
  if (!map || !container || !container.isConnected) return false;
  try {
    return map.getContainer?.() === container && Boolean(map._loaded) && Boolean(map._mapPane);
  } catch {
    return false;
  }
}

function hasValue(value) {
  if (value === null || value === undefined) return false;
  const text = String(value).trim();
  return text !== "" && text !== "#ERROR!" && text !== "undefined" && text !== "null";
}

function isValidHubForMap(hub) {
  if (!hub) return false;

  // 1. สถานะเปิดทำการ (ACTIVE) เท่านั้น
  const status = hub.status ? String(hub.status).trim().toLowerCase() : "active";
  if (status !== "active" && status !== "เปิดใช้งาน") {
    return false;
  }

  // 2. ต้องมีพิกัด ละติจูด และ ลองติจูด ที่ถูกต้อง (มีหมุดบนแผนที่)
  const coords = extractLatLng(hub);
  if (!coords || (coords.lat === 0 && coords.lng === 0)) {
    return false;
  }

  // 3. ดักเหมือนกันทั้งสถานประกอบการและจุดฉุกเฉิน: ลิงก์ Google Maps ต้องไม่ null และไม่เป็น #
  const link = hub.googleMapsLink ? String(hub.googleMapsLink).trim() : "";
  if (!link || link === "#" || link.startsWith("#") || link.toLowerCase() === "null" || link.toLowerCase() === "undefined") {
    return false;
  }

  return true;
}

function isSkyDoctorHub(item) {
  if (!item) return false;
  const nameUpper = String(item.wellnessHubName || item.name || "").toUpperCase();
  const licenseUpper = String(item.licenseId || item.wellnessHubId || "").toUpperCase();
  const catKeyUpper = String(
    item.categoryKey ||
    item.categoryName ||
    item.categoryId ||
    item.category?.categoryId ||
    item.category?.categoryName ||
    ""
  ).toUpperCase();

  return (
    Boolean(item.isSkyDoctor) ||
    catKeyUpper.includes("SKY") ||
    catKeyUpper.includes("DOCTOR") ||
    catKeyUpper.includes("ฮ.") ||
    nameUpper.includes("SKY DOCTOR") ||
    nameUpper.includes("SKYDOCTOR") ||
    nameUpper.includes("สกายด็อกเตอร์") ||
    nameUpper.includes("การแพทย์ฉุกเฉินทางอากาศ") ||
    licenseUpper.includes("SKYDOC")
  );
}

function normalizeImageSource(imageValue) {
  if (!hasValue(imageValue)) return "";
  let normalizedValue = imageValue;
  if (typeof normalizedValue === "string") {
    const trimmedValue = normalizedValue.trim();
    try {
      const parsedValue = JSON.parse(trimmedValue);
      normalizedValue = Array.isArray(parsedValue) ? parsedValue[0] || "" : trimmedValue;
    } catch {
      normalizedValue = trimmedValue;
    }
  }

  if (Array.isArray(normalizedValue)) {
    normalizedValue = normalizedValue[0] || "";
  }

  if (!hasValue(normalizedValue)) return "";
  const imageSource = String(normalizedValue).trim();

  if (
    imageSource.startsWith("data:image/") ||
    imageSource.startsWith("http://") ||
    imageSource.startsWith("https://") ||
    imageSource.startsWith("blob:")
  ) {
    return imageSource;
  }

  if (/^[A-Za-z0-9+/=\s]+$/.test(imageSource)) {
    return `data:image/jpeg;base64,${imageSource}`;
  }

  return imageSource;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// -----------------------------------------------------------------------------
// ระบบ Cache และวาดเส้นทางสีเขียวเชื่อมอำเภอ 0ms (Instant Preview + Cache + OSRM)
// -----------------------------------------------------------------------------
const routeGeometryMemoryCache = new Map();

function getCachedRouteGeometry(cacheKey) {
  if (!cacheKey) return null;
  if (routeGeometryMemoryCache.has(cacheKey)) {
    return routeGeometryMemoryCache.get(cacheKey);
  }
  try {
    const raw = sessionStorage.getItem(`cm_route_geom_${cacheKey}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 2) {
        routeGeometryMemoryCache.set(cacheKey, parsed);
        return parsed;
      }
    }
  } catch { }
  return null;
}

function setCachedRouteGeometry(cacheKey, coordinates) {
  if (!cacheKey || !Array.isArray(coordinates) || coordinates.length < 2) return;
  routeGeometryMemoryCache.set(cacheKey, coordinates);
  try {
    sessionStorage.setItem(`cm_route_geom_${cacheKey}`, JSON.stringify(coordinates));
  } catch { }
}

function renderRouteLine(layerGroup, latlngs) {
  if (!layerGroup || !Array.isArray(latlngs) || latlngs.length < 2) return;
  layerGroup.clearLayers();

  // 1. เส้นขอบเงาสีดำ (Outline / Shadow)
  L.polyline(latlngs, {
    color: "#000000",
    weight: 7,
    opacity: 0.85,
    lineCap: "round",
    lineJoin: "round",
  }).addTo(layerGroup);

  // 2. เส้นทางหลักสีเขียวเข้ม (#147D72)
  L.polyline(latlngs, {
    color: "#147D72",
    weight: 4,
    opacity: 1,
    lineCap: "round",
    lineJoin: "round",
  }).addTo(layerGroup);
}

export default function RouteDetail() {
  const { routeId } = useParams();
  const navigate = useNavigate();

  const normalizedRouteId = Number(routeId);

  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [isEditingDistricts, setIsEditingDistricts] = useState(false);
  const [visibleDistrictIds, setVisibleDistrictIds] = useState([]);
  const [isControlCollapsed, setIsControlCollapsed] = useState(false);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [emergencyServicesList, setEmergencyServicesList] = useState([]);
  const [showLegendModal, setShowLegendModal] = useState(false);

  // ดึงข้อมูล Emergency Services และ Sky Doctor สดจาก API จริง
  useEffect(() => {
    let isMounted = true;
    const fetchEmergency = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/emergency-services`);
        if (isMounted && Array.isArray(res.data) && res.data.length > 0) {
          setEmergencyServicesList(res.data);
        }
      } catch (err) {
        console.warn("Could not fetch emergency services from API:", err);
      }
    };
    fetchEmergency();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      const timer = setTimeout(() => {
        try {
          mapRef.current.invalidateSize();
        } catch { }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isControlCollapsed]);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const routeLineLayerRef = useRef(null);
  const hubsLayerRef = useRef(null);
  const districtLayerRef = useRef(null);
  const routingControlRef = useRef(null);
  const routeBoundsRef = useRef(null);
  const hubMarkersRef = useRef(new Map());
  const hubHighlightRef = useRef(null);

  const getCategoryInfo = useCallback((hub) => {
    if (!hub) {
      return { id: "OTHER", name: "อื่นๆ", color: "#64748B", icon: "fa-location-dot" };
    }

    if (isSkyDoctorHub(hub)) {
      return MASTER_CATEGORIES.find((c) => c.id === "SKY_DOCTOR");
    }

    const catKey = String(
      hub.categoryKey ||
      hub.categoryName ||
      hub.categoryId ||
      hub.category?.categoryId ||
      hub.category?.categoryName ||
      ""
    ).toUpperCase();

    if (catKey.includes("EM02") || catKey.includes("HOSPITAL") || catKey.includes("โรงพยาบาล") || catKey.includes("ALS")) {
      return MASTER_CATEGORIES.find((c) => c.id === "HOSPITAL");
    }
    if (catKey.includes("EM01") || catKey.includes("RESCUE") || catKey.includes("กู้ภัย") || catKey.includes("BLS")) {
      return MASTER_CATEGORIES.find((c) => c.id === "RESCUE");
    }
    if (catKey.includes("C01") || catKey.includes("SPA") || catKey.includes("MASSAGE") || catKey.includes("นวด") || catKey.includes("สปา")) {
      return MASTER_CATEGORIES.find((c) => c.id === "SPA");
    }
    if (catKey.includes("C03") || catKey.includes("REST") || catKey.includes("FOOD") || catKey.includes("อาหาร")) {
      return MASTER_CATEGORIES.find((c) => c.id === "RESTAURANT");
    }
    if (catKey.includes("C04") || catKey.includes("HOTEL") || catKey.includes("ACCOM") || catKey.includes("ที่พัก")) {
      return MASTER_CATEGORIES.find((c) => c.id === "HOTEL");
    }
    if (catKey.includes("C02") || catKey.includes("CLINIC") || catKey.includes("คลินิก")) {
      return MASTER_CATEGORIES.find((c) => c.id === "CLINIC");
    }
    if (catKey.includes("C05") || catKey.includes("ATTRACTION") || catKey.includes("TOURIS") || catKey.includes("TOURISM") || catKey.includes("TOURIST") || catKey.includes("TRAVEL") || catKey.includes("ท่องเที่ยว")) {
      return MASTER_CATEGORIES.find((c) => c.id === "ATTRACTION");
    }

    return {
      id: "OTHER",
      name: hub.categoryName || "อื่นๆ",
      color: "#64748B",
      icon: "fa-location-dot",
    };
  }, []);

  const wellnessHubs = useMemo(() => {
    const rawHubs = Array.isArray(routeData?.wellnessHubs) ? [...routeData.wellnessHubs] : [];

    // รวมข้อมูล Emergency Services (โรงพยาบาล/หน่วยกู้ภัย) จาก emergencyServicesList เข้ามาในเส้นทางด้วย หากยังไม่มีใน rawHubs
    if (Array.isArray(emergencyServicesList) && emergencyServicesList.length > 0) {
      emergencyServicesList.forEach((em) => {
        if (isSkyDoctorHub(em)) return; // Sky Doctor จัดการแยกในโหมด SOS / Emergency
        const key = String(em.licenseId || em.wellnessHubId || "");
        const alreadyExists = rawHubs.some(
          (h) => String(h.licenseId || h.wellnessHubId || "") === key
        );
        if (!alreadyExists) {
          rawHubs.push({
            ...em,
            wellnessHubId: em.licenseId,
            wellnessHubName: em.wellnessHubName || em.name,
            wellnessHubLatitude: em.wellnessHubLatitude ?? em.latitude,
            wellnessHubLongitude: em.wellnessHubLongitude ?? em.longitude,
            googleMapsLink: em.googleMapsLink || em.google_maps_link || em.mapUrl || em.map_url,
            isSkyDoctor: false,
            categoryKey:
              em.categoryKey ||
              (String(em.categoryId || "").toUpperCase() === "EM01" ? "RESCUE" : "HOSPITAL"),
          });
        }
      });
    }

    return rawHubs.filter(isValidHubForMap);
  }, [routeData, emergencyServicesList]);

  const availableCategories = useMemo(() => {
    const foundCategoryIds = new Set();

    // 1. ดึงหมวดหมู่ที่ถูกบันทึกไว้กับเส้นทางในฐานข้อมูล
    if (Array.isArray(routeData?.categories)) {
      routeData.categories.forEach((cat) => {
        const info = getCategoryInfo(cat);
        if (info?.id && info.id !== "OTHER" && info.id !== "SKY_DOCTOR") {
          foundCategoryIds.add(info.id);
        }
      });
    }

    // 2. รวมหมวดหมู่ที่มีสถานประกอบการอยู่จริงใน wellnessHubs
    wellnessHubs.forEach((hub) => {
      if (isSkyDoctorHub(hub)) return;
      const info = getCategoryInfo(hub);
      if (info?.id && info.id !== "OTHER" && info.id !== "SKY_DOCTOR") {
        foundCategoryIds.add(info.id);
      }
    });

    return MASTER_CATEGORIES.filter((cat) => foundCategoryIds.has(cat.id));
  }, [routeData, wellnessHubs, getCategoryInfo]);

  const loadRouteDetail = useCallback(
    async () => {
      if (!Number.isInteger(normalizedRouteId) || normalizedRouteId <= 0) {
        setRouteData(null);
        setError("รหัสเส้นทางไม่ถูกต้อง");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await axios.get(
          `${API_BASE_URL}/home/routes/${normalizedRouteId}`,
          { timeout: 30000 }
        );

        if (!response.data) {
          setRouteData(null);
          setError("ไม่พบข้อมูลเส้นทางที่ต้องการ");
          return;
        }

        setRouteData(response.data);
      } catch (requestError) {
        setRouteData(null);
        setError(
          requestError.code === "ECONNABORTED"
            ? "โหลดข้อมูลเส้นทางใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง"
            : requestError.response?.data?.message || "ไม่สามารถโหลดรายละเอียดเส้นทางได้"
        );
      } finally {
        setLoading(false);
      }
    },
    [normalizedRouteId]
  );

  useEffect(() => {
    let isMounted = true;
    const fetch = async () => {
      if (isMounted) {
        await loadRouteDetail();
      }
    };
    fetch();

    return () => {
      isMounted = false;
    };
  }, [loadRouteDetail]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [routeId]);

  useEffect(() => {
    if (availableCategories.length > 0) {
      const initialFilters = availableCategories.reduce((acc, cat) => {
        acc[cat.id] = true;
        return acc;
      }, {});
      setActiveFilters(initialFilters);
    }
  }, [availableCategories]);

  const districts = useMemo(() => {
    return Array.isArray(routeData?.districts) ? routeData.districts : [];
  }, [routeData]);

  useEffect(() => {
    if (districts.length > 0) {
      const ids = districts.map((district, idx) =>
        String(district.districtId ?? `district-${idx}`)
      );
      setVisibleDistrictIds(ids);
    } else {
      setVisibleDistrictIds([]);
    }
  }, [districts]);

  const handleToggleDistrictVisibility = (district, idx) => {
    const districtKey = String(district.districtId ?? `district-${idx}`);
    setVisibleDistrictIds((prev) =>
      prev.includes(districtKey)
        ? prev.filter((id) => id !== districtKey)
        : [...prev, districtKey]
    );
  };

  const visibleDistricts = useMemo(() => {
    if (districts.length === 0) return [];
    return districts.filter((d, idx) =>
      visibleDistrictIds.includes(String(d.districtId ?? `district-${idx}`))
    );
  }, [districts, visibleDistrictIds]);

  const visibleWellnessHubs = useMemo(() => {
    if (wellnessHubs.length === 0) return [];
    if (visibleDistricts.length === 0) return [];

    const allowedDistrictIds = new Set(
      visibleDistricts.map((d) => d.districtId).filter(Boolean)
    );
    const allowedDistrictNames = new Set(
      visibleDistricts
        .map((d) => (d.districtName || d.district?.districtName || "").trim().toLowerCase())
        .filter(Boolean)
    );

    return wellnessHubs.filter((hub) => {
      if (isSkyDoctorHub(hub)) return true;
      const hubDistId = hub.districtId || hub.district?.districtId;
      if (hubDistId && allowedDistrictIds.has(hubDistId)) return true;

      const hubDistName = (hub.districtName || hub.district?.districtName || "").trim().toLowerCase();
      if (hubDistName && allowedDistrictNames.has(hubDistName)) return true;

      return false;
    });
  }, [wellnessHubs, visibleDistricts]);

  const displayedWellnessHubs = useMemo(() => {
    if (isEmergencyMode) {
      const routeDistrictNames = new Set(
        districts.map((d) => (d.districtName || d.district?.districtName || "").trim().toLowerCase()).filter(Boolean)
      );
      const routeDistrictIds = new Set(
        districts.map((d) => d.districtId || d.district?.districtId).filter(Boolean)
      );

      const isEmergencyInRouteDistricts = (item) => {
        const dId = item.districtId || item.district?.districtId;
        if (dId && routeDistrictIds.has(dId)) return true;
        const dName = (item.districtName || item.district?.districtName || "").trim().toLowerCase();
        if (dName && routeDistrictNames.has(dName)) return true;
        return false;
      };

      const emergencyFromRoute = wellnessHubs.filter((hub) => {
        const cat = getCategoryInfo(hub);
        const isSkyDoc = isSkyDoctorHub(hub) || cat.id === "SKY_DOCTOR";
        const isEmergency = isSkyDoc || cat.id === "HOSPITAL" || cat.id === "RESCUE";
        return isEmergency && (isSkyDoc || isEmergencyInRouteDistricts(hub));
      });

      const list = [];

      // 1. นำข้อมูล Emergency Services และ Sky Doctor ที่ดึงสดจาก API
      if (Array.isArray(emergencyServicesList) && emergencyServicesList.length > 0) {
        emergencyServicesList.forEach((em) => {
          const isSkyDoc = isSkyDoctorHub(em);
          const mappedItem = {
            ...em,
            wellnessHubId: em.licenseId,
            wellnessHubName: em.wellnessHubName || em.name,
            wellnessHubLatitude: em.wellnessHubLatitude ?? em.latitude,
            wellnessHubLongitude: em.wellnessHubLongitude ?? em.longitude,
            googleMapsLink: em.googleMapsLink || em.google_maps_link || em.mapUrl || em.map_url,
            isSkyDoctor: isSkyDoc,
            categoryKey: isSkyDoc ? "SKY_DOCTOR" : (em.categoryKey || "HOSPITAL"),
          };

          if (isSkyDoc || isEmergencyInRouteDistricts(mappedItem)) {
            list.push(mappedItem);
          }
        });
      }

      // 2. รวมข้อมูลจุดฉุกเฉินที่มีอยู่ในเส้นทางปัจจุบัน (ถ้ายังไม่มีใน list)
      emergencyFromRoute.forEach((eh) => {
        const key = eh.licenseId || eh.wellnessHubId;
        if (!list.some((item) => (item.licenseId || item.wellnessHubId) === key)) {
          list.push(eh);
        }
      });

      // 3. ตรวจสอบให้แน่ใจว่า Sky Doctor ทั้ง 2 แห่ง (กิ่วฝิ่น อ.แม่ออน และ ดอยอินทนนท์ อ.จอมทอง) โผล่ขึ้นมาครบถ้วน
      SKY_DOCTOR_HUBS.forEach((skyHub) => {
        const skyKey = skyHub.licenseId || skyHub.wellnessHubId;
        const exists = list.some((item) => {
          const itemKey = item.licenseId || item.wellnessHubId;
          const itemName = String(item.wellnessHubName || item.name || "").toLowerCase();
          return itemKey === skyKey || (isSkyDoctorHub(item) && (
            (skyHub.districtName && itemName.includes(skyHub.districtName.toLowerCase())) ||
            (skyHub.wellnessHubName && itemName.includes("อินทนนท์") && skyHub.wellnessHubName.includes("อินทนนท์")) ||
            (skyHub.wellnessHubName && itemName.includes("กิ่วฝิ่น") && skyHub.wellnessHubName.includes("กิ่วฝิ่น"))
          ));
        });
        if (!exists) {
          list.push({ ...skyHub, isSkyDoctor: true, categoryKey: "SKY_DOCTOR" });
        }
      });

      // 🌟 ดักฉุกเฉินเหมือนสถานประกอบการ: กรองเฉพาะที่มีพิกัดและลิงก์ Google Maps ที่ถูกต้อง
      const validEmergencyList = list.filter(isValidHubForMap);

      // 🌟 จัดลำดับให้ Sky Doctor (แพทย์ฉุกเฉินทางอากาศ) อยู่บนสุดเสมอ (Top Priority)
      return validEmergencyList.sort((a, b) => {
        const aSky = isSkyDoctorHub(a) ? 1 : 0;
        const bSky = isSkyDoctorHub(b) ? 1 : 0;
        if (bSky !== aSky) return bSky - aSky;

        const aCat = getCategoryInfo(a)?.id;
        const bCat = getCategoryInfo(b)?.id;
        const rank = (id) => (id === "SKY_DOCTOR" ? 0 : id === "HOSPITAL" ? 1 : id === "RESCUE" ? 2 : 3);
        if (rank(aCat) !== rank(bCat)) return rank(aCat) - rank(bCat);

        const nameA = a.wellnessHubName || a.name || "";
        const nameB = b.wellnessHubName || b.name || "";
        return nameA.localeCompare(nameB, "th");
      });
    }

    // 🌟 โหมดปกติ: แสดงสถานประกอบการท่องเที่ยว/เวลเนส และจุดบริการฉุกเฉิน ALS / BLS ที่ถูกเลือก
    return visibleWellnessHubs.filter((hub) => {
      if (!isValidHubForMap(hub)) return false;
      if (isSkyDoctorHub(hub)) return false;
      const cat = getCategoryInfo(hub)?.id;
      if (cat && activeFilters[cat] === false) return false;
      return true;
    });
  }, [
    isEmergencyMode,
    visibleWellnessHubs,
    wellnessHubs,
    emergencyServicesList,
    districts,
    getCategoryInfo,
    activeFilters,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    const mapContainer = mapContainerRef.current;
    if (!map || !mapContainer || !isMapReady(map, mapContainer)) return;

    try {
      if (isEmergencyMode) {
        const emergencyCoords = displayedWellnessHubs
          .map((h) => extractLatLng(h))
          .filter(Boolean)
          .map((c) => L.latLng(c.lat, c.lng));

        if (emergencyCoords.length > 0) {
          const bounds = L.latLngBounds(emergencyCoords);
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12, animate: false });
          }
        }
      } else if (routeBoundsRef.current && routeBoundsRef.current.isValid()) {
        map.fitBounds(routeBoundsRef.current, { padding: [50, 50], animate: false });
      }
    } catch { }
  }, [isEmergencyMode, displayedWellnessHubs]);

  // 🗺️ 1. เริ่มต้นแผนที่ Leaflet (Base Map)
  useEffect(() => {
    const mapContainer = mapContainerRef.current;
    if (!mapContainer || loading || error || !routeData) return;

    if (mapRef.current) {
      try {
        mapRef.current.remove();
      } catch { }
      mapRef.current = null;
    }

    const map = L.map(mapContainer, {
      zoomControl: true,
      attributionControl: true,
      fadeAnimation: false,
    });

    mapRef.current = map;
    map.setView(DEFAULT_CENTER, 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      opacity: 0.78,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    routeLineLayerRef.current = L.layerGroup().addTo(map);
    hubsLayerRef.current = L.layerGroup().addTo(map);
    districtLayerRef.current = L.layerGroup().addTo(map);

    map.on("popupclose", () => {
      if (hubHighlightRef.current) {
        try {
          if (mapRef.current && isMapReady(mapRef.current, mapContainer)) {
            mapRef.current.removeLayer(hubHighlightRef.current);
          }
        } catch { }
        hubHighlightRef.current = null;
      }
    });

    const timer = setTimeout(() => {
      if (mapRef.current === map && isMapReady(map, mapContainer)) {
        map.invalidateSize();
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      hubMarkersRef.current.clear();
      hubHighlightRef.current = null;
      if (routeLineLayerRef.current) {
        try {
          routeLineLayerRef.current.clearLayers();
        } catch { }
        routeLineLayerRef.current = null;
      }
      if (routingControlRef.current) {
        try {
          const ctrl = routingControlRef.current;
          ctrl.off();
          if (ctrl._map) {
            ctrl._map.removeControl(ctrl);
          }
        } catch { }
        routingControlRef.current = null;
      }
      try {
        map.stop();
        map.remove();
      } catch { }
      if (mapRef.current === map) {
        mapRef.current = null;
      }
      if (mapContainer && mapContainer._leaflet_id) {
        delete mapContainer._leaflet_id;
      }
    };
  }, [loading, error, routeData]);

  // 🚗 2. คำนวณเส้นทางสีเขียว 0ms (Instant Preview + Cache + OSRM Background Fetch) และปักหมุดอำเภอ
  useEffect(() => {
    const map = mapRef.current;
    const districtLayer = districtLayerRef.current;
    const routeLineLayer = routeLineLayerRef.current;
    const mapContainer = mapContainerRef.current;

    if (!map || !districtLayer || !mapContainer || !isMapReady(map, mapContainer)) return;

    districtLayer.clearLayers();

    // 1. ปักหมุดศูนย์กลางอำเภอ
    visibleDistricts.forEach((district, index) => {
      const coords = extractLatLng(district);
      if (!coords) return;

      L.circleMarker([coords.lat, coords.lng], {
        radius: 10,
        color: "#ffffff",
        weight: 3,
        fillColor: "#1a2332",
        fillOpacity: 1,
      }).addTo(districtLayer).bindPopup(`
        <div style="font-family:'Sarabun',sans-serif;text-align:center;padding:2px;">
          <span style="font-size:11px;color:#64748b;font-weight:bold;display:block;">
            จุดที่ ${district.orderNumber || index + 1}
          </span>
          <strong style="font-size:14px;color:#0f172a;">
            อำเภอ${district.districtName || district.district?.districtName || ""}
          </strong>
        </div>
      `);
    });

    const waypoints = visibleDistricts
      .map((d) => extractLatLng(d))
      .filter(Boolean);

    if (waypoints.length < 2) {
      if (routeLineLayer) routeLineLayer.clearLayers();
      if (waypoints.length === 1) {
        try {
          routeBoundsRef.current = L.latLngBounds([[waypoints[0].lat, waypoints[0].lng]]);
        } catch {
          routeBoundsRef.current = null;
        }
      } else {
        routeBoundsRef.current = null;
      }
      return;
    }

    const previewLatLngs = waypoints.map((w) => [w.lat, w.lng]);
    try {
      const bounds = L.latLngBounds(previewLatLngs);
      routeBoundsRef.current = bounds.isValid() ? bounds : null;
    } catch {
      routeBoundsRef.current = null;
    }

    const cacheKey = waypoints
      .map((w) => `${Number(w.lat).toFixed(5)},${Number(w.lng).toFixed(5)}`)
      .join(";");

    // 2. ตรวจสอบ Cache (Memory + SessionStorage)
    const cachedGeom = getCachedRouteGeometry(cacheKey);
    if (cachedGeom && cachedGeom.length >= 2) {
      // ⚡ Cache Hit: แสดงผลแนวถนนจริงทันทีใน 0ms
      renderRouteLine(routeLineLayer, cachedGeom);
      return;
    }

    // 3. ⚡ 0ms Instant Preview: วาดเส้นตรงเชื่อมอำเภอก่อนทันที ไม่ต้องรอเซิร์ฟเวอร์
    renderRouteLine(routeLineLayer, previewLatLngs);

    // 4. ดึงแนวถนนจริงจาก OSRM ใน Background อย่างเงียบๆ แล้วค่อยปรับเส้นให้โค้งเว้าตามถนนจริง
    const abortController = new AbortController();
    const coordinatesParam = waypoints
      .map((w) => `${w.lng},${w.lat}`)
      .join(";");
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordinatesParam}?overview=full&geometries=geojson`;

    fetch(osrmUrl, { signal: abortController.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`OSRM status ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (
          data &&
          data.routes &&
          data.routes[0] &&
          data.routes[0].geometry &&
          Array.isArray(data.routes[0].geometry.coordinates)
        ) {
          const roadLatLngs = data.routes[0].geometry.coordinates.map(
            ([lng, lat]) => [lat, lng]
          );
          setCachedRouteGeometry(cacheKey, roadLatLngs);
          if (mapRef.current && routeLineLayerRef.current) {
            renderRouteLine(routeLineLayerRef.current, roadLatLngs);
          }
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.warn("Background OSRM route fetch fallback (kept instant preview):", err);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [visibleDistricts]);

  const removeHubHighlight = useCallback(() => {
    const map = mapRef.current;
    if (hubHighlightRef.current && map) {
      try {
        map.removeLayer(hubHighlightRef.current);
      } catch { }
      hubHighlightRef.current = null;
    }
  }, []);

  const setHubHighlight = useCallback((coords, color) => {
    const map = mapRef.current;
    if (!map || !coords) return;

    if (hubHighlightRef.current) {
      try {
        map.removeLayer(hubHighlightRef.current);
      } catch { }
      hubHighlightRef.current = null;
    }

    const highlight = L.circleMarker([coords.lat, coords.lng], {
      radius: 25,
      color: color || "#795548",
      weight: 4,
      opacity: 0.95,
      fillColor: color || "#795548",
      fillOpacity: 0.1,
      interactive: false,
      className: "route-detail-hub-highlight",
    }).addTo(map);

    hubHighlightRef.current = highlight;
  }, []);

  const centerMapOnHub = useCallback((coords) => {
    const map = mapRef.current;
    const mapContainer = mapContainerRef.current;
    if (!map || !mapContainer || !isMapReady(map, mapContainer) || !coords) return;

    setTimeout(() => {
      const currentMap = mapRef.current;
      const currentContainer = mapContainerRef.current;
      if (!currentMap || !currentContainer || !isMapReady(currentMap, currentContainer)) return;
      try {
        const mapSize = currentMap.getSize();
        const markerPoint = currentMap.latLngToContainerPoint([coords.lat, coords.lng]);
        const targetPoint = L.point(mapSize.x * 0.5, Math.max(120, mapSize.y - 42));
        const offset = markerPoint.subtract(targetPoint);
        currentMap.panBy(offset, { animate: false });
      } catch (err) {
        console.warn("centerMapOnHub panBy error:", err);
      }
    }, 80);
  }, []);

  // 📍 3. วาดหมุดสถานประกอบการ / จุดฉุกเฉิน + Popup
  useEffect(() => {
    const map = mapRef.current;
    const hubsLayer = hubsLayerRef.current;
    const mapContainer = mapContainerRef.current;

    if (!map || !hubsLayer || !mapContainer || !isMapReady(map, mapContainer)) return;

    hubsLayer.clearLayers();
    hubMarkersRef.current.clear();
    removeHubHighlight();

    displayedWellnessHubs.forEach((hub) => {
      const coords = extractLatLng(hub);
      if (!coords) return;

      const catInfo = getCategoryInfo(hub);
      if (!isEmergencyMode && (!catInfo || !activeFilters[catInfo.id])) return;

      const isSkyDoc = Boolean(hub.isSkyDoctor || catInfo.id === "SKY_DOCTOR");
      const isHospital = catInfo.id === "HOSPITAL";
      const isRescue = catInfo.id === "RESCUE";

      let customIcon;
      if (isSkyDoc) {
        customIcon = L.divIcon({
          className: "leaflet-sky-doctor-marker-wrapper",
          html: `
            <div class="leaflet-sky-doctor-marker">
              <div class="leaflet-sky-doctor-pulse"></div>
              <div class="leaflet-sky-doctor-icon">
                <i class="fa-solid fa-helicopter"></i>
              </div>
              <div class="leaflet-sky-doctor-label">SKY DOCTOR</div>
            </div>
          `,
          iconSize: [52, 52],
          iconAnchor: [26, 26],
          popupAnchor: [0, -28],
        });
      } else {
        customIcon = getCategoryMarkerIcon(catInfo?.id || hub, [32, 44]);
      }

      const imageSource = normalizeImageSource(hub.wellnessHubImg);
      const licenseId = hub.licenseId || hub.wellnessHubId || "";
      const districtName = hub.districtName || hub.district?.districtName || "";

      const safeName = escapeHtml(hub.wellnessHubName || "");
      const safeCategory = escapeHtml(catInfo.name || "");
      const safeDistrict = escapeHtml(districtName);
      const safeAddress = escapeHtml(hub.address || "");
      const safeTel = escapeHtml(hub.telInformation || "");
      const safeDescription = escapeHtml(hub.wellnessHubDescription || "");
      const safeImage = escapeHtml(imageSource);
      const safeLicenseId = escapeHtml(licenseId);
      const primaryTel = safeTel.split(",")[0]?.trim() || "1669";

      const popupHtml = `
        <div class="route-hub-popup ${isSkyDoc ? "route-hub-popup--skydoctor" : ""}">
          ${isSkyDoc
          ? `
                <div class="route-hub-popup__sky-banner">
                  <span class="route-hub-popup__sky-badge">
                    <i class="fa-solid fa-helicopter"></i> SKY DOCTOR LANDING ZONE
                  </span>
                </div>
              `
          : imageSource
            ? `
                <div class="route-hub-popup__image">
                  <img
                    src="${safeImage}"
                    alt="${safeName}"
                    loading="lazy"
                    onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
                  />
                  <div class="route-hub-popup__image-fallback" style="display:none;--popup-category-color:${catInfo.color};--popup-category-background:${catInfo.color}18;">
                    <span class="route-hub-popup__image-fallback-icon"><i class="fa-solid ${catInfo.icon}"></i></span>
                    <span class="route-hub-popup__image-fallback-text">${safeCategory}</span>
                  </div>
                </div>
              `
            : `
                <div class="route-hub-popup__image">
                  <div class="route-hub-popup__image-fallback" style="display:flex;--popup-category-color:${catInfo.color};--popup-category-background:${catInfo.color}18;">
                    <span class="route-hub-popup__image-fallback-icon"><i class="fa-solid ${catInfo.icon}"></i></span>
                    <span class="route-hub-popup__image-fallback-text">${safeCategory}</span>
                  </div>
                </div>
              `
        }
          <div class="route-hub-popup__content">
            ${hasValue(catInfo.name)
          ? `
              <div class="route-hub-popup__category">
                <span class="route-hub-popup__category-dot" style="background:${catInfo.color};"></span>
                <span>${safeCategory}</span>
              </div>
            `
          : ""
        }
            ${hasValue(hub.wellnessHubName) ? `<h3 class="route-hub-popup__title">${safeName}</h3>` : ""}
            ${hasValue(districtName) || hasValue(hub.address) || hasValue(hub.telInformation)
          ? `
              <div class="route-hub-popup__meta">
                ${hasValue(districtName)
            ? `
                  <div class="route-hub-popup__meta-row">
                    <span class="route-hub-popup__meta-icon"><i class="fa-solid fa-location-dot"></i></span>
                    <span>อ. ${safeDistrict}</span>
                  </div>
                `
            : ""
          }
                ${hasValue(hub.address)
            ? `
                  <div class="route-hub-popup__meta-row route-hub-popup__meta-row--address">
                    <span class="route-hub-popup__meta-icon"><i class="fa-solid fa-map"></i></span>
                    <span>${safeAddress}</span>
                  </div>
                `
            : ""
          }
                ${hasValue(hub.telInformation)
            ? `
                  <div class="route-hub-popup__meta-row">
                    <span class="route-hub-popup__meta-icon"><i class="fa-solid fa-phone"></i></span>
                    <span>${safeTel}</span>
                  </div>
                `
            : ""
          }
              </div>
            `
          : ""
        }
            ${hasValue(hub.wellnessHubDescription) ? `<p class="route-hub-popup__description">${safeDescription}</p>` : ""}
            
            ${isSkyDoc || isHospital || isRescue
          ? `
                  <div class="route-hub-popup__emergency-actions">
                    <a href="tel:${primaryTel}" class="route-hub-popup__sos-call-btn">
                      <i class="fa-solid fa-phone-volume"></i> โทรสายด่วน ${primaryTel}
                    </a>
                    ${hub.googleMapsLink
            ? `
                          <a href="${escapeHtml(hub.googleMapsLink)}" target="_blank" rel="noopener noreferrer" class="route-hub-popup__map-link-btn">
                            <i class="fa-solid fa-diamond-turn-right"></i> เปิดแผนที่นำทาง
                          </a>
                        `
            : ""
          }
                  </div>
                `
          : hasValue(licenseId)
            ? `
                  <a href="/wellness-hubs/${safeLicenseId}" class="route-hub-popup__button" data-license-id="${safeLicenseId}">
                    <span>ดูรายละเอียดเพิ่มเติม</span>
                    <span class="route-hub-popup__button-arrow" aria-hidden="true">→</span>
                  </a>
                `
            : ""
        }
          </div>
        </div>
      `;

      try {
        const marker = L.marker([coords.lat, coords.lng], {
          icon: customIcon,
          zIndexOffset: isSkyDoc ? 1000 : 0,
        });
        marker.bindPopup(popupHtml, {
          closeButton: true,
          autoPan: false,
          maxWidth: 290,
          minWidth: 280,
          className: `route-hub-leaflet-popup ${isSkyDoc ? "route-hub-leaflet-popup--skydoctor" : ""}`,
        });

        marker.on("click", () => {
          setHubHighlight(coords, catInfo?.color);
        });

        marker.on("popupopen", (e) => {
          setHubHighlight(coords, catInfo?.color);
          centerMapOnHub(coords);

          // 🔗 SPA Navigation: ส่ง state สถานประกอบการและข้อมูลเส้นทางไปยังหน้า WellnessHubDetail (0ms โหลดทันที)
          const popupElement = e.popup?.getElement();
          if (popupElement) {
            const detailBtn = popupElement.querySelector(".route-hub-popup__button");
            if (detailBtn) {
              detailBtn.onclick = (evt) => {
                evt.preventDefault();
                navigate(`/wellness-hubs/${safeLicenseId}`, {
                  state: {
                    hub,
                    fromRoute: {
                      routeId: routeData?.routeId || normalizedRouteId,
                      routeName: routeData?.routeName || "เส้นทางท่องเที่ยวเชิงสุขภาพ",
                    },
                  },
                });
              };
            }
          }
        });

        marker.on("popupclose", () => {
          removeHubHighlight();
        });

        marker.addTo(hubsLayer);
        const markerKey = String(hub.licenseId || hub.wellnessHubId || "");
        if (markerKey) hubMarkersRef.current.set(markerKey, marker);
      } catch (err) {
        console.warn("Marker bind error:", err);
      }
    });
  }, [
    displayedWellnessHubs,
    isEmergencyMode,
    activeFilters,
    getCategoryInfo,
    navigate,
    setHubHighlight,
    removeHubHighlight,
    centerMapOnHub,
    routeData,
    normalizedRouteId,
  ]);

  const handleToggleFilter = (catId) => {
    setActiveFilters((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const isAllCategoriesActive = useMemo(() => {
    return (
      availableCategories.length > 0 &&
      availableCategories.every((cat) => Boolean(activeFilters[cat.id]))
    );
  }, [availableCategories, activeFilters]);

  const handleToggleAllCategories = () => {
    const shouldEnable = !isAllCategoriesActive;
    const nextFilters = availableCategories.reduce(
      (acc, cat) => ({ ...acc, [cat.id]: shouldEnable }),
      {}
    );
    setActiveFilters(nextFilters);
  };

  const handleResetRouteView = () => {
    const map = mapRef.current;
    const bounds = routeBoundsRef.current;
    if (!map || !bounds || !bounds.isValid()) return;
    map.fitBounds(bounds, { padding: [50, 50], animate: false });
  };

  const handleFocusDistrict = (district) => {
    const map = mapRef.current;
    const mapContainer = mapContainerRef.current;
    if (!map || !mapContainer || !isMapReady(map, mapContainer)) return;

    const coords = extractLatLng(district);
    if (!coords) return;

    try {
      map.setView([coords.lat, coords.lng], 12);
    } catch { }
  };

  const handleFocusWellnessHub = (hub) => {
    const map = mapRef.current;
    const mapContainer = mapContainerRef.current;
    if (!map || !mapContainer || !isMapReady(map, mapContainer)) return;

    const coords = extractLatLng(hub);
    if (!coords) return;

    const catInfo = getCategoryInfo(hub);
    const markerKey = String(hub.licenseId || hub.wellnessHubId || "");
    const marker = hubMarkersRef.current.get(markerKey);

    if (catInfo?.id && !activeFilters[catInfo.id]) {
      setActiveFilters((cur) => ({ ...cur, [catInfo.id]: true }));
    }

    try {
      map.setView([coords.lat, coords.lng], 13, { animate: false });
      setHubHighlight(coords, catInfo?.color);
      if (marker) {
        setTimeout(() => {
          try {
            if (mapRef.current && isMapReady(mapRef.current, mapContainerRef.current)) {
              marker.openPopup();
              centerMapOnHub(coords);
            }
          } catch { }
        }, 150);
      }
    } catch { }
  };

  if (loading) {
    return (
      <LoadingState
        fullPage
        title="กำลังโหลดรายละเอียดเส้นทาง"
        message="ระบบกำลังเตรียมข้อมูลแผนที่ อำเภอ และสถานประกอบการ"
      />
    );
  }

  if (error || !routeData) {
    return (
      <main className="route-detail-page">
        <div className="route-detail-container">
          <section className="route-detail-state">
            <CircleAlert size={48} />
            <h1>ไม่สามารถแสดงเส้นทางได้</h1>
            <p>{error || "ไม่พบข้อมูลเส้นทาง"}</p>
            <div className="route-detail-state__actions">
              <button
                type="button"
                onClick={() => loadRouteDetail()}
              >
                <RefreshCw size={16} />
                ลองใหม่
              </button>
              <Link to="/">
                <ArrowLeft size={16} /> กลับหน้าแรก
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="route-detail-page">
      <RouteHeroHeader
        routeName={routeData.routeName}
        routeDescription={routeData.routeDescription}
      />

      <div className="route-detail-container route-detail-content">
        <section className="route-detail-section route-detail-section--explorer">
          <div className="route-detail-heading">
            <div>
              <p>ROUTE MAP</p>
              <h2>แผนที่เส้นทาง</h2>
            </div>
          </div>

          {/* 🌟 1. TOOLBAR & CONTROLS */}
          <RouteMapToolbar
            availableCategories={availableCategories}
            activeFilters={activeFilters}
            onToggleFilter={handleToggleFilter}
            onToggleAllCategories={handleToggleAllCategories}
            isAllCategoriesActive={isAllCategoriesActive}
            districts={districts}
            visibleDistrictIds={visibleDistrictIds}
            isEditingDistricts={isEditingDistricts}
            onToggleDistrictEdit={() => setIsEditingDistricts((c) => !c)}
            onToggleDistrictVisibility={handleToggleDistrictVisibility}
            onFocusDistrict={handleFocusDistrict}
            isEmergencyMode={isEmergencyMode}
            onToggleEmergencyMode={() => setIsEmergencyMode((prev) => !prev)}
            isControlCollapsed={isControlCollapsed}
            onToggleControlCollapsed={() => setIsControlCollapsed((c) => !c)}
            onResetRouteView={handleResetRouteView}
          />

          <div className="route-detail-explorer">
            <div className="route-detail-explorer__map">
              <div className="route-detail-map-workspace">
                <div className="route-detail-map-card" style={{ position: "relative" }}>
                  {/* 📍 ปุ่มลอยมุมขวาบนของแผนที่ */}
                  <button
                    type="button"
                    onClick={() => setShowLegendModal(true)}
                    style={{
                      position: "absolute",
                      top: "14px",
                      right: "14px",
                      zIndex: 500,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "7px 14px",
                      backgroundColor: "#ffffff",
                      color: "#076653",
                      border: "1.5px solid #076653",
                      borderRadius: "10px",
                      fontSize: "13px",
                      fontWeight: "700",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                      transition: "all 0.2s ease"
                    }}
                    title="คำอธิบายสัญลักษณ์หมุด"
                  >
                    <Info size={15} />
                    <span>คำอธิบายสัญลักษณ์หมุด</span>
                  </button>

                  <div ref={mapContainerRef} className="route-detail-map" />
                </div>
              </div>
            </div>

            <div className="route-detail-explorer__places">
              <div
                className={`route-detail-explorer__places-header ${
                  isEmergencyMode ? "route-detail-explorer__places-header--emergency" : ""
                }`}
              >
                <div>
                  <p>
                    {isEmergencyMode ? "EMERGENCY & SKY DOCTOR" : "WELLNESS PLACES"}
                  </p>
                  <h2>
                    {isEmergencyMode ? "จุดบริการฉุกเฉิน & Sky Doctor" : "สถานประกอบการในเส้นทาง"}
                  </h2>
                  <span>
                    {isEmergencyMode
                      ? "แสดงจุดแพทย์ทางอากาศ โรงพยาบาล และหน่วยกู้ภัยในพื้นที่"
                      : "เลือกสถานประกอบการเพื่อดูรายละเอียดเพิ่มเติม"}
                  </span>
                </div>
                <span
                  className={`route-detail-explorer__places-count ${
                    isEmergencyMode ? "route-detail-explorer__places-count--emergency" : ""
                  }`}
                >
                  {displayedWellnessHubs.length} {isEmergencyMode ? "จุด" : "แห่ง"}
                </span>
              </div>

              <div className="route-detail-explorer__places-scroll">
                {displayedWellnessHubs.length > 0 ? (
                  <div className="route-detail-hub-grid">
                    {displayedWellnessHubs.map((hub) => {
                      const catInfo = getCategoryInfo(hub);
                      const isSkyDoc = Boolean(hub.isSkyDoctor || catInfo.id === "SKY_DOCTOR");
                      const isEmergencyItem = isSkyDoc || catInfo.id === "HOSPITAL" || catInfo.id === "RESCUE";

                      return (
                        <RouteHubCard
                          key={hub.licenseId || hub.wellnessHubId}
                          hub={hub}
                          catInfo={catInfo}
                          isSkyDoc={isSkyDoc}
                          isEmergencyItem={isEmergencyItem}
                          onFocusHub={handleFocusWellnessHub}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="route-detail-empty">
                    <Store size={36} />
                    <h3>
                      {isEmergencyMode ? "ไม่พบจุดฉุกเฉิน" : "ยังไม่มีสถานประกอบการ"}
                    </h3>
                    <p>
                      {isEmergencyMode
                        ? "ไม่พบข้อมูลจุดฉุกเฉินหรือ Sky Doctor ในเส้นทางนี้"
                        : "ไม่พบสถานประกอบการที่ตรงกับอำเภอและหมวดหมู่ของเส้นทางนี้"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 📌 Pop-up Modal แสดงคำอธิบายสัญลักษณ์หมุด */}
      <MapLegendModal
        isOpen={showLegendModal}
        onClose={() => setShowLegendModal(false)}
        categories={availableCategories}
      />
    </main>
  );
}
