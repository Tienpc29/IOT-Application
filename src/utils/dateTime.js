function parseDateTime(value) {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  const raw = String(value ?? "").trim();
  if (!raw) return null;

  // Support ISO values and backend timestamps with a space separator.
  const normalized = raw
    .replace(/^(\d{4})\/(\d{2})\/(\d{2})(\s+)/, "$1-$2-$3T")
    .replace(/^(\d{4}-\d{2}-\d{2})(\s+)/, "$1T");
  const date = new Date(normalized);
  return isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(value) {
  const date = parseDateTime(value);
  if (!date) return String(value ?? "");

  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");

  return `${yyyy}/${mm}/${dd} ${hh}:${minutes}:${ss}`;
}

function formatBackendDate(date) {
  const yyyy = String(date.getFullYear()).padStart(4, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${minutes}:${ss}`;
}

export function getDateTimeRange(query) {
  const raw = String(query ?? "")
    .trim()
    .replace(/[.-]/g, "/")
    .replace(/[tT]/g, " ")
    .replace(/\s+/g, " ");
  if (!raw) return null;

  const [dateText, timeText] = raw.split(" ");
  const dateParts = dateText.split("/");
  if (
    dateParts.length < 1 ||
    dateParts.length > 3 ||
    !/^\d{4}$/.test(dateParts[0]) ||
    dateParts.some((part) => !/^\d+$/.test(part))
  ) {
    return null;
  }

  const year = Number(dateParts[0]);
  const month = dateParts[1] ? Number(dateParts[1]) : 1;
  const day = dateParts[2] ? Number(dateParts[2]) : 1;
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) return null;

  const timeParts = timeText ? timeText.split(":") : [];
  if (timeParts.some((part) => !/^\d+$/.test(part)) || timeParts.length > 3) {
    return null;
  }

  const hour = timeParts[0] ? Number(timeParts[0]) : 0;
  const minute = timeParts[1] ? Number(timeParts[1]) : 0;
  const second = timeParts[2] ? Number(timeParts[2]) : 0;
  if (hour > 23 || minute > 59 || second > 59) return null;

  const start = new Date(year, month - 1, day, hour, minute, second);
  if (
    start.getFullYear() !== year ||
    start.getMonth() !== month - 1 ||
    start.getDate() !== day
  ) {
    return null;
  }

  const end = new Date(start);
  if (dateParts.length === 1) {
    end.setFullYear(year + 1, 0, 1);
  } else if (dateParts.length === 2) {
    end.setMonth(month, 1);
  } else if (!timeText) {
    end.setDate(day + 1);
  } else if (timeParts.length === 1) {
    end.setHours(hour + 1, 0, 0, 0);
  } else if (timeParts.length === 2) {
    end.setMinutes(minute + 1, 0, 0);
  } else {
    end.setSeconds(second + 1, 0);
  }

  return {
    from: formatBackendDate(start),
    to: formatBackendDate(end),
  };
}

export function matchesDateTimeQuery(value, query) {
  let normalizedQuery = String(query ?? "")
    .trim()
    .toLowerCase()
    .replace(/[.-]/g, "/")
    .replace(/[t]/g, " ")
    .replace(/\s+/g, " ");

  if (!normalizedQuery) return true;

  // Allow partial date/time input, for example:
  // 2026, 2026/10, 2026/10/27, 2026/10/27 16,
  // 2026/10/27 16:25, or the complete timestamp.
  const pieces = normalizedQuery.split(" ");
  const datePieces = pieces[0].split("/");
  if (
    datePieces.length <= 3 &&
    datePieces.length > 0 &&
    datePieces.every((piece) => /^\d+$/.test(piece))
  ) {
    normalizedQuery = datePieces
      .map((piece, index) =>
        index === 0 ? piece.padStart(4, "0") : piece.padStart(2, "0"),
      )
      .join("/");

    if (pieces[1]) {
      const timePieces = pieces[1].split(":");
      if (timePieces.every((piece) => /^\d+$/.test(piece))) {
        normalizedQuery += ` ${timePieces
          .map((piece) => piece.padStart(2, "0"))
          .join(":")}`;
      }
    }
  }

  const formattedValue = formatDateTime(value).toLowerCase();
  const rawValue = String(value ?? "").toLowerCase();
  return (
    formattedValue.includes(normalizedQuery) ||
    rawValue.includes(String(query).trim().toLowerCase())
  );
}
