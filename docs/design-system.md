# 🎨 Design System Overview

This document outlines the structure, styling philosophy, and SCSS setup for the project's custom design system.

---

## 🌈 Design Goals
- Consistent visual language
- Clear typographic hierarchy
- Spacing & color tokens
- Easy-to-scale utility classes

---

## 🎯 SCSS Structure

```
styles/
├─ reset.scss           # Element reset to normalize cross-browser styles
├─ base.scss            # Global resets & base styles
├─ tokens/
│   ├─ _colors.scss     # Primary, neutral, alert color tokens
│   ├─ _spacing.scss    # Standardized spacing system
│   ├─ _radius.scss     # Border-radius tokens
│   └─ _typography.scss # Font sizes, line heights, weights
├─ mixins.scss          # Shared mixins (e.g. flex, truncate)
├─ functions.scss       # Utility functions (e.g. rem conversion)
```

---

## ✍️ Typography
- Defined in `tokens/_typography.scss`
- Supports headings, paragraphs, inline code
- Semantic elements styled via base selectors

---

## 🟣 Components & Utility
- All component styles are derived from the global SCSS design system
- Tokens and variables are consumed using shared `@use` or `@import` logic
- Layout and spacing utilities follow a consistent structure across the site

---

## 🧪 StyleGuide
- Dedicated route/page for live demo of styles
- Includes: color palette, spacing grid, typography, buttons, icons
- Serves as a living reference for future scaling

---

## 🧠 Notes
- SCSS variables declared under `:root` for runtime theming flexibility
- Designed to be extendable (e.g. dark mode, theming in future)