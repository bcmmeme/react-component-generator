# server/ AGENTS.md

## Module Context

Bun으로 실행되는 AI API 프록시. 프론트엔드는 Vite 프록시를 통해 `/api/config`, `/api/generate`만 호출한다. 루트 규칙은 `../AGENTS.md`.

## Tech Stack and Constraints

- 런타임은 Bun. HTTP는 `Bun.serve`, 외부 호출은 전역 `fetch` 사용. axios 등 HTTP 라이브러리와 Express 같은 서버 프레임워크를 추가하지 않는다.
- 환경변수는 `process.env`에서 모듈 로드 시점에 한 번 읽는다 (`index.ts:59-62`). 키를 바꾼 뒤에는 서버 재시작이 필요하다.
- 이 폴더는 `bun run build`의 타입체크 대상이 아니다. 수정 후 타입은 직접 점검하고 `bun run lint`, `bun run test`로 확인한다.

## Implementation Patterns

- 라우팅은 `Bun.serve`의 `fetch` 핸들러 안에서 `req.method`/`url.pathname`으로 분기한다 (`index.ts:140-218`). 모든 응답에 `CORS_HEADERS`를 붙인다. 새 엔드포인트도 응답마다 `{ headers: CORS_HEADERS }`를 빠뜨리지 말 것.
- 키 우선순위는 클라이언트가 보낸 키, 없으면 환경변수 키 (`resolveApiKey`, `index.ts:64-66`).
- 모델 폴백은 `withModelFallback(models, attempt)`로 구현한다 (`fallback.ts`). 모델 우선순위 배열은 `index.ts:5`의 `GOOGLE_MODELS`. 첫 성공을 반환하고 모두 실패하면 마지막 에러를 던진다.
- 응답 정규화는 `stripCodeFences` -> `ensureRenderCall` 순서 (`index.ts:188`).

## Testing Strategy

- 실행: `bun run test server/generator.test.ts server/fallback.test.ts`
- 테스트는 `generator.ts`, `fallback.ts`의 순수 함수에만 있다. `vi.fn`으로 `attempt`를 주입하는 방식 (`fallback.test.ts`).
- `index.ts`는 import 시 서버가 뜨므로 테스트에서 import하지 않는다. 테스트하려면 로직을 순수 함수로 분리해 `generator.ts`/`fallback.ts`로 옮긴다.

## Local Golden Rules

- Do: 시스템 프롬프트(`index.ts:7-49`)를 바꾸면 `generator.ts`의 후처리와 호환되는지 확인한다. 프롬프트는 "render 호출 포함, 코드펜스 없음, import 없음, TypeScript 문법 없음"을 요구하고 `generator.ts`는 이를 보정하는 이중 방어다.
- Do: 에러 메시지에 `${response.status}`를 유지한다. `index.ts:194,201`이 문자열 매칭으로 503/429를 구분한다.
- Don't: Google 호출 URL(`index.ts:99`)을 로그나 에러에 출력하지 않는다. 키가 쿼리스트링에 있다.
- Don't: `/api/config` 응답에 키 값을 넣지 않는다. boolean만 반환한다 (`index.ts:150-153`).
- Don't: Anthropic과 Google 경로가 동일하게 동작한다고 가정하지 않는다. 폴백과 절단 감지는 Google에만 있다 (`index.ts:123-125,134-136`).
- Don't: 포트(`index.ts:139`)를 바꾸면서 `../vite.config.ts:11`을 그대로 두지 않는다.
