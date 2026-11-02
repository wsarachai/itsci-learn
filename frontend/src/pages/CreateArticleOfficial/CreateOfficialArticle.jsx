import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrashCan,
  faPlus,
  faBold,
  faItalic,
  faUnderline,
} from "@fortawesome/free-solid-svg-icons";

import "./CreateOfficialArticle.css";
import AdminSidebar from "../../Components/AdminSidebar/AdminSidebar";
import AdminStatusModal from "../../Components/AdminStatusModal/AdminStatusModal";
import { clearArticleListCache } from "../ArticleList/ArticleList";
import { clearArticleDetailCache } from "../ArticleDetail/ArticleDetail";
import { clearAdminArticleCache } from "../ListOfficialArticle/ListOfficialArticle";

// กำหนดขนาดไฟล์สูงสุดเป็น 20MB
const MAX_IMAGE_SIZE = 20 * 1024 * 1024;

function CreateOfficialArticle() {
  const navigate = useNavigate();
  const { id } = useParams();

  const adminName = localStorage.getItem("adminName") || "Admin";

  const [articleTitle, setArticleTitle] = useState("");
  const [articleCategory, setArticleCategory] = useState("ข่าวประชาสัมพันธ์");
  const [articleDetail, setArticleDetail] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [articleImages, setArticleImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editorRef = useRef(null);

  // State สำหรับควบคุม Popup เตือนสถานะสไตล์ทางการ
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const fileToBase64 = (file, maxWidth = 1280, maxHeight = 1280, quality = 0.8) => {
    return new Promise((resolve) => {
      if (!file || !(file instanceof File)) {
        resolve(file || "");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => resolve(event.target.result);
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  };

  const normalizeImageSource = (value) => {
    if (!value) return "";
    if (value instanceof File) return URL.createObjectURL(value);
    if (typeof value !== "string") return "";
    const trimmed = value.trim();
    if (
      trimmed.startsWith("data:image/") ||
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("blob:")
    ) {
      return trimmed;
    }
    if (/^[A-Za-z0-9+/=\s]+$/.test(trimmed) && trimmed.length > 50) {
      return `data:image/jpeg;base64,${trimmed}`;
    }
    return trimmed;
  };

  useEffect(() => {
    if (id) {
      loadArticle();
    }
  }, [id]);

  useEffect(() => {
    if (editorRef.current && articleDetail && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = articleDetail;
    }
  }, [articleDetail]);

  const loadArticle = async () => {
    setStatusModal({
      isOpen: true,
      type: "loading",
      title: "กำลังโหลดข้อมูลบทความ...",
      message: "กรุณารอสักครู่ ระบบกำลังดึงข้อมูลบทความ",
    });

    try {
      const res = await axios.get(`/api/articles/${id}`);
      const data = res.data;

      setArticleTitle(data.articleTitle || "");
      setArticleCategory(data.articleCategory || "ข่าวประชาสัมพันธ์");
      setArticleDetail(data.articleDetail || "");

      if (editorRef.current) {
        editorRef.current.innerHTML = data.articleDetail || "";
      }

      if (data.img) {
        setCoverImage(data.img);
      }

      if (data.articleImages) {
        try {
          const parsedImages =
            typeof data.articleImages === "string"
              ? JSON.parse(data.articleImages)
              : data.articleImages;
          setArticleImages(Array.isArray(parsedImages) ? parsedImages : []);
        } catch (e) {
          console.error("Error parsing article images", e);
          setArticleImages([]);
        }
      }

      // ปิด Loading Popup เมื่อโหลดข้อมูลสำเร็จ
      setStatusModal((prev) => ({ ...prev, isOpen: false }));
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลบทความ:", err);
      const is404 = err.response && err.response.status === 404;
      setStatusModal({
        isOpen: true,
        type: "error",
        title: is404 ? "ไม่พบข้อมูลบทความ" : "เกิดข้อผิดพลาด",
        message: is404
          ? "ไม่พบข้อมูลบทความที่ต้องการแก้ไข กรุณาตรวจสอบรหัสบทความอีกครั้ง"
          : "ไม่สามารถเชื่อมต่อระบบเพื่อดึงข้อมูลบทความได้",
      });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // ตรวจสอบชนิดไฟล์ (.png, .jpg, .jpeg) และขนาดไฟล์ไม่เกิน 20MB
  const validateImage = (file) => {
    const isImage =
      ["image/png", "image/jpeg", "image/jpg"].includes(file.type) ||
      /\.(png|jpe?g)$/i.test(file.name);

    if (!isImage) {
      return "ต้องเป็นไฟล์รูปภาพนามสกุล .png, .jpg และ .jpeg เท่านั้น";
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return "ขนาดไฟล์ต้องไม่เกิน 20 MB";
    }
    return null;
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const error = validateImage(file);
    if (error) {
      setErrors((prev) => ({ ...prev, cover: error }));
      setStatusModal({
        isOpen: true,
        type: "warning",
        title: id ? "กรุณากรอกข้อมูลให้ถูกต้องตามเงื่อนไข" : "กรุณากรอกข้อมูลให้ครบถ้วน",
        message: error,
      });
      e.target.value = "";
      return;
    }
    setErrors((prev) => ({ ...prev, cover: "" }));
    setCoverImage(file);
  };

  const handleImagesUpload = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    // รวมรูปภาพประกอบสูงสุด 4 รูป (เมื่อรวมรูปปกจะเป็นสูงสุด 5 รูป)
    const remainingSlots = 4 - articleImages.length;
    if (remainingSlots <= 0) {
      const msg = "เพิ่มรูปภาพประกอบได้สูงสุด 4 รูป (เมื่อรวมรูปปกจะเป็นสูงสุด 5 รูป)";
      setErrors((prev) => ({ ...prev, images: msg }));
      setStatusModal({
        isOpen: true,
        type: "warning",
        title: id ? "กรุณากรอกข้อมูลให้ถูกต้องตามเงื่อนไข" : "กรุณากรอกข้อมูลให้ครบถ้วน",
        message: msg,
      });
      e.target.value = "";
      return;
    }

    const validFiles = [];
    const invalidMessages = [];

    selectedFiles.forEach((file) => {
      const error = validateImage(file);
      if (error) {
        invalidMessages.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidMessages.length > 0) {
      const msg = invalidMessages.join(" | ");
      setErrors((prev) => ({ ...prev, images: msg }));
      setStatusModal({
        isOpen: true,
        type: "warning",
        title: id ? "กรุณากรอกข้อมูลให้ถูกต้องตามเงื่อนไข" : "กรุณากรอกข้อมูลให้ครบถ้วน",
        message: msg,
      });
    }

    const filesToAdd = validFiles.slice(0, remainingSlots);
    setArticleImages((prev) => [...prev, ...filesToAdd]);
    e.target.value = "";
  };

  const handleRemoveArticleImage = (indexToRemove) => {
    setArticleImages((prev) =>
      prev.filter((_, index) => index !== indexToRemove),
    );
    setErrors((prev) => ({ ...prev, images: "" }));
  };

  const formatText = (command) => {
    document.execCommand(command, false, null);
    if (editorRef.current) {
      setArticleDetail(editorRef.current.innerHTML);
    }
  };

  const handleEditorInput = (e) => {
    setArticleDetail(e.currentTarget.innerHTML);
  };

  const validateForm = () => {
    let err = {};
    const titleTrimmed = articleTitle.trim();
    // 1. ชื่อบทความ: ห้ามว่าง, 10–100 ตัวอักษร (สามารถมีอักขระพิเศษได้)
    if (!titleTrimmed) {
      err.title = "กรุณาระบุชื่อบทความ";
    } else if (titleTrimmed.length < 10 || titleTrimmed.length > 100) {
      err.title = "ชื่อบทความต้องมีความยาว 10–100 ตัวอักษร";
    }

    // 2. รายละเอียดบทความ: ห้ามว่าง, Create: 50–2,500 ตัวอักษร, Edit: 20–2,500 ตัวอักษร
    const rawDetailText = articleDetail.replace(/<[^>]*>/g, "").trim();
    const minDetailLen = id ? 20 : 50;
    if (!rawDetailText) {
      err.detail = "กรุณาระบุเนื้อหาบทความ";
    } else if (rawDetailText.length < minDetailLen || rawDetailText.length > 2500) {
      err.detail = `เนื้อหาบทความต้องมีความยาว ${minDetailLen}–2,500 ตัวอักษร`;
    }

    // 3. หมวดหมู่บทความ: Dropdown ห้ามว่าง
    if (!articleCategory) {
      err.category = "กรุณาเลือกหมวดหมู่บทความ";
    }

    if (Object.keys(err).length > 0) {
      setErrors(err);
      if (id) {
        setStatusModal({
          isOpen: true,
          type: "warning",
          title: "กรุณากรอกข้อมูลให้ถูกต้องตามเงื่อนไข",
          message: "กรุณากรอกข้อมูลให้ถูกต้องตามเงื่อนไข (ชื่อบทความ 10–100 ตัวอักษร, รายละเอียด 20–2,500 ตัวอักษร)",
        });
      } else {
        setStatusModal({
          isOpen: true,
          type: "warning",
          title: "กรุณากรอกข้อมูลให้ครบถ้วน",
          message: "กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อบทความ 10–100 ตัวอักษร, รายละเอียด 50–2,500 ตัวอักษร)",
        });
      }
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!validateForm()) return;

    setIsSubmitting(true);
    setStatusModal({
      isOpen: true,
      type: "loading",
      title: id ? "กำลังบันทึกการแก้ไข..." : "กำลังบันทึกข้อมูล...",
      message: "กรุณารอสักครู่ ระบบกำลังประมวลผลข้อมูลบทความ",
    });

    try {
      let coverBase64 = "";
      if (coverImage) {
        coverBase64 =
          coverImage instanceof File
            ? await fileToBase64(coverImage)
            : coverImage;
      }

      const galleryBase64 = await Promise.all(
        articleImages.map(async (file) => {
          return file instanceof File ? await fileToBase64(file) : file;
        }),
      );

      const payload = {
        articleTitle: articleTitle.trim(),
        articleCategory: articleCategory || "ข่าวประชาสัมพันธ์",
        articleDetail: articleDetail,
        author: adminName,
        img: coverBase64,
        articleImages: JSON.stringify(galleryBase64),
        attachmentFiles: "[]",
      };

      if (id) {
        await axios.put(`/api/articles/${id}`, payload);
        clearArticleListCache();
        clearArticleDetailCache(id);
        clearAdminArticleCache();
        setIsSubmitting(false);
        setStatusModal({
          isOpen: true,
          type: "success",
          title: "แก้ไขข้อมูลบทความสำเร็จ",
          message: "ระบบได้บันทึกการแก้ไขบทความประชาสัมพันธ์เรียบร้อยแล้ว",
        });
      } else {
        await axios.post("/api/articles", payload);
        clearArticleListCache();
        clearAdminArticleCache();
        setIsSubmitting(false);
        setStatusModal({
          isOpen: true,
          type: "success",
          title: "สร้างบทความสำเร็จ",
          message: "ระบบได้เผยแพร่บทความประชาสัมพันธ์เรียบร้อยแล้ว",
        });
      }
    } catch (error) {
      console.error("ไม่สามารถบันทึกบทความได้", error);
      setIsSubmitting(false);
      const is400 = error.response && error.response.status === 400;
      if (id) {
        const errorMsg = is400
          ? (error.response?.data?.message || "กรุณากรอกข้อมูลให้ถูกต้องตามเงื่อนไข")
          : "ไม่สามารถแก้ไขข้อมูลบทความได้ กรุณาลองใหม่อีกครั้ง";
        setStatusModal({
          isOpen: true,
          type: is400 ? "warning" : "error",
          title: is400 ? "กรุณากรอกข้อมูลให้ถูกต้องตามเงื่อนไข" : "ไม่สามารถแก้ไขข้อมูลได้",
          message: errorMsg,
        });
      } else {
        const errorMsg = is400
          ? (error.response?.data?.message || "กรุณากรอกข้อมูลให้ครบถ้วน")
          : "สร้างบทความไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
        setStatusModal({
          isOpen: true,
          type: is400 ? "warning" : "error",
          title: is400 ? "กรุณากรอกข้อมูลให้ครบถ้วน" : "สร้างบทความไม่สำเร็จ",
          message: errorMsg,
        });
      }
    }
  };

  const renderImageSrc = (imgData) => {
    return normalizeImageSource(imgData);
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <AdminSidebar activeMenu="articles" />

      {/* Content */}
      <div className="main-content">
        <div className="gov-header">
          <h2>
            {id ? "แก้ไขบทความประชาสัมพันธ์" : "เขียนบทความประชาสัมพันธ์"}
          </h2>
          <p>ระบบบริหารจัดการข้อมูลสุขภาพ จังหวัดเชียงใหม่</p>
        </div>

        <div className="article-card">
          {/* Cover */}
          <label>รูปภาพหน้าปกบทความ (ว่างได้ ไม่เกิน 20MB)</label>
          <div className="cover-box-container">
            <label className="cover-box">
              {coverImage ? (
                <img src={renderImageSrc(coverImage)} alt="Cover Preview" />
              ) : (
                <>
                  <span>คลิกเพื่ออัปโหลดรูปหน้าปก</span>
                  <small>.png .jpg .jpeg ไม่เกิน 20MB</small>
                </>
              )}
              <input
                type="file"
                hidden
                accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                onChange={handleCoverUpload}
              />
            </label>
            {coverImage && (
              <button
                type="button"
                className="btn-remove-cover-image"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCoverImage(null);
                  setErrors((prev) => ({ ...prev, cover: "" }));
                }}
                title="ลบรูปภาพหน้าปก"
              >
                <FontAwesomeIcon icon={faTrashCan} />
              </button>
            )}
          </div>

          <label>หัวข้อบทความ (10-100 ตัวอักษร) *</label>
          <input
            className="gov-input-field"
            maxLength={100}
            value={articleTitle}
            onChange={(e) => setArticleTitle(e.target.value)}
            placeholder="ระบุหัวข้อบทความ..."
          />
          <div className="char-counter">{articleTitle.length}/100</div>

          <label>หมวดหมู่บทความ *</label>
          <select
            className="gov-input-field"
            value={articleCategory}
            onChange={(e) => setArticleCategory(e.target.value)}
          >
            <option value="ข่าวประชาสัมพันธ์">ข่าวประชาสัมพันธ์</option>
            <option value="กิจกรรมสุขภาพ">กิจกรรมสุขภาพ</option>
            <option value="โปรโมชั่น">โปรโมชั่น</option>
            <option value="บทความสุขภาพ">บทความสุขภาพ</option>
          </select>

          <label>รูปภาพประกอบ (ว่างได้ สูงสุด 4 รูป / รวมปกเป็น 5 รูป)</label>
          <div className="gallery">
            {[0, 1, 2, 3].map((index) => {
              const imageFile = articleImages[index];
              return (
                <div className="gallery-box" key={index}>
                  {imageFile ? (
                    <>
                      <img
                        src={renderImageSrc(imageFile)}
                        alt={`รูปประกอบที่ ${index + 1}`}
                      />
                      <button
                        type="button"
                        className="btn-remove-article-image"
                        onClick={() => handleRemoveArticleImage(index)}
                        title="ลบรูปภาพ"
                      >
                        <FontAwesomeIcon icon={faTrashCan} />
                      </button>
                    </>
                  ) : (
                    <label className="gallery-upload-label">
                      <FontAwesomeIcon icon={faPlus} />
                      <span>เพิ่มรูป</span>
                      <input
                        type="file"
                        hidden
                        multiple
                        accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                        onChange={handleImagesUpload}
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>

          <label>รายละเอียดบทความ (50-2,500 ตัวอักษร) *</label>

          <div className="toolbar">
            <button type="button" onClick={() => formatText("bold")}>
              <FontAwesomeIcon icon={faBold} />
            </button>
            <button type="button" onClick={() => formatText("italic")}>
              <FontAwesomeIcon icon={faItalic} />
            </button>
            <button type="button" onClick={() => formatText("underline")}>
              <FontAwesomeIcon icon={faUnderline} />
            </button>
          </div>

          <div
            ref={editorRef}
            className="article-editor"
            contentEditable
            suppressContentEditableWarning
            onInput={handleEditorInput}
          ></div>
          <div className="char-counter">
            {articleDetail.replace(/<[^>]*>/g, "").length}/2500
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate(-1)}
            >
              ยกเลิก
            </button>

            <button
              type="button"
              className="btn-save"
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={isSubmitting ? { opacity: 0.7, cursor: "not-allowed" } : {}}
            >
              {isSubmitting ? "กำลังบันทึก..." : (id ? "บันทึกการแก้ไข" : "เผยแพร่บทความ")}
            </button>
          </div>
        </div>
      </div>

      {/* 🏛️ ป๊อปอัปแจ้งเตือนสถานะสำหรับแอดมิน (Admin Status Modal) */}
      <AdminStatusModal
        isOpen={statusModal.isOpen}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        confirmText={statusModal.type === "success" ? "กลับสู่หน้ารายการ" : "ตกลง"}
        cancelText="ปิด"
        isEdit={!!id}
        onConfirm={() => {
          if (statusModal.type === "success") {
            setStatusModal((prev) => ({ ...prev, isOpen: false }));
            navigate("/listOfficialArticle");
          } else {
            setStatusModal((prev) => ({ ...prev, isOpen: false }));
          }
        }}
        onClose={() => setStatusModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

export default CreateOfficialArticle;