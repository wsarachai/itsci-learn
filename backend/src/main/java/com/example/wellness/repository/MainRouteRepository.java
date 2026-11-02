package com.example.wellness.repository;

import com.example.wellness.model.MainRoute;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MainRouteRepository extends JpaRepository<MainRoute, Integer> {
    List<MainRoute> findTop6ByOrderByPinCountDesc();

    @Query("SELECT DISTINCT r FROM MainRoute r LEFT JOIN FETCH r.details d LEFT JOIN FETCH d.district LEFT JOIN FETCH r.categories c")
    List<MainRoute> findAllWithDetailsAndDistricts();

    @Query("SELECT DISTINCT r FROM MainRoute r LEFT JOIN FETCH r.details d LEFT JOIN FETCH d.district LEFT JOIN FETCH r.categories c WHERE r.routeId = :routeId")
    Optional<MainRoute> findByIdWithDetailsAndDistricts(@Param("routeId") Integer routeId);
}