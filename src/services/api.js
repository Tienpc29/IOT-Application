/**
 * API Service cho dự án IoT PTIT
 * Kết nối với Spring Boot Backend (http://localhost:8080/api)
 */

const API_BASE_URL = "http://localhost:8080/api";

async function request(endpoint, options = {}) {
  try {
    const token = localStorage.getItem("iot_token");
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
    });
    if (res.status === 401 && !endpoint.startsWith("/auth/login")) {
      localStorage.removeItem("iot_token");
      localStorage.setItem("iot_logged_in", "false");
      window.location.reload();
    }
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP Error ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.warn(`[API] Lỗi gọi ${endpoint}:`, error.message);
    throw error;
  }
}

export const api = {
  // 1. Xác thực (Auth)
  login: (username, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  logout: () =>
    request("/auth/logout", {
      method: "POST",
    }),

  // 2. Profile người dùng
  getProfile: (username = "admin") =>
    request(`/user/profile?username=${encodeURIComponent(username)}`),

  updateProfile: (data, username = "admin") =>
    request(`/user/profile?username=${encodeURIComponent(username)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // 3. Cảm biến (Sensor)
  getLatestSensors: () => request("/sensors/latest"),

  getSensorChart: () => request("/sensors/chart"),

  getSensorData: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/sensor-data${query ? `?${query}` : ""}`);
  },

  getSystemStatus: () => request("/system/status"),

  // 4. Thiết bị & Lịch sử (Devices & History)
  getDevices: () => request("/devices"),

  getAutomationThresholds: () => request("/automation/thresholds"),

  updateAutomationThresholds: (thresholds) =>
    request("/automation/thresholds", {
      method: "PUT",
      body: JSON.stringify(thresholds),
    }),

  controlDevice: (id, action, username) =>
    request(`/devices/${id}/action`, {
      method: "POST",
      body: JSON.stringify({ action, username }),
    }),

  controlAllDevices: (action, username) =>
    request("/devices/all/action", {
      method: "POST",
      body: JSON.stringify({ action, username }),
    }),

  getDeviceHistory: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/device-history${query ? `?${query}` : ""}`);
  },
};

export default api;

