package com.ptit.iot.repository;

import com.ptit.iot.entity.HistoryActive;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Optional;

@Repository
public interface HistoryActiveRepository extends JpaRepository<HistoryActive, Long> {

    Optional<HistoryActive> findTopByDeviceIdOrderByTimestampDesc(Integer deviceId);

    Optional<HistoryActive> findTopByDeviceIdAndStatusOrderByTimestampDesc(Integer deviceId, String status);

    Optional<HistoryActive> findTopByDeviceIdAndStatusInOrderByTimestampDesc(
            Integer deviceId, Collection<String> statuses);

    @Query("SELECT h FROM HistoryActive h WHERE " +
           "(:deviceId IS NULL OR h.deviceId = :deviceId) AND " +
           "(:status IS NULL OR LOWER(h.status) = LOWER(:status) OR LOWER(h.status) = LOWER(:altStatus)) AND " +
           "(:fromTime IS NULL OR h.timestamp >= :fromTime) AND " +
           "(:toTime IS NULL OR h.timestamp < :toTime)")
    Page<HistoryActive> searchHistory(
            @Param("deviceId") Integer deviceId,
            @Param("status") String status,
            @Param("altStatus") String altStatus,
            @Param("fromTime") LocalDateTime fromTime,
            @Param("toTime") LocalDateTime toTime,
            Pageable pageable
    );
}

