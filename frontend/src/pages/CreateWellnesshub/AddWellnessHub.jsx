import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AddWellnessHub.css";
import AdminSidebar from "../../Components/AdminSidebar/AdminSidebar";
import AdminStatusModal from "../../Components/AdminStatusModal/AdminStatusModal";
import { clearWellnessHubCache } from "../ListWellnesshub/ListWellnesshub";
import { clearDashboardCache } from "../Dashboard/Dashboard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleInfo,
  faLocationDot,
  faSave,
} from "@fortawesome/free-solid-svg-icons";

const AddWellnessHub = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [adminName, setAdminName] = useState("ผู้ดูแลระบบ (Admin)");

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

  // State สำหรับเก็บข้อมูลตัวเลือกใน Dropdown
  const [categories, setCategories] = useState([]);
  const [districts, setDistricts] = useState([]);

  // State สำหรับควบคุม Popup Alert สไตล์ทางการ
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });
  const [createdAccountInfo, setCreatedAccountInfo] = useState(null);

  // State สำหรับผูกกับอินพุตในฟอร์ม
  const [formData, setFormData] = useState({
    licenseId: "",
    username: "",
    wellnessHubName: "",
    address: "",
    certificateType: "",
    googleMapsLink: "",
    telInformation: "",
    contactInformation: "",
    wellnessHubDescription: "",
    wellnessHubLatitude: 18.7883, // พิกัดเชียงใหม่เริ่มต้น
    wellnessHubLongitude: 98.9853,
    categoryId: "",
    districtId: "",
  });

  useEffect(() => {
    // ดึงชื่อแอดมินจากระบบ
    const storedName = localStorage.getItem("adminName");
    if (storedName) setAdminName(storedName);

    // โหลดตัวเลือกจากฐานข้อมูลหลังบ้าน
    const loadFilterOptions = async () => {
      try {
        const [catResponse, distResponse] = await Promise.all([
          axios.get("/api/categories"),
          axios.get("/api/districts"),
        ]);
        const catList = Array.isArray(catResponse.data) ? catResponse.data : [];
        setCategories(catList);
        setDistricts(Array.isArray(distResponse.data) ? distResponse.data : []);

        // ตั้งค่าประเภทบริการเริ่มต้น
        if (catList.length > 0) {
          const defaultCat =
            catList.find(
              (c) =>
                c.categoryName?.includes("นวด") ||
                c.categoryName?.includes("สปา") ||
                c.categoryId === "C01",
            ) || catList[0];

          if (defaultCat) {
            setFormData((prev) => ({
              ...prev,
              categoryId: prev.categoryId || defaultCat.categoryId,
            }));
          }
        }
      } catch (error) {
        console.error("Error loading form options:", error);
      }
    };
    loadFilterOptions();
  }, []);

  const handleLogout = () => {
    if (window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
      localStorage.clear();
      navigate("/login");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // ดักห้ามมีช่องว่างสำหรับ licenseId และ googleMapsLink
    if (name === "licenseId" || name === "googleMapsLink") {
      if (/\s/.test(value)) return;
    }

    if (name === "licenseId") {
      const alphanumericVal = value.replace(/[^a-zA-Z0-9]/g, ""); // รับภาษาอังกฤษและตัวเลข
      const isEm = ["EM01", "EM02"].includes(formData.categoryId);
      setFormData((prev) => ({
        ...prev,
        licenseId: alphanumericVal,
        username: alphanumericVal ? (isEm ? `ES_${alphanumericVal}` : `WH_${alphanumericVal}`) : "",
      }));
      return;
    }

    if (name === "categoryId") {
      const isEm = ["EM01", "EM02"].includes(value);
      setFormData((prev) => ({
        ...prev,
        categoryId: value,
        username: prev.licenseId ? (isEm ? `ES_${prev.licenseId}` : `WH_${prev.licenseId}`) : "",
      }));
      return;
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

    const licenseId = String(formData.licenseId || "").trim();
    const wellnessHubName = String(formData.wellnessHubName || "").trim();
    const categoryId = String(formData.categoryId || "").trim();
    const districtId = String(formData.districtId || "").trim();
    const address = String(formData.address || "").trim();
    const googleMapsLink = String(formData.googleMapsLink || "").trim();
    const tel = String(formData.telInformation || "").trim();

    // 1. เลขใบอนุญาต: 10-13 ตัวอักษร ภาษาอังกฤษหรือตัวเลขเท่านั้น ห้ามมีช่องว่าง ห้ามว่าง
    if (!licenseId || !/^[a-zA-Z0-9]{10,13}$/.test(licenseId)) {
      setStatusModal({
        isOpen: true,
        type: "warning",
        title: "กรุณากรอกข้อมูลให้ถูกต้อง",
        message: "กรุณากรอกข้อมูลให้ถูกต้อง (ระบุเลขใบอนุญาตประกอบกิจการ ภาษาอังกฤษหรือตัวเลข 10-13 หลัก และไม่มีช่องว่าง)",
      });
      return;
    }

    // 2. ชื่อสถานประกอบการ: 3-100 ตัวอักษร
    if (!wellnessHubName || wellnessHubName.length < 3 || wellnessHubName.length > 100) {
      setStatusModal({
        isOpen: true,
        type: "warning",
        title: "กรุณากรอกข้อมูลให้ถูกต้อง",
        message: "กรุณากรอกข้อมูลให้ถูกต้อง (ระบุชื่อสถานประกอบการ ความยาว 3-100 ตัวอักษร)",
      });
      return;
    }

    // 3. หมวดหมู่ธุรกิจ: ห้ามว่าง
    if (!categoryId) {
      setStatusModal({
        isOpen: true,
        type: "warning",
        title: "กรุณากรอกข้อมูลให้ถูกต้อง",
        message: "กรุณากรอกข้อมูลให้ถูกต้อง (เลือกหมวดหมู่ธุรกิจ)",
      });
      return;
    }

    // 4. อำเภอที่ตั้ง: ห้ามว่าง
    if (!districtId) {
      setStatusModal({
        isOpen: true,
        type: "warning",
        title: "กรุณากรอกข้อมูลให้ถูกต้อง",
        message: "กรุณากรอกข้อมูลให้ถูกต้อง (เลือกอำเภอที่ตั้ง)",
      });
      return;
    }

    // 5. ที่อยู่: 10-255 ตัวอักษร
    if (!address || address.length < 10 || address.length > 255) {
      setStatusModal({
        isOpen: true,
        type: "warning",
        title: "กรุณากรอกข้อมูลให้ถูกต้อง",
        message: "กรุณากรอกข้อมูลให้ถูกต้อง (ระบุรายละเอียดที่อยู่ 10-255 ตัวอักษร)",
      });
      return;
    }

    // 6. เบอร์โทรศัพท์ (ถ้ามี): 9-10 หลัก หรือเบอร์ฉุกเฉิน
    if (tel && !/^(1669|[0-9]{3,4}|[0-9]{9,10})$/.test(tel) && !/^[0-9\-+\s]{4,15}$/.test(tel)) {
      setStatusModal({
        isOpen: true,
        type: "warning",
        title: "กรุณากรอกข้อมูลให้ถูกต้อง",
        message: "กรุณากรอกข้อมูลให้ถูกต้อง (ระบุเบอร์โทรศัพท์ติดต่อ 9-10 หลัก หรือเบอร์ฉุกเฉิน เช่น 1669)",
      });
      return;
    }

    // 6.1 รายละเอียดสถานประกอบการ (ถ้ามี): ไม่เกิน 255 ตัวอักษร
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

    // 7. Google Maps: ต้องเป็น URL ที่ถูกต้อง และห้ามมีช่องว่าง
    if (!googleMapsLink || /\s/.test(googleMapsLink) || !/^https?:\/\/.+/i.test(googleMapsLink)) {
      setStatusModal({
        isOpen: true,
        type: "warning",
        title: "กรุณากรอกข้อมูลให้ถูกต้อง",
        message: "กรุณากรอกข้อมูลให้ถูกต้อง (ระบุลิงก์ Google Maps ให้ถูกต้อง ขึ้นต้นด้วย http:// หรือ https:// และไม่มีช่องว่าง)",
      });
      return;
    }

    const parsedCoords = parseLatLngFromGoogleMapsLink(googleMapsLink);

    // 8. พิกัดละติจูด/ลองจิจูด: ถ้าสกัดได้ ต้องอยู่ในช่วง -90 ถึง 90 และ -180 ถึง 180
    if (parsedCoords) {
      if (parsedCoords.lat < -90 || parsedCoords.lat > 90 || parsedCoords.lng < -180 || parsedCoords.lng > 180) {
        setStatusModal({
          isOpen: true,
          type: "warning",
          title: "กรุณากรอกข้อมูลให้ถูกต้อง",
          message: "พิกัดแผนที่ไม่อยู่ในช่วงที่ถูกต้อง (ละติจูด -90 ถึง 90, ลองจิจูด -180 ถึง 180)",
        });
        return;
      }
    }

    setIsLoading(true);
    setStatusModal({
      isOpen: true,
      type: "loading",
      title: "กำลังบันทึกข้อมูล...",
      message: "กรุณารอสักครู่ ระบบกำลังบันทึกสถานประกอบการและสร้างบัญชีผู้ใช้",
    });

    const certTypePayload = certificateList
      .map((c) => c.trim())
      .filter(Boolean)
      .join(", ");

    const payload = {
      licenseId: licenseId,
      username: formData.username || (licenseId ? (["EM01", "EM02"].includes(categoryId) ? `ES_${licenseId}` : `WH_${licenseId}`) : null),
      wellnessHubName: wellnessHubName,
      address: address,
      certificateType: certTypePayload || null,
      googleMapsLink: googleMapsLink,
      telInformation: tel || null,
      contactInformation: formData.contactInformation ? formData.contactInformation.trim() : null,
      wellnessHubDescription: formData.wellnessHubDescription ? formData.wellnessHubDescription.trim() : null,
      wellnessHubLatitude: parsedCoords ? parsedCoords.lat : null,
      wellnessHubLongitude: parsedCoords ? parsedCoords.lng : null,
      status: "active",
      category: { categoryId: categoryId },
      district: { districtId: parseInt(districtId, 10) },
    };

    try {
      const res = await axios.post("/api/wellness-hubs", payload);
      clearWellnessHubCache();
      clearDashboardCache();
      setCreatedAccountInfo({
        licenseId: res.data?.licenseId || payload.licenseId,
        username: res.data?.username || payload.username,
        wellnessHubName: res.data?.wellnessHubName || wellnessHubName,
      });
      setStatusModal({
        isOpen: true,
        type: "success",
        title: "บันทึกข้อมูลสถานประกอบการสำเร็จ",
        message: "ระบบได้เพิ่มสถานประกอบการและสร้างบัญชีผู้ใช้เรียบร้อยแล้ว",
      });
    } catch (error) {
      console.error("Error saving establishment:", error);
      const backendMessage = error.response?.data?.message;
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "ไม่สามารถบันทึกข้อมูลได้",
        message: backendMessage || "ไม่สามารถบันทึกข้อมูลสถานประกอบการได้ กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-layout">
      {/* 🟢 Sidebar เมนูหลัก */}
      <AdminSidebar activeMenu="wellness-hubs" />

      {/* 🔵 เนื้อหาฟอร์มบันทึกข้อมูล */}
      <div className="main-content">
        <div className="gov-container">
          <header className="gov-header">
            <h2>เพิ่มสถานประกอบการใหม่ (Add Wellness Hub)</h2>
            <p>ระบบบริหารจัดการข้อมูลสุขภาพ จังหวัดเชียงใหม่</p>
          </header>

          <div className="form-card">
            <form onSubmit={handleSubmit}>
              <div className="section-divider">
                <FontAwesomeIcon icon={faCircleInfo} /> ข้อมูลทั่วไปของธุรกิจ
              </div>

              <div className="form-group">
                <label>ชื่อสถานประกอบการ*</label>
                <input
                  type="text"
                  name="wellnessHubName"
                  className="gov-input-field"
                  placeholder="ระบุชื่อสถานประกอบการ (3-100 ตัวอักษร)..."
                  maxLength={100}
                  value={formData.wellnessHubName}
                  onChange={handleChange}
                  required
                />
                <div className="char-counter">{formData.wellnessHubName.length}/100</div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>หมวดหมู่ธุรกิจ*</label>
                  <select
                    name="categoryId"
                    className="gov-input-field"
                    value={formData.categoryId}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>
                      -- เลือกประเภทธุรกิจ --
                    </option>
                    {categories.map((cat) => (
                      <option key={cat.categoryId} value={cat.categoryId}>
                        {cat.categoryName}
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
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>เลขใบอนุญาตประกอบกิจการ (รหัส)*</label>
                  <input
                    type="text"
                    name="licenseId"
                    className="gov-input-field"
                    placeholder="ระบุเลขที่ใบอนุญาต (10-13 หลัก)"
                    maxLength={13}
                    value={formData.licenseId}
                    onChange={handleChange}
                    required
                  />
                  <div className="char-counter">
                    {formData.licenseId.length}/13
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    ชื่อผู้ใช้งาน (Username)*{" "}
                    <span className="badge-autogen">สร้างให้อัตโนมัติ</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    className="gov-input-field gov-readonly-field"
                    placeholder="ระบบสร้างให้อัตโนมัติตามเลขใบอนุญาต"
                    value={
                      formData.username ||
                      (formData.licenseId
                        ? ["EM01", "EM02"].includes(formData.categoryId)
                          ? `ES_${formData.licenseId}`
                          : `WH_${formData.licenseId}`
                        : "")
                    }
                    readOnly
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>เบอร์โทรศัพท์ติดต่อ</label>
                  <input
                    type="text"
                    name="telInformation"
                    className="gov-input-field"
                    placeholder="ระบุเบอร์โทรศัพท์..."
                    maxLength={10}
                    value={formData.telInformation}
                    onChange={handleChange}
                  />
                  <div className="char-counter">
                    {(formData.telInformation || "").length}/10
                  </div>
                </div>

                <div className="form-group">
                  <label>ช่องทางการติดต่ออื่น ๆ</label>
                  <input
                    type="text"
                    name="contactInformation"
                    className="gov-input-field"
                    placeholder="เช่น Line ID, Facebook Page"
                    maxLength={255}
                    value={formData.contactInformation}
                    onChange={handleChange}
                  />
                  <div className="char-counter">
                    {(formData.contactInformation || "").length}/255
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>รายละเอียดสถานประกอบการ (ไม่บังคับ)</label>
                <textarea
                  name="wellnessHubDescription"
                  className="gov-input-field gov-textarea"
                  placeholder="ระบุรายละเอียดหรือจุดเด่นของสถานประกอบการ (สูงสุด 255 ตัวอักษร)..."
                  maxLength={255}
                  rows={4}
                  value={formData.wellnessHubDescription}
                  onChange={handleChange}
                ></textarea>
                <div className="char-counter">
                  {(formData.wellnessHubDescription || "").length}/255
                </div>
              </div>

              <div className="section-divider">
                <FontAwesomeIcon icon={faLocationDot} /> สถานที่ตั้ง & พิกัดแผนที่
              </div>

              <div className="form-group">
                <label>รายละเอียดที่อยู่*</label>
                <textarea
                  name="address"
                  className="gov-input-field gov-textarea"
                  placeholder="ระบุรายละเอียดที่อยู่ (10-255 ตัวอักษร)..."
                  maxLength={255}
                  value={formData.address}
                  onChange={handleChange}
                  required
                ></textarea>
                <div className="char-counter">{formData.address.length}/255</div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>อำเภอที่ตั้ง*</label>
                  <select
                    name="districtId"
                    className="gov-input-field"
                    value={formData.districtId}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>
                      -- เลือกอำเภอ --
                    </option>
                    {districts.map((dist) => (
                      <option key={dist.districtId} value={dist.districtId}>
                        {dist.districtName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>ลิงก์ Google Maps (URL)*</label>
                  <input
                    type="url"
                    name="googleMapsLink"
                    className="gov-input-field"
                    placeholder="https://maps.google.com/..."
                    value={formData.googleMapsLink}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>


              <div className="form-actions">
                <button
                  type="button"
                  className="btn-gov-cancel"
                  onClick={() => navigate("/listWellnesshub")}
                  disabled={isLoading}
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  className="btn-gov-save"
                  disabled={isLoading}
                  style={isLoading ? { opacity: 0.7, cursor: "not-allowed" } : {}}
                >
                  {isLoading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>{" "}
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSave} /> บันทึกข้อมูล
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* 🏛️ ป๊อปอัปแจ้งเตือนสถานะสำหรับแอดมิน (Admin Status Modal) */}
      <AdminStatusModal
        isOpen={statusModal.isOpen}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        confirmText={statusModal.type === "success" ? "กลับสู่หน้ารายการ" : "ตกลง"}
        cancelText="ปิด"
        onConfirm={() => {
          if (statusModal.type === "success") {
            setStatusModal((prev) => ({ ...prev, isOpen: false }));
            navigate("/listWellnesshub");
          } else {
            setStatusModal((prev) => ({ ...prev, isOpen: false }));
          }
        }}
        onClose={() => setStatusModal((prev) => ({ ...prev, isOpen: false }))}
      >
        {statusModal.type === "success" && createdAccountInfo && (
          <div
            style={{
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              padding: "12px 14px",
              marginBottom: "8px",
              textAlign: "left",
              fontSize: "13.5px",
              lineHeight: "1.6",
            }}
          >
            <div>
              <strong>รหัสสถานประกอบการ:</strong> {createdAccountInfo.licenseId}
            </div>
            <div>
              <strong>ชื่อผู้ใช้งาน (Username):</strong> {createdAccountInfo.username}
            </div>
            <div>
              <strong>สถานะ:</strong>{" "}
              <span style={{ color: "#16a34a", fontWeight: "bold" }}>ACTIVE</span>
            </div>
          </div>
        )}
      </AdminStatusModal>
    </div>
  );
};

export default AddWellnessHub;
