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
| `done` | Merged into its target branch (remove `in progress`): a ticket into its parent's issue branch, any other issue into `desarrollo`. The issue stays **open** until it reaches production. |
| `manual` | Has to be done by a person (DNS, Supabase dashboard, keys, etc.), not code. |
| `wontfix` | Will not be done. |

The issue closes when it reaches production (`main`), never on an earlier merge. GitHub only closes from `Closes #<n>` on `main`, so PRs into other branches say `Part of #<n>` and keep it open.

**Release to production** (only with Jerónimo's OK): open a PR from `desarrollo` to `main` whose body has one `Closes #<n>` line per open issue labelled `done` whose work is already in `desarrollo`: a standalone issue, or a parent in `done` together with each of its sub-issues. A ticket whose parent is still `in progress` waits for the next release. Merging the PR closes them all.

## Issue branches

Every issue taken from `ready`, and every parent, gets its own **issue branch** `issue/<n>-<slug>` (kebab-case) off the latest `desarrollo`, created by the session that takes it. Record it on the issue in the «Tomado. Rama: <rama>» comment.

- **Standalone issue:** the session works on its issue branch and opens the PR into `desarrollo`. The issue moves to `done` when that PR merges.
- **Parent:** its issue branch collects its tickets; see below.

## Parent issues and their tickets

A **parent** is an issue split into tickets (GitHub sub-issues), like #26 and #41–#48.

- **Refinement session:** the session that refines an issue, from the moment it takes it out of `refinement`. Record it on the issue right away as a comment «Sesión de refinamiento: <link to the session>». If the issue gets split, that session becomes the parent's session and the **orchestrator** of its tickets.
- **Parent branch:** when the first ticket starts, the orchestrator creates the parent's issue branch off `desarrollo` (if it doesn't exist yet), pushes it, and comments «Rama del padre: <rama>» on the parent.
- **Label:** the parent is `in progress` from the split until its issue branch merges into `desarrollo`; then it's `done`. Its tickets are `done` as soon as each one's PR merges into the parent branch.
- **One child session per ticket:** the orchestrator starts every ticket as a **child session** of the refinement session (`start_session`, `initiation: "user_asked"`, `context: "fresh"`, its own worktree cut from the parent branch, titled `#<ticket> <ticket title>`), one at a time in blocker order. Child sessions show nested under the parent's session in the sidebar, so the tree shows which tickets ran. Don't use an in-process subagent (Agent tool) for a ticket: it doesn't appear in that tree. The child session:
  1. works on its ticket branch off the latest parent branch, takes the ticket («Tomado. Rama: <rama>»), and pushes its first green commit right away, so an interrupted run leaves nothing stranded in the worktree;
  2. follows `.claude/skills/implement/SKILL.md` in full, including its `matt-code-review` step (a session can dispatch the reviewers);
  3. opens the PR into the **parent branch** (`Part of #<ticket>`), waits for CI green, and reports the PR link and the review findings **without merging** and without changing the ticket's label.
- **Merge by the orchestrator:** when the child session reports, the orchestrator checks the PR (diff against the parent branch, CI, acceptance criteria, how each review finding was settled). Fixes go back to the same child session (`SendMessage` to its `local_…` id). Once the PR is green and settled, the orchestrator merges it into the parent branch and moves the ticket to `done`.
- **End-user docs belong to the parent:** tickets don't write `docs/usuario/` and carry no acceptance criterion for it; the whole feature is documented once, when it's complete.
- **Closing the parent:** when every ticket is `done`, the orchestrator updates the parent branch from `desarrollo`, writes the end-user docs for the whole feature on the parent branch with the `user-docs` skill, opens its PR into `desarrollo` (`Part of #<parent>`), merges it once `clean`, and moves the parent to `done`.

## Apply migrations to development

The development Supabase project (`el-club-app-desarrollo`) follows `desarrollo` and the issue branches. The workflow `.github/workflows/migraciones-desarrollo.yml` does it on every push to `desarrollo` or `issue/*` that touches `supabase/migrations/`: it runs `scripts/probar-rls.sh`, then `scripts/aplicar-migraciones-desarrollo.sh`, which applies the migrations missing from `interno.migracion_aplicada`, in order, and records them. Production is never touched this way: it moves only with Jerónimo's OK.

- **After a merge that brings migrations:** check that the run of «Migraciones en desarrollo» for that push went green, and say so on the issue. If it failed, fix it before going on.
- **By hand** (CI down, or to check): `bash scripts/aplicar-migraciones-desarrollo.sh --pendientes` lists what's missing, and without arguments applies it. In a cloud session the network proxy adds the token (the environment's `api.supabase.com` secret): never send or print it.
- **Without a token** (401/403, the host blocked, or the GitHub secret `SUPABASE_ACCESS_TOKEN` missing): say so on the issue and in your report so Jerónimo can fix it.

## Conventions

- **Create an issue**: `gh api repos/jvallelunga/el-club-app/issues -f title="..." -F body=@body.md -f "labels[]=backlog"`.
- **Read an issue**: `gh api repos/jvallelunga/el-club-app/issues/<n>` and its comments with `gh api repos/jvallelunga/el-club-app/issues/<n>/comments`.
- **List issues**: `gh api 'repos/jvallelunga/el-club-app/issues?state=open&labels=<label>&sort=created&direction=asc' --jq '.[] | select(.pull_request | not)'` (the endpoint also returns pull requests; filter them out).
- **Comment on an issue**: `gh api repos/jvallelunga/el-club-app/issues/<n>/comments -F body=@comment.md`.
- **Apply / remove labels**: `gh api repos/jvallelunga/el-club-app/issues/<n>/labels -f "labels[]=<label>"` / `gh api -X DELETE "repos/jvallelunga/el-club-app/issues/<n>/labels/<label>"` (URL-encode spaces: `in%20progress`).
- **Make an issue a sub-issue of a parent**: `gh api --method POST repos/jvallelunga/el-club-app/issues/<parent>/sub_issues -F sub_issue_id=<child-db-id>` (database id, as in **Blocking** below). Without sub-issues, put `Part of #<parent>` at the top of the child body.
- **Blocking**: GitHub's native issue dependencies: `gh api --method POST repos/jvallelunga/el-club-app/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where `<blocker-db-id>` is the blocker's numeric database id (`gh api repos/jvallelunga/el-club-app/issues/<n> --jq .id`, not the `#number` or `node_id`). Where dependencies aren't available, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is **resolved**: closed, or open with the `done` label (merged into its target branch, waiting for production).
- **Count open blockers**: an open blocker is one that is open and **not** labelled `done`. `issue_dependencies_summary.blocked_by` counts every open blocker, `done` ones included, so don't use it for this. Count them with `gh api repos/jvallelunga/el-club-app/issues/<n>/dependencies/blocked_by --jq '[.[] | select(.state == "open" and ([.labels[].name] | index("done") | not))] | length'`. Also read the body's `Blocked by` section: every issue listed there that is open and not `done` counts too. The ticket is startable only when both are 0.
- **Close**: first post the explanation as a comment, then `gh api -X PATCH repos/jvallelunga/el-club-app/issues/<n> -f state=closed`.

File issues only into `jvallelunga/el-club-app`. Never file into `mattpocock/skills` (the repo these skills come from).

Questions about missing requirements and product decisions (with date and time ART) go as comments on the issue.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

A PR goes into its target branch (see **Issue branches**) with `Part of #<n>`; only the release PR into `main` says `Closes`. Use `gh api repos/jvallelunga/el-club-app/pulls` to create, read and list them. GitHub shares one number space across issues and PRs, so a bare `#42` may be either.

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
