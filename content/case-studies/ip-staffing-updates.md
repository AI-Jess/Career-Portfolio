---
title: "Self-Service Staffing Updates for IP Operations"
slug: ip-staffing-updates
summary: "A 73-question Microsoft Form feeding four Power Automate flows that write validated staffing changes to SQL Server, where an Intapp Integration Builder rule applies them across firm systems."
org: "a large IP law firm"        # one-line switch if you decide to name the firm
role: "Business Analyst / Power Platform Developer (solo build)"
launched: 2024-11
status: "In production"
tools: [Power Automate, Microsoft Forms, SQL Server (on-premises data gateway), Intapp Integration Builder, Microsoft Teams, Office 365 Users]
featured: true
draft: true
---

## The problem

IP Operations needed a reliable way for attorneys and staff to request **staffing changes on patent and trademark matters** — who is the handling attorney, supervising attorney, paralegal, or billing contact — by client, matter family, or individual matter.

There was no structured intake for this. An Intapp Integration Builder rule already existed that could apply staffing changes to downstream systems, but it only reads from a SQL Server table. The gap was getting accurate, well-formed requests *into* that table without someone re-keying them.

**Constraints**
- Requesters are non-technical; the form has to do the structuring, not the user.
- One request can contain up to **four separate staffing changes**, each for a different practice area and role.
- Bad data doesn't just fail — it can **change staffing on the wrong matters**. Data integrity mattered more than speed.
- The database is on-premises; cloud automation has to reach it through a data gateway.

## What I built

A Microsoft Forms → Power Automate → SQL Server pipeline that turns each form submission into one or more clean, structured rows for the existing Integration Builder rule to pick up.

- **1 Microsoft Form, 73 questions**, heavily branched by update scope, practice area, and role.
- **4 Power Automate flows**, one per update scope (Entire Client, [Family], [Matter], [4th scope — TBD]). Splitting by scope kept each flow testable and kept a change to one path from breaking the others.
- **Up to 24 conditional insert paths per flow**, routing each change to the correct row shape based on practice area (patent prosecution, post-grant, trademark, or not applicable) and role.
- **Built-in reconciliation**: each flow counts the rows it *expected* to write vs. the rows it *actually* wrote, and alerts an admin if they differ.
- **Failure alerting**: a Teams adaptive card and an email, both with a deep link straight to the failed run and the submission ID.

**My role:** gathered requirements with IP Operations, designed the flow architecture, built and tested all four flows, and own ongoing support and enhancements. The IP Operations team created the SQL table and the form questions.

## How it works

### System view

```mermaid
flowchart LR
    U([Requester]) --> F[Microsoft Form<br/>73 questions]
    F -->|new response| R{Update scope}
    R --> P1[Flow 1<br/>Entire Client]
    R --> P2[Flow 2<br/>Family]
    R --> P3[Flow 3<br/>Matter]
    R --> P4[Flow 4<br/>TBD]
    P1 & P2 & P3 & P4 -->|Insert rows via<br/>on-prem data gateway| DB[(SQL Server<br/>staging table)]
    DB --> IB[Intapp Integration<br/>Builder rule]
    IB --> SYS[IP management &<br/>downstream systems]
    P1 & P2 & P3 & P4 -.->|mismatch or failure| A[Teams card + email<br/>to system admins]
```

### Inside one flow

```mermaid
flowchart TD
    T[Trigger: new form response] --> G[Get response details]
    G --> E[Enrich: timestamp + requester<br/>display name from Office 365]
    E --> L[For each of up to 4 change sets]
    L --> PA{Practice area?}
    PA -->|Patent prosecution| PR{Role group}
    PA -->|Post-grant| I1[Insert row]
    PA -->|Trademark| TR{Role group}
    PA -->|N/A| I2[Insert row]
    PR --> I3[Insert row]
    TR --> I4[Insert row]
    I1 & I2 & I3 & I4 --> C[Count: expected vs inserted]
    C -->|match| OK([Done])
    C -->|mismatch| AL[Alert admin with run link]
```

### Design decisions

| Decision | Why |
|---|---|
| Four flows, one per update scope | The form branches hard on one question. Separate flows mean smaller blast radius, simpler testing, and run history that's easy to read. |
| Role-group routing before insert | Different roles populate different columns. Routing first keeps every row in the exact shape the Integration Builder rule expects. |
| Expected-vs-inserted row count | A flow can "succeed" and still write nothing if a form answer doesn't match any branch. Counting catches silent gaps, not just hard failures. |
| Deep links in alerts | Whoever triages a failure goes straight to the run and submission — no hunting through run history. |
| Requester name looked up, not typed | Pulled from Office 365 by the responder's sign-in, so it can't be misspelled. |

## Results

- **In production since November 2024**
- **~10,000 form submissions processed** to date
- **0 manual SQL entries** — every request flows to the staging table automatically
- **[TBD]** minutes of manual handling avoided per request *(what would the alternative have been — email + manual entry?)*
- **[TBD]** failed or mismatched runs caught by alerts *(if you can pull it from run history)*
- **[TBD]** staffing changes applied (rows written), if it differs meaningfully from submissions

## Screenshots & demo

<!-- Scrubbed screenshots go in /public/case-studies/ip-staffing-updates/ -->
- [ ] Form: first page + one branched section (fake client/attorney data)
- [ ] Flow designer: top-level scopes collapsed
- [ ] Flow designer: one change-set expanded showing practice-area/role branching
- [ ] Teams failure card (fake values)
- [ ] Optional: 60–90s demo video, submit form → row appears in table

## What I'd do next

- Move the timezone conversion from a fixed offset to `convertTimeZone()` so timestamps stay correct across daylight saving time.
- Collapse the repeated insert blocks into a child flow or a single parameterized insert to cut maintenance across 24 paths.
- [Optional: Power BI view of request volume by practice area and role]
