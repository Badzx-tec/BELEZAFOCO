import { useState } from "react";

export function DashboardPage() {
  const [items] = useState([
    "1) Configurar horários",
    "2) Cadastrar serviços",
    "3) Cadastrar profissionais",
    "4) Cadastrar recursos",
    "5) Configurar templates WhatsApp",
    "6) Publicar link de agendamento"
  ]);

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h2 className="text-2xl font-semibold mb-4">Onboarding em 10 minutos</h2>
      <ul className="space-y-2">
        {items.map((i) => <li key={i} className="p-3 bg-white rounded">{i}</li>)}
      </ul>
      <div className="mt-6 flex gap-2">
        <button className="px-4 py-2 rounded bg-blue-600 text-white">Copiar link</button>
        <button className="px-4 py-2 rounded bg-emerald-600 text-white">Enviar teste de lembrete</button>
      </div>
    </div>
  );
}
