# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues in `jvallelunga/el-club-app`. The issues are written by the Product Owner; the issue and its comments are the source of truth for what to build.

In cloud sessions the `gh issue …` / `gh pr …` subcommands fail (they use GraphQL, which is blocked). Use the REST API through `gh api` for everything.

## Label flow

Each issue carries one state label at a time:

| Label | Meaning |
| --- | --- |
| `backlog` | Idea, not specified yet. Don't touch it: a person moves it to `refinement` when it's time. |
| `refinement` | To be refined. A session takes it from `/next-issue` and refines it (`/grill-with-docs`); don't implement it. |
| `ready` | Has enough information to be developed. |
| `in progress` | Being developed. Set when the work is taken (remove `ready`) with a comment «Tomado. Rama: <rama>». |
| `done` | Merged into `desarrollo` (remove `in progress`). The issue stays **open** until it reaches production. |
| `manual` | Has to be done by a person (DNS, Supabase dashboard, keys, etc.), not code. |
| `wontfix` | Will not be done. |

The issue closes when it reaches production (`main`), never on the merge into `desarrollo`. GitHub only closes from `Closes #<n>` on `main`, so a PR into `desarrollo` keeps it open.

**Release to production** (only with Jerónimo's OK): open a PR from `desarrollo` to `main` whose body has one `Closes #<n>` line per open issue labelled `done`. Merging it closes them all. A parent closes when its last sub-issue does, so list the parent too once all its sub-issues are `done`.

## Parent issues and their tickets

A **parent** is an issue split into tickets (GitHub sub-issues), like #26 and #41–#48.

- **Label:** the parent keeps `in progress` from the split until all its sub-issues are `done`; then it moves to `done` too, and it closes with them on the release to `main`. It never goes back to no label while a sub-issue is open.
- **Refinement session:** the session that refines an issue, from the moment it takes it out of `refinement`. Record it on the issue right away as a comment «Sesión de refinamiento: <link to the session>». If the issue gets split, that session becomes the parent's session.
- **One subagent per ticket:** every ticket of a parent is worked from the refinement session, never from a separate session. That session takes the next unblocked ticket and hands it to a fresh subagent (Agent tool, `isolation: "worktree"`, in the foreground). The subagent creates its own `claude/<slug>` branch off the latest `desarrollo`, takes the ticket («Tomado. Rama: <rama>»), follows `.claude/skills/implement/SKILL.md`, opens and merges the PR as the README says, applies the PR's new migrations to the development Supabase (see **Apply migrations to development**), moves the ticket to `done`, and reports the PR link. One ticket at a time, in blocker order.

## Apply migrations to development

Every PR merged into `desarrollo` that adds files to `supabase/migrations/` gets them applied **right after the merge** to the development Supabase project (`el-club-app-desarrollo`, ref `paacpcdurdcmbamdhcmt`). Production is never touched this way: it moves only with Jerónimo's OK.

- **How:** the Management API, `POST https://api.supabase.com/v1/projects/paacpcdurdcmbamdhcmt/database/query` with `{"query": "<file contents>"}`. The session's network proxy adds the token (the environment's `api.supabase.com` secret): never send or print it yourself. One file per call, in filename order, and stop at the first error.
- **Check first:** if an earlier migration is missing in development (a table, column or function it creates doesn't exist), apply the missing ones in order before yours. All migrations are idempotent, so re-running one changes nothing.
- **Record it:** comment on the issue which migrations were applied and how you checked them (for example, that the new columns exist).
- **Without the token** (401/403, or the host is blocked): don't skip it silently. Say so in the issue and in your report so Jerónimo can run the files in the Supabase SQL editor.

## Conventions

- **Create an issue**: `gh api repos/jvallelunga/el-club-app/issues -f title="..." -F body=@body.md -f "labels[]=backlog"`.
- **Read an issue**: `gh api repos/jvallelunga/el-club-app/issues/<n>` and its comments with `gh api repos/jvallelunga/el-club-app/issues/<n>/comments`.
- **List issues**: `gh api 'repos/jvallelunga/el-club-app/issues?state=open&labels=<label>&sort=created&direction=asc' --jq '.[] | select(.pull_request | not)'` (the endpoint also returns pull requests; filter them out).
- **Comment on an issue**: `gh api repos/jvallelunga/el-club-app/issues/<n>/comments -F body=@comment.md`.
- **Apply / remove labels**: `gh api repos/jvallelunga/el-club-app/issues/<n>/labels -f "labels[]=<label>"` / `gh api -X DELETE "repos/jvallelunga/el-club-app/issues/<n>/labels/<label>"` (URL-encode spaces: `in%20progress`).
- **Make an issue a sub-issue of a parent**: `gh api --method POST repos/jvallelunga/el-club-app/issues/<parent>/sub_issues -F sub_issue_id=<child-db-id>` (database id, as in **Blocking** below). Without sub-issues, put `Part of #<parent>` at the top of the child body.
- **Blocking**: GitHub's native issue dependencies: `gh api --method POST repos/jvallelunga/el-club-app/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where `<blocker-db-id>` is the blocker's numeric database id (`gh api repos/jvallelunga/el-club-app/issues/<n> --jq .id`, not the `#number` or `node_id`). Where dependencies aren't available, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is **resolved**: closed, or open with the `done` label (merged into `desarrollo`, waiting for production).
- **Count open blockers**: an open blocker is one that is open and **not** labelled `done`. `issue_dependencies_summary.blocked_by` counts every open blocker, `done` ones included, so don't use it for this. Count them with `gh api repos/jvallelunga/el-club-app/issues/<n>/dependencies/blocked_by --jq '[.[] | select(.state == "open" and ([.labels[].name] | index("done") | not))] | length'`. Also read the body's `Blocked by` section: every issue listed there that is open and not `done` counts too. The ticket is startable only when both are 0.
- **Close**: first post the explanation as a comment, then `gh api -X PATCH repos/jvallelunga/el-club-app/issues/<n> -f state=closed`.

File issues only into `jvallelunga/el-club-app`. Never file into `mattpocock/skills` (the repo these skills come from).

Questions about missing requirements and product decisions (with date and time ART) go as comments on the issue.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

PRs go against `desarrollo`, with `Closes #<n>`. Use `gh api repos/jvallelunga/el-club-app/pulls` to create, read and list them. GitHub shares one number space across issues and PRs, so a bare `#42` may be either.

Merge with `gh api -X PUT repos/jvallelunga/el-club-app/pulls/<n>/merge -f merge_method=merge` (a merge commit, never squash), once `mergeable_state` is `clean` (`gh api repos/jvallelunga/el-club-app/pulls/<n> --jq .mergeable_state`).

## When a skill says "publish to the issue tracker"

Create a GitHub issue with the `backlog` label.

## When a skill says "fetch the relevant ticket"

Read the issue and its comments with the REST calls above.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: a single issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body.
- **Child ticket**: an issue linked to the map as a GitHub sub-issue (see **Make an issue a sub-issue of a parent**). Where sub-issues aren't enabled, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`).
- **Blocking**: see **Blocking** under Conventions.
- **Frontier query**: list the map's open children, drop any with an open blocker (see **Count open blockers**, or an open issue in the `Blocked by` line) or an assignee; first in map order wins.
- **Resolve**: comment the answer on the child, close it, then append a context pointer to the map's Decisions-so-far.
