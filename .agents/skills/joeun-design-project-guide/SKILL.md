---
name: joeun-design-project-guide
description: Understand and work safely in the 좋은디자인 website repository across fresh conversations. Use for any request about this project's website structure, portfolio cases, photos or videos, estimate flow, copy, design, testing, GitHub release readiness, or implementation changes. Route actual production deployments to the deploy-joeun-site skill.
---

# 좋은디자인 프로젝트 가이드

Use this skill as the entry point for work in the `joeun-design` repository. Do not depend on earlier chat history: reconstruct the current state from the repository before changing anything.

## Start every task

1. Confirm the repository root and read `AGENTS.md`.
2. Read `.codex/docs/decisions.md` for decisions that changed after the initial plan.
3. Inspect `git status` and preserve existing user changes.
4. Read only the files relevant to the request. Use [references/project-map.md](references/project-map.md) to locate them.
5. State the intended work briefly in Korean, then continue without asking about routine implementation choices.

The owner is not a developer. Explain outcomes in simple Korean and ask only for business choices that cannot be inferred, such as public wording, visual preference, exposed company information, cost, or an irreversible production action.

## Core facts

- The production website is currently a static portfolio site in `frontend/public/cases/`.
- The Next.js/Vinext files under `frontend/app/` are a wrapper and future application base; they are not the source of the deployed portfolio pages.
- Never edit `design-preview/` as the final source. It is ignored legacy material.
- Never edit `.deploy/site/`; it is generated from the static source.
- Keep project instructions and reusable operating knowledge in the repository so a new conversation can recover them.

For detailed paths and boundaries, read [references/project-map.md](references/project-map.md). For task-specific implementation and verification, read [references/workflows.md](references/workflows.md).

## Work principles

- Modify the smallest coherent set of source files and keep existing user work intact.
- Do not invent project facts, addresses, certifications, guarantees, prices, or customer details. Inspect current content or ask for the missing business fact.
- Never expose customer names, unit numbers, phone numbers from job records, or image location metadata.
- Treat uploaded photos and videos as portfolio evidence: choose clear non-duplicate A-cuts, preserve chronological or before/after relationships, optimize for web use, and remove metadata.
- Keep mobile presentation as important as desktop. Verify actual browser behavior after visual changes.
- A successful code edit requires relevant validation; a successful visual edit also requires browser inspection.
- Do not commit, push, tag, or deploy merely because implementation is complete. The deployment gate handles those actions only when the owner requests deployment.

## Deployment routing

- Readiness questions and previews are read-only.
- For explicit production commands such as “올려”, “배포해”, or “운영 반영”, use `$deploy-joeun-site` and follow its GitHub release gate.
- Do not bypass `infra/scripts/release-and-deploy.sh`, upload the repository directly, add S3 deletion, or change DNS/IAM/versioning as part of an ordinary website request.

## Completion report

Report only what the owner needs:

- what changed
- where to check it
- validation result
- whether GitHub or production was changed
- any concrete limitation that remains
