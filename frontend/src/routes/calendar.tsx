import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import PageLoader from "../components/PageLoader";

const CalendarContent = lazy(() => import("../pages/CalendarContent"));

function CalendarRoute() {
  return (
    <Suspense fallback={<PageLoader />}>
      <CalendarContent />
    </Suspense>
  );
}

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Momentum Calendar | High-Performance Scheduling" },
      { name: "description", content: "Notion and Linear style productivity calendar." },
    ],
  }),
  component: CalendarRoute,
});
