import { useState, type PropsWithChildren, type ReactNode } from "react";
import { Badge, Button } from "./ui";
import { BrandMark, CalendarIcon, ChartIcon, UsersIcon, WalletIcon } from "./premium";

type AppShellProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  workspaceName: string;
  workspaceSlug?: string;
  userName?: string;
  onLogout?: () => void;
}>;

type SidebarItem = {
  label: string;
  hint: string;
  active?: boolean;
  icon: ReactNode;
};

const sidebarItems: SidebarItem[] = [
  { label: "Cockpit", hint: "Tempo real", active: true, icon: <ChartIcon className="h-5 w-5" /> },
  { label: "Agenda", hint: "18 reservas", icon: <CalendarIcon className="h-5 w-5" /> },
  { label: "Clientes", hint: "CRM ativo", icon: <UsersIcon className="h-5 w-5" /> },
  { label: "Financeiro", hint: "Pix", icon: <WalletIcon className="h-5 w-5" /> }
];

function SidebarContent({
  workspaceName,
  workspaceSlug,
  onClose
}: {
  workspaceName: string;
  workspaceSlug?: string;
  onClose?: () => void;
}) {
  return (
    <>
      <div className="border-b border-white/10 px-6 py-7">
        <div className="flex items-start justify-between gap-4">
          <BrandMark inverse subtitle="Intelligence layer para negocios de beleza" />
          {onClose ? (
            <Button className="lg:hidden" size="sm" variant="ghost" onClick={onClose}>
              Fechar
            </Button>
          ) : null}
        </div>

        <div className="mt-8 rounded-[28px] border border-white/10 bg-white/6 p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300/72">Workspace</p>
          <h1 className="mt-3 text-[28px] font-semibold tracking-tight text-white">{workspaceName}</h1>
          {workspaceSlug ? <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">{workspaceSlug}</p> : null}
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400/12 text-amber-300">
              <ChartIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Operacao em alta</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">sincronizado agora</p>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 px-4 py-6">
        {sidebarItems.map((item) => (
          <button
            key={item.label}
            type="button"
            className={`group flex w-full items-center gap-3 rounded-[24px] px-4 py-3.5 text-left transition ${
              item.active ? "bg-white/12 text-white" : "text-slate-300 hover:bg-white/8 hover:text-white"
            }`}
          >
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
                item.active ? "border-white/18 bg-white/10" : "border-white/10 bg-white/5 group-hover:border-white/18"
              }`}
            >
              {item.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{item.label}</span>
              <span className="mt-1 block text-[10px] uppercase tracking-[0.2em] text-slate-500">{item.hint}</span>
            </span>
          </button>
        ))}
      </nav>

      <div className="border-t border-white/10 px-6 py-6">
        <div className="rounded-[30px] border border-white/10 bg-white/6 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300/72">Producao</p>
              <p className="mt-2 text-lg font-semibold text-white">Expansao comercial ativa</p>
            </div>
            <Badge tone="accent" className="bg-amber-400/12 text-amber-200 ring-amber-300/20">
              ao vivo
            </Badge>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Menos falta, mais ocupacao e cobranca integrada ao fluxo de atendimento.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/6 px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">No-show</p>
              <p className="mt-2 text-xl font-semibold text-white">-41%</p>
            </div>
            <div className="rounded-2xl bg-white/6 px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Conversao</p>
              <p className="mt-2 text-xl font-semibold text-white">+23%</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function AppShell({ title, subtitle, workspaceName, workspaceSlug, userName, onLogout, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-4 text-slate-900 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(circle_at_top,rgba(194,107,54,0.15),transparent_64%)]" />

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)}>
          <aside className="surface-dark absolute left-4 top-4 bottom-4 w-[min(88vw,370px)] overflow-hidden" onClick={(event) => event.stopPropagation()}>
            <div className="flex h-full flex-col">
              <SidebarContent workspaceName={workspaceName} workspaceSlug={workspaceSlug} onClose={() => setMobileOpen(false)} />
            </div>
          </aside>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="surface-dark sticky top-6 hidden h-[calc(100vh-3rem)] overflow-hidden lg:flex lg:flex-col">
          <SidebarContent workspaceName={workspaceName} workspaceSlug={workspaceSlug} />
        </aside>

        <main className="space-y-6">
          <header className="surface sticky top-4 z-20 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button className="lg:hidden" size="sm" variant="secondary" onClick={() => setMobileOpen(true)}>
                      Menu
                    </Button>
                    <Badge tone="success">WhatsApp online</Badge>
                    <Badge tone="warning">Pix configurado</Badge>
                    <Badge>America/Sao_Paulo</Badge>
                  </div>
                  <h2 className="mt-5 text-balance text-[32px] font-semibold tracking-tight text-slate-950 sm:text-[38px]">{title}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">{subtitle}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {userName ? <Badge>{userName}</Badge> : null}
                  <Button variant="soft">Bloquear horario</Button>
                  <Button>Novo agendamento</Button>
                  {onLogout ? (
                    <Button variant="secondary" onClick={onLogout}>
                      Sair
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="hairline h-px" />

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[26px] border border-slate-200/70 bg-white/82 px-4 py-4 soft-ring">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Agenda</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">18 compromissos ativos</p>
                </div>
                <div className="rounded-[26px] border border-slate-200/70 bg-white/82 px-4 py-4 soft-ring">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Recepcao</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">Fila organizada e sem atrito</p>
                </div>
                <div className="rounded-[26px] border border-slate-200/70 bg-white/82 px-4 py-4 soft-ring">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Comercial</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">Ocupacao acima da media</p>
                </div>
                <div className="rounded-[26px] border border-slate-200/70 bg-[rgba(194,107,54,0.1)] px-4 py-4 soft-ring">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[color:var(--accent)]">Insight</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">Fluxo de sinal protegendo horario premium</p>
                </div>
              </div>
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}
