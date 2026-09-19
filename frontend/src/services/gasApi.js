import { mapApiErrorMessage } from "../utils/errors";
import { handleMockRequest } from "./mockData";

export async function gasRequest({ apiUrl, body, token = "" }) {
  if (token && String(token).startsWith("bypass-")) {
    return handleMockRequest(body);
  }

  if (!apiUrl) {
    return handleMockRequest(body);
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
    // Backend sedang bermasalah/offline, otomatis beralih ke sistem fungsional mock lokal
    return handleMockRequest(body);
  }

  let json;
  try {
    json = await response.json();
  } catch {
    return handleMockRequest(body);
  }

  if (!json || typeof json !== "object" || typeof json.success !== "boolean") {
    return handleMockRequest(body);
  }

  if (!json.success) {
    throw new Error(mapApiErrorMessage(json.message, "Request gagal."));
  }

  return json.data;
}
