import { useCallback, useEffect, useMemo, useState } from "react";

import axios from "axios";

import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Filter,
  Newspaper,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { Link } from "react-router-dom";
import LoadingState from "../../Components/LoadingState/LoadingState";
import "./ArticleList.css";

const API_URL = "/api/home/articles";

const ITEMS_PER_PAGE = 9;

// In-Memory Cache เพื่อให้เปิดหน้ารายการบทความได้ทันทีใน 0ms เมื่อสลับหน้า
let articleListCache = null;

export const clearArticleListCache = () => {
  articleListCache = null;
};

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function removeHtml(value = "") {
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeImageSource(value) {
  if (!hasValue(value)) {
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
    } catch (error) {
      imageValue = trimmedValue;
    }
  }

  if (Array.isArray(imageValue)) {
    imageValue = imageValue[0] || "";
  }

  if (!hasValue(imageValue)) {
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

function formatDate(value) {
  if (!hasValue(value)) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getArticleCategory(article) {
  return article.articleCategory || "บทความสุขภาพ";
}

function getErrorMessage(error) {
  if (error.code === "ECONNABORTED") {
    return "ระบบใช้เวลาตอบสนองนานเกินไป กรุณาลองใหม่อีกครั้ง";
  }

  return (
    error.response?.data?.message ||
    "ไม่สามารถโหลดรายการบทความได้ กรุณาลองใหม่อีกครั้ง"
  );
}

export default function ArticleList() {
  const [articles, setArticles] = useState(() => articleListCache || []);

  const [loading, setLoading] = useState(() => !articleListCache);

  const [error, setError] = useState("");

  const [keyword, setKeyword] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const [sortOption, setSortOption] = useState("LATEST");

  const [currentPage, setCurrentPage] = useState(1);

  const [showFilters, setShowFilters] = useState(false);

  const loadArticles = useCallback(async (forceRefresh = false) => {
    if (!articleListCache || forceRefresh) {
      setLoading(true);
    }
    setError("");

    try {
      const response = await axios.get(API_URL, {
        timeout: 20000,
      });

      const data = Array.isArray(response.data) ? response.data : [];
      articleListCache = data;
      setArticles(data);
    } catch (requestError) {
      if (!articleListCache) {
        setArticles([]);
        setError(getErrorMessage(requestError));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  useEffect(() => {
    if (loading) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
      });
    }
  }, [loading]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, selectedCategory, sortOption]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set();

    articles.forEach((article) => {
      const category = getArticleCategory(article);

      if (hasValue(category)) {
        uniqueCategories.add(category);
      }
    });

    return Array.from(uniqueCategories).sort((first, second) =>
      first.localeCompare(second, "th"),
    );
  }, [articles]);

  const filteredArticles = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    const result = articles.filter((article) => {
      const title = String(article.articleTitle || "").toLowerCase();

      const detail = removeHtml(article.articleDetail || "").toLowerCase();

      const category = getArticleCategory(article);

      const matchesKeyword =
        !normalizedKeyword ||
        title.includes(normalizedKeyword) ||
        detail.includes(normalizedKeyword) ||
        category.toLowerCase().includes(normalizedKeyword);

      const matchesCategory =
        selectedCategory === "ALL" || category === selectedCategory;

      return matchesKeyword && matchesCategory;
    });

    return [...result].sort((first, second) => {
      if (sortOption === "TITLE_ASC") {
        return String(first.articleTitle || "").localeCompare(
          String(second.articleTitle || ""),
          "th",
        );
      }

      if (sortOption === "OLDEST") {
        return (
          new Date(first.publishDate || 0).getTime() -
          new Date(second.publishDate || 0).getTime()
        );
      }

      return (
        new Date(second.publishDate || 0).getTime() -
        new Date(first.publishDate || 0).getTime()
      );
    });
  }, [articles, keyword, selectedCategory, sortOption]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredArticles.length / ITEMS_PER_PAGE),
  );

  const paginatedArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

    return filteredArticles.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredArticles, currentPage]);

  const hasActiveFilters =
    keyword.trim() !== "" ||
    selectedCategory !== "ALL" ||
    sortOption !== "LATEST";

  const clearFilters = () => {
    setKeyword("");
    setSelectedCategory("ALL");
    setSortOption("LATEST");
    setCurrentPage(1);
  };

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
    <main className="article-list-page">
      <header className="article-list-hero">
        <div className="article-list-container">
          <p className="article-list-eyebrow">CHIANG MAI WELLNESS</p>

          <h1>บทความสุขภาพและการท่องเที่ยว</h1>

          <p className="article-list-hero__description">
            รวมข้อมูลสุขภาพ การดูแลตนเอง การท่องเที่ยวเชิงสุขภาพ
            และเรื่องราวที่น่าสนใจในจังหวัดเชียงใหม่
          </p>
        </div>
      </header>

      <div className="article-list-container article-list-content">
        <section className="article-list-search-section">
          <div className="article-list-search-heading">
            <div>
              <h2>ค้นหาบทความ</h2>

              <p>ค้นหาจากชื่อบทความ หมวดหมู่ หรือเนื้อหาที่คุณสนใจ</p>
            </div>

            <button
              type="button"
              className={`article-list-filter-toggle ${
                showFilters ? "article-list-filter-toggle--active" : ""
              }`}
              onClick={() => setShowFilters((previousValue) => !previousValue)}
            >
              <Filter />
              ตัวกรอง
            </button>
          </div>

          <div className="article-list-search-row">
            <div className="article-list-search-input">
              <Search />

              <input
                type="text"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="ค้นหาชื่อบทความ หมวดหมู่ หรือเนื้อหา..."
                aria-label="ค้นหาบทความ"
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
                ? "article-list-filter-panel article-list-filter-panel--open"
                : "article-list-filter-panel"
            }
          >
            <div className="article-list-filter-group">
              <label htmlFor="article-category-filter">หมวดหมู่</label>

              <select
                id="article-category-filter"
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
              >
                <option value="ALL">ทุกหมวดหมู่</option>

                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="article-list-filter-group">
              <label htmlFor="article-sort-filter">เรียงตาม</label>

              <select
                id="article-sort-filter"
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value)}
              >
                <option value="LATEST">เผยแพร่ล่าสุด</option>

                <option value="OLDEST">เผยแพร่เก่าสุด</option>

                <option value="TITLE_ASC">ชื่อบทความ ก–ฮ</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                className="article-list-clear-filter"
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
            title="กำลังโหลดบทความ"
            message="ระบบกำลังเตรียมเนื้อหาบทความสำหรับคุณ กรุณารอสักครู่"
          />
        )}

        {!loading && error && (
          <section className="article-list-state article-list-state--error">
            <CircleAlert />

            <h2>ไม่สามารถโหลดข้อมูลได้</h2>

            <p>{error}</p>

            <button type="button" onClick={loadArticles}>
              <RefreshCw />
              ลองใหม่
            </button>
          </section>
        )}

        {!loading && !error && (
          <>
            <section className="article-list-summary">
              <div>
                <h2>บทความทั้งหมด</h2>

                <span>เลือกอ่านเรื่องราวและความรู้ตามหัวข้อที่คุณสนใจ</span>
              </div>

              <div className="article-list-summary__count">
                <strong>{filteredArticles.length}</strong>

                <span>บทความ</span>
              </div>
            </section>

            {filteredArticles.length === 0 ? (
              <section className="article-list-state">
                <Search />

                <h2>ไม่พบบทความ</h2>

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
                <section className="article-list-grid">
                  {paginatedArticles.map((article) => {
                    const imageSource = normalizeImageSource(
                      article.img || article.articleImages,
                    );

                    const articleDescription = removeHtml(
                      article.articleDetail || "",
                    );

                    const publishDate = formatDate(article.publishDate);

                    return (
                      <article
                        key={article.articleId}
                        className="article-list-card"
                      >
                        <div className="article-list-card__image">
                          {imageSource ? (
                            <img
                              src={imageSource}
                              alt={article.articleTitle}
                              loading="lazy"
                              decoding="async"
                              onError={(event) => {
                                event.currentTarget.classList.add(
                                  "article-list-card__image-hidden",
                                );

                                event.currentTarget.parentElement.classList.add(
                                  "article-list-card__image--fallback",
                                );
                              }}
                            />
                          ) : (
                            <Newspaper />
                          )}
                        </div>

                        <div className="article-list-card__body">
                          <div className="article-list-card__meta">
                            <span className="article-list-card__category">
                              {getArticleCategory(article)}
                            </span>

                            {publishDate && (
                              <p className="article-list-card__date">
                                <CalendarDays />
                                {publishDate}
                              </p>
                            )}
                          </div>

                          <h3>{article.articleTitle}</h3>

                          {articleDescription && (
                            <p className="article-list-card__description">
                              {articleDescription}
                            </p>
                          )}

                          <Link
                            to={`/articles/${article.articleId}`}
                            className="article-list-card__link"
                          >
                            <span>อ่านบทความ</span>
                            <ArrowRight />
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </section>

                {totalPages > 1 && (
                  <nav
                    className="article-list-pagination"
                    aria-label="หน้ารายการบทความ"
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
                      {
                        length: totalPages,
                      },
                      (_, index) => index + 1,
                    ).map((page) => (
                      <button
                        key={page}
                        type="button"
                        className={
                          currentPage === page
                            ? "article-list-pagination__active"
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