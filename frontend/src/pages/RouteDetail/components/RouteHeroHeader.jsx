import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

function RouteHeroHeader({ routeName, routeDescription }) {
  return (
    <header className="route-detail-hero">
      <div className="route-detail-container">
        <Link to="/" className="route-detail-back">
          <ArrowLeft size={16} /> กลับหน้าแรก
        </Link>
        <p className="route-detail-eyebrow">WELLNESS TOURISM ROUTE</p>
        <h1>{routeName}</h1>
        {routeDescription && (
          <p className="route-detail-hero__description">
            {routeDescription}
          </p>
        )}
      </div>
    </header>
  );
}

export default React.memo(RouteHeroHeader);
