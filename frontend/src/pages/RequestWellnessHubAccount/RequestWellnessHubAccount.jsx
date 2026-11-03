import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Eye,
  EyeOff,
  FileCheck2,
  FileText,
  Home,
  ImagePlus,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./RequestWellnessHubAccount.css";

const API_BASE_URL = "/api";
const MAX_COVER_SIZE = 20 * 1024 * 1024;
const MAX_GALLERY_SIZE = 20 * 1024 * 1024;
const MAX_GALLERY_IMAGES = 5;
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
];
const ACCEPTED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
];

const isAcceptedImage = (file) =>
  Boolean(
    (file && file.type && ACCEPTED_IMAGE_TYPES.includes(file.type)) ||
    (file && file.name && /\.(png|jpe?g)$/i.test(file.name))
  );

const isAcceptedDocument = (file) =>
  Boolean(
    (file && file.type === "application/pdf") ||
    (file && file.name && /\.pdf$/i.test(file.name)) ||
    isAcceptedImage(file)
  );

const DOCUMENT_TYPE_OPTIONS = [
  "ใบอนุญาตประกอบกิจการ / ใบอนุญาตสปาเพื่อสุขภาพ",
  "สำเนาบัตรประชาชนผู้มีอำนาจลงนาม",
  "หนังสือรับรองนิติบุคคล / ทะเบียนพาณิชย์",
  "หนังสือมอบอำนาจ (ถ้ามี)",
  "เอกสารรับรองมาตรฐานสถานประกอบการ",
  "เอกสารอื่นๆ (ระบุเอง)",
];

const DAYS = [
  { key: "monday", label: "วันจันทร์" },
  { key: "tuesday", label: "วันอังคาร" },
  { key: "wednesday", label: "วันพุธ" },
  { key: "thursday", label: "วันพฤหัสบดี" },
  { key: "friday", label: "วันศุกร์" },
  { key: "saturday", label: "วันเสาร์" },
  { key: "sunday", label: "วันอาทิตย์" },
];

function createDefaultOperatingHours() {
  return DAYS.reduce((result, day, index) => {
    result[day.key] = {
      active: index < 6,
      open: index < 6 ? "09:00" : "",
      close: index < 6 ? "18:00" : "",
    };
    return result;
  }, {});
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์ได้"));
    reader.readAsDataURL(file);
  });
}

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.response?.data ||
    "ไม่สามารถส่งคำขอได้ กรุณาลองใหมู่อีกครั้ง"
  );
}

