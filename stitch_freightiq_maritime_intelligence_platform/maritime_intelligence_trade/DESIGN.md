---
name: Maritime Intelligence & Trade
colors:
  surface: '#f8f9ff'
  surface-dim: '#c5dcfd'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d2e4ff'
  on-surface: '#021c36'
  on-surface-variant: '#44474d'
  inverse-surface: '#1a324c'
  inverse-on-surface: '#eaf1ff'
  outline: '#74777d'
  outline-variant: '#c4c6cd'
  surface-tint: '#4e6078'
  primary: '#00030b'
  on-primary: '#ffffff'
  primary-container: '#0b1e33'
  on-primary-container: '#7586a0'
  inverse-primary: '#b6c8e4'
  secondary: '#1f6868'
  on-secondary: '#ffffff'
  secondary-container: '#aaefee'
  on-secondary-container: '#276e6e'
  tertiary: '#060200'
  on-tertiary: '#ffffff'
  tertiary-container: '#2c1900'
  on-tertiary-container: '#b77800'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d3e4ff'
  primary-fixed-dim: '#b6c8e4'
  on-primary-fixed: '#091c31'
  on-primary-fixed-variant: '#37485f'
  secondary-fixed: '#aaefee'
  secondary-fixed-dim: '#8fd2d2'
  on-secondary-fixed: '#002020'
  on-secondary-fixed-variant: '#004f50'
  tertiary-fixed: '#ffddb4'
  tertiary-fixed-dim: '#ffb955'
  on-tertiary-fixed: '#291800'
  on-tertiary-fixed-variant: '#633f00'
  background: '#f8f9ff'
  on-background: '#021c36'
  surface-variant: '#d2e4ff'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.005em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
  data-metric:
    fontFamily: JetBrains Mono
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.03em
  data-tabular:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: -0.01em
  data-tabular-bold:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: -0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-base: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  gutter-desktop: 1rem
  margin-desktop: 1.5rem
  gutter-mobile: 0.5rem
  margin-mobile: 1rem
---

## Brand & Style

This design system serves high-stakes commodity procurement and maritime chartering desks where millions of dollars hinge on dynamic bulk freight rates. The brand aesthetic merges the crisp, whitespace-literate clarity of modern enterprise software with the dense, tabular precision of financial market terminals.

### Personality & Core Attributes
- **Authoritative & Institutional:** Unflinching precision, analytical depth, and disciplined visual structure that exudes institutional grade reliability.
- **Action-Oriented & Predictive:** AI-driven insights take center stage through high-salience status badges, scenario toggles, and clear directive signals (`BUY`, `WAIT`, `HEDGE`).
- **Dense yet Breathable:** High tabular data density balanced with razor-thin structural borders, clear typography hierarchy, and deliberate micro-whitespace.

### Visual Style
A tailored **Corporate Modern / Financial Terminal Hybrid**. It rejects generic SaaS decoration, focusing on crisp single-pixel rules, deliberate numeric tabular alignment, compact UI controls, and contextual semantic indicators.

## Colors

The palette grounds the interface in oceanic depths while maintaining high contrast across vast sheets of tabular data and real-time voyage indices.

### Palette Architecture
- **Primary (`#0B1E33` - Deep Navy):** Dominates high-level structural frames, side navigation, primary typographic headers, and master controls.
- **Secondary (`#0F5E5E` - Maritime Teal):** Represents operational stability, analytics baselines, route progress indicators, and maritime infrastructure telemetry.
- **Tertiary / Accent (`#F5A623` - Warm Amber):** Reserved strictly for actionable decision triggers, alert badges, critical inflection points in freight charts, and key AI recommendations.
- **Neutral Surface & Foundation:**
  - App Canvas Base: `#F7F9FB`
  - Elevated Surface Cards: `#FFFFFF`
  - Subtle Structural Borders: `#E2E8F0`
  - Emphasized Structural Borders & Dividers: `#CBD5E1`
  - Secondary Slate Neutral (`#132B45`): Table headers, secondary labels, and data column keys.

