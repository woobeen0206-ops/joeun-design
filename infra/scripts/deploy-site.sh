#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
SOURCE_DIR="$ROOT_DIR/frontend/public/cases"
DEPLOY_DIR="$ROOT_DIR/.deploy/site"
FRONTEND_DIR="$ROOT_DIR/frontend"
CONFIG_FILE="$ROOT_DIR/infra/deploy.env"
MODE="deploy"
AUTO_APPROVE="false"

if [[ "${1:-}" == "--dry-run" ]]; then
  MODE="dry-run"
elif [[ "${1:-}" == "--yes" ]]; then
  AUTO_APPROVE="true"
elif [[ -n "${1:-}" ]]; then
  echo "사용법: $0 [--dry-run|--yes]"
  exit 2
fi

if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "배포 설정 파일이 없습니다: $CONFIG_FILE"
  exit 1
fi

# shellcheck disable=SC1090
source "$CONFIG_FILE"

for REQUIRED_VAR in AWS_PROFILE AWS_REGION S3_BUCKET CLOUDFRONT_DISTRIBUTION_ID CLOUDFRONT_URL; do
  if [[ -z "${!REQUIRED_VAR:-}" ]]; then
    echo "배포 설정값이 비어 있습니다: $REQUIRED_VAR"
    exit 1
  fi
done

AWS_BIN="${AWS_BIN:-$(command -v aws || true)}"
NODE_BIN="${NODE_BIN:-$(command -v node || true)}"
if [[ -z "$NODE_BIN" && -x "/Users/jungwoobin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" ]]; then
  NODE_BIN="/Users/jungwoobin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
fi

if [[ -z "$AWS_BIN" ]]; then
  echo "AWS CLI를 찾을 수 없습니다."
  exit 1
fi
if [[ -z "$NODE_BIN" ]]; then
  echo "Node.js를 찾을 수 없습니다."
  exit 1
fi

export AWS_PROFILE AWS_REGION AWS_PAGER="" AWS_CLI_AUTO_PROMPT=off

echo ""
echo "[1/6] 원본 검사와 배포 전용 산출물 생성"
"$NODE_BIN" "$SCRIPT_DIR/validate-static-site.mjs" "$SOURCE_DIR"
"$NODE_BIN" "$SCRIPT_DIR/build-static-site.mjs"
"$NODE_BIN" "$SCRIPT_DIR/validate-static-site.mjs" "$DEPLOY_DIR"

echo ""
echo "[2/6] 프로젝트 빌드와 코드 검사"
(
  cd "$FRONTEND_DIR"
  "$NODE_BIN" scripts/run-framework.mjs build
  "$NODE_BIN" node_modules/eslint/bin/eslint.js . --ignore-pattern dist --ignore-pattern .next
)

echo ""
echo "[3/6] AWS 연결 확인"
IDENTITY_JSON="$("$AWS_BIN" sts get-caller-identity --output json --no-cli-pager)"
ACCOUNT_ID="$(printf '%s' "$IDENTITY_JSON" | "$NODE_BIN" -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).Account))')"
IDENTITY_ARN="$(printf '%s' "$IDENTITY_JSON" | "$NODE_BIN" -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).Arn))')"
echo "AWS 계정 확인: $ACCOUNT_ID"
if [[ "$IDENTITY_ARN" == *":root" ]]; then
  echo "주의: 현재 루트 계정으로 인증되어 있습니다. 배포 전용 IAM 권한으로 교체하는 것을 권장합니다."
fi

SYNC_COMMON=(--region "$AWS_REGION" --only-show-errors)

echo ""
echo "[4/6] 배포 산출물 범위 확인"
echo "업로드 경계: $DEPLOY_DIR"
echo "설계·원본·개발 파일은 이 폴더에 들어오지 않습니다."

echo ""
echo "[5/6] S3 변경 예정 목록 확인"
"$AWS_BIN" s3 sync "$DEPLOY_DIR/projects-assets/" "s3://$S3_BUCKET/projects-assets/" \
  "${SYNC_COMMON[@]}" \
  --dryrun \
  --cache-control "public,max-age=86400"
"$AWS_BIN" s3 sync "$DEPLOY_DIR/" "s3://$S3_BUCKET/" \
  "${SYNC_COMMON[@]}" \
  --dryrun \
  --exclude "projects-assets/*" \
  --cache-control "no-cache,max-age=0,must-revalidate"

if [[ "$MODE" == "dry-run" ]]; then
  echo ""
  echo "미리보기 완료: S3나 CloudFront에는 아무것도 변경하지 않았습니다."
  exit 0
fi

if [[ "$AUTO_APPROVE" != "true" ]]; then
  echo ""
  echo "위 변경 내용을 운영 홈페이지에 반영합니다. 계속하려면 '올려'를 입력하세요."
  read -r CONFIRMATION
  if [[ "$CONFIRMATION" != "올려" ]]; then
    echo "배포를 취소했습니다. S3와 CloudFront는 변경되지 않았습니다."
    exit 0
  fi
fi

echo ""
echo "S3에 배포본 업로드"
"$AWS_BIN" s3 sync "$DEPLOY_DIR/projects-assets/" "s3://$S3_BUCKET/projects-assets/" \
  "${SYNC_COMMON[@]}" \
  --cache-control "public,max-age=86400"
"$AWS_BIN" s3 sync "$DEPLOY_DIR/" "s3://$S3_BUCKET/" \
  "${SYNC_COMMON[@]}" \
  --exclude "projects-assets/*" \
  --cache-control "no-cache,max-age=0,must-revalidate"

echo ""
echo "[6/6] CloudFront 캐시 갱신과 공개 주소 확인"
INVALIDATION_ID="$("$AWS_BIN" cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text \
  --no-cli-pager)"
echo "캐시 무효화 생성: $INVALIDATION_ID"
"$AWS_BIN" cloudfront wait invalidation-completed \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --id "$INVALIDATION_ID"

REMOTE_FILE="$(mktemp)"
trap 'rm -f "$REMOTE_FILE"' EXIT
curl --fail --silent --show-error --location "$CLOUDFRONT_URL/" --output "$REMOTE_FILE"
LOCAL_HASH="$(shasum -a 256 "$DEPLOY_DIR/index.html" | awk '{print $1}')"
REMOTE_HASH="$(shasum -a 256 "$REMOTE_FILE" | awk '{print $1}')"
if [[ "$LOCAL_HASH" != "$REMOTE_HASH" ]]; then
  echo "공개 주소의 index.html이 로컬 파일과 다릅니다. 캐시 상태를 다시 확인해 주세요."
  exit 1
fi

HISTORY_DIR="$ROOT_DIR/output/deploy-history"
mkdir -p "$HISTORY_DIR"
DEPLOYED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
HISTORY_FILE="$HISTORY_DIR/${DEPLOYED_AT//:/-}.json"
cat > "$HISTORY_FILE" <<EOF
{
  "deployedAt": "$DEPLOYED_AT",
  "accountId": "$ACCOUNT_ID",
  "region": "$AWS_REGION",
  "bucket": "$S3_BUCKET",
  "distributionId": "$CLOUDFRONT_DISTRIBUTION_ID",
  "invalidationId": "$INVALIDATION_ID",
  "releaseTag": "${RELEASE_TAG:-}",
  "releaseCommit": "${RELEASE_COMMIT:-}",
  "indexSha256": "$LOCAL_HASH",
  "url": "$CLOUDFRONT_URL/"
}
EOF

echo ""
echo "업로드 완료: $CLOUDFRONT_URL/"
echo "배포 기록: $HISTORY_FILE"
