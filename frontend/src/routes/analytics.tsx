import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import PageLoader from "../components/PageLoader";

const AnalyticsContent = lazy(() => import("../pages/AnalyticsContent"));

function AnalyticsRoute() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AnalyticsContent />
    </Suspense>
  );
}

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Momentum | Productivity Analytics" },
      { name: "description", content: "Real-time performance metrics and focus trends." },
    ],
  }),
  component: AnalyticsRoute,
});