### Semantic Triage & Recommendation Tones
- **Bullish / Buy Signal:** Emerald (`#059669` fill, `#ECFDF5` surface, `#10B981` border)
- **Neutral / Wait Signal:** Amber (`#D97706` fill, `#FFFBEB` surface, `#F5A623` border)
- **Hedge / Volatility Signal:** Indigo (`#4338CA` fill, `#EEF2FF` surface, `#6366F1` border)
- **Critical Risk:** Crimson (`#DC2626` fill, `#FEF2F2` surface, `#EF4444` border)

## Typography

The typography system relies on **Inter** for all narrative layouts, navigational chrome, card headers, and UI controls, paired with **JetBrains Mono** strictly dedicated to financial figures, index tickers, freight per-metric-ton charges (`$/MT`), coordinate positions, and technical dates.

### Tabular Formatting Rules
- Always activate `font-feature-settings: "tnum" on, "cv05" on, "cv02" on` for tabular numerical columns in Inter when JetBrains Mono is not used.
- All monetary columns, freight rates, day-rate deltas, and bunker adjustment factors (BAF) must be right-aligned with standardized decimal precision.
- Use uppercase for ship IMO codes, Baltic Exchange ticker symbols (e.g., BDI, BCI, C5TC), and standard delivery incoterms (FOB, CIF).

## Layout & Spacing

A compact 12-column fluid grid system engineered for high-density enterprise displays, prioritizing screen real estate while retaining legible structure.

### Layout Model
- **Grid Architecture:** 12-column dynamic grid with a default `1rem` (16px) gutter and `1.5rem` (24px) outer margin on desktop screens (`≥ 1280px`).
- **Dense Panel Layouts:** Analytics and chartering consoles utilize side-docked collapsible inspector drawers (`320px` to `400px` fixed width) alongside a fluid primary viewport.
- **Rhythm & Density:**
  - Metrics cards and table rows leverage a condensed 4px/8px incremental rhythm.
  - Table row heights default to `36px` in compact viewing mode and `44px` in expanded mode.
  - Card internal padding is uniformly set to `1rem` (16px) to maximize data viewports.

### Breakpoints & Adaptability
- **Desktop Wide (≥1440px):** Multi-column dashboard layouts with simultaneous KPI grids, live vessel timeline panels, and route price charts.
- **Desktop / Laptop (1024px – 1439px):** Inspector sidebars collapse into overlay slide-overs; tables shift lower-priority metrics to expanded detail drawers.
- **Tablet & Mobile (<1024px):** Reflows to single-column card feeds; nested grid layouts stack vertically; tables switch to horizontal pan-scroll with frozen route identification columns.

## Elevation & Depth

This system avoids heavy, atmospheric shadows to maintain the clean crispness of a financial terminal. Depth is generated through **tonal layering** and **refined micro-shadows** paired with crisp 1px borders.

### Surface Hierarchy
- **Canvas (`#F7F9FB`):** Lowest foundational plane, hosting all container groupings.
- **Flat Containers (`#FFFFFF`):** Base cards, data tables, and toolbar strips resting directly on canvas with a solid 1px border (`#E2E8F0`).
- **Resting Elevation (Cards, KPI blocks):**
  - Border: `1px solid #E2E8F0`
  - Shadow: `0 1px 2px 0 rgba(11, 30, 51, 0.04)`
- **Hover / Active State:**
  - Border: `1px solid #CBD5E1`
  - Shadow: `0 4px 6px -1px rgba(11, 30, 51, 0.06), 0 2px 4px -2px rgba(11, 30, 51, 0.04)`
- **Floating Overlays (Dropdowns, Route Context Menus, Tooltips):**
  - Background: `#FFFFFF`
  - Border: `1px solid #CBD5E1`
  - Shadow: `0 10px 15px -3px rgba(11, 30, 51, 0.08), 0 4px 6px -4px rgba(11, 30, 51, 0.04)`
- **Modal / AI Scenario Engine Window:**
  - Backdrop: `rgba(11, 30, 51, 0.5)` with `2px` backdrop blur.
  - Container: White, `1px solid #94A3B8`, with `0 20px 25px -5px rgba(11, 30, 51, 0.15)`.

## Shapes

The design system employs a disciplined **Soft (Level 1)** geometric standard. Crisp precision is vital in dense data environments; hyper-rounded shapes waste vital horizontal pixel margin and read too casually for financial decisions.

