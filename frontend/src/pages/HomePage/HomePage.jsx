import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Navigation,
  Newspaper,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import heroImage from "../../assets/logo/hero.png";
import "./HomePage.css";

const API_BASE_URL = "/api";

// In-memory Cache ระหว่างการสลับหน้าใน Single Page App
let homeRoutesCache = null;
let homeArticlesCache = null;

const HERO_SLIDES = [
  {
    id: 1,
    title: (
      <>
        เลือกเส้นทางที่ใช่
        <br />
        ออกไปพักใจในเชียงใหม่
      </>
    ),
    description:
      "ค้นหาเส้นทางท่องเที่ยวเชิงสุขภาพที่รวมจุดแวะ กิจกรรม และประสบการณ์น่าสนใจไว้ให้คุณวางแผนการเดินทางได้ง่ายในที่เดียว",
    image: heroImage || "/uploads/logo/hero.png",
    link: "#recommended-routes",
    buttonText: "สำรวจเส้นทางแนะนำ",
  },
];

const SEARCH_TYPES = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "WELLNESS_HUB", label: "สถานประกอบการ" },
  { value: "ROUTE", label: "เส้นทางท่องเที่ยว" },
  { value: "ARTICLE", label: "บทความสุขภาพ" },
];

const ROUTE_CATEGORY_DISPLAY = {
  C01: {
    name: "นวด/สปาเพื่อสุขภาพ",
    color: "#E02873",
    background: "#FDEBF2",
  },
  C02: {
    name: "คลินิก/สถานพยาบาล",
    color: "#004CB4",
    background: "#E7EFF9",
  },
  C03: {
    name: "อาหารและเครื่องดื่ม",
    color: "#0B7D31",
    background: "#EAF5ED",
  },
  C04: {
    name: "ที่พักฟื้นฟูสุขภาพ",
    color: "#5E27AB",
    background: "#F2ECFB",
  },
  C05: {
    name: "สถานที่ท่องเที่ยว",
    color: "#009BB0",
    background: "#E6F8FA",
  },
};

function getRouteCategoryDisplay(category) {
  const categoryId = String(category?.categoryId || "")
    .trim()
    .toUpperCase();

  const display = ROUTE_CATEGORY_DISPLAY[categoryId];

  if (display) {
    return {
      ...display,
      categoryId,
    };
  }

  return {
    categoryId,
    name: category?.categoryName || "หมวดหมู่อื่น",
    color: "#56635B",
    background: "#F1F3F1",
  };
}

function getErrorMessage(error, fallbackMessage) {
  return error.response?.data?.message || fallbackMessage;
}

