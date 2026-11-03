package com.ptit.iot.service;

import com.ptit.iot.dto.DeviceResponseDTO;
import com.ptit.iot.dto.PageResponse;
import com.ptit.iot.entity.Device;
import com.ptit.iot.entity.HistoryActive;
import com.ptit.iot.entity.SensorThreshold;
import com.ptit.iot.repository.DeviceRepository;
import com.ptit.iot.repository.HistoryActiveRepository;
import com.ptit.iot.repository.SensorThresholdRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class DeviceService {

    private final DeviceRepository deviceRepository;
    private final HistoryActiveRepository historyActiveRepository;
    private final SensorThresholdRepository sensorThresholdRepository;
    private final MqttService mqttService;

    public DeviceService(DeviceRepository deviceRepository,
                         HistoryActiveRepository historyActiveRepository,
                         SensorThresholdRepository sensorThresholdRepository,
                         MqttService mqttService) {
        this.deviceRepository = deviceRepository;
        this.historyActiveRepository = historyActiveRepository;
        this.sensorThresholdRepository = sensorThresholdRepository;
        this.mqttService = mqttService;
    }

    public List<DeviceResponseDTO> getAllDevicesWithStatus() {
        List<Device> devices = deviceRepository.findAll();
        if (devices.isEmpty()) {
            devices = List.of(
                    new Device(1, "Đèn 1"),
                    new Device(2, "Đèn 2"),
                    new Device(3, "Đèn 3")
            );
        }

        List<DeviceResponseDTO> result = new ArrayList<>();
        for (Device d : devices) {
            Optional<HistoryActive> latest =
                    historyActiveRepository.findTopByDeviceIdAndStatusInOrderByTimestampDesc(
                            d.getId(), List.of("SUCCESS"));
            Optional<HistoryActive> pending =
                    historyActiveRepository.findTopByDeviceIdAndStatusOrderByTimestampDesc(
                            d.getId(), "PENDING");
            String status = "OFF";
            if (latest.isPresent()) {
                String action = latest.get().getAction().toUpperCase();
                if ("TURN_ON".equals(action) || "ALL_ON".equals(action)) {
                    status = "ON";
                }
            }
            result.add(new DeviceResponseDTO(
                    d.getId(),
                    d.getName(),
                    status,
                    pending.isPresent(),
                    pending.map(HistoryActive::getAction).orElse(null),
                    sensorThresholdRepository.findByDeviceId(d.getId())
                            .map(SensorThreshold::getBlinkCount)
                            .orElse(0L)));
        }
        return result;
    }

    public boolean controlDevice(int id, String action, String username) {
        return mqttService.sendDeviceControl(id, action, username);
    }

    public boolean controlAllDevices(String action, String username) {
        return mqttService.sendAllDevicesControl(action, username);
    }

    public PageResponse<HistoryActive> searchHistory(Integer deviceId, String status, LocalDateTime from, LocalDateTime to, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        
        String altStatus = null;
        if ("Thành công".equalsIgnoreCase(status)) {
            altStatus = "ON";
        } else if ("ON".equalsIgnoreCase(status)) {
            altStatus = "Thành công";
        }

        Page<HistoryActive> pageResult = historyActiveRepository.searchHistory(deviceId, status, altStatus, from, to, pageable);

        return new PageResponse<>(
                pageResult.getContent(),
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages()
        );
    }
}

