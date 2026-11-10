---
title: "Self-Service Staffing Updates for IP Operations"
summary: "A 73-question Microsoft Form feeding four Power Automate flows that write validated staffing changes to SQL Server, where an Intapp Integration Builder rule applies them to the firm's IP management and practice management systems."
org: "A large IP law firm"        # one-line switch if you decide to name the firm
role: "Requirements, design, build, testing, and support (solo)"
launched: 2024-11-01
status: "In production"
tools: [Power Automate, Microsoft Forms, SQL Server, On-premises data gateway, Intapp Integration Builder, Foundation IP, Microsoft Teams]
metrics:
  - value: "9,900+"
    label: "requests processed"
  - value: "~19"
    label: "requests per business day"
    note: "9,940 responses over ~530 business days since launch"
  - value: "0"
    label: "manual database entries"
  - value: "800–1,650 hrs"
    label: "manual handling avoided (est.)"
    note: "Assumes 5–10 min per request to read an email, clarify, and key in the change"
order: 1
featured: true
---

## The problem

IP Operations needed a reliable way for attorneys and staff to request **staffing changes on patent and trademark matters**: who is the handling attorney, supervising attorney, paralegal, or billing contact. These changes can apply to a whole client, a matter family, or a single matter.

Requests came in by email to the IP Operations team, and someone made each update by hand. There was no structured intake. An Intapp Integration Builder rule already existed that could apply staffing changes to the firm's IP management system (Foundation IP) and practice management system, but it only reads from a SQL Server table. The gap was getting accurate, well-formed requests *into* that table without anyone re-keying them.

**Constraints**
- Requesters aren't technical, so the form has to do the structuring.
- One request can contain up to **four separate staffing changes** (two for removals), each for a different practice area and role.
- Bad data doesn't just fail. It can **change staffing on the wrong matters**, so data integrity mattered more than speed.
- The database is on-premises, so cloud automation has to reach it through a data gateway.

## What I built

A Microsoft Forms → Power Automate → SQL Server pipeline that turns each form submission into one or more clean, structured rows for the existing Integration Builder rule to pick up.

- **1 Microsoft Form, 73 questions**, branched by update scope, practice area, and role.
- **4 Power Automate flows**, one per update scope: **Entire Client, Family, Matter, and Removal**. Splitting by scope keeps each flow testable and stops a change to one path from breaking the others.
- **Up to 24 conditional insert paths per flow**, routing each change to the correct row shape based on practice area (patent prosecution, post-grant, trademark, or not applicable) and role.
- **Built-in reconciliation**: each flow compares the number of rows it *expected* to write with the number it *actually* wrote, and alerts an admin if they differ.
- **Failure alerting**: a Teams adaptive card and an email, both with a deep link to the failed run and the submission ID.

**My role:** I gathered requirements with IP Operations, designed the flow architecture, built and tested all four flows, and own ongoing support and enhancements. The IP Operations team created the SQL table and the form questions.

## How it works

### System view

```mermaid
flowchart LR
    F[Microsoft Form<br/>73 questions] --> R{Update<br/>scope}
    R --> P1[Entire Client]
    R --> P2[Family]
    R --> P3[Matter]
    R --> P4[Removal]
    P1 & P2 & P3 & P4 --> GW[On-prem<br/>data gateway]
    GW --> DB[(SQL Server<br/>staging table)]
    DB --> IB[Integration<br/>Builder rule]
    IB --> SYS[IP management &<br/>practice management]
    P1 & P2 & P3 & P4 -.-> A[Teams + email<br/>alerts]
```

### Inside one flow

```mermaid
flowchart TD
    T[Trigger: new form response] --> G[Get response details]
    G --> E[Enrich: local timestamp +<br/>requester name from Office 365]
    E --> L[For each of up to 4 change sets]
    L --> PA{Practice area?}
    PA -->|Patent prosecution| PR{Role group}
    PA -->|Post-grant| I1[Insert row]
    PA -->|Trademark| TR{Role group}
    PA -->|N/A| I2[Insert row]
    PR --> I3[Insert row]
    TR --> I4[Insert row]
    I1 & I2 & I3 & I4 --> C{Expected rows =<br/>inserted rows?}
    C -->|yes| OK([Done])
    C -->|no| AL[Alert admin with run link]
```

### Design decisions

| Decision | Why |
|---|---|
| Four flows, one per update scope | The form branches hard on one question. Separate flows mean a smaller blast radius, simpler testing, and run history that's easy to read. |
| Role-group routing before insert | Different roles populate different columns. Routing first keeps every row in the exact shape the Integration Builder rule expects. |
| Expected-vs-inserted row count | A flow can "succeed" and still write nothing if a form answer doesn't match any branch. Counting catches silent gaps, not just hard failures. |
| Deep links in alerts | Whoever triages a failure goes straight to the run and the submission instead of searching run history. |
| Requester name looked up, not typed | Pulled from Office 365 using the responder's sign-in, so it can't be misspelled. |

## Results

- **In production since November 2024.** Close to **10,000 submissions** have gone through the form.
- **Every request lands in SQL automatically.** IP Operations no longer re-keys staffing changes from email.
- **Requests arrive structured.** Scope, practice area, role, and attorney are captured as discrete fields, not free text in an email.
- **Problems surface on their own.** Reconciliation and failure alerts flag a bad run with a direct link to fix it.

*Hours avoided is an estimate: 9,940 requests at 5–10 minutes of manual handling each.*

## Screenshots

*Recreated with sample data. Names, emails, client numbers, and system details are fictional.*

<figure>
  <img src="/case-studies/ip-staffing-updates/form-intro.webp" alt="Microsoft Form design view showing the staffing update request form" loading="lazy" />
  <figcaption>The intake form: 73 questions, with warnings up front because a bad answer changes real matters.</figcaption>
</figure>

<figure>
  <img src="/case-studies/ip-staffing-updates/form-branching.webp" alt="Form branching view showing Go to rules for each answer" loading="lazy" />
  <figcaption>Branching rules route each requester down a different path by scope, jurisdiction, and practice area.</figcaption>
</figure>

<figure>
  <img src="/case-studies/ip-staffing-updates/flow-overview.webp" alt="Power Automate flow overview with scopes for four change sets" loading="lazy" />
  <figcaption>One flow, top level: enrich, four change-set scopes, then a failure path and a row-count reconciliation.</figcaption>
</figure>

<figure>
  <img src="/case-studies/ip-staffing-updates/flow-change-set.webp" alt="Expanded change set showing practice area and role conditions and SQL insert parameters" loading="lazy" />
  <figcaption>Inside a change set: practice area → role group → Insert row, with form answers mapped to SQL columns.</figcaption>
</figure>

<figure>
  <img src="/case-studies/ip-staffing-updates/teams-alert.webp" alt="Teams adaptive card alerting that a flow failed" loading="lazy" />
  <figcaption>Failure alert in Teams, with deep links to the failed run and the form responses.</figcaption>
</figure>

## What I'd do next

- Collapse the repeated insert blocks into a child flow or a single parameterized insert, so a schema change means editing one action instead of 24.
- Add a Power BI view of request volume by scope, practice area, and role to help IP Operations plan workload.
