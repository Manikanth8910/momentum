import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import PageLoader from "../components/PageLoader";

const DashboardContent = lazy(() => import("../pages/DashboardContent"));

function DashboardRoute() {
  return (
    <Suspense fallback={<PageLoader />}>
      <DashboardContent />
    </Suspense>
  );
}

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Momentum Dashboard | Workspace" },
      { name: "description", content: "Your daily productivity overview." },
    ],
  }),
  component: DashboardRoute,
});
