import { useCallback, useState } from "react";
import axios from "axios";
import {
  Building2,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileSearch2,
  LoaderCircle,
  Search,
  ShieldX,
  User,
} from "lucide-react";
import LoadingState from "../../Components/LoadingState/LoadingState";
import "./TrackAccountRequest.css";

const API_URL = "/api/account-requests/track";

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function normalizeStatus(status) {
  return String(status || "")
    .trim()
    .toUpperCase();
}

function getStatusInformation(status) {
  const normalizedStatus = normalizeStatus(status);

  if (normalizedStatus === "APPROVED") {
    return {
      label: "อนุมัติแล้ว",
      className: "track-request-status track-request-status--approved",
      icon: CheckCircle2,
      description: "คำขอได้รับการอนุมัติแล้ว และสามารถเข้าสู่ระบบผู้ให้บริการได้",
    };
  }

  if (normalizedStatus === "REJECTED") {
    return {
      label: "ไม่อนุมัติ",
      className: "track-request-status track-request-status--rejected",
      icon: ShieldX,
      description: "สามารถตรวจสอบเหตุผล และยื่นคำขอใหม่ได้",
    };
  }

  return {
    label: "รอตรวจสอบ",
    className: "track-request-status track-request-status--pending",
    icon: Clock3,
    description: "คำขอกำลังอยู่ระหว่างการตรวจสอบโดยผู้ดูแลระบบ",
  };
}

