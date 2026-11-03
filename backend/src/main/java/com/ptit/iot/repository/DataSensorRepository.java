package com.ptit.iot.repository;

import com.ptit.iot.entity.DataSensor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DataSensorRepository extends JpaRepository<DataSensor, Long> {

    Optional<DataSensor> findTopBySensorIdOrderByTimestampDesc(Integer sensorId);

    List<DataSensor> findTop20BySensorIdOrderByTimestampDesc(Integer sensorId);

    @Query("SELECT d FROM DataSensor d WHERE " +
           "(:sensorId IS NULL OR d.sensorId = :sensorId) AND " +
           "(:fromTime IS NULL OR d.timestamp >= :fromTime) AND " +
           "(:toTime IS NULL OR d.timestamp < :toTime)")
    Page<DataSensor> searchData(
            @Param("sensorId") Integer sensorId,
            @Param("fromTime") LocalDateTime fromTime,
            @Param("toTime") LocalDateTime toTime,
            Pageable pageable
    );
}

