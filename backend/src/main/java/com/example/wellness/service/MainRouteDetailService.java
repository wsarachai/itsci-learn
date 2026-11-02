package com.example.wellness.service;

import com.example.wellness.dto.MainRouteDTO;
import com.example.wellness.model.MainRouteDetail;
import com.example.wellness.repository.MainRouteDetailRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MainRouteDetailService {

    private final MainRouteDetailRepository mainRouteDetailRepository;

    public MainRouteDetailService(MainRouteDetailRepository mainRouteDetailRepository) {
        this.mainRouteDetailRepository = mainRouteDetailRepository;
    }

    // ดึงรายการลำดับอำเภอที่จัดเรียงเรียบร้อยแล้วผ่านรหัสเส้นทางหลัก
    public List<MainRouteDetail> getDetailsByRouteId(Integer routeId) {
        return mainRouteDetailRepository.findByMainRouteRouteIdOrderByOrderNumberAsc(routeId);
    }

    /*

    ========= MOBILE ===================

     */



    public List<MainRouteDTO.RoutePointDTO> getRoutePoints(Integer routeId) {
        List<MainRouteDetail> details = mainRouteDetailRepository
                .findByMainRouteRouteIdOrderByOrderNumberAsc(routeId);

        return details.stream()
                .map(detail -> {
                    MainRouteDTO.RoutePointDTO point = new MainRouteDTO.RoutePointDTO();
                    point.setOrderNumber(detail.getOrderNumber());
                    if (detail.getDistrict() != null) {
                        point.setDistrictId(detail.getDistrict().getDistrictId());
                        point.setDistrictName(detail.getDistrict().getDistrictName());
                        point.setLatitude(detail.getDistrict().getLatitude());
                        point.setLongitude(detail.getDistrict().getLongitude());
                    }
                    return point;
                })
                .collect(Collectors.toList());
    }
}