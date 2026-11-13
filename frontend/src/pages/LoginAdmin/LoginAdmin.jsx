import React, { useState, useEffect } from "react";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./LoginAdmin.css";
import { prefetchAdminData } from "../../utils/adminPrefetcher";
import { withBase } from "../../utils/basePath";

function LoginAdmin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const timeoutMsg = sessionStorage.getItem("session_timeout_message");
    if (timeoutMsg) {
      setError(timeoutMsg);
      sessionStorage.removeItem("session_timeout_message");
    }
  }, []);

  // นิยามกฎสำหรับตรวจสอบเงื่อนไข (Regex)
  // ชื่อผู้ใช้ (adminId): ภาษาอังกฤษหรือตัวเลขเท่านั้น ห้ามช่องว่าง ห้ามเป็นค่าว่าง บังคับยาว 6-10 ตัวอักษร
  const usernameRegex = /^[a-zA-Z0-9]{6,10}$/;
  // รหัสผ่าน (password): ภาษาอังกฤษหรือตัวเลขเท่านั้น ห้ามช่องว่าง ห้ามเป็นค่าว่าง บังคับยาว 1-8 ตัวอักษร
  const passwordRegex = /^[a-zA-Z0-9]{1,8}$/;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    // 1. ตรวจสอบเงื่อนไข Script Validation ก่อนส่งไปหลังบ้าน
    if (!username.trim()) {
      setError("กรุณาระบุรหัสผู้ใช้งาน (Admin ID)");
      return;
    }
    if (!password) {
      setError("กรุณาระบุรหัสผ่าน (Password)");
      return;
    }
    if (!usernameRegex.test(username) || !passwordRegex.test(password)) {
      setError("รหัสผู้ใช้งานหรือรหัสผ่านไม่ถูกต้องตามรูปแบบ (Admin ID 6–10 ตัวอักษร, Password 1–8 ตัวอักษร)");
      return;
    }

    try {
      const response = await axios.post(
        "/api/admin/login",
        {
          username: username,
          password: password,
        },
        {
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        const loggedInUsername = response.data?.data?.username || response.data?.username || username;
        localStorage.setItem("username", loggedInUsername);
        localStorage.setItem("adminName", loggedInUsername);
        localStorage.setItem(
          "adminUser",
          JSON.stringify({ username: loggedInUsername, role: "ADMIN" })
        );
        localStorage.setItem("showWelcome", "true");
        prefetchAdminData();
        navigate("/listAccountRequest");
      }
    } catch (err) {
      // 2. แยก Error ตาม HTTP Status Code และ Network Error
      if (err.response) {
        const status = err.response.status;
        const msg = err.response.data?.message;

        if (status === 400) {
          setError(msg || "ข้อมูลไม่ถูกต้อง");
        } else if (status === 401) {
          setError(msg || "ไม่พบข้อมูลผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
        } else if (status === 500) {
          setError(msg || "เกิดข้อผิดพลาดจากระบบ กรุณาลองใหม่อีกครั้ง");
        } else {
          setError(msg || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
        }
      } else {
        setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
      }
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-container">
        <div className="login-card">
          <div className="admin-logo-text">ADMIN LOGIN</div>
          <p className="subtitle">Chiang Mai Wellness</p>

          {/* ส่วนแสดงข้อความแจ้งเตือน Error */}
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Admin ID</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder="ระบุรหัสผู้ใช้งาน (6-10 ตัวอักษร)"
                  value={username}
                  maxLength={10}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
            <div className="input-group">
              <label>Password</label>
              <div className="input-wrapper input-wrapper--password">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="ระบุรหัสผ่าน (ไม่เกิน 8 ตัวอักษร)"
                  value={password}
                  maxLength={8}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-admin-login">
              เข้าสู่ระบบจัดการข้อมูล
            </button>
          </form>
          <div className="footer-links">
            <a href={withBase("/")} className="back-link">
              กลับสู่หน้าหลัก
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginAdmin;
