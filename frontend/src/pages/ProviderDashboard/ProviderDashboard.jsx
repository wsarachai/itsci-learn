// src/pages/ProviderDashboard/ProviderDashboard.jsx

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { clearWellnessHubCache } from "../ListWellnesshub/ListWellnesshub";
import { clearDashboardCache } from "../Dashboard/Dashboard";

import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock3,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  ImageIcon,
  KeyRound,
  LoaderCircle,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  UserRound,
  X,
  ZoomIn,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import LoadingState from "../../Components/LoadingState/LoadingState";
import "./ProviderDashboard.css";

const API_BASE_URL = "/api";

const DAYS = [
  {
    key: "monday",
    label: "วันจันทร์",
  },
  {
    key: "tuesday",
    label: "วันอังคาร",
  },
  {
    key: "wednesday",
    label: "วันพุธ",
  },
  {
    key: "thursday",
    label: "วันพฤหัสบดี",
  },
  {
    key: "friday",
    label: "วันศุกร์",
  },
  {
    key: "saturday",
    label: "วันเสาร์",
  },
  {
    key: "sunday",
    label: "วันอาทิตย์",
  },
];

function createEmptyOperatingHours() {
  return DAYS.reduce((result, day) => {
    result[day.key] = {
      active: false,
      open: "",
      close: "",
    };

    return result;
  }, {});
}

function hasValue(value) {
  if (value === null || value === undefined) {
    return false;
  }

  const normalizedValue = String(value).trim().toLowerCase();

  return (
    normalizedValue !== "" &&
    normalizedValue !== "null" &&
    normalizedValue !== "undefined"
  );
}

function displayValue(value) {
  return hasValue(value) ? String(value) : "-";
}

function formatThaiDateTime(dateString) {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return (
      date.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " น."
    );
  } catch (error) {
    return "-";
  }
}

function normalizeCertificate(value) {
  if (!hasValue(value)) {
    return "";
  }

  if (Array.isArray(value)) {
    return value[0] || "";
  }

  const normalizedValue = String(value).trim();

  try {
    const parsedValue = JSON.parse(normalizedValue);

    if (Array.isArray(parsedValue)) {
      return parsedValue[0] || "";
    }

    return normalizedValue;
  } catch (error) {
    return normalizedValue;
  }
}

function normalizeCertificateList(value) {
  if (!hasValue(value)) {
    return [];
  }

  let parsed = value;

  if (typeof value === "string") {
    const trimmed = value.trim();
    try {
      parsed = JSON.parse(trimmed);
    } catch (e) {
      if (trimmed.includes(",")) {
        parsed = trimmed
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      } else {
        parsed = [trimmed];
      }
    }
  }

  if (!Array.isArray(parsed)) {
    parsed = [parsed];
  }

  return parsed.map((item) => String(item).trim()).filter(Boolean);
}

function parseOperatingHours(value) {
  const defaultHours = createEmptyOperatingHours();

  if (!hasValue(value)) {
    return defaultHours;
  }

  let parsedValue = value;

  if (typeof value === "string") {
    try {
      parsedValue = JSON.parse(value);
    } catch (error) {
      return defaultHours;
    }
  }

  if (
    !parsedValue ||
    typeof parsedValue !== "object" ||
    Array.isArray(parsedValue)
  ) {
    return defaultHours;
  }

  DAYS.forEach((day) => {
    const currentDay = parsedValue[day.key];

    if (!currentDay) {
      return;
    }

    defaultHours[day.key] = {
      active: Boolean(currentDay.active),
      open: currentDay.open || "",
      close: currentDay.close || "",
    };
  });

  return defaultHours;
}

function checkIs24Hours(hours) {
  if (!hours || typeof hours !== "object") return false;
  return DAYS.every((day) => {
    const d = hours[day.key];
    return (
      d &&
      Boolean(d.active) &&
      d.open === "00:00" &&
      (d.close === "23:59" || d.close === "24:00" || d.close === "00:00")
    );
  });
}

function normalizeImageSource(value) {
  if (!hasValue(value)) {
    return "";
  }

  let normalizedValue = value;

  if (typeof normalizedValue === "string") {
    const trimmedValue = normalizedValue.trim();

    try {
      const parsedValue = JSON.parse(trimmedValue);

      normalizedValue = Array.isArray(parsedValue)
        ? parsedValue[0] || ""
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
        parsed = trimmed
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      } else {
        parsed = [trimmed];
      }
    }
  }

  if (!Array.isArray(parsed)) {
    parsed = [parsed];
  }

  return parsed
    .map((item) => {
      if (!item) return "";
      return normalizeImageSource(item);
    })
    .filter((src) => hasValue(src));
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error("ไม่สามารถอ่านไฟล์รูปภาพได้"));
    };

    reader.readAsDataURL(file);
  });
}

function isGoogleMapsUrl(value) {
  if (!hasValue(value)) {
    return false;
  }

  try {
    const parsedUrl = new URL(String(value).trim());

    const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, "");

    const allowedHosts = [
      "google.com",
      "maps.google.com",
      "maps.app.goo.gl",
      "goo.gl",
    ];

    return allowedHosts.some((allowedHost) => {
      return hostname === allowedHost || hostname.endsWith(`.${allowedHost}`);
    });
  } catch (error) {
    return false;
  }
}

function parseLatLngFromGoogleMapsLink(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();

  const isValidLatLng = (lat, lng) =>
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= 17.0 &&
    lat <= 20.5 &&
    lng >= 98.0 &&
    lng <= 100.0;

  // 1. หมุดสถานที่จริงใน Google Maps (!3d ละติจูด, !4d ลองจิจูด) - เอาคู่สุดท้ายที่เป็นหมุดสถานที่ปลายทางจริง
  const placeMatches = [
    ...trimmed.matchAll(/!3d(-?\d+(?:\.\d+)?)[^!]*!4d(-?\d+(?:\.\d+)?)/g),
  ];
  if (placeMatches.length > 0) {
    const lastMatch = placeMatches[placeMatches.length - 1];
    const lat = parseFloat(lastMatch[1]);
    const lng = parseFloat(lastMatch[2]);
    if (isValidLatLng(lat, lng)) {
      return { lat, lng };
    }
  }

  // 2. Query พิกัดระบุตรงๆ เช่น ?q=lat,lng หรือ ?query=lat,lng หรือ ?ll=lat,lng
  const qMatches = [
    ...trimmed.matchAll(
      /[?&](?:q|query|ll|destination|daddr)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g,
    ),
  ];
  if (qMatches.length > 0) {
    const lastQ = qMatches[qMatches.length - 1];
    const lat = parseFloat(lastQ[1]);
    const lng = parseFloat(lastQ[2]);
    if (isValidLatLng(lat, lng)) {
      return { lat, lng };
    }
  }

  // 3. Fallback: พิกัดกึ่งกลางกล้อง/หน้าจอ (@lat,lng)
  const atMatch = trimmed.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (isValidLatLng(lat, lng)) {
      return { lat, lng };
    }
  }

  // 4. Direction/Search path พิกัดปลายทาง
  const dirMatch =
    trimmed.match(
      /\/(?:dir|search)\/[^/]*\/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    ) || trimmed.match(/\/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (dirMatch) {
    const lat = parseFloat(dirMatch[1]);
    const lng = parseFloat(dirMatch[2]);
    if (isValidLatLng(lat, lng)) {
      return { lat, lng };
    }
  }

  return null;
}

function getErrorMessage(error) {
  if (error.code === "ECONNABORTED") {
    return "ระบบใช้เวลาตอบสนองนานเกินไป กรุณาลองใหม่อีกครั้ง";
  }

  if (typeof error.response?.data === "string") {
    return error.response.data;
  }

  return (
    error.response?.data?.message ||
    error.message ||
    "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"
  );
}

