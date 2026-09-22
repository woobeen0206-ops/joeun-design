# 결정 기록

## 2026-09-11 — Codex로 개발 환경 전환

- 공통 지침은 `AGENTS.md`, 설정은 `.codex/config.toml`로 통일한다.
- FE/BE 에이전트는 `.codex/agents/frontend-dev.toml`, `.codex/agents/backend-dev.toml`을 사용한다.
- 설계 문서는 `.codex/docs/`, 향후 스킬은 `.agents/skills/`에 둔다.
- 중복된 이전 도구 설정과 내용이 없는 스킬 파일은 제거한다.
- 모델과 실행 권한은 사용자/앱 설정을 유지한다.
- 기존 Next.js + Spring Boot + PostgreSQL 및 단일 서버 계획은 유지한다. 애플리케이션 구현은 아직 시작하지 않았다.
