import { Panel } from "@/components/app-shell";

export default function SettingsPage() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Panel title="Integracoes" description="Google OAuth, WhatsApp Cloud, Mercado Pago e SMTP preparados por ambiente.">
        <div className="space-y-4">
          {["Google Identity Services", "WhatsApp Cloud API", "Mercado Pago Pix", "SMTP transacional"].map((item) => (
            <div key={item} className="rounded-[24px] border border-slate-200/70 bg-white/70 p-4 text-sm font-semibold text-slate-700">
              {item}
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Seguranca" description="Tenant isolation, CSRF, rotacao de segredos e trilha auditavel.">
        <div className="space-y-4 text-sm leading-7 text-slate-500">
          <p>- Cookies same-origin, access token curto e refresh token rotativo.</p>
          <p>- Webhooks com validacao de origem, idempotencia e observabilidade.</p>
          <p>- env.txt tratado como comprometido e apenas como referencia de nomes.</p>
        </div>
      </Panel>
    </div>
  );
}
