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

export function toFormattedTimestamp(date = new Date()) {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const dayName = days[date.getDay()];
  const day = date.getDate();
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${dayName}, ${day} ${monthName} ${year} ${hours}.${minutes}.${seconds}`;
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
