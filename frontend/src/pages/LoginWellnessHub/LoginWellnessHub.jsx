import React, { useEffect, useState } from "react";
import axios from "axios";

import {
  ArrowLeft,
  Building2,
  CircleAlert,
  Eye,
  EyeOff,
  KeyRound,
  Leaf,
  LoaderCircle,
  LogIn,
  ShieldCheck,
  UserPlus,
  UserRound,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import "./LoginWellnessHub.css";

const LOGIN_API_URL = "/api/wellness-hub-auth/login";

function getErrorMessage(error) {
  if (error.code === "ECONNABORTED") {
    return "ระบบใช้เวลาตอบสนองนานเกินไป กรุณาลองใหม่อีกครั้ง";
  }

  if (typeof error.response?.data === "string") {
    return error.response.data;
  }

  return (
    error.response?.data?.message ||
    "ไม่สามารถเข้าสู่ระบบได้ กรุณาตรวจสอบข้อมูลอีกครั้ง"
  );
}

export default function LoginWellnessHub() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /*
   * หากมีข้อมูลผู้ประกอบการที่เข้าสู่ระบบอยู่แล้ว
   * ให้ไปหน้า Dashboard โดยไม่ต้อง Login ซ้ำ
   */
  useEffect(() => {
    const savedProvider = localStorage.getItem("wellnessProvider");

    if (!savedProvider) {
      return;
    }

    try {
      const provider = JSON.parse(savedProvider);

      if (
        provider?.licenseId &&
        String(provider?.status || "").toUpperCase() === "ACTIVE"
      ) {
        navigate("/provider/dashboard", {
          replace: true,
        });
      }
    } catch (error) {
      localStorage.removeItem("wellnessProvider");
    }
  }, [navigate]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setErrors((previousErrors) => ({
      ...previousErrors,
      [name]: "",
      submit: "",
    }));
  };

  const validateForm = () => {
    const validationErrors = {};

    const username = formData.username.trim();
    const password = formData.password;

    const isUsernameValid =
      Boolean(username) &&
      !/\s/.test(formData.username) &&
      username.length >= 4 &&
      username.length <= 20;

    const isPasswordValid =
      Boolean(password) &&
      !/\s/.test(password) &&
      password.length === 8;

    if (!isUsernameValid || !isPasswordValid) {
      if (!username) {
        validationErrors.username = "กรุณากรอกชื่อผู้ใช้";
      } else if (/\s/.test(formData.username)) {
        validationErrors.username = "ชื่อผู้ใช้ต้องไม่มีช่องว่าง";
      } else if (username.length < 4 || username.length > 20) {
        validationErrors.username =
          "ชื่อผู้ใช้ต้องมีความยาว 4–20 ตัวอักษร";
      }

      if (!password) {
        validationErrors.password = "กรุณากรอกรหัสผ่าน";
      } else if (/\s/.test(password)) {
        validationErrors.password = "รหัสผ่านต้องไม่มีช่องว่าง";
      } else if (password.length !== 8) {
        validationErrors.password = "รหัสผ่านต้องมีความยาว 8 ตัวอักษร";
      }

      validationErrors.submit = "กรุณากรอกข้อมูลให้ถูกต้อง";
    }

    setErrors(validationErrors);

    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting || !validateForm()) {
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const response = await axios.post(
        LOGIN_API_URL,
        {
          username: formData.username.trim(),
          password: formData.password,
        },
        {
          timeout: 30000,
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const provider = response.data;

      if (!provider?.licenseId) {
        throw new Error("ข้อมูลบัญชีผู้ประกอบการไม่สมบูรณ์");
      }

      if (String(provider.status || "").toUpperCase() !== "ACTIVE") {
        throw new Error("บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ");
      }

      /*
       * เก็บเฉพาะข้อมูลที่จำเป็น
       * ห้ามเก็บ Password ลง localStorage
       */
      localStorage.setItem(
        "wellnessProvider",
        JSON.stringify({
          licenseId: provider.licenseId,
          wellnessHubName: provider.wellnessHubName,
          username: provider.username,
          status: provider.status,
          categoryId: provider.categoryId || null,
          categoryName: provider.categoryName || null,
          districtId: provider.districtId || null,
          districtName: provider.districtName || null,
        }),
      );

      localStorage.setItem(
        "wellnessProviderLicenseId",
        String(provider.licenseId),
      );

      localStorage.setItem(
        "wellnessProviderName",
        provider.wellnessHubName || provider.username,
      );

      navigate("/provider/dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error("Provider login error:", error);

      const customMessage =
        error.message === "ข้อมูลบัญชีผู้ประกอบการไม่สมบูรณ์" ||
        error.message === "บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ"
          ? error.message
          : getErrorMessage(error);

      setErrors({
        submit: customMessage,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="provider-login-page">
      <div className="provider-login-shell">
        <section className="provider-login-introduction">
          <Link to="/" className="provider-login-back">
            <ArrowLeft />
            กลับหน้าแรก
          </Link>

          <div className="provider-login-introduction__content">
            <div className="provider-login-brand-row">
              <div className="provider-login-brand-icon">
                <Leaf />
              </div>

              <div>
                <span>CHIANG MAI</span>
                <strong>WELLNESS PROVIDER</strong>
              </div>
            </div>

            <p className="provider-login-eyebrow">PROVIDER PORTAL</p>

            <h1>พื้นที่จัดการสำหรับผู้ประกอบการ</h1>

            <p className="provider-login-introduction__description">
              เข้าสู่ระบบเพื่อจัดการข้อมูลสถานประกอบการ
              และดูแลข้อมูลที่เผยแพร่บนแพลตฟอร์มให้ถูกต้องและเป็นปัจจุบัน
            </p>

            <div className="provider-login-flow">
              <div className="provider-login-flow__item">
                <span>01</span>

                <div>
                  <strong>คำขอได้รับการอนุมัติ</strong>
                  <p>ผู้ดูแลระบบตรวจสอบและอนุมัติคำขอเปิดสิทธิ์ใช้งาน</p>
                </div>
              </div>

              <div className="provider-login-flow__connector" />

              <div className="provider-login-flow__item">
                <span>02</span>

                <div>
                  <strong>เข้าสู่ระบบด้วยบัญชีของคุณ</strong>
                  <p>ใช้ชื่อผู้ใช้และรหัสผ่านที่ตั้งไว้ขณะยื่นคำขอ</p>
                </div>
              </div>

              <div className="provider-login-flow__connector" />

              <div className="provider-login-flow__item">
                <span>03</span>

                <div>
                  <strong>จัดการข้อมูลสถานประกอบการ</strong>
                  <p>แก้ไขข้อมูล รายละเอียด และเวลาทำการได้ทันที</p>
                </div>
              </div>
            </div>

            <div className="provider-login-security-note">
              <ShieldCheck />

              <div>
                <strong>บัญชีผู้ประกอบการได้รับการตรวจสอบสิทธิ์</strong>
                <span>
                  ผู้ใช้งานจะสามารถเข้าถึงเฉพาะข้อมูลสถานประกอบการของตนเอง
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="provider-login-form-section">
          <form
            className="provider-login-form"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="provider-login-form__heading">
              <div>
                <p>WELCOME BACK</p>
                <h2>เข้าสู่ระบบ</h2>
              </div>

              <div className="provider-login-form__heading-icon">
                <UserRound />
              </div>
            </div>

            <p className="provider-login-form__description">
              ใช้ชื่อผู้ใช้และรหัสผ่านที่ท่านได้ลงทะเบียนไว้ตอนยื่นคำขอ
            </p>

            <div className="provider-login-divider">
              <span>ข้อมูลเข้าสู่ระบบ</span>
            </div>

            <div className="provider-login-field">
              <label htmlFor="providerUsername">ชื่อผู้ใช้</label>

              <div
                className={
                  errors.username
                    ? "provider-login-input provider-login-input--error"
                    : "provider-login-input"
                }
              >
                <UserRound />

                <input
                  id="providerUsername"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="กรอกชื่อผู้ใช้"
                  autoComplete="username"
                  maxLength={20}
                  disabled={submitting}
                />
              </div>

              <div className="provider-login-field__support">
                <span>ความยาว 4–20 ตัวอักษร ไม่มีช่องว่าง</span>
              </div>

              {errors.username && (
                <p className="provider-login-field-error">{errors.username}</p>
              )}
            </div>

            <div className="provider-login-field">
              <div className="provider-login-field__heading">
                <label htmlFor="providerPassword">รหัสผ่าน</label>

                <span>8 ตัวอักษร</span>
              </div>

              <div
                className={
                  errors.password
                    ? "provider-login-input provider-login-input--error"
                    : "provider-login-input"
                }
              >
                <KeyRound />

                <input
                  id="providerPassword"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="กรอกรหัสผ่าน"
                  autoComplete="current-password"
                  maxLength={8}
                  disabled={submitting}
                />

                <button
                  type="button"
                  className="provider-login-password-toggle"
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  onClick={() =>
                    setShowPassword((previousValue) => !previousValue)
                  }
                  disabled={submitting}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              {errors.password && (
                <p className="provider-login-field-error">{errors.password}</p>
              )}
            </div>

            {errors.submit && (
              <div className="provider-login-submit-error" role="alert">
                <CircleAlert />

                <span>{errors.submit}</span>
              </div>
            )}

            <button
              type="submit"
              className="provider-login-submit-button"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <LoaderCircle className="provider-login-spinner" />
                  กำลังตรวจสอบข้อมูล...
                </>
              ) : (
                <>
                  เข้าสู่ระบบ
                  <LogIn />
                </>
              )}
            </button>

            <div className="provider-login-account-note">
              <Building2 />

              <div>
                <span>ยังไม่มีบัญชีผู้ประกอบการ?</span>

                <p>
                  ท่านสามารถยื่นคำขอเปิดบัญชีสถานประกอบการใหม่ เพื่อเข้าใช้งานระบบจัดการข้อมูล
                </p>
              </div>
            </div>

            <div className="provider-login-help">
              <Link
                to="/request-wellness-hub-account"
                className="provider-login-help__request"
              >
                <UserPlus size={15} />
                ยื่นคำขอสร้างบัญชีใหม่
              </Link>

              <span className="provider-login-help__separator">•</span>

              <Link to="/track-status">
                ติดตามสถานะคำขอ
              </Link>
            </div>

            <div className="provider-login-admin">
              <span>สำหรับเจ้าหน้าที่ระบบ</span>

              <Link to="/login">เข้าสู่ระบบ Admin</Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}