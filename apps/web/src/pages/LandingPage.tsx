import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8">
      <h1 className="text-4xl font-bold">BELEZAFOCO</h1>
      <p>Agenda online + lembretes WhatsApp + sinal PIX para reduzir faltas.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl">Implantação rápida</div>
        <div className="p-4 bg-white rounded-xl">Plano Basic R$89</div>
        <div className="p-4 bg-white rounded-xl">Plano Pro R$149</div>
      </div>
      <Link className="bg-black text-white px-4 py-2 rounded" to="/app">Criar teste grátis</Link>
    </div>
  );
}
