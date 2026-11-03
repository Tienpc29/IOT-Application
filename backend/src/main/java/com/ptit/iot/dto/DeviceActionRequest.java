package com.ptit.iot.dto;

public class DeviceActionRequest {
    private String action; // "TURN_ON" or "TURN_OFF"
    private String username;

    public DeviceActionRequest() {
    }

    public DeviceActionRequest(String action) {
        this.action = action;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }
}

