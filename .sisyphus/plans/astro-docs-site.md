# Astro Starlight Documentation Site

## TL;DR

> **Quick Summary**: Create a full documentation website for better-auth-paymongo using Astro Starlight, with complete API reference, guides, and examples. Deploy to GitHub Pages.
> 
> **Deliverables**:
> - Astro Starlight project in `/docs` directory
> - 10+ documentation pages covering all features
> - GitHub Actions workflow for automatic deployment
> - Sidebar navigation with organized sections
> 
> **Estimated Effort**: Medium (2-3 hours)
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 → Tasks 2-6 → Task 7

---

## Context

### Original Request
Create an Astro-based GitHub documentation site with complete usage guide for the better-auth-paymongo project.

### Research Findings
**Astro Starlight Setup:**
- CLI: `npm create astro@latest -- --template starlight`
- Docs location: `src/content/docs/`
- Sidebar config in `astro.config.mjs`
- Deploy with `withastro/action@v2`
- Supports code highlighting, tabs, asides, steps components

**Project APIs to Document:**
- Server: `paymongo()` plugin with `/attach`, `/check`, `/track` endpoints
- Client: `paymongoClient()` with attach/check/track actions
- React: `useCheck()`, `useSubscription()`, `refreshBilling()`
- Organization: `createPaymongoOrganization()`, `createSeatLimit()`, `getOrganizationSeats()`
- Types: `PaymongoAutumnConfig`, `PlanConfig`, `FeatureConfig`, etc.

---

## Work Objectives

### Core Objective
Build a production-ready documentation website using Astro Starlight that covers all aspects of the better-auth-paymongo plugin, deployed to GitHub Pages.

### Concrete Deliverables
- `/docs/` - Astro Starlight project
- `/docs/src/content/docs/` - All documentation pages
- `/docs/astro.config.mjs` - Configured with sidebar
- `/.github/workflows/deploy-docs.yml` - GitHub Actions deployment

### Definition of Done
- [x] `cd docs && npm run build` completes without errors
- [x] Documentation covers: installation, server API, client SDK, React hooks, organization billing, examples
- [x] GitHub Actions workflow exists and is valid YAML
- [x] Sidebar navigation properly organized

### Must Have
- Getting Started guide with installation + quick start
- Full API reference for all 3 entry points (server, client, react)
- Code examples with syntax highlighting
- Organization/seat-based billing documentation

### Must NOT Have (Guardrails)
- ❌ Do NOT modify source code in `/src/`
- ❌ Do NOT use deprecated Astro APIs
- ❌ Do NOT create custom CSS (use Starlight defaults)
- ❌ Do NOT add analytics or tracking scripts

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO (new docs project)
- **User wants tests**: Manual verification
- **Framework**: None (static site)

### Verification Procedures

**For each task:**
```bash
# Verify build works
cd docs && npm run build
# Assert: Exit code 0

# Verify page exists
ls docs/src/content/docs/{page}.md
# Assert: File exists
```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
└── Task 1: Scaffold Astro Starlight project in /docs

Wave 2 (After Wave 1):
├── Task 2: Create Getting Started pages
├── Task 3: Create Server API Reference
├── Task 4: Create Client SDK Reference
├── Task 5: Create React Hooks Reference
└── Task 6: Create Guides (organization, examples)

Wave 3 (After Wave 2):
└── Task 7: Create GitHub Actions deployment + final config
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 3, 4, 5, 6 | None |
| 2 | 1 | 7 | 3, 4, 5, 6 |
| 3 | 1 | 7 | 2, 4, 5, 6 |
| 4 | 1 | 7 | 2, 3, 5, 6 |
| 5 | 1 | 7 | 2, 3, 4, 6 |
| 6 | 1 | 7 | 2, 3, 4, 5 |
| 7 | 2, 3, 4, 5, 6 | None | None (final) |

---

## TODOs

- [x] 1. Scaffold Astro Starlight Project

  **What to do**:
  - Create `/docs` directory
  - Initialize Astro Starlight project with package.json
  - Configure `astro.config.mjs` with:
    - Title: "better-auth-paymongo"
    - Social links (GitHub)
    - Sidebar structure (placeholder)
  - Create `src/content/docs/index.mdx` landing page

  **Must NOT do**:
  - ❌ Run npm install (just create config files)
  - ❌ Modify anything outside /docs

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`brainstorming`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (solo)
  - **Blocks**: Tasks 2, 3, 4, 5, 6
  - **Blocked By**: None

  **References**:
  - Astro Starlight docs: https://starlight.astro.build/getting-started/
  - Project name from: `package.json` → `"name": "better-auth-paymongo"`
  - GitHub URL: `https://github.com/darkziah/better-auth-paymongo`

  **Acceptance Criteria**:
  - [x] `docs/package.json` exists with astro/starlight dependencies
  - [x] `docs/astro.config.mjs` exists with starlight() integration
  - [x] `docs/src/content/docs/index.mdx` exists with intro content
  - [x] `cd docs && cat astro.config.mjs` shows valid config

  **Commit**: YES
  - Message: `docs: scaffold astro starlight project`
  - Files: `docs/**`

