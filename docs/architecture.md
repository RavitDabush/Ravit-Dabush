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
app/            → Next.js App Router with language-based routing
components/     → Reusable UI components
styles/         → SCSS structure (tokens, mixins, reset, base)
i18n/           → Translation messages per locale
lib/            → Utility functions, hooks, helpers
public/         → Static assets (e.g. images, favicons)
docs/           → Internal documentation files
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