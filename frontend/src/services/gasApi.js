import { mapApiErrorMessage } from "../utils/errors";

export async function gasRequest({ apiUrl, body, token = "" }) {
  if (!apiUrl) {
    throw new Error("Konfigurasi API belum diatur. Isi VITE_GAS_API_URL.");
  }

  const payload = {
    ...body,
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };

  let response;
  try {
    response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Gagal terhubung ke server. Cek deploy GAS dan koneksi internet.");
  }

  let json;
  try {
    json = await response.json();
  } catch {
    throw new Error("Response server tidak valid JSON.");
  }

  if (!json || typeof json !== "object" || Array.isArray(json)) {
    throw new Error("Format response backend tidak valid.");
  }

  if (typeof json.success !== "boolean") {
    throw new Error("Format response backend tidak valid.");
  }

  if (!json.success) {
    throw new Error(mapApiErrorMessage(json.message, "Request gagal."));
  }

  return json.data;
}
