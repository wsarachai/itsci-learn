import React from "react";
import {
  SlidersHorizontal,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Filter,
  Eye,
  EyeOff,
  Layers,
  Pencil,
} from "lucide-react";

function RouteMapToolbar({
  availableCategories = [],
  activeFilters = {},
  onToggleFilter,
  onToggleAllCategories,
  isAllCategoriesActive,
  districts = [],
  visibleDistrictIds = [],
  isEditingDistricts,
  onToggleDistrictEdit,
  onToggleDistrictVisibility,
  onFocusDistrict,
  isEmergencyMode,
  onToggleEmergencyMode,
  isControlCollapsed,
  onToggleControlCollapsed,
  onResetRouteView,
}) {
  if (availableCategories.length === 0 && districts.length === 0) {
    return null;
  }

  const activeCategoryCount = Object.values(activeFilters).filter(Boolean).length;

  return (
    <div
      className={`route-detail-map-toolbar ${
        isControlCollapsed ? "route-detail-map-toolbar--collapsed" : ""
      }`}
    >
      {/* 🌟 UNIFIED TOOLBAR HEADER */}
      <div className="route-detail-map-toolbar__header">
        <div className="route-detail-map-toolbar__title-area">
          <div className="route-detail-map-toolbar__icon">
            <SlidersHorizontal size={17} />
          </div>
          <div>
            <h3 className="route-detail-map-toolbar__title">
              ตัวกรอง & แผนที่เส้นทาง
            </h3>
            <span className="route-detail-map-toolbar__subtitle">
              แสดง {activeCategoryCount}/{availableCategories.length} หมวดหมู่
            </span>
          </div>
        </div>

        <div className="route-detail-map-actions">
          <button
            type="button"
            className={`route-detail-map-action route-detail-emergency-btn ${
              isEmergencyMode ? "active" : ""
            }`}
            onClick={onToggleEmergencyMode}
            title={
              isEmergencyMode
                ? "คลิกเพื่อกลับสู่มุมมองสถานประกอบการปกติ"
                : "คลิกเพื่อเปิดโหมดฉุกเฉินและการแพทย์ทางอากาศ (Sky Doctor / รพ. / กู้ภัย)"
            }
          >
            <span
              className="route-detail-emergency-btn__pulse"
              aria-hidden="true"
            />
            <span className="route-detail-emergency-btn__icon">
              {isEmergencyMode ? "🚨" : "🚁"}
            </span>
            <span className="route-detail-emergency-btn__label">
              {isEmergencyMode
                ? "โหมดฉุกเฉิน & Sky Doctor"
                : "โหมดฉุกเฉิน & Sky Doctor"}
            </span>
            <span className="route-detail-emergency-btn__tag">
              {isEmergencyMode ? "ACTIVE" : "SOS"}
            </span>
          </button>

          <button
            type="button"
            className="route-detail-map-action route-detail-map-action--primary"
            onClick={onResetRouteView}
            title="รีเซ็ตและซูมแสดงเส้นทางทั้งหมด"
          >
            <Maximize2 size={15} />
            <span>ดูเส้นทางทั้งหมด</span>
          </button>

          <button
            type="button"
            className={`route-detail-map-action route-detail-map-action--toggle ${
              isControlCollapsed ? "active" : ""
            }`}
            onClick={onToggleControlCollapsed}
            title={
              isControlCollapsed ? "ขยายแถบตัวกรอง" : "ยุบแถบตัวกรอง"
            }
          >
            {isControlCollapsed ? (
              <>
                <ChevronDown size={16} />
                <span>แสดงตัวกรอง</span>
              </>
            ) : (
              <>
                <ChevronUp size={16} />
                <span>ยุบตัวกรอง</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 🌟 COLLAPSIBLE TOOLBAR BODY */}
      {!isControlCollapsed && (
        <div className="route-detail-map-toolbar__body">
          {/* Section A: หมวดหมู่สถานประกอบการ */}
          {availableCategories.length > 0 && (
            <div className="route-detail-filter-section">
              <div className="route-detail-filter-header">
                <span className="route-detail-filter-label">
                  <Filter size={13} /> หมวดหมู่สถานประกอบการ
                </span>
                <button
                  type="button"
                  className="route-detail-btn-subtle"
                  onClick={onToggleAllCategories}
                  title={
                    isAllCategoriesActive
                      ? "คลิกเพื่อซ่อนทั้งหมด"
                      : "คลิกเพื่อแสดงทั้งหมด"
                  }
                >
                  {isAllCategoriesActive ? (
                    <>
                      <EyeOff size={13} /> ซ่อนทั้งหมด
                    </>
                  ) : (
                    <>
                      <Eye size={13} /> แสดงทั้งหมด
                    </>
                  )}
                </button>
              </div>

              <div className="route-detail-filter-list">
                {availableCategories.map((cat) => {
                  const isChecked = !!activeFilters[cat.id];
                  return (
                    <label
                      key={cat.id}
                      className={`route-detail-filter-chip ${
                        isChecked ? "active" : ""
                      }`}
                      style={{
                        "--route-category-color": cat.color,
                        "--route-category-background": `${cat.color}15`,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggleFilter(cat.id)}
                        style={{ accentColor: cat.color }}
                      />
                      <span>{cat.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section B: ลำดับอำเภอในเส้นทาง */}
          {districts.length > 0 && (
            <div className="route-detail-districts-row">
              <div className="route-detail-districts-header">
                <div className="route-detail-districts-heading">
                  <Layers size={13} />
                  <span className="route-detail-districts-title">
                    ลำดับอำเภอในเส้นทาง
                  </span>
                </div>

                <button
                  type="button"
                  className={`route-detail-district-edit ${
                    isEditingDistricts ? "active" : ""
                  }`}
                  onClick={onToggleDistrictEdit}
                >
                  <Pencil size={13} aria-hidden="true" />
                  <span>
                    {isEditingDistricts ? "เสร็จสิ้น" : "แก้ไขเส้นทาง"}
                  </span>
                </button>
              </div>

              {isEditingDistricts && (
                <p className="route-detail-districts-help">
                  เลือกอำเภอที่ต้องการแสดงบนแผนที่ หมุดและเส้นทางจะปรับตามรายการที่เลือก
                </p>
              )}

              <div
                className="route-detail-districts-scroll"
                role="list"
              >
                {districts.map((district, idx) => {
                  const order = district.orderNumber || idx + 1;
                  const name =
                    district.districtName ||
                    district.district?.districtName ||
                    "";
                  const districtKey = String(
                    district.districtId ?? `district-${idx}`,
                  );
                  const isDistrictVisible =
                    visibleDistrictIds.includes(districtKey);

                  return (
                    <div
                      className={`route-detail-district-item ${
                        !isDistrictVisible
                          ? "route-detail-district-item--hidden"
                          : ""
                      }`}
                      key={`${district.districtId || idx}-${order}`}
                      role="listitem"
                    >
                      <div
                        className={`route-detail-district-chip-wrapper ${
                          isEditingDistricts
                            ? "route-detail-district-chip-wrapper--editing"
                            : ""
                        }`}
                      >
                        {isEditingDistricts && (
                          <label
                            className="route-detail-district-toggle"
                            title={`${
                              isDistrictVisible ? "ซ่อน" : "แสดง"
                            } อ. ${name}`}
                          >
                            <input
                              type="checkbox"
                              checked={isDistrictVisible}
                              onChange={() =>
                                onToggleDistrictVisibility(district, idx)
                              }
                            />
                            <span
                              className="route-detail-district-checkbox"
                              aria-hidden="true"
                            />
                          </label>
                        )}

                        <button
                          type="button"
                          className="route-detail-district-chip"
                          onClick={() => onFocusDistrict(district)}
                        >
                          <span className="route-detail-district-number">
                            {order}
                          </span>
                          <span className="route-detail-district-name">
                            อ. {name}
                          </span>
                        </button>
                      </div>

                      {idx < districts.length - 1 && (
                        <span
                          className="route-detail-district-arrow"
                          aria-hidden="true"
                        >
                          →
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default React.memo(RouteMapToolbar);
