# AGENTS.md

## Operational Commands

패키지 매니저와 런타임은 bun 고정. npm/yarn/pnpm 사용 금지 (`bun.lock`, `package.json` scripts, `server/index.ts`의 `Bun.serve`).

```bash
bun install
bun run dev          # API(3002) + Vite(5173) 동시 실행
bun run server       # API 서버만 (bun --watch)
bun run test         # vitest run (src/ + server/)
bun run test:watch
bun run lint
bun run build        # tsc -b && vite build
```

- 단일 테스트: `bun run test server/fallback.test.ts`
- 변경 후 최소 검증: `bun run test && bun run lint`. 프론트엔드를 건드렸다면 `bun run build`도 실행.
- `bun run build`의 `tsc -b`는 `src/`와 `vite.config.ts`만 타입체크한다 (`tsconfig.app.json` include, `tsconfig.node.json` include). `server/`는 타입체크되지 않으므로 `server/` 수정 시 타입 오류를 build가 잡아주지 않는다. lint와 test로 확인하고 타입을 직접 점검할 것.

## Golden Rules

### Immutable

- 서버 환경변수 키 값은 클라이언트로 내보내지 않는다. `/api/config`는 키 존재 여부(boolean)만 반환한다 (`server/index.ts:147-157`). 응답, 로그, 에러 메시지에 키 값이나 키가 포함된 URL을 넣지 말 것.
- Gemini 호출은 API 키를 URL 쿼리스트링에 싣는다 (`server/index.ts:99`). 이 URL을 에러 메시지나 로그에 출력하지 말 것. 현재 에러는 상태 코드만 담는다 (`server/index.ts:112`).
- `.env`는 읽거나 커밋하지 않는다 (`.gitignore`). 변수 이름이 필요하면 `.env.example`을 읽는다.
- 키·토큰 등 인증정보를 코드, 테스트, 커밋 메시지에 하드코딩하지 않는다. 테스트 값은 더미를 쓴다.

### Do and Don't

- Do: 새 로직은 부수효과 없는 순수 함수로 `server/generator.ts` 또는 `server/fallback.ts`에 둔다. `server/index.ts`는 import하는 순간 `Bun.serve`가 실행되어 단위 테스트가 불가능하다 (`server/generator.ts:1-2`, `server/index.ts:138`). 현재 테스트가 있는 곳은 `server/generator.ts`, `server/fallback.ts`, `src/components/PromptInput.tsx`뿐이다. `server/index.ts`의 호출·라우팅·에러 매핑, `useComponentGenerator`, `App`, `ComponentCard`, `LivePreview`에는 테스트가 없다.
- Do: 순수 함수를 추가·수정하면 같은 이름의 `*.test.ts`에 테스트를 함께 추가한다 (한국어 `it` 설명, 기존 파일 스타일).
- Don't: AI 응답 후처리를 `server/index.ts` 안에 인라인으로 늘리지 않는다.
- Don't: 사용자 요청 없이 push 하지 않는다.

### 팀 고유 규칙 (코드 근거)

- **포트 3002는 두 곳에 있다.** `server/index.ts:139`와 `vite.config.ts:11`(프록시 target). 한쪽만 바꾸면 프론트엔드의 `/api/*` 요청이 전부 실패한다.
- **react-live `noInline`은 `render(...)` 호출을 요구한다.** `src/components/LivePreview.tsx:14`. 이를 지키기 위해 시스템 프롬프트가 render 호출·import 금지·TypeScript 문법 금지를 요구하고 (`server/index.ts:11-12,20`), 서버가 후처리로 한 번 더 보정한다 (`server/index.ts:188`, `server/generator.ts:4-24`). 이중 방어이므로 한쪽을 제거하지 말 것. `noInline`이나 프롬프트 규칙을 바꾸면 `ensureRenderCall`과 그 테스트도 함께 검토한다.
- **프로바이더 처리가 비대칭이다.** Google만 모델 폴백(`server/index.ts:5,134-136`)과 `MAX_TOKENS` 절단 감지(`server/index.ts:123-125`)를 가진다. `callAnthropic`(`server/index.ts:68-96`)에는 둘 다 없다. 두 경로가 같다고 가정하지 말고, 한쪽 동작을 고치면 다른 쪽도 필요한지 판단해 보고할 것.
- **에러 응답은 메시지 문자열 매칭에 의존한다.** `message.includes('503')`, `includes('429')` (`server/index.ts:194,201`)는 `Claude API error: ${status}` / `Gemini API error: ${status}` 형식(`server/index.ts:85,112`)에 묶여 있다. 에러 메시지에서 상태 코드를 빼면 503/429 안내가 500으로 바뀐다.
- **TypeScript 제약.** `erasableSyntaxOnly`와 `verbatimModuleSyntax`가 켜져 있다 (`tsconfig.app.json`). enum, namespace, parameter property 사용 금지, 타입 import는 `import type`으로 쓴다 (`src/hooks/useComponentGenerator.ts:2`).
- **`hiring-lab/`은 앱과 무관한 실습 자료다.** 앱 코드에서 참조하지 않고 `hiring-lab/results/`는 gitignore 대상이다 (`.gitignore`). 앱 작업 중 건드리지 말 것. 서류에 개인정보가 있다면 처리하지 않는다.

## Project Context

- 프롬프트로 React 컴포넌트를 생성하고 미리보는 도구. Claude/Gemini 선택 가능.
- Stack: React 19, TypeScript, Vite, Bun, react-live, Vitest, Testing Library.

## Standards and References

- 설치·실행 방법은 `README.md` 참고.
- 커밋: `type: 한국어 요약` (feat/fix/refactor/chore). 절차는 `.claude/skills/commit/SKILL.md`. 커밋 메시지 끝에는 세션 지침이 지정한 트레일러를 붙인다.
- 주석과 테스트 설명은 기존 코드처럼 한국어로 쓴다.
- Maintenance Policy: 이 문서의 규칙이나 근거(파일·라인)와 코드가 어긋나면 작업 중 발견한 시점에 업데이트를 제안한다.

## Context Map

- **[서버 코드 수정 (Bun API, 프롬프트, 폴백)](./server/AGENTS.md)** — `server/` 아래 파일을 수정할 때.
- **[프론트엔드 수정 (React, 미리보기)](./src/AGENTS.md)** — `src/` 아래 파일을 수정할 때.
