import { Card } from "@belezafoco/ui";
import { LoginForm } from "@/components/auth/login-form";
import { PublicLayout, SectionHeading } from "@/components/site-chrome";

export default function LoginPage() {
  const googleClientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const googleAllowedOrigins = process.env.GOOGLE_ALLOWED_ORIGINS?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];

  return (
    <PublicLayout>
      <section className="page-shell grid gap-6 px-4 pt-6 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <Card className="p-8">
          <SectionHeading eyebrow="Entrar" title="Acesse seu cockpit premium." description="Login por email, Google OAuth e sessao segura same-origin." />
        </Card>
        <Card className="p-8">
          <LoginForm googleClientId={googleClientId} googleAllowedOrigins={googleAllowedOrigins} />
        </Card>
      </section>
    </PublicLayout>
  );
}
