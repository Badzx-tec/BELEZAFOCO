import Link from "next/link";
import type { PropsWithChildren } from "react";
import { Card, DarkCard, cn } from "@belezafoco/ui";
import { AppSessionControls } from "./app-session-controls";

const navItems = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/onboarding", label: "Onboarding" },
  { href: "/app/agenda", label: "Agenda" },
  { href: "/app/clientes", label: "Clientes" },
  { href: "/app/financeiro", label: "Financeiro" },
  { href: "/app/configuracoes", label: "Configuracoes" },
  { href: "/app/faturamento", label: "Faturamento" }
] as const;

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(194,107,54,0.1),transparent_32%),linear-gradient(180deg,#f6efe7_0%,#f0e4d7_100%)]">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-200/60 bg-white/45 px-6 py-8 backdrop-blur-xl lg:flex">
          <div className="mb-12 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">BF</div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-slate-400">BELEZAFOCO</p>
              <p className="text-sm font-bold text-slate-950">Workspace ativo</p>
            </div>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="flex items-center rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-white/70 hover:text-slate-950">
                {item.label}
              </Link>
            ))}
          </nav>
          <DarkCard className="mt-auto p-5 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300/70">Plano Pro</p>
            <h3 className="mt-3 text-lg font-bold">Operacao premium habilitada</h3>
            <p className="mt-2 text-sm text-white/70">WhatsApp Cloud, Pix e cockpit financeiro prontos para rollout.</p>
          </DarkCard>
        </aside>

        <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10">
          <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[color:var(--color-accent)]">Operacao ao vivo</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Cockpit Studio Jardins</h1>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <AppSessionControls />
              <div className="flex flex-wrap gap-3">
                <Link href="/b/studio-jardins" className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white/80 px-5 text-sm font-bold text-slate-900">
                  Booking publico
                </Link>
                <Link href="/app/agenda" className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-bold text-white">
                  Novo agendamento
                </Link>
              </div>
            </div>
          </header>
          <div className="space-y-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function MetricTile({ label, value, hint, dark }: { label: string; value: string; hint: string; dark?: boolean }) {
  const Component = dark ? DarkCard : Card;

  return (
    <Component className={cn("rounded-[32px] p-6", dark && "text-white")}>
      <p className={cn("text-[10px] font-bold uppercase tracking-[0.24em]", dark ? "text-white/50" : "text-slate-400")}>{label}</p>
      <p className={cn("mt-3 text-3xl font-bold tracking-tight", dark ? "text-white" : "text-slate-950")}>{value}</p>
      <p className={cn("mt-2 text-sm font-medium", dark ? "text-white/70" : "text-slate-500")}>{hint}</p>
    </Component>
  );
}

export function Panel({
  title,
  description,
  dark,
  children
}: PropsWithChildren<{ title: string; description?: string; dark?: boolean }>) {
  const Component = dark ? DarkCard : Card;

  return (
    <Component className={cn("rounded-[34px] p-6 md:p-8", dark && "text-white")}>
      <div className="mb-6 space-y-2">
        <h2 className={cn("text-2xl font-bold tracking-tight", dark ? "text-white" : "text-slate-950")}>{title}</h2>
        {description ? <p className={cn("text-sm leading-7", dark ? "text-white/70" : "text-slate-500")}>{description}</p> : null}
      </div>
      {children}
    </Component>
  );
}