function formatDate(value) {
  if (!value) {
    return "ไม่ระบุวันที่";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "ไม่ระบุวันที่";
  }

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function normalizeImageSource(value) {
  if (!value) {
    return "";
  }

  let imageValue = value;

  if (typeof imageValue === "string") {
    const trimmedValue = imageValue.trim();

    try {
      const parsedValue = JSON.parse(trimmedValue);

      if (Array.isArray(parsedValue)) {
        imageValue = parsedValue[0] || "";
      } else {
        imageValue = trimmedValue;
      }
    } catch {
      imageValue = trimmedValue;
    }
  }

  if (Array.isArray(imageValue)) {
    imageValue = imageValue[0] || "";
  }

  if (!imageValue) {
    return "";
  }

  const normalizedValue = String(imageValue).trim();

  if (
    normalizedValue.startsWith("data:image/") ||
    normalizedValue.startsWith("http://") ||
    normalizedValue.startsWith("https://") ||
    normalizedValue.startsWith("blob:")
  ) {
    return normalizedValue;
  }

  if (/^[A-Za-z0-9+/=\s]+$/.test(normalizedValue)) {
    return `data:image/jpeg;base64,${normalizedValue}`;
  }

  return normalizedValue;
}

function removeHtml(value = "") {
  return String(value)
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function HomePage() {
  const navigate = useNavigate();

  const [activeSlide, setActiveSlide] = useState(0);
  const [pauseSlider, setPauseSlider] = useState(false);

  const [searchType, setSearchType] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [searchError, setSearchError] = useState("");

  // อ่านค่าจาก Cache ทันทีในจังหวะ Init เพื่อไม่ให้ UI กระตุก/กะพริบ
  const [routes, setRoutes] = useState(() =>
    Array.isArray(homeRoutesCache) ? homeRoutesCache : []
  );
  const [articles, setArticles] = useState(() =>
    Array.isArray(homeArticlesCache) ? homeArticlesCache : []
  );

  const [routesLoading, setRoutesLoading] = useState(
    !Array.isArray(homeRoutesCache)
  );
  const [articlesLoading, setArticlesLoading] = useState(
    !Array.isArray(homeArticlesCache)
  );

  const [routesError, setRoutesError] = useState("");
  const [articlesError, setArticlesError] = useState("");

  const loadRoutes = useCallback(async (signal, forceRefresh = false) => {
    if (Array.isArray(homeRoutesCache) && !forceRefresh) {
      setRoutes(homeRoutesCache);
      setRoutesError("");
      setRoutesLoading(false);
      return;
    }

    setRoutesLoading(true);
    setRoutesError("");

    try {
      const response = await axios.get(
        `${API_BASE_URL}/home/recommended-routes`,
        {
          signal,
          timeout: 30000,
        }
      );

      const routeList = Array.isArray(response.data)
        ? response.data.slice(0, 6)
        : [];

      homeRoutesCache = routeList;
      setRoutes(routeList);
    } catch (error) {
      if (axios.isCancel(error) || signal?.aborted) {
        return;
      }

      console.error("โหลดเส้นทางแนะนำไม่สำเร็จ", error);
      setRoutes([]);

      setRoutesError(
        getErrorMessage(
          error,
          error.code === "ECONNABORTED"
            ? "ระบบใช้เวลาโหลดเส้นทางนานกว่าปกติ กรุณาลองใหม่อีกครั้ง"
            : "ไม่สามารถโหลดเส้นทางแนะนำได้ กรุณาลองใหม่อีกครั้ง"
        )
      );
    } finally {
      if (!signal?.aborted) {
        setRoutesLoading(false);
      }
    }
  }, []);

  const loadArticles = useCallback(async (signal, forceRefresh = false) => {
    if (Array.isArray(homeArticlesCache) && !forceRefresh) {
      setArticles(homeArticlesCache);
      setArticlesError("");
      setArticlesLoading(false);
      return;
    }

    setArticlesLoading(true);
    setArticlesError("");

    try {
      const response = await axios.get(
        `${API_BASE_URL}/home/latest-articles`,
        {
          signal,
          timeout: 30000,
        }
      );

      const articleList = Array.isArray(response.data)
        ? response.data.slice(0, 6)
        : [];

      homeArticlesCache = articleList;
      setArticles(articleList);
    } catch (error) {
      if (axios.isCancel(error) || signal?.aborted) {
        return;
      }

      console.error("โหลดบทความล่าสุดไม่สำเร็จ", error);
      setArticles([]);

      setArticlesError(
        getErrorMessage(
          error,
          error.code === "ECONNABORTED"
            ? "ระบบใช้เวลาโหลดบทความนานกว่าปกติ กรุณาลองใหม่อีกครั้ง"
            : "ไม่สามารถโหลดบทความล่าสุดได้ กรุณาลองใหม่อีกครั้ง"
        )
      );
    } finally {
      if (!signal?.aborted) {
        setArticlesLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    loadRoutes(controller.signal);
    loadArticles(controller.signal);

    return () => controller.abort();
  }, [loadRoutes, loadArticles]);

  useEffect(() => {
    if (pauseSlider) {
      return undefined;
    }

    const sliderTimer = window.setInterval(() => {
      setActiveSlide((currentSlide) => (currentSlide + 1) % HERO_SLIDES.length);
    }, 6000);

    return () => window.clearInterval(sliderTimer);
  }, [pauseSlider]);

  const handleSearch = (event) => {
    event.preventDefault();

    const normalizedKeyword = keyword.trim();

    if (!normalizedKeyword) {
      setSearchError("กรุณากรอกคำค้นหาก่อนกดค้นหา");
      return;
    }

    if (normalizedKeyword.length > 100) {
      setSearchError("คำค้นหาต้องไม่เกิน 100 ตัวอักษร");
      return;
    }

    setSearchError("");

    navigate(
      `/search?q=${encodeURIComponent(
        normalizedKeyword
      )}&type=${encodeURIComponent(searchType)}`
    );
  };

  const heroSlide = HERO_SLIDES[0];

  return (
    <div className="homepage">
      {/* Hero + Search */}
      <section
        className="homepage-hero-v2"
        aria-label="แนะนำการท่องเที่ยวเชิงสุขภาพ"
        onMouseEnter={() => setPauseSlider(true)}
        onMouseLeave={() => setPauseSlider(false)}
      >
        <div
          className="homepage-hero-v2__glow homepage-hero-v2__glow--warm"
          aria-hidden="true"
        />
        <div
          className="homepage-hero-v2__glow homepage-hero-v2__glow--lime"
          aria-hidden="true"
        />

        <div className="homepage-container homepage-hero-v2__shell">
          <div className="homepage-hero-v2__grid">
            {/* ฝั่งซ้าย: ข้อมูลและปุ่มแอ็กชัน */}
            <div className="homepage-hero-v2__content-card">
              <h1>{heroSlide.title}</h1>

              <p className="homepage-hero-v2__description">
                {heroSlide.description}
              </p>

              <div className="homepage-hero-v2__actions">
                <a href={heroSlide.link} className="homepage-hero-v2__cta">
                  <span>{heroSlide.buttonText}</span>
                  <ArrowRight aria-hidden="true" />
                </a>
              </div>
            </div>

            {/* ฝั่งขวา: รูปภาพสัดส่วนธรรมชาติ คมชัด ไม่ยืด */}
            <div className="homepage-hero-v2__media-frame">
              <div className="homepage-hero-v2__media">
                <img
                  src={heroSlide.image}
                  alt="เชียงใหม่ เวลเนส รูท"
                  className="homepage-hero-v2__image"
                />

                <div
                  className="homepage-hero-v2__image-overlay"
                  aria-hidden="true"
                />

                <div className="homepage-hero-v2__location">
                  <MapPin aria-hidden="true" />
                  <span>Chiang Mai, Thailand</span>
                </div>
              </div>
            </div>
          </div>

          <div id="home-search" className="homepage-search-v2">
            <div className="homepage-search-v2__intro">
              <span className="homepage-search-v2__icon">
                <Search aria-hidden="true" />
              </span>

              <div>
                <span className="homepage-search-v2__eyebrow">
                  DISCOVER WELLNESS
                </span>
                <h2>ค้นหาสิ่งที่คุณสนใจ</h2>
              </div>
            </div>

            <form
              className="homepage-search-v2__form"
              onSubmit={handleSearch}
              noValidate
            >
              <div className="homepage-search-v2__field homepage-search-v2__field--type">
                <label htmlFor="homepage-search-type">ประเภทข้อมูล</label>

                <select
                  id="homepage-search-type"
                  value={searchType}
                  onChange={(event) => setSearchType(event.target.value)}
                >
                  {SEARCH_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="homepage-search-v2__divider" aria-hidden="true" />

              <div className="homepage-search-v2__field homepage-search-v2__field--keyword">
                <label htmlFor="homepage-search-keyword">คำค้นหา</label>

                <div className="homepage-search-v2__input">
                  <Search aria-hidden="true" />

                  <input
                    id="homepage-search-keyword"
                    type="text"
                    value={keyword}
                    maxLength={100}
                    placeholder="ชื่อสถานที่ เส้นทาง หรือบทความ..."
                    onChange={(event) => {
                      setKeyword(event.target.value);

                      if (searchError) {
                        setSearchError("");
                      }
                    }}
                    aria-invalid={Boolean(searchError)}
                    aria-describedby={
                      searchError ? "homepage-search-error" : undefined
                    }
                  />
                </div>
              </div>

              <button type="submit" className="homepage-search-v2__button">
                <Search aria-hidden="true" />
                <span>ค้นหา</span>
              </button>
            </form>

            {searchError && (
              <p
                id="homepage-search-error"
                className="homepage-search-v2__error"
                role="alert"
              >
                {searchError}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Recommended Routes */}
      <section
        id="recommended-routes"
        className="homepage-section homepage-section--routes"
      >
        <div className="homepage-container">
          <div className="homepage-section__header">
            <div>
              <div className="homepage-section__kicker homepage-section__kicker--ribbon">
                <svg
                  className="homepage-section__kicker-ribbon-icon"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M5 2h14a1 1 0 0 1 1 1v19a1 1 0 0 1-1.6.8L12 17.5l-6.4 5.3A1 1 0 0 1 4 22V3a1 1 0 0 1 1-1z" />
                </svg>
                <span className="homepage-section__kicker-label">
                  Recommended Wellness Routes
                </span>
              </div>

              <h2 className="homepage-section__title">เส้นทางแนะนำ</h2>

              <p className="homepage-section__description">
                เลือกเส้นทางท่องเที่ยวเชิงสุขภาพที่เหมาะกับรูปแบบ
                และความสนใจของคุณ
              </p>
            </div>

            <Link
              to="/wellness-routes"
              className="homepage-section__link homepage-section__link--pill"
            >
              <span>ดูเส้นทางทั้งหมด</span>
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>

          {routesLoading && (
            <div
              className="homepage-route-grid"
              aria-label="กำลังโหลดเส้นทางแนะนำ"
              aria-busy="true"
            >
              {[1, 2, 3].map((item) => (
                <div key={item} className="homepage-route-skeleton">
                  <div className="homepage-route-skeleton__visual" />

                  <div className="homepage-skeleton__content">
                    <div className="homepage-skeleton__line homepage-skeleton__line--label" />
                    <div className="homepage-skeleton__line homepage-skeleton__line--title" />
                    <div className="homepage-skeleton__line" />
                    <div className="homepage-skeleton__line homepage-skeleton__line--short" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!routesLoading && routesError && (
            <div className="homepage-state homepage-state--error" role="alert">
              <p>{routesError}</p>

              <button
                type="button"
                onClick={() => loadRoutes(undefined, true)}
              >
                <RefreshCw />
                ลองใหม่
              </button>
            </div>
          )}

          {!routesLoading && !routesError && routes.length === 0 && (
            <div className="homepage-state">
              <MapPin className="homepage-state__icon" />
              <h3>ยังไม่มีเส้นทางแนะนำ</h3>
              <p>เมื่อผู้ดูแลเพิ่มเส้นทางแล้ว ข้อมูลจะแสดงในส่วนนี้</p>
            </div>
          )}

          {!routesLoading && !routesError && routes.length > 0 && (
            <div className="homepage-route-grid">
              {routes.map((route) => {
                const routeId = route.routeId || route.id;
                const routeName =
                  route.routeName || route.name || "เส้นทางสุขภาพ";
                const routeDescription =
                  route.routeDescription ||
                  route.description ||
                  "ค้นพบประสบการณ์การท่องเที่ยวเชิงสุขภาพในเชียงใหม่";
                const pinCount =
                  route.pinCount ||
                  route.wellnessHubCount ||
                  route.totalPins ||
                  0;
                const routeImage =
                  route.img ||
                  route.image ||
                  route.routeImage ||
                  route.imageUrl ||
                  "";

                const primaryCategory =
                  Array.isArray(route.categories) && route.categories.length > 0
                    ? getRouteCategoryDisplay(route.categories[0])
                    : getRouteCategoryDisplay(null);

                return (
                  <article key={routeId} className="homepage-route-card">
                    <div className="homepage-route-card__visual">
                      {routeImage ? (
                        <img
                          src={routeImage}
                          alt=""
                          className="homepage-route-card__image"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                            event.currentTarget.parentElement?.classList.add(
                              "homepage-route-card__visual--fallback"
                            );
                          }}
                        />
                      ) : (
                        <div
                          className="homepage-route-card__mockup"
                          style={{
                            "--route-color": primaryCategory.color,
                            "--route-background": primaryCategory.background,
                          }}
                          aria-hidden="true"
                        >
                          <span className="homepage-route-card__mockup-circle homepage-route-card__mockup-circle--one" />
                          <span className="homepage-route-card__mockup-circle homepage-route-card__mockup-circle--two" />
                          <div className="homepage-route-card__mockup-icon">
                            <Navigation />
                          </div>
                          <div className="homepage-route-card__mockup-path">
                            <span />
                            <span />
                            <span />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="homepage-route-card__content">
                      <div className="homepage-route-card__heading">
                        <div
                          className="homepage-route-card__heading-icon"
                          style={{
                            backgroundColor: primaryCategory.color,
                          }}
                        >
                          <Navigation aria-hidden="true" />
                        </div>

                        <div>
                          <p
                            className="homepage-route-card__label"
                            style={{
                              color: primaryCategory.color,
                            }}
                          >
                            WELLNESS ROUTE
                          </p>
                          <span className="homepage-route-card__type">
                            เส้นทางท่องเที่ยวเชิงสุขภาพ
                          </span>
                        </div>
                      </div>

                      <h3>{routeName}</h3>

                      <p className="homepage-route-card__description">
                        {routeDescription}
                      </p>

                      {Array.isArray(route.categories) &&
                        route.categories.length > 0 && (
                          <div className="homepage-route-card__category-section">
                            <p className="homepage-route-card__category-title">
                              หมวดหมู่ที่ครอบคลุม
                            </p>

                            <div
                              className="homepage-card__categories"
                              aria-label="หมวดหมู่ของเส้นทาง"
                            >
                              {route.categories
                                .filter((category) => {
                                  const categoryId = String(
                                    category?.categoryId || ""
                                  )
                                    .trim()
                                    .toUpperCase();

                                  return !categoryId.startsWith("EM");
                                })
                                .map((category, index) => {
                                  const categoryDisplay =
                                    getRouteCategoryDisplay(category);

                                  return (
                                    <span
                                      key={`${category.categoryId || "category"
                                        }-${index}`}
                                      className="homepage-card__category-chip"
                                      style={{
                                        color: categoryDisplay.color,
                                        backgroundColor:
                                          categoryDisplay.background,
                                      }}
                                    >
                                      <span
                                        className="homepage-card__category-icon"
                                        style={{
                                          backgroundColor:
                                            categoryDisplay.color,
                                        }}
                                      >
                                        <span />
                                      </span>
                                      {categoryDisplay.name}
                                    </span>
                                  );
                                })}
                            </div>
                          </div>
                        )}

                      {route.districtsPassed && (
                        <div className="homepage-route-card__location">
                          <div
                            className="homepage-route-card__location-icon"
                            style={{
                              backgroundColor: primaryCategory.background,
                              color: primaryCategory.color,
                            }}
                          >
                            <MapPin aria-hidden="true" />
                          </div>

                          <div>
                            <span className="homepage-route-card__location-label">
                              พื้นที่ที่เดินทางผ่าน
                            </span>
                            <span className="homepage-route-card__location-value">
                              {route.districtsPassed}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="homepage-route-card__actions">
                        <Link
                          to={`/wellness-routes/${routeId}`}
                          className="homepage-route-card__link"
                        >
                          <span>ดูรายละเอียดเส้นทาง</span>
                          <ArrowRight />
                        </Link>

                        <div
                          className="homepage-route-card__pin-count"
                          style={{
                            color: primaryCategory.color,
                            backgroundColor: primaryCategory.background,
                          }}
                        >
                          <MapPin />
                          <strong>{pinCount}</strong>
                          <span>จุดแนะนำ</span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Latest Articles */}
      <section
        id="latest-articles"
        className="homepage-section homepage-section--articles"
      >
        <div className="homepage-container">
          <div className="homepage-section__header">
            <div>
              <div className="homepage-section__kicker">
                <span className="homepage-section__kicker-bar" />
                <span className="homepage-section__kicker-label">
                  Wellness Stories & Tips
                </span>
              </div>

              <h2 className="homepage-section__title">บทความสุขภาพล่าสุด</h2>

              <p className="homepage-section__description">
                อ่านเรื่องราว ความรู้ และข้อมูลที่ช่วยให้คุณ
                เตรียมตัวก่อนออกเดินทางได้ดียิ่งขึ้น
              </p>
            </div>

            <Link
              to="/articles"
              className="homepage-section__link homepage-section__link--pill"
            >
              <span>ดูบทความทั้งหมด</span>
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>

          {articlesLoading && (
            <div
              className="homepage-article-grid"
              aria-label="กำลังโหลดบทความล่าสุด"
              aria-busy="true"
            >
              {[1, 2, 3].map((item) => (
                <div key={item} className="homepage-article-skeleton">
                  <div className="homepage-article-skeleton__image" />

                  <div className="homepage-skeleton__content">
                    <div className="homepage-skeleton__line homepage-skeleton__line--label" />
                    <div className="homepage-skeleton__line homepage-skeleton__line--title" />
                    <div className="homepage-skeleton__line" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!articlesLoading && articlesError && (
            <div className="homepage-state homepage-state--error" role="alert">
              <p>{articlesError}</p>

              <button
                type="button"
                onClick={() => loadArticles(undefined, true)}
              >
                <RefreshCw />
                ลองใหม่
              </button>
            </div>
          )}

          {!articlesLoading && !articlesError && articles.length === 0 && (
            <div className="homepage-state">
              <Newspaper className="homepage-state__icon" />
              <h3>ยังไม่มีบทความสุขภาพ</h3>
              <p>เมื่อมีบทความเผยแพร่แล้ว ข้อมูลจะแสดงในส่วนนี้</p>
            </div>
          )}

          {!articlesLoading && !articlesError && articles.length > 0 && (
            <div className="homepage-article-grid">
              {articles.map((article) => {
                const articleId = article.articleId;
                const articleTitle = article.articleTitle || "บทความสุขภาพ";
                const articleDescription = removeHtml(
                  article.articleDetail || ""
                );
                const articleImage = normalizeImageSource(article.img);
                const publishedDate = article.publishDate;

                return (
                  <article key={articleId} className="homepage-article-card">
                    <div className="homepage-article-card__media">
                      <Link
                        to={`/articles/${articleId}`}
                        className="homepage-article-card__image-link"
                        tabIndex="-1"
                        aria-hidden="true"
                      >
                        {articleImage ? (
                          <img
                            src={articleImage}
                            alt=""
                            className="homepage-article-card__image"
                            onError={(event) => {
                              event.currentTarget.classList.add(
                                "homepage-article-card__image-hidden"
                              );
                            }}
                          />
                        ) : (
                          <div className="homepage-article-card__fallback">
                            <Newspaper aria-hidden="true" />
                          </div>
                        )}
                      </Link>

                      <span className="homepage-article-card__floating-badge">
                        {article.articleCategory || "บทความสุขภาพ"}
                      </span>
                    </div>

                    <div className="homepage-article-card__body">
                      <div className="homepage-article-card__date">
                        <CalendarDays aria-hidden="true" />
                        <span>{formatDate(publishedDate)}</span>
                      </div>

                      <h3 className="homepage-article-card__title">
                        <Link
                          to={`/articles/${articleId}`}
                          className="homepage-article-card__title-link"
                        >
                          {articleTitle}
                        </Link>
                      </h3>

                      <p className="homepage-article-card__description">
                        {articleDescription ||
                          "อ่านเรื่องราวและข้อมูลเพื่อการดูแลสุขภาพที่ดี"}
                      </p>

                      <Link
                        to={`/articles/${articleId}`}
                        className="homepage-article-card__action"
                        aria-label={`อ่านบทความ: ${articleTitle}`}
                      >
                        <span>อ่านบทความ</span>
                        <ArrowRight aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}