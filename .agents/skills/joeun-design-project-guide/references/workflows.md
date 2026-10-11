# Workflows

Read only the section relevant to the request.

## Portfolio case or copy change

1. Inspect the project data and rendering code in `frontend/public/cases/index.html`.
2. Preserve the existing case numbering, requested ordering, filters, before/after pairs, captions, and media paths.
3. Avoid claims that the supplied evidence does not support.
4. Validate references, then inspect desktop and mobile behavior in the browser.

## New photos or video

1. Inspect all supplied media before selecting files.
2. Group files by site, room, stage, and continuity; do not mix unrelated spaces.
3. Select representative A-cuts without near-duplicates. Favor images that show layout, finish quality, and clear before/after impact.
4. Convert unsupported formats such as HEIC. Resize and compress for the web, remove EXIF/GPS metadata, and use stable descriptive filenames.
5. Put final web media under the relevant folder in `frontend/public/cases/projects-assets/` and reference only selected files from the page.
6. For video, create a representative poster, provide controls, avoid forced sound, and verify mobile playback and loading behavior.

## Estimate flow

1. Work in `joeun-design-estimate.html`, `estimate-wizard.css`, and `estimate-wizard.js` unless the owner explicitly asks for the future Next application.
2. Keep questions short for nontechnical customers and preserve range-calendar behavior for construction start/end dates.
3. Do not imply form submissions are delivered unless a real backend or external form service is connected and tested.
4. Verify keyboard, mobile, validation, and navigation behavior.

## Routine validation

Run checks proportional to the change:

```bash
node infra/scripts/validate-static-site.mjs frontend/public/cases
node infra/scripts/build-static-site.mjs
node infra/scripts/validate-static-site.mjs .deploy/site
cd frontend && npm run build
cd frontend && npm run lint
```

Use the bundled Node executable when ordinary `node` is unavailable. A lint warning may be reported; a lint or build error must be fixed before completion.

After a visual change, open the local site and inspect the affected section at desktop and mobile sizes. Check the browser console for missing assets or runtime errors.

## Git and deployment

- Ordinary implementation stays uncommitted unless the owner asks for Git work or production deployment.
- “배포 가능해?” means inspect or preview only.
- “배포 미리보기” runs `infra/scripts/deploy-site.sh --dry-run`.
- “올려/배포해/운영 반영” invokes `$deploy-joeun-site`, which commits, pushes, creates the next release tag, deploys, and removes the new tag if deployment fails.
- Never call AWS upload commands directly for routine production deployment.
