const DEFAULT_API_BASE = "https://wheel-back.onrender.com";

function getApiBase() {
  const envBase = import.meta?.env?.VITE_API_BASE;
  const base = typeof envBase === "string" && envBase.trim().length > 0
    ? envBase.trim()
    : DEFAULT_API_BASE;
  return base.replace(/\/+$/, "");
}

async function parseJsonSafe(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const base = getApiBase();
  const url = `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, options);
  const payload = await parseJsonSafe(res);

  if (!res.ok || payload?.ok === false) {
    const code = payload?.error || `HTTP_${res.status}`;
    const err = new Error(code);
    err.code = code;
    err.status = res.status;
    if (payload?.nextEligibleAt) err.nextEligibleAt = payload.nextEligibleAt;
    if (payload?.channel) err.channel = payload.channel;
    throw err;
  }

  return payload;
}

export async function fetchPrizes() {
  const data = await request("/api/prizes", {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!Array.isArray(data)) {
    throw new Error("INVALID_PRIZES_PAYLOAD");
  }

  return data;
}

export async function spinWheel(initData) {
  if (!initData) {
    const err = new Error("UNAUTHORIZED");
    err.code = "UNAUTHORIZED";
    throw err;
  }

  return request("/api/spin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ initData }),
  });
}
