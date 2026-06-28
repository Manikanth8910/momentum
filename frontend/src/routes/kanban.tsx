import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import PageLoader from "../components/PageLoader";

const KanbanContent = lazy(() => import("../pages/KanbanContent"));

function KanbanRoute() {
  return (
    <Suspense fallback={<PageLoader />}>
      <KanbanContent />
    </Suspense>
  );
}

export const Route = createFileRoute("/kanban")({
  head: () => ({
    meta: [
      { title: "Momentum Task Management | Kanban Board" },
      { name: "description", content: "Manage your engineering sprint tasks." },
    ],
  }),
  component: KanbanRoute,
});
