// src/utils/categoryMarkerIcons.js
import L from "leaflet";
import markerC01 from "../assets/marker-c01-spa.png";
import markerC02 from "../assets/marker-c02-clinic.png";
import markerC03 from "../assets/marker-c03-restaurant.png";
import markerC04 from "../assets/marker-c04-hotel.png";
import markerC05 from "../assets/marker-c05-attraction.png";
import markerEM01 from "../assets/marker-em01-rescue.png";
import markerEM02 from "../assets/marker-em02-hospital.png";

export const CATEGORY_COLORS = {
  C01: {
    name: "นวด/สปาเพื่อสุขภาพ",
    color: "#E02873",
    background: "#FDEBF2",
  },
  C02: {
    name: "คลินิก/สถานพยาบาล",
    color: "#004CB4",
    background: "#E7EFF9",
  },
  C03: {
    name: "อาหารและเครื่องดื่ม",
    color: "#0B7D31",
    background: "#EAF5ED",
  },
  C04: {
    name: "ที่พักฟื้นฟูสุขภาพ",
    color: "#5E27AB",
    background: "#F2ECFB",
  },
  C05: {
    name: "สถานที่ท่องเที่ยว",
    color: "#009BB0",
    background: "#E6F8FA",
  },
  EM01: {
    name: "หน่วยกู้ภัย",
    color: "#C98600",
    background: "#FFF7DC",
  },
  EM02: {
    name: "โรงพยาบาล",
    color: "#BD0915",
    background: "#FEECEE",
  },
};

export const CATEGORY_MARKER_SOURCES = {
  C01: markerC01,
  C02: markerC02,
  C03: markerC03,
  C04: markerC04,
  C05: markerC05,
  EM01: markerEM01,
  EM02: markerEM02,
};

export const UNIFIED_MARKER_SIZE = [32, 44];
export const UNIFIED_ICON_ANCHOR = [16, 44];
export const UNIFIED_POPUP_ANCHOR = [0, -42];

// Cache for cleaned canvas DataURLs
const cleanedMarkerUrlCache = new Map();
// Cache for Leaflet L.icon instances
const leafletIconCache = new Map();

/**
 * ดึง URL หรือรูปภาพของ Marker ตามหมวดหมู่ (ใช้สำหรับแสดงใน Card หรือ Element ทั่วไป)
 * แสดงผลทันทีแบบ 0ms ด้วยหมุดที่ตัดขอบและโปร่งใสเรียบร้อยแล้ว
 */
export function getCategoryMarkerImage(categoryInput) {
  const code = normalizeCategoryCode(categoryInput);
  return CATEGORY_MARKER_SOURCES[code] || markerC01;
}

/**
 * ฟังก์ชันสำหรับ Fallback ตรวจจับความโปร่งใส (ปัจจุบันภาพใน assets ถูกตัดขอบและโปร่งใส 100% แล้ว)
 */
export function removeOuterBackgroundAndCrop(imageSrc) {
  if (!imageSrc) return Promise.resolve(imageSrc);
  return Promise.resolve(imageSrc);
}

// Pre-populate cleanedMarkerUrlCache
Object.entries(CATEGORY_MARKER_SOURCES).forEach(([code, src]) => {
  cleanedMarkerUrlCache.set(src, src);
});

/**
 * แปลง category key หรือ object ให้เป็นรหัส C01-C05, EM01, EM02
 */
export function normalizeCategoryCode(categoryInput) {
  if (!categoryInput) return "C01";
  const str = (
    typeof categoryInput === "object"
      ? categoryInput.categoryKey ||
        categoryInput.categoryId ||
        categoryInput.categoryName ||
        categoryInput.id ||
        categoryInput.category?.categoryId ||
        categoryInput.category?.categoryName ||
        ""
      : String(categoryInput)
  )
    .trim()
    .toUpperCase();

  if (
    str.includes("EM02") ||
    str.includes("HOSPITAL") ||
    str.includes("ALS") ||
    str.includes("ADVANCED") ||
    str.includes("โรงพยาบาล")
  ) {
    return "EM02";
  }
  if (
    str.includes("EM01") ||
    str.includes("RESCUE") ||
    str.includes("BLS") ||
    str.includes("BASIC") ||
    str.includes("กู้ภัย")
  ) {
    return "EM01";
  }
  if (
    str.includes("C01") ||
    str.includes("SPA") ||
    str.includes("MASSAGE") ||
    str.includes("นวด") ||
    str.includes("สปา")
  ) {
    return "C01";
  }
  if (str.includes("C02") || str.includes("CLINIC") || str.includes("คลินิก")) {
    return "C02";
  }
  if (
    str.includes("C03") ||
    str.includes("REST") ||
    str.includes("FOOD") ||
    str.includes("อาหาร")
  ) {
    return "C03";
  }
  if (
    str.includes("C04") ||
    str.includes("HOTEL") ||
    str.includes("ACCOM") ||
    str.includes("ที่พัก")
  ) {
    return "C04";
  }
  if (
    str.includes("C05") ||
    str.includes("ATTRACTION") ||
    str.includes("TOURIS") ||
    str.includes("TOURISM") ||
    str.includes("TOURIST") ||
    str.includes("TRAVEL") ||
    str.includes("ท่องเที่ยว")
  ) {
    return "C05";
  }

  return "C01";
}

/**
 * สร้าง L.icon ที่มีขนาด iconSize, iconAnchor, popupAnchor เท่ากันทุกหมวดหมู่
 */
export function getCategoryMarkerIcon(categoryInput, size = UNIFIED_MARKER_SIZE) {
  const code = normalizeCategoryCode(categoryInput);
  const rawSrc = CATEGORY_MARKER_SOURCES[code] || markerC01;
  const cleanedUrl = cleanedMarkerUrlCache.get(rawSrc) || rawSrc;

  const iconW = size[0] || 32;
  const iconH = size[1] || 44;
  const anchorX = Math.round(iconW / 2); // 16
  const anchorY = iconH; // 44
  const popupY = -42; // [0, -42]

  const cacheKey = `${code}_${iconW}x${iconH}`;
  if (leafletIconCache.has(cacheKey)) {
    return leafletIconCache.get(cacheKey);
  }

  const iconInstance = L.icon({
    iconUrl: cleanedUrl,
    iconSize: [iconW, iconH],
    iconAnchor: [anchorX, anchorY],
    popupAnchor: [0, popupY],
    className: "wellness-category-marker-pin",
  });

  leafletIconCache.set(cacheKey, iconInstance);
  return iconInstance;
}