### Radius System
- **Base / Sm (`0.25rem` / 4px):** Form inputs, buttons, table row highlights, metric indicators, scenario toggles, and data cell chips.
- **Medium / Lg (`0.5rem` / 8px):** Primary container cards, KPI summary boxes, modal frames, and floating dropdown surfaces.
- **Pill (`9999px`):** Reserved solely for AI Recommendation signals (`BUY NOW`, `WAIT 2-3 WKS`, `HEDGE`) and operational status badges, setting them apart from interactive buttons and structural containers.

## Components

### Buttons
- **Primary Button:** Background Deep Navy (`#0B1E33`), text `#FFFFFF`, radius `4px`, height `32px` (compact) or `38px` (standard). Hover: `#132B45`.
- **Accent / Procurement CTA Button:** Background Warm Amber (`#F5A623`), text Deep Navy (`#0B1E33`, weight 700), radius `4px`. Hover: `#D97706` text `#FFFFFF`.
- **Secondary / Subtle Button:** Background `#FFFFFF`, border `1px solid #CBD5E1`, text `#0B1E33`. Hover: `#F1F5F9`.

### AI Recommendation Pills
High-visibility categorical guidance badges:
- **BUY NOW:** Fill `#ECFDF5`, border `#10B981`, text `#065F46`, font JetBrains Mono 11px bold, 9999px radius, uppercase.
- **WAIT 2-3 WKS:** Fill `#FFFBEB`, border `#F5A623`, text `#92400E`, font JetBrains Mono 11px bold, 9999px radius, uppercase.
- **HEDGE:** Fill `#EEF2FF`, border `#6366F1`, text `#3730A3`, font JetBrains Mono 11px bold, 9999px radius, uppercase.

### Risk Level Chips
Compact indicators featuring a 6px status dot alongside text:
- **Low Risk:** Green dot (`#10B981`), text Slate Navy (`#132B45`), background `#F8FAFC`, border `#E2E8F0`.
- **Medium Risk:** Amber dot (`#F5A623`), text Slate Navy (`#132B45`), background `#F8FAFC`, border `#E2E8F0`.
- **High Risk:** Red dot (`#EF4444`), text Crimson (`#B91C1C`), background `#FEF2F2`, border `#FECACA`.

### KPI Summary Cards
- Surface: `#FFFFFF` with `1px solid #E2E8F0`, rounded `8px`, padding `16px`.
- Layout: Top row contains micro-label (Inter 11px uppercase, tracking wide, `#64748B`) and optional sparkline/delta pill. Middle row displays the metric (JetBrains Mono 22px bold, `#0B1E33`). Bottom row displays comparative AI baseline and confidence interval.

### Interactive Scenario Toggles
- Segmented switches encased in a track (`#F1F5F9` background, `4px` radius, `2px` internal padding).
- Selected segment: Background `#FFFFFF`, box-shadow `0 1px 2px rgba(0,0,0,0.06)`, text `#0B1E33`, weight 600.
- Unselected segment: Text `#64748B`, hover text `#0B1E33`.

### Route Badge Tags
- Identifier tags for maritime corridors (e.g., `TUBARAO → QINGDAO (C3)`, `US GULF → ALEXANDRIA`).
- Style: Monospace font (JetBrains Mono 11px), background `#F1F5F9`, border `1px solid #CBD5E1`, text `#0F5E5E`, rounded `4px`, padding `2px 6px`.

### Data Tables & Expandable Details
- **Header:** Height `32px`, background `#F8FAFC`, bottom border `1px solid #CBD5E1`, font Inter 11px uppercase bold, text `#475569`.
- **Row:** Height `36px` to `42px`, border-bottom `1px solid #F1F5F9`, alternating row background optional for dense terminal views (`#FFFFFF` to `#FBFCFD`). Hover: `#F0FDF9` (Maritime Teal tint).
- **Expandable Detail Drawer:** Inset sub-table with left border `3px solid #0F5E5E`, background `#F8FAFC`, housing vessel particulars, historical fixtures, and port congestion metrics.

### Input Fields & Controls
- Height `32px` or `36px`, border `1px solid #CBD5E1`, radius `4px`, background `#FFFFFF`.
- Focus state: Border `1px solid #0F5E5E` with `0 0 0 2px rgba(15, 94, 94, 0.15)` ring. No heavy default blue outlines.