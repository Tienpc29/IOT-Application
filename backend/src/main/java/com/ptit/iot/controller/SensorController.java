package com.ptit.iot.controller;

import com.ptit.iot.dto.LatestSensorDTO;
import com.ptit.iot.dto.PageResponse;
import com.ptit.iot.entity.DataSensor;
import com.ptit.iot.service.SensorService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class SensorController {

    private final SensorService sensorService;

    public SensorController(SensorService sensorService) {
        this.sensorService = sensorService;
    }

    @GetMapping("/sensors/latest")
    public ResponseEntity<LatestSensorDTO> getLatest() {
        return ResponseEntity.ok(sensorService.getLatest());
    }

    @GetMapping("/sensors/chart")
    public ResponseEntity<List<Map<String, Object>>> getChartData() {
        return ResponseEntity.ok(sensorService.getRecentChartData());
    }

    @GetMapping("/sensor-data")
    public ResponseEntity<PageResponse<DataSensor>> getSensorData(
            @RequestParam(required = false) Integer sensorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(sensorService.searchData(sensorId, from, to, page, size));
    }
}

