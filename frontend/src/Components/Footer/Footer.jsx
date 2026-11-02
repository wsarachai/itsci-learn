// src/Components/Footer/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPhoneVolume,
  faHospital,
  faLocationDot,
  faShieldHalved,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
// โลโก้หน่วยงานร่วมพัฒนา
import cmuLogo from "../../assets/logo/cmulogo.jpg";
import itLogo from "../../assets/logo/it.jpg";
import mophLogo from "../../assets/logo/moph.jpg";
import ctrdLogo from "../../assets/logo/ctrd.jpg";
import cbtLogo from "../../assets/logo/cbt.jpg";
import "./Footer.css";

// 🌟 โลโก้หลัก Chiang Mai Wellness Route จากโฟลเดอร์ uploads
const MAIN_LOGO_URL = "/uploads/logo/เชียงใหม่ เส้นทางแห่งสุขภาพ.png";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer" aria-label="ส่วนท้ายเว็บไซต์">
      {/* 🌿 เส้น Accent สีเวลเนสไล่เฉด */}
      <div className="footer__top-accent" />

      <div className="footer__container">
        {/* 🌟 1. Main Grid Layout 4 คอลัมน์ ครบถ้วน มีประโยชน์ */}
        <div className="footer__main">
          {/* คอลัมน์ที่ 1: ข้อมูลแบรนด์และวิสัยทัศน์ */}
          <div className="footer__brand-col">
            <div className="footer__brand-logo">
              <div className="footer__brand-logo-wrap">
                <img
                  src={MAIN_LOGO_URL}
                  alt="Chiang Mai Wellness Route"
                  className="footer__brand-logo-img"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.innerHTML = '<span class="footer__brand-fallback-icon">🌿</span>';
                    }
                  }}
                />
              </div>
              <div className="footer__brand-text">
                <span className="footer__brand-title">CHIANG MAI WELLNESS</span>
                <span className="footer__brand-sub">
                  ระบบสารสนเทศเส้นทางสุขภาพเชียงใหม่
                </span>
              </div>
            </div>

            <p className="footer__brand-desc">
              ระบบสารสนเทศภูมิศาสตร์เพื่อการท่องเที่ยวเชิงสุขภาพและการแพทย์ (GIS for Medical & Wellness Tourism)
              ยกระดับมาตรฐานเส้นทางสุขภาพและสถานประกอบการชั้นนำในจังหวัดเชียงใหม่
            </p>

            {/* แถบโลโก้หน่วยงานร่วมพัฒนา */}
            <div className="footer__partners-wrap">
              <span className="footer__partners-label">
                ร่วมพัฒนาโดยมหาวิทยาลัยและหน่วยงานภาครัฐ:
              </span>
              <div className="footer__partners-grid">
                <div className="footer__partner-badge" title="มหาวิทยาลัยเชียงใหม่ (CMU)">
                  <img src={cmuLogo} alt="CMU" />
                </div>
                <div className="footer__partner-badge" title="สำนักบริการเทคโนโลยีสารสนเทศ (IT CMU)">
                  <img src={itLogo} alt="IT CMU" />
                </div>
                <div className="footer__partner-badge" title="กระทรวงสาธารณสุข (MOPH)">
                  <img src={mophLogo} alt="MOPH" />
                </div>
                <div className="footer__partner-badge" title="ศูนย์วิจัยและพัฒนาการท่องเที่ยว (CTRD)">
                  <img src={ctrdLogo} alt="CTRD" />
                </div>
                <div className="footer__partner-badge" title="การท่องเที่ยวโดยชุมชน (CBT)">
                  <img src={cbtLogo} alt="CBT" />
                </div>
              </div>
            </div>
          </div>

          {/* คอลัมน์ที่ 2: เมนูหลัก & ค้นพบสุขภาพ */}
          <div className="footer__col">
            <h4 className="footer__heading">
              <span>สำรวจเส้นทางสุขภาพ</span>
            </h4>
            <ul className="footer__nav-list">
              <li>
                <Link to="/" className="footer__link">
                  หน้าแรก
                </Link>
              </li>
              <li>
                <Link to="/wellness-routes" className="footer__link">
                  เส้นทางท่องเที่ยวสุขภาพทั้งหมด
                </Link>
              </li>
              <li>
                <Link to="/articles" className="footer__link">
                  คลังความรู้และบทความสุขภาพ
                </Link>
              </li>
              <li>
                <Link to="/search" className="footer__link">
                  ค้นหาสถานบริการและจุดแวะ
                </Link>
              </li>
            </ul>
          </div>

          {/* คอลัมน์ที่ 3: สำหรับผู้ประกอบการสถานบริการ */}
          <div className="footer__col">
            <h4 className="footer__heading">
              <span>สถานประกอบการ</span>
            </h4>
            <p className="footer__col-desc">
              ร่วมเป็นส่วนหนึ่งของเครือข่ายเส้นทางสุขภาพเชียงใหม่
            </p>
            <ul className="footer__nav-list">
              <li>
                <Link
                  to="/request-wellness-hub-account"
                  className="footer__action-link"
                >
                  <FontAwesomeIcon icon={faHospital} />
                  <span>ยื่นคำขอขึ้นทะเบียนสถานบริการ</span>
                </Link>
              </li>
              <li>
                <Link to="/track-status" className="footer__link">
                  ติดตามสถานะคำขอขึ้นทะเบียน
                </Link>
              </li>
              <li>
                <Link to="/provider/login" className="footer__link">
                  <FontAwesomeIcon icon={faHospital} className="footer__link-icon" />
                  <span>เข้าสู่ระบบสถานบริการ (Provider)</span>
                </Link>
              </li>
              <li>
                <Link to="/login" className="footer__link">
                  <FontAwesomeIcon icon={faShieldHalved} className="footer__link-icon" />
                  <span>เข้าสู่ระบบผู้ดูแลระบบ (Admin)</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* คอลัมน์ที่ 4: สายด่วนฉุกเฉินและช่วยเหลือ (Hotlines & Assistance) */}
          <div className="footer__col">
            <h4 className="footer__heading">
              <span>สายด่วนช่วยเหลือ</span>
            </h4>
            <div className="footer__hotlines">
              <div className="footer__hotline-card">
                <div className="footer__hotline-icon footer__hotline-icon--med">
                  <FontAwesomeIcon icon={faPhoneVolume} />
                </div>
                <div>
                  <span className="footer__hotline-number">1669</span>
                  <span className="footer__hotline-label">การแพทย์ฉุกเฉิน (EMS)</span>
                </div>
              </div>

              <div className="footer__hotline-card">
                <div className="footer__hotline-icon footer__hotline-icon--tour">
                  <FontAwesomeIcon icon={faLocationDot} />
                </div>
                <div>
                  <span className="footer__hotline-number">1155</span>
                  <span className="footer__hotline-label">ตำรวจท่องเที่ยว (Tourist Police)</span>
                </div>
              </div>
            </div>

            <p className="footer__support-note">
              ศูนย์บริการข้อมูลสุขภาพและการแพทย์ จ.เชียงใหม่ ให้บริการคำปรึกษาและข้อมูลเส้นทางสุขภาพตลอด 24 ชั่วโมง
            </p>
          </div>
        </div>

        {/* 🌟 2. แถบลิขสิทธิ์ด้านล่างสุด */}
        <div className="footer__bottom">
          <p className="footer__copyright">
            © {currentYear} <strong>Chiang Mai Wellness Route</strong> — ระบบสารสนเทศภูมิศาสตร์เส้นทางท่องเที่ยวเชิงสุขภาพและการแพทย์ จังหวัดเชียงใหม่. สงวนลิขสิทธิ์
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
