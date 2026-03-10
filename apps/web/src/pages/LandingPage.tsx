import { Link } from "react-router-dom";
import { Badge, Button, Card, SectionTag } from "../components/ui";
import {
  ArrowRightIcon,
  AvatarStack,
  BrandMark,
  CalendarIcon,
  ChartIcon,
  CheckIcon,
  FloatingBadge,
  ImageShowcase,
  PlayIcon,
  PremiumMetricCard,
  ShieldIcon,
  SparkIcon,
  WalletIcon
} from "../components/premium";

const heroHighlights = [
  "Agenda online com identidade premium e link publico proprio",
  "Lembretes e confirmacoes por WhatsApp com menos atrito",
  "Sinal no Pix para proteger horarios mais disputados",
  "Dashboard claro para operar equipe, receita e ocupacao"
];

const platformPillars = [
  {
    title: "Operacao sem remendo",
    description: "Agenda, recepcao, bloqueios, encaixes e follow-up saem do improviso e viram processo claro.",
    icon: <CalendarIcon className="h-5 w-5" />
  },
  {
    title: "Comunicacao que vende",
    description: "WhatsApp e e-mail entram no fluxo certo para confirmar, lembrar e reduzir falta.",
    icon: <SparkIcon className="h-5 w-5" />
  },
  {
    title: "Pix dentro da jornada",
    description: "Servicos premium podem exigir sinal com experiencia confiavel, rastreavel e elegante.",
    icon: <WalletIcon className="h-5 w-5" />
  }
];

const nicheCards = [
  {
    title: "Barbearias",
    label: "Estilo Masculino",
    description: "Fila inteligente, barbeiro certo e sinal nos sabados de agenda mais disputada.",
    image: "/niches/barbearia-premium.svg"
  },
  {
    title: "Salao & Estetica",
    label: "Luxo Feminino",
    description: "Fluxo para procedimentos longos, salas compartilhadas e recorrencia com mais controle.",
    image: "/niches/salao-premium.svg"
  },
  {
    title: "Nail Design",
    label: "Especialistas",
    description: "Reserva mobile-first para negocios que dependem de retorno frequente e valor percebido.",
    image: "/niches/nail-premium.svg"
  }
];

const pricingPlans = [
  {
    name: "Fundador Solo",
    price: "R$ 59",
    suffix: "/mes",
    note: "Para profissionais solo que querem vender melhor sem complicacao.",
    featured: false,
    features: ["1 profissional", "Link publico premium", "WhatsApp essencial"]
  },
  {
    name: "Fundador Equipe",
    price: "R$ 99",
    suffix: "/mes",
    note: "Plano principal para negocios locais com equipe pequena e agenda intensa.",
    featured: true,
    features: ["Ate 6 profissionais", "Dashboard operacional", "Sinal Pix e ranking de servicos"]
  },
  {
    name: "Fundador Pro",
    price: "R$ 149",
    suffix: "/mes",
    note: "Para estudios que precisam de operacao mais forte e base de crescimento.",
    featured: false,
    features: ["Equipe ampliada", "Mais controle comercial", "Pronto para multiunidade"]
  }
];

const faqs = [
  {
    question: "Serve para barbearia, salao, nail e estetica?",
    answer: "Sim. O produto foi pensado para nichos com duracoes diferentes, multiplos profissionais e forte dependencia de WhatsApp."
  },
  {
    question: "O sinal Pix e obrigatorio?",
    answer: "Nao. Cada servico define se exige ou nao sinal, conforme risco de falta e valor do horario."
  },
  {
    question: "Em quanto tempo da para colocar no ar?",
    answer: "Negocios pequenos conseguem publicar o link e operar o essencial no mesmo dia se servicos e equipe ja estiverem definidos."
  },
  {
    question: "Posso usar no celular sem sacrificar a experiencia?",
    answer: "Sim. A jornada publica e o painel foram pensados para funcionamento forte em celular e tablet."
  }
];

const avatarItems = [
  { src: "/professionals-placeholders/artist-amber.svg", alt: "Profissional premium 1" },
  { src: "/professionals-placeholders/artist-graphite.svg", alt: "Profissional premium 2" },
  { src: "/professionals-placeholders/artist-amber.svg", alt: "Profissional premium 3" }
];

