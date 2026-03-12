import { Card } from "@belezafoco/ui";
import { RegisterForm } from "@/components/auth/register-form";
import { PublicLayout, SectionHeading } from "@/components/site-chrome";

export default function RegisterPage() {
  const googleClientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const googleAllowedOrigins = process.env.GOOGLE_ALLOWED_ORIGINS?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];

  return (
    <PublicLayout>
      <section className="page-shell grid gap-6 px-4 pt-6 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <Card className="p-8">
          <SectionHeading
            eyebrow="Cadastro"
            title="Crie seu workspace sem perder a elegancia operacional."
            description="Fluxo para email + senha, com vinculacao posterior de Google e checklist de onboarding."
          />
        </Card>
        <Card className="p-8">
          <RegisterForm googleClientId={googleClientId} googleAllowedOrigins={googleAllowedOrigins} />
        </Card>
      </section>
    </PublicLayout>
  );
}
