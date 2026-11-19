## Agent skills

Matt Pocock's skills are local copies in `.claude/skills/` (from `mattpocock/skills` @ `5863806`, updated by hand). `.claude/settings.json` turns off both plugin sources (`@synced` and `@mattpocock`) so each skill loads once. His `code-review` is renamed `matt-code-review` so it doesn't clash with the built-in `/code-review`; keep that rename when updating.

### Starting work

Start every piece of issue work with the `next-issue` skill: in a refinement session it takes the parent's next ticket; in a new session it offers what to refine or implement. It routes the work to the right skill and waits for the user's OK before touching anything.

### Pull requests

Merge your own PR into its target branch (`desarrollo`, or the parent's issue branch for a ticket) as soon as it is ready, without asking: the bar is in the README («Cómo se trabaja»), branches and the merge call in `docs/agents/issue-tracker.md`. Production (`main`) only with Jerónimo's OK.

### User docs

Before moving an issue to `done`, update the end-user docs in `docs/usuario/` with the `user-docs` skill, in the same PR. The folder is published to the GitHub wiki on every push to `main`.

### Issue tracker

Issues live in GitHub Issues of `jvallelunga/el-club-app`, using the label flow `backlog` → `refinement` → `ready` → `in progress` → `done`. See `docs/agents/issue-tracker.md`.

### Triage labels

The canonical triage roles map to this repo's labels (`backlog`, `refinement`, `ready`, `manual`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root, created lazily. Product decisions go in the issue; ADRs only for durable technical decisions. See `docs/agents/domain.md`.
