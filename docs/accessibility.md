# ⚙️ Accessibility (a11y) & Semantics

This document outlines accessibility principles and implementation strategies used throughout the project.

---

## 🎯 Accessibility Goals
- Fully keyboard-navigable UI
- Meaningful ARIA roles and labels
- High-contrast and readable typography
- Screen reader support for interactive elements

My goal is to meet WCAG **AA** accessibility standards — **not because it's mandatory**, but because I believe everyone deserves the best possible experience when visiting a website.  
The web is such an integral part of our lives that it's easy to forget those who navigate it differently.  
This project is a reminder — and a commitment — to include them.

---

## 🧩 HTML Semantics
- Use of semantic tags (`<header>`, `<main>`, `<nav>`, `<section>`, etc.)
- Landmark roles applied implicitly and explicitly
- Headings structured hierarchically (`h1` → `h6`)

---

## 🔗 Navigation
- All interactive components (buttons, links) are accessible via keyboard (`Tab`, `Enter`)
- Focus indicators are visible and styled for clarity
- Custom components (e.g., `IconTile`) use `role="button"`, `tabIndex`, and `onKeyDown`

---

## 🎙 ARIA Usage
- `aria-label` for icon-only buttons
- `aria-current="page"` for active nav links
- Hidden text for screen readers where needed (`.sr-only` class)

---

## 🧪 Testing & Validation
- Manual keyboard testing
- Screen reader checks (VoiceOver/NVDA)
- Color contrast reviewed against WCAG AA

---

## 🧠 Notes
- Accessibility is a continuous process — not a one-time task
- Focused on usability as well as compliance
- Built with progressive enhancement in mind

---

## 💬 Feedback & Accessibility Support
Accessibility is an ongoing commitment. If you encounter any barriers while using this site — whether visual, structural, or interactive — I genuinely want to hear from you.

Please feel free to open an issue describing the problem.
I welcome feedback from users of all abilities and will prioritize any fix related to accessibility.

This site should be usable by everyone. If it's not working for you — I want to make it better.