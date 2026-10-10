import { createFileRoute, redirect } from "@tanstack/react-router";

// Old address; the page moved to /methodology.
export const Route = createFileRoute("/how-we-compare")({
  beforeLoad: () => {
    throw redirect({ to: "/methodology", statusCode: 301 });
  },
});
