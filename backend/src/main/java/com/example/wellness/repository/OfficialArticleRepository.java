package com.example.wellness.repository;

import com.example.wellness.dto.OfficialArticleSummaryDTO;
import com.example.wellness.model.OfficialArticle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OfficialArticleRepository extends JpaRepository<OfficialArticle, Integer> {

    List<OfficialArticle> findTop6ByOrderByPublishDateDesc();

    List<OfficialArticle> findAllByOrderByPublishDateDesc();

    @Query("""
            SELECT new com.example.wellness.dto.OfficialArticleSummaryDTO(
                a.articleId,
                a.articleTitle,
                a.articleDetail,
                a.author,
                a.articleCategory,
                a.publishDate,
                a.img
            )
            FROM OfficialArticle a
            ORDER BY a.publishDate DESC, a.articleId DESC
            """)
    List<OfficialArticleSummaryDTO> findAllSummaries();

    @Query("""
            SELECT new com.example.wellness.dto.OfficialArticleSummaryDTO(
                a.articleId,
                a.articleTitle,
                a.articleDetail,
                a.author,
                a.articleCategory,
                a.publishDate,
                a.img
            )
            FROM OfficialArticle a
            WHERE (:keyword IS NULL OR :keyword = '' OR LOWER(a.articleTitle) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(a.author) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND (:category IS NULL OR :category = '' OR a.articleCategory = :category)
            ORDER BY a.publishDate DESC, a.articleId DESC
            """)
    List<OfficialArticleSummaryDTO> searchArticleSummaries(@Param("keyword") String keyword, @Param("category") String category);

    @Query("SELECT a FROM OfficialArticle a WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR LOWER(a.articleTitle) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(a.author) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:category IS NULL OR :category = '' OR a.articleCategory = :category) " +
           "ORDER BY a.publishDate DESC, a.articleId DESC")
    List<OfficialArticle> searchArticles(@Param("keyword") String keyword, @Param("category") String category);
}