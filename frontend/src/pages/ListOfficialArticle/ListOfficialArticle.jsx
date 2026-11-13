import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImage,
  faCircleCheck,
  faCircleXmark,
  faXmark,
  faTrashCan,
  faSpinner,
  faPlus,
  faMagnifyingGlass,
  faRotate,
  faPenToSquare,
  faCircleExclamation,
} from "@fortawesome/free-solid-svg-icons";

import "./ListOfficialArticle.css";
import AdminSidebar from "../../Components/AdminSidebar/AdminSidebar";
import AdminStatusModal from "../../Components/AdminStatusModal/AdminStatusModal";
import { clearArticleListCache } from "../ArticleList/ArticleList";
import { clearArticleDetailCache } from "../ArticleDetail/ArticleDetail";
import { withBase } from "../../utils/basePath";

const API_URL = "/api/articles";
const ROWS_PER_PAGE = 10;

// In-Memory Cache เพื่อให้เปิดหน้ารายการบทความฝั่ง Admin ได้ทันทีใน 0ms
let adminArticlesCache = null;

export const setAdminArticlesCache = (data) => {
  adminArticlesCache = data;
};

export const clearAdminArticleCache = () => {
  adminArticlesCache = null;
};

const SYSTEM_CATEGORIES = [
  "ข่าวประชาสัมพันธ์",
  "กิจกรรมสุขภาพ",
  "โปรโมชั่น",
  "บทความสุขภาพ",
];

