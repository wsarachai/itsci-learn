package com.example.wellness.repository;

import com.example.wellness.model.MainRouteDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MainRouteDetailRepository extends JpaRepository<MainRouteDetail, Integer> {
    
    // ค้นหารายละเอียดอำเภอทั้งหมดในเส้นทางนั้นๆ และสั่งเรียงลำดับ 1, 2, 3 ตามโครงสร้าง Order Number
    List<MainRouteDetail> findByMainRouteRouteIdOrderByOrderNumberAsc(Integer routeId);
}