import { Card } from "@belezafoco/ui";
import { PublicLayout, SectionHeading } from "@/components/site-chrome";
import { faqItems } from "@/lib/site-data";

export default function FaqPage() {
  return (
    <PublicLayout>
      <section className="page-shell space-y-8 px-4 pt-6 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="FAQ" title="As respostas para rollout, operacao e venda." />
        <div className="grid gap-4 md:grid-cols-2">
          {faqItems.map((item) => (
            <Card key={item.question} className="p-6">
              <h2 className="text-2xl font-bold text-slate-950">{item.question}</h2>
              <p className="mt-4 text-sm leading-7 text-slate-500">{item.answer}</p>
            </Card>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
