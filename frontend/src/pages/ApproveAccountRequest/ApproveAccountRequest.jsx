import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faXmark,
  faFilePdf,
  faFileImage,
  faFileLines,
  faEye,
  faMapMarkerAlt,
  faSpinner,
  faEnvelope,
  faCircleExclamation,
  faChevronDown,
  faChevronUp,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";

import "./ApproveAccountRequest.css";
import AdminSidebar from "../../Components/AdminSidebar/AdminSidebar";
import AdminStatusModal from "../../Components/AdminStatusModal/AdminStatusModal";
import { clearAccountRequestsCache } from "../ListAccountRequest/ListAccountRequest";
import { clearWellnessHubCache } from "../ListWellnesshub/ListWellnesshub";
import { clearDashboardCache } from "../Dashboard/Dashboard";

// Helper Functions จัดฟอร์แมตข้อมูล

// 1. แปลงประเภทใบรับรอง แสดงผล 1 ใบต่อ 1 บรรทัด (รองรับ Array, JSON, Newline, Dash, Comma)
const parseCertificateTypes = (certData) => {
  if (!certData || certData === "-" || certData === "null" || certData === "undefined") {
    return [];
  }
  if (Array.isArray(certData)) {
    return certData.map((s) => String(s).trim()).filter(Boolean);
  }
  if (typeof certData === "string") {
    const trimmed = certData.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((s) => String(s).trim()).filter(Boolean);
        }
      } catch (e) {}
    }
  }

  let text = String(certData).trim();
  if (!text || text === "-" || text === "null") return [];

  if (text.includes("\n")) {
    return text
      .split("\n")
      .map((s) => s.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);
  }

  if (text.startsWith("- ") || text.startsWith("• ") || text.includes(" - ")) {
    return text
      .split(/(?:^|\s+)[-•*]\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (text.includes(",")) {
    return text
      .split(",")
      .map((s) => s.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);
  }

  const cleaned = text.replace(/^[-•*]\s*/, "").trim();
  return cleaned ? [cleaned] : [];
};

// 2. แปลงเวลาทำการเป็น Array รายวัน
const formatOperatingHoursList = (hoursData) => {
  if (!hoursData) return ["ไม่ได้ระบุเวลาทำการ"];
  try {
    const parsed =
      typeof hoursData === "string" ? JSON.parse(hoursData) : hoursData;
    if (typeof parsed !== "object" || parsed === null)
      return [String(hoursData)];

    const dayMap = {
      monday: "วันจันทร์",
      tuesday: "วันอังคาร",
      wednesday: "วันพุธ",
      thursday: "วันพฤหัสบดี",
      friday: "วันศุกร์",
      saturday: "วันเสาร์",
      sunday: "วันอาทิตย์",
    };

    const is24Hours = Object.keys(dayMap).every((dayKey) => {
      const info = parsed[dayKey];
      return (
        info &&
        info.active &&
        info.open === "00:00" &&
        (info.close === "23:59" || info.close === "24:00" || info.close === "00:00")
      );
    });

    if (is24Hours) {
      return ["เปิดให้บริการตลอด 24 ชั่วโมง (ทุกวัน)"];
    }

    const activeDays = Object.entries(parsed)
      .filter(([_, info]) => info && info.active)
      .map(
        ([dayKey, info]) =>
          `${dayMap[dayKey] || dayKey}: ${info.open} - ${info.close} น.`,
      );

    return activeDays.length > 0 ? activeDays : ["หยุดบริการทุกวัน"];
  } catch (e) {
    return [String(hoursData)];
  }
};

// 3. จัดการรูปภาพ
const getImageUrl = (imgData) => {
  if (!imgData) return null;
  if (imgData.startsWith("data:image") || imgData.startsWith("http")) {
    return imgData;
  }
  return `/uploads/${imgData}`;
};

// 4. แปลง Gallery JSON Array ป้องกัน JSON.parse error
const parseGalleryImages = (galleryData) => {
  if (!galleryData) return [];
  if (Array.isArray(galleryData)) return galleryData;
  try {
    const parsed = JSON.parse(galleryData);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

// 5. แปลงเอกสารยืนยันสิทธิ์ (รองรับทั้ง JSON Array หลายไฟล์ และ Single Data URL เดิม)
const parseVerificationDocuments = (docData, docName) => {
  if (!docData) return [];
  if (Array.isArray(docData)) return docData;
  if (typeof docData === "string") {
    const trimmed = docData.trim();
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // fallback
      }
    }
    return [
      {
        type: "เอกสารยืนยันสิทธิ์",
        name: docName || "เอกสารยืนยันสิทธิ์ (PDF/รูปภาพ)",
        data: trimmed,
      },
    ];
  }
  return [];
};

// ฟังก์ชันจัดรูปแบบชื่อไฟล์เอกสารรับรอง: <ชื่อในดรอปดาวน์ที่เลือก>_<รหัสคำขอ><นามสกุลไฟล์>
const formatDocumentDisplayName = (docItem, requestId, index, allDocs = []) => {
  if (!docItem) return "";
  const docType = (docItem.type || "เอกสารยืนยันสิทธิ์").trim();
  const currentName = (docItem.name || "").trim();

  // ดึงนามสกุลไฟล์เดิม
  let ext = "";
  if (currentName.includes(".")) {
    ext = currentName.substring(currentName.lastIndexOf("."));
  } else if (typeof docItem.data === "string") {
    const lowerData = docItem.data.toLowerCase();
    if (lowerData.startsWith("data:application/pdf") || lowerData.includes(".pdf")) {
      ext = ".pdf";
    } else if (lowerData.startsWith("data:image/png") || lowerData.includes(".png")) {
      ext = ".png";
    } else if (lowerData.startsWith("data:image/jpeg") || lowerData.includes(".jpg") || lowerData.includes(".jpeg")) {
      ext = ".jpg";
    } else if (lowerData.startsWith("data:image/webp") || lowerData.includes(".webp")) {
      ext = ".webp";
    }
  }

  const reqId = requestId ? String(requestId).trim() : "";

  // ตรวจสอบว่าในชุดเอกสารนี้ มีประเภทเดียวกันหลายไฟล์หรือไม่
  const sameTypeDocs = allDocs.filter(
    (d) => (d.type || "เอกสารยืนยันสิทธิ์").trim() === docType
  );
  let duplicateSuffix = "";
  if (sameTypeDocs.length > 1) {
    const pos = sameTypeDocs.indexOf(docItem);
    if (pos >= 0) {
      duplicateSuffix = `_${pos + 1}`;
    }
  }

  if (!reqId) {
    return `${docType}${duplicateSuffix}${ext}`;
  }

  return `${docType}_${reqId}${duplicateSuffix}${ext}`;
};

function ApproveAccountRequest() {
  const navigate = useNavigate();
  const { id } = useParams();
  const adminName = localStorage.getItem("adminName") || "Admin";

  const [request, setRequest] = useState(null);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [rejectDetail, setRejectDetail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApproveEmailPreview, setShowApproveEmailPreview] = useState(false);
  const [showRejectEmailPreview, setShowRejectEmailPreview] = useState(false);

  // Status Modal State
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
    children: null,
  });

  useEffect(() => {
    fetchRequest();
  }, []);

  const fetchRequest = async () => {
    setStatusModal({
      isOpen: true,
      type: "loading",
      title: "กำลังโหลดข้อมูลคำร้อง...",
      message: "กรุณารอสักครู่ ระบบกำลังดึงข้อมูลคำขอจากเซิร์ฟเวอร์",
      onConfirm: null,
      children: null,
    });

    try {
      const res = await axios.get(
        `/api/account-requests/${id}`,
      );
      if (!res.data) {
        setStatusModal({
          isOpen: true,
          type: "error",
          title: "ไม่พบข้อมูลคำขออนุมัติ",
          message: "ไม่พบข้อมูลคำขออนุมัติ",
          onConfirm: null,
          children: null,
        });
        return;
      }
      setRequest(res.data);
      setStatusModal((prev) => ({ ...prev, isOpen: false }));
    } catch (err) {
      console.error(err);
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "ไม่พบข้อมูลคำขออนุมัติ",
        message: "ไม่พบข้อมูลคำขออนุมัติ",
        onConfirm: null,
        children: null,
      });
    }
  };

  // รวมเหตุผลการไม่อนุมัติ (Dropdown + รายละเอียดเพิ่มเติม)
  const getEffectiveRejectReason = () => {
    const mainReason = (reason || "").trim();
    const detail = (rejectDetail || "").trim();

    if (!mainReason) return "";
    if (mainReason === "อื่นๆ") {
      return detail || "ไม่ผ่านเกณฑ์การพิจารณา";
    }
    if (detail) {
      return `${mainReason} (${detail})`;
    }
    return mainReason;
  };

  const handleApprove = async () => {
    if (!request) {
      setShowApprove(false);
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "ไม่พบข้อมูลคำขออนุมัติ",
        message: "ไม่พบข้อมูลคำขออนุมัติ",
        onConfirm: null,
        children: null,
      });
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowApprove(false);
    setStatusModal({
      isOpen: true,
      type: "loading",
      title: "กำลังอนุมัติคำขอ...",
      message: "กรุณารอสักครู่ ระบบกำลังประมวลผลการอนุมัติและส่งอีเมลแจ้งผล",
      onConfirm: null,
      children: null,
    });

    try {
      await axios.put(
        `/api/account-requests/${id}/approve`,
      );
      clearAccountRequestsCache();
      clearWellnessHubCache();
      clearDashboardCache();

      // Trigger Notify Request Result
      try {
        await axios.post(
          `/api/account-requests/${id}/notify`,
        );
      } catch (notifyErr) {
        console.error("Notify failed:", notifyErr);
        const notifyErrMsg = notifyErr?.response?.data?.message || notifyErr?.message || "";
        setShowApprove(false);
        setStatusModal({
          isOpen: true,
          type: "error",
          title: notifyErrMsg.includes("บันทึก") ? "เกิดข้อผิดพลาดในการบันทึกข้อมูล" : "การส่งล้มเหลว",
          message: notifyErrMsg || "การส่งล้มเหลว",
          onConfirm: () => {
            navigate("/listAccountRequest", {
              state: {
                updatedRequestId: Number(id),
                requestStatus: "APPROVED",
              },
            });
          },
          children: null,
        });
        return;
      }

      setShowApprove(false);
      setStatusModal({
        isOpen: true,
        type: "success",
        title: "อนุมัติคำขอสำเร็จ",
        message: "ส่งอีเมลแจ้งผลสำเร็จ",
        children: (
          <div
            style={{
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              padding: "14px 16px",
              marginTop: "12px",
              marginBottom: "8px",
              textAlign: "left",
              fontSize: "13px",
              lineHeight: "1.6",
              color: "#166534",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                borderBottom: "1px solid #dcfce7",
                paddingBottom: "6px",
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>ข้อมูลการแจ้งผลที่จัดส่ง (Notify Request Result)</span>
            </div>
            <div>
              <strong>สถานประกอบการ:</strong>{" "}
              {request?.wellnessHubName || "-"}
            </div>
            <div>
              <strong>อีเมลปลายทาง:</strong> {request?.userEmail || "-"}
            </div>
          </div>
        ),
        onConfirm: () => {
          navigate("/listAccountRequest", {
            state: {
              updatedRequestId: Number(id),
              requestStatus: "APPROVED",
            },
          });
        },
      });
    } catch (err) {
      console.error(err);
      setShowApprove(false);
      const errMsg = err?.response?.data?.message || err?.message || "";
      const status = err?.response?.status;

      if (status === 404) {
        setStatusModal({
          isOpen: true,
          type: "error",
          title: "ไม่พบข้อมูลคำขออนุมัติ",
          message: errMsg || "ไม่พบข้อมูลคำขออนุมัติ",
          onConfirm: null,
          children: null,
        });
      } else if (status === 409) {
        setStatusModal({
          isOpen: true,
          type: "warning",
          title: "คำขอถูกประมวลผลแล้ว",
          message: errMsg || "คำขอนี้ได้รับการประมวลผลไปแล้ว",
          onConfirm: null,
          children: null,
        });
      } else if (status === 400) {
        setStatusModal({
          isOpen: true,
          type: "warning",
          title: "ข้อมูลไม่ถูกต้อง",
          message: errMsg || "ข้อมูลไม่ถูกต้อง",
          onConfirm: null,
          children: null,
        });
      } else {
        setStatusModal({
          isOpen: true,
          type: "error",
          title: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
          message: errMsg || "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง",
          onConfirm: null,
          children: null,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!request) {
      setShowReject(false);
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "ไม่พบข้อมูลคำขออนุมัติ",
        message: "ไม่พบข้อมูลคำขออนุมัติ",
        onConfirm: null,
        children: null,
      });
      return;
    }

    const finalReason = getEffectiveRejectReason();
    if (!finalReason) {
      setStatusModal({
        isOpen: true,
        type: "warning",
        title: "กรุณาเลือกเหตุผลที่ไม่อนุมัติ",
        message: "กรุณาเลือกเหตุผลที่ไม่อนุมัติ",
        onConfirm: null,
        children: null,
      });
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowReject(false);
    setStatusModal({
      isOpen: true,
      type: "loading",
      title: "กำลังบันทึกการไม่อนุมัติ...",
      message: "กรุณารอสักครู่ ระบบกำลังประมวลผลและส่งอีเมลแจ้งผล",
      onConfirm: null,
      children: null,
    });

    try {
      await axios.put(
        `/api/account-requests/${id}/reject`,
        null,
        {
          params: { reason: finalReason },
        },
      );
      clearAccountRequestsCache();

      // Trigger Notify Request Result
      try {
        await axios.post(
          `/api/account-requests/${id}/notify`,
        );
      } catch (notifyErr) {
        console.error("Notify failed:", notifyErr);
        const notifyErrMsg = notifyErr?.response?.data?.message || notifyErr?.message || "";
        setShowReject(false);
        setStatusModal({
          isOpen: true,
          type: "error",
          title: notifyErrMsg.includes("บันทึก") ? "เกิดข้อผิดพลาดในการบันทึกข้อมูล" : "การส่งล้มเหลว",
          message: notifyErrMsg || "การส่งล้มเหลว",
          onConfirm: () => {
            navigate("/listAccountRequest", {
              state: {
                updatedRequestId: Number(id),
                requestStatus: "REJECTED",
                rejectionReason: finalReason,
              },
            });
          },
          children: null,
        });
        return;
      }

      setShowReject(false);
      setStatusModal({
        isOpen: true,
        type: "success",
        title: "บันทึกผลไม่อนุมัติคำขอสำเร็จ",
        message: "ส่งอีเมลแจ้งผลสำเร็จ",
        children: (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              padding: "14px 16px",
              marginTop: "12px",
              marginBottom: "8px",
              textAlign: "left",
              fontSize: "13px",
              lineHeight: "1.6",
              color: "#991b1b",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                borderBottom: "1px solid #fee2e2",
                paddingBottom: "6px",
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>ข้อมูลการแจ้งผลที่จัดส่ง (Notify Request Result)</span>
            </div>
            <div>
              <strong>สถานประกอบการ:</strong>{" "}
              {request?.wellnessHubName || "-"}
            </div>
            <div>
              <strong>อีเมลปลายทาง:</strong> {request?.userEmail || "-"}
            </div>
            <div
              style={{
                marginTop: "8px",
                padding: "8px 10px",
                background: "#ffffff",
                border: "1px solid #fca5a5",
              }}
            >
              <strong>เหตุผลที่ไม่อนุมัติ:</strong> {finalReason}
            </div>
          </div>
        ),
        onConfirm: () => {
          navigate("/listAccountRequest", {
            state: {
              updatedRequestId: Number(id),
              requestStatus: "REJECTED",
              rejectionReason: finalReason,
            },
          });
        },
      });
    } catch (err) {
      console.error(err);
      setShowReject(false);
      const errMsg = err?.response?.data?.message || err?.message || "";
      const status = err?.response?.status;

      if (status === 404) {
        setStatusModal({
          isOpen: true,
          type: "error",
          title: "ไม่พบข้อมูลคำขออนุมัติ",
          message: errMsg || "ไม่พบข้อมูลคำขออนุมัติ",
          onConfirm: null,
          children: null,
        });
      } else if (status === 409) {
        setStatusModal({
          isOpen: true,
          type: "warning",
          title: "คำขอถูกประมวลผลแล้ว",
          message: errMsg || "คำขอนี้ได้รับการประมวลผลไปแล้ว",
          onConfirm: null,
          children: null,
        });
      } else if (status === 400) {
        setStatusModal({
          isOpen: true,
          type: "warning",
          title: "ข้อมูลไม่ถูกต้อง",
          message: errMsg || "ข้อมูลไม่ถูกต้อง",
          onConfirm: null,
          children: null,
        });
      } else {
        setStatusModal({
          isOpen: true,
          type: "error",
          title: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
          message: errMsg || "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง",
          onConfirm: null,
          children: null,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleOpenDocument = (docItem) => {
    const fileData = typeof docItem === "string" ? docItem : docItem?.data;
    if (!fileData) {
      alert("ไม่พบไฟล์เอกสารแนบ");
      return;
    }

    if (fileData.startsWith("data:application/pdf")) {
      try {
        const arr = fileData.split(",");
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const file = new Blob([u8arr], { type: mime });
        const fileURL = URL.createObjectURL(file);
        const win = window.open(fileURL, "_blank");
        if (win && docItem?.name) {
          try {
            win.document.title = docItem.name;
          } catch (e) {}
        }
      } catch (e) {
        alert("ไม่สามารถเปิดไฟล์ PDF ได้ รูปแบบ Base64 ไม่ถูกต้อง");
      }
    } else if (fileData.startsWith("data:image")) {
      try {
        const arr = fileData.split(",");
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const file = new Blob([u8arr], { type: mime });
        const fileURL = URL.createObjectURL(file);
        const win = window.open(fileURL, "_blank");
        if (win && docItem?.name) {
          try {
            win.document.title = docItem.name;
          } catch (e) {}
        }
      } catch (e) {
        const w = window.open("");
        if (w) {
          if (docItem?.name) {
            try {
              w.document.title = docItem.name;
            } catch (e) {}
          }
          w.document.write(`<img src="${fileData}" style="max-width:100%; height:auto;" />`);
        }
      }
    } else {
      const targetUrl = fileData.startsWith("http")
        ? fileData
        : `/uploads/${fileData}`;
      window.open(targetUrl, "_blank");
    }
  };

  const operatingHoursList = request
    ? formatOperatingHoursList(request.operatingHours)
    : [];
  const galleryList = request
    ? parseGalleryImages(request.wellnessHubGallery)
    : [];
  const rawDocs = request
    ? parseVerificationDocuments(request.verificationDocuments)
    : [];
  const documentsList = rawDocs.map((docItem, idx) => ({
    ...docItem,
    name: formatDocumentDisplayName(
      docItem,
      request?.requestId || id,
      idx,
      rawDocs
    ),
  }));

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <AdminSidebar activeMenu="account-requests" />

      {/* Main Content */}
      <div className="main-content">
        <div className="gov-header">
          <h2>พิจารณาคำร้องขอสิทธิ์</h2>
          <p>ตรวจสอบข้อมูลสถานประกอบการอย่างละเอียดก่อนอนุมัติบัญชี</p>
        </div>

        {request && (
          <div className="request-card">
          {/* SECTION 1: ข้อมูลสถานประกอบการ */}
          <h3>ข้อมูลสถานประกอบการ</h3>

          {request.wellnessHubImg && (
            <div
              className="cover-img-container"
              style={{
                width: "100%",
                height: "260px",
                border: "1px solid #999",
                borderRadius: "0px",
                overflow: "hidden",
                marginBottom: "20px",
                backgroundColor: "#f8fafc",
              }}
            >
              <img
                src={getImageUrl(request.wellnessHubImg)}
                alt="Wellness Hub Cover"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
          )}

          <div className="detail-grid">
            <div>
              <label>ชื่อสถานประกอบการ</label>
              <p>{request.wellnessHubName || "-"}</p>
            </div>

            <div>
              <label>หมวดหมู่ / ประเภท</label>
              <p>{request.category?.categoryName || "-"}</p>
            </div>

            <div>
              <label>เลขใบอนุญาตประกอบกิจการ</label>
              <p>{request.licenseId || "-"}</p>
            </div>

            <div>
              <label>ประเภทใบรับรอง</label>
              {(() => {
                const certs = parseCertificateTypes(request.certificateType);
                if (certs.length === 0) return <p>-</p>;
                if (certs.length === 1) return <p>{certs[0]}</p>;
                return (
                  <div className="approve-cert-display-list">
                    {certs.map((cert, i) => (
                      <p key={i} className="approve-cert-display-item">
                        {cert}
                      </p>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div>
              <label>เบอร์โทรศัพท์สถานประกอบการ</label>
              <p>{request.tellInformation || "-"}</p>
            </div>

            <div>
              <label>Email สถานประกอบการ</label>
              <p>{request.userEmail || "-"}</p>
            </div>

            <div>
              <label>ช่องทางติดต่อเพิ่มเติม / เว็บไซต์</label>
              <p>{request.contactInformation || "-"}</p>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>เวลาทำการ</label>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  marginTop: "6px",
                }}
              >
                {operatingHoursList.map((hourText, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "10px",
                      backgroundColor: "#fafafa",
                      border: "1px solid #999",
                      borderRadius: "0px",
                      color: "#334155",
                      fontSize: "14px",
                    }}
                  >
                    {hourText}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <hr
            style={{
              margin: "24px 0",
              border: "0",
              borderTop: "1px solid #e2e8f0",
            }}
          />

          {/* SECTION 2: เกี่ยวกับสถานประกอบการ */}
          <h3>เกี่ยวกับสถานประกอบการ</h3>
          <p
            className="description-text"
            style={{ lineHeight: "1.6", color: "#475569" }}
          >
            {request.wellnessHubDescription || "ไม่มีรายละเอียดเพิ่มเติม"}
          </p>

          <hr
            style={{
              margin: "24px 0",
              border: "0",
              borderTop: "1px solid #e2e8f0",
            }}
          />

          {/* SECTION 3: รูปภาพบรรยากาศ (Gallery) */}
          {galleryList.length > 0 && (
            <div className="gallery-section">
              <h3>รูปภาพบรรยากาศ</h3>
              <div
                className="gallery-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: "12px",
                  marginTop: "12px",
                }}
              >
                {galleryList.map((img, index) => (
                  <div
                    key={index}
                    style={{
                      width: "100%",
                      height: "140px",
                      borderRadius: "0px",
                      overflow: "hidden",
                      border: "1px solid #999",
                      backgroundColor: "#f8fafc",
                    }}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt={`gallery-${index}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                ))}
              </div>
              <hr
                style={{
                  margin: "24px 0",
                  border: "0",
                  borderTop: "1px solid #e2e8f0",
                }}
              />
            </div>
          )}

          {/* SECTION 4: ตำแหน่งที่ตั้ง */}
          <h3>ตำแหน่งที่ตั้ง</h3>
          <div className="detail-grid" style={{ marginBottom: "12px" }}>
            <div>
              <label>อำเภอ / เขต</label>
              <p>{request.district?.districtName || "-"}</p>
            </div>

            <div>
              <label>แผนที่สถานที่ตั้ง</label>
              <div style={{ marginTop: "6px" }}>
                {request.googleMapsLink ? (
                  <a
                    href={request.googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 16px",
                      backgroundColor: "#2563eb",
                      color: "#ffffff",
                      borderRadius: "0px",
                      textDecoration: "none",
                      fontWeight: "bold",
                      fontSize: "13px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  >
                    <FontAwesomeIcon icon={faMapMarkerAlt} /> เปิดดูแผนที่บน
                    Google Maps
                  </a>
                ) : (
                  <p>-</p>
                )}
              </div>
            </div>

            <div>
              <label>ละติจูด (Latitude)</label>
              <p>{request.wellnessHubLatitude ?? "-"}</p>
            </div>

            <div>
              <label>ลองจิจูด (Longitude)</label>
              <p>{request.wellnessHubLongitude ?? "-"}</p>
            </div>
          </div>

          <div className="full-width-detail">
            <label>ที่อยู่ตั้งสถานประกอบการ</label>
            <p className="address-text">{request.address || "-"}</p>
          </div>

          <hr
            style={{
              margin: "24px 0",
              border: "0",
              borderTop: "1px solid #e2e8f0",
            }}
          />

          {/* SECTION 5: ข้อมูลผู้ยื่นคำขอ */}
          <h3>ข้อมูลผู้ยื่นคำขอ</h3>
          <div className="detail-grid">
            <div>
              <label>ชื่อผู้ยื่นคำขอ</label>
              <p>{request.requesterName || "-"}</p>
            </div>

            <div>
              <label>Email ผู้ยื่นคำขอ</label>
              <p>{request.userEmail || "-"}</p>
            </div>
          </div>

          <hr
            style={{
              margin: "24px 0",
              border: "0",
              borderTop: "1px solid #e2e8f0",
            }}
          />

          {/* SECTION 6: เอกสารประกอบ */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <h3 style={{ margin: 0 }}>
              เอกสารประกอบ{" "}
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "normal",
                  color: "#64748b",
                }}
              >
                ({documentsList.length} ไฟล์)
              </span>
            </h3>
          </div>

          {documentsList.length === 0 ? (
            <div
              className="pdf-box"
              style={{
                padding: "16px",
                background: "#f8fafc",
                border: "1px dashed #cbd5e1",
                borderRadius: "0px",
                color: "#94a3b8",
                textAlign: "center",
              }}
            >
              ไม่มีไฟล์เอกสารแนบ
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {documentsList.map((docItem, idx) => {
                const isPdf =
                  typeof docItem.data === "string" &&
                  (docItem.data.startsWith("data:application/pdf") ||
                    (docItem.name && docItem.name.toLowerCase().endsWith(".pdf")));
                const isImg =
                  typeof docItem.data === "string" &&
                  (docItem.data.startsWith("data:image") ||
                    (docItem.name &&
                      (docItem.name.toLowerCase().endsWith(".jpg") ||
                        docItem.name.toLowerCase().endsWith(".jpeg") ||
                        docItem.name.toLowerCase().endsWith(".png"))));

                return (
                  <div
                    key={idx}
                    className="pdf-box"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 18px",
                      background: "#fafafa",
                      border: "1px solid #999",
                      borderRadius: "0px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        minWidth: 0,
                      }}
                    >
                      <FontAwesomeIcon
                        icon={
                          isPdf
                            ? faFilePdf
                            : isImg
                              ? faFileImage
                              : faFileLines
                        }
                        style={{
                          color: isPdf
                            ? "#dc2626"
                            : isImg
                              ? "#2563eb"
                              : "#059669",
                          fontSize: "24px",
                          flexShrink: 0,
                        }}
                      />
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "3px",
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "750",
                            color: "#1e293b",
                            fontSize: "14.5px",
                          }}
                        >
                          {docItem.type || "เอกสารยืนยันสิทธิ์"}
                        </span>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#64748b",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {docItem.name || "ไฟล์เอกสารแนบ"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      style={{
                        padding: "7px 18px",
                        background: "#ffffff",
                        color: "#076653",
                        border: "1.5px solid #076653",
                        borderRadius: "0px",
                        cursor: "pointer",
                        fontWeight: "750",
                        fontSize: "13px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        flexShrink: 0,
                        transition: "all 0.2s ease",
                      }}
                      onClick={() => handleOpenDocument(docItem)}
                    >
                      <FontAwesomeIcon icon={faEye} />
                      เปิดดูเอกสาร
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-area" style={{ marginTop: "30px" }}>
            <button
              className="approve-btn"
              onClick={() => {
                setShowApproveEmailPreview(false);
                setShowApprove(true);
              }}
              disabled={isSubmitting}
            >
              <FontAwesomeIcon icon={faCheck} /> อนุมัติ
            </button>

            <button
              className="reject-btn"
              onClick={() => {
                setReason("");
                setRejectDetail("");
                setShowRejectEmailPreview(false);
                setShowReject(true);
              }}
              disabled={isSubmitting}
            >
              <FontAwesomeIcon icon={faXmark} /> ไม่อนุมัติ
            </button>
          </div>
        </div>
        )}
      </div>

      {/* Popup Approve Confirmation */}
      {showApprove && (
        <div className="popup-bg" role="dialog" aria-modal="true">
          <div className="popup approve-modal-container">
            <div className="approve-popup-header">
              <h3>ยืนยันการอนุมัติสิทธิ์สถานประกอบการ</h3>
              <p className="popup-subtitle">
                ตรวจสอบข้อมูลก่อนสร้างบัญชีและส่งอีเมลแจ้งผู้ยื่นคำขอ
              </p>
            </div>

            {/* ข้อมูลสถานประกอบการและผู้ยื่นคำขอ */}
            <div className="approve-info-card">
              <div className="approve-info-row">
                <span className="approve-info-label">สถานประกอบการ:</span>
                <span className="approve-info-value">{request?.wellnessHubName || "-"}</span>
              </div>
              <div className="approve-info-row">
                <span className="approve-info-label">รหัสใบอนุญาต:</span>
                <span className="approve-info-value">{request?.licenseId || "-"}</span>
              </div>
              <div className="approve-info-row">
                <span className="approve-info-label">ผู้ยื่นคำขอ:</span>
                <span className="approve-info-value">{request?.requesterName || "-"}</span>
              </div>
              <div className="approve-info-row">
                <span className="approve-info-label">อีเมลแจ้งเตือน:</span>
                <span className="approve-info-value">{request?.userEmail || "-"}</span>
              </div>
            </div>

            {/* Collapsible ตัวอย่างรูปแบบอีเมลที่จะส่ง */}
            <div className="email-preview-accordion-section">
              <button
                type="button"
                className={`email-preview-accordion-btn ${showApproveEmailPreview ? "open" : ""}`}
                onClick={() => setShowApproveEmailPreview(!showApproveEmailPreview)}
              >
                <div className="email-preview-accordion-title">
                  <FontAwesomeIcon icon={faCircleInfo} className="info-badge-icon" />
                  <span>ดูตัวอย่างรูปแบบอีเมลที่จะส่ง</span>
                </div>
                <FontAwesomeIcon
                  icon={showApproveEmailPreview ? faChevronUp : faChevronDown}
                  className="accordion-arrow-icon"
                />
              </button>

              {showApproveEmailPreview && (
                <div className="email-preview-wrapper">
                  <div className="email-preview-header">
                    <FontAwesomeIcon icon={faEnvelope} />
                    <span>ตัวอย่างเนื้อหาอีเมลที่จะจัดส่ง (Email Preview)</span>
                  </div>
                  <div className="email-preview-body">
                    <div className="email-preview-meta">
                      <div><strong>ถึง:</strong> {request?.userEmail}</div>
                      <div><strong>หัวข้อ:</strong> ผลการอนุมัติบัญชีสถานประกอบการ</div>
                    </div>
                    <div className="email-preview-content">
                      <p>คำร้องขอสิทธิ์สถานประกอบการได้รับการอนุมัติเรียบร้อยแล้ว ท่านสามารถเข้าสู่ระบบเพื่อจัดการข้อมูลสถานประกอบการด้วยชื่อผู้ใช้งานและรหัสผ่านที่กำหนด</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="popup-buttons">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setShowApprove(false);
                  setShowApproveEmailPreview(false);
                }}
                disabled={isSubmitting}
              >
                ยกเลิก
              </button>

              <button
                type="button"
                className="confirm-btn"
                onClick={handleApprove}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin /> กำลังดำเนินการ...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheck} /> ยืนยันและส่งอีเมล
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup Reject Confirmation */}
      {showReject && (
        <div className="popup-bg" role="dialog" aria-modal="true">
          <div className="popup reject-confirm-popup">
            <div className="reject-popup-header">
              <h3>ยืนยันการไม่อนุมัติสิทธิ์สถานประกอบการ</h3>
              <p className="popup-subtitle">
                ตรวจสอบข้อมูลและระบุเหตุผลก่อนส่งอีเมลแจ้งผู้ยื่นคำขอ
              </p>
            </div>

            {/* ข้อมูลสถานประกอบการและผู้ยื่นคำขอ */}
            <div className="approve-info-card">
              <div className="approve-info-row">
                <span className="approve-info-label">สถานประกอบการ:</span>
                <span className="approve-info-value">{request?.wellnessHubName || "-"}</span>
              </div>
              <div className="approve-info-row">
                <span className="approve-info-label">รหัสใบอนุญาต:</span>
                <span className="approve-info-value">{request?.licenseId || "-"}</span>
              </div>
              <div className="approve-info-row">
                <span className="approve-info-label">ผู้ยื่นคำขอ:</span>
                <span className="approve-info-value">{request?.requesterName || "-"}</span>
              </div>
              <div className="approve-info-row">
                <span className="approve-info-label">อีเมลแจ้งเตือน:</span>
                <span className="approve-info-value">{request?.userEmail || "-"}</span>
              </div>
            </div>

            {/* ฟอร์มระบุเหตุผลไม่อนุมัติ */}
            <div className="reject-form-section">
              <div className="reject-form-group">
                <label htmlFor="reject-reason-select">
                  เลือกเหตุผลที่ไม่อนุมัติ <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <select
                  id="reject-reason-select"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="">-- กรุณาเลือกเหตุผล --</option>
                  <option value="เอกสารไม่ครบถ้วน">เอกสารไม่ครบถ้วน</option>
                  <option value="ข้อมูลไม่ถูกต้อง">ข้อมูลไม่ถูกต้อง</option>
                  <option value="ไม่ผ่านเกณฑ์การพิจารณา">ไม่ผ่านเกณฑ์การพิจารณา</option>
                  <option value="อื่นๆ">อื่นๆ (ระบุรายละเอียดเพิ่มเติม)</option>
                </select>
              </div>

              <div className="reject-form-group" style={{ marginTop: "12px" }}>
                <label htmlFor="reject-detail-input">
                  รายละเอียดเหตุผลเพิ่มเติม (ทางเลือก)
                </label>
                <textarea
                  id="reject-detail-input"
                  rows={3}
                  value={rejectDetail}
                  onChange={(e) => setRejectDetail(e.target.value)}
                  placeholder="ระบุรายละเอียดเพิ่มเติมเพื่อให้ผู้ยื่นคำขอทราบเหตุผลที่ชัดเจน"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Collapsible ตัวอย่างรูปแบบอีเมลที่จะส่ง */}
            <div className="email-preview-accordion-section">
              <button
                type="button"
                className={`email-preview-accordion-btn email-preview-accordion-btn--reject ${showRejectEmailPreview ? "open" : ""}`}
                onClick={() => setShowRejectEmailPreview(!showRejectEmailPreview)}
              >
                <div className="email-preview-accordion-title">
                  <FontAwesomeIcon icon={faCircleInfo} className="info-badge-icon info-badge-icon--reject" />
                  <span>ดูตัวอย่างรูปแบบอีเมลที่จะส่ง</span>
                </div>
                <FontAwesomeIcon
                  icon={showRejectEmailPreview ? faChevronUp : faChevronDown}
                  className="accordion-arrow-icon"
                />
              </button>

              {showRejectEmailPreview && (
                <div className="email-preview-wrapper email-preview-wrapper--reject">
                  <div className="email-preview-header">
                    <FontAwesomeIcon icon={faEnvelope} />
                    <span>ตัวอย่างเนื้อหาอีเมลที่จะจัดส่ง (Email Preview)</span>
                  </div>
                  <div className="email-preview-body">
                    <div className="email-preview-meta">
                      <div><strong>ถึง:</strong> {request?.userEmail}</div>
                      <div><strong>หัวข้อ:</strong> ผลการพิจารณาคำร้องขอสิทธิ์สถานประกอบการ</div>
                    </div>
                    <div className="email-preview-content">
                      <p>คำร้องขอสิทธิ์สถานประกอบการไม่ผ่านการอนุมัติ เนื่องจาก:</p>
                      <p style={{ margin: "6px 0", color: "#b91c1c", fontWeight: "600" }}>
                        • {getEffectiveRejectReason() || "(ยังไม่ได้ระบุเหตุผล)"}
                      </p>
                      <div style={{ marginTop: "10px", padding: "8px 10px", background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "0px", fontSize: "12.5px", color: "#475569", lineHeight: "1.5" }}>
                        <strong>คำแนะนำ:</strong> ท่านสามารถตรวจสอบและแก้ไขข้อมูลหรือเอกสารให้ถูกต้อง จากนั้นสามารถดำเนินการยื่นคำร้องขอสิทธิ์เข้ามาใหม่อีกครั้งผ่านทางเว็บไซต์ได้ เมื่อส่งข้อมูลใหม่ระบบจะนำเข้าสู่สถานะ <strong>"รอพิจารณา"</strong> อีกครั้ง
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="popup-buttons">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setShowReject(false);
                  setShowRejectEmailPreview(false);
                }}
                disabled={isSubmitting}
              >
                ยกเลิก
              </button>

              <button
                type="button"
                className="confirm-btn confirm-btn--reject"
                onClick={handleReject}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin /> กำลังดำเนินการ...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faXmark} /> ยืนยันไม่อนุมัติและส่งอีเมล
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminStatusModal
        isOpen={statusModal.isOpen}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        confirmText="ตกลง"
        onConfirm={() => {
          if (statusModal.onConfirm) {
            statusModal.onConfirm();
          }
          setStatusModal({
            isOpen: false,
            type: "info",
            title: "",
            message: "",
            onConfirm: null,
            children: null,
          });
        }}
        onClose={() => {
          if (statusModal.onConfirm) {
            statusModal.onConfirm();
          }
          setStatusModal({
            isOpen: false,
            type: "info",
            title: "",
            message: "",
            onConfirm: null,
            children: null,
          });
        }}
      >
        {statusModal.children}
      </AdminStatusModal>
    </div>
  );
}

export default ApproveAccountRequest;
