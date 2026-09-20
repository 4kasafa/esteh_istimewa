import { mapApiErrorMessage } from "../utils/errors";

export async function gasRequest({ apiUrl, body, token = "" }) {
  const targetUrl = apiUrl || import.meta.env.VITE_GAS_API_URL;
  if (!targetUrl) {
    throw new Error("URL Google Apps Script (VITE_GAS_API_URL) belum dikonfigurasi.");
  }

  const payload = {
    ...body,
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };

  let response;
  try {
    response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    throw new Error(mapApiErrorMessage(err?.message, "Gagal terhubung ke backend Google Apps Script."));
  }

  let json;
  try {
    json = await response.json();
  } catch {
    throw new Error("Respons dari backend bukan JSON yang valid.");
  }

  if (!json || typeof json !== "object" || typeof json.success !== "boolean") {
    throw new Error("Format respons dari backend tidak valid.");
  }

  if (!json.success) {
    throw new Error(mapApiErrorMessage(json.message, "Permintaan gagal diproses."));
  }

  return json.data;
}
