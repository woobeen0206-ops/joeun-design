# Project map

## Sources of truth

| Purpose | Path | Notes |
|---|---|---|
| Project rules | `AGENTS.md` | Highest-level local instructions |
| Technical decisions | `.codex/docs/decisions.md` | Read recent entries first |
| Public homepage | `frontend/public/cases/index.html` | Main production page and portfolio data |
| Estimate page | `frontend/public/cases/joeun-design-estimate.html` | Production estimate flow shell |
| Estimate styles | `frontend/public/cases/estimate-wizard.css` | Estimate-specific presentation |
| Estimate behavior | `frontend/public/cases/estimate-wizard.js` | Questions, date range, validation |
| Portfolio media | `frontend/public/cases/projects-assets/` | Web-ready images, video, and selected audio |
| Brand assets | `frontend/public/cases/assets/brand/` | Symbols and logos used by static pages |
| Static validation | `infra/scripts/validate-static-site.mjs` | Missing references and forbidden files |
| Deploy artifact builder | `infra/scripts/build-static-site.mjs` | Collects only reachable files |
| GitHub release gate | `infra/scripts/release-and-deploy.sh` | Commit, push, tag, deploy, tag rollback |
| AWS deployment | `infra/scripts/deploy-site.sh` | S3, CloudFront, public hash verification |
| Deployment skill | `.agents/skills/deploy-joeun-site/SKILL.md` | Use only for readiness/preview/deploy requests |

## Boundaries

- Edit: `frontend/public/cases/`
- Generated: `.deploy/site/` and `.deploy/deploy-manifest.json`
- Local outputs: `output/`
- Temporary material and preserved nested Git backup: `tmp/`
- Legacy local reference: `design-preview/`
- Never deploy: repository root, `frontend/`, `design-preview/`, `output/`, `tmp/`, HEIC originals, development dependencies

## Current operating services

- GitHub repository: `woobeen0206-ops/joeun-design`, branch `main`
- S3 bucket and CloudFront identifiers live in `infra/deploy.env`; the file contains configuration, not credentials.
- Release tags use `vYYYYMMDD.0.N` in Asia/Seoul time.
- AWS secrets remain outside the repository.

## Architecture status

The public site is static and deploys directly to S3/CloudFront. Next.js, Spring Boot, PostgreSQL, and a mobile-friendly admin remain the intended future application architecture. Do not migrate static production pages into that future stack as a side effect of a content or design request.
