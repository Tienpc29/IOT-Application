package com.ptit.iot.repository;

import com.ptit.iot.entity.SensorThreshold;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SensorThresholdRepository extends JpaRepository<SensorThreshold, Integer> {

    List<SensorThreshold> findAllByOrderBySensorIdAsc();

    Optional<SensorThreshold> findByDeviceId(Integer deviceId);
}
