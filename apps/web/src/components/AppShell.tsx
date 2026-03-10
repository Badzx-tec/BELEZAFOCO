import { useState, type PropsWithChildren } from "react";
import { Badge, Button } from "./ui";

type AppShellProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  workspaceName: string;
  workspaceSlug?: string;
  userName?: string;
  onLogout?: () => void;
}>;

const sidebarItems = [
  { label: "Visao geral", hint: "Hoje", active: true },
  { label: "Agenda", hint: "18 itens", active: false },
  { label: "Clientes", hint: "CRM", active: false },
  { label: "Equipe", hint: "3 ativos", active: false },
  { label: "Catalogo", hint: "Servicos", active: false },
  { label: "Cobranca", hint: "Pix", active: false }
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
      <div className="border-b border-white/10 px-6 py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300/80">BELEZAFOCO</p>
            <h1 className="mt-3 text-[28px] font-semibold text-white">{workspaceName}</h1>
            {workspaceSlug ? <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500">{workspaceSlug}</p> : null}
          </div>
          {onClose ? (
            <Button variant="ghost" size="sm" className="text-slate-300 hover:bg-white/10 hover:text-white lg:hidden" onClick={onClose}>
              Fechar
            </Button>
          ) : null}
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Operacao multiempresa com agenda, cobranca e comunicacao no mesmo fluxo.
        </p>
      </div>

      <nav className="space-y-1 px-3 py-4">
        {sidebarItems.map((item) => (
          <button
            key={item.label}
            type="button"
            className={`flex w-full items-center gap-3 rounded-[24px] px-4 py-3 text-left transition ${
              item.active ? "bg-white/12 text-white" : "text-slate-300 hover:bg-white/8 hover:text-white"
            }`}
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${
                item.active ? "border-white/20 bg-white/10" : "border-white/10 bg-white/5"
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{item.label}</span>
              <span className="mt-1 block text-xs uppercase tracking-[0.22em] text-slate-500">{item.hint}</span>
            </span>
          </button>
        ))}
      </nav>

      <div className="border-t border-white/10 px-6 py-5">
        <div className="rounded-[28px] border border-white/10 bg-white/8 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Trial Pro</p>
              <p className="mt-2 text-lg font-semibold text-white">14 dias para implantar e vender</p>
            </div>
            <Badge tone="accent" className="bg-amber-400/10 text-amber-200 ring-amber-300/20">
              Producao
            </Badge>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Link publico, lembretes e sinal Pix prontos para operacao comercial real.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/6 px-3 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Conversao</p>
              <p className="mt-2 text-xl font-semibold text-white">+23%</p>
            </div>
            <div className="rounded-2xl bg-white/6 px-3 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">No-show</p>
              <p className="mt-2 text-xl font-semibold text-white">-41%</p>
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
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(194,107,54,0.16),transparent_52%)]" />

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)}>
          <aside className="surface-dark absolute left-4 top-4 bottom-4 w-[min(88vw,360px)] overflow-hidden" onClick={(event) => event.stopPropagation()}>
            <div className="flex h-full flex-col">
              <SidebarContent workspaceName={workspaceName} workspaceSlug={workspaceSlug} onClose={() => setMobileOpen(false)} />
            </div>
          </aside>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="surface-dark sticky top-6 hidden h-[calc(100vh-3rem)] overflow-hidden lg:flex lg:flex-col">
          <SidebarContent workspaceName={workspaceName} workspaceSlug={workspaceSlug} />
        </aside>

        <main className="space-y-6">
          <header className="surface sticky top-4 z-20 px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setMobileOpen(true)}>
                      Menu
                    </Button>
                    <Badge tone="success">WhatsApp ativo</Badge>
                    <Badge tone="warning">Pix configuravel</Badge>
                    <Badge>America/Sao_Paulo</Badge>
                  </div>
                  <h2 className="mt-4 text-balance text-[30px] font-semibold text-slate-950 sm:text-[36px]">{title}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">{subtitle}</p>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
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
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[24px] bg-white/80 px-4 py-3 soft-ring">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Hoje</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">18 atendimentos</p>
                  </div>
                  <div className="rounded-[24px] bg-white/80 px-4 py-3 soft-ring">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Recepcao</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">Fila sob controle</p>
                  </div>
                  <div className="rounded-[24px] bg-white/80 px-4 py-3 soft-ring">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Venda</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">Trial com chance alta</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:hidden">
                  <Button variant="soft" className="flex-1">
                    Bloquear
                  </Button>
                  <Button className="flex-1">Novo</Button>
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
