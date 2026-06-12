# Superintendent

> AI superintendent for engineering work. Refines Linear tickets through structured questioning, plans the work, runs coding agents, and surfaces the full project context, back to the same Linear ticket, so executives get a complete picture without asking anyone.

<!-- TODO: hero gif showing a ticket evolving from "build login" → full elaborated spec with Q&A → plan → PR → completion -->

## Two audiences, one surface

**For developers.** Superintendent owns the boring parts: chases clarifying questions for vague tickets, breaks epics into sub-issues, orchestrates coding agents, retries failures, requests review at the right moment. You stay in flow.

**For executives & PMs.** Every Linear ticket becomes a self-contained project record. Original ask → refinement Q&A transcript → final elaborated description → implementation plan → progress updates → completion summary. Scroll a ticket, get the whole story. No standups required.

## How a ticket evolves

<!-- TODO: numbered diagram or screenshot sequence showing the ticket lifecycle -->

1. An engineer files a vague ticket (e.g. *"Add SSO to admin panel"*).
2. Superintendent posts a refinement comment with 4 clarifying questions.
3. The engineer answers in the comment thread.
4. Superintendent posts the elaborated final description as a comment **and updates the ticket body**.
5. Superintendent posts the implementation plan.
6. A coding agent picks it up; progress comments fire on PR open, test pass/fail, review requested.
7. Final completion comment with PR link, files changed, cost summary.

## Setup

```bash
git clone https://github.com/aliwagih-ubc/superintendent.git
cd superintendent
npm install
npm run setup        # interactive wizard, ~3 min
npm run dev          # start the daemon
```

The wizard walks you through Linear, Anthropic, your target repo, and agent settings. Every value is validated live as you enter it. Run `npm run doctor` later to re-check your setup if anything breaks.

## How it works

<!-- TODO: architecture diagram (Linear ← daemon ← Anthropic + coding agent ← your repo) -->

- **Polling architecture.** No webhooks, no public URL, no ngrok required. Daemon polls Linear every 30s.
- **State lives in Linear.** Labels plus a dedicated "Superintendent State" project.
- **All comms via Linear comments.** The ticket *is* the source of truth.
- **Concurrent agents.** Configurable; Git worktree isolation per agent.
- **PRs.** Auto-merge or human review (configurable).

## Triggering work in Linear

Superintendent is mention-triggered, not auto-pilot. Creating, assigning, or moving a ticket does nothing on its own. The daemon polls Linear every 30s and acts only when you post a command as a comment on the ticket.

**Where to type it:** in the ticket's plain Linear comment box, as plain text. Two things to watch:

- Do not pick a user from Linear's `@` autocomplete. The daemon matches the literal text `@superintendent`, so let it stay as text.
- If the ticket is synced to GitHub, use the **Linear** comment box, not the "Post to GitHub" box. The daemon only reads Linear comments.

**Commands:**

| Comment in the ticket   | What it does                                                              |
| ----------------------- | ------------------------------------------------------------------------ |
| `@superintendent plan`  | Planning mode: gathers requirements through Q&A before any code is written. |
| `@superintendent clarify` | Asks clarifying questions to sharpen a vague ticket.                    |
| `@superintendent rewrite` | Consolidates the comment discussion into an updated ticket description.  |
| `@superintendent work`  | Implements the ticket: runs the coding agent, opens a PR, then self-reviews. |
| `@superintendent`       | Posts the list of commands (also shown for any unknown command).          |

After you comment, the next poll (within ~30s) picks it up. The ticket then appears on the dashboard **Now** page and Superintendent starts commenting on the ticket.

**Choosing the coding agent (provider).** `@superintendent work` runs the default provider set by `CODING_PROVIDER` in `.env` (`claude-code`, `gemini`, or `codex`). To use a different one for a single ticket, add a label named exactly `provider:gemini`, `provider:codex`, or `provider:claude-code` to the ticket **before** you comment `@superintendent work`. The label wins over the default; an unrecognized `provider:` label is ignored and the default is used. The provider that ran is shown on the dashboard ticket detail and recorded on the cost rows. Each provider's CLI must be installed and authenticated on the daemon host (`npm run doctor` reports whether the configured default's CLI is on PATH).

## Configuration

| Variable                             | Required | Default              | Description                                                          |
| ------------------------------------ | -------- | -------------------- | -------------------------------------------------------------------- |
| `LINEAR_WORKSPACE_SLUG`              | yes      | -                    | Your Linear workspace slug (e.g. `aliwagih`)                         |
| `LINEAR_CLIENT_ID` / `..._SECRET`    | yes\*    | -                    | Linear OAuth credentials (\* or `LINEAR_PERSONAL_TOKEN`)             |
| `LINEAR_PERSONAL_TOKEN`              | yes\*    | -                    | Linear PAT (alternative to OAuth)                                    |
| `LINEAR_TEAM_ID`                     | yes      | -                    | UUID of the Linear team to monitor                                   |
| `LINEAR_PROJECT_ID`                  | no       | -                    | Filter to a specific Linear project                                  |
| `ANTHROPIC_API_KEY`                  | yes      | -                    | Your Anthropic API key (`sk-ant-...`)                                |
| `ANTHROPIC_MODEL`                    | no       | `claude-sonnet-4-6`  | Default model for analysis                                           |
| `GITHUB_REPO`                        | yes      | -                    | `owner/repo` where agents push work                                  |
| `AGENTS_WORK_DIR`                    | yes      | -                    | Absolute path to a local clone of `GITHUB_REPO`                      |
| `AGENTS_MAX_CONCURRENT`              | no       | `5`                  | Concurrent analysis tasks                                            |
| `AGENTS_MAX_CODE_EXECUTORS`          | no       | `1`                  | Concurrent Claude Code instances                                     |
| `AGENTS_TIMEOUT_MINUTES`             | no       | `60`                 | Per-agent timeout                                                    |
| `AGENTS_MAX_RETRIES`                 | no       | `2`                  | Max retries on failure                                               |
| `DAEMON_POLL_INTERVAL_SECONDS`       | no       | `30`                 | Linear polling cadence                                               |

## Architecture

<!-- TODO: link to docs/architecture.md once it exists -->

```
src/
├── index.ts              # Daemon entry point (polling loop)
├── config.ts             # Zod-validated configuration
├── linear/               # Linear SDK integration
├── agents/               # Coding agent management + worktree isolation
├── queue/                # Work assignment with HITL approval
├── sessions/             # SQLite-backed session storage
└── utils/                # Shared utilities (logger, process)

scripts/setup/            # Interactive setup wizard (Ink TUI)
scripts/doctor.ts         # `npm run doctor`, re-validate .env
bin/super.js              # `super` CLI dispatcher
```

## Commands

| Command          | Purpose                                |
| ---------------- | -------------------------------------- |
| `npm run setup`  | Interactive setup wizard               |
| `npm run doctor` | Re-validate `.env`                     |
| `npm run dev`    | Start the daemon                       |
| `npm run session`| Inspect agent sessions                 |
| `npm run auth`   | Re-do Linear auth only                 |
| `npm test`       | Run unit tests                         |
| `super <cmd>`    | Shorthand for `npm run <cmd>`          |

## Roadmap

- **Phase 1 ✓.** Foundation (you are here)
- **Phase 2.** Observability: web dashboard, cost & usage tracking, richer Linear comments
- **Phase 3.** Agent depth: multi-provider executors, PR self-review loop

## License

MIT. See [LICENSE](./LICENSE).
