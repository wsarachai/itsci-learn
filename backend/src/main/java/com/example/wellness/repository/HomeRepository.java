package com.example.wellness.repository;

import com.example.wellness.dto.OfficialArticleSummaryDTO;
import com.example.wellness.model.MainRoute;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Repository
public class HomeRepository {

    @PersistenceContext
    private EntityManager entityManager;

    /*
     * =====================================================
     * ส่วนที่ 1: ดึงเส้นทางแนะนำสำหรับหน้า Home
     * =====================================================
     *
     * ดึงไม่เกิน 6 เส้นทาง
     * เรียงตาม pinCount จากมากไปน้อย
     * ถ้า pinCount เป็น null ให้คิดเป็น 0
     * ถ้า pinCount เท่ากัน ให้เส้นทางที่สร้างล่าสุดขึ้นก่อน
     */
    public List<MainRoute> findRecommendedRoutes() {

        /*
         * ดึง routeId ก่อน เพื่อให้ LIMIT ทำงานก่อน JOIN details
         * ป้องกันปัญหาจำนวน Route ไม่ครบ 6 รายการ
         */
        List<Integer> routeIds = entityManager.createQuery("""
                        SELECT route.routeId
                        FROM MainRoute route
                        ORDER BY COALESCE(route.pinCount, 0) DESC,
                                 route.createdAt DESC,
                                 route.routeId DESC
                        """, Integer.class)
                .setMaxResults(6)
                .getResultList();

        if (routeIds.isEmpty()) {
            return Collections.emptyList();
        }

        /*
         * ดึงข้อมูลเส้นทาง พร้อมรายละเอียดเส้นทางและอำเภอ
         */
        List<MainRoute> routes = entityManager.createQuery("""
                        SELECT DISTINCT route
                        FROM MainRoute route
                        LEFT JOIN FETCH route.details detail
                        LEFT JOIN FETCH detail.district
                        LEFT JOIN FETCH route.categories cat
                        WHERE route.routeId IN :routeIds
                        """, MainRoute.class)
                .setParameter("routeIds", routeIds)
                .getResultList();

        /*
         * เนื่องจาก IN ไม่รับประกันลำดับข้อมูล
         * จึงเรียงกลับตามลำดับ routeIds ที่ดึงมาครั้งแรก
         */
        Map<Integer, MainRoute> routeMap = routes.stream()
                .collect(Collectors.toMap(
                        MainRoute::getRouteId,
                        Function.identity(),
                        (firstRoute, duplicateRoute) -> firstRoute
                ));

        List<MainRoute> orderedRoutes = new ArrayList<>();

        for (Integer routeId : routeIds) {
            MainRoute route = routeMap.get(routeId);

            if (route != null) {
                /*
                 * เรียงจุดในเส้นทางตาม orderNumber
                 */
                if (route.getDetails() != null) {
                    route.getDetails().sort((first, second) -> {
                        Integer firstOrder = first.getOrderNumber();
                        Integer secondOrder = second.getOrderNumber();

                        if (firstOrder == null && secondOrder == null) {
                            return 0;
                        }

                        if (firstOrder == null) {
                            return 1;
                        }

                        if (secondOrder == null) {
                            return -1;
                        }

                        return firstOrder.compareTo(secondOrder);
                    });
                }

                orderedRoutes.add(route);
            }
        }

        return orderedRoutes;
    }

    /*
     * =====================================================
     * ส่วนที่ 2: ดึงบทความล่าสุดสำหรับหน้า Home
     * =====================================================
     *
     * ดึงบทความไม่เกิน 6 รายการ
     * เรียงตามวันที่เผยแพร่จากใหม่ไปเก่า (SELECT เฉพาะฟิลด์แสดงผล ไม่ดึง articleImages)
     */
    public List<OfficialArticleSummaryDTO> findLatestArticles() {

        return entityManager.createQuery("""
                        SELECT new com.example.wellness.dto.OfficialArticleSummaryDTO(
                            article.articleId,
                            article.articleTitle,
                            article.articleDetail,
                            article.author,
                            article.articleCategory,
                            article.publishDate,
                            article.img
                        )
                        FROM OfficialArticle article
                        ORDER BY article.publishDate DESC,
                                 article.articleId DESC
                        """, OfficialArticleSummaryDTO.class)
                .setMaxResults(6)
                .getResultList();
    }

    /*
     * =====================================================
     * ส่วนที่ 3: ดึงเส้นทางทั้งหมด
     * =====================================================
     *
     * รองรับกรณีหน้า Home ต้องแสดงเส้นทางมากกว่า 6 รายการ
     * หรือใช้ต่อในหน้าเส้นทางท่องเที่ยวทั้งหมด
     */
    public List<MainRoute> findAllRoutes() {

        List<MainRoute> routes = entityManager.createQuery("""
                        SELECT DISTINCT route
                        FROM MainRoute route
                        LEFT JOIN FETCH route.details detail
                        LEFT JOIN FETCH detail.district
                        LEFT JOIN FETCH route.categories cat
                        ORDER BY route.createdAt DESC,
                                 route.routeId DESC
                        """, MainRoute.class)
                .getResultList();

        for (MainRoute route : routes) {
            if (route.getDetails() != null) {
                route.getDetails().sort((first, second) -> {
                    Integer firstOrder = first.getOrderNumber();
                    Integer secondOrder = second.getOrderNumber();

                    if (firstOrder == null && secondOrder == null) {
                        return 0;
                    }

                    if (firstOrder == null) {
                        return 1;
                    }

                    if (secondOrder == null) {
                        return -1;
                    }

                    return firstOrder.compareTo(secondOrder);
                });
            }
        }

        return routes;
    }

    /*
     * =====================================================
     * ส่วนที่ 4: ดึงบทความทั้งหมด (สำหรับหน้ารวมบทความ)
     * =====================================================
     */
    public List<OfficialArticleSummaryDTO> findAllArticles() {

        return entityManager.createQuery("""
                        SELECT new com.example.wellness.dto.OfficialArticleSummaryDTO(
                            article.articleId,
                            article.articleTitle,
                            article.articleDetail,
                            article.author,
                            article.articleCategory,
                            article.publishDate,
                            article.img
                        )
                        FROM OfficialArticle article
                        ORDER BY article.publishDate DESC,
                                 article.articleId DESC
                        """, OfficialArticleSummaryDTO.class)
                .getResultList();
    }
}