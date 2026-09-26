const MONTH_MAP = {
  january: 0,
  januari: 0,
  february: 1,
  februari: 1,
  march: 2,
  maret: 2,
  april: 3,
  may: 4,
  mei: 4,
  june: 5,
  juni: 5,
  july: 6,
  juli: 6,
  august: 7,
  agustus: 7,
  september: 8,
  october: 9,
  oktober: 9,
  november: 10,
  december: 11,
  desember: 11,
};

export function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatShortDate(ts) {
  if (!(ts instanceof Date) || Number.isNaN(ts.getTime())) return "-";
  const dd = String(ts.getDate()).padStart(2, "0");
  const mm = String(ts.getMonth() + 1).padStart(2, "0");
  const hh = String(ts.getHours()).padStart(2, "0");
  const mi = String(ts.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} ${hh}:${mi}`;
}

export function formatTimestamp(ts) {
  if (!(ts instanceof Date) || Number.isNaN(ts.getTime())) return "-";
  const dd = String(ts.getDate()).padStart(2, "0");
  const mm = String(ts.getMonth() + 1).padStart(2, "0");
  const yyyy = ts.getFullYear();
  const hh = String(ts.getHours()).padStart(2, "0");
  const mi = String(ts.getMinutes()).padStart(2, "0");
  return `${dd}-${mm}-${yyyy} ${hh}.${mi}`;
}

export function parseLooseNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const cleaned = String(value).replace(/\s+/g, "").replace(/rp/gi, "");
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(cleaned)) {
    return Number(cleaned.replace(/\./g, "").replace(",", ".")) || 0;
  }
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(cleaned)) {
    return Number(cleaned.replace(/,/g, "")) || 0;
  }
  return Number(cleaned.replace(",", ".")) || 0;
}

export function parseTimestamp(value) {
  const text = String(value || "").trim();
  if (!text) return null;

  let match = text.match(/^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2})[:.](\d{2})[:.](\d{2}))?$/);
  if (match) {
    return new Date(
      Number(match[3]),
      Number(match[2]) - 1,
      Number(match[1]),
      Number(match[4] || 0),
      Number(match[5] || 0),
      Number(match[6] || 0),
    );
  }

  match = text.match(/^(?:[^,]+,\s*)?(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})(?:\s+(\d{1,2})[:.](\d{2})[:.](\d{2}))?$/i);
  if (match) {
    const month = MONTH_MAP[String(match[2]).toLowerCase()];
    if (month !== undefined) {
      return new Date(
        Number(match[3]),
        month,
        Number(match[1]),
        Number(match[4] || 0),
        Number(match[5] || 0),
        Number(match[6] || 0),
      );
    }
  }

  match = text.match(/^(?:[^,]+,\s*)?(\d{4})\s+([A-Za-z]+)\s+(\d{1,2})(?:\s+(\d{1,2})[:.](\d{2})[:.](\d{2}))?$/i);
  if (match) {
    const month = MONTH_MAP[String(match[2]).toLowerCase()];
    if (month !== undefined) {
      return new Date(
        Number(match[1]),
        month,
        Number(match[3]),
        Number(match[4] || 0),
        Number(match[5] || 0),
        Number(match[6] || 0),
      );
    }
  }

  const fallback = new Date(text);
  if (!Number.isNaN(fallback.getTime())) return fallback;
  return null;
}

export function toCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function toPeriodValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function generateTrxId(date = new Date(), prefixOrCounter = "TRX") {
  let d = date;
  if (typeof date === "string") {
    const parts = date.split("-");
    if (parts.length === 3) {
      d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else {
      d = new Date(date);
    }
  }
  const validDate = d instanceof Date && !Number.isNaN(d.getTime()) ? d : new Date();
  const year = validDate.getFullYear();
  const month = String(validDate.getMonth() + 1).padStart(2, "0");
  const day = String(validDate.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;

  // ponytail: legacy counter tetap TRX-YYYYMMDD-XXX.
  if (typeof prefixOrCounter === "number" || (typeof prefixOrCounter === "string" && /^\d+$/.test(prefixOrCounter.trim()))) {
    return `TRX-${dateStr}-${String(prefixOrCounter).padStart(3, "0")}`;
  }

  const rawPrefix = String(prefixOrCounter || "TRX").trim().toUpperCase();
  const prefix = /^[A-Z]{2,5}$/.test(rawPrefix) ? rawPrefix : "TRX";
  const hours = String(validDate.getHours()).padStart(2, "0");
  const minutes = String(validDate.getMinutes()).padStart(2, "0");
  const seconds = String(validDate.getSeconds()).padStart(2, "0");
  const entropy = Math.random().toString(36).substring(2, 6).toUpperCase().padEnd(4, "X");
  return `${prefix}-${dateStr}-${hours}${minutes}${seconds}-${entropy}`;
}

export function isExpenseId(id) {
  return String(id || "").toUpperCase().startsWith("EXP-");
}

export function toShortIndonesianDay(value) {
  const date = value instanceof Date ? value : parseTimestamp(value);
  if (!date) return String(value || "");
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
