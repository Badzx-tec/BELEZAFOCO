import type { HTMLAttributes } from "react";
import { cn } from "../lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("bf-surface", className)} {...props} />;
}

export function DarkCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("bf-surface-dark", className)} {...props} />;
}
