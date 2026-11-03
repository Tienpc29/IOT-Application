package com.ptit.iot.dto;

public class DeviceResponseDTO {
    private Integer id;
    private String name;
    private String status; // "ON" or "OFF"
    private boolean pending;
    private String pendingAction;
    private Long blinkCount;

    public DeviceResponseDTO() {
    }

    public DeviceResponseDTO(Integer id, String name, String status) {
        this.id = id;
        this.name = name;
        this.status = status;
    }

    public DeviceResponseDTO(Integer id, String name, String status,
                             boolean pending, String pendingAction, Long blinkCount) {
        this.id = id;
        this.name = name;
        this.status = status;
        this.pending = pending;
        this.pendingAction = pendingAction;
        this.blinkCount = blinkCount == null ? 0L : blinkCount;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isPending() {
        return pending;
    }

    public void setPending(boolean pending) {
        this.pending = pending;
    }

    public String getPendingAction() {
        return pendingAction;
    }

    public void setPendingAction(String pendingAction) {
        this.pendingAction = pendingAction;
    }

    public Long getBlinkCount() {
        return blinkCount;
    }

    public void setBlinkCount(Long blinkCount) {
        this.blinkCount = blinkCount;
    }
}

