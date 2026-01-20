## Repo architecture
- Monorepo with `/apps` for apps and `/packages` for shared packages.
- `/apps/web` is the Next.js web client using the App Router.
- `/apps/api` contains API routes, authentication, webhooks, and server logic.
- `/apps/worker` handles background jobs like sync, reminders, and exports.
- `/packages/ui` is the design system with tokens, components, icons, and Storybook.
- `/packages/db` contains the ORM schema, migrations, and database client.
- `/packages/types` holds shared domain types and Zod schemas.
- `/packages/integrations` contains connector SDKs for Google, Microsoft, etc.
- `/packages/config` includes shared configs like ESLint, tsconfig, and Tailwind.

## Stack defaults (to prevent agent drift)
- Package manager: **pnpm**
- Monorepo tooling: **Turborepo**
- Web framework: **Next.js (App Router)**
- API: **tRPC** (typed end-to-end)
- Validation: **Zod**
- Database: **Postgres**
- ORM: **Prisma**
- UI primitives: **Radix UI**
- Styling: **Tailwind CSS** + tokens via CSS variables (components must not hardcode colors)
- UI docs: **Storybook** under `/packages/ui`

If any of these conflict with `plan.md`, prefer `plan.md`.

## Commands and hygiene
- Ensure the project builds and typechecks before finishing.
- Prefer these repo scripts (create if missing):
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm format` (or `pnpm prettier`)
  - `pnpm storybook` (for `/packages/ui`)
- Run formatting + lint + typecheck + tests before marking a milestone complete.
- Keep diffs focused; avoid large refactors unless asked.
# PLAN.md — Collaborative PM SaaS (Asana × Notion) for Freelance Work

> Living plan for building a collaborative project management SaaS to track clients, projects, tasks, meetings, time, and invoices — designed for solo-first shipping and SaaS-scale growth.

---

## 0) Product Snapshot

### Primary user
- Freelance designer (you), eventually teams/clients.

### Core promise
- Run client work from a **project-centric pipeline**: see what’s happening across all projects, then drill into tasks, meetings, milestones, time, invoices, and docs — with lightweight collaboration.

### MVP outcomes
- Manage a project-centric pipeline → tasks/meetings/milestones/docs → optional time → invoices (CSV export).
- Collaborate inside an organization/workspace (invite teammates).
- Passkeys-first auth.
- Clean auditability and security posture that can mature into SOC2.

---

## 1) Scope

### In scope (MVP)
- Organizations (enterprise spaces) + members + roles
- Clients + contacts (lightweight CRM container for projects/tasks/meetings/time)
- Client status rollups derived from project statuses (with optional manual override for pipeline)
- Project status is the primary source of truth for delivery (e.g., Planned → In Progress → Blocked → Delivered → Closed)
- Projects (pipeline) with sub-items: tasks, meetings, milestones, invoices, docs
- Tasks (with optional time tracking + estimates)
- Meetings (notes + next steps → tasks)
- Milestones (key dates, reviews)
- Invoices (draft/incomplete → sent → paid) + CSV export
- Docs (simple in-app text docs/templates)
- Comments/activity feed on all entities (audit + collaboration)
- Time tracking (timer + manual)
- Basic notifications/reminders (in-app; email later)
- Minimal “AI assistant” v0: next-steps + summaries (only after event/activity data exists)

### Explicitly out of scope (initially)
- True Notion-grade doc editor / realtime CRDT collaboration
- Full document collaboration/versioning (beyond simple text docs + activity feed)
- Full billing/payments (Stripe invoicing, etc.)
- SAML/SCIM (enterprise) — plan for later
- Offline-first mobile apps (later phases)
- Deep email ingestion/parsing (later)

---

## 2) Architecture (Solo-friendly now, SaaS-scale later)

### High-level system
- **Web app** (Next.js) for UI
- **API** (tRPC/REST) for business logic
- **Postgres** for relational + reporting
- **Worker** for background jobs (sync, reminders, exports)
- **Integrations** as connector modules (Google/Microsoft first)

### Tenancy & collaboration model (required)
- Multi-tenant via **Organization (orgId)** scoping everywhere.
- Users belong to orgs through **Membership** with roles.
- All domain objects (clients/projects/tasks/meetings/time/invoices) belong to an org.

### Status model (recommended)
- **Projects drive delivery.** Treat *project status* as the canonical indicator of work state.
- **Clients roll up from projects.** Client status is computed from the statuses of its projects (and optionally a sales/pipeline override).
- **Keep pipeline separate from delivery.** If you pitch by project, consider a distinct `clientPipelineStage` (Lead/Qualified/Negotiation/Won/Lost) and a computed `clientDeliveryStatus` (Active/At Risk/On Hold/Idle).

### Realtime (phased)
- Phase 1: presence + “updated by X” + live refresh (WebSockets)
- Phase 2: selective realtime (task board updates)
- Phase 3: collaborative docs only if proven necessary

---

## 3) Proposed Stack (recommended defaults)

### Web
- Next.js (App Router) + React + TypeScript
- Design tokens via CSS variables (colors/typography/spacing/borders/elevation/motion)
- Radix UI primitives (a11y baseline) + custom “skin” (System 6 / Poolsuite-inspired)
- Tailwind (optional) or CSS Modules/vanilla-extract for styling; Storybook for UI docs

### API
- tRPC (preferred for speed + type safety) OR REST if you prefer
- Zod for input validation
- OpenAPI export (optional later)

### Data
- Postgres
- ORM: Prisma (or Drizzle)
- Search: Postgres full-text first → Meilisearch/Typesense later if needed

### Auth (passkeys-first)
- WebAuthn passkeys as primary
- Recovery: email magic link or backup codes
- Session: secure cookies
- Later: SSO (SAML) via WorkOS (optional)

### Background jobs / queue
- BullMQ + Redis (or managed queue service)
- Separate `/apps/worker`

### Storage
- S3-compatible object storage + signed URLs

### Hosting (SOC2 runway)
- Use a major cloud provider (AWS/GCP/Azure) with:
  - managed Postgres
  - managed Redis
  - centralized logs/metrics
- Container-friendly deployment

---

## 4) Monorepo Layout

```txt
/apps
  /web          Next.js web client
  /api          API routes, auth, webhooks, server logic
  /worker       background jobs: sync, reminders, exports
