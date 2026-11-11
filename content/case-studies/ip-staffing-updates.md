---
title: "Self-Service Staffing Updates for IP Operations"
summary: "IP Operations was reviewing every staffing request by hand and updating two firm systems manually. I automated the work after the form: each response now updates both systems on its own, and failures are flagged right away."
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
    label: "responses re-keyed by hand"
  - value: "800–1,650"
    label: "hours of manual work avoided (est.)"
    note: "Assumes 5–10 minutes per request to review a response and update both systems by hand"
order: 1
featured: true
---

## The problem

At a law firm, every patent and trademark **matter** (a client's case or file) has a team assigned to it: a handling attorney, a supervising attorney, paralegals, and a billing contact. People change roles, join, and leave, so those assignments need updating constantly. The IP Operations team is responsible for keeping them accurate.

In early 2024, IP Operations built a **Microsoft Form with 73 questions** so attorneys and staff could request these staffing changes in a consistent way. A request can cover a whole client, a group of related matters (a "family"), or a single matter.

The form solved how requests came in, but not what happened next. **For every response, someone on IP Operations had to:**
1. Read and check the response by hand.
2. Log in to the firm's IP management system and make the change.
3. Make the same change again in the firm's practice management system.

That's two systems updated by hand, for every request, at a volume that now averages about 19 requests per business day.

**What made it tricky**
- **One response can hold up to four separate changes** (two for removals), each for a different practice area and role.
- **Mistakes are costly.** A wrong update doesn't just fail; it can change who is assigned to the wrong matters. Accuracy mattered more than speed.
- **The firm's database sits on its own servers**, not in the cloud, so the automation needed a secure way to reach it.

## What I built

### Already in place (built by IP Operations)
- **The Microsoft Form (73 questions).** Requesters answer questions that branch based on their earlier answers, so the form collects exactly the details each type of change needs.
- **The database table.** A table in the firm's SQL Server database, designed to hold one row per staffing change.

### What I built
- **Four automated flows in Power Automate**, one for each type of request: **Entire Client, Family, Matter, and Removal**. Each flow starts the moment someone submits the form. Keeping them separate means a change to one type of request can't break the others.
- **The routing logic inside each flow.** It reads the response, splits it into its separate changes, works out which practice area and role each change applies to, and saves each one as a correctly shaped row in the database table. A single flow has up to 24 of these paths.
- **The Integration Builder rule.** Intapp Integration Builder is a tool that moves data between the firm's systems. I built the rule that picks up each new row from the database table and applies the change to both the IP management system and the practice management system.
- **The requester lookup.** The flow looks up the requester's name from their Microsoft 365 sign-in, so nobody has to type it and it can't be misspelled.
- **A completeness check.** Each flow counts how many changes it *should* save and how many it *actually* saved. If the numbers don't match, it raises a failure notice.
- **Failure notifications to two audiences.** If anything goes wrong, a notice goes to:
  1. **Our internal Teams channel**, where my department monitors every flow we build.
  2. **The IP Operations stakeholders**, so they know right away that a request failed and that we're already troubleshooting it.

  Each notice includes a direct link to the failed run and the form response, so whoever picks it up can go straight to the problem.

**My role:** I gathered the requirements with IP Operations, designed the solution, built and tested the flows and the Integration Builder rule, and support and improve it in production.

## How it works

### The big picture

```mermaid
flowchart LR
    F["Requester submits<br/>the form"] --> R{"What kind<br/>of change?"}
    R --> P1["Entire Client<br/>flow"]
    R --> P2["Family<br/>flow"]
    R --> P3["Matter<br/>flow"]
    R --> P4["Removal<br/>flow"]
    P1 & P2 & P3 & P4 --> DB[("Firm database<br/>one row per change")]
    DB --> IB["Integration<br/>Builder rule"]
    IB --> SYS["IP management +<br/>practice management<br/>systems updated"]
    P1 & P2 & P3 & P4 -.-> A["Failure notice:<br/>our Teams channel<br/>+ IP Operations"]
```

1. Someone submits the form.
2. Based on the kind of change, one of the four flows picks it up.
3. The flow saves each change as a row in the firm's database.
4. The Integration Builder rule reads the new rows and updates both firm systems.
5. If anything fails along the way, both audiences are notified.

### Inside one flow

```mermaid
flowchart TD
    T["New form response arrives"] --> G["Read the answers"]
    G --> E["Add the time submitted and<br/>look up the requester's name"]
    E --> L["Split the response into<br/>its separate changes (up to 4)"]
    L --> PA{"Which practice area?"}
    PA -->|Patent| PR{"Which role?"}
    PA -->|Post-grant| I1["Save the change<br/>to the database"]
    PA -->|Trademark| TR{"Which role?"}
    PA -->|Not applicable| I2["Save the change<br/>to the database"]
    PR --> I3["Save the change<br/>to the database"]
    TR --> I4["Save the change<br/>to the database"]
    I1 & I2 & I3 & I4 --> C{"Was every expected<br/>change saved?"}
    C -->|Yes| OK(["Done"])
    C -->|No| AL["If anything fails → send a failure<br/>notification to our Teams monitoring<br/>channel and to IP Ops<br/>(with a link to the failed run)"]
```

### Why it's built this way

| Choice | Why it matters |
|---|---|
| Four flows instead of one | The form splits early on the kind of change. Separate flows are easier to test, and a fix to one can't break the others. |
| Sorting by practice area and role before saving | Different roles fill in different fields. Sorting first means every row arrives in exactly the shape the Integration Builder rule expects. |
| Counting expected vs. saved changes | A flow can finish without an error and still miss a change if an answer doesn't match any path. The count catches those quiet misses. |
| Notifying two audiences | My team can start fixing the problem, and IP Operations isn't left wondering whether a request went through. |
| Looking up the requester's name | It comes from their sign-in, so it's always accurate. |

## Results

- **In production since November 2024**, with close to **10,000 requests** processed.
- **No more manual updates for form requests.** IP Operations no longer reviews each response and updates two systems by hand.
- **Changes arrive complete and consistent.** Every change is saved with the same set of details in the same format.
- **Problems are flagged immediately.** Failures go straight to the people who fix them and the people who depend on them.

*Hours avoided is an estimate: 9,940 requests at 5–10 minutes of manual work each.*

## Screenshots

*Recreated with sample data. Names, emails, client numbers, and system details are fictional.*

<figure>
  <img src="/case-studies/ip-staffing-updates/form-intro.webp" alt="The staffing update request form in Microsoft Forms" loading="lazy" />
  <figcaption>The request form IP Operations built: 73 questions, with a warning up front because a wrong answer changes real matters.</figcaption>
</figure>

<figure>
  <img src="/case-studies/ip-staffing-updates/form-branching.webp" alt="The form's branching rules, showing which question each answer leads to" loading="lazy" />
  <figcaption>The form branches: each answer sends the requester to the next question that applies to them.</figcaption>
</figure>

<figure>
  <img src="/case-studies/ip-staffing-updates/flow-overview.webp" alt="One of the four automated flows, shown at the top level" loading="lazy" />
  <figcaption>One of the four flows I built: read the response, handle up to four changes, then either confirm everything was saved or send a failure notice.</figcaption>
</figure>

<figure>
  <img src="/case-studies/ip-staffing-updates/flow-change-set.webp" alt="One change opened up, showing the practice area and role paths and the database fields being filled in" loading="lazy" />
  <figcaption>One change, opened up: practice area, then role, then save. The panel on the right shows each form answer being placed into a database field.</figcaption>
</figure>

<figure>
  <img src="/case-studies/ip-staffing-updates/teams-alert.webp" alt="A failure notice posted in a Microsoft Teams channel" loading="lazy" />
  <figcaption>A failure notice in our Teams monitoring channel. IP Operations is notified at the same time, so both teams know a fix is underway.</figcaption>
</figure>