export default function RequestWellnessHubAccount() {
  const navigate = useNavigate();

  const coverInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
    hubName: "",
    email: "",
  });

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [galleryImages, setGalleryImages] = useState([]);
  const [documentRows, setDocumentRows] = useState([
    {
      id: 1,
      type: DOCUMENT_TYPE_OPTIONS[0],
      customType: "",
      file: null,
      name: "",
      error: "",
    },
  ]);

  const [is24Hours, setIs24Hours] = useState(false);
  const [operatingHours, setOperatingHours] = useState(
    createDefaultOperatingHours(),
  );
  const [scheduleMode, setScheduleMode] = useState("same"); // 'same' | 'custom' | '24hours'
  const [sameOpenTime, setSameOpenTime] = useState("09:00");
  const [sameCloseTime, setSameCloseTime] = useState("18:00");

  const [formData, setFormData] = useState({
    // ผู้สมัคร
    requesterName: "",
    userEmail: "",
    contactInformation: "",
    tellInformation: "",

    // บัญชีผู้ใช้
    username: "",
    password: "",

    // สถานประกอบการ
    licenseId: "",
    wellnessHubName: "",
    address: "",
    googleMapsLink: "",
    wellnessHubDescription: "",

    // หมวดหมู่ / พื้นที่
    categoryId: "",
    districtId: "",

    // ข้อมูลเพิ่มเติม
    certificateType: "",
  });

  const [categories, setCategories] = useState([]);
  const [districts, setDistricts] = useState([]);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [categoriesRes, districtsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/categories`),
          axios.get(`${API_BASE_URL}/districts`),
        ]);
        const catList = categoriesRes.data || [];
        setCategories(catList);
        setDistricts(districtsRes.data || []);

        const defaultCat = catList.find((c) =>
          (c.categoryName || c.name || "").includes("นวดและสปา")
        );
        if (defaultCat) {
          setFormData((prev) => ({
            ...prev,
            categoryId: prev.categoryId || defaultCat.categoryId || defaultCat.id || "",
          }));
        }
      } catch (error) {
        console.error("ไม่สามารถดึงข้อมูลหมวดหมู่หรืออำเภอได้", error);
      }
    };

    fetchMasterData();
  }, []);

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

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    if (formErrors[name]) {
      setFormErrors((previousErrors) => ({
        ...previousErrors,
        [name]: "",
      }));
    }
  };

  const handleCoverChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!isAcceptedImage(file)) {
      setFormErrors((prev) => ({
        ...prev,
        coverFile: "ต้องเป็นไฟล์รูปภาพนามสกุล .png, .jpg และ .jpeg เท่านั้น",
      }));
      return;
    }

    if (file.size > MAX_COVER_SIZE) {
      setFormErrors((prev) => ({
        ...prev,
        coverFile: "รูปหน้าปกต้องมีขนาดไม่เกิน 20 MB",
      }));
      return;
    }

    try {
      const preview = await readFileAsDataUrl(file);
      setCoverFile(file);
      setCoverPreview(preview);
      setFormErrors((prev) => ({ ...prev, coverFile: "" }));
    } catch (error) {
      setFormErrors((prev) => ({
        ...prev,
        coverFile: "ไม่สามารถอ่านรูปภาพได้",
      }));
    }
  };

  const handleGalleryChange = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";

    if (selectedFiles.length === 0) return;

    const remainingSlots = MAX_GALLERY_IMAGES - galleryImages.length;
    if (remainingSlots <= 0) {
      setFormErrors((prev) => ({
        ...prev,
        galleryImages: `เพิ่มรูปบรรยากาศได้สูงสุด ${MAX_GALLERY_IMAGES} รูป`,
      }));
      return;
    }

    const acceptedFiles = selectedFiles
      .filter((file) => isAcceptedImage(file))
      .filter((file) => file.size <= MAX_GALLERY_SIZE)
      .slice(0, remainingSlots);

    if (acceptedFiles.length !== selectedFiles.length) {
      setFormErrors((prev) => ({
        ...prev,
        galleryImages:
          "บางไฟล์ไม่ถูกเพิ่ม เนื่องจากชนิดไฟล์ไม่รองรับ (ต้องเป็นไฟล์รูปภาพนามสกุล .png, .jpg และ .jpeg เท่านั้น) ขนาดเกิน 20 MB หรือเกินจำนวนสูงสุด",
      }));
    } else {
      setFormErrors((prev) => ({ ...prev, galleryImages: "" }));
    }

    const newImages = await Promise.all(
      acceptedFiles.map(async (file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        preview: await readFileAsDataUrl(file),
      })),
    );

    setGalleryImages((prev) => [...prev, ...newImages]);
  };

  const removeGalleryImage = (imageId) => {
    setGalleryImages((prev) => prev.filter((image) => image.id !== imageId));
  };

  const handleAddDocumentRow = () => {
    setDocumentRows((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        type: DOCUMENT_TYPE_OPTIONS[0],
        customType: "",
        file: null,
        name: "",
        error: "",
      },
    ]);
  };

  const handleRemoveDocumentRow = (id) => {
    setDocumentRows((prev) => {
      if (prev.length <= 1) {
        return [
          {
            id: Date.now(),
            type: DOCUMENT_TYPE_OPTIONS[0],
            customType: "",
            file: null,
            name: "",
            error: "",
          },
        ];
      }
      return prev.filter((row) => row.id !== id);
    });
  };

  const handleDocumentTypeChange = (id, newType) => {
    setDocumentRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, type: newType, error: "" } : row
      )
    );
  };

  const handleDocumentCustomTypeChange = (id, newCustomType) => {
    setDocumentRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, customType: newCustomType, error: "" } : row
      )
    );
  };

  const handleDocumentFileChange = (id, file) => {
    if (!file) return;

    if (!isAcceptedDocument(file)) {
      setDocumentRows((prev) =>
        prev.map((row) =>
          row.id === id
            ? { ...row, error: "เอกสารต้องเป็นไฟล์ PDF หรือรูปภาพนามสกุล .png, .jpg, .jpeg เท่านั้น" }
            : row
        )
      );
      return;
    }

    if (file.size > MAX_DOCUMENT_SIZE) {
      setDocumentRows((prev) =>
        prev.map((row) =>
          row.id === id
            ? { ...row, error: "ไฟล์เอกสารต้องมีขนาดไม่เกิน 10 MB" }
            : row
        )
      );
      return;
    }

    // 🔒 ดักตรวจสอบชื่อไฟล์เอกสารห้ามซ้ำกัน
    const isDuplicateName = documentRows.some(
      (row) =>
        row.id !== id &&
        row.name &&
        row.name.trim().toLowerCase() === file.name.trim().toLowerCase()
    );

    if (isDuplicateName) {
      setDocumentRows((prev) =>
        prev.map((row) =>
          row.id === id
            ? { ...row, error: `ชื่อไฟล์ "${file.name}" ถูกเลือกไปแล้ว กรุณาเลือกไฟล์ที่ไม่ซ้ำกัน` }
            : row
        )
      );
      return;
    }

    setDocumentRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
            ...row,
            file: file,
            name: file.name,
            error: "",
          }
          : row
      )
    );
    setFormErrors((prev) => ({ ...prev, verificationDocument: "" }));
  };

  const handleRemoveDocumentFile = (id) => {
    setDocumentRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
            ...row,
            file: null,
            name: "",
            error: "",
          }
          : row
      )
    );
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
      } else if (mode === "custom" && is24Hours) {
        setOperatingHours(createDefaultOperatingHours());
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
      return {
        ...previousHours,
        [dayKey]: {
          ...currentDay,
          active: !currentDay.active,
          open: !currentDay.active ? currentDay.open || "09:00" : "",
          close: !currentDay.active ? currentDay.close || "18:00" : "",
        },
      };
    });
    if (formErrors.operatingHours) {
      setFormErrors((prev) => ({ ...prev, operatingHours: "" }));
    }
  };

  const handleTimeChange = (dayKey, field, value) => {
    setOperatingHours((previousHours) => ({
      ...previousHours,
      [dayKey]: {
        ...previousHours[dayKey],
        [field]: value,
      },
    }));

    if (formErrors.operatingHours) {
      setFormErrors((prev) => ({ ...prev, operatingHours: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};

    // ผู้สมัคร
    const requesterName = formData.requesterName.trim();
    if (!requesterName) {
      errors.requesterName = "กรุณาระบุชื่อ–นามสกุลผู้ยื่นคำขอ";
    } else if (requesterName.length < 4 || requesterName.length > 255) {
      errors.requesterName = "ชื่อ–นามสกุลผู้ยื่นคำขอต้องมีความยาว 4–255 ตัวอักษร";
    }

    const userEmail = formData.userEmail.trim();
    if (!userEmail) {
      errors.userEmail = "กรุณาระบุอีเมล";
    } else if (/\s/.test(formData.userEmail)) {
      errors.userEmail = "อีเมลต้องไม่มีช่องว่าง";
    } else if (userEmail.length < 5 || userEmail.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      errors.userEmail = "รูปแบบอีเมลไม่ถูกต้อง (ความยาว 5–255 ตัวอักษร)";
    }

    const tellInfo = formData.tellInformation.trim();
    if (!tellInfo) {
      errors.tellInformation = "กรุณาระบุเบอร์โทรศัพท์";
    } else if (!/^(1669|[0-9]{3,4}|[0-9]{9,10})$/.test(tellInfo)) {
      errors.tellInformation = "เบอร์โทรศัพท์ต้องเป็นตัวเลข 9–10 หลัก หรือเบอร์ฉุกเฉิน (เช่น 1669) และไม่มีสัญลักษณ์พิเศษหรือช่องว่าง";
    }

    // ข้อมูลบัญชีผู้ใช้
    const username = formData.username.trim();
    if (!username) {
      errors.username = "กรุณาระบุชื่อผู้ใช้";
    } else if (/\s/.test(formData.username)) {
      errors.username = "ชื่อผู้ใช้ต้องไม่มีช่องว่าง";
    } else if (username.length < 4 || username.length > 20) {
      errors.username = "ชื่อผู้ใช้ต้องมีความยาว 4–20 ตัวอักษร";
    }

    const password = formData.password;
    if (!password) {
      errors.password = "กรุณาระบุรหัสผ่าน";
    } else if (/\s/.test(password)) {
      errors.password = "รหัสผ่านต้องไม่มีช่องว่าง";
    } else if (password.length !== 8) {
      errors.password = "รหัสผ่านต้องมีความยาว 8 ตัวอักษรเท่านั้น";
    }

    // สถานประกอบการ
    const hubName = formData.wellnessHubName.trim();
    if (!hubName) {
      errors.wellnessHubName = "กรุณาระบุชื่อสถานประกอบการ";
    } else if (hubName.length < 3 || hubName.length > 100) {
      errors.wellnessHubName = "ชื่อสถานประกอบการต้องมีความยาว 3–100 ตัวอักษร";
    }

    const licenseId = formData.licenseId.trim();
    if (!licenseId) {
      errors.licenseId = "กรุณาระบุเลขที่ใบอนุญาต";
    } else if (/\s/.test(formData.licenseId) || !/^[A-Za-z0-9]{10,13}$/.test(licenseId)) {
      errors.licenseId = "เลขที่ใบอนุญาตต้องเป็นภาษาอังกฤษหรือตัวเลข 10–13 ตัวอักษรและไม่มีช่องว่าง";
    }

    if (!formData.categoryId) {
      errors.categoryId = "กรุณาเลือกหมวดหมู่";
    }

    if (!formData.districtId) {
      errors.districtId = "กรุณาเลือกอำเภอ/พื้นที่";
    }

    const address = formData.address.trim();
    if (!address) {
      errors.address = "กรุณาระบุที่อยู่";
    } else if (address.length < 10 || address.length > 255) {
      errors.address = "ที่อยู่ต้องมีความยาว 10–255 ตัวอักษร";
    }

    const contactInfo = formData.contactInformation.trim();
    if (contactInfo && (contactInfo.length < 3 || contactInfo.length > 255)) {
      errors.contactInformation = "ช่องทางติดต่อเพิ่มเติมต้องมีความยาว 3–255 ตัวอักษร";
    }

    const gmapsLink = formData.googleMapsLink.trim();
    if (!gmapsLink) {
      errors.googleMapsLink = "กรุณาระบุลิงก์ Google Maps";
    } else if (/\s/.test(formData.googleMapsLink)) {
      errors.googleMapsLink = "ลิงก์ Google Maps ต้องไม่มีช่องว่าง";
    } else if (!/^https?:\/\//i.test(gmapsLink)) {
      errors.googleMapsLink =
        "ลิงก์ Google Maps ต้องขึ้นต้นด้วย http:// หรือ https://";
    }

    const hubDescription = formData.wellnessHubDescription.trim();
    if (hubDescription && hubDescription.length > 255) {
      errors.wellnessHubDescription = "รายละเอียดสถานประกอบการต้องมีความยาวไม่เกิน 255 ตัวอักษร";
    }

    const uploadedDocs = documentRows.filter((docRow) => docRow.file);
    if (uploadedDocs.length === 0) {
      errors.verificationDocument = "กรุณาแนบเอกสารยืนยันสิทธิ์อย่างน้อย 1 ไฟล์";
    } else {
      const invalidCustom = uploadedDocs.some(
        (docItem) => docItem.type === "เอกสารอื่นๆ (ระบุเอง)" && !docItem.customType.trim(),
      );
      if (invalidCustom) {
        errors.verificationDocument =
          "กรุณาระบุชื่อประเภทเอกสารสำหรับรายการ 'เอกสารอื่นๆ'";
      }

      // ตรวจสอบชื่อไฟล์เอกสารซ้ำกัน
      const fileNames = uploadedDocs
        .map((docItem) => (docItem.name || docItem.file?.name || "").trim().toLowerCase())
        .filter(Boolean);
      const duplicateNames = fileNames.filter(
        (fileName, fileIndex) => fileNames.indexOf(fileName) !== fileIndex
      );
      if (duplicateNames.length > 0) {
        errors.verificationDocument = "ชื่อไฟล์เอกสารยืนยันสิทธิ์ต้องไม่ซ้ำกัน กรุณาตรวจสอบไฟล์แนบ";
      }
    }

    if (!is24Hours) {
      const activeDays = Object.entries(operatingHours).filter(
        ([, detail]) => detail.active,
      );

      if (activeDays.length === 0) {
        errors.operatingHours =
          "กรุณาเลือกวันเปิดให้บริการอย่างน้อย 1 วัน หรือเปิดบริการ 24 ชั่วโมง";
      }

      activeDays.forEach(([dayKey, detail]) => {
        if (!detail.open || !detail.close) {
          errors.operatingHours =
            "วันที่เปิดให้บริการต้องระบุเวลาเปิดและเวลาปิดให้ครบ";
        } else if (detail.open >= detail.close) {
          const dayLabel = DAYS.find((day) => day.key === dayKey)?.label;
          errors.operatingHours = `เวลาเปิดของ${dayLabel}ต้องน้อยกว่าเวลาปิด`;
        }
      });
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const parseLatLngFromGoogleMapsLink = (url) => {
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
    const placeMatches = [...trimmed.matchAll(/!3d(-?\d+(?:\.\d+)?)[^!]*!4d(-?\d+(?:\.\d+)?)/g)];
    if (placeMatches.length > 0) {
      const lastMatch = placeMatches[placeMatches.length - 1];
      const lat = parseFloat(lastMatch[1]);
      const lng = parseFloat(lastMatch[2]);
      if (isValidLatLng(lat, lng)) {
        return { lat, lng };
      }
    }

    // 2. Query พิกัดระบุตรงๆ เช่น ?q=lat,lng หรือ ?query=lat,lng หรือ ?ll=lat,lng
    const queryMatches = [...trimmed.matchAll(/[?&](?:q|query|ll|destination|daddr)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)];
    if (queryMatches.length > 0) {
      const lastQueryMatch = queryMatches[queryMatches.length - 1];
      const lat = parseFloat(lastQueryMatch[1]);
      const lng = parseFloat(lastQueryMatch[2]);
      if (isValidLatLng(lat, lng)) {
        return { lat, lng };
      }
    }

    // 3. Fallback: พิกัดกึ่งกลางกล้อง/หน้าจอ (@lat,lng)
    const viewportMatch = trimmed.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (viewportMatch) {
      const lat = parseFloat(viewportMatch[1]);
      const lng = parseFloat(viewportMatch[2]);
      if (isValidLatLng(lat, lng)) {
        return { lat, lng };
      }
    }

    // 4. Direction/Search path พิกัดปลายทาง
    const directionMatch = trimmed.match(/\/(?:dir|search)\/[^/]*\/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/) || trimmed.match(/\/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (directionMatch) {
      const lat = parseFloat(directionMatch[1]);
      const lng = parseFloat(directionMatch[2]);
      if (isValidLatLng(lat, lng)) {
        return { lat, lng };
      }
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    if (!validateForm()) {
      setStatusModal({
        isOpen: true,
        type: "warning",
        title: "กรุณากรอกข้อมูลและแนบเอกสารให้ครบถ้วน",
        message: "กรุณากรอกข้อมูลและแนบเอกสารให้ครบถ้วน",
      });
      return;
    }

    setSubmitting(true);

    const licenseId = formData.licenseId.trim();
    const name = formData.wellnessHubName.trim();
    const gmapsLink = formData.googleMapsLink.trim();
    const parsedCoords = parseLatLngFromGoogleMapsLink(gmapsLink);

    try {
      const [existingHubsRes, existingEmerRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/wellness-hubs`),
        axios.get(`${API_BASE_URL}/emergency-services`),
      ]);
      const hubsList = existingHubsRes.status === "fulfilled" && Array.isArray(existingHubsRes.value?.data)
        ? existingHubsRes.value.data
        : [];
      const emerList = existingEmerRes.status === "fulfilled" && Array.isArray(existingEmerRes.value?.data)
        ? existingEmerRes.value.data
        : [];
      const allExisting = [...hubsList, ...emerList];

      // 1) เช็กเลขที่ใบอนุญาตซ้ำ
      const isDuplicateLicense = allExisting.some(
        (hub) => String(hub.licenseId || "").trim() === licenseId
      );
      if (isDuplicateLicense) {
        setFormErrors((prev) => ({
          ...prev,
          licenseId: "เลขที่ใบอนุญาตสถานประกอบการนี้มีอยู่ในระบบแล้ว กรุณาตรวจสอบอีกครั้ง",
        }));
        setSubmitting(false);
        setStatusModal({
          isOpen: true,
          type: "warning",
          title: "ข้อมูลซ้ำในระบบ",
          message: "เลขที่ใบอนุญาตสถานประกอบการนี้มีอยู่ในระบบแล้ว กรุณาตรวจสอบอีกครั้ง",
        });
        return;
      }

      // 2) เช็กชื่อซ้ำ
      const isDuplicateName = allExisting.some(
        (hub) => String(hub.wellnessHubName || "").trim().toLowerCase() === name.toLowerCase()
      );
      if (isDuplicateName) {
        setFormErrors((prev) => ({
          ...prev,
          wellnessHubName: "ชื่อสถานประกอบการนี้มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น",
        }));
        setSubmitting(false);
        setStatusModal({
          isOpen: true,
          type: "warning",
          title: "ข้อมูลซ้ำในระบบ",
          message: "ชื่อสถานประกอบการนี้มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น",
        });
        return;
      }

      // 3) เช็กพิกัด / ลิงก์ Google Maps ซ้ำ
      const isDuplicateLink = allExisting.some(
        (hub) => hub.googleMapsLink && String(hub.googleMapsLink).trim().toLowerCase() === gmapsLink.toLowerCase()
      );

      let isDuplicateCoords = false;
      if (parsedCoords) {
        isDuplicateCoords = allExisting.some((hub) => {
          const hLat = parseFloat(hub.wellnessHubLatitude ?? hub.latitude);
          const hLng = parseFloat(hub.wellnessHubLongitude ?? hub.longitude);

          return (
            !isNaN(hLat) &&
            !isNaN(hLng) &&
            Math.abs(hLat - parsedCoords.lat) < 0.0001 &&
            Math.abs(hLng - parsedCoords.lng) < 0.0001
          );
        });
      }

      if (isDuplicateLink || isDuplicateCoords) {
        const duplicateMsg = isDuplicateLink
          ? "ลิงก์ Google Maps นี้มีอยู่ในระบบแล้ว กรุณาตรวจสอบอีกครั้ง"
          : "พิกัดแผนที่จาก Google Maps นี้มีอยู่ในระบบแล้ว กรุณาตรวจสอบอีกครั้ง";
        setFormErrors((prev) => ({
          ...prev,
          googleMapsLink: duplicateMsg,
        }));
        setSubmitting(false);
        setStatusModal({
          isOpen: true,
          type: "warning",
          title: "ข้อมูลซ้ำในระบบ",
          message: duplicateMsg,
        });
        return;
      }
    } catch (err) {
      console.warn("⚠️ ไม่สามารถเช็กข้อมูลซ้ำล่วงหน้าได้:", err);
    }

    try {
      const coverImage = coverFile ? await readFileAsDataUrl(coverFile) : "";
      const galleryImageValues = galleryImages.map((image) => image.preview);

      const validDocs = documentRows.filter((row) => row.file);
      const docsPayload = await Promise.all(
        validDocs.map(async (row) => ({
          type:
            row.type === "เอกสารอื่นๆ (ระบุเอง)"
              ? row.customType.trim() || "เอกสารอื่นๆ"
              : row.type,
          name: row.file.name,
          data: await readFileAsDataUrl(row.file),
        })),
      );

      const payload = {
        licenseId: formData.licenseId.trim(),
        wellnessHubName: name,
        categoryId: formData.categoryId,
        districtId: formData.districtId,
        requesterName: formData.requesterName.trim(),
        userEmail: formData.userEmail.trim(),
        username: formData.username.trim(),
        password: formData.password.trim(),

        tellInformation: formData.tellInformation.trim(),
        contactInformation: formData.contactInformation.trim(),
        address: formData.address.trim(),
        googleMapsLink: gmapsLink,
        wellnessHubDescription: formData.wellnessHubDescription.trim(),

        operatingHours: JSON.stringify(operatingHours),

        wellnessHubLatitude: parsedCoords ? parsedCoords.lat : null,
        wellnessHubLongitude: parsedCoords ? parsedCoords.lng : null,

        wellnessHubImg: coverImage || "",
        wellnessHubGallery: JSON.stringify(galleryImageValues),

        certificateType: certificateList
          .map((c) => c.trim())
          .filter(Boolean)
          .join(", "),

        verificationDocuments: JSON.stringify(docsPayload),
      };

      await axios.post(`${API_BASE_URL}/account-requests`, payload, {
        timeout: 60000,
        headers: {
          "Content-Type": "application/json",
        },
      });

      setStatusModal({
        isOpen: true,
        type: "success",
        title: "นำส่งเอกสารคำขอสำเร็จ!",
        message: `ระบบได้นำส่งเอกสารคำร้องขอเปิดใช้งานสำหรับ "${name}" ไปยังเจ้าหน้าที่เรียบร้อยแล้ว`,
        hubName: name,
        email: formData.userEmail.trim(),
      });
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      const isDuplicate =
        errorMsg.includes("ซ้ำ") ||
        errorMsg.includes("มีอยู่แล้ว") ||
        errorMsg.includes("ถูกใช้งานแล้ว") ||
        errorMsg.includes("รอตรวจสอบ");

      if (errorMsg.includes("เลขใบอนุญาต") || errorMsg.includes("เลขที่ใบอนุญาต")) {
        setFormErrors((prev) => ({ ...prev, licenseId: errorMsg }));
      } else if (errorMsg.includes("ชื่อผู้ใช้") || errorMsg.includes("Username")) {
        setFormErrors((prev) => ({ ...prev, username: errorMsg }));
      } else if (errorMsg.includes("ชื่อสถานประกอบการ")) {
        setFormErrors((prev) => ({ ...prev, wellnessHubName: errorMsg }));
      } else if (errorMsg.includes("Google Maps") || errorMsg.includes("พิกัด")) {
        setFormErrors((prev) => ({ ...prev, googleMapsLink: errorMsg }));
      }

      setFormErrors((prev) => ({
        ...prev,
        submit: errorMsg,
      }));
      setStatusModal({
        isOpen: true,
        type: isDuplicate ? "warning" : "error",
        title: isDuplicate ? "ข้อมูลซ้ำในระบบ" : "ไม่สามารถส่งคำขอได้",
        message: errorMsg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="request-account-page">
      <header className="request-account-hero">
        <div className="request-account-container">
          <div className="request-account-hero__layout">
            <div>
              <p className="request-account-eyebrow">WELLNESS HUB OWNERSHIP</p>
              <h1>ลงทะเบียนสถานประกอบการใหม่</h1>
              <p className="request-account-hero__description">
                กรอกข้อมูลสถานประกอบการ แนบหลักฐานยืนยันสิทธิ์
                และส่งคำขอให้ผู้ดูแลระบบพิจารณา
              </p>
            </div>

            <div className="request-account-hero__hub">
              <Building2 />
              <div>
                <span>สถานประกอบการใหม่</span>
                <strong>
                  {formData.wellnessHubName || "ระบุชื่อสถานประกอบการ"}
                </strong>
                <p>
                  {formData.licenseId
                    ? `ใบอนุญาต ${formData.licenseId}`
                    : "ยังไม่ได้ระบุเลขที่ใบอนุญาต"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="request-account-container request-account-content">
        <form
          className="request-account-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <aside className="request-account-progress">
            <div className="request-account-progress__header">
              <ShieldCheck />
              <div>
                <span>REQUEST FORM</span>
                <h2>ขั้นตอนการลงทะเบียน</h2>
              </div>
            </div>

            <div className="request-account-progress__list">
              <div className="request-account-progress__item">
                <span>01</span>
                <div>
                  <strong>ข้อมูลสถานประกอบการ</strong>
                  <p>ชื่อ เลขที่ใบอนุญาต หมวดหมู่</p>
                </div>
              </div>

              <div className="request-account-progress__line" />

              <div className="request-account-progress__item">
                <span>02</span>
                <div>
                  <strong>รูปภาพ</strong>
                  <p>รูปปกและบรรยากาศ</p>
                </div>
              </div>

              <div className="request-account-progress__line" />

              <div className="request-account-progress__item">
                <span>03</span>
                <div>
                  <strong>ข้อมูลติดต่อ</strong>
                  <p>ที่ตั้งและรายละเอียดบริการ</p>
                </div>
              </div>

              <div className="request-account-progress__line" />

              <div className="request-account-progress__item">
                <span>04</span>
                <div>
                  <strong>เวลาทำการ</strong>
                  <p>กำหนดวันและเวลาเปิด</p>
                </div>
              </div>

              <div className="request-account-progress__line" />

              <div className="request-account-progress__item">
                <span>05</span>
                <div>
                  <strong>ข้อมูลผู้ยื่นและบัญชี</strong>
                  <p>ข้อมูลส่วนตัวและเอกสารยืนยัน</p>
                </div>
              </div>
            </div>

            <div className="request-account-progress__notice">
              <LockKeyhole />
              <p>
                ข้อมูลและเอกสารจะถูกส่งให้ผู้ดูแลระบบตรวจสอบก่อนเปิดสิทธิ์ใช้งาน
              </p>
            </div>
          </aside>

          <div className="request-account-form-main">
            <section className="request-account-form-intro">
              <div>
                <p>BEFORE YOU SUBMIT</p>
                <h2>ตรวจสอบข้อมูลให้ครบก่อนส่งคำขอ</h2>
                <span>
                  ช่องที่มีเครื่องหมาย <strong>*</strong> จำเป็นต้องกรอก
                </span>
              </div>
              <ShieldCheck />
            </section>

            {/* ส่วนที่ 01: ข้อมูลสถานประกอบการ */}
            <section className="request-account-section">
              <div className="request-account-section__heading">
                <span>01</span>
                <div>
                  <h2>ข้อมูลสถานประกอบการ</h2>
                  <p>ระบุข้อมูลหลักของสถานประกอบการและประเภทธุรกิจ</p>
                </div>
              </div>

              <div className="request-account-fields">
                <div className="request-account-field">
                  <label htmlFor="wellnessHubName">
                    ชื่อสถานประกอบการ <em>*</em>
                  </label>
                  <input
                    id="wellnessHubName"
                    name="wellnessHubName"
                    type="text"
                    maxLength={100}
                    value={formData.wellnessHubName}
                    onChange={handleInputChange}
                    placeholder="เช่น นวดแผนไทย เชียงใหม่ (3–100 ตัวอักษร)"
                    className={
                      formErrors.wellnessHubName
                        ? "request-account-input--error"
                        : ""
                    }
                  />
                  <div className="request-account-field-footer">
                    {formErrors.wellnessHubName ? (
                      <p className="request-account-field-error">
                        {formErrors.wellnessHubName}
                      </p>
                    ) : (
                      <span />
                    )}
                    <span className="request-account-char-count">
                      {(formData.wellnessHubName || "").length}/100
                    </span>
                  </div>
                </div>

                <div className="request-account-field">
                  <label htmlFor="licenseId">
                    เลขที่ใบอนุญาต <em>*</em>
                  </label>
                  <input
                    id="licenseId"
                    name="licenseId"
                    type="text"
                    maxLength={13}
                    value={formData.licenseId}
                    onChange={handleInputChange}
                    placeholder="เช่น 5001234567 (10–13 ตัวอักษร)"
                    className={
                      formErrors.licenseId ? "request-account-input--error" : ""
                    }
                  />
                  <div className="request-account-field-footer">
                    {formErrors.licenseId ? (
                      <p className="request-account-field-error">
                        {formErrors.licenseId}
                      </p>
                    ) : (
                      <span />
                    )}
                    <span className="request-account-char-count">
                      {(formData.licenseId || "").length}/13
                    </span>
                  </div>
                </div>

                <div className="request-account-field">
                  <label htmlFor="categoryId">
                    หมวดหมู่ <em>*</em>
                  </label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className={
                      formErrors.categoryId
                        ? "request-account-input--error"
                        : ""
                    }
                  >
                    <option value="">-- เลือกหมวดหมู่ --</option>
                    {categories.map((cat) => (
                      <option
                        key={cat.categoryId || cat.id}
                        value={cat.categoryId || cat.id}
                      >
                        {cat.categoryName || cat.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.categoryId && (
                    <p className="request-account-field-error">
                      {formErrors.categoryId}
                    </p>
                  )}
                </div>

                <div className="request-account-field">
                  <label htmlFor="districtId">
                    อำเภอ / พื้นที่ <em>*</em>
                  </label>
                  <select
                    id="districtId"
                    name="districtId"
                    value={formData.districtId}
                    onChange={handleInputChange}
                    className={
                      formErrors.districtId
                        ? "request-account-input--error"
                        : ""
                    }
                  >
                    <option value="">-- เลือกอำเภอ --</option>
                    {districts.map((dist) => (
                      <option
                        key={dist.districtId || dist.id}
                        value={dist.districtId || dist.id}
                      >
                        {dist.districtName || dist.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.districtId && (
                    <p className="request-account-field-error">
                      {formErrors.districtId}
                    </p>
                  )}
                </div>

                <div className="request-account-field request-account-field--full">
                  <div className="request-account-cert-header">
                    <label>
                      ประเภทใบรับรอง / มาตรฐาน (1 ใบต่อ 1 ช่อง)
                    </label>
                    <button
                      type="button"
                      className="request-account-btn-add-cert"
                      onClick={addCertField}
                    >
                      <Plus size={14} />
                      เพิ่มใบรับรอง
                    </button>
                  </div>

                  <div className="request-account-cert-list">
                    {certificateList.map((cert, index) => (
                      <div key={index} className="request-account-cert-row">
                        <input
                          type="text"
                          value={cert}
                          onChange={(e) => handleCertChange(index, e.target.value)}
                          placeholder={`เช่น มาตรฐาน SHA Plus, นวดไทยเพื่อสุขภาพ สบส., Green Hotel (ระบุมาตรฐาน/รางวัล หรือเว้นว่างได้)`}
                        />
                        {certificateList.length > 1 && (
                          <button
                            type="button"
                            className="request-account-btn-del-cert"
                            onClick={() => removeCertField(index)}
                            title="ลบใบรับรองนี้"
                            aria-label={`ลบใบรับรองที่ ${index + 1}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ส่วนที่ 02: รูปภาพ */}
            <section className="request-account-section">
              <div className="request-account-section__heading">
                <span>02</span>
                <div>
                  <h2>รูปภาพสถานประกอบการ</h2>
                  <p>
                    เลือกรูปที่ช่วยให้ผู้ใช้งานเห็นบรรยากาศและสถานที่ได้ชัดเจน
                  </p>
                </div>
              </div>

              <div className="request-account-photo-layout">
                <div className="request-account-cover-group">
                  <div className="request-account-label-row">
                    <label>รูปหน้าปก</label>
                    <span>แนะนำภาพแนวนอน</span>
                  </div>

                  <button
                    type="button"
                    className="request-account-cover-upload"
                    onClick={() => coverInputRef.current?.click()}
                  >
                    {coverPreview ? (
                      <img src={coverPreview} alt="ตัวอย่างรูปหน้าปก" />
                    ) : (
                      <div className="request-account-upload-placeholder">
                        <ImagePlus />
                        <strong>เพิ่มรูปหน้าปก</strong>
                        <span>JPG, JPEG หรือ PNG (ไม่เกิน 20 MB)</span>
                      </div>
                    )}

                    <span className="request-account-cover-upload__action">
                      <Upload />
                      {coverPreview ? "เปลี่ยนรูป" : "อัปโหลด"}
                    </span>
                  </button>

                  <input
                    ref={coverInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                    hidden
                    onChange={handleCoverChange}
                  />

                  {formErrors.coverFile && (
                    <p className="request-account-field-error">
                      {formErrors.coverFile}
                    </p>
                  )}
                </div>

                <div className="request-account-gallery-group">
                  <div className="request-account-gallery-heading">
                    <label>รูปภาพบรรยากาศ</label>
                    <span>
                      {galleryImages.length}/{MAX_GALLERY_IMAGES} รูป
                    </span>
                  </div>

                  <div className="request-account-gallery">
                    {galleryImages.map((image) => (
                      <div
                        key={image.id}
                        className="request-account-gallery__item"
                      >
                        <img src={image.preview} alt={image.file.name} />
                        <button
                          type="button"
                          aria-label="ลบรูปภาพ"
                          onClick={() => removeGalleryImage(image.id)}
                        >
                          <Trash2 />
                        </button>
                      </div>
                    ))}

                    {galleryImages.length < MAX_GALLERY_IMAGES && (
                      <button
                        type="button"
                        className="request-account-gallery__add"
                        onClick={() => galleryInputRef.current?.click()}
                      >
                        <ImagePlus />
                        <span>เพิ่มรูปภาพ</span>
                      </button>
                    )}
                  </div>

                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                    multiple
                    hidden
                    onChange={handleGalleryChange}
                  />

                  {formErrors.galleryImages && (
                    <p className="request-account-field-error">
                      {formErrors.galleryImages}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* ส่วนที่ 03: ที่ตั้งและช่องทางติดต่อ */}
            <section className="request-account-section">
              <div className="request-account-section__heading">
                <span>03</span>
                <div>
                  <h2>ที่ตั้งและช่องทางติดต่อ</h2>
                  <p>ข้อมูลส่วนนี้จะแสดงต่อผู้ใช้งานหลังคำขอได้รับอนุมัติ</p>
                </div>
              </div>

              <div className="request-account-fields">
                <div className="request-account-field request-account-field--full">
                  <label htmlFor="address">
                    ที่อยู่ <em>*</em>
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    maxLength={255}
                    value={formData.address}
                    onChange={handleInputChange}
                    className={
                      formErrors.address ? "request-account-input--error" : ""
                    }
                  />
                  <div className="request-account-field-footer">
                    {formErrors.address ? (
                      <p className="request-account-field-error">
                        {formErrors.address}
                      </p>
                    ) : (
                      <span />
                    )}
                    <span className="request-account-char-count">
                      {(formData.address || "").length}/255
                    </span>
                  </div>
                </div>

                <div className="request-account-field request-account-field--full">
                  <label htmlFor="googleMapsLink">
                    ลิงก์ Google Maps <em>*</em>
                  </label>
                  <div className="request-account-input-icon">
                    <MapPin />
                    <input
                      id="googleMapsLink"
                      name="googleMapsLink"
                      type="url"
                      value={formData.googleMapsLink}
                      onChange={handleInputChange}
                      placeholder="https://maps.app.goo.gl/..."
                      className={
                        formErrors.googleMapsLink
                          ? "request-account-input--error"
                          : ""
                      }
                    />
                  </div>
                  {formErrors.googleMapsLink && (
                    <p className="request-account-field-error">
                      {formErrors.googleMapsLink}
                    </p>
                  )}
                </div>

                <div className="request-account-field">
                  <label htmlFor="tellInformation">
                    เบอร์โทรศัพท์ <em>*</em>
                  </label>
                  <div className="request-account-input-icon">
                    <Phone />
                    <input
                      id="tellInformation"
                      name="tellInformation"
                      type="tel"
                      maxLength={10}
                      value={formData.tellInformation}
                      onChange={handleInputChange}
                      placeholder="เช่น 0812345678 (9–10 หลัก)"
                      className={
                        formErrors.tellInformation
                          ? "request-account-input--error"
                          : ""
                      }
                    />
                  </div>
                  <div className="request-account-field-footer">
                    {formErrors.tellInformation ? (
                      <p className="request-account-field-error">
                        {formErrors.tellInformation}
                      </p>
                    ) : (
                      <span />
                    )}
                    <span className="request-account-char-count">
                      {(formData.tellInformation || "").length}/10
                    </span>
                  </div>
                </div>

                <div className="request-account-field">
                  <label htmlFor="contactInformation">LINE ID / Facebook</label>
                  <input
                    id="contactInformation"
                    name="contactInformation"
                    type="text"
                    maxLength={255}
                    value={formData.contactInformation}
                    onChange={handleInputChange}
                    placeholder="ช่องทางติดต่อเพิ่มเติม"
                  />
                  <div className="request-account-field-footer">
                    {formErrors.contactInformation ? (
                      <p className="request-account-field-error">
                        {formErrors.contactInformation}
                      </p>
                    ) : (
                      <span />
                    )}
                    <span className="request-account-char-count">
                      {(formData.contactInformation || "").length}/255
                    </span>
                  </div>
                </div>

                <div className="request-account-field request-account-field--full">
                  <label htmlFor="wellnessHubDescription">
                    รายละเอียดสถานประกอบการ / บริการ
                  </label>
                  <textarea
                    id="wellnessHubDescription"
                    name="wellnessHubDescription"
                    rows={5}
                    maxLength={255}
                    value={formData.wellnessHubDescription}
                    onChange={handleInputChange}
                    placeholder="อธิบายบริการ จุดเด่น และข้อมูลสำคัญของสถานประกอบการ (ไม่บังคับกรอก สูงสุด 255 ตัวอักษร)"
                    className={
                      formErrors.wellnessHubDescription
                        ? "request-account-input--error"
                        : ""
                    }
                  />
                  <div className="request-account-field-footer">
                    {formErrors.wellnessHubDescription ? (
                      <p className="request-account-field-error">
                        {formErrors.wellnessHubDescription}
                      </p>
                    ) : (
                      <span />
                    )}
                    <span className="request-account-char-count">
                      {(formData.wellnessHubDescription || "").length}/255
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* ส่วนที่ 04: เวลาทำการ */}
            <section className="request-account-section">
              <div className="request-account-section__heading">
                <span>04</span>
                <div>
                  <h2>วันและเวลาทำการ</h2>
                  <p>
                    กำหนดเวลาเปิดให้บริการของสถานประกอบการ หรือเปิดบริการ 24 ชั่วโมง
                  </p>
                </div>
              </div>

              {/* Mode Selector Tabs */}
              <div className="request-account-schedule-mode-bar">
                <button
                  type="button"
                  className={`request-account-schedule-mode-btn ${scheduleMode === "same" ? "active" : ""}`}
                  onClick={() => handleScheduleModeChange("same")}
                >
                  <Clock3 size={16} />
                  <span>เปิดเวลาเดียวกัน</span>
                  <small>กำหนดเวลาครั้งเดียว ใช้กับทุกวันที่เลือก</small>
                </button>

                <button
                  type="button"
                  className={`request-account-schedule-mode-btn ${scheduleMode === "custom" ? "active" : ""}`}
                  onClick={() => handleScheduleModeChange("custom")}
                >
                  <Calendar size={16} />
                  <span>กำหนดแยกรายวัน</span>
                  <small>ตั้งเวลาแยกเฉพาะแต่ละวัน</small>
                </button>

                <button
                  type="button"
                  className={`request-account-schedule-mode-btn ${scheduleMode === "24hours" ? "active" : ""}`}
                  onClick={() => handleScheduleModeChange("24hours")}
                >
                  <Sparkles size={16} />
                  <span>เปิดตลอด 24 ชั่วโมง</span>
                  <small>เปิดบริการทุกวันตลอดเวลา</small>
                </button>
              </div>

              {/* MODE 1: SAME HOURS (เปิดเวลาเดียวกัน) */}
              {scheduleMode === "same" && (
                <div className="request-account-same-hours-panel">
                  {/* Step 1: Day Selection */}
                  <div className="request-account-same-section">
                    <div className="request-account-same-section-header">
                      <label className="request-account-same-title">
                        1. เลือกวันเปิดให้บริการ
                      </label>
                      <div className="request-account-same-quick-links">
                        <button
                          type="button"
                          className="request-account-quick-link-btn"
                          onClick={() => handleSameQuickPreset("weekdays")}
                        >
                          จันทร์ - ศุกร์
                        </button>
                        <span className="request-account-link-sep">•</span>
                        <button
                          type="button"
                          className="request-account-quick-link-btn"
                          onClick={() => handleSameQuickPreset("all")}
                        >
                          ทุกวัน (จ.-อา.)
                        </button>
                        <span className="request-account-link-sep">•</span>
                        <button
                          type="button"
                          className="request-account-quick-link-btn"
                          onClick={() => handleSameQuickPreset("weekends")}
                        >
                          เสาร์ - อาทิตย์
                        </button>
                      </div>
                    </div>

                    <div className="request-account-day-pills">
                      {DAYS.map((day) => {
                        const isActive = Boolean(operatingHours[day.key]?.active);
                        return (
                          <button
                            key={day.key}
                            type="button"
                            className={`request-account-day-pill ${isActive ? "request-account-day-pill--active" : ""}`}
                            onClick={() => handleSameDayToggle(day.key)}
                            title={isActive ? `คลิกเพื่อปิด ${day.label}` : `คลิกเพื่อเปิด ${day.label}`}
                          >
                            <span className="request-account-day-pill-icon">
                              {isActive ? <Check size={14} /> : "+"}
                            </span>
                            <span className="request-account-day-pill-text">{day.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: Time Selection */}
                  <div className="request-account-same-section">
                    <label className="request-account-same-title">
                      2. กำหนดเวลาเปิด – ปิดทำการ
                    </label>

                    <div className="request-account-same-time-box">
                      <div className="request-account-same-time-field">
                        <label>เวลาเปิด</label>
                        <input
                          type="time"
                          value={sameOpenTime}
                          onChange={(e) => handleSameTimeChange("open", e.target.value)}
                        />
                      </div>

                      <span className="request-account-same-time-arrow">ถึง</span>

                      <div className="request-account-same-time-field">
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
                  <div className="request-account-same-summary">
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
                <div className="request-account-hours">
                  <div className="request-account-hours__header">
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
                            ? "request-account-hours__row request-account-hours__row--active"
                            : "request-account-hours__row"
                        }
                      >
                        <strong>{day.label}</strong>

                        <label className="request-account-switch">
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
                <div className="request-account-24hours-badge">
                  <span>
                    ✓ เปิดให้บริการตลอด 24 ชั่วโมงทุกวัน (จันทร์ - อาทิตย์)
                  </span>
                </div>
              )}

              {formErrors.operatingHours && (
                <p className="request-account-field-error">
                  {formErrors.operatingHours}
                </p>
              )}
            </section>

            {/* ส่วนที่ 05: ข้อมูลผู้ยื่นคำขอ บัญชีผู้ใช้ และเอกสารยืนยัน */}
            <section className="request-account-section">
              <div className="request-account-section__heading">
                <span>05</span>
                <div>
                  <h2>ผู้ยื่นคำขอและบัญชีผู้ใช้งาน</h2>
                  <p>
                    ใช้สำหรับสร้างบัญชีเข้าใช้งานและติดต่อกลับหลังการพิจารณา
                  </p>
                </div>
              </div>

              <div className="request-account-fields">
                <div className="request-account-field">
                  <label htmlFor="requesterName">
                    ชื่อ–นามสกุลผู้ยื่นคำขอ <em>*</em>
                  </label>
                  <div className="request-account-input-icon">
                    <UserRound />
                    <input
                      id="requesterName"
                      name="requesterName"
                      type="text"
                      maxLength={255}
                      value={formData.requesterName}
                      onChange={handleInputChange}
                      placeholder="ระบุชื่อและนามสกุลจริง"
                      className={
                        formErrors.requesterName
                          ? "request-account-input--error"
                          : ""
                      }
                    />
                  </div>
                  <div className="request-account-field-footer">
                    {formErrors.requesterName ? (
                      <p className="request-account-field-error">
                        {formErrors.requesterName}
                      </p>
                    ) : (
                      <span />
                    )}
                    <span className="request-account-char-count">
                      {(formData.requesterName || "").length}/255
                    </span>
                  </div>
                </div>

                <div className="request-account-field">
                  <label htmlFor="userEmail">
                    อีเมลสำหรับรับผลการอนุมัติ <em>*</em>
                  </label>
                  <div className="request-account-input-icon">
                    <Mail />
                    <input
                      id="userEmail"
                      name="userEmail"
                      type="email"
                      value={formData.userEmail}
                      onChange={handleInputChange}
                      placeholder="example@email.com"
                      className={
                        formErrors.userEmail
                          ? "request-account-input--error"
                          : ""
                      }
                    />
                  </div>
                  {formErrors.userEmail && (
                    <p className="request-account-field-error">
                      {formErrors.userEmail}
                    </p>
                  )}
                </div>

                <div className="request-account-field">
                  <label htmlFor="username">
                    ชื่อผู้ใช้ (Username) <em>*</em>
                  </label>
                  <div className="request-account-input-icon">
                    <UserRound />
                    <input
                      id="username"
                      name="username"
                      type="text"
                      maxLength={20}
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="กำหนดชื่อผู้ใช้ 4–20 ตัวอักษร"
                      className={
                        formErrors.username
                          ? "request-account-input--error"
                          : ""
                      }
                    />
                  </div>
                  <div className="request-account-field-footer">
                    {formErrors.username ? (
                      <p className="request-account-field-error">
                        {formErrors.username}
                      </p>
                    ) : (
                      <span />
                    )}
                    <span className="request-account-char-count">
                      {(formData.username || "").length}/20
                    </span>
                  </div>
                </div>

                <div className="request-account-field">
                  <label htmlFor="password">
                    รหัสผ่าน (Password) <em>*</em>
                  </label>
                  <div className="request-account-input-icon request-account-password-wrapper">
                    <LockKeyhole />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="กำหนดรหัสผ่าน 8 ตัวอักษร"
                      maxLength={8}
                      className={
                        formErrors.password
                          ? "request-account-input--error"
                          : ""
                      }
                    />
                    <button
                      type="button"
                      className="request-account-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                      aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="request-account-field-footer">
                    {formErrors.password ? (
                      <p className="request-account-field-error">
                        {formErrors.password}
                      </p>
                    ) : (
                      <span />
                    )}
                    <span className="request-account-char-count">
                      {(formData.password || "").length}/8
                    </span>
                  </div>
                </div>

                <div className="request-account-field request-account-field--full">
                  <div className="request-account-docs-header">
                    <div>
                      <label style={{ marginBottom: "2px" }}>
                        เอกสารยืนยันสิทธิ์และใบอนุญาต <em>*</em>
                      </label>
                      <p className="request-account-docs-desc">
                        แนบเอกสารเพื่อยืนยันตัวตนและการเปิดสถานประกอบการ (PDF, JPG, PNG ขนาดไม่เกิน 10 MB ต่อไฟล์)
                      </p>
                    </div>
                    <button
                      type="button"
                      className="request-account-btn-add-doc"
                      onClick={handleAddDocumentRow}
                    >
                      <Plus size={15} />
                      <span>เพิ่มเอกสาร</span>
                    </button>
                  </div>

                  <div className="request-account-docs-list">
                    {documentRows.map((doc, index) => (
                      <div key={doc.id} className="request-account-doc-card">
                        <div className="request-account-doc-card__top">
                          <span className="request-account-doc-card__num">
                            เอกสารที่ {index + 1}
                          </span>
                          {documentRows.length > 1 && (
                            <button
                              type="button"
                              className="request-account-doc-card__del"
                              onClick={() => handleRemoveDocumentRow(doc.id)}
                              title="ลบรายการเอกสารนี้"
                            >
                              <Trash2 size={14} />
                              <span>ลบเอกสารนี้</span>
                            </button>
                          )}
                        </div>

                        <div className="request-account-doc-card__body">
                          <div className="request-account-doc-type-group">
                            <label className="request-account-doc-label">
                              ประเภทเอกสาร <em>*</em>
                            </label>
                            <select
                              value={doc.type}
                              onChange={(e) =>
                                handleDocumentTypeChange(doc.id, e.target.value)
                              }
                              className="request-account-doc-select"
                            >
                              {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>

                            {doc.type === "เอกสารอื่นๆ (ระบุเอง)" && (
                              <input
                                type="text"
                                placeholder="ระบุชื่อประเภทเอกสาร เช่น สัญญาเช่าสถานที่, หนังสือยินยอม..."
                                value={doc.customType}
                                onChange={(e) =>
                                  handleDocumentCustomTypeChange(
                                    doc.id,
                                    e.target.value,
                                  )
                                }
                                className="request-account-doc-custom-input"
                              />
                            )}
                          </div>

                          <div className="request-account-doc-upload-group">
                            <label className="request-account-doc-label">
                              ไฟล์เอกสาร <em>*</em>
                            </label>
                            {doc.file ? (
                              <div className="request-account-doc-attached">
                                <div className="request-account-doc-attached__icon">
                                  <FileCheck2 size={20} />
                                </div>
                                <div className="request-account-doc-attached__info">
                                  <strong>{doc.file.name}</strong>
                                  <span>
                                    {(doc.file.size / (1024 * 1024)).toFixed(2)}{" "}
                                    MB
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  className="request-account-doc-attached__remove"
                                  onClick={() => handleRemoveDocumentFile(doc.id)}
                                  title="เปลี่ยนไฟล์"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <label className="request-account-doc-dropzone">
                                <input
                                  type="file"
                                  accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                                  hidden
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    e.target.value = "";
                                    handleDocumentFileChange(doc.id, f);
                                  }}
                                />
                                <Upload size={18} />
                                <span>คลิกเพื่อเลือกไฟล์ (PDF, JPG, JPEG, PNG)</span>
                              </label>
                            )}
                          </div>
                        </div>

                        {doc.error && (
                          <p
                            className="request-account-field-error"
                            style={{ marginTop: "8px" }}
                          >
                            {doc.error}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {formErrors.verificationDocument && (
                    <p
                      className="request-account-field-error"
                      style={{ marginTop: "10px" }}
                    >
                      {formErrors.verificationDocument}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {formErrors.submit && (
              <div className="request-account-submit-error" role="alert">
                <CircleAlert />
                {formErrors.submit}
              </div>
            )}

            <div className="request-account-form-actions">
              <div>
                <strong>พร้อมส่งคำขอแล้ว?</strong>
                <span>กรุณาตรวจสอบข้อมูลและเอกสารอีกครั้งก่อนส่ง</span>
              </div>

              <div className="request-account-form-actions__buttons">
                <button
                  type="button"
                  className="request-account-cancel-button"
                  onClick={() => navigate(-1)}
                  disabled={submitting}
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  className="request-account-submit-button"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <LoaderCircle className="request-account-button-spinner" />
                      กำลังส่งคำขอ...
                    </>
                  ) : (
                    <>
                      <Send />
                      ส่งข้อมูลลงทะเบียน
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <UserSubmissionModal
        isOpen={statusModal.isOpen}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        hubName={statusModal.hubName || formData.wellnessHubName}
        userEmail={statusModal.email || formData.userEmail}
        onClose={() =>
          setStatusModal({
            isOpen: false,
            type: "info",
            title: "",
            message: "",
            hubName: "",
            email: "",
          })
        }
        onHome={() => {
          setStatusModal({
            isOpen: false,
            type: "info",
            title: "",
            message: "",
            hubName: "",
            email: "",
          });
          navigate("/");
        }}
        onTrack={() => {
          setStatusModal({
            isOpen: false,
            type: "info",
            title: "",
            message: "",
            hubName: "",
            email: "",
          });
          navigate("/track-status");
        }}
      />
    </main>
  );
}

function UserSubmissionModal({
  isOpen,
  type = "info",
  title,
  message,
  hubName,
  userEmail,
  onClose,
  onHome,
  onTrack,
}) {
  if (!isOpen) return null;

  const isSuccess = type === "success";
  const isWarning = type === "warning";
  const isError = type === "error";

  return (
    <div
      className="user-submit-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`user-submit-modal-card user-submit-modal-card--${type}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="user-submit-modal-close"
          onClick={onClose}
          aria-label="ปิดหน้าต่าง"
        >
          <X size={18} />
        </button>

        {isSuccess ? (
          <>
            {/* Animated Document Sending Illustration */}
            <div className="user-submit-doc-stage">
              <div className="user-submit-ambient-glow" />
              <div className="user-submit-pulse-ring ring-1" />
              <div className="user-submit-pulse-ring ring-2" />

              {/* Floating animated sparkles */}
              <div className="user-submit-sparkle sparkle-1">
                <Sparkles size={16} />
              </div>
              <div className="user-submit-sparkle sparkle-2">
                <Sparkles size={14} />
              </div>

              {/* Main Document Visual */}
              <div className="user-submit-paper-doc">
                <div className="user-submit-doc-header">
                  <FileText size={20} className="doc-icon" />
                  <div className="doc-lines">
                    <span className="doc-line l1" />
                    <span className="doc-line l2" />
                  </div>
                </div>
                <div className="user-submit-doc-body">
                  <span className="doc-line l3" />
                  <span className="doc-line l4" />
                </div>
                <div className="user-submit-stamp">
                  <CheckCircle2 size={13} />
                  <span>SENT</span>
                </div>
              </div>

              {/* Flying paper plane with trail */}
              <div className="user-submit-plane-wrap">
                <svg
                  className="user-submit-flight-trail"
                  viewBox="0 0 100 60"
                  fill="none"
                >
                  <path
                    d="M10 50 C 30 50, 45 35, 75 18"
                    stroke="rgba(16, 185, 129, 0.45)"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                  />
                </svg>
                <div className="user-submit-paper-plane">
                  <Send size={22} />
                </div>
              </div>
            </div>

            {/* Header & Title */}
            <div className="user-submit-badge">
              <Sparkles size={13} />
              <span>ส่งเอกสารคำขอสำเร็จ</span>
            </div>

            <h3 className="user-submit-title">
              {title || "นำส่งเอกสารคำขอสำเร็จ!"}
            </h3>
            <p className="user-submit-desc">
              {message ||
                "ระบบได้นำส่งเอกสารและข้อมูลสถานประกอบการไปยังเจ้าหน้าที่ สสจ. เชียงใหม่ เรียบร้อยแล้ว"}
            </p>

            {/* Summary Details Box */}
            <div className="user-submit-info-box">
              <div className="user-submit-info-row">
                <Building2 size={16} className="info-icon" />
                <div className="info-content">
                  <span className="info-label">สถานประกอบการ</span>
                  <strong className="info-val">
                    {hubName || "สถานประกอบการของคุณ"}
                  </strong>
                </div>
              </div>

              <div className="user-submit-info-row">
                <Mail size={16} className="info-icon" />
                <div className="info-content">
                  <span className="info-label">แจ้งผลการอนุมัติไปที่</span>
                  <strong className="info-val">
                    {userEmail || "อีเมลที่ลงทะเบียน"}
                  </strong>
                </div>
              </div>

              <div className="user-submit-info-row">
                <Clock3 size={16} className="info-icon" />
                <div className="info-content">
                  <span className="info-label">ระยะเวลาพิจารณา</span>
                  <strong className="info-val text-emerald">
                    ประมาณ 1 - 3 วันทำการ
                  </strong>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="user-submit-actions">
              <button
                type="button"
                className="user-submit-btn user-submit-btn--primary"
                onClick={onTrack}
              >
                <Search size={16} />
                ติดตามสถานะคำร้อง
              </button>
              <button
                type="button"
                className="user-submit-btn user-submit-btn--secondary"
                onClick={onHome}
              >
                <Home size={16} />
                กลับสู่หน้าหลัก
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Warning or Error State */}
            <div
              className={`user-submit-icon-banner user-submit-icon-banner--${type}`}
            >
              <div className="user-submit-ambient-glow" />
              {isWarning ? (
                <div className="user-submit-status-icon warning">
                  <AlertTriangle size={36} />
                </div>
              ) : (
                <div className="user-submit-status-icon error">
                  <CircleAlert size={36} />
                </div>
              )}
            </div>

            <div className={`user-submit-badge user-submit-badge--${type}`}>
              {isWarning ? (
                <AlertTriangle size={13} />
              ) : (
                <CircleAlert size={13} />
              )}
              <span>
                {isWarning ? "ตรวจสอบข้อมูลที่ระบุ" : "เกิดข้อผิดพลาด"}
              </span>
            </div>

            <h3 className="user-submit-title">
              {title ||
                (isWarning
                  ? "ข้อมูลไม่ถูกต้องหรือซ้ำซ้อน"
                  : "เกิดข้อผิดพลาด")}
            </h3>

            <div className="user-submit-message-card">
              <p>{message || "กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง"}</p>
            </div>

            <div className="user-submit-actions">
              <button
                type="button"
                className="user-submit-btn user-submit-btn--primary"
                onClick={onClose}
              >
                {isWarning ? "กลับไปตรวจสอบและแก้ไขข้อมูล" : "ตกลง"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
