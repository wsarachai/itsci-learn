import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Filter,
  MapPin,
  Navigation,
  RefreshCw,
  Route,
  Search,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import LoadingState from "../../Components/LoadingState/LoadingState";
import "./RouteList.css";

// API URL สำหรับดึงข้อมูลเส้นทางทั้งหมดสำหรับผู้ใช้
const API_URL = "/api/home/routes";
const ITEMS_PER_PAGE = 9;

const CATEGORY_OPTIONS = [
  { id: "C01", label: "นวดและสปาเพื่อสุขภาพ" },
  { id: "C02", label: "คลินิกและสถานพยาบาล" },
  { id: "C03", label: "อาหารและเครื่องดื่มเพื่อสุขภาพ" },
  { id: "C04", label: "ที่พักเพื่อสุขภาพ" },
  { id: "C05", label: "แหล่งท่องเที่ยวเชิงสุขภาพ" },
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

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function getCategoryStyle(categoryId) {
  return (
    ROUTE_CATEGORY_DISPLAY[categoryId] || {
      name: "",
      color: "#076653",
      background: "#E2FBCE",
    }
  );
}

function getSortedDistricts(route) {
  if (!Array.isArray(route?.districts)) {
    return [];
  }

  return route.districts
    .filter((district) => district && district.districtName)
    .map((district) => ({
      districtId: district.districtId,
      districtName: district.districtName,
    }));
}

function getErrorMessage(error) {
  if (error.code === "ECONNABORTED") {
    return "ระบบใช้เวลาตอบสนองนานเกินไป กรุณาลองใหม่อีกครั้ง";
  }

  return (
    error.response?.data?.message ||
    "ไม่สามารถโหลดรายการเส้นทางได้ กรุณาลองใหม่อีกครั้ง"
  );
}

export default function RouteList() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [sortOption, setSortOption] = useState("LATEST");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const loadRoutes = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(API_URL, {
        timeout: 30000,
      });
      setRoutes(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setRoutes([]);
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [loading]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, selectedCategory, sortOption]);

  const filteredRoutes = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    const result = routes.filter((route) => {
      const categoryIds = Array.isArray(route.categories)
        ? route.categories.map((category) => category.categoryId)
        : [];

      const districtNames = getSortedDistricts(route)
        .map((district) => district.districtName)
        .join(" ");

      const matchesKeyword =
        !normalizedKeyword ||
        String(route.routeName || "")
          .toLowerCase()
          .includes(normalizedKeyword) ||
        String(route.routeDescription || "")
          .toLowerCase()
          .includes(normalizedKeyword) ||
        String(route.districtsPassed || "")
          .toLowerCase()
          .includes(normalizedKeyword) ||
        districtNames.toLowerCase().includes(normalizedKeyword);

      const matchesCategory =
        selectedCategory === "ALL" || categoryIds.includes(selectedCategory);

      return matchesKeyword && matchesCategory;
    });

    return [...result].sort((first, second) => {
      if (sortOption === "NAME_ASC") {
        return String(first.routeName || "").localeCompare(
          String(second.routeName || ""),
          "th",
        );
      }

      if (sortOption === "HUB_DESC") {
        return Number(second.pinCount || 0) - Number(first.pinCount || 0);
      }

      const firstDate = new Date(
        first.updatedAt || first.createdAt || 0,
      ).getTime();

      const secondDate = new Date(
        second.updatedAt || second.createdAt || 0,
      ).getTime();

      return secondDate - firstDate;
    });
  }, [routes, keyword, selectedCategory, sortOption]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRoutes.length / ITEMS_PER_PAGE),
  );

  const paginatedRoutes = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRoutes.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredRoutes, currentPage]);

  const clearFilters = () => {
    setKeyword("");
    setSelectedCategory("ALL");
    setSortOption("LATEST");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    keyword.trim() !== "" ||
    selectedCategory !== "ALL" ||
    sortOption !== "LATEST";

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) {
      return;
    }

    setCurrentPage(page);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <main className="route-list-page">
      <header className="route-list-hero">
        <div className="route-list-container">
          <p className="route-list-eyebrow">CHIANG MAI WELLNESS</p>
          <h1>เส้นทางท่องเที่ยวเชิงสุขภาพ</h1>
          <p className="route-list-hero__description">
            ค้นหาเส้นทางสุขภาพในจังหวัดเชียงใหม่ พร้อมดูพื้นที่ที่เดินทางผ่าน
            สถานประกอบการ และจุดบริการที่เกี่ยวข้อง
          </p>
        </div>
      </header>

      <div className="route-list-container route-list-content">
        <section className="route-list-search-section">
          <div className="route-list-search-heading">
            <div>
              <h2>ค้นหาเส้นทาง</h2>
              <p>ค้นหาจากชื่อเส้นทาง อำเภอ หรือรายละเอียดที่คุณสนใจ</p>
            </div>

            <button
              type="button"
              className={`route-list-filter-toggle ${showFilters ? "route-list-filter-toggle--active" : ""
                }`}
              onClick={() => setShowFilters((previousValue) => !previousValue)}
            >
              <Filter />
              ตัวกรอง
            </button>
          </div>

          <div className="route-list-search-row">
            <div className="route-list-search-input">
              <Search />
              <input
                type="text"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="ค้นหาชื่อเส้นทาง ชื่ออำเภอ หรือรายละเอียด..."
                aria-label="ค้นหาเส้นทาง"
              />

              {keyword && (
                <button
                  type="button"
                  aria-label="ล้างคำค้นหา"
                  onClick={() => setKeyword("")}
                >
                  <X />
                </button>
              )}
            </div>
          </div>

          <div
            className={
              showFilters
                ? "route-list-filter-panel route-list-filter-panel--open"
                : "route-list-filter-panel"
            }
          >
            <div className="route-list-filter-group">
              <label htmlFor="route-category-filter">หมวดหมู่</label>
              <select
                id="route-category-filter"
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
              >
                <option value="ALL">ทุกหมวดหมู่</option>
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="route-list-filter-group">
              <label htmlFor="route-sort-filter">เรียงตาม</label>
              <select
                id="route-sort-filter"
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value)}
              >
                <option value="LATEST">อัปเดตล่าสุด</option>
                <option value="NAME_ASC">ชื่อเส้นทาง ก–ฮ</option>
                <option value="HUB_DESC">จำนวนสถานประกอบการมากที่สุด</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                className="route-list-clear-filter"
                onClick={clearFilters}
              >
                <X />
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </section>

        {loading && (
          <LoadingState
            title="กำลังโหลดเส้นทางสุขภาพ"
            message="ระบบกำลังเตรียมข้อมูลเส้นทางท่องเที่ยวเชิงสุขภาพ กรุณารอสักครู่"
          />
        )}

        {!loading && error && (
          <section className="route-list-state route-list-state--error">
            <CircleAlert />
            <h2>ไม่สามารถโหลดข้อมูลได้</h2>
            <p>{error}</p>
            <button type="button" onClick={loadRoutes}>
              <RefreshCw />
              ลองใหม่
            </button>
          </section>
        )}

        {!loading && !error && (
          <>
            <section className="route-list-summary">
              <div>
                <h2>เส้นทางทั้งหมด</h2>
                <span>เลือกเส้นทางที่เหมาะกับรูปแบบและความสนใจของคุณ</span>
              </div>

              <div className="route-list-summary__count">
                <strong>{filteredRoutes.length}</strong>
                <span>เส้นทาง</span>
              </div>
            </section>

            {routes.length === 0 ? (
              <section className="route-list-state">
                <Search />
                <h2>ไม่พบข้อมูลเส้นทางท่องเที่ยวเชิงสุขภาพหลัก</h2>
              </section>
            ) : filteredRoutes.length === 0 ? (
              <section className="route-list-state">
                <Search />
                <h2>ไม่พบข้อมูลเส้นทางท่องเที่ยวเชิงสุขภาพหลัก</h2>
                <p>ไม่พบข้อมูลที่ตรงกับคำค้นหาหรือตัวกรองที่เลือก</p>
                {hasActiveFilters && (
                  <button type="button" onClick={clearFilters}>
                    <X />
                    ล้างตัวกรอง
                  </button>
                )}
              </section>
            ) : (
              <>
                <section className="route-list-grid">
                  {paginatedRoutes.map((routeItem) => (
                    <article
                      key={routeItem.routeId}
                      className="route-list-card"
                    >
                      {/* รูปภาพ routeImage หรือ Placeholder */}
                      <div className="route-list-card__image">
                        {routeItem.routeImage ? (
                          <img
                            src={routeItem.routeImage}
                            alt={routeItem.routeName}
                            loading="lazy"
                          />
                        ) : (
                          <div className="route-list-card__image-placeholder">
                            <Route />
                          </div>
                        )}
                      </div>

                      {/* CONTENT */}
                      <div className="route-list-card__body">
                        <div className="route-list-card__heading">
                          <div className="route-list-card__icon">
                            <Navigation />
                          </div>

                          <div>
                            <p>WELLNESS ROUTE</p>
                            <span>เส้นทางท่องเที่ยวเชิงสุขภาพ</span>
                          </div>
                        </div>

                        <h3>{routeItem.routeName}</h3>

                        {hasValue(routeItem.routeDescription) && (
                          <p className="route-list-card__description">
                            {routeItem.routeDescription}
                          </p>
                        )}

                        {/* Category Chip (Filter EM/BLS/ALS และใช้ชื่อตรงกับหน้า Home) */}
                        {Array.isArray(routeItem.categories) &&
                          routeItem.categories.length > 0 && (
                            <div className="route-list-card__categories">
                              {routeItem.categories
                                .filter((category) => {
                                  const id = String(
                                    category.categoryId || "",
                                  ).toUpperCase();
                                  return !(
                                    id.startsWith("EM") ||
                                    id.includes("BLS") ||
                                    id.includes("ALS")
                                  );
                                })
                                .map((category) => {
                                  const categoryStyle = getCategoryStyle(
                                    category.categoryId,
                                  );
                                  return (
                                    <span
                                      className="route-category"
                                      key={category.categoryId}
                                      style={{
                                        color: categoryStyle.color,
                                        background: categoryStyle.background,
                                      }}
                                    >
                                      <span
                                        className="route-category-dot"
                                        style={{
                                          background: categoryStyle.color,
                                        }}
                                      />
                                      {categoryStyle.name ||
                                        category.categoryName}
                                    </span>
                                  );
                                })}
                            </div>
                          )}

                        {/* พื้นที่ที่เดินทางผ่าน */}
                        <div className="route-list-card__path">
                          <MapPin />
                          <div>
                            <span>พื้นที่ที่เดินทางผ่าน</span>
                            <strong>
                              {routeItem.districtsPassed ||
                                "ยังไม่ได้กำหนดพื้นที่"}
                            </strong>
                          </div>
                        </div>

                        {/* Footer และ Count */}
                        <div className="route-list-card__footer">
                          <Link
                            to={`/wellness-routes/${routeItem.routeId}`}
                            className="route-list-card__button"
                          >
                            ดูรายละเอียดเส้นทาง
                            <ArrowRight />
                          </Link>

                          <div className="route-list-card__count">
                            <MapPin />
                            {routeItem.pinCount || 0} จุดแนะนำ
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </section>

                {totalPages > 1 && (
                  <nav
                    className="route-list-pagination"
                    aria-label="หน้ารายการเส้นทาง"
                  >
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => goToPage(currentPage - 1)}
                      aria-label="หน้าก่อนหน้า"
                    >
                      <ChevronLeft />
                    </button>

                    {Array.from(
                      { length: totalPages },
                      (_, index) => index + 1,
                    ).map((page) => (
                      <button
                        key={page}
                        type="button"
                        className={
                          currentPage === page
                            ? "route-list-pagination__active"
                            : ""
                        }
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => goToPage(currentPage + 1)}
                      aria-label="หน้าถัดไป"
                    >
                      <ChevronRight />
                    </button>
                  </nav>
                )}
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
