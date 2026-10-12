# 홈페이지 배포 모듈

홈페이지 배포는 아래 세 구역을 분리한다.

```text
frontend/public/cases/        편집하는 원본
          │
          ▼  build-static-site.mjs
.deploy/site/                 실제 사용 파일만 모은 배포본
          │
          ▼  deploy-site.sh
S3 joeun-design               파일 저장
          │
          ▼  CloudFront 캐시 갱신
조은디자인인테리어.com          고객에게 보이는 홈페이지
```

## 모듈별 역할

| 모듈 | 역할 | 운영 환경 변경 |
|---|---|---|
| `validate-static-site.mjs` | 필수 파일, 누락된 사진, 금지 파일, HEIC 포함 여부 검사 | 없음 |
| `build-static-site.mjs` | HTML·CSS·JS에서 실제 참조하는 파일만 `.deploy/site/`로 복사하고 해시 목록 생성 | 없음 |
| `deploy-site.sh --dry-run` | 빌드·검사를 거친 뒤 S3에서 바뀔 파일만 미리 표시 | 없음 |
| `release-and-deploy.sh` | 검사 후 GitHub 커밋·푸시·태그를 만들고 AWS 배포를 호출한 뒤 릴리스 작업 기록을 자동 생성 | 있음 |
| `deploy-site.sh` | 배포본만 S3에 올리고 CloudFront 캐시를 갱신한 뒤 공개 파일 검증 | 있음 |
| `올려.command` | 비개발자가 GitHub 릴리스와 실제 배포를 시작하는 실행 파일 | 있음 |

`올려.command`를 실행하면 먼저 변경 예정 파일을 보여준 뒤 `올려`라는 확인 문구를 받아야 GitHub 릴리스와 실제 업로드가 시작된다. 이미 오너 승인을 받은 자동 실행에서는 `release-and-deploy.sh --yes --message "변경사항 요약"`을 사용한다.

릴리스 태그는 서울 날짜를 기준으로 `vYYYYMMDD.0.N` 형식을 사용한다. 같은 날 추가 배포하면 마지막 숫자를 1씩 올린다. AWS 배포가 실패하면 새 태그를 GitHub와 로컬에서 삭제하고, 원인 수정에 필요한 커밋은 유지한다.

운영 배포가 성공하면 `docs/work-log/`에 날짜·릴리스 태그·기준 커밋·변경 파일·검사 결과를 담은 기록을 자동 생성하고 GitHub에 추가 커밋으로 푸시한다. 배포가 실패한 경우에는 성공 기록을 만들지 않는다.

## 포함·제외 기준

배포본에는 `index.html`, 무료 견적 페이지, 필요한 CSS·JavaScript와 그 안에서 참조하는 사진·영상·음악만 들어간다.

다음 항목은 항상 제외한다.

- 소스 코드와 개발 설정
- `design-preview/`의 과거 시안
- 원본 사진 및 HEIC 파일
- `output/`, `tmp/`, 문서, 배포 기록
- HTML에서 사용하지 않는 사진·영상·음악

배포 파일 목록과 파일별 SHA-256 값은 `.deploy/deploy-manifest.json`에서 확인한다. 이 목록은 “이번 배포에 무엇이 들어가는지”를 확인하는 기준이다.

## 안전 원칙

- 실제 배포는 프로젝트 오너가 명시적으로 요청한 뒤 실행한다.
- 자동 배포는 기존 S3 객체를 삭제하지 않는다.
- 비밀번호와 AWS 비밀키는 `infra/deploy.env`에 저장하지 않는다.
- 배포 중 검사가 하나라도 실패하면 S3 업로드 전에 중단한다.
- S3 버전 관리와 옛 파일 정리는 비용 및 복구 정책을 정한 뒤 별도로 적용한다.
