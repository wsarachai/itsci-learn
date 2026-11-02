import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Copy,
  ExternalLink,
  Eye,
  FileBadge2,
  ImageIcon,
  Mail,
  MapPin,
  Maximize2,
  Navigation,
  Phone,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { Link, useNavigate, useParams } from "react-router-dom";

import LoadingState from "../../Components/LoadingState/LoadingState";
import {
  getCategoryMarkerIcon,
  normalizeCategoryCode,
} from "../../utils/categoryMarkerIcons";
import "./WellnessHubDetail.css";

const API_BASE_URL = "/api";
const DEFAULT_CENTER = [18.7883, 98.9853];

const CATEGORY_MAP = {
  C01: {
    id: "SPA",
    code: "C01",
    name: "นวด/สปาเพื่อสุขภาพ",
    color: "#E02873",
    accentColor: "#FDEBF2",
    icon: "fa-spa",
    description: "การดูแลสุขภาพ ผ่อนคลาย และบำบัดด้วยศาสตร์การนวดและสปา",
  },
  C02: {
    id: "CLINIC",
    code: "C02",
    name: "คลินิก/สถานพยาบาล",
    color: "#004CB4",
    accentColor: "#E7EFF9",
    icon: "fa-notes-medical",
    description: "บริการตรวจรักษา ฟื้นฟูสมรรถภาพ และการแพทย์บูรณาการ",
  },
  C03: {
    id: "RESTAURANT",
    code: "C03",
    name: "อาหารและเครื่องดื่ม",
    color: "#0B7D31",
    accentColor: "#EAF5ED",
    icon: "fa-utensils",
    description: "โภชนาการเพื่อสุขภาพ อาหารอินทรีย์ และเครื่องดื่มสมุนไพร",
  },
  C04: {
    id: "HOTEL",
    code: "C04",
    name: "ที่พักฟื้นฟูสุขภาพ",
    color: "#5E27AB",
    accentColor: "#F2ECFB",
    icon: "fa-bed",
    description: "สถานที่พักผ่อนและฟื้นฟูสุขภาพท่ามกลางธรรมชาติเชียงใหม่",
  },
  C05: {
    id: "ATTRACTION",
    code: "C05",
    name: "สถานที่ท่องเที่ยว",
    color: "#009BB0",
    accentColor: "#E6F8FA",
    icon: "fa-map-location-dot",
    description: "แหล่งท่องเที่ยวเชิงสุขภาพ วัฒนธรรม และธรรมชาติ",
  },
  EM01: {
    id: "RESCUE",
    code: "EM01",
    name: "หน่วยกู้ภัยฉุกเฉิน",
    color: "#C98600",
    accentColor: "#FFF7DC",
    icon: "fa-truck-medical",
    description: "หน่วยบริการฉุกเฉินและกู้ชีพเพื่อความปลอดภัย 24 ชั่วโมง",
  },
  EM02: {
    id: "HOSPITAL",
    code: "EM02",
    name: "โรงพยาบาล",
    color: "#BD0915",
    accentColor: "#FEECEE",
    icon: "fa-hospital",
    description: "โรงพยาบาลและศูนย์การแพทย์พร้อมการดูแลตลอด 24 ชั่วโมง",
  },
};

const DAY_LABELS = {
  monday: "วันจันทร์",
  tuesday: "วันอังคาร",
  wednesday: "วันพุธ",
  thursday: "วันพฤหัสบดี",
  friday: "วันศุกร์",
  saturday: "วันเสาร์",
  sunday: "วันอาทิตย์",
};

const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function hasValue(value) {
  if (value === null || value === undefined) return false;

  const str = String(value).trim();

  return (
    str !== "" && str !== "#ERROR!" && str !== "undefined" && str !== "null"
  );
}

function hasCoordinates(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= 17.0 &&
    lat <= 20.5 &&
    lng >= 98.0 &&
    lng <= 100.0
  );
}

function getHubCoordinates(hub) {
  if (!hub) return null;
  const lat = hub.latitude ?? hub.wellnessHubLatitude;
  const lng = hub.longitude ?? hub.wellnessHubLongitude;
  if (hasCoordinates(lat, lng)) {
    return [Number(lat), Number(lng)];
  }
  return null;
}

