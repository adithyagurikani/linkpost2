const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

let accessToken: string | null = null;
let refreshToken: string | null = null;
let onAuthFail: (() => void) | null = null;

export function setAuthCallback(cb: () => void) {
  onAuthFail = cb;
}

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  if (typeof window !== "undefined") {
    localStorage.setItem("refreshToken", refresh);
  }
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("refreshToken");
  }
}

export function loadRefreshToken(): string | null {
  if (typeof window !== "undefined") {
    refreshToken = localStorage.getItem("refreshToken");
  }
  return refreshToken;
}

async function tryRefresh(): Promise<boolean> {
  const rt = refreshToken || loadRefreshToken();
  if (!rt) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  noAuth?: boolean;
}

const REQUEST_TIMEOUT = 90000; // Increased to 90s to handle Render free-tier cold starts (takes 45-60s to wake up)

async function request<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers: extraHeaders = {}, noAuth = false } = opts;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  if (!noAuth && accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  const doFetch = (signal?: AbortSignal) =>
    fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });

  let res: Response;
  try {
    res = await doFetch(controller.signal);
  } finally {
    clearTimeout(timeout);
  }

  // Auto-refresh on 401
  if (res.status === 401 && !noAuth) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${accessToken}`;
      const c2 = new AbortController();
      const t2 = setTimeout(() => c2.abort(), REQUEST_TIMEOUT);
      try {
        res = await doFetch(c2.signal);
      } finally {
        clearTimeout(t2);
      }
    } else {
      clearTokens();
      onAuthFail?.();
      throw new Error("Session expired");
    }
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T = unknown>(path: string, params?: Record<string, string | number | undefined>) => {
    let url = path;
    if (params) {
      const search = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) search.set(k, String(v));
      }
      const qs = search.toString();
      if (qs) url += (url.includes("?") ? "&" : "?") + qs;
    }
    return request<T>(url);
  },
  post: <T = unknown>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body }),
  put: <T = unknown>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body }),
  delete: <T = unknown>(path: string, body?: unknown) =>
    request<T>(path, { method: "DELETE", body }),
};

export default api;
