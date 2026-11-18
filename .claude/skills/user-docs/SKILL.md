---
name: user-docs
description: Write or update the end-user docs in `docs/usuario/`, published to the GitHub wiki. Use before moving an issue to `done`, or when the user asks to document a feature for the app's users.
---

Keep `docs/usuario/` describing what the app does **today** for the people who use it. A GitHub Action copies the folder to the repo wiki on every push to `main`, so these files are the wiki: edit them here, in the same PR as the feature.

## Readers

- **Admin del club**: configures their club, sedes, admins and tournaments.
- **Público**: players, families and anyone following the club (live board, teams, mesa).
- Any later non-Super-Admin role (e.g. manager) gets its own section when it ships.

The Super Admin is **not** a reader: leave Super Admin-only screens out. When a Super Admin feature produces something others see (e.g. the read-only predio 3D on a sede page), document only that visible part.

## Steps

1. **Find what changed for readers.** Read the issue's acceptance criteria and the branch diff against `desarrollo`. List every change a reader can see or do. Done when each criterion is on the list or marked as not reader-facing (Super Admin only, internal, no visible effect). If nothing is reader-facing, say so and stop.
2. **Write the pages.** Update the page that already covers that screen or task; create one only for a new screen or task. Done when every item on the list is covered.
3. **Update the index.** `Home.md` and `_Sidebar.md` link every page, grouped by reader.

## Page rules

- One page per screen or task, named by what the reader wants to do: `Cargar-una-sede.md`, `Seguir-un-partido-en-vivo.md`. File names are unique and flat (no subfolders): the wiki uses them as page names.
- Link pages wiki-style, without `.md`: `[Cargar una sede](Cargar-una-sede)`.
- Shape: one line on what it is and who sees it; then numbered steps naming the buttons and fields exactly as the UI labels them; then notes for limits and permissions («solo un Admin del club puede…»).
- Spanish, addressing the reader as «vos», in the club's vocabulary (`GLOSSARY.md`, the README's «Redacción» rules). Describe the app as it is now: release notes and «nuevo» live in the PR, not here.
- Write for the club, not for one club: say «tu club», never «Los Cardos».
