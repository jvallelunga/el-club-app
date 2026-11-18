## Agent skills

### Starting work

Start every piece of issue work with the `next-issue` skill: it takes the next `ready` issue (or the `#n` the user names), routes it to the right skill, and waits for the user's OK before touching anything.

### Issue tracker

Issues live in GitHub Issues of `jvallelunga/el-club-app`, using the label flow `backlog` → `refinement` → `ready` → `in progress` → `done`. See `docs/agents/issue-tracker.md`.

### Triage labels

The canonical triage roles map to this repo's labels (`backlog`, `refinement`, `ready`, `manual`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root, created lazily. Product decisions go in the issue; ADRs only for durable technical decisions. See `docs/agents/domain.md`.
