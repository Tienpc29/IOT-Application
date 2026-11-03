package com.ptit.iot.controller;

import com.ptit.iot.dto.SensorThresholdRequest;
import com.ptit.iot.entity.SensorThreshold;
import com.ptit.iot.service.AutomationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/automation")
public class AutomationController {

    private final AutomationService automationService;

    public AutomationController(AutomationService automationService) {
        this.automationService = automationService;
    }

    @GetMapping("/thresholds")
    public ResponseEntity<List<SensorThreshold>> getThresholds() {
        return ResponseEntity.ok(automationService.getAll());
    }

    @PutMapping("/thresholds")
    public ResponseEntity<List<SensorThreshold>> updateThresholds(
            @RequestBody List<SensorThresholdRequest> requests) {
        try {
            return ResponseEntity.ok(automationService.update(requests));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }
}
