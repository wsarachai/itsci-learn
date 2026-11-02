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
 */
export function getCategoryMarkerImage(categoryInput) {
  const code = normalizeCategoryCode(categoryInput);
  const rawSrc = CATEGORY_MARKER_SOURCES[code] || markerC01;
  return cleanedMarkerUrlCache.get(rawSrc) || rawSrc;
}

/**
 * 1. ลบเฉพาะพื้นหลังด้านนอกด้วย Canvas โดยใช้ Flood Fill เริ่มจากขอบรูปภาพทั้ง 4 ด้าน
 * 2. Crop ขอบโปร่งใสรอบรูปออก (Bounding Box Auto-Crop) เพื่อให้ทุกหมวดมีขนาดแสดงผลเท่ากัน
 * 3. ไม่ยืดภาพ และคงสัดส่วนเดิมไว้
 */
export function removeOuterBackgroundAndCrop(imageSrc) {
  if (!imageSrc) return Promise.resolve(imageSrc);
  if (cleanedMarkerUrlCache.has(imageSrc)) {
    return Promise.resolve(cleanedMarkerUrlCache.get(imageSrc));
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          cleanedMarkerUrlCache.set(imageSrc, imageSrc);
          resolve(imageSrc);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // ตรวจสอบพิกัดมุม (0,0)
        const bgR = data[0];
        const bgG = data[1];
        const bgB = data[2];
        const bgA = data[3];

        const tolerance = 28;
        const isBgColor = (idx) => {
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];
          if (a === 0) return false;
          const diffR = Math.abs(r - bgR);
          const diffG = Math.abs(g - bgG);
          const diffB = Math.abs(b - bgB);
          if (diffR <= tolerance && diffG <= tolerance && diffB <= tolerance) {
            return true;
          }
          if (r > 240 && g > 240 && b > 240) {
            return true;
          }
          return false;
        };

        // Breadth-First Search (BFS) Flood Fill จากขอบทั้ง 4 ด้าน เพื่อลบเฉพาะพื้นหลังด้านนอก
        const visited = new Uint8Array(width * height);
        const queue = [];

        // ขอบซ้าย-ขวา
        for (let y = 0; y < height; y++) {
          const leftIdx = y * width;
          const rightIdx = y * width + (width - 1);
          if (isBgColor(leftIdx * 4) || data[leftIdx * 4 + 3] === 0) {
            visited[leftIdx] = 1;
            queue.push(leftIdx);
          }
          if (isBgColor(rightIdx * 4) || data[rightIdx * 4 + 3] === 0) {
            visited[rightIdx] = 1;
            queue.push(rightIdx);
          }
        }

        // ขอบบน-ล่าง
        for (let x = 0; x < width; x++) {
          const topIdx = x;
          const bottomIdx = (height - 1) * width + x;
          if (!visited[topIdx] && (isBgColor(topIdx * 4) || data[topIdx * 4 + 3] === 0)) {
            visited[topIdx] = 1;
            queue.push(topIdx);
          }
          if (!visited[bottomIdx] && (isBgColor(bottomIdx * 4) || data[bottomIdx * 4 + 3] === 0)) {
            visited[bottomIdx] = 1;
            queue.push(bottomIdx);
          }
        }

        let head = 0;
        while (head < queue.length) {
          const curr = queue[head++];
          const currDataIdx = curr * 4;
          data[currDataIdx + 3] = 0; // ลบพื้นหลังด้านนอกให้โปร่งใส

          const cx = curr % width;
          const cy = Math.floor(curr / width);

          const neighbors = [
            cy > 0 ? curr - width : -1,
            cy < height - 1 ? curr + width : -1,
            cx > 0 ? curr - 1 : -1,
            cx < width - 1 ? curr + 1 : -1,
          ];

          for (const n of neighbors) {
            if (n !== -1 && !visited[n]) {
              const nIdx = n * 4;
              if (isBgColor(nIdx) || data[nIdx + 3] === 0) {
                visited[n] = 1;
                queue.push(n);
              }
            }
          }
        }

        ctx.putImageData(imageData, 0, 0);

        // หา Bounding Box ของส่วนที่ไม่โปร่งใส (Auto-Crop Bounding Box)
        let minX = width;
        let minY = height;
        let maxX = -1;
        let maxY = -1;

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const alpha = data[(y * width + x) * 4 + 3];
            if (alpha > 15) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (minX <= maxX && minY <= maxY) {
          const cropWidth = maxX - minX + 1;
          const cropHeight = maxY - minY + 1;

          const cropCanvas = document.createElement("canvas");
          cropCanvas.width = cropWidth;
          cropCanvas.height = cropHeight;
          const cropCtx = cropCanvas.getContext("2d", { willReadFrequently: true });

          if (cropCtx) {
            cropCtx.drawImage(
              canvas,
              minX,
              minY,
              cropWidth,
              cropHeight,
              0,
              0,
              cropWidth,
              cropHeight,
            );
            const croppedUrl = cropCanvas.toDataURL("image/png");
            cleanedMarkerUrlCache.set(imageSrc, croppedUrl);
            resolve(croppedUrl);
            return;
          }
        }

        const fallbackUrl = canvas.toDataURL("image/png");
        cleanedMarkerUrlCache.set(imageSrc, fallbackUrl);
        resolve(fallbackUrl);
      } catch (err) {
        console.warn("Canvas marker processing error:", err);
        cleanedMarkerUrlCache.set(imageSrc, imageSrc);
        resolve(imageSrc);
      }
    };

    img.onerror = () => {
      cleanedMarkerUrlCache.set(imageSrc, imageSrc);
      resolve(imageSrc);
    };

    img.src = imageSrc;
  });
}

// Pre-process all marker images on module load
Object.values(CATEGORY_MARKER_SOURCES).forEach((src) => {
  removeOuterBackgroundAndCrop(src).then((cleanedUrl) => {
    cleanedMarkerUrlCache.set(src, cleanedUrl);
  });
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

  const cacheKey = `${code}_${iconW}x${iconH}_${cleanedUrl === rawSrc ? "raw" : "clean"}`;
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

  // If not yet cleaned, process in background and update cache
  if (!cleanedMarkerUrlCache.has(rawSrc)) {
    removeOuterBackgroundAndCrop(rawSrc).then((cleaned) => {
      const cleanKey = `${code}_${iconW}x${iconH}_clean`;
      const cleanIcon = L.icon({
        iconUrl: cleaned,
        iconSize: [iconW, iconH],
        iconAnchor: [anchorX, anchorY],
        popupAnchor: [0, popupY],
        className: "wellness-category-marker-pin",
      });
      leafletIconCache.set(cleanKey, cleanIcon);
    });
  }

  return iconInstance;
}
