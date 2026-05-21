import type { ReactNode } from "react";

export function Badge({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "accent" | "success" | "warn"; }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
