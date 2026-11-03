package com.ptit.iot.dto;

public class SensorThresholdRequest {
    private Integer sensorId;
    private Double threshold;

    public SensorThresholdRequest() {
    }

    public Integer getSensorId() {
        return sensorId;
    }

    public void setSensorId(Integer sensorId) {
        this.sensorId = sensorId;
    }

    public Double getThreshold() {
        return threshold;
    }

    public void setThreshold(Double threshold) {
        this.threshold = threshold;
    }
}
