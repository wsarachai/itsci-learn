import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axiosInstance from "axios";
import { Image as ImageIcon, Upload, Trash2 } from "lucide-react";
import "./EditWellnesshub.css";
import AdminSidebar from "../../Components/AdminSidebar/AdminSidebar";
import AdminStatusModal from "../../Components/AdminStatusModal/AdminStatusModal";
import { clearWellnessHubCache } from "../ListWellnesshub/ListWellnesshub";
import { clearDashboardCache } from "../Dashboard/Dashboard";

function normalizeImageSource(value) {
  if (!value) return "";
  let normalizedValue = value;
  if (typeof normalizedValue === "string") {
    const trimmed = normalizedValue.trim();
    try {
      const parsed = JSON.parse(trimmed);
      normalizedValue = Array.isArray(parsed) ? parsed[0] || "" : trimmed;
    } catch {
      normalizedValue = trimmed;
    }
  }
  if (Array.isArray(normalizedValue)) {
    normalizedValue = normalizedValue[0] || "";
  }
  if (!normalizedValue) return "";
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
    return `/uploads/${imageSource}`;
  }
  return imageSource;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

const EditWellnessHub = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [adminName, setAdminName] = useState("ผู้ดูแลระบบ (Admin)");
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [errors, setErrors] = useState({});

  // State สำหรับจัดการรูปภาพหน้าปก
  const [imagePreview, setImagePreview] = useState("");
  const [imageFileName, setImageFileName] = useState("");

  // State สำหรับจัดการรายการใบรับรอง 1 ใบต่อ 1 ช่อง
  const [certificateList, setCertificateList] = useState([""]);

  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

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

  const [formData, setFormData] = useState({
    licenseId: "",
    username: "",
    wellnessHubName: "",
    categoryId: "",
    districtId: "",
    certificateType: "",
    telInformation: "",
    address: "",
    googleMapsLink: "",
    status: "active",
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      setStatusModal({
        isOpen: true,
        type: "loading",
        title: "กำลังโหลดข้อมูลสถานประกอบการ...",
        message: "กรุณารอสักครู่ ระบบกำลังดึงข้อมูลสถานประกอบการจากเซิร์ฟเวอร์",
      });

      try {
        const [catRes, distRes, hubRes] = await Promise.all([
          axiosInstance.get("/api/categories"),
          axiosInstance.get("/api/districts"),
          axiosInstance.get(`/api/wellness-hubs/${id}`),
        ]);

        setCategories(catRes.data || []);
        setDistricts(distRes.data || []);

        const hubData = hubRes.data;
        if (!hubData) throw new Error("ไม่พบข้อมูลสถานประกอบการบนเซิร์ฟเวอร์");

        const isStatusActive = (status) => {
          if (!status || String(status).trim() === "") return true;
          return String(status).trim().toLowerCase() === "active";
        };

        const certStr =
          hubData.certificateType && hubData.certificateType !== "null"
            ? hubData.certificateType
            : "";
        const initialCerts = certStr
          ? certStr.split(",").map((s) => s.trim()).filter(Boolean)
          : [""];
        setCertificateList(initialCerts.length > 0 ? initialCerts : [""]);

        const rawImg = hubData.wellnessHubImg || hubData.img || hubData.coverImage || "";
        const normalizedImg = normalizeImageSource(rawImg);
        setImagePreview(normalizedImg);

        setFormData({
          licenseId: hubData.licenseId ?? "",
          username: hubData.username ?? "",
          wellnessHubName: hubData.wellnessHubName ?? "",
          categoryId: hubData.category?.categoryId
            ? String(hubData.category.categoryId)
            : "",
          districtId: hubData.district?.districtId
            ? String(hubData.district.districtId)
            : "",
          certificateType: certStr,
          telInformation: hubData.telInformation ?? "",
          address: hubData.address === "null" ? "" : (hubData.address ?? ""),
          googleMapsLink:
            hubData.googleMapsLink === "null"
              ? ""
              : (hubData.googleMapsLink ?? ""),
          status: isStatusActive(hubData.status) ? "active" : "inactive",
          wellnessHubImg: rawImg,
          wellnessHubGallery: hubData.wellnessHubGallery ?? "",
          wellnessHubDescription: hubData.wellnessHubDescription ?? "",
          contactInformation: hubData.contactInformation ?? "",
          operatingHours: hubData.operatingHours ?? "",
        });

        setIsLoading(false);
        setStatusModal((prev) => ({ ...prev, isOpen: false }));
      } catch (error) {
        console.error("Error loading data:", error);
        setIsLoading(false);
        const isNotFound = error.response && error.response.status === 404;
        setStatusModal({
          isOpen: true,
          type: "error",
          title: isNotFound ? "ไม่พบข้อมูลสถานประกอบการ" : "เกิดข้อผิดพลาดในการโหลดข้อมูล",
          message: isNotFound
            ? "ไม่พบข้อมูลสถานประกอบการที่ต้องการแก้ไข กรุณาตรวจสอบรหัสอีกครั้ง"
            : "ไม่สามารถดึงข้อมูลสถานประกอบการได้ กรุณาลองใหม่อีกครั้ง",
        });
      }
    };

    fetchInitialData();

    const storedName = localStorage.getItem("adminName");
    if (storedName) setAdminName(storedName);
  }, [id, navigate]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      setStatusModal({
        isOpen: true,
        type: "warning",
        title: "ประเภทไฟล์ไม่ถูกต้อง",
        message: "ต้องเป็นไฟล์รูปภาพนามสกุล .png, .jpg และ .jpeg เท่านั้น",
      });
      e.target.value = "";
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setStatusModal({
        isOpen: true,
        type: "warning",
        title: "ขนาดไฟล์เกินกำหนด",
        message: "ขนาดไฟล์รูปภาพต้องไม่เกิน 20 MB",
      });
      e.target.value = "";
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setFormData((prev) => ({
        ...prev,
        wellnessHubImg: dataUrl,
      }));
      setImagePreview(dataUrl);
      setImageFileName(file.name);
    } catch (err) {
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถอ่านไฟล์รูปภาพได้ กรุณาลองใหม่อีกครั้ง",
      });
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      wellnessHubImg: "",
    }));
    setImagePreview("");
    setImageFileName("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // ดักห้ามมีช่องว่างสำหรับ telInformation และ googleMapsLink
    if (name === "telInformation" || name === "googleMapsLink") {
      if (/\s/.test(value)) return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 📌 ฟังก์ชันสกัดละติจูด/ลองจิจูด จาก URL ลิงก์ Google Maps
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
    const qMatches = [...trimmed.matchAll(/[?&](?:q|query|ll|destination|daddr)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)];
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
    const dirMatch = trimmed.match(/\/(?:dir|search)\/[^/]*\/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/) || trimmed.match(/\/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (dirMatch) {
      const lat = parseFloat(dirMatch[1]);
      const lng = parseFloat(dirMatch[2]);
      if (isValidLatLng(lat, lng)) {
        return { lat, lng };
      }
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    const name = String(formData.wellnessHubName || "").trim();
    const categoryId = String(formData.categoryId || "").trim();
    const tel = String(formData.telInformation || "").trim();
    const address = String(formData.address || "").trim();
    const districtId = String(formData.districtId || "").trim();
    const googleMapsLink = String(formData.googleMapsLink || "").trim();

    // 1. ชื่อสถานประกอบการ: 3-100 ตัวอักษร (ฟิลด์เดียวที่บังคับ)
    if (!name || name.length < 3 || name.length > 100) {
      setStatusModal({
        isOpen: true,
        type: "warning",
        title: "กรุณากรอกข้อมูลให้ถูกต้อง",
        message: "กรุณาระบุชื่อสถานประกอบการ ความยาว 3-100 ตัวอักษร",
      });
      return;
    }

    // 2. เบอร์โทรศัพท์: ไม่บังคับ แต่ถ้ากรอกต้องเป็นตัวเลข 9-10 หลัก หรือเบอร์ฉุกเฉิน ไม่มีช่องว่าง
    if (tel && !/^(1669|[0-9]{3,4}|[0-9]{9,10})$/.test(tel)) {
      setStatusModal({
        isOpen: true,
        type: "warning",
        title: "กรุณากรอกข้อมูลให้ถูกต้อง",
        message: "เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก หรือเบอร์ฉุกเฉิน (เช่น 1669) โดยไม่มีช่องว่างหรืออักขระพิเศษ",
      });
      return;
    }

    // 3. ที่อยู่: ไม่บังคับ (ถ้ามีระบุต้องไม่เกิน 255 ตัวอักษร)
    if (address && address.length > 255) {
      setStatusModal({
        isOpen: true,
        type: "warning",
        title: "กรุณากรอกข้อมูลให้ถูกต้อง",
        message: "รายละเอียดที่อยู่ต้องมีความยาวไม่เกิน 255 ตัวอักษร",
      });
      return;
    }

    // 3.1 รายละเอียดสถานประกอบการ: ไม่บังคับ (ถ้ามีระบุต้องไม่เกิน 255 ตัวอักษร)
    const description = String(formData.wellnessHubDescription || "").trim();
    if (description && description.length > 255) {
      setStatusModal({
        isOpen: true,
        type: "warning",
        title: "กรุณากรอกข้อมูลให้ถูกต้อง",
        message: "กรุณากรอกข้อมูลให้ถูกต้อง (รายละเอียดสถานประกอบการต้องมีความยาวไม่เกิน 255 ตัวอักษร)",
      });
      return;
    }

    // 4. Google Maps: ห้ามว่าง ต้องเป็น URL ที่ถูกต้อง หรือใส่ #
    if (!googleMapsLink) {
      setStatusModal({
        isOpen: true,
        type: "warning",
        title: "กรุณากรอกข้อมูลให้ถูกต้อง",
        message: "กรุณาระบุลิงก์ Google Maps หรือใส่ # หากไม่มีลิงก์",
      });
      return;
    }

    if (googleMapsLink !== "#") {
      if (/\s/.test(googleMapsLink) || !/^https?:\/\/.+/i.test(googleMapsLink)) {
        setStatusModal({
          isOpen: true,
          type: "warning",
          title: "กรุณากรอกข้อมูลให้ถูกต้อง",
          message: "ลิงก์ Google Maps ต้องเป็น URL ที่ถูกต้อง (ขึ้นต้นด้วย http:// หรือ https://) หรือใส่ #",
        });
        return;
      }
    }

    const parsedCoords = googleMapsLink !== "#" ? parseLatLngFromGoogleMapsLink(googleMapsLink) : null;

    setIsLoading(true);
    setStatusModal({
      isOpen: true,
      type: "loading",
      title: "กำลังบันทึกการแก้ไข...",
      message: "กรุณารอสักครู่ ระบบกำลังบันทึกและปรับปรุงข้อมูลในฐานข้อมูลกลาง",
    });

    const certTypePayload = certificateList
      .map((c) => c.trim())
      .filter(Boolean)
      .join(", ");

    const payload = {
      licenseId: formData.licenseId,
      wellnessHubName: name,
      telInformation: tel || null,
      certificateType: certTypePayload || null,
      address: address,
      googleMapsLink: googleMapsLink,
      status: formData.status || "ACTIVE",
      category: categoryId ? { categoryId: categoryId } : null,
      district: districtId ? { districtId: parseInt(districtId, 10) } : null,
      wellnessHubImg: formData.wellnessHubImg || null,
      wellnessHubGallery: formData.wellnessHubGallery || null,
      wellnessHubDescription: description || null,
      contactInformation: formData.contactInformation || null,
      operatingHours: formData.operatingHours || null,
    };

    if (parsedCoords) {
      payload.wellnessHubLatitude = parsedCoords.lat;
      payload.wellnessHubLongitude = parsedCoords.lng;
    }

    try {
      await axiosInstance.put(
        `/api/wellness-hubs/${id}`,
        payload,
      );
      clearWellnessHubCache();
      clearDashboardCache();
      setIsLoading(false);

      setStatusModal({
        isOpen: true,
        type: "success",
        title: "แก้ไขข้อมูลสถานประกอบการสำเร็จ",
        message: "ระบบได้บันทึกและปรับปรุงข้อมูลสถานประกอบการเรียบร้อยแล้ว",
      });
    } catch (error) {
      setIsLoading(false);
      const is400 = error.response && error.response.status === 400;
      const is404 = error.response && error.response.status === 404;
      const errorMessage =
        error.response?.data?.message ||
        "ไม่สามารถแก้ไขข้อมูลสถานประกอบการได้ กรุณาลองใหม่อีกครั้ง";

      setStatusModal({
        isOpen: true,
        type: is400 ? "warning" : "error",
        title: is400
          ? "กรุณากรอกข้อมูลให้ถูกต้อง"
          : is404
          ? "ไม่พบข้อมูลสถานประกอบการ"
          : "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
        message: errorMessage,
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminName");
    navigate("/login");
  };

  return (
    <div className="admin-layout">
      <AdminSidebar activeMenu="wellness-hubs" />

      <main className="admin-content">
        <section className="page-title-hero">
          <h2>แก้ไขสถานประกอบการ (Edit Wellness Hub)</h2>
          <p className="gov-subtitle">
            ระบบบริหารจัดการข้อมูลสุขภาพ จังหวัดเชียงใหม่
          </p>
        </section>

        <div className="gov-line-divider" />

        <div className="content-body">
          <div className="form-card">
            <form onSubmit={handleSubmit} noValidate>
              {/* สวิตช์ปรับสถานะสถานประกอบการ (Toggle Switch) */}
              <div
                className="hub-status-container"
                style={{
                  borderLeftColor:
                    formData.status === "active" ? "#14532d" : "#dc3545",
                }}
              >
                <div className="hub-status-information">
                  <span className="hub-status-title">สถานะการให้บริการ</span>
                  <p className="hub-status-description">
                    เปิดใช้งาน หรือ ระงับการให้บริการของสถานประกอบการนี้ในระบบ
                  </p>
                </div>

                <div className="hub-status-control">
                  <span
                    className={`hub-status-text ${formData.status === "active"
                      ? "status-active"
                      : "status-inactive"
                      }`}
                  >
                    {formData.status === "active"
                      ? "ใช้งาน (Active)"
                      : "ระงับการใช้งาน (Inactive)"}
                  </span>

                  <label
                    className="hub-toggle-switch"
                    htmlFor="hub-status-toggle"
                    title="สลับสถานะเปิดใช้งาน / ระงับการใช้งาน"
                  >
                    <input
                      id="hub-status-toggle"
                      type="checkbox"
                      name="status"
                      checked={formData.status === "active"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          status: e.target.checked ? "active" : "inactive",
                        }))
                      }
                    />
                    <span className="hub-toggle-slider" />
                  </label>
                </div>
              </div>

              <div className="section-heading">
                <span>1</span> ข้อมูลทั่วไปของธุรกิจ
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>ชื่อสถานประกอบการ *</label>
                  <input
                    type="text"
                    name="wellnessHubName"
                    maxLength={100}
                    value={formData.wellnessHubName}
                    onChange={handleChange}
                    required
                  />
                  <div className="char-counter">{(formData.wellnessHubName || "").length}/100</div>
                </div>

                <div className="form-group">
                  <label>หมวดหมู่ธุรกิจ</label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                  >
                    <option value="">-- เลือกหมวดหมู่ --</option>
                    {categories.map((category) => (
                      <option
                        key={category.categoryId}
                        value={category.categoryId}
                      >
                        {category.categoryName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group full-width">
                  <div className="gov-cert-header">
                    <label>ประเภทใบรับรอง / มาตรฐาน (1 ใบต่อ 1 ช่อง)</label>
                    <button
                      type="button"
                      className="gov-btn-add-cert"
                      onClick={addCertField}
                    >
                      + เพิ่มใบรับรอง
                    </button>
                  </div>
                  <div className="gov-cert-list">
                    {certificateList.map((cert, index) => (
                      <div key={index} className="gov-cert-row">
                        <input
                          type="text"
                          className="gov-input-field"
                          placeholder={`ระบุชื่อใบรับรอง / มาตรฐานที่ ${index + 1} (เช่น ศูนย์เวลเนสประเภทสปาเพื่อสุขภาพ)`}
                          value={cert}
                          maxLength={150}
                          onChange={(e) => handleCertChange(index, e.target.value)}
                        />
                        {certificateList.length > 1 && (
                          <button
                            type="button"
                            className="gov-btn-del-cert"
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

                <div className="form-group">
                  <label>เลขใบอนุญาตประกอบกิจการ</label>
                  <input
                    type="text"
                    name="licenseId"
                    value={formData.licenseId}
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label>ชื่อผู้ใช้งาน (Username)</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username || "-"}
                    readOnly
                    style={{ backgroundColor: "#f8fafc", color: "#475569", cursor: "not-allowed" }}
                  />
                </div>

                <div
                  className={`form-group ${errors.telInformation ? "has-error" : ""
                    }`}
                >
                  <label>เบอร์โทรศัพท์ติดต่อ</label>
                  <input
                    type="text"
                    name="telInformation"
                    maxLength={10}
                    value={formData.telInformation}
                    onChange={handleChange}
                    placeholder="เช่น 053123456"
                  />
                  <div className="char-counter">{(formData.telInformation || "").length}/10</div>
                  {errors.telInformation && (
                    <span className="error-text-under">
                      {errors.telInformation}
                    </span>
                  )}
                </div>

                <div className="form-group full-width">
                  <label>รายละเอียดสถานประกอบการ (ไม่บังคับ)</label>
                  <textarea
                    rows="4"
                    name="wellnessHubDescription"
                    maxLength={255}
                    value={formData.wellnessHubDescription}
                    onChange={handleChange}
                    placeholder="ระบุรายละเอียดหรือจุดเด่นของสถานประกอบการ (สูงสุด 255 ตัวอักษร)..."
                  />
                  <div className="char-counter">{(formData.wellnessHubDescription || "").length}/255</div>
                </div>
              </div>

              <div className="section-heading">
                <span>2</span> ภาพหน้าปกสถานประกอบการ (Cover Image)
              </div>

              <div className="gov-image-section">
                <div className="gov-image-preview-wrapper">
                  {imagePreview ? (
                    <div className="gov-image-preview-container">
                      <img
                        src={imagePreview}
                        alt={formData.wellnessHubName || "รูปหน้าปกสถานประกอบการ"}
                        className="gov-image-preview"
                      />
                    </div>
                  ) : (
                    <div className="gov-image-empty-placeholder">
                      <ImageIcon size={44} className="gov-image-empty-icon" />
                      <span className="gov-image-empty-title">ยังไม่มีรูปภาพหน้าปก</span>
                      <span className="gov-image-empty-subtitle">คลิกปุ่มด้านล่างเพื่อเลือกรูปภาพ</span>
                    </div>
                  )}
                </div>

                <div className="gov-image-controls">
                  <div className="gov-image-guidelines">
                    <h4>อัปโหลดรูปภาพหน้าปก</h4>
                    <p>
                      รองรับไฟล์ภาพนามสกุล .png, .jpg หรือ .jpeg ขนาดไม่เกิน 20 MB (แนะนำภาพแนวนอนสัดส่วน 16:9 เพื่อความสวยงาม)
                    </p>
                  </div>

                  <div className="gov-image-btn-group">
                    <label className="gov-btn-upload-image" htmlFor="cover-image-input">
                      <Upload size={16} />
                      <span>{imagePreview ? "เปลี่ยนรูปภาพหน้าปก" : "เลือกรูปภาพหน้าปก"}</span>
                      <input
                        id="cover-image-input"
                        type="file"
                        accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                        onChange={handleImageChange}
                        style={{ display: "none" }}
                      />
                    </label>

                    {imagePreview && (
                      <button
                        type="button"
                        className="gov-btn-remove-image"
                        onClick={handleRemoveImage}
                        title="ลบรูปภาพหน้าปก"
                      >
                        <Trash2 size={16} />
                        <span>ลบรูปภาพ</span>
                      </button>
                    )}
                  </div>

                  {imageFileName && (
                    <div className="gov-image-filename">
                      <span>ไฟล์ที่เลือก:</span> <strong>{imageFileName}</strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="section-heading">
                <span>3</span> สถานที่ตั้ง
              </div>

              <div className="form-group">
                <label>รายละเอียดที่อยู่</label>
                <textarea
                  rows="3"
                  name="address"
                  maxLength={255}
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="ระบุรายละเอียดที่อยู่ เช่น เลขที่ ถนน ซอย"
                />
                <div className="char-counter">{(formData.address || "").length}/255</div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>อำเภอที่ตั้ง</label>
                  <select
                    name="districtId"
                    value={formData.districtId}
                    onChange={handleChange}
                  >
                    <option value="">-- เลือกอำเภอ --</option>
                    {districts.map((district) => (
                      <option
                        key={district.districtId}
                        value={district.districtId}
                      >
                        {district.districtName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>ลิงก์ Google Maps (URL) *</label>
                  <input
                    type="text"
                    name="googleMapsLink"
                    value={formData.googleMapsLink}
                    onChange={handleChange}
                    placeholder="ระบุลิงก์ Google Maps หรือใส่ #"
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <Link to="/listWellnesshub" className="btn-cancel">
                  ยกเลิกรายการ
                </Link>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={isLoading}
                  style={isLoading ? { opacity: 0.7, cursor: "not-allowed" } : {}}
                >
                  {isLoading ? "กำลังบันทึก..." : "บันทึกข้อความอัปเดต"}
                </button>
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
        isEdit={true}
        onConfirm={() => {
          if (statusModal.type === "success") {
            setStatusModal((prev) => ({ ...prev, isOpen: false }));
            navigate("/listWellnesshub");
          } else {
            setStatusModal((prev) => ({ ...prev, isOpen: false }));
          }
        }}
        onClose={() => setStatusModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default EditWellnessHub;