export default function ProviderDashboard() {
  const navigate = useNavigate();

  const [provider, setProvider] = useState(null);
  const [hub, setHub] = useState(null);

  const [categories, setCategories] = useState([]);
  const [districts, setDistricts] = useState([]);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    wellnessHubName: "",
    categoryId: "",
    certificateType: "",
    contactInformation: "",
    telInformation: "",
    wellnessHubDescription: "",
    address: "",
    districtId: "",
    googleMapsLink: "",
    wellnessHubLatitude: "",
    wellnessHubLongitude: "",
    wellnessHubImg: "",
    wellnessHubGallery: [],
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  // Change Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalData, setPasswordModalData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordModalErrors, setPasswordModalErrors] = useState({});
  const [passwordModalSubmitting, setPasswordModalSubmitting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const handleOpenPasswordModal = () => {
    setPasswordModalData({ newPassword: "", confirmPassword: "" });
    setPasswordModalErrors({});
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
    setShowPasswordModal(true);
  };

  const handleClosePasswordModal = () => {
    if (passwordModalSubmitting) return;
    setShowPasswordModal(false);
    setPasswordModalData({ newPassword: "", confirmPassword: "" });
    setPasswordModalErrors({});
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    const newPass = passwordModalData.newPassword ? passwordModalData.newPassword.trim() : "";
    const confirmPass = passwordModalData.confirmPassword ? passwordModalData.confirmPassword.trim() : "";
    const errors = {};

    if (!newPass) {
      errors.newPassword = "กรุณากรอกรหัสผ่านใหม่";
    } else if (/\s/.test(newPass)) {
      errors.newPassword = "รหัสผ่านต้องไม่มีช่องว่าง";
    } else if (newPass.length !== 8) {
      errors.newPassword = "รหัสผ่านต้องมีความยาว 8 ตัวอักษรเท่านั้น";
    }

    if (!confirmPass) {
      errors.confirmPassword = "กรุณายืนยันรหัสผ่านใหม่อีกครั้ง";
    } else if (newPass !== confirmPass) {
      errors.confirmPassword = "รหัสผ่านยืนยันไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง";
    }

    if (Object.keys(errors).length > 0) {
      setPasswordModalErrors(errors);
      return;
    }

    setPasswordModalSubmitting(true);
    setPasswordModalErrors({});

    try {
      const payload = {
        licenseId: hub?.licenseId || licenseId,
        wellnessHubName: formData.wellnessHubName || hub?.wellnessHubName,
        address: formData.address || hub?.address,
        telInformation: formData.telInformation || hub?.telInformation,
        googleMapsLink: formData.googleMapsLink || hub?.googleMapsLink || "#",
        password: newPass,
      };

      await axios.put(`${API_BASE_URL}/wellness-hubs/${licenseId}`, payload, {
        timeout: 30000,
        withCredentials: true,
      });

      setHub((prev) => ({ ...prev, password: newPass }));
      setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));

      // ป้องกันความปลอดภัย: ไม่บันทึกรหัสผ่านลงใน localStorage และลบออกหากเคยมีตกค้าง
      const savedProvider = localStorage.getItem("wellnessProvider");
      if (savedProvider) {
        try {
          const parsed = JSON.parse(savedProvider);
          if (parsed && parsed.password) {
            delete parsed.password;
            localStorage.setItem("wellnessProvider", JSON.stringify(parsed));
          }
        } catch (_) {}
      }

      clearWellnessHubCache();
      clearDashboardCache();

      setShowPasswordModal(false);
      setToast({
        type: "success",
        title: "เปลี่ยนรหัสผ่านสำเร็จ",
        message: "ระบบได้ทำการอัปเดตรหัสผ่านใหม่สำหรับเข้าสู่ระบบเรียบร้อยแล้ว",
      });
    } catch (err) {
      console.error("Change password error:", err);
      setPasswordModalErrors({
        submit: getErrorMessage(err) || "ไม่สามารถเปลี่ยนรหัสผ่านได้ กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setPasswordModalSubmitting(false);
    }
  };

  // State สำหรับจัดการรายการใบรับรอง 1 ใบต่อ 1 ช่อง
  const [certificateList, setCertificateList] = useState([""]);

  const handleCertChange = (index, value) => {
    setCertificateList((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addCertField = () => {
    setCertificateList((prev) => [...prev, ""]);
  };

  const removeCertField = (index) => {
    setCertificateList((prev) => {
      if (prev.length <= 1) return [""];
      return prev.filter((_, i) => i !== index);
    });
  };

  const [is24Hours, setIs24Hours] = useState(false);
  const [operatingHours, setOperatingHours] = useState(
    createEmptyOperatingHours(),
  );
  const [scheduleMode, setScheduleMode] = useState("same"); // 'same' | 'custom' | '24hours'
  const [sameOpenTime, setSameOpenTime] = useState("09:00");
  const [sameCloseTime, setSameCloseTime] = useState("18:00");

  const [imagePreview, setImagePreview] = useState("");
  const [imageFileName, setImageFileName] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [loadError, setLoadError] = useState("");
  const [formErrors, setFormErrors] = useState({});

  const [toast, setToast] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Lightbox modal state สำหรับขยายดูรูป
  const [lightboxImage, setLightboxImage] = useState(null);

  const licenseId = useMemo(() => {
    const storedLicenseId =
      provider?.licenseId || localStorage.getItem("wellnessProviderLicenseId");

    if (!storedLicenseId) {
      return null;
    }

    return String(storedLicenseId).trim();
  }, [provider]);

  const selectedCategory = useMemo(() => {
    return categories.find(
      (category) => String(category.categoryId) === String(formData.categoryId),
    );
  }, [categories, formData.categoryId]);

  const selectedDistrict = useMemo(() => {
    return districts.find(
      (district) => String(district.districtId) === String(formData.districtId),
    );
  }, [districts, formData.districtId]);

  const categoryName =
    selectedCategory?.categoryName || hub?.category?.categoryName || "-";

  const districtName =
    selectedDistrict?.districtName || hub?.district?.districtName || "-";

  const activeOperatingDays = useMemo(() => {
    return DAYS.filter((day) => operatingHours[day.key]?.active);
  }, [operatingHours]);

  const showToast = useCallback((type, message) => {
    setToast({
      type,
      message,
    });

    window.setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  const clearProviderSession = useCallback(() => {
    localStorage.removeItem("wellnessProvider");
    localStorage.removeItem("wellnessProviderLicenseId");
    localStorage.removeItem("wellnessProviderName");
  }, []);

  useEffect(() => {
    const storedProvider = localStorage.getItem("wellnessProvider");

    if (!storedProvider) {
      navigate("/provider/login", {
        replace: true,
      });

      return;
    }

    try {
      const parsedProvider = JSON.parse(storedProvider);

      // เคลียร์รหัสผ่านตกค้างใน storage ถ้ามี
      if (parsedProvider?.password) {
        delete parsedProvider.password;
        localStorage.setItem("wellnessProvider", JSON.stringify(parsedProvider));
      }

      const isActive =
        String(parsedProvider?.status || "").toUpperCase() === "ACTIVE";

      if (!parsedProvider?.licenseId || !isActive) {
        clearProviderSession();

        navigate("/provider/login", {
          replace: true,
        });

        return;
      }

      setProvider(parsedProvider);
    } catch (error) {
      clearProviderSession();

      navigate("/provider/login", {
        replace: true,
      });
    }
  }, [clearProviderSession, navigate]);

  const mapHubToForm = useCallback((hubData) => {
    const gallery = normalizeGalleryImages(hubData.wellnessHubGallery);
    const mainImg = normalizeImageSource(hubData.wellnessHubImg);
    const certList = normalizeCertificateList(hubData.certificateType);

    setCertificateList(certList.length > 0 ? certList : [""]);

    setFormData({
      username: hubData.username || "",
      password: "",
      confirmPassword: "",

      wellnessHubName: hubData.wellnessHubName || "",

      categoryId: hubData.category?.categoryId || hubData.categoryId || "",

      certificateType: normalizeCertificate(hubData.certificateType),

      contactInformation: hubData.contactInformation || "",

      telInformation: hubData.telInformation || hubData.tellInformation || "",

      wellnessHubDescription: hubData.wellnessHubDescription || "",

      address: hubData.address || "",

      districtId: hubData.district?.districtId || hubData.districtId || "",

      googleMapsLink: hubData.googleMapsLink || "",

      wellnessHubLatitude:
        hubData.wellnessHubLatitude ?? hubData.latitude ?? "",

      wellnessHubLongitude:
        hubData.wellnessHubLongitude ?? hubData.longitude ?? "",

      wellnessHubImg: mainImg,
      wellnessHubGallery: gallery,
    });

    const parsedHours = parseOperatingHours(hubData.operatingHours);
    setOperatingHours(parsedHours);
    const is24 = checkIs24Hours(parsedHours);
    setIs24Hours(is24);

    const activeDays = DAYS.map((d) => parsedHours[d.key]).filter((d) => d && d.active);
    let detectedMode = "same";
    if (is24) {
      detectedMode = "24hours";
    } else if (activeDays.length > 0) {
      const firstOpen = activeDays[0].open;
      const firstClose = activeDays[0].close;
      const allSame = activeDays.every((d) => d.open === firstOpen && d.close === firstClose);
      detectedMode = allSame ? "same" : "custom";
      if (firstOpen) setSameOpenTime(firstOpen);
      if (firstClose) setSameCloseTime(firstClose);
    } else {
      detectedMode = "same";
      setSameOpenTime("09:00");
      setSameCloseTime("18:00");
    }
    setScheduleMode(detectedMode);

    setImagePreview(mainImg);

    setImageFileName("");
  }, []);

  const loadDashboardData = useCallback(async () => {
    if (!licenseId) {
      return;
    }

    setLoading(true);
    setLoadError("");

    try {
      const [hubResponse, categoryResponse, districtResponse] =
        await Promise.all([
          axios.get(`${API_BASE_URL}/wellness-hubs/${licenseId}`, {
            timeout: 30000,
            withCredentials: true,
          }),

          axios.get(`${API_BASE_URL}/categories`, {
            timeout: 30000,
          }),

          axios.get(`${API_BASE_URL}/districts`, {
            timeout: 30000,
          }),
        ]);

      if (!hubResponse.data) {
        throw new Error("ไม่พบข้อมูลสถานประกอบการ");
      }

      setHub(hubResponse.data);
      mapHubToForm(hubResponse.data);

      setCategories(
        Array.isArray(categoryResponse.data) ? categoryResponse.data : [],
      );

      setDistricts(
        Array.isArray(districtResponse.data) ? districtResponse.data : [],
      );
    } catch (error) {
      console.error("Load provider dashboard error:", error);

      setLoadError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [licenseId, mapHubToForm]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setFormErrors((previousErrors) => ({
      ...previousErrors,
      [name]: "",
    }));
  };

  const handle24HoursToggle = (enabled) => {
    setIs24Hours(enabled);
    if (enabled) {
      const all24Hours = DAYS.reduce((result, day) => {
        result[day.key] = {
          active: true,
          open: "00:00",
          close: "23:59",
        };
        return result;
      }, {});
      setOperatingHours(all24Hours);
    } else {
      setOperatingHours(createEmptyOperatingHours());
    }
    setFormErrors((previousErrors) => ({
      ...previousErrors,
      operatingHours: "",
    }));
  };

  const handleScheduleModeChange = (mode) => {
    setScheduleMode(mode);
    if (mode === "24hours") {
      setIs24Hours(true);
      const all24Hours = DAYS.reduce((result, day) => {
        result[day.key] = {
          active: true,
          open: "00:00",
          close: "23:59",
        };
        return result;
      }, {});
      setOperatingHours(all24Hours);
    } else {
      setIs24Hours(false);
      if (mode === "same") {
        setOperatingHours((prev) => {
          const updated = { ...prev };
          let anyActive = false;
          DAYS.forEach((d) => {
            if (updated[d.key]?.active) {
              anyActive = true;
              updated[d.key] = {
                ...updated[d.key],
                open: sameOpenTime || "09:00",
                close: sameCloseTime || "18:00",
              };
            }
          });
          if (!anyActive) {
            ["monday", "tuesday", "wednesday", "thursday", "friday"].forEach((key) => {
              updated[key] = {
                active: true,
                open: sameOpenTime || "09:00",
                close: sameCloseTime || "18:00",
              };
            });
          }
          return updated;
        });
      }
    }
    setFormErrors((prev) => ({ ...prev, operatingHours: "" }));
  };

  const handleSameDayToggle = (dayKey) => {
    setOperatingHours((prev) => {
      const isCurrentlyActive = Boolean(prev[dayKey]?.active);
      const nextActive = !isCurrentlyActive;
      return {
        ...prev,
        [dayKey]: {
          active: nextActive,
          open: nextActive ? sameOpenTime || "09:00" : "",
          close: nextActive ? sameCloseTime || "18:00" : "",
        },
      };
    });
    setFormErrors((prev) => ({ ...prev, operatingHours: "" }));
  };

  const handleSameTimeChange = (field, value) => {
    if (field === "open") setSameOpenTime(value);
    if (field === "close") setSameCloseTime(value);

    setOperatingHours((prev) => {
      const updated = { ...prev };
      DAYS.forEach((d) => {
        if (updated[d.key]?.active) {
          updated[d.key] = {
            ...updated[d.key],
            [field]: value,
          };
        }
      });
      return updated;
    });
    setFormErrors((prev) => ({ ...prev, operatingHours: "" }));
  };

  const handleSameQuickPreset = (preset) => {
    const open = sameOpenTime || "09:00";
    const close = sameCloseTime || "18:00";

    setOperatingHours((prev) => {
      const updated = { ...prev };
      DAYS.forEach((d) => {
        if (preset === "weekdays") {
          const isWk = ["monday", "tuesday", "wednesday", "thursday", "friday"].includes(d.key);
          updated[d.key] = {
            active: isWk,
            open: isWk ? open : "",
            close: isWk ? close : "",
          };
        } else if (preset === "all") {
          updated[d.key] = {
            active: true,
            open: open,
            close: close,
          };
        } else if (preset === "weekends") {
          const isWe = ["saturday", "sunday"].includes(d.key);
          updated[d.key] = {
            active: isWe,
            open: isWe ? open : "",
            close: isWe ? close : "",
          };
        }
      });
      return updated;
    });
    setFormErrors((prev) => ({ ...prev, operatingHours: "" }));
  };

  const handleDayToggle = (dayKey) => {
    setOperatingHours((previousHours) => {
      const currentDay = previousHours[dayKey];
      const nextActive = !currentDay.active;

      return {
        ...previousHours,
        [dayKey]: {
          active: nextActive,
          open: nextActive ? currentDay.open || "09:00" : "",
          close: nextActive ? currentDay.close || "18:00" : "",
        },
      };
    });

    setFormErrors((previousErrors) => ({
      ...previousErrors,
      operatingHours: "",
    }));
  };

  const handleTimeChange = (dayKey, field, value) => {
    setOperatingHours((previousHours) => ({
      ...previousHours,
      [dayKey]: {
        ...previousHours[dayKey],
        [field]: value,
      },
    }));

    setFormErrors((previousErrors) => ({
      ...previousErrors,
      operatingHours: "",
    }));
  };

  const handleImageChange = async (event) => {
    const selectedFile = event.target.files?.[0];

    event.target.value = "";

    if (!selectedFile) {
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];

    if (!allowedTypes.includes(selectedFile.type)) {
      setFormErrors((previousErrors) => ({
        ...previousErrors,
        wellnessHubImg: "ต้องเป็นไฟล์รูปภาพนามสกุล .png, .jpg และ .jpeg เท่านั้น",
      }));

      return;
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      setFormErrors((previousErrors) => ({
        ...previousErrors,
        wellnessHubImg: "รูปภาพต้องมีขนาดไม่เกิน 20 MB",
      }));

      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(selectedFile);

      setFormData((previousData) => ({
        ...previousData,
        wellnessHubImg: dataUrl,
      }));

      setImagePreview(dataUrl);
      setImageFileName(selectedFile.name);

      setFormErrors((previousErrors) => ({
        ...previousErrors,
        wellnessHubImg: "",
      }));
    } catch (error) {
      setFormErrors((previousErrors) => ({
        ...previousErrors,
        wellnessHubImg: "ไม่สามารถอ่านรูปภาพที่เลือกได้",
      }));
    }
  };

  const removeImage = () => {
    setFormData((previousData) => ({
      ...previousData,
      wellnessHubImg: "",
    }));

    setImagePreview("");
    setImageFileName("");

    setFormErrors((previousErrors) => ({
      ...previousErrors,
      wellnessHubImg: "",
    }));
  };

  const handleGalleryChange = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    event.target.value = "";

    if (selectedFiles.length === 0) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];

    const newImages = [];

    for (const file of selectedFiles) {
      if (!allowedTypes.includes(file.type)) {
        setFormErrors((previousErrors) => ({
          ...previousErrors,
          wellnessHubGallery: "ต้องเป็นไฟล์รูปภาพนามสกุล .png, .jpg และ .jpeg เท่านั้น",
        }));

        continue;
      }

      if (file.size > 20 * 1024 * 1024) {
        setFormErrors((previousErrors) => ({
          ...previousErrors,
          wellnessHubGallery: "รูปภาพต้องมีขนาดไม่เกิน 20 MB ต่อรูป",
        }));

        continue;
      }

      try {
        const dataUrl = await readFileAsDataUrl(file);
        newImages.push(dataUrl);
      } catch (error) {
        setFormErrors((previousErrors) => ({
          ...previousErrors,
          wellnessHubGallery: "ไม่สามารถอ่านรูปภาพที่เลือกได้",
        }));
      }
    }

    if (newImages.length > 0) {
      setFormData((previousData) => ({
        ...previousData,
        wellnessHubGallery: [
          ...(Array.isArray(previousData.wellnessHubGallery)
            ? previousData.wellnessHubGallery
            : []),
          ...newImages,
        ],
      }));

      setFormErrors((previousErrors) => ({
        ...previousErrors,
        wellnessHubGallery: "",
      }));
    }
  };

  const removeGalleryImage = (index) => {
    setFormData((previousData) => {
      const arr = Array.isArray(previousData.wellnessHubGallery)
        ? [...previousData.wellnessHubGallery]
        : [];

      arr.splice(index, 1);

      return {
        ...previousData,
        wellnessHubGallery: arr,
      };
    });

    setFormErrors((previousErrors) => ({
      ...previousErrors,
      wellnessHubGallery: "",
    }));
  };

  const validateForm = () => {
    const errors = {};

    const normalizedName = formData.wellnessHubName
      ? formData.wellnessHubName.trim()
      : "";
    const normalizedTelephone = formData.telInformation
      ? formData.telInformation.trim()
      : "";
    const normalizedAddress = formData.address ? formData.address.trim() : "";
    const normalizedMapsLink = formData.googleMapsLink
      ? formData.googleMapsLink.trim()
      : "";
    const normalizedContact = formData.contactInformation
      ? formData.contactInformation.trim()
      : "";
    const normalizedDesc = formData.wellnessHubDescription
      ? formData.wellnessHubDescription.trim()
      : "";

    // 0. wellnessHubName: required, 3–100 ตัว
    if (!normalizedName) {
      errors.wellnessHubName = "กรุณากรอกชื่อสถานประกอบการ";
    } else if (normalizedName.length < 3 || normalizedName.length > 100) {
      errors.wellnessHubName = `ชื่อสถานประกอบการต้องมีความยาว 3–100 ตัวอักษร (ปัจจุบัน ${normalizedName.length} ตัวอักษร)`;
    }

    // 1. address: required, 10–255 ตัว
    if (!normalizedAddress) {
      errors.address = "กรุณากรอกรายละเอียดที่อยู่";
    } else if (normalizedAddress.length < 10 || normalizedAddress.length > 255) {
      errors.address = `ที่อยู่ต้องมีความยาว 10–255 ตัวอักษร (ปัจจุบัน ${normalizedAddress.length} ตัวอักษร)`;
    }

    // 2. telInformation: required, ตัวเลข 9-10 หลัก หรือเบอร์ฉุกเฉิน ไม่มีช่องว่าง
    if (!normalizedTelephone) {
      errors.telInformation = "กรุณากรอกเบอร์โทรศัพท์ติดต่อ";
    } else if (!/^(1669|[0-9]{3,4}|[0-9]{9,10})$/.test(normalizedTelephone)) {
      errors.telInformation =
        "เบอร์โทรศัพท์ต้องเป็นตัวเลข 9–10 หลัก หรือเบอร์ฉุกเฉิน (เช่น 1669) และไม่มีช่องว่าง";
    }

    // 3. contactInformation: optional, ถ้ามี 3–255 ตัว
    if (
      normalizedContact &&
      (normalizedContact.length < 3 || normalizedContact.length > 255)
    ) {
      errors.contactInformation = `ช่องทางติดต่อเพิ่มเติมต้องมีความยาว 3–255 ตัวอักษร (ปัจจุบัน ${normalizedContact.length} ตัวอักษร)`;
    }

    // 4. wellnessHubDescription: optional, if provided max 255 chars
    if (normalizedDesc && normalizedDesc.length > 255) {
      errors.wellnessHubDescription = `รายละเอียดสถานประกอบการต้องมีความยาวไม่เกิน 255 ตัวอักษร (ปัจจุบัน ${normalizedDesc.length} ตัวอักษร)`;
    }

    // 5. googleMapsLink: required, valid Google Maps URL, no whitespace
    if (!normalizedMapsLink) {
      errors.googleMapsLink = "กรุณากรอกลิงก์ Google Maps";
    } else if (/\s/.test(normalizedMapsLink)) {
      errors.googleMapsLink = "ลิงก์ Google Maps ต้องไม่มีช่องว่าง";
    } else if (!isGoogleMapsUrl(normalizedMapsLink)) {
      errors.googleMapsLink =
        "กรุณาระบุลิงก์จาก Google Maps ที่ถูกต้อง";
    }

    // 6. Operating Hours: จันทร์–อาทิตย์
    if (!is24Hours) {
      const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
      DAYS.forEach((day) => {
        const detail = operatingHours[day.key];

        if (!detail.active) {
          return;
        }

        if (!detail.open || !detail.close) {
          errors.operatingHours = `เวลาทำการ: กรุณาระบุเวลาเปิดและเวลาปิดของ${day.label}`;
          return;
        }

        if (!timePattern.test(detail.open) || !timePattern.test(detail.close)) {
          errors.operatingHours = `เวลาทำการ: รูปแบบเวลาเปิด/ปิดของ${day.label}ต้องเป็น HH:mm`;
        }
      });
    }

    // 7. username (ถ้ามีการแก้ไข)
    const normalizedUsername = formData.username ? formData.username.trim() : "";
    if (normalizedUsername) {
      if (/\s/.test(normalizedUsername)) {
        errors.username = "ชื่อผู้ใช้ (Username) ต้องไม่มีช่องว่าง";
      } else if (normalizedUsername.length < 4 || normalizedUsername.length > 20) {
        errors.username = "ชื่อผู้ใช้ (Username) ต้องมีความยาว 4–20 ตัวอักษร";
      }
    }

    // 8. password & confirmPassword (ถ้าต้องการเปลี่ยนรหัสผ่าน)
    const normalizedPassword = formData.password ? formData.password.trim() : "";
    const normalizedConfirmPassword = formData.confirmPassword ? formData.confirmPassword.trim() : "";
    if (normalizedPassword || normalizedConfirmPassword) {
      if (!normalizedPassword) {
        errors.password = "กรุณากรอกรหัสผ่านใหม่";
      } else if (/\s/.test(normalizedPassword)) {
        errors.password = "รหัสผ่านต้องไม่มีช่องว่าง";
      } else if (normalizedPassword.length !== 8) {
        errors.password = "รหัสผ่านต้องมีความยาว 8 ตัวอักษรเท่านั้น";
      }

      if (!normalizedConfirmPassword) {
        errors.confirmPassword = "กรุณายืนยันรหัสผ่านใหม่อีกครั้ง";
      } else if (normalizedPassword !== normalizedConfirmPassword) {
        errors.confirmPassword = "รหัสผ่านยืนยันไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง";
      }
    }

    setFormErrors(errors);

    return errors;
  };

  const requestSave = () => {
    const errors = validateForm();
    const errorKeys = Object.keys(errors);

    if (errorKeys.length > 0) {
      const firstKey = errorKeys[0];
      const firstErrorMessage = errors[firstKey];

      showToast("error", firstErrorMessage || "กรุณากรอกข้อมูลให้ถูกต้อง");

      const element =
        document.getElementById(firstKey) ||
        document.querySelector(`[name="${firstKey}"]`);

      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.focus?.();
      }

      return;
    }

    setShowConfirmModal(true);
  };

  const saveHubData = async () => {
    if (!licenseId || saving) {
      return;
    }

    setSaving(true);

    try {
      let galleryValue = null;
      if (Array.isArray(formData.wellnessHubGallery)) {
        galleryValue = JSON.stringify(formData.wellnessHubGallery);
      } else if (typeof formData.wellnessHubGallery === "string") {
        galleryValue = formData.wellnessHubGallery;
      }

      const certTypePayload = certificateList
        .map((c) => c.trim())
        .filter(Boolean)
        .join(", ");

      const gmapsLink = formData.googleMapsLink
        ? formData.googleMapsLink.trim()
        : "";
      const parsedCoords = parseLatLngFromGoogleMapsLink(gmapsLink);

      let latVal =
        hub?.wellnessHubLatitude ??
        (formData.wellnessHubLatitude !== ""
          ? Number(formData.wellnessHubLatitude)
          : null);
      let lngVal =
        hub?.wellnessHubLongitude ??
        (formData.wellnessHubLongitude !== ""
          ? Number(formData.wellnessHubLongitude)
          : null);

      if (parsedCoords) {
        latVal = parsedCoords.lat;
        lngVal = parsedCoords.lng;
      }

      const payload = {
        licenseId: licenseId,

        username: formData.username
          ? formData.username.trim()
          : hub?.username || null,

        ...(formData.password && formData.password.trim()
          ? { password: formData.password.trim() }
          : {}),

        wellnessHubName: formData.wellnessHubName
          ? formData.wellnessHubName.trim()
          : hub?.wellnessHubName || null,

        categoryId: formData.categoryId || hub?.category?.categoryId || null,

        category:
          formData.categoryId || hub?.category?.categoryId
            ? {
                categoryId: String(
                  formData.categoryId || hub?.category?.categoryId,
                )
                  .trim()
                  .toUpperCase(),
              }
            : null,

        districtId: formData.districtId || hub?.district?.districtId || null,

        district:
          formData.districtId || hub?.district?.districtId
            ? {
                districtId: parseInt(
                  formData.districtId || hub?.district?.districtId,
                  10,
                ),
              }
            : null,

        address: formData.address.trim(),

        telInformation: formData.telInformation.trim(),

        certificateType: certTypePayload || null,

        contactInformation: formData.contactInformation
          ? formData.contactInformation.trim() || null
          : null,

        wellnessHubDescription: formData.wellnessHubDescription
          ? formData.wellnessHubDescription.trim()
          : null,

        googleMapsLink: gmapsLink,

        wellnessHubLatitude: latVal,

        wellnessHubLongitude: lngVal,

        operatingHours: JSON.stringify(operatingHours),

        wellnessHubImg: formData.wellnessHubImg || null,

        wellnessHubGallery: galleryValue,
      };

      const response = await axios.put(
        `${API_BASE_URL}/wellness-hubs/${licenseId}`,
        payload,
        {
          timeout: 60000,
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const updatedHub = response.data;

      if (!updatedHub) {
        throw new Error("ระบบไม่ได้ส่งข้อมูลสถานประกอบการกลับมา");
      }

      clearWellnessHubCache();
      clearDashboardCache();

      setHub(updatedHub);
      mapHubToForm(updatedHub);

      const updatedProvider = {
        ...provider,
        username: updatedHub.username || provider?.username,
        wellnessHubName: updatedHub.wellnessHubName,
        categoryId: updatedHub.category?.categoryId || null,
        categoryName: updatedHub.category?.categoryName || null,
        districtId: updatedHub.district?.districtId || null,
        districtName: updatedHub.district?.districtName || null,
      };

      setProvider(updatedProvider);

      localStorage.setItem("wellnessProvider", JSON.stringify(updatedProvider));

      localStorage.setItem(
        "wellnessProviderName",
        updatedHub.wellnessHubName || "",
      );

      setEditing(false);
      setShowConfirmModal(false);

      showToast("success", "บันทึกข้อมูลสถานประกอบการสำเร็จ");
    } catch (error) {
      console.error("Save wellness hub error:", error);

      setShowConfirmModal(false);

      if (error.response?.status === 401) {
        showToast(
          "error",
          "เซสชันการเข้าสู่ระบบหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง",
        );
        setTimeout(() => {
          clearProviderSession();
          navigate("/provider/login");
        }, 2000);
        return;
      }

      const errorMsg = getErrorMessage(error);

      // ระบุฟิลด์ที่มีปัญหาให้ขึ้นสีแดงและแจ้งเตือนอย่างชัดเจน
      const lower = errorMsg.toLowerCase();
      let fieldTarget = null;
      if (lower.includes("ที่อยู่") || lower.includes("address")) {
        setFormErrors((prev) => ({ ...prev, address: errorMsg }));
        fieldTarget = "address";
      } else if (lower.includes("โทรศัพท์") || lower.includes("tel")) {
        setFormErrors((prev) => ({ ...prev, telInformation: errorMsg }));
        fieldTarget = "telInformation";
      } else if (
        lower.includes("google") ||
        lower.includes("พิกัด") ||
        lower.includes("ละติจูด") ||
        lower.includes("ลองจิจูด") ||
        lower.includes("maps")
      ) {
        setFormErrors((prev) => ({ ...prev, googleMapsLink: errorMsg }));
        fieldTarget = "googleMapsLink";
      } else if (
        lower.includes("คำอธิบาย") ||
        lower.includes("รายละเอียด") ||
        lower.includes("description")
      ) {
        setFormErrors((prev) => ({
          ...prev,
          wellnessHubDescription: errorMsg,
        }));
        fieldTarget = "wellnessHubDescription";
      } else if (
        lower.includes("เวลา") ||
        lower.includes("ชั่วโมง") ||
        lower.includes("hours")
      ) {
        setFormErrors((prev) => ({ ...prev, operatingHours: errorMsg }));
        fieldTarget = "operatingHours";
      } else if (
        lower.includes("ภาพ") ||
        lower.includes("รูป") ||
        lower.includes("image")
      ) {
        setFormErrors((prev) => ({ ...prev, wellnessHubImg: errorMsg }));
        fieldTarget = "wellnessHubImg";
      } else if (
        lower.includes("ใบรับรอง") ||
        lower.includes("certificate")
      ) {
        setFormErrors((prev) => ({ ...prev, certificateType: errorMsg }));
        fieldTarget = "certificateType";
      }

      showToast("error", errorMsg);

      if (fieldTarget) {
        setTimeout(() => {
          const el =
            document.getElementById(fieldTarget) ||
            document.querySelector(`[name="${fieldTarget}"]`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.focus?.();
          }
        }, 100);
      }
    } finally {
      setSaving(false);
    }
  };

  const cancelEditing = () => {
    if (hub) {
      mapHubToForm(hub);
    }

    setFormErrors({});
    setEditing(false);
  };

  const handleLogout = () => {
    clearProviderSession();

    navigate("/provider/login", {
      replace: true,
    });
  };

  if (loading) {
    return (
      <LoadingState
        fullPage
        title="กำลังโหลดข้อมูลสถานประกอบการ"
        message="ระบบกำลังเตรียมข้อมูลสถานประกอบการของคุณ กรุณารอสักครู่"
      />
    );
  }

  if (loadError || !hub) {
    return (
      <main className="provider-dashboard">
        <section className="provider-dashboard-state">
          <AlertCircle />

          <h1>ไม่สามารถโหลดข้อมูลได้</h1>

          <p>{loadError || "ไม่พบข้อมูลสถานประกอบการ"}</p>

          <div className="provider-dashboard-state__actions">
            <button type="button" onClick={loadDashboardData}>
              <RefreshCw />
              ลองใหม่
            </button>

            <button
              type="button"
              className="provider-dashboard-state__logout"
              onClick={handleLogout}
            >
              <LogOut />
              ออกจากระบบ
            </button>
          </div>
        </section>
      </main>
    );
  }

  const isActive = String(hub.status || "").toUpperCase() === "ACTIVE";

  return (
    <main className="provider-dashboard">
      {toast && (
        <div
          className={`provider-dashboard-toast provider-dashboard-toast--${toast.type}`}
          role="alert"
        >
          {toast.type === "success" ? <CheckCircle2 /> : <AlertCircle />}

          <span>{toast.message}</span>

          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="ปิดข้อความ"
          >
            <X />
          </button>
        </div>
      )}

      {/* Header Topbar */}
      <header className="provider-dashboard-topbar">
        <div className="provider-dashboard-container provider-dashboard-topbar__inner">
          <div className="provider-dashboard-brand">
            <div className="provider-dashboard-brand__mark">
              <Building2 />
            </div>

            <div>
              <strong>ศูนย์จัดการข้อมูลผู้ประกอบการ</strong>
              <span>CHIANG MAI WELLNESS</span>
            </div>
          </div>

          <div className="provider-dashboard-topbar__actions">
            {/* Direct Public Preview Link */}
            <a
              href={`/wellness-hubs/${hub.licenseId}`}
              target="_blank"
              rel="noreferrer"
              className="provider-dashboard-button provider-dashboard-button--preview"
              title="เปิดดูหน้าสถานประกอบการบนมุมมองของผู้ใช้ทั่วไป"
            >
              <Eye />
              <span>ดูหน้าร้านจริง</span>
              <ExternalLink size={14} />
            </a>

            {!editing ? (
              <button
                type="button"
                className="provider-dashboard-button provider-dashboard-button--primary"
                onClick={() => setEditing(true)}
              >
                <Edit3 />
                แก้ไขข้อมูล
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="provider-dashboard-button provider-dashboard-button--secondary"
                  onClick={cancelEditing}
                  disabled={saving}
                >
                  <X />
                  ยกเลิก
                </button>

                <button
                  type="button"
                  className="provider-dashboard-button provider-dashboard-button--primary"
                  onClick={requestSave}
                  disabled={saving}
                >
                  <Save />
                  บันทึกข้อมูล
                </button>
              </>
            )}

            <button
              type="button"
              className="provider-dashboard-button provider-dashboard-button--logout"
              onClick={handleLogout}
              disabled={saving}
            >
              <LogOut />
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      <div className="provider-dashboard-container provider-dashboard-content">
        {/* Profile Hero Header */}
        <section className="provider-dashboard-profile-header">
          <div className="provider-dashboard-profile-header__main">
            <div className="provider-dashboard-profile-header__label">
              <Building2 />
              <span>สถานประกอบการที่ได้รับสิทธิ์</span>
            </div>

            <h1>{displayValue(hub.wellnessHubName)}</h1>

            <div className="provider-dashboard-profile-header__meta">
              <span>
                <Tag />
                {displayValue(categoryName)}
              </span>

              <span>
                <MapPin />
                อำเภอ{displayValue(districtName)}
              </span>

              <span
                className={
                  isActive
                    ? "provider-dashboard-profile-status provider-dashboard-profile-status--active"
                    : "provider-dashboard-profile-status provider-dashboard-profile-status--inactive"
                }
              >
                <i />
                {isActive ? "บัญชีพร้อมให้บริการ" : "บัญชีถูกระงับ"}
              </span>
            </div>
          </div>

          <div className="provider-dashboard-profile-header__summary">
            <div>
              <span>เลขใบอนุญาต (License ID)</span>
              <strong>{displayValue(hub.licenseId)}</strong>
            </div>

            <div>
              <span>เวลาให้บริการ</span>
              <strong>
                {is24Hours
                  ? "เปิด 24 ชม. ทุกวัน"
                  : activeOperatingDays.length > 0
                    ? `เปิด ${activeOperatingDays.length} วัน / สัปดาห์`
                    : "ยังไม่ได้ระบุเวลา"}
              </strong>
            </div>

            <div>
              <span>อัปเดตข้อมูลล่าสุด</span>
              <strong>
                {formatThaiDateTime(hub.updatedAt || hub.createdAt)}
              </strong>
            </div>
          </div>
        </section>

        <div className="provider-dashboard-layout">
          {/* Left Sticky Sidebar */}
          <aside className="provider-dashboard-sidebar">
            <section className="provider-dashboard-profile-media">
              <div
                className="provider-dashboard-image-frame"
                onClick={() => imagePreview && setLightboxImage(imagePreview)}
                style={{ cursor: imagePreview ? "pointer" : "default" }}
                title={imagePreview ? "คลิกเพื่อดูรูปภาพขนาดใหญ่" : ""}
              >
                {imagePreview ? (
                  <>
                    <img
                      src={imagePreview}
                      alt={hub.wellnessHubName || "สถานประกอบการ"}
                    />
                    <div className="provider-dashboard-image-zoom-hint">
                      <ZoomIn size={16} />
                      <span>ขยายรูปภาพ</span>
                    </div>
                  </>
                ) : (
                  <div className="provider-dashboard-image-empty">
                    <ImageIcon />
                    <strong>ยังไม่มีรูปภาพหลัก</strong>
                    <span>เพิ่มรูปภาพได้จากโหมดแก้ไข</span>
                  </div>
                )}

                <span className="provider-dashboard-image-frame__label">
                  รูปภาพหลัก
                </span>
              </div>

              {/* Sidebar Quick Action to Public View */}
              <div className="provider-dashboard-media-action">
                <a
                  href={`/wellness-hubs/${hub.licenseId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="provider-dashboard-media-link"
                >
                  <Eye size={15} />
                  เปิดดูหน้าร้านจริงบนเว็บไซต์
                  <ArrowUpRight size={15} />
                </a>
              </div>
            </section>

            {/* Account Card */}
            <section className="provider-dashboard-account-card">
              <div className="provider-dashboard-sidebar-heading">
                <UserRound />

                <div>
                  <span>บัญชีผู้ใช้งาน</span>
                  <h2>ข้อมูลสำหรับเข้าสู่ระบบ</h2>
                </div>
              </div>

              <dl className="provider-dashboard-account-list">
                <div>
                  <dt>ชื่อผู้ใช้ (Username)</dt>
                  <dd>{displayValue(hub.username)}</dd>
                </div>

                <div>
                  <dt>สถานะบัญชี</dt>

                  <dd
                    className={
                      isActive
                        ? "provider-dashboard-account-status"
                        : "provider-dashboard-account-status provider-dashboard-account-status--inactive"
                    }
                  >
                    <i />
                    {isActive ? "พร้อมใช้งาน (ACTIVE)" : "ระงับการใช้งาน"}
                  </dd>
                </div>
              </dl>
            </section>

            <div className="provider-dashboard-sidebar-note">
              <ShieldCheck />

              <p>
                ข้อมูลที่บันทึกจากหน้านี้จะถูกนำไปแสดงในหน้าสถานประกอบการสำหรับผู้ใช้งานทั่วไปบนแพลตฟอร์ม
                Chiang Mai Wellness
              </p>
            </div>
          </aside>

          {/* Right Main Content */}
          <section className="provider-dashboard-main">
            <div className="provider-dashboard-main__header">
              <div className="provider-dashboard-main__heading">
                <div className="provider-dashboard-main__heading-icon">
                  {editing ? <Edit3 /> : <Eye />}
                </div>

                <div>
                  <span>{editing ? "โหมดแก้ไข" : "ข้อมูลปัจจุบัน"}</span>

                  <h2>
                    {editing
                      ? "แก้ไขข้อมูลสถานประกอบการ"
                      : "รายละเอียดสถานประกอบการ"}
                  </h2>
                </div>
              </div>

              {!editing && (
                <div className="provider-dashboard-view-mode-tag">
                  <span>✓ ข้อมูลดึงจากฐานข้อมูลจริง</span>
                </div>
              )}
            </div>

            {editing ? (
              /* ======================= EDIT MODE ======================= */
              <div className="provider-dashboard-edit">
                {Object.keys(formErrors).filter((k) => formErrors[k]).length >
                  0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      padding: "16px 20px",
                      background: "#fef2f2",
                      border: "1.5px solid #f87171",
                      borderRadius: "12px",
                      marginBottom: "24px",
                      color: "#991b1b",
                    }}
                    role="alert"
                  >
                    <AlertCircle
                      style={{
                        width: "22px",
                        height: "22px",
                        flexShrink: 0,
                        marginTop: "2px",
                        color: "#dc2626",
                      }}
                    />
                    <div>
                      <strong
                        style={{
                          fontSize: "15px",
                          fontWeight: "700",
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        พบข้อผิดพลาด กรุณาตรวจสอบและแก้ไขข้อมูล:
                      </strong>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: "18px",
                          fontSize: "13.5px",
                          lineHeight: "1.6",
                        }}
                      >
                        {Object.entries(formErrors)
                          .filter(([_, msg]) => Boolean(msg))
                          .map(([key, msg]) => (
                            <li key={key}>{msg}</li>
                          ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Section 1: General Info */}
                <section className="provider-dashboard-form-section">
                  <div className="provider-dashboard-form-section__title">
                    <span>01</span>

                    <div>
                      <h3>ข้อมูลทั่วไป</h3>
                      <p>ชื่อ หมวดหมู่ ใบรับรอง และช่องทางติดต่อ</p>
                    </div>
                  </div>

                  <div className="provider-dashboard-form-grid">
                    <div className="provider-dashboard-field">
                      <label htmlFor="providerLicenseId">
                        เลขใบอนุญาตประกอบกิจการ
                      </label>

                      <div className="provider-dashboard-input-icon">
                        <KeyRound />

                        <input
                          id="providerLicenseId"
                          type="text"
                          value={hub.licenseId || ""}
                          readOnly
                          className="provider-dashboard-readonly"
                        />
                      </div>

                      <small>เลขใบอนุญาตไม่สามารถแก้ไขได้</small>
                    </div>

                    <div className="provider-dashboard-field">
                      <label htmlFor="wellnessHubName">
                        ชื่อสถานประกอบการ
                        <b>*</b>
                      </label>

                      <input
                        id="wellnessHubName"
                        name="wellnessHubName"
                        type="text"
                        value={formData.wellnessHubName}
                        onChange={handleInputChange}
                        placeholder="กรอกชื่อสถานประกอบการ"
                        className={
                          formErrors.wellnessHubName
                            ? "provider-dashboard-field-error-input"
                            : ""
                        }
                      />

                      {formErrors.wellnessHubName && (
                        <small className="provider-dashboard-error">
                          {formErrors.wellnessHubName}
                        </small>
                      )}
                    </div>

                    <div className="provider-dashboard-field">
                      <label htmlFor="categoryId">
                        หมวดหมู่ธุรกิจ
                        <b>*</b>
                      </label>

                      <select
                        id="categoryId"
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleInputChange}
                        className={
                          formErrors.categoryId
                            ? "provider-dashboard-field-error-input"
                            : ""
                        }
                      >
                        <option value="">เลือกหมวดหมู่ธุรกิจ</option>

                        {categories.map((category) => (
                          <option
                            key={category.categoryId}
                            value={category.categoryId}
                          >
                            {category.categoryName}
                          </option>
                        ))}
                      </select>

                      {formErrors.categoryId && (
                        <small className="provider-dashboard-error">
                          {formErrors.categoryId}
                        </small>
                      )}
                    </div>

                    <div className="provider-dashboard-field provider-dashboard-field-full">
                      <div className="provider-dashboard-cert-header">
                        <label>ประเภทใบรับรอง / มาตรฐาน (1 ใบต่อ 1 ช่อง)</label>
                        <button
                          type="button"
                          className="provider-dashboard-btn-add-cert"
                          onClick={addCertField}
                        >
                          + เพิ่มใบรับรอง
                        </button>
                      </div>
                      <div className="provider-dashboard-cert-list">
                        {certificateList.map((cert, index) => (
                          <div
                            key={index}
                            className="provider-dashboard-cert-row"
                          >
                            <input
                              type="text"
                              placeholder={`ระบุชื่อใบรับรอง / มาตรฐานที่ ${index + 1} (เช่น ศูนย์เวลเนสประเภทสปาเพื่อสุขภาพ)`}
                              value={cert}
                              maxLength={150}
                              onChange={(e) =>
                                handleCertChange(index, e.target.value)
                              }
                            />
                            {certificateList.length > 1 && (
                              <button
                                type="button"
                                className="provider-dashboard-btn-del-cert"
                                onClick={() => removeCertField(index)}
                                title="ลบช่องใบรับรองนี้"
                              >
                                ✕ ลบ
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="provider-dashboard-field">
                      <label htmlFor="telInformation">
                        เบอร์โทรศัพท์ติดต่อ
                        <b>*</b>
                      </label>

                      <div className="provider-dashboard-input-icon">
                        <Phone />

                        <input
                          id="telInformation"
                          name="telInformation"
                          type="tel"
                          maxLength={10}
                          value={formData.telInformation}
                          onChange={handleInputChange}
                          placeholder="เช่น 0812345678"
                          className={
                            formErrors.telInformation
                              ? "provider-dashboard-field-error-input"
                              : ""
                          }
                        />
                      </div>

                      <div className="provider-dashboard-field-footer">
                        {formErrors.telInformation ? (
                          <small className="provider-dashboard-error">
                            {formErrors.telInformation}
                          </small>
                        ) : (
                          <span />
                        )}
                        <span className="provider-dashboard-char-count">
                          {formData.telInformation?.length || 0}/10
                        </span>
                      </div>
                    </div>

                    <div className="provider-dashboard-field">
                      <label htmlFor="contactInformation">
                        ช่องทางติดต่อเพิ่มเติม
                      </label>

                      <div className="provider-dashboard-input-icon">
                        <Mail />

                        <input
                          id="contactInformation"
                          name="contactInformation"
                          type="text"
                          maxLength={255}
                          value={formData.contactInformation}
                          onChange={handleInputChange}
                          placeholder="เช่น Facebook, LINE หรือ Email"
                          className={
                            formErrors.contactInformation
                              ? "provider-dashboard-field-error-input"
                              : ""
                          }
                        />
                      </div>

                      <div className="provider-dashboard-field-footer">
                        {formErrors.contactInformation ? (
                          <small className="provider-dashboard-error">
                            {formErrors.contactInformation}
                          </small>
                        ) : (
                          <span />
                        )}
                        <span className="provider-dashboard-char-count">
                          {formData.contactInformation?.length || 0}/255
                        </span>
                      </div>
                    </div>

                    <div className="provider-dashboard-field provider-dashboard-field--full">
                      <label htmlFor="wellnessHubDescription">
                        รายละเอียดสถานประกอบการ
                      </label>

                      <textarea
                        id="wellnessHubDescription"
                        name="wellnessHubDescription"
                        rows={5}
                        maxLength={255}
                        value={formData.wellnessHubDescription}
                        onChange={handleInputChange}
                        placeholder="กรอกรายละเอียดบริการ จุดเด่น และข้อมูลที่ต้องการแสดงต่อผู้ใช้ (สูงสุด 255 ตัวอักษร)"
                        className={
                          formErrors.wellnessHubDescription
                            ? "provider-dashboard-field-error-input"
                            : ""
                        }
                      />

                      <div className="provider-dashboard-field-footer">
                        {formErrors.wellnessHubDescription ? (
                          <small className="provider-dashboard-error">
                            {formErrors.wellnessHubDescription}
                          </small>
                        ) : (
                          <span />
                        )}
                        <span className="provider-dashboard-char-count">
                          {formData.wellnessHubDescription?.length || 0}/255
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 2: Location */}
                <section className="provider-dashboard-form-section">
                  <div className="provider-dashboard-form-section__title">
                    <span>02</span>

                    <div>
                      <h3>สถานที่ตั้ง</h3>
                      <p>ที่อยู่ อำเภอ และลิงก์ Google Maps</p>
                    </div>
                  </div>

                  <div className="provider-dashboard-form-grid">
                    <div className="provider-dashboard-field provider-dashboard-field--full">
                      <label htmlFor="address">
                        รายละเอียดที่อยู่
                        <b>*</b>
                      </label>

                      <textarea
                        id="address"
                        name="address"
                        rows={4}
                        maxLength={255}
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="กรอกบ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด และรหัสไปรษณีย์"
                        className={
                          formErrors.address
                            ? "provider-dashboard-field-error-input"
                            : ""
                        }
                      />

                      <div className="provider-dashboard-field-footer">
                        {formErrors.address ? (
                          <small className="provider-dashboard-error">
                            {formErrors.address}
                          </small>
                        ) : (
                          <span />
                        )}
                        <span className="provider-dashboard-char-count">
                          {formData.address?.length || 0}/255
                        </span>
                      </div>
                    </div>

                    <div className="provider-dashboard-field">
                      <label htmlFor="districtId">
                        อำเภอที่ตั้ง
                        <b>*</b>
                      </label>

                      <select
                        id="districtId"
                        name="districtId"
                        value={formData.districtId}
                        onChange={handleInputChange}
                        className={
                          formErrors.districtId
                            ? "provider-dashboard-field-error-input"
                            : ""
                        }
                      >
                        <option value="">เลือกอำเภอที่ตั้ง</option>

                        {districts.map((district) => (
                          <option
                            key={district.districtId}
                            value={district.districtId}
                          >
                            {district.districtName}
                          </option>
                        ))}
                      </select>

                      {formErrors.districtId && (
                        <small className="provider-dashboard-error">
                          {formErrors.districtId}
                        </small>
                      )}
                    </div>

                    <div className="provider-dashboard-field">
                      <label htmlFor="googleMapsLink">
                        ลิงก์ Google Maps
                        <b>*</b>
                      </label>

                      <div className="provider-dashboard-input-icon">
                        <Navigation />

                        <input
                          id="googleMapsLink"
                          name="googleMapsLink"
                          type="url"
                          value={formData.googleMapsLink}
                          onChange={handleInputChange}
                          placeholder="https://maps.app.goo.gl/..."
                          className={
                            formErrors.googleMapsLink
                              ? "provider-dashboard-field-error-input"
                              : ""
                          }
                        />
                      </div>

                      {formErrors.googleMapsLink && (
                        <small className="provider-dashboard-error">
                          {formErrors.googleMapsLink}
                        </small>
                      )}

                      {formData.googleMapsLink &&
                        !formErrors.googleMapsLink && (
                          <a
                            href={formData.googleMapsLink}
                            target="_blank"
                            rel="noreferrer"
                            className="provider-dashboard-map-link"
                          >
                            <Navigation />
                            ตรวจสอบตำแหน่งบน Google Maps
                            <ArrowUpRight />
                          </a>
                        )}
                    </div>
                  </div>
                </section>

                {/* Section 3: Operating Hours */}
                <section className="provider-dashboard-form-section">
                  <div className="provider-dashboard-form-section__title">
                    <span>03</span>

                    <div>
                      <h3>วันและเวลาให้บริการ</h3>
                      <p>
                        กำหนดเวลาเปิดให้บริการของสถานประกอบการ หรือเปิดบริการ 24
                        ชั่วโมง
                      </p>
                    </div>
                  </div>

                  {/* Mode Selector Tabs */}
                  <div className="provider-dashboard-schedule-mode-bar">
                    <button
                      type="button"
                      className={`provider-dashboard-schedule-mode-btn ${scheduleMode === "same" ? "active" : ""}`}
                      onClick={() => handleScheduleModeChange("same")}
                    >
                      <Clock3 size={16} />
                      <span>เปิดเวลาเดียวกัน</span>
                      <small>กำหนดเวลาครั้งเดียว ใช้กับทุกวันที่เลือก</small>
                    </button>

                    <button
                      type="button"
                      className={`provider-dashboard-schedule-mode-btn ${scheduleMode === "custom" ? "active" : ""}`}
                      onClick={() => handleScheduleModeChange("custom")}
                    >
                      <Calendar size={16} />
                      <span>กำหนดแยกรายวัน</span>
                      <small>ตั้งเวลาแยกเฉพาะแต่ละวัน</small>
                    </button>

                    <button
                      type="button"
                      className={`provider-dashboard-schedule-mode-btn ${scheduleMode === "24hours" ? "active" : ""}`}
                      onClick={() => handleScheduleModeChange("24hours")}
                    >
                      <Sparkles size={16} />
                      <span>เปิดตลอด 24 ชั่วโมง</span>
                      <small>เปิดบริการทุกวันตลอดเวลา</small>
                    </button>
                  </div>

                  {/* MODE 1: SAME HOURS (เปิดเวลาเดียวกัน) */}
                  {scheduleMode === "same" && (
                    <div className="provider-dashboard-same-hours-panel">
                      {/* Step 1: Day Selection */}
                      <div className="provider-dashboard-same-section">
                        <div className="provider-dashboard-same-section-header">
                          <label className="provider-dashboard-same-title">
                            1. เลือกวันเปิดให้บริการ
                          </label>
                          <div className="provider-dashboard-same-quick-links">
                            <button
                              type="button"
                              className="provider-dashboard-quick-link-btn"
                              onClick={() => handleSameQuickPreset("weekdays")}
                            >
                              จันทร์ - ศุกร์
                            </button>
                            <span className="provider-dashboard-link-sep">•</span>
                            <button
                              type="button"
                              className="provider-dashboard-quick-link-btn"
                              onClick={() => handleSameQuickPreset("all")}
                            >
                              ทุกวัน (จ.-อา.)
                            </button>
                            <span className="provider-dashboard-link-sep">•</span>
                            <button
                              type="button"
                              className="provider-dashboard-quick-link-btn"
                              onClick={() => handleSameQuickPreset("weekends")}
                            >
                              เสาร์ - อาทิตย์
                            </button>
                          </div>
                        </div>

                        <div className="provider-dashboard-day-pills">
                          {DAYS.map((day) => {
                            const isActive = Boolean(operatingHours[day.key]?.active);
                            return (
                              <button
                                key={day.key}
                                type="button"
                                className={`provider-dashboard-day-pill ${isActive ? "provider-dashboard-day-pill--active" : ""}`}
                                onClick={() => handleSameDayToggle(day.key)}
                                title={isActive ? `คลิกเพื่อปิด ${day.label}` : `คลิกเพื่อเปิด ${day.label}`}
                              >
                                <span className="provider-dashboard-day-pill-icon">
                                  {isActive ? <Check size={14} /> : "+"}
                                </span>
                                <span className="provider-dashboard-day-pill-text">{day.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Step 2: Time Selection */}
                      <div className="provider-dashboard-same-section">
                        <label className="provider-dashboard-same-title">
                          2. กำหนดเวลาเปิด – ปิดทำการ
                        </label>

                        <div className="provider-dashboard-same-time-box">
                          <div className="provider-dashboard-same-time-field">
                            <label>เวลาเปิด</label>
                            <input
                              type="time"
                              value={sameOpenTime}
                              onChange={(e) => handleSameTimeChange("open", e.target.value)}
                            />
                          </div>

                          <span className="provider-dashboard-same-time-arrow">ถึง</span>

                          <div className="provider-dashboard-same-time-field">
                            <label>เวลาปิด</label>
                            <input
                              type="time"
                              value={sameCloseTime}
                              onChange={(e) => handleSameTimeChange("close", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Live Summary */}
                      <div className="provider-dashboard-same-summary">
                        <Clock3 size={16} />
                        <span>
                          สรุปเวลาทำการ:{" "}
                          <strong>
                            {DAYS.filter((d) => operatingHours[d.key]?.active)
                              .map((d) => d.label.replace("วัน", ""))
                              .join(", ") || "ยังไม่ได้เลือกวัน"}
                          </strong>{" "}
                          เวลา{" "}
                          <strong>
                            {sameOpenTime || "—"} – {sameCloseTime || "—"} น.
                          </strong>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* MODE 2: CUSTOM PER DAY (กำหนดแยกรายวัน) */}
                  {scheduleMode === "custom" && (
                    <div className="provider-dashboard-hours">
                      <div className="provider-dashboard-hours__header">
                        <span>วัน</span>
                        <span>เปิดบริการ</span>
                        <span>เวลาเปิด</span>
                        <span>เวลาปิด</span>
                      </div>

                      {DAYS.map((day) => {
                        const detail = operatingHours[day.key];

                        return (
                          <div
                            key={day.key}
                            className={
                              detail.active
                                ? "provider-dashboard-hours__row provider-dashboard-hours__row--active"
                                : "provider-dashboard-hours__row"
                            }
                          >
                            <strong>{day.label}</strong>

                            <label className="provider-dashboard-switch">
                              <input
                                type="checkbox"
                                checked={detail.active}
                                onChange={() => handleDayToggle(day.key)}
                              />

                              <span />
                            </label>

                            <input
                              type="time"
                              value={detail.open}
                              disabled={!detail.active}
                              onChange={(event) =>
                                handleTimeChange(
                                  day.key,
                                  "open",
                                  event.target.value,
                                )
                              }
                            />

                            <input
                              type="time"
                              value={detail.close}
                              disabled={!detail.active}
                              onChange={(event) =>
                                handleTimeChange(
                                  day.key,
                                  "close",
                                  event.target.value,
                                )
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* MODE 3: 24 HOURS (เปิดตลอด 24 ชั่วโมง) */}
                  {scheduleMode === "24hours" && (
                    <div className="provider-dashboard-24hours-badge">
                      <span>
                        ✓ เปิดให้บริการตลอด 24 ชั่วโมงทุกวัน (จันทร์ - อาทิตย์)
                      </span>
                    </div>
                  )}

                  {formErrors.operatingHours && (
                    <small className="provider-dashboard-error">
                      {formErrors.operatingHours}
                    </small>
                  )}
                </section>

                {/* Section 4: Main Image */}
                <section className="provider-dashboard-form-section">
                  <div className="provider-dashboard-form-section__title">
                    <span>04</span>

                    <div>
                      <h3>รูปภาพหลัก</h3>
                      <p>ภาพที่ใช้ในหน้ารายละเอียดและผลการค้นหา</p>
                    </div>
                  </div>

                  <div className="provider-dashboard-image-editor">
                    <div className="provider-dashboard-image-editor__preview">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt={formData.wellnessHubName || "สถานประกอบการ"}
                        />
                      ) : (
                        <div className="provider-dashboard-image-empty">
                          <ImageIcon />
                          <strong>ยังไม่มีรูปภาพ</strong>
                          <span>เลือกรูปเพื่อแสดงตัวอย่าง</span>
                        </div>
                      )}
                    </div>

                    <div className="provider-dashboard-image-editor__actions">
                      <div>
                        <h4>ภาพหน้าปกสถานประกอบการ</h4>

                        <p>
                          แนะนำภาพแนวนอน .png, .jpg, .jpeg ขนาดไม่เกิน 20 MB
                        </p>
                      </div>

                      <label className="provider-dashboard-upload">
                        <Upload />

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
                          className="provider-dashboard-remove-image"
                          onClick={removeImage}
                        >
                          <Trash2 />
                          ลบรูปภาพ
                        </button>
                      )}

                      {imageFileName && (
                        <span className="provider-dashboard-file-name">
                          ไฟล์ที่เลือก: {imageFileName}
                        </span>
                      )}

                      {formErrors.wellnessHubImg && (
                        <small className="provider-dashboard-error">
                          {formErrors.wellnessHubImg}
                        </small>
                      )}
                    </div>
                  </div>
                </section>

                {/* Section 5: Gallery Images */}
                <section className="provider-dashboard-form-section">
                  <div className="provider-dashboard-form-section__title">
                    <span>05</span>

                    <div>
                      <h3>ภาพภายในสถานประกอบการ</h3>
                      <p>รูปภาพบรรยากาศและบริการภายในสถานประกอบการ (แกลเลอรี)</p>
                    </div>
                  </div>

                  <div className="provider-dashboard-gallery-editor">
                    <div className="provider-dashboard-gallery-preview">
                      {Array.isArray(formData.wellnessHubGallery) &&
                      formData.wellnessHubGallery.length > 0 ? (
                        <div className="provider-dashboard-gallery-grid">
                          {formData.wellnessHubGallery.map((src, idx) => (
                            <div
                              className="provider-dashboard-gallery-item"
                              key={idx}
                            >
                              <img
                                src={normalizeImageSource(src)}
                                alt={`Gallery ${idx + 1}`}
                              />
                              <button
                                type="button"
                                className="provider-dashboard-gallery-remove"
                                onClick={() => removeGalleryImage(idx)}
                                title="ลบรูปภาพนี้"
                              >
                                <Trash2 />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="provider-dashboard-image-empty">
                          <ImageIcon />
                          <strong>ยังไม่มีรูปภาพภายใน</strong>
                          <span>เพิ่มรูปภาพได้จากปุ่มอัปโหลดด้านล่าง</span>
                        </div>
                      )}
                    </div>

                    <div className="provider-dashboard-gallery-actions">
                      <div>
                        <h4>อัปโหลดภาพภายใน</h4>
                        <p>รองรับ .png, .jpg, .jpeg ขนาดไม่เกิน 20 MB ต่อรูป</p>
                      </div>

                      <label className="provider-dashboard-upload">
                        <Upload />
                        เลือก/เพิ่มรูปภาพ
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                          multiple
                          onChange={handleGalleryChange}
                          hidden
                        />
                      </label>

                      {formErrors.wellnessHubGallery && (
                        <small className="provider-dashboard-error">
                          {formErrors.wellnessHubGallery}
                        </small>
                      )}
                    </div>
                  </div>
                </section>

                {/* Section 6: Account & Security */}
                <section className="provider-dashboard-form-section">
                  <div className="provider-dashboard-form-section__title">
                    <span>06</span>

                    <div>
                      <h3>บัญชีผู้ใช้งานและความปลอดภัย</h3>
                      <p>
                        แก้ไขชื่อผู้ใช้และเปลี่ยนรหัสผ่านสำหรับเข้าสู่ระบบสถานประกอบการ
                      </p>
                    </div>
                  </div>

                  <div className="provider-dashboard-grid-2">
                    <div className="provider-dashboard-field">
                      <label htmlFor="username">
                        ชื่อผู้ใช้งาน (Username)
                      </label>

                      <div className="provider-dashboard-input-icon">
                        <UserRound />

                        <input
                          id="username"
                          name="username"
                          type="text"
                          value={formData.username}
                          onChange={handleInputChange}
                          placeholder="ระบุชื่อผู้ใช้งาน (4–20 ตัวอักษร)"
                          maxLength={20}
                          className={
                            formErrors.username
                              ? "provider-dashboard-field-error-input"
                              : ""
                          }
                        />
                      </div>

                      {formErrors.username ? (
                        <small className="provider-dashboard-error">
                          {formErrors.username}
                        </small>
                      ) : (
                        <small>
                          ใช้สำหรับเข้าสู่ระบบ (4–20 ตัวอักษร ไม่มีช่องว่าง)
                        </small>
                      )}
                    </div>

                    <div className="provider-dashboard-field">
                      <label>รหัสผ่านเข้าสู่ระบบ (Password)</label>

                      <div className="provider-dashboard-password-display-box">
                        <div className="provider-dashboard-password-display-content">
                          <Lock size={16} />
                          <span className="provider-dashboard-password-text">
                            {showCurrentPassword
                              ? (hub.password || provider?.password || "••••••••")
                              : "••••••••••••"}
                          </span>
                          <button
                            type="button"
                            className="provider-dashboard-password-toggle-btn"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            title={showCurrentPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                          >
                            {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>

                        <button
                          type="button"
                          className="provider-dashboard-change-pwd-btn"
                          onClick={handleOpenPasswordModal}
                        >
                          <KeyRound size={15} />
                          <span>เปลี่ยนรหัสผ่าน</span>
                        </button>
                      </div>
                      <small>คลิกปุ่ม "เปลี่ยนรหัสผ่าน" เพื่อตั้งรหัสผ่านใหม่ (ความยาว 8 ตัวอักษรเท่านั้น)</small>
                    </div>
                  </div>
                </section>
              </div>
            ) : (
              /* ======================= VIEW MODE ======================= */
              <div className="provider-dashboard-view">
                {/* View Section 1: General Info */}
                <section className="provider-dashboard-view-section">
                  <div className="provider-dashboard-view-section__heading">
                    <Building2 />

                    <div>
                      <h3>ข้อมูลทั่วไป</h3>
                      <p>ข้อมูลธุรกิจ ใบรับรอง และช่องทางติดต่อ</p>
                    </div>
                  </div>

                  <div className="provider-dashboard-info-list">
                    <div className="provider-dashboard-info-row">
                      <span>หมวดหมู่ธุรกิจ</span>
                      <strong>{displayValue(categoryName)}</strong>
                    </div>

                    <div className="provider-dashboard-info-row">
                      <span>ประเภทใบรับรอง / มาตรฐาน</span>
                      <div className="provider-dashboard-cert-view-list">
                        {normalizeCertificateList(hub.certificateType).length >
                        0 ? (
                          normalizeCertificateList(hub.certificateType).map(
                            (cert, index) => (
                              <div
                                key={index}
                                className="provider-dashboard-cert-view-item"
                              >
                                <ShieldCheck size={14} />
                                <span>{cert}</span>
                              </div>
                            ),
                          )
                        ) : (
                          <strong className="provider-dashboard-empty-dash">
                            -
                          </strong>
                        )}
                      </div>
                    </div>

                    <div className="provider-dashboard-info-row">
                      <span>เบอร์โทรศัพท์ติดต่อ</span>
                      <strong>
                        {hub.telInformation || hub.tellInformation ? (
                          <a
                            href={`tel:${hub.telInformation || hub.tellInformation}`}
                            className="provider-dashboard-tel-link"
                          >
                            <Phone size={14} />
                            {displayValue(
                              hub.telInformation || hub.tellInformation,
                            )}
                          </a>
                        ) : (
                          "-"
                        )}
                      </strong>
                    </div>

                    <div className="provider-dashboard-info-row">
                      <span>ช่องทางติดต่อเพิ่มเติม</span>
                      <strong>
                        {displayValue(hub.contactInformation)}
                      </strong>
                    </div>

                    <div className="provider-dashboard-info-row provider-dashboard-info-row--description">
                      <span>รายละเอียดสถานประกอบการ</span>
                      <strong style={{ whiteSpace: "pre-line" }}>
                        {displayValue(hub.wellnessHubDescription)}
                      </strong>
                    </div>
                  </div>
                </section>

                {/* View Section 2: Location */}
                <section className="provider-dashboard-view-section">
                  <div className="provider-dashboard-view-section__heading">
                    <MapPin />

                    <div>
                      <h3>สถานที่ตั้ง</h3>
                      <p>ที่อยู่ อำเภอ และตำแหน่งบนแผนที่</p>
                    </div>
                  </div>

                  <div className="provider-dashboard-location-layout">
                    <div className="provider-dashboard-location-main">
                      <span>ที่อยู่</span>

                      <strong>{displayValue(hub.address)}</strong>
                    </div>

                    <div className="provider-dashboard-location-meta">
                      <div>
                        <span>อำเภอที่ตั้ง</span>
                        <strong>{displayValue(districtName)}</strong>
                      </div>
                    </div>

                    {hasValue(hub.googleMapsLink) && (
                      <a
                        href={hub.googleMapsLink}
                        target="_blank"
                        rel="noreferrer"
                        className="provider-dashboard-location-link"
                      >
                        <Navigation />
                        เปิดตำแหน่งใน Google Maps
                        <ArrowUpRight />
                      </a>
                    )}
                  </div>
                </section>

                {/* View Section 3: Operating Hours */}
                <section className="provider-dashboard-view-section">
                  <div className="provider-dashboard-view-section__heading">
                    <Clock3 />

                    <div>
                      <h3>วันและเวลาให้บริการ</h3>
                      <p>เวลาเปิดให้บริการที่แสดงต่อผู้ใช้งานบนระบบ</p>
                    </div>
                  </div>

                  {checkIs24Hours(operatingHours) ? (
                    <div className="provider-dashboard-24hours-badge">
                      <span>
                        ✓ เปิดให้บริการตลอด 24 ชั่วโมงทุกวัน (จันทร์ - อาทิตย์)
                      </span>
                    </div>
                  ) : (
                    <div className="provider-dashboard-hours-table">
                      {DAYS.map((day) => {
                        const detail = operatingHours[day.key];
                        const isOpen = detail && Boolean(detail.active);

                        return (
                          <div
                            key={day.key}
                            className={`provider-dashboard-hours-item ${isOpen ? "provider-dashboard-hours-item--open" : "provider-dashboard-hours-item--closed"}`}
                          >
                            <span className="provider-dashboard-hours-day">
                              {day.label}
                            </span>
                            <span className="provider-dashboard-hours-status">
                              {isOpen ? (
                                <span className="provider-dashboard-status-tag provider-dashboard-status-tag--open">
                                  เปิดบริการ
                                </span>
                              ) : (
                                <span className="provider-dashboard-status-tag provider-dashboard-status-tag--closed">
                                  ปิดทำการ
                                </span>
                              )}
                            </span>
                            <span className="provider-dashboard-hours-time">
                              {isOpen
                                ? `${displayValue(detail.open)} – ${displayValue(detail.close)} น.`
                                : "—"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* View Section 4: Main Cover Image */}
                <section className="provider-dashboard-view-section">
                  <div className="provider-dashboard-view-section__heading">
                    <ImageIcon />

                    <div>
                      <h3>รูปภาพหน้าปกสถานประกอบการ</h3>
                      <p>ภาพหลักที่กำลังเผยแพร่บนระบบ</p>
                    </div>
                  </div>

                  <div className="provider-dashboard-view-image">
                    {imagePreview ? (
                      <div
                        className="provider-dashboard-view-image-frame"
                        onClick={() => setLightboxImage(imagePreview)}
                        title="คลิกเพื่อดูรูปภาพขนาดใหญ่"
                      >
                        <img
                          src={imagePreview}
                          alt={hub?.wellnessHubName || "สถานประกอบการ"}
                        />
                        <div className="provider-dashboard-image-zoom-hint">
                          <ZoomIn size={16} />
                          <span>ขยายรูปภาพ</span>
                        </div>
                      </div>
                    ) : (
                      <div className="provider-dashboard-image-empty">
                        <ImageIcon />
                        <strong>ยังไม่มีรูปภาพหลัก</strong>
                      </div>
                    )}
                  </div>
                </section>

                {/* View Section 5: Gallery */}
                <section className="provider-dashboard-view-section">
                  <div className="provider-dashboard-view-section__heading">
                    <ImageIcon />

                    <div>
                      <h3>ภาพบรรยากาศ / ภาพภายใน</h3>
                      <p>
                        รูปภาพบรรยากาศที่กำลังเผยแพร่ (
                        {Array.isArray(formData.wellnessHubGallery)
                          ? formData.wellnessHubGallery.length
                          : 0}{" "}
                        รูป)
                      </p>
                    </div>
                  </div>

                  {Array.isArray(formData.wellnessHubGallery) &&
                  formData.wellnessHubGallery.length > 0 ? (
                    <div className="provider-dashboard-gallery-grid">
                      {formData.wellnessHubGallery.map((src, idx) => (
                        <div
                          className="provider-dashboard-gallery-item"
                          key={idx}
                          onClick={() =>
                            setLightboxImage(normalizeImageSource(src))
                          }
                          title="คลิกเพื่อดูรูปภาพขนาดใหญ่"
                          style={{ cursor: "pointer" }}
                        >
                          <img
                            src={normalizeImageSource(src)}
                            alt={`Gallery ${idx + 1}`}
                          />
                          <div className="provider-dashboard-gallery-zoom-overlay">
                            <ZoomIn size={18} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="provider-dashboard-empty-value">
                      ยังไม่มีรูปภาพบรรยากาศเพิ่มเติม
                    </div>
                  )}
                </section>

                {/* View Section 6: Account & Security */}
                <section className="provider-dashboard-view-section">
                  <div className="provider-dashboard-view-section__heading">
                    <UserRound />

                    <div>
                      <h3>บัญชีผู้ใช้งานและความปลอดภัย</h3>
                      <p>ข้อมูลสำหรับใช้เข้าสู่ระบบจัดการสถานประกอบการ</p>
                    </div>
                  </div>

                  <div className="provider-dashboard-info-list">
                    <div className="provider-dashboard-info-row">
                      <span>ชื่อผู้ใช้งาน (Username)</span>
                      <strong>
                        {displayValue(hub.username || provider?.username)}
                      </strong>
                    </div>

                    <div className="provider-dashboard-info-row">
                      <span>รหัสผ่าน (Password)</span>
                      <div className="provider-dashboard-view-password-cell">
                        <div className="provider-dashboard-view-password-masked">
                          <Lock size={16} />
                          <span className="provider-dashboard-password-text">
                            {showCurrentPassword
                              ? (hub.password || provider?.password || "••••••••")
                              : "••••••••••••"}
                          </span>
                          <button
                            type="button"
                            className="provider-dashboard-password-toggle-btn"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            title={showCurrentPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                          >
                            {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>

                        <button
                          type="button"
                          className="provider-dashboard-change-pwd-btn"
                          onClick={handleOpenPasswordModal}
                        >
                          <KeyRound size={14} />
                          เปลี่ยนรหัสผ่าน
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Confirmation Save Modal */}
      {showConfirmModal && (
        <div
          className="provider-dashboard-modal-overlay"
          role="dialog"
          aria-modal="true"
        >
          <div className="provider-dashboard-modal">
            <div className="provider-dashboard-modal__icon">
              <Save />
            </div>

            <h2>ยืนยันการบันทึกข้อมูล?</h2>

            <p>
              ข้อมูลที่แก้ไขจะถูกนำไปแสดงในหน้าสถานประกอบการบนระบบ
              กรุณาตรวจสอบความถูกต้องก่อนยืนยัน
            </p>

            <div className="provider-dashboard-modal__actions">
              <button
                type="button"
                className="provider-dashboard-button provider-dashboard-button--secondary"
                onClick={() => setShowConfirmModal(false)}
                disabled={saving}
              >
                ยกเลิก
              </button>

              <button
                type="button"
                className="provider-dashboard-button provider-dashboard-button--primary"
                onClick={saveHubData}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <LoaderCircle className="provider-dashboard-small-spinner" />
                    กำลังบันทึก
                  </>
                ) : (
                  <>
                    <Save />
                    ยืนยันการบันทึก
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          className="provider-dashboard-lightbox-overlay"
          onClick={() => setLightboxImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="provider-dashboard-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="provider-dashboard-lightbox-close"
              onClick={() => setLightboxImage(null)}
              aria-label="ปิดรูปภาพ"
            >
              <X size={22} />
            </button>
            <img src={lightboxImage} alt="รูปภาพขนาดใหญ่" />
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div
          className="provider-dashboard-modal-overlay"
          role="dialog"
          aria-modal="true"
        >
          <div className="provider-dashboard-modal provider-dashboard-password-modal">
            <div className="provider-dashboard-modal__icon provider-dashboard-modal__icon--security">
              <KeyRound />
            </div>

            <h2>เปลี่ยนรหัสผ่านเข้าสู่ระบบ</h2>
            <p>กำหนดรหัสผ่านใหม่สำหรับบัญชีผู้ประกอบการ (ความยาว 8 ตัวอักษรเท่านั้น)</p>

            <form onSubmit={handleChangePasswordSubmit} className="provider-dashboard-pwd-modal-form">
              {passwordModalErrors.submit && (
                <div className="provider-dashboard-pwd-modal-alert">
                  <AlertCircle size={16} />
                  <span>{passwordModalErrors.submit}</span>
                </div>
              )}

              <div className="provider-dashboard-field">
                <label htmlFor="modalNewPassword">
                  รหัสผ่านใหม่ (New Password) <em>*</em>
                </label>
                <div className="provider-dashboard-input-icon">
                  <Lock />
                  <input
                    id="modalNewPassword"
                    name="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordModalData.newPassword}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPasswordModalData((prev) => ({
                        ...prev,
                        newPassword: val,
                      }));
                      setPasswordModalErrors((prev) => ({
                        ...prev,
                        newPassword: "",
                        submit: "",
                      }));
                    }}
                    placeholder="ระบุรหัสผ่านใหม่ (ความยาว 8 ตัวอักษร)"
                    maxLength={8}
                    disabled={passwordModalSubmitting}
                    className={
                      passwordModalErrors.newPassword
                        ? "provider-dashboard-field-error-input"
                        : ""
                    }
                  />
                  <button
                    type="button"
                    className="provider-dashboard-password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    title={showNewPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordModalErrors.newPassword ? (
                  <small className="provider-dashboard-error">
                    {passwordModalErrors.newPassword}
                  </small>
                ) : (
                  <small>ความยาว 8 ตัวอักษรเท่านั้น ไม่มีช่องว่าง</small>
                )}
              </div>

              <div className="provider-dashboard-field">
                <label htmlFor="modalConfirmPassword">
                  ยืนยันรหัสผ่านใหม่อีกครั้ง (Confirm Password) <em>*</em>
                </label>
                <div className="provider-dashboard-input-icon">
                  <ShieldCheck />
                  <input
                    id="modalConfirmPassword"
                    name="confirmPassword"
                    type={showConfirmNewPassword ? "text" : "password"}
                    value={passwordModalData.confirmPassword}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPasswordModalData((prev) => ({
                        ...prev,
                        confirmPassword: val,
                      }));
                      setPasswordModalErrors((prev) => ({
                        ...prev,
                        confirmPassword: "",
                        submit: "",
                      }));
                    }}
                    placeholder="กรอกรหัสผ่านใหม่อีกครั้งให้ตรงกัน"
                    maxLength={8}
                    disabled={passwordModalSubmitting}
                    className={
                      passwordModalErrors.confirmPassword
                        ? "provider-dashboard-field-error-input"
                        : ""
                    }
                  />
                  <button
                    type="button"
                    className="provider-dashboard-password-toggle"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    title={showConfirmNewPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  >
                    {showConfirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordModalErrors.confirmPassword ? (
                  <small className="provider-dashboard-error">
                    {passwordModalErrors.confirmPassword}
                  </small>
                ) : (
                  <small>กรอกรหัสผ่านซ้ำอีกครั้งเพื่อยืนยันความถูกต้อง</small>
                )}
              </div>

              <div className="provider-dashboard-modal__actions">
                <button
                  type="button"
                  className="provider-dashboard-button provider-dashboard-button--secondary"
                  onClick={handleClosePasswordModal}
                  disabled={passwordModalSubmitting}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="provider-dashboard-button provider-dashboard-button--primary"
                  disabled={passwordModalSubmitting}
                >
                  {passwordModalSubmitting ? (
                    <>
                      <LoaderCircle className="provider-dashboard-small-spinner" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      บันทึกรหัสผ่านใหม่
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

