import React from "react";
import { MapPin, Phone, Navigation } from "lucide-react";
import { getCategoryMarkerImage } from "../../../utils/categoryMarkerIcons";

function RouteHubCard({
  hub,
  catInfo,
  isSkyDoc,
  isEmergencyItem,
  onFocusHub,
}) {
  const telNumber =
    (hub.telInformation || "").split(",")[0]?.trim() || "1669";

  const districtName = hub.districtName || hub.district?.districtName || "";

  return (
    <article
      className={`route-detail-hub-card ${
        isSkyDoc
          ? "route-detail-hub-card--skydoctor"
          : isEmergencyItem
          ? "route-detail-hub-card--emergency"
          : ""
      }`}
      role="button"
      tabIndex={0}
      onClick={() => onFocusHub(hub)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onFocusHub(hub);
        }
      }}
    >
      <div className="route-detail-hub-card__category">
        {isSkyDoc ? (
          <span className="route-detail-skydoc-tag-icon">🚁</span>
        ) : (
          <img
            src={getCategoryMarkerImage(hub)}
            alt={hub.categoryName || catInfo.name}
            className="route-detail-hub-card__category-pin"
            loading="lazy"
          />
        )}
        <p>{hub.categoryName || catInfo.name}</p>
      </div>

      <h3>{hub.wellnessHubName}</h3>

      {districtName && (
        <p className="route-detail-hub-card__location">
          <MapPin size={14} /> อ. {districtName}
        </p>
      )}

      {hub.wellnessHubDescription && (
        <p className="route-detail-hub-card__description">
          {hub.wellnessHubDescription}
        </p>
      )}

      {/* 🌟 Emergency Quick Actions */}
      {isEmergencyItem ? (
        <div
          className="route-detail-emergency-card-actions"
          onClick={(e) => e.stopPropagation()}
        >
          <a
            href={`tel:${telNumber}`}
            className="route-detail-emergency-call-btn"
          >
            <Phone size={13} />
            <span>โทร {telNumber}</span>
          </a>
          {hub.googleMapsLink && (
            <a
              href={hub.googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="route-detail-emergency-map-btn"
            >
              <Navigation size={13} />
              <span>แผนที่นำทาง</span>
            </a>
          )}
        </div>
      ) : (
        <div className="route-detail-hub-card__focus">
          <span className="route-detail-hub-card__focus-icon">
            <MapPin size={14} aria-hidden="true" />
          </span>
          <span>ดูตำแหน่งบนแผนที่</span>
        </div>
      )}
    </article>
  );
}

export default React.memo(RouteHubCard);
