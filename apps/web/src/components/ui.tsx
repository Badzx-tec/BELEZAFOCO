import type { ButtonHTMLAttributes, HTMLAttributes } from "react";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("surface", className)} {...props} />;
}

export function SectionTag({ children, className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border border-slate-900/10 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function Button({
  className,
  children,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition duration-200",
        variant === "primary" && "bg-slate-950 text-white shadow-[0_18px_40px_-18px_rgba(15,23,42,0.85)] hover:-translate-y-0.5",
        variant === "secondary" && "bg-white text-slate-950 ring-1 ring-slate-200 hover:bg-slate-50",
        variant === "ghost" && "bg-transparent text-slate-700 hover:bg-white/70",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function SkeletonBlock({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("animate-pulse rounded-2xl bg-slate-200/70", className)} {...props} />;
}
