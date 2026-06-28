import { useEffect } from "react";

/**
 * Redirects to /login if no auth token is found in localStorage.
 * Call this at the top of every protected page component.
 */
export function useAuthGuard() {
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
    }
  }, []);
}
