---
name: next-issue
description: Take the next `ready` issue from GitHub, pick which Matt Pocock skill to tackle it with, and start once the user confirms.
argument-hint: "Optional issue number to take instead of the next one"
disable-model-invocation: true
---

Pick the next issue to work on, **route** it to the right skill, and start it after the user says OK.

`docs/agents/issue-tracker.md` is the source of truth for labels, the `gh api` calls (plain `gh issue` fails in cloud sessions) and how to take an issue. `docs/agents/triage-labels.md` maps `ready-for-agent` to this repo's label. Read both before step 1.

Talk to the user in Spanish.

## 1. Check the work in progress

The repo works **one thing at a time**. List open issues labelled `in progress`. If there is one, stop: show it to the user and ask whether to continue it instead (then route it from step 3). Done when no issue is `in progress`, or the user explicitly says to take another one anyway.

## 2. Pick the issue

With an argument, take that issue and confirm it is open and labelled `ready`; otherwise tell the user its real state and stop.

Without one, list open issues labelled `ready`, oldest first, pull requests filtered out. Drop any with an assignee or an open blocker. The first one left is the issue. None left: tell the user and stop.

## 3. Read it whole

Read the issue body and **every** comment (frames, decisions with date ART, answered questions live there), plus any feature doc, ADR or `GLOSSARY.md` entry it touches (see `docs/agents/domain.md`). Done when you can state the goal, the acceptance criteria, and what is still open.

## 4. Route it

Check the issue against **every** row, top to bottom. Rows marked _detour_ come before the main skill; collect all that apply. Then pick exactly one main skill.

| Signal in the issue | Skill |
| --- | --- |
| Open questions unchecked, or model / scope / permissions still «a definir» | _detour_: `/grill-with-docs` to settle them, recording decisions in the issue |
| Facts missing from outside the repo (third-party API, library, pricing, limits) | _detour_: `/research` in the background |
| New UI without approved mocks or frame, or a state model nobody has felt yet | _detour_: `/prototype` (repo rule: mocks are approved before code) |
| Steps only a person can do (dashboards, DNS, keys, secrets) | main: `/wizard` |
| Something broken, cause unknown | main: `/diagnosing-bugs` |
| Too big for one session: several slices that ship independently, or work across many layers | main: `/to-tickets` (the issue is already the spec) |
| Module shape or seams are the actual problem | main: `/codebase-design` |
| A concrete behaviour change, a handful of tests | main: `/tdd` |
| Specified work that fits one session | main: `/implement` (drives `/tdd`, closes with `/code-review`) |

When two main rows fit, take the higher one. Done when each chosen skill is backed by a line quoted from the issue, and each discarded row that came close has a one-line reason.

## 5. Recommend and wait

Show the user:

- the issue (`#n`, title, link) and its goal in one or two lines,
- the route: detours in order, then the main skill, each with the quoted evidence,
- the near-miss skills and why not,
- the branch you will create: `feature/`, `fix/`, `enhancement/` or `task/` plus a short kebab-case name, off `desarrollo`.

Then wait. The user may confirm, change the skill, or pick another issue.

## 6. Take it and start

On OK:

1. Create the branch from the latest `desarrollo`.
2. Take the issue as `docs/agents/issue-tracker.md` says: `ready` → `in progress`, with the comment «Tomado. Rama: <rama>».
3. Invoke the first skill of the route with the Skill tool, passing the issue number and link. The issue and its comments are the spec.
