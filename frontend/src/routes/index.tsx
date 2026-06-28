import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Momentum | Professional Productivity Suite" },
      { name: "description", content: "Momentum is a high-performance productivity suite for modern teams." },
      { property: "og:title", content: "Momentum" },
      { property: "og:description", content: "High-performance productivity suite for modern teams." },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/login", replace: true });
  }, [navigate]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <p className="text-sm text-muted-foreground">Loading Momentum…</p>
    </div>
  );
}
