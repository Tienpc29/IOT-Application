import { useEffect, useMemo, useState } from "react";
import { Search, RotateCcw, Loader2 } from "lucide-react";
import Header from "../components/Header.jsx";
import Pagination from "../components/Pagination.jsx";
import CopyTimeButton from "../components/CopyTimeButton.jsx";
import api from "../services/api.js";
import {
  formatDateTime as formatDisplayDateTime,
  getDateTimeRange,
  matchesDateTimeQuery,
} from "../utils/dateTime.js";

const initial = { query: "", deviceId: "", action: "", status: "" };

function formatId(id) {
  const n = Number(id);
  if (Number.isNaN(n)) return String(id ?? "");
  return n < 10 && n >= 0 ? `0${n}` : String(n);
}

function normalizeHistory(record) {
  return {
    id: record.id,
    username: record.username || "-",
    deviceId: record.deviceId,
    deviceName: record.device?.name || `Đèn ${record.deviceId}`,
    action: record.action,
    status: record.status,
    time: record.timestamp,
  };
}

function displayAction(action) {
  const value = String(action || "").toUpperCase();
  if (value === "TURN_ON" || value === "ALL_ON" || value === "BẬT") return "Bật";
  if (value === "TURN_OFF" || value === "ALL_OFF" || value === "TẮT") return "Tắt";
  return action || "-";
}

function displayStatus(status) {
  const value = String(status || "").toUpperCase();
  if (value === "PENDING") return "Đang chờ xử lý";
  if (value === "FAILED" || value === "TIMEOUT" || value === "ERROR") return "Thất bại";
  if (value === "ON" || value === "OFF" || value === "SUCCESS") return "Thành công";
  return status || "-";
}

export default function ActiveHistory({ devices = [] }) {
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
    const timeRange = hasSearch ? getDateTimeRange(applied.query) : null;
    const hasClientFilters = Boolean(applied.action || applied.status);
    const isServerTimeSearch = Boolean(timeRange && !hasClientFilters);
    const params = {
      page: isServerTimeSearch ? page - 1 : hasSearch || hasClientFilters ? 0 : page - 1,
      size: isServerTimeSearch ? pageSize : hasSearch || hasClientFilters ? 1000 : pageSize,
    };
    if (applied.deviceId) params.deviceId = applied.deviceId;
    if (timeRange) {
      params.from = timeRange.from;
      params.to = timeRange.to;
    }

    api
      .getDeviceHistory(params)
      .then((response) => {
        if (!active) return;
        const content = Array.isArray(response?.content)
          ? response.content.map(normalizeHistory)
          : [];
        setRecords(content);
        setTotalElements(Number(response?.totalElements) || 0);
        setTotalPages(
          (hasSearch || hasClientFilters) && !isServerTimeSearch
            ? Math.max(1, Math.ceil(content.length / pageSize))
            : Math.max(1, Number(response?.totalPages) || 1),
        );
      })
      .catch(() => {
        if (!active) return;
        setRecords([]);
        setError("Không thể tải lịch sử từ backend.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [
    page,
    pageSize,
    applied.deviceId,
    applied.query,
    applied.action,
    applied.status,
  ]);

  const visible = useMemo(() => {
    return records.filter((record) => {
      const status = displayStatus(record.status);
      return (
        (!applied.query || matchesDateTimeQuery(record.time, applied.query)) &&
        (!applied.action || displayAction(record.action) === applied.action) &&
        (!applied.status || status === applied.status)
      );
    });
  }, [records, applied]);

  const isServerTimeSearch = Boolean(
    applied.query &&
      getDateTimeRange(applied.query) &&
      !applied.action &&
      !applied.status,
  );
  const hasClientFilters = Boolean(
    applied.query && !isServerTimeSearch || applied.action || applied.status,
  );
  const paginatedVisible = hasClientFilters
    ? visible.slice((page - 1) * pageSize, page * pageSize)
    : visible;
  const displayTotalPages = hasClientFilters
    ? Math.max(1, Math.ceil(visible.length / pageSize))
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
      <Header title="Active History" subtitle="Lịch sử hoạt động thiết bị" />
      <div className="panel">
        <form
          className="filter-bar history-filter"
          onSubmit={(event) => {
            event.preventDefault();
            setApplied(filters);
            setPage(1);
          }}
        >
          <div className="field search-field">
            <label>Tìm theo thời gian</label>
            <div className="input-icon">
              <Search size={17} />
              <input
                placeholder="yyyy, yyyy/mm, yyyy/mm/dd, ..."
                value={filters.query}
                onChange={(event) => update("query", event.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label>Thiết bị</label>
            <select
              value={filters.deviceId}
              onChange={(event) => update("deviceId", event.target.value)}
            >
              <option value="">Tất cả thiết bị</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Hành động</label>
            <select
              value={filters.action}
              onChange={(event) => update("action", event.target.value)}
            >
              <option value="">Tất cả hành động</option>
              <option value="Bật">Bật</option>
              <option value="Tắt">Tắt</option>
            </select>
          </div>
          <div className="field">
            <label>Trạng thái</label>
            <select
              value={filters.status}
              onChange={(event) => update("status", event.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Thành công">Thành công</option>
              <option value="Thất bại">Thất bại</option>
              <option value="Đang chờ xử lý">Đang chờ xử lý</option>
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
            <h2>Lịch sử thiết bị</h2>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Tên thiết bị</th>
                <th>Hành động</th>
                <th>Trạng thái</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="empty">Đang tải dữ liệu...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="6" className="empty">{error}</td>
                </tr>
              ) : paginatedVisible.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty">Chưa có lịch sử</td>
                </tr>
              ) : (
                paginatedVisible.map((record) => {
                  const status = displayStatus(record.status);
                  const isSuccess = status === "Thành công";
                  const isPending = status === "Đang chờ xử lý";
                  const statusClass = isSuccess ? "on" : isPending ? "pending" : "danger";
                  return (
                    <tr key={record.id}>
                      <td>{formatId(record.id)}</td>
                      <td>{record.username}</td>
                      <td>{record.deviceName}</td>
                      <td>{displayAction(record.action)}</td>
                      <td>
                        <span className={`status ${statusClass}`}>
                          {isPending && <Loader2 size={11} className="spin" />}
                          {status}
                        </span>
                      </td>
                      <td>
                        <div className="time-cell">
                          <span>{formatDisplayDateTime(record.time)}</span>
                          <CopyTimeButton value={formatDisplayDateTime(record.time)} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <div className="table-total">
            <span>Tổng {applied.query || applied.action || applied.status ? visible.length : totalElements} bản ghi</span>
            <span className="page-size-selector">
              <label htmlFor="history-page-size">Hiển thị:</label>
              <select
                id="history-page-size"
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
          <Pagination page={page} totalPages={displayTotalPages} onChange={setPage} alwaysShow />
          <div className="table-footer-space" />
        </div>
      </div>
    </>
  );
}
