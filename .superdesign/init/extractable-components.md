# Extractable Components

## AppShell

- Source: `apps/web/src/components/AppShell.tsx`
- Category: layout
- Description: authenticated product shell with premium sidebar, sticky topbar and quick actions.
- Extractable props: `title` (string, default: "Painel operacional"), `subtitle` (string, default: "Resumo do workspace"), `workspaceName` (string, default: "Workspace"), `workspaceSlug` (string, default: "workspace"), `userName` (string, default: "Usuario"), `showLogout` (boolean, default: true)
- Hardcoded: BF brand label, sidebar item labels, trial card copy, chip styles, shell spacing and all classes.

## SectionTag

- Source: `apps/web/src/components/ui.tsx`
- Category: basic
- Description: eyebrow tag used in marketing, dashboard and booking sections.
- Extractable props: `label` (string, default: "Secao")
- Hardcoded: dot marker, uppercase typography and rounded treatment.

## Card

- Source: `apps/web/src/components/ui.tsx`
- Category: basic
- Description: blurred glass panel container.
- Extractable props: `tone` (string, default: "default"), `interactive` (boolean, default: false)
- Hardcoded: rounded radii, border treatment and shadow system.

## Button

- Source: `apps/web/src/components/ui.tsx`
- Category: basic
- Description: primary, secondary, ghost and soft CTA styles.
- Extractable props: `variant` (string, default: "primary"), `size` (string, default: "md"), `busy` (boolean, default: false)
- Hardcoded: pill geometry, font weight, transitions and shadows.