function formatProcessedDate(value) {
  if (!hasValue(value)) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getErrorMessage(error) {
  if (error.code === "ECONNABORTED") {
    return "ระบบใช้เวลาตอบสนองนานเกินไป กรุณาลองใหม่อีกครั้ง";
  }

  return (
    error.response?.data?.message ||
    error.response?.data ||
    "ไม่สามารถค้นหาสถานะคำขอได้ กรุณาลองใหม่อีกครั้ง"
  );
}

export default function TrackAccountRequest() {
  const [username, setUsername] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const searchRequests = useCallback(async (searchUsername) => {
    const rawUsername = searchUsername || "";
    const normalizedUsername = rawUsername.trim();

    if (!normalizedUsername) {
      setError("กรุณากรอกชื่อผู้ใช้งาน");
      setResults([]);
      setSearched(false);
      return;
    }

    if (/\s/.test(normalizedUsername)) {
      setError("ชื่อผู้ใช้งานต้องไม่มีช่องว่าง");
      setResults([]);
      setSearched(false);
      return;
    }

    if (normalizedUsername.length < 4 || normalizedUsername.length > 20) {
      setError("ชื่อผู้ใช้งานต้องมีความยาว 4–20 ตัวอักษร");
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const response = await axios.get(API_URL, {
        params: {
          username: normalizedUsername,
        },
        timeout: 30000,
      });

      setResults(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setResults([]);
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    searchRequests(username);
  };

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);

    if (error) {
      setError("");
    }
  };

  return (
    <main className="track-request-page">
      <header className="track-request-hero">
        <div className="track-request-container">
          <p className="track-request-eyebrow">CHIANG MAI WELLNESS</p>

          <h1>ติดตามสถานะคำขอ</h1>

          <p className="track-request-hero__description">
            ตรวจสอบผลการพิจารณาคำขอเปิดบัญชีสถานประกอบการด้วยชื่อผู้ใช้ (Username)
          </p>
        </div>
      </header>

      <div className="track-request-container track-request-content">
        <section className="track-request-search-section">
          <div className="track-request-search-heading">
            <div className="track-request-search-heading__icon">
              <FileSearch2 />
            </div>

            <div>
              <h2>ค้นหาสถานะคำขอด้วยชื่อผู้ใช้</h2>

              <p>ระบุชื่อผู้ใช้ (Username) ที่ใช้ลงทะเบียนยื่นคำขอ (ความยาว 4–20 ตัวอักษร)</p>
            </div>
          </div>

          <form
            className="track-request-search-form"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="track-request-search-input">
              <User className="track-request-search-input-icon" />

              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="ระบุชื่อผู้ใช้ (Username) เช่น wellnesshub01"
                aria-label="ระบุชื่อผู้ใช้งาน (Username)"
                autoComplete="off"
                maxLength={20}
              />

              <span className="track-request-search-char-count">
                {username.length}/20
              </span>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <LoaderCircle className="track-request-button-spinner" />
                  กำลังค้นหา
                </>
              ) : (
                <>
                  <Search />
                  ค้นหาสถานะ
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="track-request-search-error" role="alert">
              <CircleAlert />

              <span>{error}</span>
            </div>
          )}
        </section>

        {loading && (
          <LoadingState
            title="กำลังตรวจสอบสถานะคำขอ"
            message="ระบบกำลังค้นหาคำขอที่ตรงกับ Username กรุณารอสักครู่"
          />
        )}

        {!loading && searched && !error && results.length === 0 && (
          <section className="track-request-state track-request-state--empty">
            <div className="track-request-state__icon">
              <FileSearch2 />
            </div>

            <h2>ไม่พบข้อมูลคำขอของท่านในระบบ</h2>

            <p>
              ไม่พบข้อมูลคำขอของท่านในระบบสำหรับชื่อผู้ใช้ <strong>“{username.trim()}”</strong>
              <br />
              กรุณาตรวจสอบความถูกต้องของชื่อผู้ใช้งาน (Username) อีกครั้ง
            </p>
          </section>
        )}

        {!loading && results.length > 0 && (
          <section className="track-request-results">
            <div className="track-request-results__heading">
              <div>
                <p>ผลการตรวจสอบ</p>

                <h2>สถานะคำขอเปิดใช้งานบัญชี</h2>

                <span>
                  พบ {results.length} รายการสำหรับ Username “{username.trim()}”
                </span>
              </div>

              <div className="track-request-results__count">
                <strong>{results.length}</strong>

                <span>รายการ</span>
              </div>
            </div>

            <div className="track-request-table-wrapper">
              <table className="track-request-table">
                <thead>
                  <tr>
                    <th>ชื่อผู้ใช้งาน (Username)</th>
                    <th>สถานประกอบการ</th>
                    <th>สถานะ</th>
                    <th>รายละเอียด / การดำเนินการ</th>
                  </tr>
                </thead>

                <tbody>
                  {results.map((request) => {
                    const statusInformation = getStatusInformation(
                      request.requestStatus,
                    );

                    const StatusIcon = statusInformation.icon;

                    return (
                      <tr key={request.requestId}>
                        <td
                          data-label="Username"
                          className="track-request-table__license"
                        >
                          <div className="track-request-table__username-box">
                            <User size={16} />
                            <strong>{request.username || "-"}</strong>
                          </div>
                        </td>

                        <td data-label="สถานประกอบการ">
                          <div className="track-request-table__hub">
                            <div className="track-request-table__hub-icon">
                              <Building2 />
                            </div>

                            <div>
                              <strong>{request.wellnessHubName || "-"}</strong>
                              {hasValue(request.licenseId) && (
                                <span className="track-request-hub-license">
                                  เลขที่ใบอนุญาต: {request.licenseId}
                                </span>
                              )}
                              {hasValue(request.userEmail) && (
                                <span className="track-request-hub-email">
                                  อีเมล: {request.userEmail}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td data-label="สถานะ">
                          <div className={statusInformation.className}>
                            <StatusIcon />

                            <span>{statusInformation.label}</span>
                          </div>
                        </td>

                        <td data-label="รายละเอียด">
                          <div className="track-request-detail">
                            <p>{statusInformation.description}</p>

                            {normalizeStatus(request.requestStatus) ===
                              "REJECTED" &&
                              hasValue(request.rejectionReason) && (
                                <div className="track-request-rejection-reason">
                                  <strong>เหตุผลที่ไม่อนุมัติ:</strong>{" "}
                                  {request.rejectionReason}
                                </div>
                              )}

                            {hasValue(request.processedDate) && (
                              <span className="track-request-processed-time">
                                วันที่ดำเนินการ:{" "}
                                {formatProcessedDate(request.processedDate)}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <aside className="track-request-note">
          <CircleAlert />

          <div>
            <h3>หลังจากคำขอได้รับการอนุมัติ</h3>

            <p>
              ท่านสามารถใช้ <strong>Username</strong> และรหัสผ่านที่ตั้งไว้ขณะยื่นคำขอ
              เข้าสู่ระบบในส่วนของ <strong>"เข้าสู่ระบบสถานบริการ"</strong> ได้ทันที
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
