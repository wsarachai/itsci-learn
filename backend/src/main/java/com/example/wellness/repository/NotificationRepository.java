package com.example.wellness.repository;

import com.example.wellness.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    List<Notification> findByAccountRequestRequestId(Integer requestId);

    boolean existsByAccountRequestRequestIdAndNotificationStatus(Integer requestId, String notificationStatus);
}
