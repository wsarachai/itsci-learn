import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  CircleAlert,
  MapPin,
  Newspaper,
  RefreshCw,
  Route as RouteIcon,
  Search,
  X,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import LoadingState from "../../Components/LoadingState/LoadingState";
import "./SearchResults.css";

const API_BASE_URL = "/api";

const SEARCH_TYPES = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "WELLNESS_HUB", label: "สถานประกอบการ" },
  { value: "ROUTE", label: "เส้นทางท่องเที่ยว" },
  { value: "ARTICLE", label: "บทความสุขภาพ" },
];

const ALLOWED_TYPES = SEARCH_TYPES.map((type) => type.value);



function removeHtml(value = "") {
  return String(value)
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    "ไม่สามารถค้นหาข้อมูลได้ กรุณาลองใหม่อีกครั้ง"
  );
}

// 🖼️ ฟังก์ชันแปลงและดึง URL รูปภาพให้สมบูรณ์ (รองรับ Base64, URL ตรง, JSON array, และชื่อไฟล์ uploads)
function normalizeImageSource(imageValue, defaultFolder = "hubs") {
  if (!imageValue) return "";

  let normalized = imageValue;

  if (typeof normalized === "string") {
    const trimmed = normalized.trim();
    try {
      const parsed = JSON.parse(trimmed);
      normalized = Array.isArray(parsed) ? parsed[0] || "" : trimmed;
    } catch {
      normalized = trimmed;
    }
  }

  if (Array.isArray(normalized)) {
    normalized = normalized[0] || "";
  }

  if (!normalized || typeof normalized !== "string") return "";

  const src = normalized.trim();
  if (!src) return "";

  if (
    src.startsWith("data:image/") ||
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("blob:")
  ) {
    return src;
  }

  if (/^[A-Za-z0-9+/=\s]+$/.test(src) && src.length > 100) {
    return `data:image/jpeg;base64,${src}`;
  }

  if (src.startsWith("/uploads/")) {
    return `${src}`;
  }

  if (!src.includes("/") && !src.includes("\\")) {
    return `/uploads/${defaultFolder}/${src}`;
  }

  return src;
}

