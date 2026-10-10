import { Link } from "@tanstack/react-router";
import prov from "@/lib/data-provenance.json";

export function DataAsOf() {
  const d = new Date(prov.asOf + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return (
    <p className="text-sm text-muted-foreground">
      Plan data as of {d} ({prov.asOfSource}).{" "}
      <Link to="/methodology" hash="sources" className="inline-flex min-h-12 items-center font-bold text-primary underline">See all sources</Link>
    </p>
  );
}
