import React from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faExclamationTriangle,
  faCircleExclamation,
  faCircleInfo,
  faTimes,
  faArrowRight,
  faPenToSquare,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import "./AdminStatusModal.css";

/**
 * AdminStatusModal - ป๊อปอัปสถานะกระชับ คมชัด สไตล์ทางการ
 * เน้นไอคอนเด่นชัด ข้อความสั้นกระชับ สไตล์ราชการ/แอดมิน คมชัด
 */
function AdminStatusModal({
  isOpen,
  type = "success", // 'loading' | 'success' | 'error' | 'warning' | 'info'
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onClose,
  isEdit = false,
  showCloseButton = false,
  children,
}) {
  if (!isOpen) return null;

  const isLoading = type === "loading";
  const isSuccess = type === "success";
  const isWarning = type === "warning";
  const isInfo = type === "info";
  const isError = type === "error";

  // ฟังก์ชันแปลงข้อความให้เป็น String เสมอ ป้องกัน React Error
  const safeText = (val) => {
    if (val === null || val === undefined) return "";
    if (typeof val === "string") return val;
    if (typeof val === "number" || typeof val === "boolean") return String(val);
    if (typeof val === "object") {
      return val.message || val.error || val.statusText || JSON.stringify(val);
    }
    return String(val);
  };

  const safeTitle = safeText(title);
  const safeMessage = safeText(message);

  // กำหนดข้อความเริ่มต้น
  const defaultTitle = isLoading
    ? isEdit
      ? "กำลังบันทึกการแก้ไข..."
      : "กำลังบันทึกข้อมูล..."
    : isSuccess
    ? isEdit
      ? "แก้ไขข้อมูลสำเร็จ"
      : "บันทึกข้อมูลสำเร็จ"
    : isWarning
    ? "กรุณาตรวจสอบข้อมูล"
    : isInfo
    ? "แจ้งเตือนระบบ"
    : isEdit
    ? "ไม่สามารถแก้ไขข้อมูลได้"
    : "ไม่สามารถบันทึกข้อมูลได้";

  const defaultMessage = isLoading
    ? "ระบบกำลังประมวลผลข้อมูลเข้าสู่ฐานข้อมูลกลาง กรุณารอสักครู่"
    : isSuccess
    ? isEdit
      ? "ระบบได้ปรับปรุงและบันทึกการแก้ไขข้อมูลเรียบร้อยแล้ว"
      : "ระบบได้บันทึกข้อมูลใหม่เรียบร้อยแล้ว"
    : isWarning
    ? "กรุณากรอกข้อมูลให้ถูกต้องครบถ้วนตามเงื่อนไข"
    : isInfo
    ? "บันทึกการดำเนินการเรียบร้อยแล้ว"
    : "กรุณาตรวจสอบความถูกต้องของข้อมูลแล้วลองใหม่อีกครั้ง";

  const defaultConfirmText = isSuccess ? "ตกลง" : isWarning || isError ? "ตกลง" : "ตกลง";
  const defaultCancelText = "ปิด";

  const getThemeClass = () => {
    if (isLoading) return "modal-theme-loading";
    if (isSuccess) return "modal-theme-success";
    if (isWarning) return "modal-theme-warning";
    if (isInfo) return "modal-theme-info";
    return "modal-theme-error";
  };

  const renderIcon = () => {
    if (isLoading) {
      return (
        <FontAwesomeIcon
          icon={faSpinner}
          className="admin-status-main-icon icon-spin"
        />
      );
    }
    if (isSuccess) {
      return <FontAwesomeIcon icon={faCheck} className="admin-status-main-icon" />;
    }
    if (isWarning) {
      return (
        <FontAwesomeIcon
          icon={faCircleExclamation}
          className="admin-status-main-icon"
        />
      );
    }
    if (isInfo) {
      return <FontAwesomeIcon icon={faCircleInfo} className="admin-status-main-icon" />;
    }
    return (
      <FontAwesomeIcon
        icon={faExclamationTriangle}
        className="admin-status-main-icon"
      />
    );
  };

  return (
    <div className="admin-status-modal-overlay" role="dialog" aria-modal="true">
      <div className={`admin-status-modal-box ${getThemeClass()}`}>
        {/* แถบสีนำสายตาด้านบน */}
        <div className="admin-modal-top-accent" />

        {/* ปุ่มปิดมุมขวาบน */}
        {showCloseButton && !isLoading && (onClose || onConfirm) && (
          <button
            type="button"
            className="admin-status-close-btn"
            onClick={onClose || onConfirm}
            aria-label="ปิด"
            title="ปิด"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        )}

        {/* เนื้อหาหลัก: ไอคอน + ข้อความ */}
        <div className="admin-status-body">
          {/* กรอบไอคอนทรงเหลี่ยม คมชัด */}
          <div className="admin-status-icon-frame">{renderIcon()}</div>

          {/* ข้อความสั้น ชัดเจน */}
          <div className="admin-status-text-content">
            <h3 className="admin-status-title">{safeTitle || defaultTitle}</h3>
            {safeMessage && <p className="admin-status-message">{safeMessage}</p>}

            {/* แถบ Progress Bar เล็ก สำหรับ Loading */}
            {isLoading && (
              <div className="admin-status-progress-track">
                <div className="admin-status-progress-bar" />
              </div>
            )}
          </div>
        </div>

        {/* ส่วนเสริมสำหรับใส่ข้อมูลรายละเอียดเพิ่มเติม เช่น กล่องข้อมูลบัญชี */}
        {children && <div className="admin-status-custom-content">{children}</div>}

        {/* ปุ่มคำสั่งด้านล่าง (ไม่แสดงตอนกำลังโหลด) */}
        {!isLoading && (
          <div className="admin-status-actions">
            {isSuccess ? (
              <button
                type="button"
                className="btn-admin-action btn-admin-primary btn-success-glow"
                onClick={onConfirm || onClose}
                autoFocus
              >
                <span>{confirmText || defaultConfirmText}</span>
                <FontAwesomeIcon icon={faArrowRight} className="btn-action-icon-right" />
              </button>
            ) : isWarning ? (
              <button
                type="button"
                className="btn-admin-action btn-admin-primary btn-warning-glow"
                onClick={onClose || onConfirm}
                autoFocus
              >
                <FontAwesomeIcon icon={faPenToSquare} className="btn-action-icon-left" />
                <span>{cancelText || confirmText || "ตกลง"}</span>
              </button>
            ) : isInfo ? (
              <button
                type="button"
                className="btn-admin-action btn-admin-primary btn-info-glow"
                onClick={onConfirm || onClose}
                autoFocus
              >
                <span>{confirmText || "ตกลง"}</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn-admin-action btn-admin-primary btn-error-glow"
                onClick={onClose || onConfirm}
                autoFocus
              >
                <FontAwesomeIcon icon={faPenToSquare} className="btn-action-icon-left" />
                <span>{cancelText || defaultCancelText}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

AdminStatusModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  type: PropTypes.oneOf(["loading", "success", "error", "warning", "info"]),
  title: PropTypes.string,
  message: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  onConfirm: PropTypes.func,
  onClose: PropTypes.func,
  isEdit: PropTypes.bool,
  showCloseButton: PropTypes.bool,
  children: PropTypes.node,
};

export default AdminStatusModal;
