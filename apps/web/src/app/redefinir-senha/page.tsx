import { Card } from "@belezafoco/ui";
import { ResetPasswordFlow } from "@/components/auth/reset-password-flow";
import { PublicLayout, SectionHeading } from "@/components/site-chrome";

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <PublicLayout>
      <section className="page-shell px-4 pt-6 sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-3xl p-10">
          <SectionHeading eyebrow="Reset de senha" title="Recupere o acesso com fluxo auditavel." />
          <ResetPasswordFlow token={token ?? null} />
        </Card>
      </section>
    </PublicLayout>
  );
}
