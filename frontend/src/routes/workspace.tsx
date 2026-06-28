import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import PageLoader from "../components/PageLoader";

const WorkspaceContent = lazy(() => import("../pages/WorkspaceContent"));

function WorkspaceRoute() {
  return (
    <Suspense fallback={<PageLoader />}>
      <WorkspaceContent />
    </Suspense>
  );
}

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "Momentum Workspace | Engineering Central" },
      { name: "description", content: "The central hub for team collaboration and productivity." },
    ],
  }),
  component: WorkspaceRoute,
});
