# Unified Architecture & Implementation Brief — The Divan Platform (RCE + Super-App + Agent OS)

**Version 1.0 — merged brief. Paste this whole document into any capable model (Gemini, GPT, DeepSeek, Qwen, Llama, Mistral, etc.).**

**How to use this document:** It is written to be answered, not admired. Do not summarize it back. Produce the deliverables in Section 8, in order, and commit to ONE recommendation per decision. Where this brief is silent, state your assumption and proceed — do not ask a question and stop. An answer full of "it depends" and vendor listicles scores low. An answer that commits, names what breaks and when, and challenges the brief where it deserves challenge scores high.

**This brief describes ONE platform with four subsystems on a shared identity/organization/person graph. They are not four apps. The unifying product name is "Divan" (دیوان — the ancient Persian institution of record where decisions, resolutions, and accounts were kept).**

---

## 1. Who is asking

A business-operating-system architect and systems designer working **in Iran**. Runs consulting, coaching, publishing, and a physical venue that doubles as a community hub. Ships methodologies, not features. Technical enough to read code and judge architecture; will not be the person patching a database at 2 a.m.

**Build capacity: one architect (the author) + AI coding agents, with the option to hire one contractor. Nights and weekends, not a funded team.** Any answer that assumes a five-person engineering org is wrong for this brief. Any plan whose first shippable artifact is more than four weeks out is wrong for this brief.

