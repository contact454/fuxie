# Phase 43: Speaking / Audio Smoke And Fallback Slice

Date: 2026-05-13

## Role-Gate Compliance

Vai chinh: Speech / Audio Engineer
Vai phoi hop: AI / LLM Engineer, QA Automation Engineer

The Speech / Audio Engineer, AI / LLM Engineer, and QA Automation Engineer profiles were read before this cycle.

## Objective

Verify speaking/audio readiness, browser/provider blockers, and fallback requirements without overclaiming pronunciation precision.

## Evidence Collected

| Area | Result | Evidence |
| --- | --- | --- |
| AI service unit tests | Pass | `pnpm --filter @fuxie/ai-service test`: 12 files and 36 tests passed |
| Offline AI eval speaking case | Pass | `pnpm eval:ai`: speaking surface 1/1 passed |
| Provider-backed eval | Blocked | Missing `GEMINI_API_KEY` or `GOOGLE_AI_API_KEY` |
| Service readiness | Blocked | `pnpm env:audit:services` warns DB and Redis are unreachable |
| Docker services | Blocked | Docker Desktop daemon is not running |
| Full local smoke | Blocked/fail by prerequisites | AI health network error; DB health disconnected; speaking page rendered but DB-backed APIs failed |

## Smoke Interpretation

The current evidence supports code-level and offline eval readiness for speaking-related logic, but it does not clear browser/provider speaking readiness.

The smoke result must be treated as blocked by environment prerequisites because:

- AI service was not reachable at smoke time.
- DB was disconnected at `127.0.0.1:5434`.
- Redis was disconnected at `localhost:6380`.
- Docker daemon was unavailable, so local services could not be started.

## Fallback Rules

Speaking/audio remains beta-conditional until these cases pass:

- Browser microphone permission denied routes learner to text/self-check or non-AI study action.
- Provider missing key routes learner to non-AI speaking practice or vocabulary/lesson action.
- Low-confidence transcript avoids precise pronunciation claims.
- Audio is not retained or logged in analytics.
- Feedback remains confidence-building and practice-only.

## Acceptance Status

Accepted:

- AI service unit tests.
- Offline speaking eval fixture.
- Fallback requirements.

Blocked:

- Provider-backed speaking quality.
- Browser permission smoke.
- Full web-to-AI speaking flow smoke.

## Next Action

Start DB/Redis and AI service locally, then rerun `pnpm smoke:full-local` and a browser-level speaking permission smoke.
