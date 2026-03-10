# Design System

## Visual direction

- premium but local-market practical
- warm neutrals, dark graphite, amber accent
- glassy surfaces and soft elevation instead of cheap template flatness

## Tokens

Defined in `apps/web/src/index.css`.

- `--bg`, `--bg-soft`
- `--surface`, `--surface-strong`, `--surface-muted`
- `--border`, `--border-strong`
- `--text`, `--muted`
- `--accent`, `--accent-soft`
- `--shadow-xl`, `--shadow-lg`

## Typography

- headings: `Sora`
- body/UI: `Manrope`
- high tracking on tags and supporting meta labels

## Spacing and radius

- cards: 24px to 34px radii
- primary panels: generous padding and visible separation
- mobile layouts keep dense content inside larger radius containers

## Grid patterns

- landing hero: split narrative + proof panel
- dashboard: KPI strip, operational timeline, side radar, onboarding/services
- booking: left narrative/selection, right sticky summary form

## Components

- `Card`
- `SectionTag`
- `Badge`
- `Button`
- `Field`
- `Input`
- `Textarea`
- `CheckboxField`
- `EmptyState`
- `SkeletonBlock`

## Images and local assets

Stored in:

- `apps/web/public/marketing`
- `apps/web/public/niches`

Patterns:

- hero mockups for dashboard and mobile booking
- category/niche cards with illustration-led storytelling
- booking cover image to increase perceived value

## Hero standards

- strong headline
- short explanatory paragraph
- immediate CTA pair
- proof panel with operational metrics
- supporting mockups visible above the fold

## Card standards

- one clear message per card
- strong label + title + short support copy
- use image-led cards for segment selling

## Dashboard standards

- first screen should explain the day in seconds
- operational state beats analytics clutter
- status colors must have meaning

## Landing page standards

- sell by pain relief and professionalism
- show product surfaces visually
- map directly to Brazilian beauty-business workflows
