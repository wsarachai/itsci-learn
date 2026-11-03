import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  CalendarDays,
  CircleAlert,
  Newspaper,
  RefreshCw,
  User,
  Images,
  X,
  Tag,
  Building2,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import LoadingState from "../../Components/LoadingState/LoadingState";
import "./ArticleDetail.css";

const API_URL = "/api/articles";

// In-Memory Cache สำหรับเก็บบทความที่เคยเปิดอ่านแล้ว เปิดซ้ำได้ทันทีใน 0ms
const articleDetailCache = new Map();

export const clearArticleDetailCache = (id) => {
  if (id) {
    articleDetailCache.delete(String(id));
  } else {
    articleDetailCache.clear();
  }
};

const ALLOWED_ARTICLE_TAGS = new Set([
  "P",
  "BR",
  "STRONG",
  "B",
  "EM",
  "I",
  "U",
  "S",
  "DEL",
  "H2",
  "H3",
  "H4",
  "UL",
  "OL",
  "LI",
  "BLOCKQUOTE",
  "A",
  "HR",
  "SPAN",
  "DIV",
  "SUP",
  "SUB",
  "CODE",
  "IMG",
  "FIGURE",
  "FIGCAPTION",
]);

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
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
    } catch {
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
    month: "long",
    year: "numeric",
  }).format(date);
}

function getArticleCategory(article) {
  return article?.articleCategory || "บทความสุขภาพ";
}

function sanitizeInlineStyle(styleValue = "") {
  const safeStyles = [];

  String(styleValue)
    .split(";")
    .forEach((styleRule) => {
      const [rawProperty, ...rawValueParts] = styleRule.split(":");

      if (!rawProperty || rawValueParts.length === 0) {
        return;
      }

      const property = rawProperty.trim().toLowerCase();
      const value = rawValueParts.join(":").trim().toLowerCase();

      if (
        property === "font-weight" &&
        /^(bold|bolder|[5-9]00)$/.test(value)
      ) {
        safeStyles.push(`font-weight: ${value}`);
      }

      if (
        property === "font-style" &&
        /^(italic|oblique)$/.test(value)
      ) {
        safeStyles.push(`font-style: ${value}`);
      }

      if (
        property === "text-decoration" &&
        /^(underline|line-through)$/.test(value)
      ) {
        safeStyles.push(`text-decoration: ${value}`);
      }

      if (
        property === "text-align" &&
        /^(left|right|center|justify)$/.test(value)
      ) {
        safeStyles.push(`text-align: ${value}`);
      }
    });

  return safeStyles.join("; ");
}

function sanitizeArticleNode(node) {
  Array.from(node.childNodes).forEach((childNode) => {
    if (childNode.nodeType === Node.COMMENT_NODE) {
      childNode.remove();
      return;
    }

    if (childNode.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const tagName = childNode.tagName;

    if (
      tagName === "SCRIPT" ||
      tagName === "STYLE" ||
      tagName === "IFRAME" ||
      tagName === "OBJECT" ||
      tagName === "EMBED" ||
      tagName === "FORM" ||
      tagName === "INPUT" ||
      tagName === "BUTTON"
    ) {
      childNode.remove();
      return;
    }

    if (!ALLOWED_ARTICLE_TAGS.has(tagName)) {
      const parentNode = childNode.parentNode;

      while (childNode.firstChild) {
        parentNode.insertBefore(childNode.firstChild, childNode);
      }

      childNode.remove();
      return;
    }

    Array.from(childNode.attributes).forEach((attribute) => {
      const attributeName = attribute.name.toLowerCase();

      if (attributeName === "style") {
        const safeStyle = sanitizeInlineStyle(attribute.value);

        if (safeStyle) {
          childNode.setAttribute("style", safeStyle);
        } else {
          childNode.removeAttribute("style");
        }

        return;
      }

      if (tagName === "A" && attributeName === "href") {
        const href = String(attribute.value).trim();

        const isSafeHref =
          href.startsWith("http://") ||
          href.startsWith("https://") ||
          href.startsWith("/") ||
          href.startsWith("#") ||
          href.startsWith("mailto:");

        if (!isSafeHref) {
          childNode.removeAttribute("href");
        }

        return;
      }

      if (attributeName.startsWith("on") || attributeName === "srcdoc") {
        childNode.removeAttribute(attribute.name);
      }
    });

    sanitizeArticleNode(childNode);
  });
}

function formatArticleContent(rawContent = "") {
  if (!hasValue(rawContent)) {
    return "";
  }

  let text = String(rawContent);

  // แปลงสัญลักษณ์พิเศษและ Newline ต่างๆ
  text = text
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\/n/gi, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return text.replace(/\n/g, "<br />");
  }

  try {
    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(text);

    if (!hasHtmlTags) {
      const paragraphs = text.split(/\n\s*\n/);
      text = paragraphs
        .map((p) => {
          const cleanP = p.trim().replace(/\n/g, "<br />");
          return cleanP ? `<p>${cleanP}</p>` : "";
        })
        .join("");
    } else {
      text = text.replace(/\n/g, "<br />");
    }

    const parser = new DOMParser();
    const documentObject = parser.parseFromString(
      `<!DOCTYPE html><html><body>${text}</body></html>`,
      "text/html",
    );

    const bodyElement = documentObject.body;
    sanitizeArticleNode(bodyElement);

    return bodyElement.innerHTML;
  } catch {
    return text.replace(/\n/g, "<br />");
  }
}

