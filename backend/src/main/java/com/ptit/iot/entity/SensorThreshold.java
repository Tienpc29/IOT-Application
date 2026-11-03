package com.ptit.iot.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "sensor_threshold")
public class SensorThreshold {

    @Id
    @Column(name = "sensor_id")
    private Integer sensorId;

    @Column(name = "device_id", nullable = false)
    private Integer deviceId;

    @Column(nullable = false)
    private Double threshold;

    @Column(name = "blink_count", nullable = false)
    private Long blinkCount = 0L;

    @Column(name = "threshold_exceeded", nullable = false)
    private boolean thresholdExceeded;

    public SensorThreshold() {
    }

    public SensorThreshold(Integer sensorId, Integer deviceId, Double threshold) {
        this.sensorId = sensorId;
        this.deviceId = deviceId;
        this.threshold = threshold;
    }

    public Integer getSensorId() {
        return sensorId;
    }

    public void setSensorId(Integer sensorId) {
        this.sensorId = sensorId;
    }

    public Integer getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(Integer deviceId) {
        this.deviceId = deviceId;
    }

    public Double getThreshold() {
        return threshold;
    }

    public void setThreshold(Double threshold) {
        this.threshold = threshold;
    }

    public Long getBlinkCount() {
        return blinkCount;
    }

    public void setBlinkCount(Long blinkCount) {
        this.blinkCount = blinkCount;
    }

    public boolean isThresholdExceeded() {
        return thresholdExceeded;
    }

    public void setThresholdExceeded(boolean thresholdExceeded) {
        this.thresholdExceeded = thresholdExceeded;
    }
}
