import { useEffect, useMemo, useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import Header from "../components/Header.jsx";
import Pagination from "../components/Pagination.jsx";
import CopyTimeButton from "../components/CopyTimeButton.jsx";
import api from "../services/api.js";
import {
  formatDateTime as formatDisplayDateTime,
  getDateTimeRange,
  matchesDateTimeQuery,
} from "../utils/dateTime.js";

const initial = { query: "", filter: "all" };

function formatId(id) {
  const n = Number(id);
  if (Number.isNaN(n)) return String(id ?? "");
  return n < 10 && n >= 0 ? `0${n}` : String(n);
}

function normalizeRecord(record) {
  const sensorId = Number(record.sensorId ?? record.sensor?.id);
  const typeById = { 1: "temperature", 2: "humidity", 3: "light" };
  const nameById = { 1: "Nhiệt độ", 2: "Độ ẩm", 3: "Ánh sáng" };

  return {
    id: record.id,
    sensorId,
    type: typeById[sensorId] || "unknown",
    sensorName: record.sensor?.name || nameById[sensorId] || "Cảm biến",
    value: record.value,
    time: record.timestamp,
  };
}

function getSensorId(filter) {
  return { temperature: 1, humidity: 2, light: 3 }[filter];
}

export default function DataSensor() {
  const [filters, setFilters] = useState(initial);
  const [applied, setApplied] = useState(initial);
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    const hasSearch = applied.query.trim().length > 0;
    const timeRange =
      applied.filter === "time" || applied.filter === "all"
        ? getDateTimeRange(applied.query)
        : null;
    const isServerTimeSearch = Boolean(timeRange);
    const params = {
      page: isServerTimeSearch ? page - 1 : hasSearch ? 0 : page - 1,
      size: isServerTimeSearch ? pageSize : hasSearch ? 1000 : pageSize,
    };
    const sensorId = getSensorId(applied.filter);
    if (sensorId) params.sensorId = sensorId;
    if (timeRange) {
      params.from = timeRange.from;
      params.to = timeRange.to;
    }

    api
      .getSensorData(params)
      .then((response) => {
        if (!active) return;
        const content = Array.isArray(response?.content)
          ? response.content.map(normalizeRecord)
          : [];
        setRecords(content);
        setTotalElements(Number(response?.totalElements) || 0);
        setTotalPages(
          hasSearch && !isServerTimeSearch
            ? Math.max(1, Math.ceil(content.length / pageSize))
            : Math.max(1, Number(response?.totalPages) || 1),
        );
      })
      .catch(() => {
        if (!active) return;
        setRecords([]);
        setError("Không thể tải dữ liệu từ backend.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, pageSize, applied.filter, applied.query]);

  const filtered = useMemo(() => {
    const query = applied.query.trim();
    if (!query) return records;

    const numericQuery = Number(query.replace(",", "."));
    const isNumericQuery = Number.isFinite(numericQuery);
    const decimals = query.includes(".")
      ? query.split(".")[1].length
      : query.includes(",")
        ? query.split(",")[1].length
        : 0;
    const bucketSize = decimals > 0 ? 10 ** -decimals : 1;
    const isTimeQuery = Boolean(getDateTimeRange(query));

    return records.filter((record) => {
      const matchesTime = matchesDateTimeQuery(record.time, query);
      const matchesValue = isNumericQuery
        ? Number(record.value) >= numericQuery &&
          Number(record.value) < numericQuery + bucketSize
        : String(record.value).toLowerCase().includes(query.toLowerCase());

      if (applied.filter === "time") return matchesTime;
      if (applied.filter === "all") {
        return isTimeQuery ? matchesTime : matchesValue;
      }
      return matchesValue;
    });
  }, [records, applied]);

  const isServerTimeSearch = Boolean(
    (applied.filter === "time" || applied.filter === "all") &&
      getDateTimeRange(applied.query),
  );
  const visible = applied.query && !isServerTimeSearch
    ? filtered.slice((page - 1) * pageSize, page * pageSize)
    : filtered;
  const visibleTotalPages = applied.query && !isServerTimeSearch
    ? Math.max(1, Math.ceil(filtered.length / pageSize))
    : totalPages;

  const update = (key, value) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const clear = () => {
    setFilters(initial);
    setApplied(initial);
    setPage(1);
  };

  return (
    <>
      <Header title="Data Sensor" subtitle="Lịch sử dữ liệu cảm biến" />
      <div className="panel">
        <form
          className="filter-bar sensor-filter"
          onSubmit={(event) => {
            event.preventDefault();
            setApplied(filters);
            setPage(1);
          }}
        >
          <div className="field search-field">
            <label>
              {filters.filter === "time" ? "Tìm theo thời gian" : "Tìm theo giá trị"}
            </label>
            <div className="input-icon">
              <Search size={17} />
              <input
                placeholder={
                  filters.filter === "time"
                    ? "yyyy, yyyy/mm, yyyy/mm/dd, ..."
                    : "Nhập giá trị"
                }
                value={filters.query}
                onChange={(event) => update("query", event.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label>Lọc theo</label>
            <select
              value={filters.filter}
              onChange={(event) => update("filter", event.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="temperature">Nhiệt độ</option>
              <option value="humidity">Độ ẩm</option>
              <option value="light">Ánh sáng</option>
              <option value="time">Thời gian</option>
            </select>
          </div>
          <button className="primary-btn" type="submit">
            <Search size={17} />
            Tìm kiếm
          </button>
          <button className="secondary-btn" type="button" onClick={clear}>
            <RotateCcw size={17} />
            Đặt lại
          </button>
        </form>
      </div>
      <div className="panel table-panel">
        <div className="table-title">
          <div>
            <h2>Dữ liệu cảm biến</h2>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Cảm biến</th>
                <th>Giá trị</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="empty">Đang tải dữ liệu...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="4" className="empty">{error}</td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty">Không có dữ liệu phù hợp</td>
                </tr>
              ) : (
                visible.map((record) => (
                  <tr key={record.id}>
                    <td>{formatId(record.id)}</td>
                    <td>{record.sensorName}</td>
                    <td className="value-cell">
                      {record.value}
                      {record.type === "temperature"
                        ? " °C"
                        : record.type === "humidity"
                          ? " %"
                          : " lux"}
                    </td>
                    <td>
                      <div className="time-cell">
                        <span>{formatDisplayDateTime(record.time)}</span>
                        <CopyTimeButton value={formatDisplayDateTime(record.time)} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <div className="table-total">
            <span>
              Tổng {isServerTimeSearch ? totalElements : applied.query ? filtered.length : totalElements} bản ghi
            </span>
            <span className="page-size-selector">
              <label htmlFor="sensor-page-size">Hiển thị:</label>
              <select
                id="sensor-page-size"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10 bản ghi/trang</option>
                <option value={20}>20 bản ghi/trang</option>
                <option value={50}>50 bản ghi/trang</option>
                <option value={100}>100 bản ghi/trang</option>
              </select>
            </span>
          </div>
          <Pagination page={page} totalPages={visibleTotalPages} onChange={setPage} />
          <div className="table-footer-space" />
        </div>
      </div>
    </>
  );
}