function getErrorMessage(error) {
  if (error.code === "ECONNABORTED") {
    return "ระบบใช้เวลาตอบสนองนานเกินไป กรุณาลองใหม่อีกครั้ง";
  }

  return (
    error.response?.data?.message ||
    error.response?.data ||
    "ไม่สามารถเปิดบทความได้ กรุณาลองใหม่อีกครั้ง"
  );
}

export default function ArticleDetail() {
  const { articleId } = useParams();

  const [article, setArticle] = useState(() => (articleId ? articleDetailCache.get(String(articleId)) || null : null));
  const [loading, setLoading] = useState(() => (articleId ? !articleDetailCache.has(String(articleId)) : true));
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const loadArticle = useCallback(async (forceRefresh = false) => {
    if (!hasValue(articleId)) {
      setArticle(null);
      setError("ไม่พบรหัสบทความ");
      setLoading(false);
      return;
    }

    const cached = articleDetailCache.get(String(articleId));
    if (cached && !forceRefresh) {
      setArticle(cached);
      setLoading(false);
      return;
    }

    if (!cached) {
      setLoading(true);
    }
    setError("");
    setImageError(false);

    try {
      const response = await axios.get(`${API_URL}/${articleId}`, {
        timeout: 20000,
      });

      const data = response.data || null;
      if (data) {
        articleDetailCache.set(String(articleId), data);
      }
      setArticle(data);
    } catch (requestError) {
      if (!cached) {
        setArticle(null);
        setError(getErrorMessage(requestError));
      }
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    loadArticle();
  }, [loadArticle]);

  useEffect(() => {
    if (loading) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
      });
    }
  }, [articleId, loading]);

  // Keyboard shortcut สำหรับปิด Modal (Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setPreviewImage(null);
      }
    };
    if (previewImage) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [previewImage]);

  const galleryImages = useMemo(() => {
    if (!article || !article.articleImages) {
      return [];
    }

    let images = article.articleImages;
    if (typeof images === "string") {
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed)) {
          images = parsed;
        } else if (typeof parsed === "string") {
          images = [parsed];
        }
      } catch {
        images = [images];
      }
    }

    if (!Array.isArray(images)) {
      return [];
    }

    return images
      .filter((img) => hasValue(img))
      .map((img) => normalizeImageSource(img))
      .filter(Boolean);
  }, [article]);

  const imageSource = useMemo(() => {
    if (!article) {
      return "";
    }

    return normalizeImageSource(article.img) || (galleryImages[0] ?? "");
  }, [article, galleryImages]);

  const publishDate = useMemo(() => {
    return formatDate(article?.publishDate);
  }, [article]);

  const articleContent = useMemo(() => {
    return formatArticleContent(article?.articleDetail || "");
  }, [article]);

  if (loading) {
    return (
      <LoadingState
        fullPage
        title="กำลังโหลดข้อมูลบทความ"
        message="ระบบกำลังเรียกดูข้อมูลบทความจากฐานข้อมูล กรุณารอสักครู่"
      />
    );
  }

  if (error || !article) {
    return (
      <main className="gov-article-page">
        <div className="gov-article-container gov-article-error-wrap">
          <Link to="/articles" className="gov-article-back">
            <ArrowLeft size={16} />
            <span>ย้อนกลับ</span>
          </Link>

          <section
            className="gov-article-state gov-article-state--error"
            role="alert"
          >
            <CircleAlert size={48} className="gov-article-state__icon" />
            <h1>ไม่สามารถเปิดบทความได้</h1>
            <p>{error || "ไม่พบข้อมูลบทความที่ต้องการ"}</p>

            <div className="gov-article-state__actions">
              <button
                type="button"
                className="gov-article-btn-retry"
                onClick={loadArticle}
              >
                <RefreshCw size={16} />
                <span>ลองใหม่อีกครั้ง</span>
              </button>

              <Link to="/articles" className="gov-article-btn-back">
                <span>กลับไปหน้ารวมบทความ</span>
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="gov-article-page">
      {/* 🏛️ 1. HERO MASTHEAD & NAVIGATION (เหมือนหน้า ArticleList) */}
      <header className="gov-article-hero">
        <div className="gov-article-container">
          <Link to="/articles" className="gov-article-back">
            <ArrowLeft size={16} />
            <span>ย้อนกลับ</span>
          </Link>

          <div className="gov-article-hero-text">
            <p className="gov-article-eyebrow">CHIANG MAI WELLNESS</p>
            <h1 className="gov-article-hero-title">บทความสุขภาพและการท่องเที่ยว</h1>
            <p className="gov-article-hero-desc">
              รวมข้อมูลสุขภาพ การดูแลตนเอง การท่องเที่ยวเชิงสุขภาพ
              และเรื่องราวที่น่าสนใจในจังหวัดเชียงใหม่
            </p>
          </div>
        </div>
      </header>

      {/* 🏛️ 2. OFFICIAL ARTICLE MAIN DOCUMENT */}
      <div className="gov-article-container gov-article-body-wrapper">
        <article className="gov-article-doc">
          {/* Header Section: Title & Official Metadata */}
          <header className="gov-article-header">
            <div className="gov-article-category-badge">
              <Tag size={13} />
              <span>{getArticleCategory(article)}</span>
            </div>

            <h1 className="gov-article-title">
              {article.articleTitle || "บทความสุขภาพ"}
            </h1>

            {/* Official Metadata Row */}
            <div className="gov-article-meta-row">
              {publishDate && (
                <div className="gov-article-meta-item">
                  <CalendarDays size={15} />
                  <span>วันที่เผยแพร่: <strong>{publishDate}</strong></span>
                </div>
              )}

              <div className="gov-article-meta-item">
                <User size={15} />
                <span>ผู้เผยแพร่: <strong>{article.author || "ผู้ดูแลระบบ (Admin)"}</strong></span>
              </div>
            </div>

            <div className="gov-article-divider" />
          </header>

          {/* 🌟 3. FEATURED COVER IMAGE (รูปภาพหน้าปกหลักพอดีกับตัวรูป) */}
          {(imageSource || !imageError) && (
            <figure className="gov-article-cover-section">
              {imageSource && !imageError ? (
                <div
                  className="gov-article-cover-frame"
                  onClick={() => setPreviewImage(imageSource)}
                  title="คลิกเพื่อดูรูปภาพขนาดใหญ่"
                  role="button"
                  tabIndex={0}
                >
                  <img
                    src={imageSource}
                    alt={article.articleTitle || "ภาพประกอบบทความ"}
                    className="gov-article-cover-img"
                    onError={() => setImageError(true)}
                  />
                </div>
              ) : (
                <div className="gov-article-cover-fallback">
                  <Newspaper size={44} />
                  <span>ภาพประกอบบทความและข่าวสารสุขภาพ จังหวัดเชียงใหม่</span>
                </div>
              )}
            </figure>
          )}

          {/* 🌟 4. OFFICIAL ARTICLE PROSE CONTENT */}
          <section className="gov-article-content-section" aria-label="เนื้อหาบทความ">
            {articleContent ? (
              <div
                className="gov-article-prose"
                dangerouslySetInnerHTML={{
                  __html: articleContent,
                }}
              />
            ) : (
              <div className="gov-article-empty-content">
                <Newspaper size={40} />
                <p>อยู่ระหว่างการปรับปรุงข้อมูลเนื้อหา</p>
              </div>
            )}
          </section>

          {/* 🌟 5. PHOTO GALLERY (รูปภาพประกอบเพิ่มเติม / ภาพกิจกรรม) */}
          {galleryImages.length > 0 && (
            <section className="gov-article-gallery-section">
              <div className="gov-article-gallery-header">
                <Images size={18} />
                <h2>รูปภาพประกอบเพิ่มเติม ({galleryImages.length} รูป)</h2>
              </div>

              <div className="gov-article-gallery-grid">
                {galleryImages.map((imgSrc, index) => (
                  <figure
                    key={index}
                    className="gov-article-gallery-item"
                    onClick={() => setPreviewImage(imgSrc)}
                    title="คลิกเพื่อดูรูปขนาดเต็ม"
                    tabIndex={0}
                  >
                    <img
                      src={imgSrc}
                      alt={`ภาพประกอบ ${index + 1}`}
                      loading="lazy"
                    />
                  </figure>
                ))}
              </div>
            </section>
          )}

          {/* 🌟 6. OFFICIAL SOURCE & ACCREDITATION FOOTER */}
          <footer className="gov-article-footer">


            <div className="gov-article-footer-nav">
              <Link to="/articles" className="gov-article-btn-back-bottom">
                <ArrowLeft size={16} />
                <span>ย้อนกลับ</span>
              </Link>
            </div>
          </footer>
        </article>
      </div>

      {/* 🌟 MODAL FULL-SCREEN LIGHTBOX */}
      {previewImage && (
        <div
          className="gov-article-modal"
          onClick={() => setPreviewImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="gov-article-modal__content"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={previewImage} alt="ภาพขยายขนาดเต็ม" />
            <button
              type="button"
              className="gov-article-modal__close"
              onClick={() => setPreviewImage(null)}
              aria-label="ปิดภาพขยาย"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}