function ListOfficialArticle() {
  const navigate = useNavigate();
  const location = useLocation();

  const [articles, setArticles] = useState(() =>
    Array.isArray(adminArticlesCache) ? adminArticlesCache : [],
  );
  const [adminName, setAdminName] = useState("Admin");
  const [isLoading, setIsLoading] = useState(
    () => !Array.isArray(adminArticlesCache),
  );

  // State สำหรับ Popup ยืนยันลบ
  const [deletingId, setDeletingId] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Status Modal State
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  useEffect(() => {
    const storedAdminName = localStorage.getItem("adminName");

    if (storedAdminName) {
      setAdminName(storedAdminName);
    }

    loadArticles("", "");
  }, []);

  const loadArticles = async (
    keyword = searchQuery,
    category = selectedCategory,
    forceRefresh = false,
  ) => {
    const isDefaultFilter = !keyword && !category;

    if (Array.isArray(adminArticlesCache) && isDefaultFilter && !forceRefresh) {
      setArticles(adminArticlesCache);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    try {
      const params = {};
      if (keyword && keyword.trim()) {
        params.keyword = keyword.trim();
      }
      if (category && category.trim()) {
        params.category = category.trim();
      }

      const response = await axios.get(API_URL, { params });
      const data = Array.isArray(response.data) ? response.data : [];

      if (isDefaultFilter) {
        adminArticlesCache = data;
      }

      setArticles(data);
    } catch (error) {
      console.error("ไม่สามารถโหลดรายการบทความได้", error);
      if (!adminArticlesCache) {
        setArticles([]);
      }
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถโหลดข้อมูลบทความจากระบบได้",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadArticles(searchQuery, selectedCategory);
  };

  const handleCategoryChange = (newCategory) => {
    setSelectedCategory(newCategory);
    setCurrentPage(1);
    loadArticles(searchQuery, newCategory);
  };

  const handleResetFilter = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setCurrentPage(1);
    loadArticles("", "", true);
  };

  const handleLogout = () => {
    const confirmed = window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?");

    if (!confirmed) {
      return;
    }

    localStorage.clear();
    navigate("/login");
  };

  const handleDeleteArticle = async () => {
    if (!selectedArticle || deletingId !== null) {
      return;
    }

    setDeletingId(selectedArticle.articleId);

    try {
      await axios.delete(`${API_URL}/${selectedArticle.articleId}`);

      clearArticleListCache();
      clearArticleDetailCache(selectedArticle.articleId);

      if (Array.isArray(adminArticlesCache)) {
        adminArticlesCache = adminArticlesCache.filter(
          (item) => item.articleId !== selectedArticle.articleId,
        );
      }

      setArticles((previousArticles) =>
        previousArticles.filter(
          (item) => item.articleId !== selectedArticle.articleId,
        ),
      );

      setShowDeletePopup(false);
      setSelectedArticle(null);

      setStatusModal({
        isOpen: true,
        type: "success",
        title: "สำเร็จ",
        message: "ลบบทความสำเร็จ",
      });
    } catch (error) {
      console.error("ไม่สามารถลบบทความได้", error);

      setShowDeletePopup(false);
      setSelectedArticle(null);

      setStatusModal({
        isOpen: true,
        type: "error",
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถลบบทความได้ กรุณาลองอีกครั้ง",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.max(
    1,
    Math.ceil(articles.length / ROWS_PER_PAGE),
  );

  const firstRowIndex = (currentPage - 1) * ROWS_PER_PAGE;

  const currentRows = articles.slice(
    firstRowIndex,
    firstRowIndex + ROWS_PER_PAGE,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const formatPublishDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const renderCoverImage = (article) => {
    if (!article.img) {
      return (
        <div className="article-image-placeholder">
          <FontAwesomeIcon icon={faImage} />
        </div>
      );
    }

    const imageSource =
      article.img.startsWith("http://") ||
        article.img.startsWith("https://") ||
        article.img.startsWith("data:")
        ? article.img
        : withBase(`/uploads/articles/${article.img}`);

    return (
      <img
        className="article-cover-thumbnail"
        src={imageSource}
        alt={article.articleTitle || "รูปหน้าปกบทความ"}
        onError={(event) => {
          event.currentTarget.style.display = "none";
          event.currentTarget
            .closest(".article-cover-cell")
            ?.classList.add("image-load-failed");
        }}
      />
    );
  };

  return (
    <div className="official-article-page">

      {/* Popup ยืนยันลบ */}
      {showDeletePopup && selectedArticle && (
        <div
          className="article-delete-popup-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && deletingId === null) {
              setShowDeletePopup(false);
              setSelectedArticle(null);
            }
          }}
        >
          <div
            className="article-delete-popup"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-article-title"
          >
            <div className="article-delete-popup-icon">
              <FontAwesomeIcon icon={faTrashCan} />
            </div>

            <h3 id="delete-article-title">ยืนยันการลบบทความ</h3>

            <p>คุณต้องการลบบทความ</p>

            <strong className="article-delete-name">
              {selectedArticle.articleTitle}
            </strong>

            <p className="article-delete-warning">
              ข้อมูลที่ลบแล้วไม่สามารถกู้คืนได้
            </p>

            <div className="article-delete-popup-actions">
              <button
                type="button"
                className="btn-cancel-delete-article"
                disabled={deletingId !== null}
                onClick={() => {
                  setShowDeletePopup(false);
                  setSelectedArticle(null);
                }}
              >
                ยกเลิก
              </button>

              <button
                type="button"
                className="btn-confirm-delete-article"
                disabled={deletingId !== null}
                onClick={handleDeleteArticle}
              >
                <FontAwesomeIcon
                  icon={deletingId !== null ? faSpinner : faTrashCan}
                  spin={deletingId !== null}
                />

                {deletingId !== null ? "กำลังลบ..." : "ยืนยันลบ"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminSidebar activeMenu="articles" />

      <main className="official-article-main">
        <div className="official-article-container">
          <header className="official-article-header">
            <h2>บัญชีรายชื่อบทความประชาสัมพันธ์ (List Official Article)</h2>

            <p>ระบบบริหารจัดการข้อมูลสุขภาพ จังหวัดเชียงใหม่</p>
          </header>

          <div className="official-article-action-bar">
            <Link to="/createOfficialArticle" className="btn-add-article">
              <FontAwesomeIcon icon={faPlus} />
              เพิ่มบทความใหม่
            </Link>
          </div>

          <section className="article-filter-bar">
            <input
              type="text"
              className="article-filter-input"
              placeholder="ค้นหาชื่อบทความหรือผู้เขียน..."
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setCurrentPage(1);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSearch();
                }
              }}
            />

            <select
              className="article-filter-select"
              value={selectedCategory}
              onChange={(event) => handleCategoryChange(event.target.value)}
            >
              <option value="">-- หมวดหมู่ทั้งหมด --</option>

              {SYSTEM_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="btn-article-search"
              onClick={handleSearch}
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} />
              ค้นหา
            </button>

            <button
              type="button"
              className="btn-article-reset"
              onClick={handleResetFilter}
            >
              <FontAwesomeIcon icon={faRotate} />
              ล้างค่า
            </button>
          </section>

          <section className="official-article-table-card">
            <table className="official-article-table">
              <thead>
                <tr>
                  {/* เปลี่ยนหัวตารางให้สอดคล้องกับ ลำดับบทความ */}
                  <th className="article-column-id">ลำดับบทความ</th>

                  <th className="article-column-cover">รูปหน้าปก</th>

                  <th className="article-column-title">ชื่อบทความ</th>

                  <th className="article-column-category">หมวดหมู่</th>

                  <th className="article-column-author">ผู้เขียน</th>

                  <th className="article-column-date">วันที่เผยแพร่</th>

                  <th className="article-column-status">สถานะ</th>

                  <th className="article-column-action">การจัดการ</th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="8" className="official-article-loading">
                      <FontAwesomeIcon icon={faSpinner} spin />
                      กำลังโหลดข้อมูลบทความ...
                    </td>
                  </tr>
                ) : currentRows.length > 0 ? (
                  currentRows.map((article, index) => {
                    // คำนวณอันดับรายการโดยไม่อิง articleId
                    const displayRank = firstRowIndex + index + 1;

                    return (
                      <tr key={article.articleId || index}>
                        <td className="text-center article-id-cell">
                          {displayRank}
                        </td>

                        <td className="article-cover-cell">
                          {renderCoverImage(article)}
                        </td>

                        <td>
                          <strong>
                            {article.articleTitle || "ไม่ระบุชื่อบทความ"}
                          </strong>
                        </td>

                        <td className="text-center">
                          {article.articleCategory || "-"}
                        </td>

                        <td className="text-center">{article.author || "-"}</td>

                        <td className="text-center">
                          {formatPublishDate(article.publishDate)}
                        </td>

                        <td className="text-center">
                          <span className="article-status-active">
                            [ เผยแพร่แล้ว ]
                          </span>
                        </td>

                        <td>
                          <div className="article-action-group">
                            <button
                              type="button"
                              className="btn-edit-article"
                              onClick={() =>
                                navigate(
                                  `/editOfficialArticle/${article.articleId}`,
                                )
                              }
                            >
                              <FontAwesomeIcon icon={faPenToSquare} />
                              แก้ไข
                            </button>

                            <button
                              type="button"
                              className="btn-delete-article"
                              disabled={deletingId === article.articleId}
                              onClick={() => {
                                setSelectedArticle(article);
                                setShowDeletePopup(true);
                              }}
                            >
                              <FontAwesomeIcon icon={faTrashCan} />
                              ลบ
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="official-article-empty">
                      <FontAwesomeIcon icon={faCircleExclamation} />
                      ไม่พบบทความ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {!isLoading && totalPages > 1 && (
            <div className="official-article-pagination">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => page - 1)}
              >
                ก่อนหน้า
              </button>

              <span>
                หน้า {currentPage} จาก {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((page) => page + 1)}
              >
                ถัดไป
              </button>
            </div>
          )}
        </div>
      </main>

      <AdminStatusModal
        isOpen={statusModal.isOpen}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() =>
          setStatusModal((previous) => ({
            ...previous,
            isOpen: false,
          }))
        }
      />
    </div>
  );
}

export default ListOfficialArticle;
