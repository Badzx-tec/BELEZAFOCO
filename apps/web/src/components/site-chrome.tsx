import Image from "next/image";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import { Badge, Card, DarkCard, cn } from "@belezafoco/ui";

export function SiteHeader() {
  return (
    <header className="page-shell flex items-center justify-between gap-4 px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/" className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white shadow-lg">BF</div>
        <div className="hidden sm:block">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-slate-400">BELEZAFOCO</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">The Beauty Cockpit</p>
        </div>
      </Link>
      <nav className="hidden items-center gap-6 md:flex">
        <Link href="/precos" className="text-sm font-semibold text-slate-600 transition hover:text-slate-950">
          Precos
        </Link>
        <Link href="/faq" className="text-sm font-semibold text-slate-600 transition hover:text-slate-950">
          FAQ
        </Link>
        <Link href="/login" className="text-sm font-semibold text-slate-600 transition hover:text-slate-950">
          Entrar
        </Link>
      </nav>
      <Link href="/cadastro" className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-bold text-white shadow-[0_12px_24px_-8px_rgba(15,23,42,0.6)] transition hover:-translate-y-0.5">
        Criar conta gratis
      </Link>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="page-shell border-t border-slate-200/60 px-4 py-12 text-sm font-semibold text-slate-400 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-[10px] font-bold text-white">BF</div>
          <span className="text-sm uppercase tracking-[0.25em] text-slate-950">BelezaFoco</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/faq" className="transition hover:text-slate-950">FAQ</Link>
          <Link href="/precos" className="transition hover:text-slate-950">Precos</Link>
          <a href="mailto:contato@belezafoco.dev" className="transition hover:text-slate-950">Contato</a>
        </div>
        <p>(c) 2026 BELEZAFOCO. Built for premium beauty operations.</p>
      </div>
    </footer>
  );
}

export function PublicLayout({ children }: PropsWithChildren) {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(circle_at_top,rgba(194,107,54,0.12),transparent_70%)]" />
      <SiteHeader />
      <main className="space-y-16 pb-16 md:space-y-24">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function Eyebrow({ children }: PropsWithChildren) {
  return <Badge className="px-4 py-2 text-[11px] font-bold uppercase tracking-[0.25em]">{children}</Badge>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left"
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("space-y-4", align === "center" && "text-center")}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="text-balance text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">{title}</h2>
      {description ? <p className="mx-auto max-w-3xl text-lg leading-8 text-slate-500">{description}</p> : null}
    </div>
  );
}

export function MarketingHero() {
  return (
    <section className="page-shell grid gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
      <div className="space-y-8 pt-4">
        <Eyebrow>Premium SaaS for Beauty</Eyebrow>
        <div className="space-y-6">
          <h1 className="text-balance max-w-4xl text-5xl font-bold leading-[1.02] tracking-tight text-slate-950 sm:text-6xl xl:text-7xl">
            Sua agenda e o coracao do negocio. <span className="text-[color:var(--color-accent)]">De o foco que ela merece.</span>
          </h1>
          <p className="max-w-2xl text-lg font-medium leading-8 text-slate-500 md:text-xl">
            Operacao premium para barbearias, saloes, esteticas e nail designers com agenda online, WhatsApp,
            Pix e financeiro em uma unica plataforma.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/cadastro" className="inline-flex h-14 items-center justify-center rounded-full bg-slate-950 px-8 text-base font-bold text-white shadow-[0_20px_40px_-15px_rgba(15,23,42,0.5)] transition hover:scale-[1.02]">
            Comecar jornada
          </Link>
          <Link href="/b/studio-jardins" className="inline-flex h-14 items-center justify-center rounded-full border border-slate-200 bg-white/70 px-8 text-base font-bold text-slate-900 transition hover:bg-white">
            Ver booking publico
          </Link>
        </div>
        <div className="grid max-w-3xl gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Reducao de faltas</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">-41%</p>
          </Card>
          <Card className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Taxa de satisfacao</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">98%</p>
          </Card>
          <Card className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Fluxo nativo</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">Pix + Zap</p>
          </Card>
        </div>
      </div>

      <DarkCard className="bf-mesh-panel relative min-h-[520px] overflow-hidden p-8 md:p-10">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[color:var(--color-accent)]/20 blur-[110px]" />
        <div className="relative z-10 flex h-full flex-col justify-between gap-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300/70">Performance live</p>
              <p className="mt-2 text-4xl font-bold text-white">R$ 14.280</p>
              <p className="mt-1 text-sm font-semibold text-emerald-400">+24% vs mes anterior</p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">Proximo cliente</p>
              <p className="mt-3 text-lg font-bold text-white">Juliana Ribeiro</p>
              <p className="text-sm text-white/60">Mechas + tratamento</p>
              <span className="mt-4 inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-400">
                Sinal pago
              </span>
            </div>
          </div>
          <div className="relative aspect-[16/11] overflow-hidden rounded-[30px] border border-white/10 bg-slate-900/50 shadow-2xl">
            <Image src="/marketing/hero-cockpit-premium.svg" alt="Cockpit premium do produto" fill className="object-cover" priority />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">Link de agendamento</p>
              <p className="mt-3 text-base font-semibold text-white">belezafoco.com/studio-jardins</p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">Recebiveis previstos</p>
              <p className="mt-3 text-base font-semibold text-white">R$ 7.920 ate 18h</p>
            </div>
          </div>
        </div>
      </DarkCard>
    </section>
  );
}
