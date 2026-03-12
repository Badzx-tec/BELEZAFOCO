"use client";

export function AuthFeedback({
  message,
  tone = "neutral"
}: {
  message: string | null;
  tone?: "danger" | "neutral" | "success";
}) {
  if (!message) {
    return null;
  }

  const toneClasses =
    tone === "danger"
      ? "border-red-200 bg-red-50 text-red-700"
      : tone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <div className={`rounded-[22px] border px-4 py-3 text-sm font-medium ${toneClasses}`}>
      {message}
    </div>
  );
}
