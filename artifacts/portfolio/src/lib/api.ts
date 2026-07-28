const API_URL = import.meta.env.VITE_API_URL || "";

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = API_URL ? `${API_URL}${path}` : path;
  return fetch(url, init);
}
