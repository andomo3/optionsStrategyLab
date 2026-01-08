const baseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem("accessToken");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") {
    return;
  }
  return window.localStorage.getItem("refreshToken");
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem("accessToken", accessToken);
  window.localStorage.setItem("refreshToken", refreshToken);
}

export function clearTokens(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem("accessToken");
  window.localStorage.removeItem("refreshToken");
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }
  const res = await fetch(`${baseUrl}/api/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: refreshToken }),
  });
  if (!res.ok) {
    return null;
  }
  const data = (await res.json()) as { access?: string };
  if (!data.access) {
    return null;
  }
  window.localStorage.setItem("accessToken", data.access);
  return data.access;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options?.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && options?.body) {
    headers.set("Content-Type", "application/json");
  }
  let res = await fetch(`${baseUrl}${path}`, { ...options, headers });
  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers.set("Authorization", `Bearer ${refreshed}`);
      res = await fetch(`${baseUrl}${path}`, { ...options, headers });
    }
  }
  const data = (await res.json()) as T;
  if (!res.ok) {
    throw data;
  }
  return data;
}
