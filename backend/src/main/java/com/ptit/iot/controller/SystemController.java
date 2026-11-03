package com.ptit.iot.controller;

import com.ptit.iot.service.MqttService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/system")
public class SystemController {

    private final MqttService mqttService;

    public SystemController(MqttService mqttService) {
        this.mqttService = mqttService;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        return ResponseEntity.ok(Map.of(
                "mqttConnected", mqttService.isMqttConnected(),
                "hardwareConnected", mqttService.isHardwareConnected(),
                "hardwareSeen", mqttService.hasReceivedSensorData(),
                "lastSensorMessageAt", mqttService.getLastSensorMessageAt()
        ));
    }
}