export default function SearchResults() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const queryKeyword = searchParams.get("q") || "";
  const queryType = searchParams.get("type") || "ALL";

  const normalizedType = ALLOWED_TYPES.includes(queryType.toUpperCase())
    ? queryType.toUpperCase()
    : "ALL";

  const [keyword, setKeyword] = useState(queryKeyword);
  const [searchType, setSearchType] = useState(normalizedType);

  const [searchData, setSearchData] = useState(null);
  const [loading, setLoading] = useState(Boolean(queryKeyword.trim()));
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");

  const loadSearchResults = useCallback(
    async () => {
      const normalizedKeyword = queryKeyword.trim();

      if (!normalizedKeyword) {
        setSearchData(null);
        setError("กรุณากรอกคำค้นหา");
        setLoading(false);
        return;
      }

      if (normalizedKeyword.length > 100) {
        setSearchData(null);
        setError("คำค้นหาต้องไม่เกิน 100 ตัวอักษร");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await axios.get(`${API_BASE_URL}/home/search`, {
          params: {
            q: normalizedKeyword,
            type: normalizedType,
          },
          timeout: 30000,
        });

        const result = response.data || null;
        setSearchData(result);
      } catch (requestError) {
        setSearchData(null);
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    },
    [queryKeyword, normalizedType],
  );

  useEffect(() => {
    setKeyword(queryKeyword);
    setSearchType(normalizedType);
    setValidationError("");
    loadSearchResults();
  }, [queryKeyword, normalizedType, loadSearchResults]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [queryKeyword, normalizedType]);

  const routes = useMemo(
    () => (Array.isArray(searchData?.routes) ? searchData.routes : []),
    [searchData],
  );

  const wellnessHubs = useMemo(
    () =>
      Array.isArray(searchData?.wellnessHubs) ? searchData.wellnessHubs : [],
    [searchData],
  );

  const articles = useMemo(
    () => (Array.isArray(searchData?.articles) ? searchData.articles : []),
    [searchData],
  );

  const handleSubmit = (event) => {
    event.preventDefault();

    const normalizedKeyword = keyword.trim();

    if (!normalizedKeyword) {
      setValidationError("กรุณากรอกคำค้นหา");
      return;
    }

    if (normalizedKeyword.length > 100) {
      setValidationError("คำค้นหาต้องไม่เกิน 100 ตัวอักษร");
      return;
    }

    setValidationError("");

    navigate(
      `/search?q=${encodeURIComponent(
        normalizedKeyword,
      )}&type=${encodeURIComponent(searchType)}`,
    );
  };

  if (loading) {
    return (
      <LoadingState
        fullPage
        title="กำลังค้นหาข้อมูล"
        message="ระบบกำลังค้นหาเส้นทาง สถานประกอบการ และบทความที่เกี่ยวข้อง กรุณารอสักครู่"
      />
    );
  }

  return (
    <main className="search-results-page">
      {/* 🟢 HERO SECTION */}
      <header className="search-results-hero">
        <div className="search-results-container">
          <Link to="/" className="search-results-back">
            <ArrowLeft className="search-back-icon" />
            <span>กลับหน้าแรก</span>
          </Link>

          <p className="search-results-eyebrow">CHIANG MAI WELLNESS DIRECTORY</p>

          <h1>ผลการค้นหา</h1>

          {queryKeyword && (
            <p className="search-results-hero__description">
              ผลลัพธ์การค้นหาสำหรับ <strong>“{queryKeyword}”</strong>
            </p>
          )}

          {/* 🔍 FLOATING SEARCH FORM */}
          <form
            className="search-results-form"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="search-select-wrapper">
              <select
                value={searchType}
                onChange={(event) => setSearchType(event.target.value)}
                aria-label="ประเภทการค้นหา"
                className="search-results-select"
              >
                {SEARCH_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="search-results-form__input">
              <Search className="search-input-icon" />
              <input
                type="text"
                value={keyword}
                maxLength={100}
                placeholder="ค้นหาเส้นทาง สถานประกอบการ หรือบทความ..."
                onChange={(event) => {
                  setKeyword(event.target.value);
                  if (validationError) {
                    setValidationError("");
                  }
                }}
                aria-invalid={Boolean(validationError)}
              />
              {keyword && (
                <button
                  type="button"
                  className="search-input-clear"
                  onClick={() => setKeyword("")}
                  title="ล้างคำค้นหา"
                >
                  <X />
                </button>
              )}
            </div>

            <button type="submit" className="search-results-btn">
              <Search />
              <span>ค้นหา</span>
            </button>
          </form>

          {validationError && (
            <p className="search-results-validation" role="alert">
              {validationError}
            </p>
          )}
        </div>
      </header>

      {/* 🔵 CONTENT SECTION */}
      <div className="search-results-container search-results-content">
        {error && (
          <section className="search-results-state search-results-state--error">
            <CircleAlert className="state-icon-error" />
            <h2>ไม่สามารถค้นหาข้อมูลได้</h2>
            <p>{error}</p>
            <button type="button" onClick={() => loadSearchResults(true)}>
              <RefreshCw />
              <span>ลองใหม่อีกครั้ง</span>
            </button>
          </section>
        )}

        {!error && searchData && (
          <>
            {/* 📊 SUMMARY CARDS */}
            <section className="search-results-summary">
              <article className="summary-card total">
                <div className="summary-card__icon-badge">
                  <Search />
                </div>
                <div className="summary-card__text">
                  <strong>{searchData.totalResults || 0}</strong>
                  <span>ผลลัพธ์ทั้งหมด</span>
                </div>
              </article>

              <article className="summary-card route">
                <div className="summary-card__icon-badge">
                  <RouteIcon />
                </div>
                <div className="summary-card__text">
                  <strong>{searchData.routeCount || 0}</strong>
                  <span>เส้นทางท่องเที่ยว</span>
                </div>
              </article>

              <article className="summary-card place">
                <div className="summary-card__icon-badge">
                  <Building2 />
                </div>
                <div className="summary-card__text">
                  <strong>{searchData.wellnessHubCount || 0}</strong>
                  <span>สถานประกอบการ</span>
                </div>
              </article>

              <article className="summary-card article">
                <div className="summary-card__icon-badge">
                  <Newspaper />
                </div>
                <div className="summary-card__text">
                  <strong>{searchData.articleCount || 0}</strong>
                  <span>บทความสุขภาพ</span>
                </div>
              </article>
            </section>

            {searchData.totalResults === 0 ? (
              <section className="search-results-state search-results-state--empty">
                <div className="empty-icon-box">
                  <Search />
                </div>
                <h2>
                  {searchType === "WELLNESS_HUB"
                    ? "ไม่พบสถานประกอบการ"
                    : "ไม่พบผลลัพธ์การค้นหา"}
                </h2>
                <p>
                  {searchType === "WELLNESS_HUB"
                    ? "ไม่พบข้อมูลที่ตรงกับคำค้นหา กรุณาตรวจสอบตัวสะกดอีกครั้ง"
                    : "ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่นเพื่อค้นหาใหม่"}
                </p>
              </section>
            ) : (
              <>
                {/* 🟢 1. WELLNESS ROUTES SECTION */}
                {routes.length > 0 && (
                  <section className="search-results-section">
                    <div className="search-results-heading">
                      <div className="heading-title-group">
                        <p className="section-eyebrow">RECOMMENDED ROUTES</p>
                        <h2>เส้นทางท่องเที่ยว ({routes.length})</h2>
                      </div>
                    </div>

                    <div className="search-results-grid">
                      {routes.map((route) => {
                        const rawRouteImage =
                          route.routeImage ||
                          route.img ||
                          route.image ||
                          route.coverImage;
                        const routeImg = normalizeImageSource(
                          rawRouteImage,
                          "routes",
                        );

                        return (
                          <article
                            key={route.routeId}
                            className="search-result-card"
                          >
                            <div className="search-result-card__cover search-result-card__cover--route">
                              {routeImg ? (
                                <img
                                  src={routeImg}
                                  alt={route.routeName}
                                  onError={(event) => {
                                    event.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="card-cover-fallback">
                                  <RouteIcon />
                                </div>
                              )}
                              <span className="route-pin-badge">
                                <MapPin /> {route.pinCount || 0} จุดแนะนำ
                              </span>
                            </div>

                            <div className="search-result-card__body">
                              <p className="search-result-card__category route-tag">
                                WELLNESS ROUTE
                              </p>

                              <h3>{route.routeName}</h3>

                              {route.routeDescription && (
                                <p className="search-result-card__description">
                                  {route.routeDescription}
                                </p>
                              )}

                              {route.districtsPassed && (
                                <p className="search-result-card__meta">
                                  <MapPin />
                                  <span>{route.districtsPassed}</span>
                                </p>
                              )}

                              <Link
                                to={`/wellness-routes/${route.routeId}`}
                                className="search-result-card__link"
                              >
                                <span>ดูรายละเอียดเส้นทาง</span>
                                <ArrowRight />
                              </Link>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* 🔵 2. WELLNESS HUBS SECTION (ดึงรูปปกสถานประกอบการจาก DB) */}
                {wellnessHubs.length > 0 && (
                  <section className="search-results-section">
                    <div className="search-results-heading">
                      <div className="heading-title-group">
                        <p className="section-eyebrow">WELLNESS PLACES</p>
                        <h2>สถานประกอบการ ({wellnessHubs.length})</h2>
                      </div>
                    </div>

                    <div className="search-results-grid">
                      {wellnessHubs.map((hub) => {
                        // 🖼️ ดึงรูปปกสถานประกอบการจากฐานข้อมูล (รองรับทุกชื่อฟิลด์: wellnessHubImg, img, wellnessHubImages, wellnessHubGallery)
                        const rawHubImage =
                          hub.wellnessHubImg ||
                          hub.img ||
                          hub.wellnessHubImages ||
                          hub.wellnessHubGallery ||
                          hub.coverImage ||
                          hub.image;

                        const hubImg = normalizeImageSource(rawHubImage, "hubs");

                        return (
                          <article
                            key={hub.licenseId || hub.wellnessHubName}
                            className="search-result-card"
                          >
                            <div className="search-result-card__cover search-result-card__cover--hub">
                              {hubImg ? (
                                <img
                                  src={hubImg}
                                  alt={hub.wellnessHubName}
                                  onError={(event) => {
                                    event.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="card-cover-fallback hub-fallback">
                                  <Building2 />
                                </div>
                              )}
                            </div>

                            <div className="search-result-card__body">
                              <p className="search-result-card__category hub-tag">
                                {hub.categoryName || "สถานประกอบการ"}
                              </p>

                              <h3>{hub.wellnessHubName}</h3>

                              {hub.wellnessHubDescription && (
                                <p className="search-result-card__description">
                                  {hub.wellnessHubDescription}
                                </p>
                              )}

                              {hub.districtName && (
                                <p className="search-result-card__meta">
                                  <MapPin />
                                  <span>อ. {hub.districtName}</span>
                                </p>
                              )}

                              <Link
                                to={`/wellness-hubs/${hub.licenseId}`}
                                className="search-result-card__link"
                              >
                                <span>ดูรายละเอียดสถานประกอบการ</span>
                                <ArrowRight />
                              </Link>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* 🔴 3. ARTICLES SECTION */}
                {articles.length > 0 && (
                  <section className="search-results-section">
                    <div className="search-results-heading">
                      <div className="heading-title-group">
                        <p className="section-eyebrow">HEALTH STORIES</p>
                        <h2>บทความสุขภาพ ({articles.length})</h2>
                      </div>
                    </div>

                    <div className="search-results-grid">
                      {articles.map((article) => {
                        const articleDescription = removeHtml(
                          article.articleDetail || "",
                        );
                        const publishedDate = formatDate(article.publishDate);
                        const rawArticleImage =
                          article.img ||
                          article.articleImages ||
                          article.coverImage ||
                          article.image;

                        const articleImg = normalizeImageSource(
                          rawArticleImage,
                          "articles",
                        );

                        return (
                          <article
                            key={article.articleId}
                            className="search-result-card"
                          >
                            <div className="search-result-card__cover search-result-card__cover--article">
                              {articleImg ? (
                                <img
                                  src={articleImg}
                                  alt={article.articleTitle}
                                  onError={(event) => {
                                    event.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="card-cover-fallback article-fallback">
                                  <Newspaper />
                                </div>
                              )}
                            </div>

                            <div className="search-result-card__body">
                              <p className="search-result-card__category article-tag">
                                {article.articleCategory || "บทความสุขภาพ"}
                              </p>

                              <h3>{article.articleTitle}</h3>

                              {articleDescription && (
                                <p className="search-result-card__description">
                                  {articleDescription}
                                </p>
                              )}

                              {publishedDate && (
                                <p className="search-result-card__meta">
                                  <CalendarDays />
                                  <span>{publishedDate}</span>
                                </p>
                              )}

                              <Link
                                to={`/articles/${article.articleId}`}
                                className="search-result-card__link"
                              >
                                <span>อ่านบทความ</span>
                                <ArrowRight />
                              </Link>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                )}
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}