export function LandingPage() {
  return (
    <div className="relative overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[40rem] bg-[radial-gradient(circle_at_top,rgba(194,107,54,0.16),transparent_62%)]" />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-10 md:gap-14">
        <header className="space-y-10">
          <nav className="surface px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <BrandMark subtitle="Agenda premium para negocios de beleza" />
              <div className="flex flex-wrap gap-2">
                <Link to="/auth">
                  <Button variant="secondary">Entrar</Button>
                </Link>
                <Link to="/auth">
                  <Button>Criar conta gratis</Button>
                </Link>
              </div>
            </div>
          </nav>

          <section className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <SectionTag>Premium SaaS for Beauty</SectionTag>
                <h1 className="max-w-4xl text-balance text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl xl:text-7xl">
                  Sua agenda e o coracao do negocio.
                  <span className="block text-[var(--accent)]">Dê a ela foco, venda e valor percebido.</span>
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                  BELEZAFOCO une agenda, WhatsApp, sinal no Pix e visao operacional em uma interface que passa profissionalismo antes
                  mesmo do primeiro atendimento.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Link to="/auth">
                  <Button className="gap-2" size="lg">
                    Comecar agora
                    <ArrowRightIcon className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#planos">
                  <Button size="lg" variant="secondary">
                    Ver planos
                  </Button>
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <AvatarStack items={avatarItems} />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Negocios locais usando o fluxo para operar com mais calma</p>
                  <p className="mt-1 text-sm text-slate-500">barbearias, saloes, esteticas e nail designers em agenda intensa</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {heroHighlights.map((item) => (
                  <div key={item} className="rounded-[26px] border border-slate-200/75 bg-white/78 px-4 py-4">
                    <div className="flex gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[color:var(--accent)]">
                        <CheckIcon className="h-4 w-4" />
                      </span>
                      <p className="text-sm font-medium leading-6 text-slate-700">{item}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="surface-dark relative overflow-hidden p-6 text-white sm:p-8">
              <div className="absolute -right-12 top-4 h-48 w-48 rounded-full bg-[rgba(194,107,54,0.2)] blur-3xl" />
              <div className="relative space-y-5">
                <div className="grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
                  <PremiumMetricCard
                    detail="+24% vs ultimo mes com rotinas melhores e agenda mais previsivel."
                    icon={<ChartIcon className="h-5 w-5" />}
                    label="Performance Live"
                    tone="dark"
                    value="R$ 14.280"
                  />
                  <div className="rounded-[30px] border border-white/10 bg-white/6 p-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/44">Proximo cliente</p>
                    <p className="mt-4 text-2xl font-semibold text-white">Juliana Ribeiro</p>
                    <p className="mt-2 text-sm text-white/68">Mechas + Tratamento com confirmacao concluida.</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Badge tone="accent" className="bg-amber-400/12 text-amber-200 ring-amber-300/20">
                        Sinal pago
                      </Badge>
                      <Badge className="bg-white/8 text-white ring-white/10">14:30</Badge>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1fr_220px]">
                  <ImageShowcase
                    action={
                      <div className="flex items-center gap-3 text-white">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-950 shadow-xl">
                          <PlayIcon className="h-5 w-5" />
                        </span>
                        <span className="text-sm font-semibold uppercase tracking-[0.22em] text-white/82">Tour do produto</span>
                      </div>
                    }
                    alt="Mockup premium do cockpit BELEZAFOCO"
                    className="min-h-[320px]"
                    dark
                    image="/marketing/hero-cockpit-premium.svg"
                    imageClassName="h-full w-full object-cover"
                    label="Cockpit ao vivo"
                    overlay={
                      <>
                        <FloatingBadge className="absolute left-4 top-16">
                          <SparkIcon className="h-3.5 w-3.5 text-amber-300" />
                          mais controle
                        </FloatingBadge>
                        <FloatingBadge className="absolute right-4 top-4">
                          ocupacao 83%
                        </FloatingBadge>
                      </>
                    }
                  />
                  <ImageShowcase
                    alt="Fluxo mobile premium do booking publico"
                    className="min-h-[320px]"
                    dark
                    image="/marketing/mobile-booking-premium.svg"
                    imageClassName="object-contain p-4"
                    label="Booking mobile"
                  />
                </div>
              </div>
            </div>
          </section>
        </header>

        <section className="surface-dark grid gap-4 px-6 py-6 text-white sm:grid-cols-3 sm:px-8">
          <div className="rounded-[26px] border border-white/10 bg-white/6 px-5 py-5">
            <p className="text-4xl font-semibold">-41%</p>
            <p className="mt-2 text-sm text-white/68">menos faltas com lembretes e regras de reserva claras</p>
          </div>
          <div className="rounded-[26px] border border-white/10 bg-white/6 px-5 py-5">
            <p className="text-4xl font-semibold">98%</p>
            <p className="mt-2 text-sm text-white/68">satisfacao mobile em uma jornada publica mais limpa</p>
          </div>
          <div className="rounded-[26px] border border-white/10 bg-white/6 px-5 py-5">
            <p className="text-4xl font-semibold">Pix + Zap</p>
            <p className="mt-2 text-sm text-white/68">na mesma experiencia sem depender de processo quebrado</p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {platformPillars.map((item) => (
            <Card key={item.title} interactive className="px-6 py-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">{item.icon}</div>
              <p className="mt-5 text-2xl font-semibold text-slate-950">{item.title}</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
            </Card>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          {nicheCards.map((item) => (
            <Card key={item.title} interactive className="overflow-hidden p-3">
              <ImageShowcase alt={item.title} className="aspect-[4/5]" image={item.image} label={item.label} />
              <div className="px-3 pb-2 pt-5">
                <p className="text-2xl font-semibold text-slate-950">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
              </div>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.94fr_1.06fr]">
          <Card className="overflow-hidden px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-5">
              <div>
                <SectionTag>Implantacao rapida</SectionTag>
                <h2 className="mt-4 text-balance text-3xl font-semibold text-slate-950">
                  Produto pensado para vender bem no mercado local sem parecer amador.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
                  Quando o dono enxerga agenda organizada, prova visual, link bonito e fluxo de confirmacao claro, a conversa comercial
                  fica mais facil.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  "Cadastre negocio, equipe, horarios e servicos em poucos passos.",
                  "Publique o link de reserva com a sua cara e mais valor percebido.",
                  "Ative confirmacoes, lembretes e politica de cancelamento.",
                  "Escolha onde faz sentido cobrar sinal no Pix."
                ].map((step, index) => (
                  <div key={step} className="flex gap-4 rounded-[26px] border border-slate-200/75 bg-white/74 px-4 py-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                      0{index + 1}
                    </span>
                    <p className="text-sm font-medium leading-6 text-slate-700">{step}</p>
                  </div>
                ))}
              </div>

              <ImageShowcase
                alt="Painel premium do BELEZAFOCO para vendas e operacao"
                className="min-h-[260px]"
                image="/marketing/dashboard-spotlight.svg"
                label="Painel premium"
              />
            </div>
          </Card>

          <Card className="px-6 py-6 sm:px-8" id="planos">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <SectionTag>Planos</SectionTag>
                <h2 className="mt-4 text-3xl font-semibold text-slate-950">Planos para testar, vender e crescer.</h2>
              </div>
              <Badge tone="success">trial incluido</Badge>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-[30px] border px-5 py-5 ${
                    plan.featured
                      ? "bg-slate-950 text-white shadow-[0_34px_80px_-44px_rgba(15,23,42,0.82)] border-slate-950"
                      : "border-slate-200/80 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={`text-[11px] font-bold uppercase tracking-[0.24em] ${plan.featured ? "text-amber-300/72" : "text-slate-400"}`}>
                        {plan.featured ? "Mais assinado" : "Plano"}
                      </p>
                      <p className={`mt-3 text-2xl font-semibold ${plan.featured ? "text-white" : "text-slate-950"}`}>{plan.name}</p>
                    </div>
                    {plan.featured ? (
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/12 text-amber-300">
                        <SparkIcon className="h-5 w-5" />
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-5 flex items-end gap-1">
                    <p className={`text-4xl font-semibold ${plan.featured ? "text-white" : "text-slate-950"}`}>{plan.price}</p>
                    <p className={`pb-1 text-sm font-semibold ${plan.featured ? "text-white/44" : "text-slate-400"}`}>{plan.suffix}</p>
                  </div>

                  <p className={`mt-3 text-sm leading-6 ${plan.featured ? "text-white/72" : "text-slate-600"}`}>{plan.note}</p>

                  <div className="mt-5 space-y-2">
                    {plan.features.map((feature) => (
                      <div
                        key={feature}
                        className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-sm ${
                          plan.featured ? "bg-white/8 text-white" : "bg-slate-50 text-slate-700"
                        }`}
                      >
                        <CheckIcon className="h-4 w-4 shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  <Link className="mt-6 inline-flex w-full" to="/auth">
                    <Button className="w-full" variant={plan.featured ? "secondary" : "primary"}>
                      {plan.featured ? "Selecionar plano" : "Iniciar trial"}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="surface px-6 py-6 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div>
              <SectionTag>Seguranca e confianca</SectionTag>
              <h2 className="mt-4 text-balance text-3xl font-semibold text-slate-950">
                Um software bonito so vende de verdade quando transmite controle.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Por isso o produto combina experiencia visual premium com fluxos que deixam a operacao mais previsivel para quem atende e
                para quem agenda.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] border border-slate-200/80 bg-white/86 px-5 py-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[color:var(--accent)]">
                  <ShieldIcon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-lg font-semibold text-slate-950">Reserva com mais confianca</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Cliente entende a politica, o sinal e o proximo passo sem ruído.</p>
              </div>
              <div className="rounded-[28px] border border-slate-200/80 bg-white/86 px-5 py-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <ChartIcon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-lg font-semibold text-slate-950">Visao comercial clara</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Receita prevista, equipe ativa e servicos fortes aparecem com leitura rapida.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-4">
          {faqs.map((item) => (
            <div key={item.question} className="rounded-[28px] border border-slate-200/80 bg-white/82 px-5 py-5">
              <p className="text-lg font-semibold text-slate-950">{item.question}</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
            </div>
          ))}
        </section>

        <Card className="overflow-hidden px-6 py-7 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <SectionTag>Proximo passo</SectionTag>
              <h2 className="mt-4 text-balance text-3xl font-semibold text-slate-950">
                Se agenda, confirmacao e cobranca ainda vivem separadas, o negocio esta perdendo margem e tempo.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Crie sua conta, publique seu link e coloque a operacao em um fluxo real, bonito e mais convincente para demo ou venda.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/auth">
                <Button size="lg">Criar conta</Button>
              </Link>
              <a href="#planos">
                <Button size="lg" variant="secondary">
                  Ver planos
                </Button>
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
