# 🏛 Architecture Overview

This document outlines the technical architecture and structural decisions for the project.

---

## 🎯 Goals
- Modular, scalable structure
- Clear separation of concerns
- Developer-friendly file layout
- Support for localization and accessibility

---

## 📁 Folder Structure

```
Ravit-Dabush/
├─ 📁 docs/                                → Project documentation
├─ 📁 messages/                            → Translations by language and component
│  ├─ 📁 en/                               → English Translations by component
│  └─ 📁 he/                               → Hebrew Translations by component
├─ 📁 public/                              → Static assets served as-is (images, icons, favicon, etc.)
│  ├─ 📁 fonts/                            → Custom fonts used throughout the site
├─ 📁 scripts/                             → Utility scripts (e.g., icon generation, JSON formatting)
├─ 📁 src/                                 → Main application source code
│  ├─ 📁 app/                              → Next.js App Router with locale-based routing
│  │   └─ 📁 [locale]                      → Top-level routes per language (e.g., /en, /he)
│  │   │   └─ 📁 [...rest]/                → Catch-all routing for dynamic pages
│  ├─ 📁 assets/                           → Raw assets (e.g., inline SVGs, visual resources)
│  ├─ 📁 components/                       → Reusable UI components, each in its own folder
│  │   ├─ 📁 Button/                       → Button component
│  │   ├─ 📁 Colors/                       → Color palette and theming tools
│  │   ├─ 📁 Footer/                       → Footer layout
│  │   ├─ 📁 Header/                       → Header and site navigation
│  │   ├─ 📁 IconExplorer/                 → Interactive icon exploration tool
│  │   ├─ 📁 LanguageSwitcher/             → Language toggle component
│  │   ├─ 📁 StyleGuide/                   → Internal style system showcase
│  │   │   ├─ 📁 IconsPreview/             → Preview of icon set
│  │   │   ├─ 📁 StyleGuideNav/            → Topbar navigation for style guide
│  │   │   └─ 📁 TypographyShowcase/       → Typography demonstration
│  │   ├─ 📁 Typography/                   → Core typography primitives (headings, paragraphs)
│  ├─ 📁 i18n/                             → `next-intl` configuration files and localization helpers
│  ├─ 📁 lib/                              → Logic utilities, data formatters, hooks
│  ├─ 📁 pages/                            → Optional support for Pages Router (if used alongside App Router)
│  ├─ 📁 styles/                           → Global SCSS structure (base, reset, mixins, tokens)
│  │   └─ 📁 tokens/                       → Design tokens (colors, radius, typography)
│  ├─ 📁 utils/                            → Small helpers and utility functions (e.g., formatting, constants)
├─ 📄 README.md                            → Project overview in English
├─ 📄 README.he.md                         → Project overview in Hebrew
├─ 📄 LICENSE                              → Custom license file restricting reuse

```

---

## 🔄 Data & Logic Flow
- Routing handled via `app/[locale]/page.tsx` with `next-intl`
- Layouts composed at `app/layout.tsx` level
- Components built in isolation and imported
- Shared logic (like formatting or parsing) is extracted to `lib/`

---

## 🧩 Component Strategy
- Each UI component is self-contained and receives global SCSS support
- Styles are applied via the global design system (tokens, mixins, base)
- Shared variables and utility classes are defined under `styles/`
- Icons are handled as inline SVGs and exposed via a custom icon explorer

---

## 🌍 i18n Layer
- Locale detection and routing based on folder structure
- Translations injected via `next-intl` provider

---

## 🛠 Dev Practices
- Jira used for Epic-driven task breakdown
- GitHub integration for traceable commits and PRs
- Conventional commits & structured PRs

---

## 🧠 Future-Proofing
- Designed to support content-layer expansion (e.g. integration with a headless CMS)
- StyleGuide page can evolve into design system reference or Storybook alternative

This architecture is intentionally lightweight but disciplined, supporting long-term maintainability.