# src/ AGENTS.md

## Module Context

Vite + React 19 프론트엔드. 프롬프트를 받아 `/api/generate`를 호출하고, 응답 코드를 react-live로 미리보기와 코드 탭에 보여준다. 루트 규칙은 `../AGENTS.md`.

## Tech Stack and Constraints

- 상태 관리 라이브러리 없이 `useState`/`useCallback` 훅만 사용한다 (`hooks/useComponentGenerator.ts`, `App.tsx`).
- 스타일은 `App.css`, `index.css`의 일반 CSS 클래스. 생성되는 컴포넌트가 아니라 앱 UI 자체는 CSS 파일로 스타일링한다.
- TypeScript는 `erasableSyntaxOnly`, `verbatimModuleSyntax`, `noUnusedLocals`가 켜져 있다 (`../tsconfig.app.json`). enum/namespace 금지, 타입은 `import type`, 쓰지 않는 import·변수는 빌드 실패.
- 이 폴더만 `bun run build`의 `tsc -b` 타입체크 대상이다.

## Implementation Patterns

- 서버 호출은 `hooks/useComponentGenerator.ts`의 `fetch('/api/generate')`로만 한다. 컴포넌트가 직접 `fetch`하지 않는다. 예외는 `App.tsx`의 `/api/config` 조회 하나.
- 컴포넌트는 `components/`에 named export 함수(`export function X`)로 두고 props 인터페이스를 같은 파일에 선언한다.
- 공용 타입(`Provider`, `GeneratedComponent`)은 `types/index.ts`에 둔다.
- 새 결과는 목록 맨 앞에 추가한다 (`useComponentGenerator.ts:42`).

## Testing Strategy

- 실행: `bun run test src/components/PromptInput.test.tsx`
- 환경은 jsdom, 설정은 `src/test/setup.ts` (jest-dom 매처, 테스트마다 `cleanup`). Testing Library와 user-event 사용.
- 현재 테스트가 있는 파일은 `PromptInput.tsx`뿐이다. `App`, `ComponentCard`, `LivePreview`, `CodeView`, `useComponentGenerator`는 테스트가 없다. 이 영역의 로직을 바꿀 때는 회귀 확인을 위해 테스트 추가를 함께 제안한다.

## Local Golden Rules

- Do: `LivePreview`의 `LiveProvider`는 `noInline`을 유지한다 (`components/LivePreview.tsx:14`). 서버가 만드는 코드가 `render(<X />)` 호출 형식이기 때문이다. 바꾸려면 `../server/index.ts`의 시스템 프롬프트와 `../server/generator.ts`의 `ensureRenderCall`을 함께 바꿔야 한다.
- Do: 미리보기 새로고침은 `key`를 바꿔 리마운트하는 방식이다 (`ComponentCard.tsx:17,33,70`). 이 구조를 유지한다.
- Do: API 키 입력은 선택 사항이다. 비어 있으면 요청 본문에서 `apiKey`를 아예 뺀다 (`useComponentGenerator.ts:26`). 서버가 환경변수 키로 대체하는 흐름이 여기에 의존한다.
- Don't: 프로바이더를 바꿀 때 입력한 키를 유지하지 않는다. 다른 프로바이더 키가 잘못 전송되지 않도록 `handleProviderChange`가 키를 비운다 (`App.tsx:41-44`).
- Don't: 서버 키 값을 기대하거나 화면에 표시하지 않는다. 클라이언트는 `envKeys` boolean만 받는다 (`App.tsx:24-29`).
- Don't: 포트를 하드코딩해 `http://localhost:3002`로 직접 요청하지 않는다. 항상 `/api` 상대 경로를 쓴다 (Vite 프록시: `../vite.config.ts:9-14`).
