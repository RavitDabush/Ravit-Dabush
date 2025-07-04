# 📘 Developer Environment & Workflow

This document outlines the development conventions, tooling, and environment setup for the portfolio project.

---

## 🧰 Tools & Extensions

- **VSCode** (preferred editor)
- **Prettier**: Auto-formatting
- **ESLint**: Linting rules
- **i18n Ally**: i18n JSON/namespace browser
- **GitLens**: Git insight inside the editor

Workspace recommendations are stored in `.vscode/extensions.json`.

---

## 🛠 Initial Setup (for documentation purposes)

This project was initialized using:

```bash
npx create-next-app@latest
```

### SCSS support
```bash
npm install sass
```

### i18n support
```bash
npm install next-intl
```
It is a personal portfolio project — intended for viewing only.
Reusing the code, running it locally, or copying parts of it is not permitted under the custom license.

---

## 🔃 Git Conventions

### Branch Naming
| Type | Pattern |
|------|---------|
| Feature | `feature/RD-xx-description` |
| Fix | `fix/RD-xx-description` |
| Chore | `chore/RD-xx-description` |
| Docs | `docs/RD-xx-description` |
| Refactor | `refactor/RD-xx-description` |

### Commit Format
```
<type>: <description> [RD-xx]
```
Examples:
- `feat: add hero section [RD-14]`
- `chore: update .gitignore [RD-2]`

### PR Titles
Same as commit message, e.g.:
```
docs: add LICENSE file with custom restrictions [RD-4]
```

---

## ✅ Dev Checklist Template
- [ ] Branch created from `main`
- [ ] Task is linked to Jira
- [ ] Feature or fix is implemented
- [ ] Linted and formatted
- [ ] PR created and reviewed
- [ ] Merged back to `main`