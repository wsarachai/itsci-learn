import React from "react";
import { Info, X } from "lucide-react";

export default function MapLegendModal({ isOpen, onClose, categories = [] }) {
  if (!isOpen) return null;

  return (
    <div
      className="route-detail-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="คำอธิบายสัญลักษณ์หมุดบนแผนที่"
    >
      <div
        className="route-detail-legend-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="route-detail-legend-modal__header">
          <div className="route-detail-legend-modal__title-box">
            <Info size={18} className="route-detail-legend-modal__icon" />
            <h3 className="route-detail-legend-modal__title">
              คำอธิบายสัญลักษณ์หมุดบนแผนที่
            </h3>
          </div>
          <button
            type="button"
            className="route-detail-legend-modal__close-btn"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="route-detail-legend-modal__body">
          {/* กลุ่มที่ 1: หมุดลำดับอำเภอ */}
          <div className="route-detail-legend-group">
            <div className="route-detail-legend-group__title">
              จุดแวะและเส้นทาง (Route Stops)
            </div>
            <div className="route-detail-legend-item">
              <span className="route-detail-legend-dot route-detail-legend-dot--district" />
              <span className="route-detail-legend-label">
                อำเภอตามลำดับเส้นทาง (ลำดับตัวเลข 1, 2, 3...)
              </span>
            </div>
          </div>

          {/* กลุ่มที่ 2: สถานประกอบการเพื่อสุขภาพ */}
          {categories.length > 0 && (
            <div className="route-detail-legend-group">
              <div className="route-detail-legend-group__title">
                สถานประกอบการเพื่อสุขภาพ (Wellness Hubs)
              </div>
              <div className="route-detail-legend-list">
                {categories.map((cat) => (
                  <div key={cat.id} className="route-detail-legend-item">
                    <span
                      className="route-detail-legend-dot"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="route-detail-legend-label">
                      {cat.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* กลุ่มที่ 3: บริการฉุกเฉินและ Sky Doctor */}
          <div className="route-detail-legend-group">
            <div className="route-detail-legend-group__title">
              บริการฉุกเฉิน & การแพทย์ฉุกเฉินทางอากาศ (Emergency & Sky Doctor)
            </div>
            <div className="route-detail-legend-list">
              <div className="route-detail-legend-item route-detail-legend-item--skydoc">
                <span className="route-detail-legend-dot route-detail-legend-dot--skydoc" />
                <span className="route-detail-legend-label route-detail-legend-label--skydoc">
                  🚁 Sky Doctor (แพทย์ฉุกเฉินทางอากาศ)
                </span>
              </div>
              <div className="route-detail-legend-item">
                <span
                  className="route-detail-legend-dot"
                  style={{ backgroundColor: "#BD0915" }}
                />
                <span className="route-detail-legend-label">
                  โรงพยาบาลระดับสูง (ALS - Advanced Life Support)
                </span>
              </div>
              <div className="route-detail-legend-item">
                <span
                  className="route-detail-legend-dot"
                  style={{ backgroundColor: "#C98600" }}
                />
                <span className="route-detail-legend-label">
                  หน่วยกู้ชีพ / กู้ภัย (BLS - Basic Life Support)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
