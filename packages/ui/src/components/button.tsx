import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(194,107,54,0.18)] disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-slate-950 text-white shadow-[0_20px_40px_-20px_rgba(15,23,42,0.78)] hover:-translate-y-0.5 hover:bg-slate-900",
        secondary: "bg-white/92 text-slate-900 ring-1 ring-slate-200/80 hover:bg-white",
        ghost: "bg-transparent text-slate-700 hover:bg-white/70",
        accent: "bg-[color:var(--color-accent)] text-white shadow-[0_20px_40px_-20px_rgba(194,107,54,0.65)] hover:-translate-y-0.5 hover:brightness-95"
      },
      size: {
        sm: "h-10 px-4 text-sm",
        md: "h-12 px-5 text-sm",
        lg: "h-14 px-7 text-base"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export function Button({ className, size, variant, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ size, variant }), className)} {...props} />;
}
