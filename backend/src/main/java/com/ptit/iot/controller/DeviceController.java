package com.ptit.iot.controller;

import com.ptit.iot.dto.DeviceActionRequest;
import com.ptit.iot.dto.DeviceResponseDTO;
import com.ptit.iot.dto.PageResponse;
import com.ptit.iot.entity.HistoryActive;
import com.ptit.iot.service.DeviceService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class DeviceController {

    private final DeviceService deviceService;

    public DeviceController(DeviceService deviceService) {
        this.deviceService = deviceService;
    }

    @GetMapping("/devices")
    public ResponseEntity<List<DeviceResponseDTO>> getDevices() {
        return ResponseEntity.ok(deviceService.getAllDevicesWithStatus());
    }

    @PostMapping("/devices/{id}/action")
    public ResponseEntity<Map<String, Object>> controlDevice(
            @PathVariable int id,
            @RequestBody DeviceActionRequest request,
            Authentication authentication) {
        String action = request.getAction() != null ? request.getAction().toUpperCase() : "TURN_ON";
        boolean sent = deviceService.controlDevice(id, action, authentication.getName());
        return ResponseEntity.ok(Map.of(
                "success", sent,
                "message", sent ? "Lệnh điều khiển đã được gửi tới thiết bị!" : "Không thể gửi lệnh tới MQTT Broker!",
                "deviceId", id,
                "action", action
        ));
    }

    @PostMapping("/devices/all/action")
    public ResponseEntity<Map<String, Object>> controlAll(
            @RequestBody DeviceActionRequest request,
            Authentication authentication) {
        String action = request.getAction() != null ? request.getAction().toUpperCase() : "ALL_ON";
        boolean sent = deviceService.controlAllDevices(action, authentication.getName());
        return ResponseEntity.ok(Map.of(
                "success", sent,
                "message", sent ? "Lệnh điều khiển tất cả thiết bị đã được gửi!" : "Không thể gửi lệnh tới MQTT Broker!",
                "action", action
        ));
    }

    @GetMapping("/device-history")
    public ResponseEntity<PageResponse<HistoryActive>> getHistory(
            @RequestParam(required = false) Integer deviceId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(deviceService.searchHistory(deviceId, status, from, to, page, size));
    }
}

