#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG_FILE="$ROOT_DIR/infra/deploy.env"
AUTO_APPROVE="false"
COMMIT_MESSAGE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes)
      AUTO_APPROVE="true"
      shift
      ;;
    --message)
      if [[ -z "${2:-}" ]]; then
        echo "--message 뒤에 커밋 요약이 필요합니다."
        exit 2
      fi
      COMMIT_MESSAGE="$2"
      shift 2
      ;;
    *)
      echo "사용법: $0 [--yes] [--message \"변경사항 요약\"]"
      exit 2
      ;;
  esac
done

if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "배포 설정 파일이 없습니다: $CONFIG_FILE"
  exit 1
fi

# shellcheck disable=SC1090
source "$CONFIG_FILE"

for REQUIRED_VAR in GIT_REMOTE GIT_BRANCH GIT_AUTHOR_NAME GIT_AUTHOR_EMAIL; do
  if [[ -z "${!REQUIRED_VAR:-}" ]]; then
    echo "GitHub 릴리스 설정값이 비어 있습니다: $REQUIRED_VAR"
    exit 1
  fi
done

cd "$ROOT_DIR"

if [[ "$(git rev-parse --show-toplevel)" != "$ROOT_DIR" ]]; then
  echo "프로젝트 루트 Git 저장소에서만 릴리스할 수 있습니다."
  exit 1
fi
if [[ -d "$ROOT_DIR/frontend/.git" || -f "$ROOT_DIR/frontend/.git" ]]; then
  echo "frontend에 중첩 Git 저장소가 남아 있습니다. 릴리스 전에 저장소 구조를 표준화해야 합니다."
  exit 1
fi
if [[ "$(git branch --show-current)" != "$GIT_BRANCH" ]]; then
  echo "운영 릴리스는 $GIT_BRANCH 브랜치에서만 가능합니다."
  exit 1
fi

echo ""
echo "[게이트 1/5] 배포 검사와 AWS 변경 예정 목록 확인"
"$SCRIPT_DIR/deploy-site.sh" --dry-run

if [[ "$AUTO_APPROVE" != "true" ]]; then
  echo ""
  echo "GitHub 커밋·푸시·릴리스 태그 생성 후 운영 배포합니다. 계속하려면 '올려'를 입력하세요."
  read -r CONFIRMATION
  if [[ "$CONFIRMATION" != "올려" ]]; then
    echo "릴리스와 배포를 취소했습니다. GitHub와 AWS는 변경되지 않았습니다."
    exit 0
  fi
fi

echo ""
echo "[게이트 2/5] GitHub 기준 브랜치 확인"
git fetch "$GIT_REMOTE" "$GIT_BRANCH" --tags
if ! git merge-base --is-ancestor "$GIT_REMOTE/$GIT_BRANCH" HEAD; then
  echo "GitHub의 $GIT_BRANCH 브랜치가 현재 로컬 이력보다 앞서 있거나 갈라졌습니다. 자동 병합 없이 중단합니다."
  exit 1
fi

echo ""
echo "[게이트 3/5] 변경사항 커밋과 푸시"
git add -A

STAGED_NAMES="$(git -c core.quotePath=false diff --cached --name-only --diff-filter=ACMR)"
if printf '%s\n' "$STAGED_NAMES" | grep -E '(^|/)\.env($|\.)|\.(pem|key|p12|pfx)$' >/dev/null; then
  echo "비밀값일 수 있는 파일이 커밋 대상에 포함되어 중단합니다."
  printf '%s\n' "$STAGED_NAMES" | grep -E '(^|/)\.env($|\.)|\.(pem|key|p12|pfx)$' || true
  exit 1
fi

while IFS= read -r FILE_PATH; do
  [[ -z "$FILE_PATH" ]] && continue
  FILE_BYTES="$(git cat-file -s ":$FILE_PATH")"
  if (( FILE_BYTES > 95000000 )); then
    echo "GitHub 제한에 가까운 대용량 파일이 포함되어 중단합니다: $FILE_PATH"
    exit 1
  fi
done <<< "$STAGED_NAMES"

