# Design System

## Direção visual

- posicionamento premium, claro e elegante para o nicho de beleza
- tipografia editorial no hero e voz mais operacional no produto
- contraste controlado, fundos quentes e cards com profundidade leve

## Base atual

- CSS variables para `--brand-primary` e `--brand-accent`
- primitives próprias em `apps/web/src/components/ui.tsx`
- tokens ainda concentrados em CSS/Tailwind, sem catálogo formal

## Apoios usados nesta etapa

- Figma MCP gerou um diagrama do fluxo de booking + Pix para orientar a hierarquia visual
- shadcn MCP confirmou registry `@shadcn` e trouxe referência de `sidebar-demo`

## Próximas evoluções

1. Formalizar tokens em camadas: cor, tipografia, espaçamento, radius, shadow.
2. Adotar primitives shadcn para sidebar, tabs, dialog, sheet, select, toast e skeleton.
3. Reestruturar `DashboardPage.tsx` em layout shell + widgets.
4. Criar biblioteca de assets locais em `public/marketing`, `public/mockups` e `public/niches`.
