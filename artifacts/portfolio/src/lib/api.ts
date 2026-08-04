const API_URL = import.meta.env.VITE_API_URL || "";

async function refreshToken(): Promise<string | null> {
  const token = localStorage.getItem("auth_token");
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/api/portfolio/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.token) {
      localStorage.setItem("auth_token", data.token);
      return data.token;
    }
  } catch {}
  return null;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = API_URL ? `${API_URL}${path}` : path;
  let res = await fetch(url, init);
  // Auto-refresh on 401 if we have a token (skip for login/refresh endpoints)
  if (res.status === 401 && !path.includes("/login") && !path.includes("/refresh")) {
    const newToken = await refreshToken();
    if (newToken) {
      const newInit = { ...init, headers: { ...init?.headers, Authorization: `Bearer ${newToken}` } };
      res = await fetch(url, newInit);
    }
  }
  return res;
}