---

- [x] 2. Create Getting Started Documentation

  **What to do**:
  - Create `docs/src/content/docs/getting-started/index.md` - Installation
  - Create `docs/src/content/docs/getting-started/quick-start.md` - Quick Start guide
  - Create `docs/src/content/docs/getting-started/configuration.md` - Config reference
  - Update sidebar in `astro.config.mjs`

  **Content to include**:
  - npm/bun/pnpm install commands
  - Server plugin setup with full config example
  - Client plugin setup
  - Database migration command
  - Configuration reference table

  **Must NOT do**:
  - ❌ Duplicate README content verbatim (rewrite for docs format)
  - ❌ Skip code syntax highlighting

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4, 5, 6)
  - **Blocks**: Task 7
  - **Blocked By**: Task 1

  **References**:
  - Source content: `README.md` lines 16-115 (Installation, Quick Start)
  - Config types: `src/types.ts` → `PaymongoAutumnConfig`, `PlanConfig`, `FeatureConfig`

  **Acceptance Criteria**:
  - [x] `docs/src/content/docs/getting-started/index.md` exists
  - [x] `docs/src/content/docs/getting-started/quick-start.md` exists
  - [x] `docs/src/content/docs/getting-started/configuration.md` exists
  - [x] `cd docs && npm run build` succeeds

  **Commit**: YES (group with Wave 2)
  - Message: `docs: add getting started guides`
  - Files: `docs/src/content/docs/getting-started/**`

---

- [x] 3. Create Server API Reference

  **What to do**:
  - Create `docs/src/content/docs/api/server.md`
  - Document `paymongo()` server plugin
  - Document all 3 endpoints with request/response examples:
    - `POST /api/auth/paymongo/attach`
    - `GET /api/auth/paymongo/check`
    - `POST /api/auth/paymongo/track`

  **Content format**:
  - Endpoint path, method
  - Request body/query params (with types)
  - Response shape (with types)
  - Example curl commands
  - Error responses

  **Must NOT do**:
  - ❌ Include internal implementation details

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 4, 5, 6)
  - **Blocks**: Task 7
  - **Blocked By**: Task 1

  **References**:
  - Implementation: `src/server.ts` (endpoints at lines 50-200)
  - README examples: `README.md` lines 118-198

  **Acceptance Criteria**:
  - [x] `docs/src/content/docs/api/server.md` exists
  - [x] Documents all 3 endpoints with examples
  - [x] `cd docs && npm run build` succeeds

  **Commit**: YES (group with Wave 2)
  - Message: `docs: add server API reference`
  - Files: `docs/src/content/docs/api/server.md`

---

- [x] 4. Create Client SDK Reference

  **What to do**:
  - Create `docs/src/content/docs/api/client.md`
  - Document `paymongoClient()` plugin
  - Document all 3 client actions:
    - `attach(planId, options)`
    - `check(featureId, options?)`
    - `track(featureId, options?)`
  - Include TypeScript signatures and examples

  **Must NOT do**:
  - ❌ Duplicate server API docs

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 3, 5, 6)
  - **Blocks**: Task 7
  - **Blocked By**: Task 1

  **References**:
  - Implementation: `src/client.ts`
  - README examples: `README.md` lines 202-252

  **Acceptance Criteria**:
  - [x] `docs/src/content/docs/api/client.md` exists
  - [x] Documents attach/check/track with TypeScript examples
  - [x] `cd docs && npm run build` succeeds

  **Commit**: YES (group with Wave 2)
  - Message: `docs: add client SDK reference`
  - Files: `docs/src/content/docs/api/client.md`

---

- [x] 5. Create React Hooks Reference

  **What to do**:
  - Create `docs/src/content/docs/api/react.md`
  - Document all exports from `better-auth-paymongo/react`:
    - `useCheck(featureId, options?)` - with return type table
    - `useSubscription()` - with return type table
    - `refreshBilling()` - usage explanation
  - Include practical examples (FeatureGate, BillingStatus components)

  **Must NOT do**:
  - ❌ Skip the return type tables

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 3, 4, 6)
  - **Blocks**: Task 7
  - **Blocked By**: Task 1

  **References**:
  - Implementation: `src/react.ts`
  - README examples: `README.md` lines 347-416

  **Acceptance Criteria**:
  - [x] `docs/src/content/docs/api/react.md` exists
  - [x] Documents useCheck, useSubscription, refreshBilling
  - [x] Includes return type tables
  - [x] `cd docs && npm run build` succeeds

  **Commit**: YES (group with Wave 2)
  - Message: `docs: add react hooks reference`
  - Files: `docs/src/content/docs/api/react.md`

