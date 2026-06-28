/**
 * Central API fetch wrapper.
 * - Automatically attaches Authorization header
 * - On 401, clears localStorage and redirects to /login with a session-expired flag
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("cachedUser");
    window.location.href = "/login?expired=1";
    // Return a never-resolving promise so caller doesn't process 401 body
    return new Promise(() => {});
  }

  return res;
}
