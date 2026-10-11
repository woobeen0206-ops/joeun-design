---
name: deploy-joeun-site
description: Validate, preview, and deploy the 좋은디자인 static portfolio site to its existing AWS S3 and CloudFront production environment. Use for requests such as "올려", "홈페이지 배포해", "운영 반영", "배포 미리보기", or checking whether the current site is ready to deploy. Do not use for unrelated AWS infrastructure or DNS changes.
---

# 좋은디자인 홈페이지 배포

Work from the `joeun-design` repository root and read its `AGENTS.md` before acting. The production website remains a static site even though `frontend` contains a Next.js/Vinext wrapper.

## Fixed boundaries

- Editable source: `frontend/public/cases/`
- Generated deployment artifact: `.deploy/site/`
- Deployment configuration: `infra/deploy.env`
- Release gate: `infra/scripts/release-and-deploy.sh`
- AWS deployment implementation: `infra/scripts/deploy-site.sh`
- Legacy `design-preview/`, repository source, HEIC originals, `output/`, and `tmp/` must never be uploaded.
- Never upload `frontend/` or the repository root directly.
- Never add `--delete` to S3 synchronization. Old object cleanup is a separate destructive task requiring explicit owner approval.

Use the existing release gate instead of recreating Git or AWS commands. The gate validates and previews first, commits and pushes the current root repository, creates and pushes the next release tag, then invokes the AWS deployment. The AWS script gathers only reachable website files, uploads `.deploy/site/`, invalidates CloudFront, verifies the public index hash, and writes a deployment record.

Release tags use Seoul local date and the form `vYYYYMMDD.0.N`. Start each date at `.0.1`; increment the final number for every later release on that date. A tag represents a successful production deployment. If deployment fails after tag creation, the gate must delete that tag locally and from GitHub while retaining the pushed commit for repair.

## Interpret the request

- Readiness questions such as “배포 가능해?” are read-only. Run local checks or `--dry-run` when useful, then report; do not deploy.
- Preview requests such as “배포 미리보기” run `./infra/scripts/deploy-site.sh --dry-run`. This may read AWS state but must not mutate S3 or CloudFront.
- Direct commands such as “올려”, “배포해”, or “운영 반영해” are explicit authorization for the GitHub release and production deployment. Summarize the actual staged changes in Korean and run `./infra/scripts/release-and-deploy.sh --yes --message "요약"` in that turn.
- A prior preview or readiness question is not deployment authorization.
- DNS edits, S3 deletion, versioning changes, IAM creation, and other infrastructure mutations need a separate explicit request.

## Execution and reporting

Set `AWS_BIN=/opt/homebrew/bin/aws` when the executable is available there. Use the bundled Node path only when ordinary `node` is unavailable. Request sandbox escalation for GitHub and AWS network access when required.

Stop immediately if validation, build, lint errors, AWS identity, upload, invalidation, or public hash verification fails. Do not bypass failed checks or retry mutations blindly. Warnings that do not fail the script may be reported after completion.

After a successful deployment, report:

- GitHub commit hash and release tag
- S3 upload result
- CloudFront invalidation result and ID
- public URL verification result
- deployment history file path
- any domain that remains unconnected

The current custom domain behavior is asymmetric: `www.조은디자인인테리어.com` resolves to CloudFront, while the bare domain may lack DNS. Verify the `www` URL after deployment; report a bare-domain DNS failure without changing DNS automatically.

Warn that the current AWS session uses a root identity when detected, but do not block an otherwise authorized deployment solely for that reason. Recommend a limited deployment IAM identity as a later security improvement.
