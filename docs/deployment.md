# AnatoQuest deployment

Vercel remains connected to the GitHub repository, but [`vercel.json`](../vercel.json) disables Vercel's automatic Git deployments. Production releases are made only by the GitHub Actions workflow after a push to `main`, or by manually dispatching that workflow.

Configure these repository secrets in **GitHub repository → Settings → Secrets and variables → Actions**:

- `VERCEL_TOKEN` — a Vercel token with permission to deploy the project.
- `VERCEL_ORG_ID` — the Vercel team or personal account ID that owns the project.
- `VERCEL_PROJECT_ID` — the target Vercel project ID.

The workflow runs from `lab/` for dependency installation, the Vite build, and the Vercel CLI deployment. Its image optimizer writes only generated files under `lab/assets-optimized/`; originals under `lab/assets/` are never modified.
