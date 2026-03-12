import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "../lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-[22px] border border-[color:rgba(148,163,184,0.24)] bg-white/82 px-4 py-3.5 text-[15px] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition placeholder:text-slate-400 focus:border-[color:rgba(194,107,54,0.5)] focus:shadow-[0_0_0_4px_rgba(194,107,54,0.12),inset_0_1px_0_rgba(255,255,255,0.3)] focus:outline-none",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full resize-y rounded-[22px] border border-[color:rgba(148,163,184,0.24)] bg-white/82 px-4 py-3.5 text-[15px] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition placeholder:text-slate-400 focus:border-[color:rgba(194,107,54,0.5)] focus:shadow-[0_0_0_4px_rgba(194,107,54,0.12),inset_0_1px_0_rgba(255,255,255,0.3)] focus:outline-none",
        className
      )}
      {...props}
    />
  );
}
