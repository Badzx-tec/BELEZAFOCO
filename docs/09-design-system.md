# Design System

## Visual direction

- premium, quente e editorial, sem cara de template genérico
- contraste entre creme luminoso e paineis grafite profundos
- accent amber para valor percebido, CTA e prova comercial
- linguagem pensada para barbearias, saloes, nail designers e esteticas no Brasil

## Tokens

Definidos em `apps/web/src/index.css`.

- `--bg`, `--bg-soft`
- `--surface`, `--surface-strong`, `--surface-muted`
- `--border`, `--border-strong`
- `--text`, `--muted`
- `--accent`, `--accent-soft`
- `--shadow-xl`, `--shadow-lg`

## Typography

- headings: `Sora`
- body/UI: `Manrope`
- tags e meta-info com tracking alto para leitura premium

## Spacing and radius

- cards e painéis: `26px` a `34px`
- CTAs e chips: pill full radius
- grids respiram mais no desktop, mas mantem densidade controlada no mobile

## Shared components

- base: `Card`, `SectionTag`, `Badge`, `Button`, `Field`, `Input`, `Textarea`, `CheckboxField`, `EmptyState`, `SkeletonBlock`
- premium layer: `BrandMark`, `PremiumMetricCard`, `ImageShowcase`, `AvatarStack`, `StepRail`, `FloatingBadge`
- shell: `AppShell` com sidebar escura e topbar editorial

## Images and local assets

Pastas usadas:

- `apps/web/public/marketing`
- `apps/web/public/niches`
- `apps/web/public/professionals-placeholders`

Assets principais:

- `hero-cockpit-premium.svg`
- `mobile-booking-premium.svg`
- `dashboard-spotlight.svg`
- `barbearia-premium.svg`
- `salao-premium.svg`
- `nail-premium.svg`
- `artist-amber.svg`
- `artist-graphite.svg`

Regras:

- nada de hotlink em produção
- imagem sempre reforça conversão, confiança ou contexto operacional
- placeholders de profissionais precisam parecer consistentes com a marca

## Landing page standards

- hero editorial com headline curta e forte
- dupla de CTA clara logo no topo
- produto mostrado com mockup desktop + mobile
- prova social resumida em ribbon forte
- cards de nicho com imagem grande e leitura imediata
- pricing com um plano central visualmente dominante

## Booking page standards

- capa superior com identidade da unidade e contato claro
- narrativa curta e aspiracional, sem texto excessivo
- cards de serviço mais visuais, com imagem local por nicho/categoria
- resumo lateral forte com progresso, profissional e sinal Pix
- foco absoluto em mobile-first e confiança do usuário

## Dashboard standards

- parecer cockpit operacional, não relatório frio
- KPIs do topo precisam explicar o dia em segundos
- agenda vem antes de analytics profundos
- CRM, ranking e leitura do workspace entram como módulos secundários
- dark navigation + warm surfaces como padrão da área autenticada

## Card standards

- uma mensagem principal por card
- título forte, suporte curto e badge só quando agrega contexto
- uso de imagem preferencial em cards de marketing e seleção pública

## Motion and interaction

- lift discreto em cards interativos
- hover curto em CTA e ações principais
- nada de microinterações excessivas

## Validation notes

- a linguagem visual final foi guiada pelo workflow da skill local `superdesign`
- landing validada visualmente em preview local com Playwright
- booking local apontando para API remota expôs bloqueio de CORS cross-origin em preview local; em produção same-origin a jornada continua sendo a referência operacional
