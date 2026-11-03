import { useEffect, useState } from "react";
import { NavLink, Routes, Route } from "react-router-dom";
import {
  Wifi,
  WifiOff,
  LayoutDashboard,
  Database,
  History,
  UserRound,
} from "lucide-react";
import Dashboard from "./pages/Dashboard.jsx";
import DataSensor from "./pages/DataSensor.jsx";
import ActiveHistory from "./pages/ActiveHistory.jsx";
import Profile from "./pages/Profile.jsx";
import Login from "./pages/Login.jsx";
import {
  initialDevices,
  getRealtimeHistory,
} from "./data/mockData.js";
import api from "./services/api.js";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <Wifi size={25} />
        </div>
        <div>
          <strong>IOT</strong>
          <span>và ứng dụng</span>
        </div>
      </div>
      <nav className="nav-list">
        <NavLink to="/" end>
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>
        <NavLink to="/data-sensor">
          <Database size={20} />
          Data Sensor
        </NavLink>
        <NavLink to="/active-history">
          <History size={20} />
          Active History
        </NavLink>
        <NavLink to="/profile">
          <UserRound size={20} />
          Profile
        </NavLink>
      </nav>
    </aside>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(
    () => Boolean(localStorage.getItem("iot_token")),
  );
  const [currentUsername, setCurrentUsername] = useState(
    () => localStorage.getItem("iot_username") || "admin",
  );
  const [devices, setDevices] = useState(
    () =>
      JSON.parse(localStorage.getItem("iot_devices") || "null") ||
      initialDevices,
  );
  const [loadingMap, setLoadingMap] = useState({});
  const [connectionNotice, setConnectionNotice] = useState("");
  const [history, setHistory] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("iot_history") || "null");
      if (
        Array.isArray(saved) &&
        saved.length > 0 &&
        !saved.some((x) => Number(x.id) > 100000)
      ) {
        let list = saved;
        const hasPending = list.some(
          (x) =>
            String(x.status).toLowerCase() === "pending" ||
            String(x.status) === "Đang chờ xử lý",
        );
        if (!hasPending && list.length >= 2) {
          list = list.map((item, idx) =>
            idx === 1 ? { ...item, status: "Đang chờ xử lý" } : item,
          );
        }
        const lastSaved = new Date(
          list[0]?.time || list[list.length - 1]?.time,
        ).getTime();
        if (Date.now() - lastSaved > 86400000) {
          const offset = Date.now() - lastSaved;
          return list.map((h) => ({
            ...h,
            time: new Date(new Date(h.time).getTime() + offset).toISOString(),
          }));
        }
        return list;
      }
    } catch {}
    return getRealtimeHistory();
  });
  useEffect(
    () => localStorage.setItem("iot_devices", JSON.stringify(devices)),
    [devices],
  );
  useEffect(
    () => localStorage.setItem("iot_history", JSON.stringify(history)),
    [history],
  );

  useEffect(() => {
    if (!loggedIn) return;

    // Sync initial device status from backend if available
    api.getDevices()
      .then((devs) => {
        if (Array.isArray(devs) && devs.length > 0) {
          setDevices(devs);
        }
      })
      .catch(() => {});
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn) return undefined;

    let active = true;
    const checkConnection = async () => {
      try {
        const status = await api.getSystemStatus();
        if (!active) return;

        if (!status?.mqttConnected) {
          setConnectionNotice("Mất kết nối MQTT Broker");
        } else if (!status?.hardwareSeen) {
          setConnectionNotice("Đang chờ kết nối phần cứng");
        } else if (!status?.hardwareConnected) {
          setConnectionNotice("Mất kết nối phần cứng");
        } else if (status?.hardwareConnected) {
          setConnectionNotice("");
        } else {
          setConnectionNotice("Mất kết nối phần cứng");
        }

        if (Object.keys(loadingMap).length === 0) {
          const currentDevices = await api.getDevices();
          if (active && Array.isArray(currentDevices) && currentDevices.length > 0) {
            setDevices(currentDevices);
          }
        }
      } catch {
        if (active) setConnectionNotice("Không kết nối được backend");
      }
    };

    checkConnection();
    const timer = window.setInterval(checkConnection, 3000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [loggedIn, loadingMap]);

  const handleLogin = (user, token) => {
    const username = String(user?.username || "admin").trim() || "admin";
    if (token) localStorage.setItem("iot_token", token);
    localStorage.setItem("iot_logged_in", "true");
    localStorage.setItem("iot_username", username);
    setCurrentUsername(username);
    setLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.setItem("iot_logged_in", "false");
    localStorage.removeItem("iot_username");
    localStorage.removeItem("iot_token");
    setLoggedIn(false);
  };

  const updateLocalHistoryStatus = (recordIds, status) => {
    setHistory((current) =>
      current.map((item) =>
        recordIds.includes(item.id) ? { ...item, status } : item,
      ),
    );
  };

  const waitForDeviceFeedback = (
    deviceIds,
    targetStatus,
    recordIds,
    originalStatuses,
  ) => {
    const deadline = Date.now() + 10000;
    let latestDevices = null;

    const poll = async () => {
      try {
        const currentDevices = await api.getDevices();
        if (Array.isArray(currentDevices) && currentDevices.length > 0) {
          latestDevices = currentDevices;
          setDevices((current) =>
            currentDevices.map((device) => {
              if (!deviceIds.includes(device.id)) return device;

              const feedbackReceived = device.status === targetStatus;
              return feedbackReceived
                ? device
                : { ...device, status: targetStatus };
            }),
          );
          const reached = deviceIds.every((id) =>
            currentDevices.some(
              (device) => device.id === id && device.status === targetStatus,
            ),
          );

          if (reached) {
            updateLocalHistoryStatus(recordIds, "SUCCESS");
            setLoadingMap({});
            return;
          }
        }
      } catch {
        // Tiếp tục chờ đến hết timeout nếu backend/hardware chưa phản hồi.
      }

      if (Date.now() >= deadline) {
        setDevices((current) =>
          current.map((device) => {
            if (!deviceIds.includes(device.id)) return device;

            const feedback = latestDevices?.find((item) => item.id === device.id);
            const receivedFeedback = feedback?.status === targetStatus;
            return receivedFeedback
              ? { ...device, status: targetStatus }
              : {
                  ...device,
                  status: originalStatuses?.[device.id] ?? device.status,
                };
          }),
        );
        updateLocalHistoryStatus(recordIds, "FAILED");
        setLoadingMap({});
        return;
      }

      window.setTimeout(poll, 1000);
    };

    poll();
  };

  const toggleDevice = (id) => {
    if (loadingMap[id] || loadingMap.all) return;

    const d = devices.find((x) => x.id === id);
    if (!d) return;
    const nextStatus = d.status === "ON" ? "OFF" : "ON";

    setLoadingMap((v) => ({ ...v, [id]: true }));
    setDevices((current) =>
      current.map((device) =>
        device.id === id ? { ...device, status: nextStatus } : device,
      ),
    );

    const recordId = Date.now();
    setHistory((v) => {
      return [
        {
          id: recordId,
          username: currentUsername,
          deviceId: id,
          deviceName: d.name,
          action: nextStatus === "ON" ? "TURN_ON" : "TURN_OFF",
          status: "PENDING",
          time: new Date().toISOString(),
        },
        ...v,
      ];
    });

    api.controlDevice(
      id,
      nextStatus === "ON" ? "TURN_ON" : "TURN_OFF",
      currentUsername,
    ).catch(() => null);
    waitForDeviceFeedback([id], nextStatus, [recordId], { [id]: d.status });
  };

  const toggleAllDevices = (targetStatus) => {
    if (loadingMap.all) return;
    const toChange = devices.filter((x) => x.status !== targetStatus);
    if (toChange.length === 0) return;

    const newLoading = { all: targetStatus };
    toChange.forEach((d) => {
      newLoading[d.id] = true;
    });
    setLoadingMap(newLoading);
    setDevices((current) =>
      current.map((device) =>
        toChange.some((item) => item.id === device.id)
          ? { ...device, status: targetStatus }
          : device,
      ),
    );

    const recordIds = toChange.map((d, index) => Date.now() + index);
    const originalStatuses = Object.fromEntries(
      toChange.map((device) => [device.id, device.status]),
    );
    setHistory((v) => {
      const now = new Date();
      const entries = toChange.map((d, idx) => {
        const id = recordIds[idx];
        return {
          id,
          username: currentUsername,
          deviceId: d.id,
          deviceName: d.name,
          action: targetStatus === "ON" ? "ALL_ON" : "ALL_OFF",
          status: "PENDING",
          time: now.toISOString(),
        };
      });
      return [...entries, ...v];
    });

    api.controlAllDevices(
      targetStatus === "ON" ? "ALL_ON" : "ALL_OFF",
      currentUsername,
    ).catch(() => null);
    waitForDeviceFeedback(
      toChange.map((device) => device.id),
      targetStatus,
      recordIds,
      originalStatuses,
    );
  };
  if (!loggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      {connectionNotice && (
        <div className="app-toast error" role="status">
          <WifiOff size={16} />
          <span>{connectionNotice}</span>
        </div>
      )}
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                devices={devices}
                onToggle={toggleDevice}
                onToggleAll={toggleAllDevices}
                loadingMap={loadingMap}
              />
            }
          />
          <Route
            path="/data-sensor"
            element={<DataSensor />}
          />
          <Route
            path="/active-history"
            element={<ActiveHistory devices={devices} />}
          />
          <Route
            path="/profile"
            element={<Profile onLogout={handleLogout} username={currentUsername} />}
          />
        </Routes>
      </main>
    </div>
  );
}
