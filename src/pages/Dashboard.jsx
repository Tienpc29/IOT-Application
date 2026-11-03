import { useEffect, useRef, useState } from "react";
import {
  Thermometer,
  Droplets,
  Lightbulb,
  Power,
  PowerOff,
  Loader2,
  Save,
  SlidersHorizontal,
} from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import Header from "../components/Header.jsx";
import api from "../services/api.js";
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
);
export default function Dashboard({
  devices,
  onToggle,
  onToggleAll,
  loadingMap = {},
}) {
  const [latest, setLatest] = useState({
    temperature: null,
    humidity: null,
    light: null,
  });
  const [chartRows, setChartRows] = useState([]);
  const [thresholds, setThresholds] = useState([
    { sensorId: 1, deviceId: 1, threshold: 35, blinkCount: 0 },
    { sensorId: 2, deviceId: 2, threshold: 80, blinkCount: 0 },
    { sensorId: 3, deviceId: 3, threshold: 700, blinkCount: 0 },
  ]);
  const [thresholdSaving, setThresholdSaving] = useState(false);
  const [thresholdMessage, setThresholdMessage] = useState("");
  const [blinkingDevices, setBlinkingDevices] = useState({});
  const blinkCountsRef = useRef(new Map());

  const thresholdMeta = {
    1: { label: "Nhiệt độ → Đèn 1", unit: "°C", kind: "temp" },
    2: { label: "Độ ẩm → Đèn 2", unit: "%", kind: "humidity" },
    3: { label: "Ánh sáng → Đèn 3", unit: "lux", kind: "light" },
  };

  useEffect(() => {
    let active = true;
    const loadSensorDataIndependently = async () => {
      const [latestResult, chartResult] = await Promise.allSettled([
        api.getLatestSensors(),
        api.getSensorChart(),
      ]);

      if (!active) return;

      if (latestResult.status === "fulfilled") {
        const latestData = latestResult.value;
        setLatest({
          temperature: latestData?.temperature ?? null,
          humidity: latestData?.humidity ?? null,
          light: latestData?.light ?? null,
        });
      } else {
        console.warn("[Dashboard] Không tải được dữ liệu cảm biến mới nhất:", latestResult.reason);
      }

      if (chartResult.status === "fulfilled") {
        const chartData = chartResult.value;
        if (Array.isArray(chartData)) setChartRows(chartData);
      } else {
        console.warn("[Dashboard] Không tải được dữ liệu biểu đồ:", chartResult.reason);
      }
    };
    const loadSensorData = async () => {
      try {
        const [latestData, chartData] = await Promise.all([
          api.getLatestSensors(),
          api.getSensorChart(),
        ]);
        if (!active) return;
        setLatest({
          temperature: latestData?.temperature ?? null,
          humidity: latestData?.humidity ?? null,
          light: latestData?.light ?? null,
        });
        setChartRows(Array.isArray(chartData) ? chartData : []);
      } catch {
        // Giữ dữ liệu hiện tại nếu backend tạm thời chưa phản hồi.
      }
    };
    loadSensorDataIndependently();
    const timer = setInterval(loadSensorDataIndependently, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!Array.isArray(devices)) return undefined;

    const changedIds = [];
    devices.forEach((device) => {
      const count = Number(device.blinkCount ?? 0);
      const previousCount = blinkCountsRef.current.get(device.id);
      if (previousCount !== undefined && count > previousCount) {
        changedIds.push(device.id);
      }
      blinkCountsRef.current.set(device.id, count);
    });

    if (changedIds.length === 0) return undefined;

    setBlinkingDevices((current) => {
      const next = { ...current };
      changedIds.forEach((id) => {
        next[id] = true;
      });
      return next;
    });

    const timer = window.setTimeout(() => {
      setBlinkingDevices((current) => {
        const next = { ...current };
        changedIds.forEach((id) => {
          delete next[id];
        });
        return next;
      });
    }, 1050);

    return () => window.clearTimeout(timer);
  }, [devices]);

  useEffect(() => {
    let active = true;
    api.getAutomationThresholds()
      .then((data) => {
        if (active && Array.isArray(data) && data.length > 0) {
          setThresholds(data);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const updateThreshold = (sensorId, value) => {
    setThresholds((current) => current.map((item) =>
      item.sensorId === sensorId ? { ...item, threshold: value } : item,
    ));
    setThresholdMessage("");
  };

  const saveThresholds = async (event) => {
    event.preventDefault();
    const payload = thresholds.map(({ sensorId, threshold }) => ({
      sensorId,
      threshold: Number(threshold),
    }));
    if (payload.some((item) => !Number.isFinite(item.threshold) || item.threshold < 0)) {
      setThresholdMessage("Vui lòng nhập ngưỡng hợp lệ (từ 0 trở lên).");
      return;
    }
    setThresholdSaving(true);
    setThresholdMessage("");
    try {
      const saved = await api.updateAutomationThresholds(payload);
      if (Array.isArray(saved)) setThresholds(saved);
      setThresholdMessage("Đã lưu ngưỡng tự động.");
    } catch (error) {
      setThresholdMessage(error.message || "Không thể lưu ngưỡng.");
    } finally {
      setThresholdSaving(false);
    }
  };

  // Làm mượt các đường dễ dao động để biểu đồ dễ quan sát hơn.
  // Giá trị gốc trong database và giá trị mới nhất vẫn giữ nguyên.
  const smoothSeries = (key, alpha = 0.25) => {
    const result = [];
    let previous = null;

    for (const row of chartRows) {
      const value = Number(row[key]);
      if (!Number.isFinite(value)) {
        result.push(null);
        continue;
      }

      previous = previous === null ? value : previous * (1 - alpha) + value * alpha;
      result.push(Number(previous.toFixed(1)));
    }

    return result;
  };

  const smoothedHumidity = smoothSeries("humidity", 0.2);

  /*
  for (const row of chartRows) {
    const value = Number(row.light);
    if (!Number.isFinite(value)) {
      smoothedLight.push(null);
      continue;
    }

    // Alpha 0.25 giúp đường biểu đồ ổn định nhưng vẫn phản ứng với thay đổi thật.
    previousLight =
      previousLight === null ? value : previousLight * 0.75 + value * 0.25;
    smoothedLight.push(Number(previousLight.toFixed(1)));
  }
  */

  const data = {
    labels: chartRows.map((r) => r.time),
    datasets: [
      {
        label: "Nhiệt độ (°C)",
        data: chartRows.map((r) => r.temperature),
        yAxisID: "temperature",
        borderColor: "#3894da",
        backgroundColor: "rgba(53,166,255,.08)",
        tension: 0.35,
        pointRadius: 2,
        pointHoverRadius: 5,
      },
      {
        label: "Độ ẩm (%)",
        data: smoothedHumidity,
        yAxisID: "humidity",
        borderColor: "#48926d",
        backgroundColor: "rgba(68,217,146,.08)",
        tension: 0.35,
        pointRadius: 2,
        pointHoverRadius: 5,
      },
      {
        label: "Ánh sáng (lux)",
        data: chartRows.map((r) => r.light),
        yAxisID: "light",
        borderColor: "#ffd65a",
        backgroundColor: "rgba(255,214,90,.08)",
        tension: 0.35,
        pointRadius: 2,
        pointHoverRadius: 5,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: "index",
    },
    hover: {
      intersect: false,
      mode: "index",
    },
    plugins: {
      tooltip: {
        enabled: true,
        backgroundColor: "rgba(10, 24, 38, 0.94)",
        titleColor: "#dbe4eb",
        bodyColor: "#c9dbe9",
        borderColor: "#22405c",
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          title: function (items) {
            return `Thời gian: ${items[0]?.label || ""}`;
          },
          label: function (context) {
            let label = context.dataset.label || "";
            let val = context.parsed.y;
            if (val === null || val === undefined) return label;
            return `  ${label}: ${val}`;
          },
        },
      },
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { color: "rgba(82,107,130,.12)" },
        ticks: { color: "#16191c", maxTicksLimit: 8 },
      },
      temperature: {
        type: "linear",
        position: "left",
        min: 0,
        max: 100,
        title: { display: true, text: "°C", color: "#1a8ed1" },
        grid: { color: "rgba(26, 126, 197, 0.14)" },
        ticks: { color: "#0e7cd6", stepSize: 10 },
      },
      humidity: {
        type: "linear",
        position: "right",
        min: 0,
        max: 100,
        title: { display: true, text: "%", color: "#1caa6a" },
        grid: { drawOnChartArea: false },
        ticks: { color: "#1caa6a", stepSize: 10 },
      },
      light: {
        type: "linear",
        position: "right",
        offset: true,
        min: 0,
        max: 1000,
        title: { display: true, text: "lux", color: "#eebc35" },
        grid: { drawOnChartArea: false },
        ticks: { color: "#f0aa08", stepSize: 100 },
      },
    },
  };

  const allOn =
    Array.isArray(devices) &&
    devices.length > 0 &&
    devices.every((d) => d.status === "ON") &&
    !devices.some((d) => d.pending);
  const allOff =
    Array.isArray(devices) &&
    devices.length > 0 &&
    devices.every((d) => d.status === "OFF") &&
    !devices.some((d) => d.pending);
  const hasPendingDevice = Array.isArray(devices) && devices.some((d) => d.pending);

  const isBtnOnGreen = !allOn;
  const isBtnOffGreen = !allOff;

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Theo dõi dữ liệu cảm biến và điều khiển thiết bị"
      />
      <section className="metric-grid">
        <Metric
          icon={<Thermometer />}
          label="Nhiệt độ"
          value={latest.temperature}
          unit="°C"
          kind="temp"
        />
        <Metric
          icon={<Droplets />}
          label="Độ ẩm"
          value={latest.humidity}
          unit="%"
          kind="humidity"
        />
        <Metric
          icon={<Lightbulb />}
          label="Ánh sáng"
          value={latest.light}
          unit=" lux"
          kind="light"
        />
      </section>
      <section className="dashboard-grid">
        <div className="panel chart-panel">
          <div className="panel-head">
            <div>
              <h2>Biểu đồ dữ liệu theo thời gian</h2>
              <p>
                <span style={{ color: "#3b91d7", fontWeight: 600 }}>
                  Nhiệt độ (°C)
                </span>{" "}
                &nbsp;·&nbsp;{" "}
                <span style={{ color: "#19a262", fontWeight: 600 }}>
                  Độ ẩm (%)
                </span>{" "}
                &nbsp;·&nbsp;{" "}
                <span style={{ color: "#deb94d", fontWeight: 600 }}>
                  Ánh sáng (lux)
                </span>
              </p>
            </div>
          </div>
          <div className="chart-wrap">
            <Line data={data} options={options} />
          </div>
        </div>
        <div className="panel devices-panel">
          <div className="panel-head">
            <div>
              <h2>Điều khiển thiết bị</h2>
            </div>
          </div>
          <div className="all-devices-bar">
            <button
              className={`btn-all ${isBtnOnGreen ? "btn-green" : "btn-gray"} ${loadingMap.all === "ON" ? "loading" : ""}`}
              onClick={() => onToggleAll && onToggleAll("ON")}
              disabled={Boolean(
                allOn || hasPendingDevice || loadingMap.all || Object.keys(loadingMap).length > 0,
              )}
              type="button"
              title={allOn ? "Tất cả đèn đã được bật" : "Bật tất cả 3 đèn"}
            >
              {loadingMap.all === "ON" ? (
                <>
                  <Loader2 size={15} className="spin" /> Đang bật...
                </>
              ) : (
                <>
                  <Power size={15} /> Bật tất cả
                </>
              )}
            </button>
            <button
              className={`btn-all ${isBtnOffGreen ? "btn-green" : "btn-gray"} ${loadingMap.all === "OFF" ? "loading" : ""}`}
              onClick={() => onToggleAll && onToggleAll("OFF")}
              disabled={Boolean(
                allOff || hasPendingDevice || loadingMap.all || Object.keys(loadingMap).length > 0,
              )}
              type="button"
              title={allOff ? "Tất cả đèn đã được tắt" : "Tắt tất cả 3 đèn"}
            >
              {loadingMap.all === "OFF" ? (
                <>
                  <Loader2 size={15} className="spin" /> Đang tắt...
                </>
              ) : (
                <>
                  <PowerOff size={15} /> Tắt tất cả
                </>
              )}
            </button>
          </div>
          <div className="device-list">
            {devices.map((d) => {
              const pendingStatus =
                d.pendingAction === "TURN_ON" ? "ON" :
                d.pendingAction === "TURN_OFF" ? "OFF" : d.status;
              const isLoading = Boolean(loadingMap[d.id] || loadingMap.all || d.pending);
              return (
                <div
                  className={`device-row ${isLoading ? "is-loading" : ""}`}
                  key={d.id}
                >
                  <div
                    className={`device-bulb ${pendingStatus === "ON" ? "on" : "off"} ${isLoading ? "loading" : ""} ${blinkingDevices[d.id] ? "threshold-blinking" : ""}`}
                    aria-label={`${d.name} ${pendingStatus}`}
                  >
                    <Lightbulb size={23} />
                  </div>
                  <div className="device-info">
                    <strong>{d.name}</strong>
                    <small className="blink-count">Nháy tự động: {d.blinkCount ?? 0}</small>
                    {isLoading ? (
                      <span className="status pending loading">
                        <Loader2 size={11} className="spin" /> Đang chờ xử lý
                      </span>
                    ) : (
                      <span
                        className={`status ${pendingStatus === "ON" ? "on" : "off"}`}
                      >
                        {d.status}
                      </span>
                    )}
                  </div>
                  <button
                    className={`switch ${pendingStatus === "ON" ? "on" : ""} ${isLoading ? "loading" : ""}`}
                    onClick={() => onToggle(d.id)}
                    disabled={isLoading}
                    aria-label={`Chuyển ${d.name} sang ${pendingStatus === "ON" ? "tắt" : "bật"}`}
                  >
                    <span>
                      {isLoading && (
                        <Loader2
                          size={12}
                          className="spin switch-loader-icon"
                        />
                      )}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <section className="panel automation-panel">
        <div className="panel-head">
          <div>
            <h2><SlidersHorizontal size={17} /> Ngưỡng tự động & số lần nháy</h2>
            <p>Mỗi lần cập nhật sau 2 giây, nếu cảm biến vẫn vượt ngưỡng và đèn đang bật thì đèn sẽ nháy trong 1 giây và tăng bộ đếm.</p>
          </div>
        </div>
        <form className="threshold-form" onSubmit={saveThresholds}>
          {thresholds.map((item) => {
            const meta = thresholdMeta[item.sensorId] || thresholdMeta[1];
            const device = devices.find((deviceItem) => deviceItem.id === item.deviceId);
            return (
              <div className={`threshold-card ${meta.kind}`} key={item.sensorId}>
                <label htmlFor={`threshold-${item.sensorId}`}>{meta.label}</label>
                <div className="threshold-input-row">
                  <input
                    id={`threshold-${item.sensorId}`}
                    type="number"
                    min="0"
                    step="0.1"
                    value={item.threshold ?? ""}
                    onChange={(event) => updateThreshold(item.sensorId, event.target.value)}
                  />
                  <span>{meta.unit}</span>
                </div>
                <small>
                  {device?.name || `Đèn ${item.deviceId}`} · Đã nháy: <strong>{device?.blinkCount ?? item.blinkCount ?? 0}</strong> lần
                </small>
              </div>
            );
          })}
          <div className="threshold-actions">
            <button className="auth-btn" type="submit" disabled={thresholdSaving}>
              {thresholdSaving ? <Loader2 size={15} className="spin" /> : <Save size={15} />}
              {thresholdSaving ? "Đang lưu..." : "Lưu ngưỡng"}
            </button>
            {thresholdMessage && <span className="threshold-message">{thresholdMessage}</span>}
          </div>
        </form>
      </section>
    </>
  );
}
function Metric({ icon, label, value, unit, kind }) {
  return (
    <div className={`metric-card ${kind}`}>
      <div className="metric-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>
          {value === null || value === undefined ? "--" : value}
          <small>{unit}</small>
        </strong>
      </div>
    </div>
  );
}
