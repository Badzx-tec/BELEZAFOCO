import type { PropsWithChildren } from "react";

type AppShellProps = PropsWithChildren<{
  title: string;
  subtitle: string;
}>;

const sidebarItems = ["Visão geral", "Agenda", "Clientes", "Equipe", "Catálogo", "Cobrança"];

export function AppShell({ title, subtitle, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-transparent px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="surface-dark overflow-hidden">
          <div className="border-b border-white/10 px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300/80">BELEZAFOCO</p>
            <h1 className="mt-3 text-2xl font-semibold text-white">{title}</h1>
            <p className="mt-2 text-sm text-slate-300">{subtitle}</p>
          </div>
          <nav className="space-y-1 px-3 py-4">
            {sidebarItems.map((item, index) => (
              <button
                key={item}
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition ${
                  index === 0 ? "bg-white/12 text-white" : "text-slate-300 hover:bg-white/8 hover:text-white"
                }`}
              >
                <span>{item}</span>
                <span className="text-[10px] uppercase tracking-[0.24em] text-slate-500">{index === 0 ? "Ativo" : ""}</span>
              </button>
            ))}
          </nav>
          <div className="border-t border-white/10 px-6 py-5">
            <div className="rounded-3xl bg-white/8 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Trial Pro</p>
              <p className="mt-2 text-lg font-semibold text-white">14 dias para implantar e vender</p>
              <p className="mt-2 text-sm text-slate-300">Agenda online, lembretes e sinal Pix prontos para demo comercial.</p>
            </div>
          </div>
        </aside>

        <main className="space-y-6">
          <header className="surface flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Operação do dia</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950">{title}</h2>
              <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-emerald-50 px-4 py-2 font-medium text-emerald-700">WhatsApp ativo</span>
              <span className="rounded-full bg-amber-50 px-4 py-2 font-medium text-amber-700">Pix configurável</span>
              <span className="rounded-full bg-slate-100 px-4 py-2 font-medium text-slate-700">Timezone America/Sao_Paulo</span>
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
