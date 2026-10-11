# 조은 디자인 홈페이지

현재 운영 홈페이지는 `원본 → 배포 산출물 → AWS`의 세 경계로 나눕니다.

## 최종 원본

- 홈페이지: `frontend/public/cases/index.html`
- 무료 견적: `frontend/public/cases/joeun-design-estimate.html`
- 사진·음악: `frontend/public/cases/projects-assets/`
- `design-preview/`는 과거 시안과 검토용 보관 폴더이며 운영 배포에 사용하지 않습니다.

## 배포 경계

| 구역 | 역할 | S3 업로드 |
|---|---|---|
| `frontend/public/cases/` | 편집하는 홈페이지 원본 | 직접 업로드하지 않음 |
| `.deploy/site/` | 원본에서 실제 사용 중인 파일만 모은 배포 산출물 | 이 폴더만 업로드 |
| `design-preview/`, `output/`, `tmp/` | 과거 시안·TV 자료·임시 파일 | 업로드 금지 |

`.deploy/site/`는 자동으로 다시 만들어지는 폴더입니다. HTML에서 실제 참조하는 사진·음악·CSS·자바스크립트만 들어가며, 파일별 SHA-256 목록은 `.deploy/deploy-manifest.json`에 기록됩니다.

## 확인과 업로드

- 로컬 확인: `frontend`에서 개발 서버를 실행합니다.
- 변경 사항만 확인: `infra/scripts/deploy-site.sh --dry-run`
- 실제 운영 릴리스와 업로드: 프로젝트 최상단의 `올려.command`

`올려.command`는 변경 예정 목록을 먼저 보여주고, 마지막으로 `올려`를 입력해야 GitHub 릴리스와 운영 반영을 시작합니다.

실제 업로드는 다음 순서로 자동 진행됩니다.

1. 원본에서 실제 사용 파일만 `.deploy/site/`로 수집
2. 누락된 사진과 잘못된 경로 검사
3. 프로젝트 빌드와 코드 검사
4. AWS 로그인 상태와 S3 변경 예정 목록 확인
5. 변경사항을 GitHub `main`에 커밋·푸시
6. `vYYYYMMDD.0.N` 형식의 신규 릴리스 태그 생성·푸시
7. `.deploy/site/`의 변경 파일만 S3에 업로드
8. CloudFront 전체 캐시 무효화
9. 공개 주소의 파일이 배포 산출물과 같은지 확인

실제 배포가 실패하면 이번 실행에서 만든 릴리스 태그는 GitHub와 로컬에서 자동 삭제합니다. 커밋은 수정과 재시도를 위해 유지합니다.

자동 업로드는 기존 S3 파일을 삭제하지 않습니다. 사용하지 않는 옛 파일을 정리해야 할 때는 별도 검토 후 진행합니다.

## 새 대화에서 작업하기

프로젝트를 새 대화에서 열어도 `.agents/skills/joeun-design-project-guide/`가 현재 구조와 작업 원칙을 안내합니다. 홈페이지 수정은 이 가이드를 진입점으로 사용하고, 실제 배포 요청은 `deploy-joeun-site` 스킬과 GitHub 릴리스 게이트로 이어집니다.
