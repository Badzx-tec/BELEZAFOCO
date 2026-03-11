import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function Card({
  className,
  interactive = false,
  tone = "default",
  ...props
}: HTMLAttributes<HTMLDivElement> & { interactive?: boolean; tone?: "default" | "muted" }) {
  return (
    <div
      className={cx(tone === "muted" ? "surface-muted" : "surface", interactive && "interactive-lift", className)}
      {...props}
    />
  );
}

export function SectionTag({ children, className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/86 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500",
        className
      )}
      {...props}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
      {children}
    </span>
  );
}

export function Badge({
  className,
  tone = "neutral",
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "success" | "warning" | "danger" | "accent" }) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70"
      : tone === "warning"
        ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200/70"
        : tone === "danger"
          ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200/70"
          : tone === "accent"
            ? "bg-[var(--accent-soft)] text-[color:var(--accent)] ring-1 ring-[color:rgba(194,107,54,0.16)]"
            : "bg-slate-100 text-slate-700 ring-1 ring-slate-200/70";

  return (
    <span className={cx("inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold", toneClass, className)} {...props}>
      {children}
    </span>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className={cx("space-y-2", className)} {...props}>
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">{eyebrow}</p> : null}
      <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
      {description ? <p className="text-sm leading-7 text-slate-500">{description}</p> : null}
    </div>
  );
}

export function Button({
  className,
  children,
  variant = "primary",
  size = "md",
  busy = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "soft";
  size?: "sm" | "md" | "lg";
  busy?: boolean;
}) {
  const sizeClass = size === "sm" ? "px-4 py-2.5 text-sm" : size === "lg" ? "px-6 py-4 text-sm" : "px-5 py-3 text-sm";
  const variantClass =
    variant === "secondary"
      ? "bg-white/92 text-slate-900 ring-1 ring-slate-200/80 hover:bg-white"
      : variant === "ghost"
        ? "bg-transparent text-slate-700 hover:bg-white/70"
        : variant === "soft"
          ? "bg-slate-100 text-slate-800 hover:bg-slate-200"
          : "bg-slate-950 text-white shadow-[0_20px_40px_-20px_rgba(15,23,42,0.78)] hover:-translate-y-0.5 hover:bg-slate-900";

  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(194,107,54,0.18)] disabled:cursor-not-allowed disabled:opacity-55",
        sizeClass,
        variantClass,
        className
      )}
      {...props}
    >
      {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" /> : null}
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  error,
  className,
  children
}: HTMLAttributes<HTMLLabelElement> & { label: string; hint?: string; error?: string }) {
  return (
    <label className={cx("field-shell", className)}>
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-800">{label}</span>
        {hint ? <span className="text-xs font-medium text-slate-400">{hint}</span> : null}
      </span>
      {children}
      {error ? <span className="text-sm text-rose-600">{error}</span> : null}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx("input-shell", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx("textarea-shell", className)} {...props} />;
}

export function CheckboxField({
  className,
  title,
  description,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { title: string; description: string }) {
  return (
    <label
      className={cx(
        "flex gap-3 rounded-[24px] border border-slate-200/70 bg-white/70 px-4 py-4 text-sm text-slate-600 transition hover:border-slate-300",
        className
      )}
    >
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-[rgba(194,107,54,0.3)]"
        {...props}
      />
      <span>
        <span className="block font-semibold text-slate-800">{title}</span>
        <span className="mt-1 block leading-6 text-slate-500">{description}</span>
      </span>
    </label>
  );
}

export function EmptyState({
  title,
  description,
  className,
  action,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={cx(
        "rounded-[28px] border border-dashed border-slate-300 bg-white/56 px-5 py-6 text-center sm:px-6",
        className
      )}
      {...props}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">BF</div>
      <h3 className="mt-4 text-xl font-semibold text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function SkeletonBlock({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("skeleton-shimmer rounded-[28px]", className)} {...props} />;
}
