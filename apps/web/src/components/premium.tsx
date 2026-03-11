import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function iconShell(path: ReactNode, className?: string, viewBox = "0 0 24 24") {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox={viewBox} xmlns="http://www.w3.org/2000/svg">
      {path}
    </svg>
  );
}

export function SparkIcon({ className }: { className?: string }) {
  return iconShell(
    <>
      <path d="M12 3L13.9 8.1L19 10L13.9 11.9L12 17L10.1 11.9L5 10L10.1 8.1L12 3Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M18 3L18.7 4.8L20.5 5.5L18.7 6.2L18 8L17.3 6.2L15.5 5.5L17.3 4.8L18 3Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </>,
    className
  );
}

export function ArrowRightIcon({ className }: { className?: string }) {
  return iconShell(
    <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />,
    className
  );
}

export function PlayIcon({ className }: { className?: string }) {
  return iconShell(
    <>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 8.8L15.4 12L10 15.2V8.8Z" fill="currentColor" />
    </>,
    className
  );
}

export function CheckIcon({ className }: { className?: string }) {
  return iconShell(<path d="M5 12.5L9.4 17L19 7.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />, className);
}

export function CalendarIcon({ className }: { className?: string }) {
  return iconShell(
    <>
      <rect x="4" y="6" width="16" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 3V8M16 3V8M4 10H20" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </>,
    className
  );
}

export function ChartIcon({ className }: { className?: string }) {
  return iconShell(
    <>
      <path d="M4 19H20" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M7 15L11 11L14 13L19 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <circle cx="7" cy="15" r="1.6" fill="currentColor" />
      <circle cx="11" cy="11" r="1.6" fill="currentColor" />
      <circle cx="14" cy="13" r="1.6" fill="currentColor" />
      <circle cx="19" cy="7" r="1.6" fill="currentColor" />
    </>,
    className
  );
}

export function WalletIcon({ className }: { className?: string }) {
  return iconShell(
    <>
      <path d="M5 8.5C5 6.6 6.5 5 8.4 5H17.4C18.8 5 20 6.2 20 7.6V16.4C20 17.8 18.8 19 17.4 19H8.4C6.5 19 5 17.4 5 15.5V8.5Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.4 8H16.5C18.4 8 20 9.6 20 11.5V11.5H15.5C14.1 11.5 13 12.6 13 14V14C13 15.4 14.1 16.5 15.5 16.5H20V16.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16.4" cy="14" r="1.1" fill="currentColor" />
    </>,
    className
  );
}

export function ShieldIcon({ className }: { className?: string }) {
  return iconShell(
    <>
      <path d="M12 3L18.4 5.4V11.2C18.4 15.3 15.8 19.1 12 20.6C8.2 19.1 5.6 15.3 5.6 11.2V5.4L12 3Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M9 12L11.1 14.2L15.2 10.1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </>,
    className
  );
}

export function UsersIcon({ className }: { className?: string }) {
  return iconShell(
    <>
      <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.6 18C5.4 15.6 7 14.4 9 14.4C11 14.4 12.6 15.6 13.4 18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <circle cx="16.6" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M14.9 18C15.4 16.5 16.4 15.6 17.8 15.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </>,
    className
  );
}

export function ClockIcon({ className }: { className?: string }) {
  return iconShell(
    <>
      <circle cx="12" cy="12" r="8.8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.8V12L15 13.9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </>,
    className
  );
}

export function BrandMark({
  subtitle,
  inverse = false,
  compact = false
}: {
  subtitle?: string;
  inverse?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cx(
          "flex items-center justify-center rounded-[20px] font-semibold shadow-[0_18px_40px_-22px_rgba(15,23,42,0.55)]",
          compact ? "h-11 w-11 text-sm" : "h-12 w-12 text-base",
          inverse ? "bg-white text-slate-950" : "bg-slate-950 text-white"
        )}
      >
        BF
      </div>
      <div>
        <p className={cx("text-[11px] font-extrabold uppercase tracking-[0.34em]", inverse ? "text-white/55" : "text-slate-400")}>BELEZAFOCO</p>
        {subtitle ? <p className={cx("mt-1 text-sm font-semibold", inverse ? "text-white/78" : "text-slate-500")}>{subtitle}</p> : null}
      </div>
    </div>
  );
}