function getCategoryInfo(hub) {
  const code = normalizeCategoryCode(hub);
  const matched = CATEGORY_MAP[code] || CATEGORY_MAP.C01;

  return {
    ...matched,
    name: hub?.categoryName || matched.name,
  };
}

function parseJsonValue(value) {
  if (!hasValue(value)) return null;

  if (typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

function normalizeOperatingHours(value) {
  const parsedValue = parseJsonValue(value);

  if (!parsedValue || Array.isArray(parsedValue)) return [];

  return DAY_ORDER.map((dayKey) => {
    const detail = parsedValue[dayKey];
    return {
      day: dayKey,
      label: DAY_LABELS[dayKey] || dayKey,
      active: Boolean(detail?.active),
      open: detail?.open || "",
      close: detail?.close || "",
    };
  });
}

function removeEmojis(text) {
  if (!text) return "";
  return String(text)
    .replace(
      /[\p{Extended_Pictographic}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/gu,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCertificateTypes(value) {
  if (!hasValue(value)) return [];

  const parsedValue = parseJsonValue(value);
  let rawList = [];

  if (Array.isArray(parsedValue)) {
    rawList = parsedValue;
  } else {
    const strValue = String(value).trim();
    if (strValue.includes(",")) {
      rawList = strValue.split(",");
    } else if (strValue.includes("\n")) {
      rawList = strValue.split("\n");
    } else {
      rawList = [strValue];
    }
  }

  return rawList
    .map((item) => removeEmojis(String(item)).trim())
    .filter((item) => hasValue(item));
}

function normalizeImageSource(imageValue) {
  if (!hasValue(imageValue)) return "";

  let normalizedValue = imageValue;

  if (typeof normalizedValue === "object" && !Array.isArray(normalizedValue)) {
    normalizedValue =
      normalizedValue.preview ||
      normalizedValue.url ||
      normalizedValue.src ||
      normalizedValue.image ||
      normalizedValue.path ||
      "";
  }

  if (typeof normalizedValue === "string") {
    const trimmedValue = normalizedValue.trim();

    try {
      const parsedValue = JSON.parse(trimmedValue);

      normalizedValue = Array.isArray(parsedValue)
        ? parsedValue[0] || ""
        : typeof parsedValue === "object" && parsedValue !== null
          ? parsedValue.preview || parsedValue.url || parsedValue.src || parsedValue.image || ""
          : trimmedValue;
    } catch (error) {
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

  if (/^[A-Za-z0-9+/=\s]+$/.test(imageSource) && imageSource.length > 100) {
    return `data:image/jpeg;base64,${imageSource}`;
  }

  if (!imageSource.includes("/") && !imageSource.includes("\\")) {
    return `${API_BASE_URL.replace("/api", "")}/uploads/${imageSource}`;
  }

  return imageSource;
}

function normalizeGalleryImages(galleryValue) {
  if (!hasValue(galleryValue)) return [];

  let parsed = galleryValue;

  if (typeof galleryValue === "string") {
    const trimmed = galleryValue.trim();
    try {
      parsed = JSON.parse(trimmed);
    } catch (e) {
      if (trimmed.includes(",")) {
        parsed = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
      } else {
        parsed = [trimmed];
      }
    }
  }

  if (!Array.isArray(parsed)) {
    parsed = [parsed];
  }

  return parsed
    .map((item) => normalizeImageSource(item))
    .filter((src) => hasValue(src));
}

function getPlaceOpenStatus(operatingHoursList) {
  if (!operatingHoursList || operatingHoursList.length === 0) {
    return { isOpen: null, label: "ไม่ได้ระบุเวลาทำการ" };
  }

  const activeDays = operatingHoursList.filter((d) => d.active);
  if (activeDays.length === 0) {
    return { isOpen: false, label: "ปิดให้บริการชั่วคราว" };
  }

  // Check 24 hours all days
  const is24HoursAll =
    activeDays.length === 7 &&
    activeDays.every(
      (d) =>
        d.open === "00:00" &&
        (d.close === "23:59" || d.close === "24:00" || d.close === "00:00"),
    );

  if (is24HoursAll) {
    return { isOpen: true, label: "เปิดบริการ 24 ชั่วโมง", is24: true };
  }

  const now = new Date();
  const dayIndex = now.getDay(); // 0 = Sunday, 1 = Monday
  const dayMap = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const currentDayKey = dayMap[dayIndex];

  const today = operatingHoursList.find((d) => d.day === currentDayKey);

  if (!today || !today.active) {
    return { isOpen: false, label: "ปิดทำการวันนี้" };
  }

  if (
    today.open === "00:00" &&
    (today.close === "23:59" || today.close === "24:00" || today.close === "00:00")
  ) {
    return { isOpen: true, label: "เปิดบริการ 24 ชั่วโมงวันนี้", is24: true };
  }

  if (!today.open || !today.close) {
    return { isOpen: false, label: "ปิดทำการวันนี้" };
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = today.open.split(":").map(Number);
  const [closeH, closeM] = today.close.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
    return {
      isOpen: true,
      label: `เปิดอยู่ตอนนี้ (ปิด ${today.close} น.)`,
      todayTime: `${today.open} – ${today.close} น.`,
    };
  }

  if (currentMinutes < openMinutes) {
    return {
      isOpen: false,
      label: `เปิดเวลา ${today.open} น.`,
      todayTime: `${today.open} – ${today.close} น.`,
    };
  }

  return {
    isOpen: false,
    label: "ปิดแล้ววันนี้",
    todayTime: `${today.open} – ${today.close} น.`,
  };
}

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    "ไม่สามารถโหลดข้อมูลสถานประกอบการได้ กรุณาลองใหม่อีกครั้ง"
  );
}

function getNavigationUrl(hub) {
  if (!hub) return "#";

  // 1. If coordinates exist, navigate to destination coordinates from user's current location
  const coords = getHubCoordinates(hub);
  if (coords) {
    return `https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`;
  }

  // 2. If googleMapsLink contains hardcoded origin in /maps/dir/Origin/Destination, extract destination only
  if (hasValue(hub.googleMapsLink) && hub.googleMapsLink.trim() !== "#") {
    const rawLink = String(hub.googleMapsLink).trim();

    const dirMatch = rawLink.match(/\/maps\/dir\/([^/]+)\/([^/?#]+)/);
    if (dirMatch && dirMatch[2]) {
      const destination = decodeURIComponent(dirMatch[2]);
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    }

    if (!rawLink.includes("/maps/dir/")) {
      return rawLink;
    }
  }

  // 3. Fallback: navigate to place name and district in Chiang Mai
  const query = [hub.wellnessHubName, hub.address, hub.districtName, "เชียงใหม่"]
    .filter(Boolean)
    .join(" ");

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

export default function WellnessHubDetail() {
  const { hubId } = useParams();
  const navigate = useNavigate();

  const [hub, setHub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Lightbox
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const loadWellnessHub = useCallback(async () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    const normalizedHubId = String(hubId ?? "").trim();

    if (!normalizedHubId) {
      setHub(null);
      setError("รหัสสถานประกอบการไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setImageError(false);

    try {
      const response = await axios.get(
        `${API_BASE_URL}/home/wellness-hubs/${encodeURIComponent(normalizedHubId)}`,
        {
          timeout: 30000,
        },
      );

      if (!response.data || !response.data.licenseId) {
        setHub(null);
        setError("ไม่พบข้อมูลสถานประกอบการที่ต้องการ");
        return;
      }

      setHub(response.data);
    } catch (requestError) {
      setHub(null);
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [hubId]);

  useEffect(() => {
    loadWellnessHub();
  }, [loadWellnessHub]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [hubId, loading]);

  const imageSource = useMemo(
    () => normalizeImageSource(hub?.wellnessHubImg || hub?.img || hub?.coverImage),
    [hub],
  );

  const galleryImages = useMemo(() => {
    const raw =
      hub?.wellnessHubGallery ||
      hub?.gallery ||
      hub?.wellnessHubImages ||
      hub?.images ||
      hub?.atmosphereImages;
    return normalizeGalleryImages(raw);
  }, [hub]);

  // Combined all images for gallery/lightbox
  const allImages = useMemo(() => {
    const list = [];
    if (imageSource && !imageError) list.push(imageSource);
    galleryImages.forEach((img) => {
      if (img && !list.includes(img)) list.push(img);
    });
    return list;
  }, [imageSource, imageError, galleryImages]);

  const operatingHours = useMemo(
    () => normalizeOperatingHours(hub?.operatingHours),
    [hub?.operatingHours],
  );

  const openStatus = useMemo(
    () => getPlaceOpenStatus(operatingHours),
    [operatingHours],
  );

  const certificateTypes = useMemo(
    () => normalizeCertificateTypes(hub?.certificateType),
    [hub?.certificateType],
  );

  const navigationUrl = useMemo(() => getNavigationUrl(hub), [hub]);

  const markerIcon = useMemo(
    () => (hub ? getCategoryMarkerIcon(hub) : null),
    [hub],
  );

  const catInfo = useMemo(() => (hub ? getCategoryInfo(hub) : null), [hub]);

  const hubCoords = useMemo(() => getHubCoordinates(hub), [hub]);
  const coordinatesAvailable = Boolean(hubCoords);
  const mapPosition = hubCoords || DEFAULT_CENTER;

  // Lightbox keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev + 1) % allImages.length);
      }
      if (e.key === "ArrowLeft") {
        setLightboxIndex(
          (prev) => (prev - 1 + allImages.length) % allImages.length,
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, allImages.length]);

  const handleCopyAddress = () => {
    if (!hub?.address) return;
    navigator.clipboard.writeText(hub.address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2500);
  };

  const openLightboxAtImage = (src) => {
    const idx = allImages.indexOf(src);
    setLightboxIndex(idx >= 0 ? idx : 0);
  };

  if (loading) {
    return (
      <LoadingState
        fullPage
        title="กำลังโหลดข้อมูลสถานประกอบการ"
        message="ระบบกำลังเตรียมรูปภาพ ตำแหน่ง และข้อมูลที่เกี่ยวข้อง"
      />
    );
  }

  if (error || !hub) {
    return (
      <main className="hub-detail-page">
        <div className="hub-detail-container">
          <section className="hub-detail-state">
            <CircleAlert />
            <h1>ไม่สามารถแสดงข้อมูลได้</h1>
            <p>{error || "ไม่พบข้อมูลสถานประกอบการ"}</p>
            <div className="hub-detail-state__actions">
              <button type="button" onClick={loadWellnessHub}>
                <RefreshCw />
                ลองใหม่อีกครั้ง
              </button>
              <Link to="/">
                <ArrowLeft />
                กลับหน้าหลัก
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main
      className="hub-detail-page"
      style={{
        "--hub-theme-color": catInfo?.color || "#076653",
        "--hub-theme-accent": catInfo?.accentColor || "#E2FBCE",
      }}
    >
      {/* HERO SECTION */}
      <header className="hub-detail-hero">
        <div className="hub-detail-container">
          {/* TOP BAR */}
          <div className="hub-detail-hero__topbar">
            <button
              type="button"
              className="hub-detail-back"
              onClick={() => navigate(-1)}
              aria-label="ย้อนกลับ"
            >
              <ArrowLeft />
              <span>ย้อนกลับ</span>
            </button>
          </div>

          {/* MAIN HERO CONTENT */}
          <div className="hub-detail-hero__main">
            <div className="hub-detail-hero__tags">
              {hasValue(hub.categoryName) && (
                <span className="hub-detail-tag hub-detail-tag--category">
                  <i className={`fa-solid ${catInfo.icon}`} />
                  {hub.categoryName}
                </span>
              )}

              {openStatus.isOpen !== null && (
                <span
                  className={`hub-detail-tag hub-detail-tag--status ${openStatus.isOpen
                      ? "hub-detail-tag--open"
                      : "hub-detail-tag--closed"
                    }`}
                >
                  <span className="hub-status-dot" />
                  {openStatus.label}
                </span>
              )}

              {certificateTypes.length > 0 && (
                <span className="hub-detail-tag hub-detail-tag--certified">
                  <ShieldCheck size={14} />
                  ผ่านการรับรองมาตรฐาน
                </span>
              )}
            </div>

            <h1 className="hub-detail-title">{hub.wellnessHubName}</h1>

            <div className="hub-detail-hero__meta">
              {hasValue(hub.districtName) && (
                <span className="hub-detail-meta-item">
                  <MapPin size={16} />
                  <span>อำเภอ{hub.districtName}, เชียงใหม่</span>
                </span>
              )}

              {hasValue(hub.licenseId) && (
                <span className="hub-detail-meta-item">
                  <FileBadge2 size={16} />
                  <span>รหัสใบอนุญาต: {hub.licenseId}</span>
                </span>
              )}

              {allImages.length > 0 && (
                <span className="hub-detail-meta-item">
                  <ImageIcon size={16} />
                  <span>{allImages.length} รูปภาพ</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="hub-detail-container hub-detail-body">
        {/* TWO-COLUMN GRID */}
        <div className="hub-detail-layout">
          {/* LEFT COLUMN: PRIMARY CONTENT */}
          <div className="hub-detail-primary">
            {/* SHOWCASE COVER IMAGE */}
            <section className="hub-detail-showcase">
              <div
                className="hub-detail-showcase__cover"
                onClick={() => {
                  if (imageSource && !imageError) {
                    openLightboxAtImage(imageSource);
                  }
                }}
              >
                {imageSource && !imageError ? (
                  <>
                    <img
                      src={imageSource}
                      alt={hub.wellnessHubName}
                      className="hub-detail-showcase__img"
                      onError={() => setImageError(true)}
                    />
                    <div className="hub-detail-showcase__overlay">
                      <span className="hub-detail-showcase__zoom">
                        <Maximize2 size={18} />
                        คลิกเพื่อดูรูปภาพขนาดใหญ่
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="hub-detail-showcase__placeholder">
                    <div className="hub-detail-showcase__icon">
                      <i className={`fa-solid ${catInfo.icon}`} />
                    </div>
                    <span>{catInfo.name}</span>
                    <small>ยังไม่มีรูปภาพหลักของสถานประกอบการ</small>
                  </div>
                )}

                {allImages.length > 1 && (
                  <button
                    type="button"
                    className="hub-detail-showcase__gallery-badge"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex(0);
                    }}
                  >
                    <ImageIcon size={15} />
                    <span>ดูรูปภาพทั้งหมด ({allImages.length})</span>
                  </button>
                )}
              </div>

              {/* QUICK HIGHLIGHT BAR */}
              <div className="hub-detail-highlights-bar">
                <div className="hub-detail-highlight-item">
                  <div className="hub-detail-highlight-item__icon">
                    <MapPin />
                  </div>
                  <div>
                    <small>พื้นที่ / อำเภอที่ตั้ง</small>
                    <strong>{hub.districtName ? `อ.${hub.districtName}` : "เชียงใหม่"}</strong>
                  </div>
                </div>

                <div className="hub-detail-highlight-item">
                  <div className="hub-detail-highlight-item__icon">
                    <Clock3 />
                  </div>
                  <div>
                    <small>เวลาทำการวันนี้</small>
                    <strong>
                      {openStatus.is24
                        ? "เปิดตลอด 24 ชั่วโมง"
                        : openStatus.todayTime || openStatus.label}
                    </strong>
                  </div>
                </div>

                <div className="hub-detail-highlight-item">
                  <div className="hub-detail-highlight-item__icon">
                    <ShieldCheck />
                  </div>
                  <div>
                    <small>มาตรฐานความปลอดภัย</small>
                    <strong>
                      {certificateTypes.length > 0
                        ? `${certificateTypes.length} รายการรับรอง`
                        : "ตรวจยืนยันแล้ว"}
                    </strong>
                  </div>
                </div>
              </div>
            </section>

            {/* ABOUT SECTION */}
            {hasValue(hub.wellnessHubDescription) && (
              <section className="hub-detail-card hub-detail-card--about">
                <div className="hub-detail-card__header">
                  <div className="hub-detail-card__title-group">
                    <span className="hub-detail-card__eyebrow">ABOUT THIS VENUE</span>
                    <h2>เกี่ยวกับสถานประกอบการ</h2>
                  </div>
                </div>

                <div className="hub-detail-about__content">
                  <p className="hub-detail-description">
                    {hub.wellnessHubDescription}
                  </p>
                </div>
              </section>
            )}

            {/* ATMOSPHERE / PHOTO GALLERY */}
            <section className="hub-detail-card hub-detail-card--gallery">
              <div className="hub-detail-card__header">
                <div className="hub-detail-card__title-group">
                  <span className="hub-detail-card__eyebrow">PHOTO GALLERY</span>
                  <h2>
                    รูปภาพบรรยากาศ {galleryImages.length > 0 ? `(${galleryImages.length} รูป)` : ""}
                  </h2>
                </div>
                {galleryImages.length > 0 && (
                  <span className="hub-detail-card__hint">
                    คลิกที่รูปภาพเพื่อเปิดดูขนาดเต็ม
                  </span>
                )}
              </div>

              {galleryImages.length > 0 ? (
                <div className="hub-detail-gallery-grid">
                  {galleryImages.map((src, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="hub-detail-gallery-thumb"
                      onClick={() => openLightboxAtImage(src)}
                      aria-label={`ดูรูปบรรยากาศที่ ${idx + 1}`}
                    >
                      <img
                        src={src}
                        alt={`ภาพบรรยากาศ ${idx + 1} - ${hub.wellnessHubName}`}
                        loading="lazy"
                      />
                      <div className="hub-detail-gallery-thumb__hover">
                        <Eye size={20} />
                        <span>ขยายรูป</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="hub-detail-gallery-empty">
                  <div className="hub-detail-gallery-empty__icon">
                    <ImageIcon size={26} />
                  </div>
                  <p>ยังไม่มีรูปภาพบรรยากาศเพิ่มเติมสำหรับสถานประกอบการนี้</p>
                </div>
              )}
            </section>

            {/* LOCATION & INTERACTIVE MAP */}
            {coordinatesAvailable && (
              <section className="hub-detail-card hub-detail-card--map">
                <div className="hub-detail-card__header">
                  <div className="hub-detail-card__title-group">
                    <span className="hub-detail-card__eyebrow">LOCATION & MAP</span>
                    <h2>ตำแหน่งที่ตั้งและการเดินทาง</h2>
                  </div>

                  {Boolean(navigationUrl && navigationUrl !== "#") && (
                    <a
                      href={navigationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hub-detail-map-btn"
                      title="เปิดนำทางใน Google Maps จากตำแหน่งของคุณ"
                    >
                      <Navigation size={15} />
                      เปิดใน Google Maps
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>

                <div className="hub-detail-map-box">
                  <MapContainer
                    center={mapPosition}
                    zoom={15}
                    scrollWheelZoom={true}
                    touchZoom={true}
                    doubleClickZoom={true}
                    className="hub-detail-leaflet-map"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      opacity={0.78}
                    />
                    <Marker position={mapPosition} icon={markerIcon}>
                      <Popup className="route-hub-leaflet-popup">
                        <div className="route-hub-popup">
                          <div className="route-hub-popup__image">
                            {imageSource && !imageError ? (
                              <img
                                src={imageSource}
                                alt={hub.wellnessHubName}
                                loading="lazy"
                                onError={() => setImageError(true)}
                              />
                            ) : (
                              <div
                                className="route-hub-popup__image-fallback"
                                style={{
                                  display: "flex",
                                  "--popup-category-color": catInfo.color,
                                  "--popup-category-background": `${catInfo.color}18`,
                                }}
                              >
                                <span className="route-hub-popup__image-fallback-icon">
                                  <i className={`fa-solid ${catInfo.icon}`}></i>
                                </span>
                                <span className="route-hub-popup__image-fallback-text">
                                  {catInfo.name}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="route-hub-popup__content">
                            {hasValue(catInfo.name) && (
                              <div className="route-hub-popup__category">
                                <span
                                  className="route-hub-popup__category-dot"
                                  style={{ background: catInfo.color }}
                                />
                                <span>{catInfo.name}</span>
                              </div>
                            )}
                            <h3 className="route-hub-popup__title">
                              {hub.wellnessHubName}
                            </h3>
                            <div className="route-hub-popup__meta">
                              {hasValue(hub.address) && (
                                <div className="route-hub-popup__meta-row route-hub-popup__meta-row--address">
                                  <span className="route-hub-popup__meta-icon">
                                    <MapPin size={12} />
                                  </span>
                                  <span>{hub.address}</span>
                                </div>
                              )}
                              {hasValue(hub.telInformation) && (
                                <div className="route-hub-popup__meta-row">
                                  <span className="route-hub-popup__meta-icon">
                                    <Phone size={12} />
                                  </span>
                                  <span>{hub.telInformation}</span>
                                </div>
                              )}
                            </div>
                            {Boolean(navigationUrl && navigationUrl !== "#") && (
                              <a
                                href={navigationUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="route-hub-popup__button"
                                style={{ textDecoration: "none" }}
                              >
                                <span>เปิดนำทางใน Google Maps</span>
                                <Navigation size={14} />
                              </a>
                            )}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>

                <div className="hub-detail-location-bar">
                  <div className="hub-detail-location-bar__info">
                    <MapPin size={18} />
                    <p>{hub.address || `อำเภอ${hub.districtName} จังหวัดเชียงใหม่`}</p>
                  </div>

                  {hasValue(hub.address) && (
                    <button
                      type="button"
                      className="hub-detail-copy-address"
                      onClick={handleCopyAddress}
                      title="คัดลอกที่อยู่"
                    >
                      {copiedAddress ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedAddress ? "คัดลอกแล้ว" : "คัดลอกที่อยู่"}</span>
                    </button>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT COLUMN: STICKY SIDEBAR */}
          <aside className="hub-detail-sidebar">
            {/* QUICK CONTACT CARD */}
            {(hasValue(hub.telInformation) ||
              hasValue(hub.contactInformation) ||
              hasValue(hub.address)) && (
                <div className="hub-detail-sidecard hub-detail-sidecard--contact">
                  <div className="hub-detail-sidecard__header">
                    <h3>ข้อมูลติดต่อ</h3>
                    <p>ช่องทางติดต่อสถานประกอบการ</p>
                  </div>

                  <div className="hub-detail-contact-list">
                    {/* TELEPHONE */}
                    {hasValue(hub.telInformation) && (
                      <div className="hub-detail-contact-row">
                        <div className="hub-detail-contact-row__icon">
                          <Phone size={18} />
                        </div>
                        <div className="hub-detail-contact-row__body">
                          <small>เบอร์โทรศัพท์ติดต่อ</small>
                          <p>{hub.telInformation}</p>
                        </div>
                      </div>
                    )}

                    {/* CONTACT INFO / EMAIL */}
                    {hasValue(hub.contactInformation) && (
                      <div className="hub-detail-contact-row">
                        <div className="hub-detail-contact-row__icon">
                          <Mail size={18} />
                        </div>
                        <div className="hub-detail-contact-row__body">
                          <small>ช่องทางติดต่อเพิ่มเติม / อีเมล</small>
                          <p>{hub.contactInformation}</p>
                        </div>
                      </div>
                    )}

                    {/* ADDRESS */}
                    {hasValue(hub.address) && (
                      <div className="hub-detail-contact-row">
                        <div className="hub-detail-contact-row__icon">
                          <MapPin size={18} />
                        </div>
                        <div className="hub-detail-contact-row__body">
                          <small>ที่อยู่</small>
                          <p>{hub.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* OPERATING HOURS CARD */}
            {operatingHours.length > 0 && (
              <div className="hub-detail-sidecard hub-detail-sidecard--hours">
                <div className="hub-detail-sidecard__header">
                  <div className="hub-detail-sidecard__title-flex">
                    <Clock3 size={18} />
                    <h3>เวลาเปิดให้บริการ</h3>
                  </div>
                  <span
                    className={`hub-detail-badge ${openStatus.isOpen ? "hub-detail-badge--open" : "hub-detail-badge--closed"
                      }`}
                  >
                    {openStatus.label}
                  </span>
                </div>

                <div className="hub-detail-schedule">
                  {operatingHours.map((item) => {
                    const isToday =
                      item.day ===
                      [
                        "sunday",
                        "monday",
                        "tuesday",
                        "wednesday",
                        "thursday",
                        "friday",
                        "saturday",
                      ][new Date().getDay()];

                    const is24Hours =
                      item.active &&
                      item.open === "00:00" &&
                      (item.close === "23:59" ||
                        item.close === "24:00" ||
                        item.close === "00:00");

                    return (
                      <div
                        key={item.day}
                        className={`hub-detail-schedule__row ${isToday ? "hub-detail-schedule__row--today" : ""
                          } ${!item.active ? "hub-detail-schedule__row--inactive" : ""}`}
                      >
                        <div className="hub-detail-schedule__day">
                          <span>{item.label}</span>
                          {isToday && <span className="hub-today-pill">วันนี้</span>}
                        </div>

                        <div className="hub-detail-schedule__time">
                          {!item.active ? (
                            <span className="hub-text-closed">ปิดบริการ</span>
                          ) : is24Hours ? (
                            <span className="hub-text-24h">เปิด 24 ชั่วโมง</span>
                          ) : (
                            <span>
                              {item.open} – {item.close} น.
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CERTIFICATE & STANDARD CARD */}
            {certificateTypes.length > 0 && (
              <div className="hub-detail-sidecard hub-detail-sidecard--certs">
                <div className="hub-detail-sidecard__header">
                  <div className="hub-detail-sidecard__title-flex">
                    <ShieldCheck size={18} />
                    <h3>ใบรับรองมาตรฐานเวลเนส</h3>
                  </div>
                  <p>ผ่านการรับรองคุณภาพมาตรฐาน ({certificateTypes.length} รายการ)</p>
                </div>

                <div className="hub-detail-cert-list">
                  {certificateTypes.map((cert, index) => (
                    <div key={`${cert}-${index}`} className="hub-detail-cert-item">
                      <div className="hub-detail-cert-bullet">
                        <Check size={13} strokeWidth={2.6} />
                      </div>
                      <span className="hub-detail-cert-text">{cert}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {lightboxIndex !== null && allImages.length > 0 && (
        <div
          className="hub-lightbox"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="รูปภาพขนาดเต็ม"
        >
          {/* CLOSE BUTTON */}
          <button
            type="button"
            className="hub-lightbox__close"
            onClick={() => setLightboxIndex(null)}
            aria-label="ปิด"
          >
            <X size={24} />
          </button>

          {/* COUNTER & TITLE */}
          <div className="hub-lightbox__header" onClick={(e) => e.stopPropagation()}>
            <span className="hub-lightbox__title">{hub.wellnessHubName}</span>
            <span className="hub-lightbox__count">
              {lightboxIndex + 1} / {allImages.length}
            </span>
          </div>

          {/* PREV BUTTON */}
          {allImages.length > 1 && (
            <button
              type="button"
              className="hub-lightbox__nav hub-lightbox__nav--prev"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(
                  (prev) => (prev - 1 + allImages.length) % allImages.length,
                );
              }}
              aria-label="รูปก่อนหน้า"
            >
              <ChevronLeft size={30} />
            </button>
          )}

          {/* MAIN LIGHTBOX IMAGE */}
          <div
            className="hub-lightbox__content"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={allImages[lightboxIndex]}
              alt={`${hub.wellnessHubName} ${lightboxIndex + 1}`}
            />
          </div>

          {/* NEXT BUTTON */}
          {allImages.length > 1 && (
            <button
              type="button"
              className="hub-lightbox__nav hub-lightbox__nav--next"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) => (prev + 1) % allImages.length);
              }}
              aria-label="รูปถัดไป"
            >
              <ChevronRight size={30} />
            </button>
          )}

          {/* THUMBNAIL STRIP */}
          {allImages.length > 1 && (
            <div
              className="hub-lightbox__thumbs"
              onClick={(e) => e.stopPropagation()}
            >
              {allImages.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  className={`hub-lightbox__thumb ${i === lightboxIndex ? "hub-lightbox__thumb--active" : ""
                    }`}
                  onClick={() => setLightboxIndex(i)}
                >
                  <img src={src} alt={`Thumbnail ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
