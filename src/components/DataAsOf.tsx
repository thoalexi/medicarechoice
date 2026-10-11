import { Link } from "@tanstack/react-router";
import prov from "@/lib/data-provenance.json";

export function DataAsOf({ compact = false }: { compact?: boolean }) {
  const d = new Date(prov.asOf + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return (
    <p className="text-sm text-muted-foreground">
      {compact ? `Independent guide · CMS 2027 plan data as of ${d}` : `Plan data as of ${d} (${prov.asOfSource}).`}{" "}
      <Link to="/methodology" hash="sources" className="inline-flex min-h-12 items-center font-bold text-primary underline">{compact ? "See sources" : "See all sources"}</Link>
    </p>
  );
}
