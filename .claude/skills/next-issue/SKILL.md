---
name: next-issue
description: Start work on an issue. In a parent's refinement session, implement its next open ticket through a subagent; in a new session, offer a menu (refine an issue in `refinement`, a ticket of a parent in progress, or a standalone `ready` issue). Use when the user asks to start working, for the next issue or task, or to take a specific issue.
argument-hint: "Optional issue number to take instead of choosing from the menu"
---

Find out what this session is for, pick the issue, **route** it to the right skill, and start it after the user says OK.

`docs/agents/issue-tracker.md` is the source of truth for labels, parents and tickets, and how to take an issue. Read it before step 1, **Parent issues and their tickets** included.

Talk to the user in Spanish.

## Tools

- **GitHub**: use the GitHub MCP tools when the session has them (`list_issues` with `labels` and `state: OPEN`, `issue_read` with `get` / `get_comments` / `get_sub_issues` / `get_parent`, `add_issue_comment`, `issue_write` for labels). Otherwise use the `gh api` calls in `docs/agents/issue-tracker.md`; plain `gh issue` fails in cloud sessions. To count open blockers, follow **Count open blockers** in `docs/agents/issue-tracker.md`: a blocker labelled `done` is already merged into `desarrollo` and doesn't block, even though it stays open until production.
- **Session**: `get_session` (no id) gives this session's id; its link is `https://claude.ai/code/<id>`. `set_session_title` renames it. Without these tools, ask the user for the link and tell them the title to set by hand.
- **Skills**: the Skill tool can call only model-invocable skills. These are user-invoked only (`disable-model-invocation: true`): `grill-with-docs`, `to-spec`, `to-tickets`, `implement`, `triage`, `wayfinder`. When the route needs one, ask the user to type it and wait.

## 1. Find out what this session is

List the open parents in `in progress` and the open issues in `refinement`, and read the «Sesión de refinamiento: <link>» comment on each. Compare each link with this session's.

- **This session is a parent's refinement session** → **ticket mode**, step 2A.
- **This session is refining an issue still in `refinement`** → refinement isn't finished. Tell the user to go on with `/grill-with-docs #<n>`; once settled, `/to-tickets #<n>` if it needs several sessions, or move it to `ready` if it fits one. Stop.
- **Neither** → **menu mode**, step 2B.

With an argument `#<n>`, skip the menu and treat `#<n>` as the user's choice in step 2B (or as the ticket in 2A, if it belongs to this session's parent).

## 2A. Ticket mode: the next ticket of this session's parent

List the parent's open sub-issues. If one is `in progress`, show it and ask whether to wait for it or take another one anyway: the repo works **one ticket at a time**. Otherwise the ticket is the first sub-issue, in the parent's order, labelled `ready` with no assignee and no open blocker. None left: tell the user (all closed, or the rest blocked by what) and stop. Go on to step 3.

## 2B. Menu mode: ask what to work on

Build three lists:

- **Para refinar**: open issues labelled `refinement`. Mark the ones that already have a refinement session.
- **Tickets de issues en curso**: for each parent in `in progress`, its next ticket as in 2A, with the parent's refinement session.
- **Sueltos listos**: open issues labelled `ready` with no parent, no assignee and no open blocker, oldest first.

Also show any ticket or standalone issue already `in progress`: the repo works one at a time, so say it before the user picks. Ask with `AskUserQuestion` (or a numbered list if there are more options than it fits). Done when the user has chosen; then by choice:

- **An issue to refine with no session**: this session becomes its refinement session. Comment «Sesión de refinamiento: <link>» on the issue, rename the session to `#<n> <issue title>`, and ask the user to type `/grill-with-docs #<n>`. Stop.
- **An issue to refine that already has a session**: give the user that session's link to go on there. Stop.
- **A ticket**: give the user the parent's refinement session link and tell them to run `/next-issue` there. Stop.
- **A standalone issue**: go on to step 3.

## 3. Read it whole

Read the issue body and **every** comment (frames, decisions with date ART, answered questions live there); for a ticket, the parent's too. Add any feature doc, ADR or `GLOSSARY.md` entry it touches (see `docs/agents/domain.md`), and the code and migrations it changes. Done when you can state the goal, the acceptance criteria, and what is still open.

## 4. Route it

Check the issue against **every** row, top to bottom. Rows marked _detour_ come before the main skill; collect all that apply. Then pick exactly one main skill. «User-invoked» marks the skills you cannot call yourself.

| Signal in the issue | Skill |
| --- | --- |
| Open questions unchecked, or model / scope / permissions still «a definir» | _detour_: `/grill-with-docs` (user-invoked) to settle them, recording decisions in the issue |
| Facts missing from outside the repo (third-party API, library, pricing, limits) | _detour_: `/research` in the background |
| New UI without approved mocks or frame, or a state model nobody has felt yet | _detour_: `/prototype` (repo rule: mocks are approved before code) |
| Steps only a person can do (dashboards, DNS, keys, secrets) | main: `/wizard` |
| Something broken, cause unknown | main: `/diagnosing-bugs` |
| Too big for one session: several slices that ship independently, or work across many layers | main: `/to-tickets` (user-invoked; the issue is already the spec) |
| Module shape or seams are the actual problem | main: `/codebase-design` |
| A concrete behaviour change, a handful of tests | main: `/tdd` |
| Specified work that fits one session | main: `/implement` (user-invoked; drives `/tdd`, closes with `/matt-code-review`) |

When two main rows fit, take the higher one. Done when each chosen skill is backed by a line quoted from the issue, and each discarded row that came close has a one-line reason.

## 5. Recommend and wait

Show the user:

- the issue (`#n`, title, link) and its goal in one or two lines,
- the route: detours in order, then the main skill, each with the quoted evidence; say which steps they will have to type themselves,
- the near-miss skills and why not,
- the branch: a new `claude/<slug>` branch off the latest `desarrollo` (locally, `feature/`, `fix/`, `enhancement/` or `task/` plus a short kebab-case name); for a ticket, the subagent creates it.

Then wait. The user may confirm, change the skill, or pick another issue.

## 6. Take it and start

On OK:

- **A ticket (2A)**: hand it to a fresh subagent as **Parent issues and their tickets** in `docs/agents/issue-tracker.md` says, passing the issue number and link, the route and the parent. Wait for its report and show the user the PR link. The session keeps the parent's title.
- **A standalone issue (2B)**:
  1. Create the branch from `origin/desarrollo` after `git fetch origin desarrollo`.
  2. Take the issue as `docs/agents/issue-tracker.md` says: `ready` → `in progress`, with the comment «Tomado. Rama: <rama>».
  3. Rename the session to `#<n> <issue title>`.
  4. Start the first skill of the route, passing the issue number and link; the issue and its comments are the spec. A model-invocable skill: call it with the Skill tool. A user-invoked one: ask the user to type it (e.g. `/implement #45`) and wait.
