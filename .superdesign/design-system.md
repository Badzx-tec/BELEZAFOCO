# BELEZAFOCO Design System

## Product Context

- SaaS premium para barbearias, saloes, nail designers e esteticas.
- Jornadas prioritarias: landing comercial, agendamento publico mobile-first e dashboard operacional.
- Sensacao desejada: software caro, confiavel, calmo e muito visual.

## Visual Direction

- Base editorial-luxury com calor brasileiro.
- Contraste entre superfícies claras cremosas e painéis escuros sofisticados.
- Evitar aparência genérica de dashboard B2B azul/roxo.
- Misturar blocos de vidro, painéis escuros e imagens ilustrativas locais.

## Tokens

- Fontes:
  - headings: `Sora`
  - body/ui: `Manrope`
- Cores base:
  - `--bg: #f4ede4`
  - `--bg-soft: #fbf7f2`
  - `--text: #0f172a`
  - `--muted: #5b6476`
  - `--accent: #c26b36`
- Cores de apoio:
  - white glass surfaces com alpha alto
  - slate/ink para contraste escuro
  - emerald para sucesso
  - amber para destaque comercial
  - rose apenas para estados de erro
- Raios:
  - cards grandes: `28px` a `34px`
  - pills e botões: `9999px`
- Sombras:
  - fortes e amplas, mas macias
  - nada de sombras secas pequenas

## Layout Rules

- Mobile-first em todas as páginas.
- Hero sempre precisa de:
  - eyebrow tag
  - headline curta e forte
  - supporting copy objetivo
  - CTA primário + secundário
  - prova visual do produto
- Landing deve alternar:
  - blocos claros
  - blocos escuros
  - seções com mockups/imagens
- Dashboard deve parecer cockpit premium:
  - hero operacional superior
  - KPI cards com profundidade
  - módulos visuais para agenda, receita e ranking
- Booking público deve ter:
  - header de marca
  - capa visual do negócio
  - trilha de etapas clara
  - resumo lateral forte
  - pagamento Pix visualmente confiável

## Component Rules

- `Card` é base de superfície premium.
- `SectionTag` é o padrão para labels de seção.
- `Button` mantém geometria pill e contraste alto.
- Sempre preferir grupos de chips e badges ao invés de texto corrido para meta-info.
- Forms devem usar blocos visuais curtos, não listas densas.

## Imagery Rules

- Usar imagens e mockups locais em:
  - hero da landing
  - cards por nicho
  - capa do booking
  - módulos do dashboard
- Imagens devem reforçar valor percebido, não apenas decorar.
- Placeholder de profissionais deve ser elegante e consistente com a marca.

## Motion & Interaction

- Pequeno lift em cards interativos.
- Hover discreto em CTAs.
- Sem animações chamativas ou excessivas.
- Skeletons suaves em loading.

## Fidelity Constraints

- Use apenas `Sora`, `Manrope`, a paleta creme/slate/amber já definida e os padrões de raio/sombra existentes.
- Não introduza roxo, neon, serif decorativo, gradientes frios ou UI gamer.
- Qualquer nova seção deve parecer continuação natural do sistema visual atual, só que mais refinada e mais vendável.