---

- [x] 6. Create Guides Section

  **What to do**:
  - Create `docs/src/content/docs/guides/organization-billing.md` - Organization & seat-based billing
  - Create `docs/src/content/docs/guides/examples.md` - Practical examples
  - Create `docs/src/content/docs/concepts/autumn-pattern.md` - The Autumn pattern explained
  - Create `docs/src/content/docs/concepts/feature-types.md` - Boolean vs Metered features

  **Guide content**:
  - Organization billing: `createPaymongoOrganization`, `createSeatLimit`, `getOrganizationSeats`
  - Examples: Pricing page, Usage dashboard, Protecting API routes
  - Concepts: Payment flow diagram, usage tracking flow

  **Must NOT do**:
  - ❌ Make guides too long (split into focused pages)

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 3, 4, 5)
  - **Blocks**: Task 7
  - **Blocked By**: Task 1

  **References**:
  - Organization: `src/organization.ts`, `README.md` lines 256-344
  - Concepts: `README.md` lines 419-466
  - Examples: `README.md` lines 522-648

  **Acceptance Criteria**:
  - [x] `docs/src/content/docs/guides/organization-billing.md` exists
  - [x] `docs/src/content/docs/guides/examples.md` exists
  - [x] `docs/src/content/docs/concepts/autumn-pattern.md` exists
  - [x] `docs/src/content/docs/concepts/feature-types.md` exists
  - [x] `cd docs && npm run build` succeeds

  **Commit**: YES (group with Wave 2)
  - Message: `docs: add guides and concepts sections`
  - Files: `docs/src/content/docs/guides/**`, `docs/src/content/docs/concepts/**`

---

- [x] 7. Configure Sidebar and GitHub Actions Deployment

  **What to do**:
  - Update `docs/astro.config.mjs` with complete sidebar:
    ```javascript
    sidebar: [
      { label: 'Introduction', link: '/' },
      {
        label: 'Getting Started',
        autogenerate: { directory: 'getting-started' },
      },
      {
        label: 'API Reference',
        items: [
          { label: 'Server Plugin', link: '/api/server/' },
          { label: 'Client SDK', link: '/api/client/' },
          { label: 'React Hooks', link: '/api/react/' },
        ],
      },
      {
        label: 'Guides',
        autogenerate: { directory: 'guides' },
      },
      {
        label: 'Concepts',
        autogenerate: { directory: 'concepts' },
      },
    ]
    ```
  - Create `.github/workflows/deploy-docs.yml` for GitHub Pages deployment
  - Update `docs/astro.config.mjs` with `site` and `base` for GitHub Pages

  **Must NOT do**:
  - ❌ Use incorrect base path (must be `/better-auth-paymongo/`)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (solo, final)
  - **Blocks**: None (final task)
  - **Blocked By**: Tasks 2, 3, 4, 5, 6

  **References**:
  - Astro GH Pages deploy: https://docs.astro.build/en/guides/deploy/github/
  - Repo URL: `https://github.com/darkziah/better-auth-paymongo`

  **Acceptance Criteria**:
  - [x] `docs/astro.config.mjs` has complete sidebar config
  - [x] `.github/workflows/deploy-docs.yml` exists
  - [x] Workflow uses `withastro/action@v2`
  - [x] `cd docs && npm run build` succeeds
  - [x] `cat .github/workflows/deploy-docs.yml | head -20` shows valid YAML

  **Commit**: YES
  - Message: `docs: configure sidebar and github pages deployment`
  - Files: `docs/astro.config.mjs`, `.github/workflows/deploy-docs.yml`

---

## Commit Strategy

| After Task | Message | Files |
|------------|---------|-------|
| 1 | `docs: scaffold astro starlight project` | `docs/**` |
| 2-6 | `docs: add complete documentation pages` | `docs/src/content/docs/**` |
| 7 | `docs: configure sidebar and github pages deployment` | `docs/astro.config.mjs`, `.github/workflows/**` |

---

## Success Criteria

### Verification Commands
```bash
cd docs && npm install && npm run build  # Expected: Build succeeds
ls docs/src/content/docs/  # Expected: index.mdx + directories
cat .github/workflows/deploy-docs.yml | grep "astro"  # Expected: uses astro action
```

### Final Checklist
- [x] All documentation pages exist and build
- [x] Sidebar shows all sections
- [x] GitHub Actions workflow is valid
- [x] No source code modifications
