---
name: next-issue
description: Start work on an issue: take the next `ready` issue (or a given `#n`), route it to the right Matt Pocock skill, and begin once the user confirms. Use when the user asks to start working, for the next issue or task, or to take a specific issue.
argument-hint: "Optional issue number to take instead of the next one"
---

Pick the next issue to work on, **route** it to the right skill, and start it after the user says OK.

`docs/agents/issue-tracker.md` is the source of truth for labels and how to take an issue. `docs/agents/triage-labels.md` maps `ready-for-agent` to this repo's label. Read both before step 1.

Talk to the user in Spanish.

## Tools

- **GitHub**: use the GitHub MCP tools when the session has them (`list_issues` with `labels` and `state: OPEN`, `issue_read` with `get` / `get_comments`, `add_issue_comment`, `issue_write` for labels). Otherwise use the `gh api` calls in `docs/agents/issue-tracker.md`; plain `gh issue` fails in cloud sessions. To count open blockers, read `issue_dependencies_summary.blocked_by` with `gh api repos/jvallelunga/el-club-app/issues/<n>`.
- **Skills**: the Skill tool can call only model-invocable skills. These are user-invoked only (`disable-model-invocation: true`): `grill-with-docs`, `to-spec`, `to-tickets`, `implement`, `triage`, `wayfinder`. Step 6 says what to do with them.
- **Branch**: a cloud session is assigned one `claude/…` branch and may push only there. Locally, use the repo prefixes in step 5.

## 1. Check the work in progress

The repo works **one thing at a time**. List open issues labelled `in progress`. If there is one, stop: show it to the user and ask whether to continue it instead (then route it from step 3). Done when no issue is `in progress`, or the user explicitly says to take another one anyway.

## 2. Pick the issue

With an argument, take that issue and confirm it is open and labelled `ready`; otherwise tell the user its real state and stop.

Without one, list open issues labelled `ready`, oldest first, pull requests filtered out. Drop any with an assignee or an open blocker. The first one left is the issue. None left: tell the user and stop.

## 3. Read it whole

Read the issue body and **every** comment (frames, decisions with date ART, answered questions live there), plus any feature doc, ADR or `GLOSSARY.md` entry it touches (see `docs/agents/domain.md`), and the code and migrations it changes. Done when you can state the goal, the acceptance criteria, and what is still open.

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
- the branch: in a cloud session, the session's `claude/…` branch; locally, `feature/`, `fix/`, `enhancement/` or `task/` plus a short kebab-case name. Either way, off the latest `desarrollo`.

Then wait. The user may confirm, change the skill, or pick another issue.

## 6. Take it and start

On OK:

1. Put the branch on the latest `desarrollo`. In a cloud session, `git fetch origin desarrollo` and move the session branch onto it with `git checkout -B <branch> origin/desarrollo`, only if the branch holds no commits that `desarrollo` lacks; if it does, ask the user. Locally, create the new branch from `origin/desarrollo`.
2. Take the issue as `docs/agents/issue-tracker.md` says: `ready` → `in progress`, with the comment «Tomado. Rama: <rama>».
3. Rename the session to `#<n> <issue title>` (e.g. `#26 Editor de predios 3D por sede`), so the session list shows which issue it holds. In a cloud session, call `get_session` from the `claude-code-remote` tools with no id to get this session's id, then `set_session_title` with it. Without those tools, tell the user the name to set by hand.
4. Start the first skill of the route, passing the issue number and link. The issue and its comments are the spec.
   - Model-invocable skill: call it with the Skill tool.
   - User-invoked skill: ask the user to type it (e.g. `/grill-with-docs #26`) and wait. Don't run the skills it wraps in its place.
