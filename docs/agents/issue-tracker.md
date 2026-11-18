# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues in `jvallelunga/el-club-app`. The issues are written by the Product Owner; the issue and its comments are the source of truth for what to build.

In cloud sessions the `gh issue …` / `gh pr …` subcommands fail (they use GraphQL, which is blocked). Use the REST API through `gh api` for everything.

## Label flow

Each issue carries one state label at a time:

| Label | Meaning |
| --- | --- |
| `backlog` | Idea, not specified yet. Don't work on it. |
| `refinement` | Taken out of the backlog to refine it. Don't work on it. |
| `ready` | Has enough information to be developed. |
| `in progress` | Being developed. Set when the work is taken (remove `ready`) with a comment «Tomado. Rama: <rama>». |
| `done` | Development finished and PR open against `desarrollo` (remove `in progress`). |
| `manual` | Has to be done by a person (DNS, Supabase dashboard, keys, etc.), not code. |
| `wontfix` | Will not be done. |

The issue closes when the PR (with `Closes #<n>`) is merged.

## Conventions

- **Create an issue**: `gh api repos/jvallelunga/el-club-app/issues -f title="..." -F body=@body.md -f "labels[]=backlog"`.
- **Read an issue**: `gh api repos/jvallelunga/el-club-app/issues/<n>` and its comments with `gh api repos/jvallelunga/el-club-app/issues/<n>/comments`.
- **List issues**: `gh api 'repos/jvallelunga/el-club-app/issues?state=open&labels=<label>&sort=created&direction=asc' --jq '.[] | select(.pull_request | not)'` (the endpoint also returns pull requests; filter them out).
- **Comment on an issue**: `gh api repos/jvallelunga/el-club-app/issues/<n>/comments -F body=@comment.md`.
- **Apply / remove labels**: `gh api repos/jvallelunga/el-club-app/issues/<n>/labels -f "labels[]=<label>"` / `gh api -X DELETE "repos/jvallelunga/el-club-app/issues/<n>/labels/<label>"` (URL-encode spaces: `in%20progress`).
- **Make an issue a sub-issue of a parent**: `gh api --method POST repos/jvallelunga/el-club-app/issues/<parent>/sub_issues -F sub_issue_id=<child-db-id>` (database id, as in **Blocking** below). Without sub-issues, put `Part of #<parent>` at the top of the child body.
- **Blocking**: GitHub's native issue dependencies: `gh api --method POST repos/jvallelunga/el-club-app/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where `<blocker-db-id>` is the blocker's numeric database id (`gh api repos/jvallelunga/el-club-app/issues/<n> --jq .id`, not the `#number` or `node_id`). Where dependencies aren't available, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is closed.
- **Count open blockers**: `gh api repos/jvallelunga/el-club-app/issues/<n> --jq .issue_dependencies_summary.blocked_by` (open blockers only; 0 means startable).
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