export function PremiumMetricCard({
  label,
  value,
  detail,
  icon,
  tone = "light",
  className
}: {
  label: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
  tone?: "light" | "dark" | "accent";
  className?: string;
}) {
  return (
    <div
      className={cx(
        "rounded-[30px] border px-5 py-5",
        tone === "dark"
          ? "border-white/10 bg-white/6 text-white"
          : tone === "accent"
            ? "border-[rgba(194,107,54,0.18)] bg-[rgba(194,107,54,0.1)] text-slate-950"
            : "border-slate-200/75 bg-white/82 text-slate-950",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={cx("text-[11px] font-bold uppercase tracking-[0.24em]", tone === "dark" ? "text-white/48" : "text-slate-400")}>{label}</p>
          <p className="mt-4 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        {icon ? (
          <div
            className={cx(
              "flex h-12 w-12 items-center justify-center rounded-2xl",
              tone === "dark" ? "bg-white/10 text-amber-300" : "bg-slate-950 text-white"
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
      {detail ? <p className={cx("mt-4 text-sm leading-6", tone === "dark" ? "text-white/66" : "text-slate-500")}>{detail}</p> : null}
    </div>
  );
}

export function ImageShowcase({
  image,
  alt,
  dark = false,
  label,
  action,
  className,
  overlay,
  imageClassName
}: {
  image: string;
  alt: string;
  dark?: boolean;
  label?: string;
  action?: ReactNode;
  className?: string;
  overlay?: ReactNode;
  imageClassName?: string;
}) {
  return (
    <div
      className={cx(
        "relative overflow-hidden rounded-[32px] border",
        dark ? "border-white/10 bg-white/6" : "border-slate-200/75 bg-white/84",
        className
      )}
    >
      <img alt={alt} className={cx("h-full w-full object-cover", imageClassName)} src={image} />
      <div className={cx("pointer-events-none absolute inset-0", dark ? "bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent" : "bg-gradient-to-t from-slate-950/30 via-transparent to-transparent")} />
      {label ? (
        <div className="absolute left-4 top-4 rounded-full border border-white/12 bg-slate-950/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-white backdrop-blur-md">
          {label}
        </div>
      ) : null}
      {overlay}
      {action ? <div className="absolute bottom-4 left-4 right-4">{action}</div> : null}
    </div>
  );
}

export function AvatarStack({
  items,
  className
}: {
  items: Array<{ src: string; alt: string }>;
  className?: string;
}) {
  return (
    <div className={cx("flex -space-x-3", className)}>
      {items.map((item, index) => (
        <img
          key={`${item.alt}-${index}`}
          alt={item.alt}
          className="h-11 w-11 rounded-full border-4 border-white object-cover shadow-sm"
          src={item.src}
        />
      ))}
    </div>
  );
}

export function StepRail({
  steps,
  className
}: {
  steps: Array<{ title: string; done?: boolean; current?: boolean }>;
  className?: string;
}) {
  return (
    <div className={cx("grid gap-3 sm:grid-cols-3", className)}>
      {steps.map((step) => (
        <div
          key={step.title}
          className={cx(
            "rounded-[24px] border px-4 py-3",
            step.current
              ? "border-slate-950 bg-slate-950 text-white"
              : step.done
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-slate-200/75 bg-white/72 text-slate-800"
          )}
        >
          <div className="flex items-center gap-2">
            <span
              className={cx(
                "h-2.5 w-2.5 rounded-full",
                step.current ? "bg-amber-300" : step.done ? "bg-emerald-500" : "bg-slate-300"
              )}
            />
            <p className="text-sm font-semibold">{step.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FloatingBadge({
  children,
  className,
  style
}: HTMLAttributes<HTMLDivElement> & { style?: CSSProperties }) {
  return (
    <div
      className={cx(
        "inline-flex items-center gap-2 rounded-full border border-white/12 bg-slate-950/78 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-white backdrop-blur-md",
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}
