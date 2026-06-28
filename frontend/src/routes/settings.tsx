import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import PageLoader from "../components/PageLoader";

const SettingsContent = lazy(() => import("../pages/SettingsContent"));

function SettingsRoute() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SettingsContent />
    </Suspense>
  );
}

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Momentum Settings | Configuration" },
      { name: "description", content: "Configure your Momentum profile and workspace settings." },
    ],
  }),
  component: SettingsRoute,
});
