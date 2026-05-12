# Resume

## Clone locally

This repository: `https://github.com/PeixuanL/Resume.git`

```bash
git clone https://github.com/PeixuanL/Resume.git
cd Resume
```

If the repository is private, use SSH (`git@github.com:PeixuanL/Resume.git`) or a personal access token over HTTPS.

## One main line of work (fewer long-lived branches)

Cursor Cloud Agents may still open **per-task** branches such as `cursor/<description>-<suffix>`; that behavior is controlled by the agent product defaults, not by this repo alone.

To keep **one primary branch** for your own work:

1. Treat `main` as the single source of truth locally: `git checkout main` and `git pull origin main` before you start.
2. When a Cloud session finishes, **merge the PR into `main`** (squash merge is fine), then **delete the remote `cursor/*` branch** in the GitHub UI so branches do not accumulate.
3. Optionally, in the Cloud task instructions, ask the agent to **continue on an existing branch** (for example a branch you created once and reuse). Whether that is honored depends on the Cloud agent run configuration.

After merges, update your machine:

```bash
git checkout main
git pull origin main
```
