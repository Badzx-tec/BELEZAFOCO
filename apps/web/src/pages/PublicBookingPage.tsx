import { FormEvent, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";

export function PublicBookingPage() {
  const { slug = "demo-beleza" } = useParams();
  const [serviceId, setServiceId] = useState("");
  const [staffMemberId, setStaffMemberId] = useState("");
  const [startAt, setStartAt] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await api(`/public/b/${slug}/book`, { method: "POST", body: JSON.stringify({ serviceId, staffMemberId, startAt, name: "Cliente Teste", whatsapp: "+5511999999999", email: "cliente@teste.com", whatsappOptIn: true, policyAccepted: true }) });
    alert("Agendamento criado");
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl mx-auto p-8 space-y-3">
      <h2 className="text-2xl font-semibold">Agendar sem criar conta</h2>
      <input className="w-full p-2 border rounded" placeholder="serviceId" value={serviceId} onChange={(e) => setServiceId(e.target.value)} />
      <input className="w-full p-2 border rounded" placeholder="staffMemberId" value={staffMemberId} onChange={(e) => setStaffMemberId(e.target.value)} />
      <input className="w-full p-2 border rounded" type="datetime-local" value={startAt} onChange={(e) => setStartAt(new Date(e.target.value).toISOString())} />
      <button className="px-4 py-2 rounded bg-black text-white">Confirmar</button>
    </form>
  );
}
