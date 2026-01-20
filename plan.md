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

- **User**
- **Organization**
- **OrgEntitlements** (plan, feature flags, limits, subscription status)
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

## 6) Auth, Onboarding, and Recovery (MVP)

### Goals
- Passkeys-first authentication that is safe for real-world device loss.
- Simple onboarding that lands users in the **Projects pipeline** quickly.
- Collaboration-ready org setup (invites, roles, org switching).

### Core flows
- **First-run onboarding**
  - Create account → create first organization/workspace → land in Projects.
- **Join an organization**
  - Accept invite → choose display name/avatar → land in Projects.
- **Organization switcher**
  - Switch orgs from the app header; remember last-used org.

### Authentication
- **Primary**: WebAuthn **passkeys**.
- **Recovery** (MVP requires at least one):
  - Email magic link **or** backup codes.
- **Device management**
  - Add/remove passkeys; handle “lost device” recovery.

### Sessions & security
- Secure cookie sessions.
- Rate-limit auth + invite endpoints.
- Account/org membership changes must invalidate/refresh sessions appropriately.

### Acceptance criteria
- A user can: sign up, create org, sign in via passkey, sign out, recover access, and add a second passkey.
- A user can: invite another user to an org and the invitee can join.

---

## 7) Observability, Debugging, and Admin Tools (MVP)

### Goals
- Make it easy to understand “what happened” (activity, audit) and “why it broke” (errors, jobs), especially once integrations start.

### Observability baseline
- **Structured logs** including `requestId`, `orgId`, `userId` (when available).
- **Error tracking** (e.g., Sentry or equivalent) for web + api + worker.
- **Health checks** for api + worker.

### Debug/admin surfaces (MVP)
- **EventLog viewer** (internal/admin-only): filter by org, actor, entity, action.
- **Jobs dashboard** (internal/admin-only): recent jobs, status, last error, retry.
- **Feature flags** (simple): enable/disable experimental features (AI assistant, texture theme, auto-invoice).

### Dev ergonomics
- Seed data script to generate a demo org with sample clients/projects/tasks/meetings/milestones.
- Clear run scripts: dev, typecheck, lint, test, storybook.
- CI/preview environment to quickly verify changes (PR previews + checks)

### Acceptance criteria
- Errors are captured with context and can be traced to a request.
- Job failures are visible and retryable.
- EventLog is queryable for recent changes.

---

## 8) Monetization, Entitlements, and Costs

### Pricing philosophy
- Default to **generous solo value**.
- Keep core productivity features free, even if they’re “power-user” features.
- Charge for what creates meaningful ongoing cost or support burden:
  - Collaboration seats + org administration
  - High usage (storage, retention, automation volume)
  - Enterprise security/compliance needs (SSO, audit controls)
  - Priority support
  - AI usage (metered add-on)

### Tiers (initial)
- **Free** (solo-first)
  - One organization, single seat
  - Core pipeline: Projects + Tasks + Meetings + Milestones
  - Views: List/Kanban/Calendar/**Gantt**
  - Integrations: Google/Microsoft calendar sync (MVP scope)
  - Automation: auto-invoice schedules
  - Manual invoice CSV export
- **Business**
  - Multi-seat collaboration + roles
  - Shared saved views (org-level)
  - Higher limits (projects, storage, retention, automation runs)
  - Advanced admin controls (invites, roles, auditing filters)
- **Enterprise**
  - SSO (SAML) + SCIM (later)
  - Advanced audit/retention controls + export
  - Security review support and compliance artifacts (SOC2 posture)
  - Priority support + SLAs (optional later)

### Add-ons
- **AI Add-on ($)**
  - AI assistant features (summaries, next-steps, drafting)
  - Optional credit-based metering (tokens/credits)

### Entitlements model (build early, bill later)

- Store plan + feature flags at the **Organization** level:
  - `org.plan = free | business | enterprise`
  - `org.subscriptionStatus = trialing | active | past_due | canceled`
  - `org.features = { ai, sso, scim, advancedAudit, clientPortals }` (core features like gantt/integrations/auto-invoice are enabled on Free by default)
  - `org.limits = { seats, projects, storageMB, retentionDays, automationRunsPerMonth }`
- Enforce via a single backend gate:
  - `requireFeature(orgId, "ai")`
  - `requireFeature(orgId, "advancedAudit")`
  - `requireLimit(orgId, "seats")`
  - `requireLimit(orgId, "automationRunsPerMonth")`
- Billing provider integration (e.g., Stripe) can be added later without changing core authorization logic.

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
2. Manage tasks (list/kanban/calendar; filter/group; optional per-project Gantt planning)
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
- Auth scaffolding (passkeys-first) + at least one recovery method (magic link or backup codes)
- Organizations + memberships + RBAC middleware
- Org entitlements scaffolding (plan, paid-only feature flags, limits) + backend gating helpers
- `/packages/ui` tokens + base primitives (Button/Input/Select/Dialog/Tabs/Tooltip)
- Storybook setup + a11y checks
- EventLog scaffolding + activity feed base components
- Observability baseline: structured logging + error tracking hooks
- Dev seed script to generate a demo org + sample data
- CI baseline: lint + typecheck + test + Storybook build; preview deploy enabled (Vercel or equivalent)

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

### M8.5 — MCP Server (Remote) for Agent Integrations
- Create `/apps/mcp` as a remote MCP server that exposes Bonfire capabilities as **tools/resources/prompts**
- Auth: OAuth 2.1 (or equivalent) with org-scoped tokens; enforce RBAC + scopes on every call
- Safety: tool allowlist, rate limits, response size caps, and sensitive-field redaction by default
- Auditing: log every MCP tool invocation to `EventLog` (actor, org, tool, params hash, result metadata)
- Initial **read** tools: `projects.list`, `projects.get`, `tasks.list`, `calendar.listEvents`, `invoices.list`
- Initial **write** tools (tightly scoped): `tasks.create`, `tasks.updateStatus`, `meetings.addNotes`, `docs.createFromTemplate`
- Docs: add `/docs/agent/mcp.md` describing tools, scopes, and examples

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