if ! git diff --cached --quiet; then
  if [[ -z "$COMMIT_MESSAGE" ]]; then
    PARTS=()
    if printf '%s\n' "$STAGED_NAMES" | grep -q '^frontend/public/cases/'; then
      PARTS+=("홈페이지 콘텐츠")
    fi
    if printf '%s\n' "$STAGED_NAMES" | grep -Eq '^(infra/|\.agents/|올려\.command$)'; then
      PARTS+=("배포 자동화")
    fi
    if printf '%s\n' "$STAGED_NAMES" | grep -Eq '^(README\.md|AGENTS\.md|\.codex/)'; then
      PARTS+=("프로젝트 문서")
    fi
    if [[ ${#PARTS[@]} -eq 0 ]]; then
      COMMIT_MESSAGE="release: 홈페이지 변경사항 반영"
    else
      SUMMARY="$(IFS=', '; echo "${PARTS[*]}")"
      COMMIT_MESSAGE="release: ${SUMMARY} 업데이트"
    fi
  fi
  GIT_AUTHOR_NAME="$GIT_AUTHOR_NAME" GIT_AUTHOR_EMAIL="$GIT_AUTHOR_EMAIL" \
  GIT_COMMITTER_NAME="$GIT_AUTHOR_NAME" GIT_COMMITTER_EMAIL="$GIT_AUTHOR_EMAIL" \
    git commit -m "$COMMIT_MESSAGE"
else
  echo "새로 커밋할 변경사항이 없어 현재 HEAD를 릴리스 기준으로 사용합니다."
fi

git push "$GIT_REMOTE" "HEAD:$GIT_BRANCH"
RELEASE_COMMIT="$(git rev-parse HEAD)"

echo ""
echo "[게이트 4/5] 릴리스 태그 생성과 푸시"
RELEASE_DATE="$(TZ=Asia/Seoul date +%Y%m%d)"
LATEST_PATCH="$(git tag --list "v${RELEASE_DATE}.0.*" \
  | sed -E "s/^v${RELEASE_DATE}\.0\.([0-9]+)$/\1/" \
  | sort -n \
  | tail -1)"
if [[ -z "$LATEST_PATCH" ]]; then
  NEXT_PATCH=1
else
  NEXT_PATCH=$((LATEST_PATCH + 1))
fi
RELEASE_TAG="v${RELEASE_DATE}.0.${NEXT_PATCH}"

TAG_CREATED_LOCAL="false"
TAG_PUSHED="false"
DEPLOY_SUCCEEDED="false"

cleanup_failed_release() {
  STATUS=$?
  trap - EXIT
  if [[ "$DEPLOY_SUCCEEDED" != "true" && "$TAG_CREATED_LOCAL" == "true" ]]; then
    echo ""
    echo "배포 실패: 릴리스 태그 $RELEASE_TAG 롤백"
    set +e
    if [[ "$TAG_PUSHED" == "true" ]]; then
      git push "$GIT_REMOTE" ":refs/tags/$RELEASE_TAG"
      REMOTE_DELETE_STATUS=$?
    else
      REMOTE_DELETE_STATUS=0
    fi
    git tag -d "$RELEASE_TAG"
    LOCAL_DELETE_STATUS=$?
    set -e
    if (( REMOTE_DELETE_STATUS != 0 || LOCAL_DELETE_STATUS != 0 )); then
      echo "태그 자동 롤백 일부가 실패했습니다. GitHub에서 $RELEASE_TAG 상태를 확인해야 합니다."
    fi
  fi
  exit "$STATUS"
}
trap cleanup_failed_release EXIT

git tag -a "$RELEASE_TAG" "$RELEASE_COMMIT" -m "$RELEASE_TAG - $COMMIT_MESSAGE"
TAG_CREATED_LOCAL="true"
git push "$GIT_REMOTE" "$RELEASE_TAG"
TAG_PUSHED="true"

echo ""
echo "[게이트 5/5] $RELEASE_TAG 기준 운영 배포"
RELEASE_TAG="$RELEASE_TAG" RELEASE_COMMIT="$RELEASE_COMMIT" \
  "$SCRIPT_DIR/deploy-site.sh" --yes
DEPLOY_SUCCEEDED="true"
trap - EXIT

echo ""
echo "[기록] 릴리스 작업 기록 생성"
WORK_LOG_PATH="$ROOT_DIR/docs/work-log/${RELEASE_DATE}-release-${RELEASE_TAG}.md"
{
  echo "# 홈페이지 릴리스 작업 기록"
  echo
  echo "- 배포일: ${RELEASE_DATE:0:4}-${RELEASE_DATE:4:2}-${RELEASE_DATE:6:2} (서울 기준)"
  echo "- 릴리스: \`$RELEASE_TAG\`"
  echo "- 기준 커밋: \`$RELEASE_COMMIT\`"
  echo "- 작업 요약: $COMMIT_MESSAGE"
  echo "- 운영 배포: 완료"
  echo
  echo "## 확인 결과"
  echo
  echo "- 원본 검사, 배포 산출물 생성, 빌드·린트 검사를 통과했습니다."
  echo "- S3 업로드와 CloudFront 캐시 갱신을 완료했습니다."
  echo "- 공개 주소의 배포 파일 확인을 완료했습니다."
  echo
  echo "## 이번 릴리스의 변경 파일"
  echo
  git diff-tree --no-commit-id --name-only -r "$RELEASE_COMMIT" | sed 's/^/- `/; s/$/`/'
  echo
  echo "이 기록은 운영 배포가 성공한 뒤 배포 스크립트가 자동으로 생성했습니다."
} > "$WORK_LOG_PATH"

GIT_AUTHOR_NAME="$GIT_AUTHOR_NAME" GIT_AUTHOR_EMAIL="$GIT_AUTHOR_EMAIL" \
GIT_COMMITTER_NAME="$GIT_AUTHOR_NAME" GIT_COMMITTER_EMAIL="$GIT_AUTHOR_EMAIL" \
  git add "$WORK_LOG_PATH" && \
GIT_AUTHOR_NAME="$GIT_AUTHOR_NAME" GIT_AUTHOR_EMAIL="$GIT_AUTHOR_EMAIL" \
GIT_COMMITTER_NAME="$GIT_AUTHOR_NAME" GIT_COMMITTER_EMAIL="$GIT_AUTHOR_EMAIL" \
  git commit -m "docs: $RELEASE_TAG 작업 기록 추가"
git push "$GIT_REMOTE" "HEAD:$GIT_BRANCH"

echo ""
echo "릴리스 및 배포 완료"
echo "태그: $RELEASE_TAG"
echo "커밋: $RELEASE_COMMIT"
echo "작업 기록: $WORK_LOG_PATH"