**Iran-specific operating reality (hard environmental constraints, not preferences):**
- Telegram is filtered inside Iran (needs VPN/proxy); **Bale** (tapi.bale.ai, National Bank of Iran product) is open inside Iran and its Bot API is Telegram-compatible. Any messaging layer must run on both.
- Google/OpenAI/Groq APIs are geo-blocked from Iranian IPs; either route through a proxy/VPS abroad, or self-host models. State this in every AI-dependent path.
- International card payment (Stripe/Paddle) is not usable; **rial payment gateways** (including Bale's in-app gateway, ZarinPal-class PSPs) are the real options.
- Cheap/free hosting that does not sleep, does not require a foreign credit card, and is reachable from Iran is a genuine constraint. Name concrete options.
- Persian + Jalali calendar + RTL are first-class, but **presentation only** (see constraint 6).

---

## 2. What already exists and works

### 2.1 The RCE methodology (validated, in live use — do not redesign it)
A relationship-capital methodology called **RCE**, currently a Persian spreadsheet in live use with two paying clients. Validated on paper. It must survive migration intact. Design a system that can hold it and outgrow it.

**Core entity: a Person.** Each person carries:

- **Resource vector V (0–100).** Nine resource classes scored 0–5 each: capital, access-to-people, regulatory/administrative reach, physical space/assets, specialist skill, available labor, scarce information, public credibility, owned market channel. Access and credibility carry a **1.5 multiplier** (they replicate rather than deplete). Normalized to 100.
- **Tie-strength vector T (0–100).** Weighted: intimacy 35, contact frequency 20, relationship age 15, reciprocal-exchange balance 15, structural overlap 10, recency 5. Recency decays; intimacy and age do not. Dormant strong ties are an asset, not a liability.
- **Readiness vector R (0–5).** One point each: active need, budget, decision authority, recent trigger event, horizon under six months.
- **Confidence C (0–4).** An evidence ladder on every estimate: guess, self-report, third-party corroboration, observed behavior, completed transaction. **Hard rule: no expensive action on data below level 2.** Separation of estimate from confidence is the methodology's distinguishing feature and must be first-class in the schema, not a comment field.
- **Routing.** V, T, R are thresholded (**50 / 55 / 3**) into eight cells, each mapping to a prescribed next action and a named failure mode. **Thresholds must be tunable without redeployment.**
- **Demand tags.** Free-text need statements in the person's own words, then tagged. Tags stored **one row per tag, never comma-separated.** Every tag carries the **verbatim source sentence** it was derived from; a tag without source text is invalid. Aggregating tags across people yields demand clusters, cross-referenced against readiness and budget to decide what to productize.
- **Ethical boundary (a product requirement the system must ENFORCE, not a policy note).** Permanently prohibited fields: political opinion, religion, health, family matters, personal financial detail. One routing cell (strong tie, low resource value) is walled off from all commercial workflows.

### 2.2 Divan v0.x (designed, partially built)
A channel-independent Telegram/Bale bot that closes the loop **meeting audio → transcript → summary → minutes → proposed resolutions → (human ✅/❌) → task with owner + Jalali deadline → auto-reminder → done → archived in a group topic.** Multi-tenant with invite codes; entities Profile, Topic, Project (with a phase×layer matrix), 4 roles, admin panel, dual Jalali/Gregorian dates, AI adapter chain (Gemini → Groq). Architecture principle already locked: **the bot is a thin interface; all value is in a channel-independent core.** This is the seed the platform grows from.

---

## 3. What must be built — four subsystems on one platform

### A. Divan — the work-office and orchestration core *(this is the platform's spine)*
Divan is the **system of record and the command layer** for how a business actually runs day to day. Its users are the owner, managers, staff/operators, freelancers, and external clients of the businesses that adopt it. It holds: organizations (tenants), people (shared with the CRM person graph — the same Person entity), projects (each with a phase×layer progress matrix), meetings and their derived minutes/resolutions, tasks with owners and Jalali deadlines, reminders, comments-on-entities, an activity feed per project, files/attachments, module grants, and audit + usage records. It produces: structured meeting minutes, an accountable task/decision trail, role-differentiated dashboards, a filtered external **client portal** (secure per-project token link), scheduled digests, and downloadable/printable exports. It makes money by **usage (processed audio minutes and agent runs), not per-seat**, with tiered modules sold à la carte. It relates to the relationship graph by being the layer where interactions happen and get recorded — every meeting, favor, request, and delivery in Divan is an **event that feeds the RCE event ledger and the confidence ladder** (an observed delivered project outranks anything a person self-reports).

**Divan's own five-layer architecture (the platform skeleton all four subsystems sit inside):**
```
5. Interface   — Telegram bot · Bale bot · Mini App · web app · client portal   (thin, swappable, zero business logic)
4. API         — one REST/JSON (+ optional GraphQL) surface. Bot, app, portal, n8n all enter here.
3. Core        — entities · RBAC · MODULES · workflow · the RCE scoring service (separately owned)
2. Agent       — Agent Registry · mission queue (AgentRun) · input/output contracts · delivery-to-project · run log
1. Execution   — EXTERNAL, not built: n8n (self-hosted) · Claude/LLM APIs · MCP servers · any runtime
```
Three governing rules: **(a)** no interface touches the database directly — everything goes through the Core service layer (the bot's current direct-DB access is a temporary exception to be removed). **(b)** No agent talks to a user directly — an agent receives a mission from Core, returns output to Core, and Core decides who sees it, on which channel, at what access level. **(c)** No agent execution logic lives inside Divan — Divan knows only the agent's *contract* (inputs, outputs, permissions); execution happens in n8n/Claude/any runtime. A new agent = registering a contract + a webhook, not new code in Divan.

**Modular on/off system (a hard product requirement).** Every capability (meetings, projects, tasks, checklists, agents, attendance, reports, client_portal, crm_sync, loyalty …) is a `Module`. Visibility/permission is granted by a `ModuleGrant(module_key, scope_type∈{org,role,team,user,project}, scope_id, state)`. Conflict rule: **specific over general (user > team > role > org).** The UI is *rendered from grants* — a user without a grant does not merely lack permission, the feature is not rendered at all. This is also the feature-flag mechanism: ship dark, enable for one user, test, then enable for all.

### B. Relationship & sales CRM
The RCE model of §2.1, plus pipeline, proposals, and revenue attribution. Must answer: **which revenue in the last 90 days originated in the network vs cold acquisition.** Decide (Section 7) whether the entity store is an existing open-source CRM or your own schema.

### C. Customer loyalty club
Membership tiers, visit/purchase history, points/credits, campaign targeting, redemption. Members are the **same Person entity** as CRM contacts and Divan profiles — not a parallel table. The venue's existing member base is the seed dataset. **Loyalty behavior is high-quality evidence for the confidence ladder** — an observed repeat purchase outranks self-report — but must feed the ladder without polluting the relationship graph with transactional noise (Section 7).

### D. AI operations layer
Every subsystem reachable by AI agents through **MCP and REST**. Agents perform: tag extraction, cluster analysis, dormant-tie identification, weekly action drafting, anomaly detection, meeting-minute generation, content production (e.g., a "channel content agent" that drafts a daily Telegram post at 10:00 and an Instagram post at 11:00 from a project's photo folder + brand text), and periodic reporting. **One inviolable rule: agents propose, humans commit.** No agent writes a score, tier, task, or monetary value directly. All agent output lands in a **proposals queue** with provenance and a confidence value, then a human approves. This is the same "LLM proposes, human presses the button" pattern already proven in Divan's resolution flow, generalized to the whole agent layer.

---

## 4. Non-negotiable constraints

Challenge any of these if you think they are wrong (Section 10 requires it), but do so explicitly with reasoning. Silently ignoring them makes your answer unusable.

1. **Event ledger.** Append-only record of every interaction (contact, favor given/received, request, meeting, purchase, redemption, project delivery). Scores are **derived from this ledger, not typed by hand.**
2. **Formulas are data.** Weights, thresholds, decay curves live in a **versioned table**. Every computed value is stamped with the formula version that produced it. Recalibration after real usage = a data change + full recompute, **never a code deploy.**
3. **Derived data is never hand-editable.** Any computed value is reproducible from the ledger at any time. Manual override, if allowed, is a distinct, logged, visibly-flagged record type.
4. **Vendor isolation.** If an open-source CRM/loyalty/scheduling component is used, it is used **unmodified** and reached only through a **single adapter module**. Business logic and the RCE scoring engine live in a separately owned service. This preserves both an exit path and the license boundary.
5. **License boundary.** The RCE methodology is commercial IP sold to clients. **AGPL-3.0 network copyleft on any adopted component must not reach the scoring engine.** State exactly how your architecture guarantees this and where it is legally uncertain. (Note: Twenty CRM, SuiteCRM are AGPL-3.0; EspoCRM is GPLv3; Corteza is Apache-2.0; Krayin is MIT; Open Loyalty and Cal.com's final OSS release are AGPL-3.0 — factor these into your recommendation.)
6. **Persian is presentation only.** All keys, enums, identifiers in **English**. All timestamps stored **UTC as proper datetimes**. Jalali rendered at the view layer only. RTL + Persian typography are first-class UI requirements.
7. **Tenant isolation is structural**, not a filter column. Each client's relationship graph is separated by a real boundary. Cross-tenant aggregation is permitted **only for anonymized demand tags** — no names, no identifiers, no verbatim source text.
8. **Operational floor.** Audit log from day one. Nightly backups with a **monthly tested restore.** An untested backup is not a backup.
9. **Complexity budget.** Single server, container-composed, until proven load. Justify every additional stateful service against the cost of **one person** maintaining it alone.
10. **Channel independence & gate discipline (Divan-inherited).** No business logic in any interface. And no build phase begins before the previous phase's exit criteria pass — this is the only defense against scope creep in a platform this ambitious.

---

## 5. Access control requirements

Design a role + permission model satisfying all of the following; show it as a matrix:
- Roles at minimum: **owner, staff operator, coach, client (external), read-only viewer** — plus Divan's super-admin and manager.
- **Field-level control**, not just record-level. A coach may see a client's routing cell without the verbatim need statement behind it.
- **Layer-differentiated output:** the same underlying query yields different shapes for different consumers — client sees their own action list; operator sees a cohort dashboard; owner sees cross-tenant anonymized demand clusters; external partner sees a single scoped export; the Divan client-portal shows only `client_visible`-flagged items.
- Runtime-configurable by an administrator **without code changes** (this is the ModuleGrant mechanism — reconcile RBAC and ModuleGrant into one model, or justify keeping them separate).
- **Agent identity is a first-class principal** with its own scoped permissions, distinct from the human who invoked it.

Explain what your stack **genuinely enforces** vs. what is convention a determined user could bypass. Be specific about the difference.

---

## 6. Output surfaces

Each layer must emit: a live dashboard, a scoped API response, a scheduled digest, a printable/downloadable file, an **MCP tool result**, and a **webhook event**. Describe how you avoid implementing the same query six times (name the pattern: one query/service → many serializers/presenters).

---

## 7. Open questions you must answer, not defer

- **Entity store: existing open-source CRM, or your own schema?** Given that Divan ALSO needs first-class meeting/project/task/agent entities that no CRM models, and given the RCE Person carries V/T/R/C vectors + ledger-derived scores + walled-off ethical fields — does adopting Twenty (AGPL, API-first, metadata-driven custom objects) as the *contact/company/deal* store while owning the RCE+Divan schema separately beat modeling everything yourself? Name the product and defend it against the license (§4.5) and exit-path (§4.4) constraints, or reject it with reasons.
- **Where does the scoring engine run** — inline on write, background worker, or on read? Justify against the recompute-on-recalibration requirement (§4.2).
- **How are tags reconciled** as vocabulary drifts, without destroying historical cluster analysis?
- **How does loyalty feed the confidence ladder** without polluting the relationship graph with transactional noise? (Open Loyalty is API-first with webhooks — does an event bridge solve this?)
- **How do the RCE Person graph and Divan's Profile/tenant model unify** into one identity without a merge nightmare later?
- **Messaging: Telegram-first, Bale-first, or both from day one**, given the Iran filtering reality and the shared Bot API?
- **The smallest thing shippable to the two existing clients within four weeks** that is strictly better than their spreadsheet — name it concretely.
- **Migration path from spreadsheet to platform with zero data loss and no downtime** mid-engagement.
- **What breaks first at 10 clients, at 100 clients, at 10,000 people in the graph?**

---

## 8. Deliverables, in this order

1. **Architecture decision summary.** Ten lines max. One recommendation per decision. No options lists.
2. **System diagram** (text or Mermaid): components, data flow, trust boundaries.
3. **Data model.** Tables, key fields, types, relationships, indexes. Include explicitly: the **event ledger**, the **formula-version table**, the **tag table** (with verbatim source), the **agent-proposal queue**, the RCE Person with V/T/R/C, and Divan's project/meeting/task/module/module-grant tables.
4. **API surface.** Resource list, auth model, versioning strategy, rate limiting.
5. **MCP tool catalog.** Tool names, arguments, return shapes, and the permission scope each requires.
6. **Permission matrix.** Roles × resources × field groups (fold in ModuleGrant).
7. **Build sequence.** Phased, a working deliverable at the end of each phase, and an **honest time estimate for one architect + AI coding agents** (nights/weekends). Phase 1 must be the four-week shippable of §7.
8. **Risk register.** Top eight risks + mitigations. At least three **operational or commercial**, not technical (include: Iran infra/sanctions, single-maintainer bus factor, AGPL exposure, client-data-loss).
9. **Cost model.** Infrastructure + third-party services at **2, 20, and 200 clients** — priced for the Iranian reality (rial gateways, reachable hosting, proxy/VPS-abroad for AI calls).
10. **Your disagreements.** State plainly which Section 4 constraints you think are wrong and why. **An answer with no disagreements is a low-quality answer.**

---

## 9. How answers will be judged

**Higher marks:** committing to specific choices with reasons; naming what breaks and when; distinguishing enforced guarantees from conventions; correctly sizing the operational burden on one person; challenging the brief where it deserves it; treating the Iran/Persian/Bale reality as architecture, not translation.

**Lower marks:** vendor listicles; "it depends"; microservices without load justification; ignoring the license boundary; treating Persian/RTL as a translation task; any plan whose first shippable artifact is more than four weeks out; machine-plausible fiction disconnected from the real components named here.

---

## Appendix — Real components to evaluate (do not invent alternatives without engaging these first)

You must reference these real, currently-maintained options in your recommendation (adopt, adapt, or reject with reasons). This appendix exists so answers are grounded in 2026 reality, not hallucinated.

| Need | Named real candidates (with license) | Note |
|---|---|---|
| CRM entity store | **Twenty** (AGPL-3.0, NestJS/React, GraphQL+REST, metadata-driven custom objects), **EspoCRM** (GPLv3, PHP, ~90% admin-configurable), **Corteza** (Apache-2.0), **Krayin** (MIT), **SuiteCRM** (AGPL-3.0), **Odoo CE** (LGPLv3) | License drives the §4.5 boundary decision |
| Loyalty engine | **Open Loyalty** (AGPL-3.0, API-first, REST+webhooks, tiers/points/campaigns, on-prem) | Feeds confidence ladder via event bridge |
| Scheduling/appointments | **Cal.com** (final AGPL-3.0 self-host release) / **Cal.diy** (MIT fork, 2026) | Calendar/round-robin/webhooks |
| Agent execution / integrations | **n8n** (self-hosted, fair-code) as the single outbound gateway; **Claude/LLM APIs** + **MCP** servers | Divan holds only contracts, not execution |
| Speech-to-text + LLM (Iran-reachable via proxy) | **Groq Whisper large-v3**, **Google Gemini Flash** (free tiers), self-hosted **faster-whisper** as sanctions fallback | Free tier trains on data — migrate to paid before confidential client data |
| Messaging channels | **Telegram Bot API** (filtered in Iran) + **Bale** (tapi.bale.ai, open in Iran, TG-compatible, rial gateway) | Both from a shared thin adapter |
| Backend / ledger patterns | Postgres 16 (+ append-only event table, JSONB, pg_trgm FTS, pgvector later); event-sourcing/CQRS for the scoring path | Complexity-budget it against constraint 9 |

**State your assumptions explicitly wherever this brief is silent. If a requirement is genuinely underspecified, say so and proceed with a stated assumption rather than asking a question and stopping.**
