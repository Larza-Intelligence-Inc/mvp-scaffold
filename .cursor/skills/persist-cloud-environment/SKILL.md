---
name: persist-cloud-environment
description: >-
  Persist Cursor Cloud Agent environment changes so future agents inherit them:
  bake CLIs/tools into a saved VM snapshot, or install them idempotently via
  .cursor/environment.json. Use when a cloud agent is missing a tool it has
  locally (e.g. railway, docker, aws), when mid-task installs don't survive the
  next run, or when the user asks to "self-update", persist, or sync the cloud
  environment with their local setup.
---

# Persist Cloud Environment

Make a cloud agent as capable as local by persisting tools/secrets into the
environment. **Mid-task installs die with the VM** — the next agent boots from
the saved snapshot / Docker image, then re-runs `install`. Only those layers
persist.

Boot order every run: **snapshot or Docker image → `install` → `start` → `terminals`**.

## Choose a path

| Path | Best for | Persists via |
|------|----------|--------------|
| **Snapshot-driven** | Heavy / system CLIs (railway, docker, aws) | Saved VM disk image |
| **Code-driven** | "Always present from git", team parity | Idempotent `install` in `environment.json` |
| **Hybrid (recommended)** | Fast boots + self-healing | Snapshot + short `command -v … \|\| install` in `install` |

Do **not** expect a normal coding agent to `curl | sh` a tool mid-task and have
the next agent keep it. It won't.

---

## Path A — Snapshot-driven (heavy/system CLIs)

From [Cloud Agents → Environments](https://cursor.com/dashboard/cloud-agents#environments):

1. **Update with Agent** (incremental) or **New Setup Run** (from scratch)
2. Tell it to install the tool (and anything else used locally)
3. Verify in the shared terminal (e.g. `railway --version`)
4. **Save snapshot**
5. Commit the new snapshot id into `.cursor/environment.json`
6. Use **Restore** on version history if a bad setup lands

The `snapshot` field in this repo's `.cursor/environment.json` is where the id goes:

```json
{ "snapshot": "snapshot-YYYYMMDD-<id>", "install": "…", "start": "…", "terminals": [] }
```

Fast boots; the CLI survives only while that snapshot is valid. Snapshots
expire after ~90 days inactivity → Cursor falls back to the base image (+ your
`install`) with a warning. This is why Path C adds a self-healing check.

---

## Path B — Code-driven (every agent, via `install`)

Add an **idempotent** install to the `install` command in
`.cursor/environment.json`. Committing the file persists the *recipe*, not a
binary — the recipe reinstalls the binary every boot (or on cold cache).

```bash
command -v railway >/dev/null 2>&1 || curl -fsSL https://railway.com/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"   # if the installer uses a non-default dir
railway --version
```

Rules:
- Keep it idempotent (`command -v … || install`) — `install` may run on partial cache.
- Keep it fast; put rare/heavy work in `AGENTS.md` for on-demand use instead.
- Agents use the config **at the commit they start from** — test on a branch first.

---

## Path C — Hybrid (recommended)

1. **Bake** the slow/system tool into the snapshot (Path A) once.
2. **Also** add a short idempotent check in `install` (Path B) so an
   expired/missing snapshot self-heals.
3. Keep app deps (`npm`/`pip`) in `install`; long-lived services in `start`/`terminals`.
4. When tooling changes meaningfully: **Update with Agent** → save snapshot →
   bump `snapshot` in git. Use **Restore** to roll back.

---

## Credentials, not local logins

Interactive logins (`railway login`, `gh auth login`) do **not** transfer to
cloud. Instead:

- Add tokens as **Runtime Secrets** in the [dashboard](https://cursor.com/dashboard/cloud-agents)
  (redacted from transcripts): e.g. `RAILWAY_TOKEN` / `RAILWAY_API_TOKEN`, `GH_TOKEN`.
- Allowlist any API domains the tool needs if egress is restricted.
- Document non-interactive usage in `AGENTS.md` under the Cloud instructions.

---

## Verification checklist

- [ ] Tool present on a fresh cloud agent (`<tool> --version`)
- [ ] Works after a simulated cold boot (snapshot missing → `install` still provides it)
- [ ] Required secret is injected as an env var (not a local login)
- [ ] `AGENTS.md` documents the cloud-specific, non-interactive usage
- [ ] `environment.json` change tested on a branch before merging to default

## Reference

- [Cloud environment setup](https://cursor.com/docs/cloud-agent/setup.md)
- [Cloud agent settings (Update / Restore)](https://cursor.com/docs/cloud-agent/settings.md)
- [environment.schema.json](https://cursor.com/schemas/environment.schema.json)
- This repo's config: `.cursor/environment.json`; cloud notes in `AGENTS.md`
