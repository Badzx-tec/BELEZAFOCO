import { Card } from "@belezafoco/ui";
import { VerifyEmailCard } from "@/components/auth/verify-email-card";
import { PublicLayout, SectionHeading } from "@/components/site-chrome";

export default async function VerifyEmailPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <PublicLayout>
      <section className="page-shell px-4 pt-6 sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-3xl p-10 text-center">
          <SectionHeading eyebrow="Verificacao" title="Confira sua caixa de entrada." align="center" />
          <p className="mt-4 text-base leading-8 text-slate-500">
            Enviamos um link seguro para confirmar o email, ativar a sessao e liberar o onboarding do workspace.
          </p>
          <VerifyEmailCard token={token ?? null} />
        </Card>
      </section>
    </PublicLayout>
  );
}
