package com.ptit.iot.service;

import com.ptit.iot.dto.LatestSensorDTO;
import com.ptit.iot.dto.PageResponse;
import com.ptit.iot.entity.DataSensor;
import com.ptit.iot.repository.DataSensorRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class SensorService {

    private final DataSensorRepository dataSensorRepository;

    public SensorService(DataSensorRepository dataSensorRepository) {
        this.dataSensorRepository = dataSensorRepository;
    }

    public LatestSensorDTO getLatest() {
        Optional<DataSensor> temp = dataSensorRepository.findTopBySensorIdOrderByTimestampDesc(1);
        Optional<DataSensor> hum = dataSensorRepository.findTopBySensorIdOrderByTimestampDesc(2);
        Optional<DataSensor> light = dataSensorRepository.findTopBySensorIdOrderByTimestampDesc(3);

        Double tempVal = temp.map(DataSensor::getValue).orElse(28.0);
        Double humVal = hum.map(DataSensor::getValue).orElse(65.0);
        Double lightVal = light.map(DataSensor::getValue).orElse(500.0);

        LocalDateTime latestTime = LocalDateTime.now();
        if (temp.isPresent()) {
            latestTime = temp.get().getTimestamp();
        }

        return new LatestSensorDTO(tempVal, humVal, lightVal, latestTime);
    }

    public List<Map<String, Object>> getRecentChartData() {
        // Fetch top 15 records for each sensor
        List<DataSensor> temps = dataSensorRepository.findTop20BySensorIdOrderByTimestampDesc(1);
        List<DataSensor> hums = dataSensorRepository.findTop20BySensorIdOrderByTimestampDesc(2);
        List<DataSensor> lights = dataSensorRepository.findTop20BySensorIdOrderByTimestampDesc(3);

        Map<String, Map<String, Object>> grouped = new TreeMap<>();

        for (DataSensor d : temps) {
            String timeKey = d.getTimestamp().toString().substring(11, 19);
            grouped.computeIfAbsent(timeKey, k -> new HashMap<>()).put("temperature", d.getValue());
            grouped.get(timeKey).put("time", timeKey);
        }
        for (DataSensor d : hums) {
            String timeKey = d.getTimestamp().toString().substring(11, 19);
            grouped.computeIfAbsent(timeKey, k -> new HashMap<>()).put("humidity", d.getValue());
            grouped.get(timeKey).put("time", timeKey);
        }
        for (DataSensor d : lights) {
            String timeKey = d.getTimestamp().toString().substring(11, 19);
            grouped.computeIfAbsent(timeKey, k -> new HashMap<>()).put("light", d.getValue());
            grouped.get(timeKey).put("time", timeKey);
        }

        return new ArrayList<>(grouped.values());
    }

    public PageResponse<DataSensor> searchData(Integer sensorId, LocalDateTime from, LocalDateTime to, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        Page<DataSensor> pageResult = dataSensorRepository.searchData(sensorId, from, to, pageable);

        return new PageResponse<>(
                pageResult.getContent(),
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages()
        );
    }
}

