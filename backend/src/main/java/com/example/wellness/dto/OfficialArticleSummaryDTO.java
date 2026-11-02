package com.example.wellness.dto;

import java.time.LocalDateTime;

public class OfficialArticleSummaryDTO {
    private Integer articleId;
    private String articleTitle;
    private String articleDetail;
    private String author;
    private String articleCategory;
    private LocalDateTime publishDate;
    private String img;

    public OfficialArticleSummaryDTO() {
    }

    public OfficialArticleSummaryDTO(Integer articleId, String articleTitle, String articleDetail,
                                    String author, String articleCategory, LocalDateTime publishDate,
                                    String img) {
        this.articleId = articleId;
        this.articleTitle = articleTitle;
        this.articleDetail = articleDetail;
        this.author = author;
        this.articleCategory = articleCategory;
        this.publishDate = publishDate;
        this.img = img;
    }

    public Integer getArticleId() {
        return articleId;
    }

    public void setArticleId(Integer articleId) {
        this.articleId = articleId;
    }

    public String getArticleTitle() {
        return articleTitle;
    }

    public void setArticleTitle(String articleTitle) {
        this.articleTitle = articleTitle;
    }

    public String getArticleDetail() {
        return articleDetail;
    }

    public void setArticleDetail(String articleDetail) {
        this.articleDetail = articleDetail;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public String getArticleCategory() {
        return articleCategory;
    }

    public void setArticleCategory(String articleCategory) {
        this.articleCategory = articleCategory;
    }

    public LocalDateTime getPublishDate() {
        return publishDate;
    }

    public void setPublishDate(LocalDateTime publishDate) {
        this.publishDate = publishDate;
    }

    public String getImg() {
        return img;
    }

    public void setImg(String img) {
        this.img = img;
    }
}
