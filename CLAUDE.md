## Agent skills

### Starting work

Start every piece of issue work with the `next-issue` skill: it takes the next `ready` issue (or the `#n` the user names), routes it to the right skill, and waits for the user's OK before touching anything.

### Pull requests

Merge your own PR into `desarrollo` as soon as it is ready, without asking: the bar is in the README («Cómo se trabaja»), the merge call in `docs/agents/issue-tracker.md`. Production (`main`) only with Jerónimo's OK.

### User docs

Before moving an issue to `done`, update the end-user docs in `docs/usuario/` with the `user-docs` skill, in the same PR. The folder is published to the GitHub wiki on every push to `main`.

### Issue tracker

Issues live in GitHub Issues of `jvallelunga/el-club-app`, using the label flow `backlog` → `refinement` → `ready` → `in progress` → `done`. See `docs/agents/issue-tracker.md`.

### Triage labels

The canonical triage roles map to this repo's labels (`backlog`, `refinement`, `ready`, `manual`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root, created lazily. Product decisions go in the issue; ADRs only for durable technical decisions. See `docs/agents/domain.md`.
