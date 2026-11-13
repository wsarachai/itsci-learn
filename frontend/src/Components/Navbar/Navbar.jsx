// src/Components/Navbar/Navbar.jsx
import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightToBracket } from "@fortawesome/free-solid-svg-icons";
import "./Navbar.css";

// 🌟 นำเข้ารูปภาพโลโก้จากโฟลเดอร์ logo
import cmuLogo from "../../assets/logo/cmulogo.jpg";
import itLogo from "../../assets/logo/it.jpg";
import mophLogo from "../../assets/logo/moph.jpg";
import ctrdLogo from "../../assets/logo/ctrd.jpg";
import cbtLogo from "../../assets/logo/cbt.jpg";
import { withBase } from "../../utils/basePath";

// 🌟 โลโก้หลัก Chiang Mai Wellness Route จากโฟลเดอร์ uploads
const MAIN_LOGO_URL = withBase("/uploads/logo/เชียงใหม่ เส้นทางแห่งสุขภาพ.png");

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  // ตรวจจับการเลื่อน Scroll เพื่อเพิ่ม Glassmorphism Effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ปิดเมนูเมื่อเปลี่ยนหน้า
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const menuItems = [
    {
      path: "/",
      label: "หน้าแรก",
      end: true,
    },
    {
      path: "/wellness-routes",
      label: "เส้นทางท่องเที่ยว",
    },
    {
      path: "/articles",
      label: "บทความสุขภาพ",
    },
    {
      path: "/request-wellness-hub-account",
      label: "ยื่นคำขอ",
    },
    {
      path: "/track-status",
      label: "ติดตามสถานะ",
    },
  ];

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className={`navbar ${isScrolled ? "navbar--scrolled" : ""}`}>
      {/* 🌿 1. แถบโลโก้หน่วยงานร่วมพัฒนาด้านบนสุด จัดกึ่งกลาง */}
      <div className="navbar__topbar">
        <div className="navbar__topbar-container">
          <div className="navbar__topbar-logos">
            <div className="navbar__partner-item" title="มหาวิทยาลัยเชียงใหม่ (CMU)">
              <img src={cmuLogo} alt="CMU Logo" />
            </div>
            <div className="navbar__partner-item" title="สำนักบริการเทคโนโลยีสารสนเทศ (IT CMU)">
              <img src={itLogo} alt="IT Logo" />
            </div>
            <div className="navbar__partner-item" title="กระทรวงสาธารณสุข (MOPH)">
              <img src={mophLogo} alt="MOPH Logo" />
            </div>
            <div className="navbar__partner-item" title="ศูนย์วิจัยและพัฒนาการท่องเที่ยว (CTRD)">
              <img src={ctrdLogo} alt="CTRD Logo" />
            </div>
            <div className="navbar__partner-item" title="การท่องเที่ยวโดยชุมชน (CBT Chiang Mai)">
              <img src={cbtLogo} alt="CBT Logo" />
            </div>
          </div>
        </div>
      </div>

      {/* 🌿 เส้น Accent สีเวลเนสไล่เฉด */}
      <div className="navbar__top-accent" />

      <div className="navbar__container">
        {/* 🌟 2. ส่วนแบรนด์ CHIANG MAI WELLNESS */}
        <div className="navbar__identity">
          <Link
            to="/"
            className="navbar__brand"
            onClick={closeMenu}
            aria-label="หน้าแรก Chiang Mai Wellness Route"
          >
            <div className="navbar__brand-logo-wrap">
              <img
                src={MAIN_LOGO_URL}
                alt="Chiang Mai Wellness Route"
                className="navbar__brand-logo-img"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  if (e.currentTarget.parentElement) {
                    e.currentTarget.parentElement.innerHTML = '<span class="navbar__brand-icon">🌿</span>';
                  }
                }}
              />
            </div>

            <div className="navbar__brand-info">
              <div className="navbar__brand-title">
                <span className="navbar__brand-title-main">CHIANG MAI</span>
                <span className="navbar__brand-title-sub">WELLNESS</span>
              </div>
              <span className="navbar__brand-desc">
                ระบบสารสนเทศเส้นทางสุขภาพเชียงใหม่
              </span>
            </div>
          </Link>
        </div>

        {/* 🌟 3. เมนูนำทาง (Desktop Nav แถวเดียว สวยงาม สะอาดตา) */}
        <nav
          className={`navbar__nav ${isMenuOpen ? "navbar__nav--open" : ""}`}
          aria-label="เมนูหลัก"
        >
          <div className="navbar__menu-links">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `navbar__link ${isActive ? "navbar__link--active" : ""}`
                }
                onClick={closeMenu}
              >
                <span className="navbar__link-text">{item.label}</span>
              </NavLink>
            ))}
          </div>

          {/* ปุ่ม Login ฝั่งผู้ประกอบการ */}
          <div className="navbar__actions">
            <Link
              to="/provider/login"
              className="navbar__cta-btn"
              onClick={closeMenu}
            >
              <FontAwesomeIcon
                icon={faRightToBracket}
                className="navbar__cta-icon"
              />
              <span>เข้าสู่ระบบสถานบริการ</span>
            </Link>
          </div>
        </nav>

        {/* 🌟 3. ปุ่ม Hamburger Toggle (สำหรับ Mobile / Tablet) */}
        <button
          type="button"
          className={`navbar__toggle-btn ${
            isMenuOpen ? "navbar__toggle-btn--active" : ""
          }`}
          aria-label={isMenuOpen ? "ปิดเมนู" : "เปิดเมนู"}
          aria-expanded={isMenuOpen}
          onClick={toggleMenu}
        >
          <span className="navbar__toggle-bar navbar__toggle-bar--1" />
          <span className="navbar__toggle-bar navbar__toggle-bar--2" />
          <span className="navbar__toggle-bar navbar__toggle-bar--3" />
        </button>
      </div>

      {/* Backdrop overlay on mobile open */}
      {isMenuOpen && (
        <div
          className="navbar__mobile-backdrop"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
    </header>
  );
}

export default Navbar;