/packages
  /db           ORM schema + migrations + db client
  /ui           design system: tokens, components, icons, Storybook
  /types        shared domain types + zod schemas
  /integrations connector SDK: google, microsoft, (apple later)
  /config       shared configs (eslint, tsconfig, tailwind)
/docs
  /product      flows, IA, PRDs
  /security     threat model, SOC2 notes, policies drafts
```

---

## 4.1) Information Architecture & Key Views

### Primary navigation (MVP)
- **Projects** (primary pipeline view)
- **Tasks** (cross-project task view)
- **Calendar** (global calendar)
- **Clients** (directory)
- **Invoices** (billing mode/flow)
- **Docs** (templates + project docs)

### Projects as the “home screen”
- The Projects view is the default landing area: a pipeline overview of all work.
- Projects can be associated with a Client (optional for internal projects).
- Projects support List / Kanban / Calendar / **Gantt** (timeline) views.

### Clients as a directory
- Clients & Contacts live in a dedicated directory section (CRM-light), primarily for lookup and association.

---

## 5) Domain Model (MVP)

### Core entities
- **User**
- **Organization**
- **Membership** (user ↔ org + role)
- **Client** (directory container)
- **Contact** (belongs to client)
- **Project** (pipeline unit; belongs to org; optionally linked to client)
- **Task** (belongs to project; optional assignee; optional time + estimates)
- **Meeting** (belongs to project; links to client; attendees, notes; next steps create tasks)
- **Milestone** (belongs to project; key dates/reviews)
- **TimeEntry** (optional per task/project; billable)
- **Invoice** (billing artifact; derived from time entries and/or fixed-fee line items; statuses: incomplete → sent → paid)
- **Doc** (simple text doc/template; belongs to project and/or org library)
- **Comment** (threaded notes on entities)
- **EventLog** (audit/activity feed)

### Required invariants
- Each entity belongs to exactly one organization.
- Membership defines user roles and access scopes.
- Projects drive status and delivery tracking.
- Clients aggregate project statuses and pipeline stages.
- Time entries are billable and link to tasks or projects.
- Invoices derive from time entries or fixed fees.
- Docs are simple and scoped to projects or org libraries.

### Modularity (like Asana)
- Time tracking is **per project or per task**, enabled by settings:
  - `project.timeTrackingMode = none | tasksOnly | projectOnly | tasksAndProject`
- Estimates are optional and stored in **15-minute increments** (quarter-hour).
- Invoicing supports both:
  - **time-based** (from TimeEntry)
  - **fixed-fee** (manual line items) for contracts without time tracking

---

## 8.1) Design System Implementation Plan

### Recommended approach (ships fast, stays flexible)
- Start from **accessible primitives** (Radix UI) and apply a **fully custom theme layer**.
- Use **tokens first** so you can support:
  - default theme
  - high-contrast theme (WCAG)
  - reduced-motion
  - density modes (comfortable/compact)

### Token taxonomy (MVP)
- `color.*` (bg/surface/text/border/intent)
- `space.*` (4px-based scale)
- `radius.*` (crisp corners; minimal rounding)
- `border.*` (1px/2px, inset styles)
- `shadow.*` (subtle “window chrome” elevation)
- `type.*` (font families, sizes, line heights)
- `motion.*` (durations/easings + reduced-motion overrides)

### Component layers
1. **Primitives**: Button, Link, Input, Select, Checkbox, Radio, Switch, Tabs, Dialog, Popover, Tooltip, Toast
2. **Composites**: Table, DataGrid, Command Palette, Filters Bar, View Toggle, Kanban Column/Card, Calendar Event, Timeline Row
3. **Patterns**: Empty states, Inline create, Side panel editor, Bulk edit, Activity/Comment feed

### Pixel-modern styling guidelines
- Favor **1px borders**, crisp dividers, and inset surfaces (System 6 vibe) while keeping typography modern.
- Avoid bitmap assets; use vector icons and scalable type.
- Provide a “texture” option (subtle dithering) as a theme layer, not hard-coded into components.

### Accessibility & quality gates
- WCAG 2.2 AA contrast targets for all themes.
- Visible focus ring + keyboard nav on every interactive element.
- Component-level a11y tests (e.g., axe) in CI.

### Documentation
- Storybook pages for every component + usage rules.
- A `UI_CONTRIBUTING.md` that defines token usage, do/don’t, and review checklist.

---

## 9) Features (Specs will live in /docs/product)

### Key user actions (MVP)
1. Create a project (optionally assign a client)
2. Manage tasks (list/kanban/calendar/gantt; filter/group)
3. Log meetings (notes + attendees; next steps → tasks)
4. Add milestones (reviews/key dates)
5. Track time and estimates when needed
6. Run invoicing flow (select client/projects/tasks/time; export CSV)
7. Maintain client/contact directory
8. Use docs/templates for communication (project docs + org templates)

---

## 10) Build Plan (Milestones)

### M0 — Foundations + Design System
- Monorepo setup (lint/format/test)
- Auth (passkeys + recovery)
- Organizations + memberships + RBAC middleware
- `/packages/ui` tokens + base primitives (Button/Input/Dialog/Tabs)
- Storybook setup + a11y checks
- EventLog scaffolding + activity feed base components

#### Cursor execution prompt (M0)
Copy/paste this into Cursor when starting implementation for M0:

```
Implement `/packages/ui` design system for the app.
- Use Radix UI primitives.
- Implement tokens via CSS variables (color/space/type/border/shadow/motion).
- Add theme toggles via HTML data attributes: `data-theme`, `data-density`, `data-motion`, `data-texture`.
- Create primitives: Button, Input, Select, Tabs, Dialog, Tooltip.
- Ensure WCAG-friendly focus styles and keyboard navigation.
- Add Storybook in `/packages/ui` with stories for each primitive and a11y checks enabled.
- Expose components via `packages/ui/src/index.ts`.
- Update `/apps/web` to consume these primitives (at least one demo page).
- Include minimal unit tests or smoke tests where reasonable.
```

### M1 — Projects (Pipeline) + Client Association
- Projects CRUD (list + create + edit + archive)
- Project statuses + key fields (dates, priority, assignees)
- Associate projects to clients (optional)
- Project detail page with tabs: Tasks, Meetings, Milestones, Invoices, Docs, Activity
- Activity/event logging for project changes

### M2 — Clients + Contacts (Directory)
- Clients CRUD + directory browsing
- Contacts CRUD under clients
- Fast lookup + association into projects
- Duplicate warning + merge placeholder (later)

### M3 — Tasks
- Cross-project task view
- Task views: list / kanban / calendar
- Filter + group (client, status, date, assignee, priority)
- Status, due date, assignee, tags, priority
- Activity log per task

### M4 — Meetings
- Log meetings (date/time, attendees, notes)
- Link to client/project
- “Next steps” extraction → create tasks
- Calendar display integration (internal)

### M5 — Milestones + Unified Calendar
- Milestones CRUD (key dates/reviews)
- Global / client / project calendar views
- Calendar shows tasks, meetings, milestones, invoices with filters
- Add Gantt (timeline) view for global Projects and per-Project planning (tasks + milestones + key dates)

### M6 — Time Tracking + Estimates
- Optional time tracking per project/task
- Timer + manual entry
- Estimates in 15-minute increments
- Rollups per project/client

### M7 — Invoicing Flow + Scheduling
- Invoicing mode/flow: pick client → projects → tasks/time entries
- Invoice statuses: draft/incomplete → sent → paid
- Export CSV
- Optional auto-invoice schedule (weekly/biweekly/monthly/1st+15th)

### M8 — Integrations
- Google/Microsoft connectors
- Calendar sync (read/write)
- Email/webhook notifications
- Attach meetings to projects automatically via matching rules (optional later)

### M9 — AI Assistant (v0)
- Next-steps suggestions
- Summaries from activity data

---

## 11) Engineering Conventions

---

## 11.1) Views, Filters, and Grouping (Projects & Tasks)

### Required views
- **List** view (table-like, sortable)
- **Kanban** view (by status; optionally by assignee)
- **Calendar** view (by due date / meeting date / milestone date / invoice date)
- **Gantt** view (timeline) for global Projects and per-Project planning (tasks + milestones + key dates)
- **Directory** view (clients/contacts) with fast search + lookup

### Filters (minimum)
- Client
- Status
- Date range
- Assignee
- Priority
- Tags
- Created date

### Grouping (minimum)
- By client
- By status
- By assignee
- By due week/month

### Saved views
- Users can save filters + grouping as named views (MVP: per-user; later: share to org).

---

## 12) How we’ll use Cursor (Workflow)

### Why prompts exist
- The plan describes **what** we’re building and **why**.
- Cursor prompts are “execution checklists” that tell the code agent **exactly what to implement next**.

### Prompt format
For each milestone (M0, M1, …), we keep:
- Goal
- Acceptance criteria
- A Cursor prompt that is safe to run end-to-end

### Guardrails
- Ship in small vertical slices (one milestone or sub-slice per PR).
- Every slice includes: schema + validation + permissions + basic tests.
- UI must use `/packages/ui` components (no one-off styling in app screens).
- Record events to `EventLog` for every mutation.