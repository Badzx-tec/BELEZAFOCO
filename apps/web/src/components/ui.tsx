import { cloneElement, forwardRef, isValidElement, useId, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type PropsWithChildren, type ReactElement, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  const variants = {
    primary: "bg-slate-950 text-white shadow-soft hover:bg-slate-800",
    secondary: "bg-white/80 text-slate-900 ring-1 ring-slate-200 hover:bg-white",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100"
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Card({ className = "", children, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return <div className={`rounded-[28px] border border-white/60 bg-white/88 p-6 shadow-soft backdrop-blur ${className}`} {...props}>{children}</div>;
}

export function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{eyebrow}</p>
      <div className="space-y-2">
        <h2 className="font-display text-3xl text-slate-950">{title}</h2>
        {description ? <p className="max-w-2xl text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
    </div>
  );
}

function isTextControl(child: ReactNode): child is ReactElement<{ id?: string }> {
  if (!isValidElement(child)) return false;

  if (typeof child.type === "string") {
    return child.type === "input" || child.type === "select" || child.type === "textarea";
  }

  return child.type === Input || child.type === Select || child.type === TextArea;
}

export function Field({ label, hint, htmlFor, as = "div", error, children }: PropsWithChildren<{ label: string; hint?: string; htmlFor?: string; as?: "div" | "fieldset"; error?: string }>) {
  const generatedId = useId();
  let controlId = htmlFor;
  let resolvedChildren = children;

  if (!controlId && isTextControl(children)) {
    controlId = children.props.id ?? generatedId;
    if (!children.props.id) {
      resolvedChildren = cloneElement(children, { id: controlId });
    }
  }

  if (as === "fieldset") {
    return (
      <fieldset className="space-y-2 text-sm text-slate-700">
        <div className="flex items-center justify-between gap-3">
          <legend className="font-medium text-slate-800">{label}</legend>
          {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
        </div>
        {resolvedChildren}
        {error ? <p className="text-xs font-medium text-rose-700" role="alert">{error}</p> : null}
      </fieldset>
    );
  }

  return (
    <div className="space-y-2 text-sm text-slate-700">
      <div className="flex items-center justify-between gap-3">
        {controlId ? <label className="font-medium text-slate-800" htmlFor={controlId}>{label}</label> : <span className="font-medium text-slate-800">{label}</span>}
        {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
      </div>
      {resolvedChildren}
      {error ? <p className="text-xs font-medium text-rose-700" role="alert">{error}</p> : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(props, ref) {
  return <input className="field-control w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition" ref={ref} {...props} />;
});

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea(props, ref) {
  return <textarea className="field-control min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition" ref={ref} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(props, ref) {
  return <select className="field-control w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition" ref={ref} {...props} />;
});

export function Badge({ children, tone = "neutral" }: PropsWithChildren<{ tone?: "neutral" | "success" | "warning" }>) {
  const tones = {
    neutral: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-800"
  };
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function StatCard({ label, value, help }: { label: string; value: string; help: string }) {
  return (
    <Card className="space-y-3">
      <p className="text-sm text-slate-500">{label}</p>
      <div className="space-y-1">
        <p className="text-3xl font-semibold text-slate-950">{value}</p>
        <p className="text-sm text-slate-500">{help}</p>
      </div>
    </Card>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <Card className="border-dashed border-slate-300 bg-slate-50/80 text-center">
      <div className="mx-auto max-w-md space-y-3 py-4">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm leading-6 text-slate-500">{description}</p>
        {action ? <div className="pt-2">{action}</div> : null}
      </div>
    </Card>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200/70 ${className}`} />;
}
