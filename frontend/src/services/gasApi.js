import { mapApiErrorMessage } from "../utils/errors";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function gasRequest({ apiUrl, body, token = "" }) {
  const targetUrl = apiUrl || import.meta.env.VITE_GAS_API_URL;
  if (!targetUrl) {
    throw new Error("URL Google Apps Script (VITE_GAS_API_URL) belum dikonfigurasi.");
  }

  const payload = {
    ...body,
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };

  // ponytail: retry hanya untuk BACA (transient GAS: cold-start / throttle HTML).
  // TULIS (create/update/delete) 1 attempt saja — retry tulis = duplikat data,
  // karena attempt-1 bisa saja sudah tersimpan padahal responsnya hilang.
  // Error level aplikasi (!json.success) tidak di-retry.
  const action = String(body?.action || "").toLowerCase();
  const isWrite = /^(create|update|delete|refresh_rekap|setup_rekap|sync_|fix_|cleanup_|reset_|clean_)/.test(action);
  const maxAttempts = isWrite ? 1 : 2;
  const timeoutMs = isWrite ? 55000 : 25000;
  // ponytail: ukur waktu per request agar keluhan "lama" bisa dibuktikan
  // angkanya (eksekusi GAS vs transfer+parse ada di sini, bukan di log GAS).
  const t0 = typeof performance !== "undefined" ? performance.now() : 0;
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let response;
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      response = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        ...(controller ? { signal: controller.signal } : {}),
      });
    } catch (err) {
      const isAbort = err?.name === "AbortError";
      lastError = new Error(
        mapApiErrorMessage(isAbort ? "timeout" : err?.message, "Gagal terhubung ke backend Google Apps Script.")
      );
      if (attempt < maxAttempts) await sleep(300);
      continue;
    } finally {
      if (timer) clearTimeout(timer);
    }

    let json;
    try {
      // ponytail: ukur via text() bila tersedia (browser asli); fallback ke
      // json() agar mock test & respons non-standar tetap jalan.
      if (import.meta.env.DEV && t0 && typeof response.text === "function") {
        const text = await response.text();
        console.debug(`[gas] ${action || "?"} ${Math.round(performance.now() - t0)}ms ${(text.length / 1024).toFixed(1)}KB`);
        json = JSON.parse(text);
      } else {
        json = await response.json();
      }
    } catch {
      lastError = new Error("Respons dari backend bukan JSON yang valid.");
      if (attempt < maxAttempts) await sleep(300);
      continue;
    }

    if (!json || typeof json !== "object" || typeof json.success !== "boolean") {
      lastError = new Error("Format respons dari backend tidak valid.");
      if (attempt < maxAttempts) await sleep(300);
      continue;
    }

    if (!json.success) {
      throw new Error(mapApiErrorMessage(json.message, "Permintaan gagal diproses."));
    }

    return json.data;
  }

  throw lastError;
}
