# Sketch Talk

> React와 NestJS, Socket.IO로 구현한 실시간 멀티플레이 그림 퀴즈 게임입니다.

Sketch Talk은 한 명이 그림을 그리고 다른 참가자가 채팅으로 정답을 맞히는 웹 기반 캐치마인드 게임입니다. 단순한 화면 구현을 넘어 **회원·비회원 통합 인증, 실시간 그림 동기화, 서버 중심의 게임 상태 관리, 연결 복구와 전체 게임 E2E 테스트**까지 구현하는 것을 목표로 개발했습니다.

| 구분 | 내용 |
| --- | --- |
| 개발 형태 | 1인 개인 프로젝트 |
| 담당 범위 | 기획, 데이터 모델링, 백엔드, 실시간 통신, 프론트엔드, 테스트 |
| 핵심 기술 | React, NestJS, Socket.IO, PostgreSQL, Prisma |
| 현재 상태 | 핵심 게임 MVP 및 자동화 테스트 구현 완료 |

## 프로젝트에서 중점적으로 해결한 문제

### 1. 화면 크기가 달라도 동일한 그림을 표시하는 방법

Canvas의 픽셀 좌표를 그대로 전송하면 참가자의 화면 크기에 따라 그림 위치가 달라집니다. 이를 해결하기 위해 포인터 좌표를 Canvas 너비와 높이를 기준으로 `0~1` 범위로 정규화하여 전송합니다.

```text
그리기 시작
→ 정규화 좌표와 strokeId 생성
→ drawing:stroke 전송
→ 서버가 같은 방 참가자에게 브로드캐스트
→ 각 클라이언트의 Canvas 크기에 맞게 좌표 복원
```

- `roundId`로 이전 라운드의 그림 이벤트를 차단합니다.
- `strokeId`로 하나의 연속된 선을 구분합니다.
- 지우개도 별도의 선 데이터로 처리하여 다른 참가자에게 동일하게 반영합니다.
- 전체 지우기와 중간 입장 시 그림 복원을 위한 동기화 이벤트를 제공합니다.

### 2. 회원과 비회원을 하나의 게임 흐름으로 처리하는 방법

회원과 비회원의 인증 방식은 다르지만 방 서비스에서 두 로직이 반복되지 않도록 `RequestActor`라는 공통 행위자 타입으로 통합했습니다.

```text
회원   → Access Token 검증 ─┐
                            ├→ RequestActor → 방 생성·참가·퇴장
비회원 → Guest Cookie 검증 ─┘
```

- Access Token은 짧게 유지하고 Refresh Token은 HttpOnly 쿠키로 전달합니다.
- Refresh Token 원문 대신 해시만 데이터베이스에 저장하고 재발급 시 회전시킵니다.
- Guest Token도 원문은 HttpOnly 쿠키, 서버에는 해시만 저장합니다.
- Prisma의 고유 제약조건을 이용하여 한 사용자 또는 비회원 세션이 여러 방에 동시에 참가하지 못하도록 보장합니다.

### 3. 클라이언트 조작 없이 일관된 게임 상태를 유지하는 방법

정답 판정, 점수 계산, 라운드 종료 시각과 다음 라운드 생성은 모두 서버에서 처리합니다. 클라이언트는 서버가 전달한 상태를 표시하고 사용자 입력만 전송합니다.

- 채팅 메시지를 서버에서 정규화한 뒤 제시어와 비교합니다.
- 정답자와 출제자의 점수를 서버에서 계산하여 저장합니다.
- 라운드 만료 시각을 DB에 저장하고 서버 스케줄러가 시간 초과를 처리합니다.
- 게임 종료 시 참가자 정보와 점수를 스냅샷으로 저장하여 방이 삭제되어도 회원 기록을 유지합니다.

### 4. 새로고침과 중간 입장 후에도 게임을 복구하는 방법

실시간 이벤트만 전달하면 연결 전에 발생한 상태를 알 수 없습니다. 참가자가 방을 구독하거나 재연결할 때 현재 상태를 다시 받을 수 있도록 스냅샷 이벤트를 함께 설계했습니다.

```text
방 입장 또는 재연결
→ room:subscribe
→ room:state
→ game:state
→ drawing:sync
```

이를 통해 참가자는 현재 라운드, 출제자, 남은 시간, 점수와 기존 그림을 복원할 수 있습니다.

## 주요 설계 결정

| 결정 | 이유 |
| --- | --- |
| REST API와 Socket.IO 역할 분리 | 조회·명령은 HTTP로 처리하고 실시간 상태 변화만 소켓으로 전달하기 위해서입니다. |
| 서버 중심 정답·점수 판정 | 클라이언트 조작을 방지하고 모든 참가자에게 동일한 결과를 제공하기 위해서입니다. |
| 정규화된 Canvas 좌표 사용 | 서로 다른 화면 크기에서도 같은 위치에 그림을 표시하기 위해서입니다. |
| 회원·비회원 공통 Actor 사용 | 도메인 서비스가 인증 방식에 의존하거나 로직이 중복되는 것을 막기 위해서입니다. |
| HttpOnly 쿠키에 세션 토큰 저장 | JavaScript에서 Refresh Token과 Guest Token 원문에 접근하지 못하게 하기 위해서입니다. |
| 공통 contracts 패키지 사용 | 프론트엔드와 백엔드의 이벤트 및 응답 타입 불일치를 줄이기 위해서입니다. |
| DB 제약조건과 서비스 검증 병행 | 잘못된 데이터가 애플리케이션 검증을 우회해 저장되는 것을 방지하기 위해서입니다. |

## 주요 기능

### 회원과 비회원

- 이메일과 비밀번호를 이용한 회원가입 및 로그인
- Access Token과 HttpOnly Refresh Token을 이용한 인증
- 비회원용 Guest Session 발급
- 회원의 게임 통계 및 최근 게임 기록 제공

### 게임방

- 공개방과 비공개방 생성
- 방 목록 및 방 코드 조회
- 방 코드 또는 초대 링크를 이용한 참가
- 게임 진행 중 중간 입장 지원
- 참가자 준비 상태 변경
- 방장 퇴장 시 방장 권한 이전

### 실시간 게임

- Socket.IO 기반 방 상태 동기화
- 라운드별 출제자와 제시어 배정
- 펜, 지우개 및 전체 지우기
- 실시간 그림 공유 및 중간 입장 시 그림 복원
- 채팅 메시지를 이용한 정답 판정
- 난이도에 따른 점수 지급
- 라운드 제한 시간 및 다음 라운드 진행
- 연결 종료 후 게임 상태 복구
- 최종 순위와 게임 결과 제공

### 제시어

- EASY, MEDIUM, HARD 난이도 구분
- 게임 세션 내 중복 제시어 방지
- Kimi API를 이용한 선택적 제시어 자동 생성
- 사용 횟수와 최근 사용 시각 관리

## 기술 스택

| 구분 | 기술 |
| --- | --- |
| Monorepo | pnpm workspace, Turborepo |
| Frontend | React, Vite, TypeScript |
| Routing | React Router |
| Server State | TanStack Query |
| Client State | Zustand |
| Styling | Tailwind CSS, Base UI, shadcn/ui |
| Realtime | Socket.IO |
| Backend | NestJS, TypeScript |
| Database | PostgreSQL, Prisma |
| Authentication | JWT, bcrypt, HttpOnly Cookie |
| AI | Kimi API, OpenAI JavaScript SDK |
| Test | Jest, Vitest, Testing Library, Playwright |
| UI Development | Storybook |

## 동작 구조

```mermaid
flowchart LR
    Browser[React Web] -->|HTTP| API[NestJS API]
    Browser <-->|Socket.IO| Realtime[Realtime Gateway]
    API --> DB[(PostgreSQL)]
    Realtime --> DB
    API -.->|선택적 제시어 생성| Kimi[Kimi API]
```

- HTTP API는 회원, 비회원 세션, 방과 게임 기록을 처리합니다.
- Socket.IO는 참가자 상태, 채팅, 그림과 게임 진행 상태를 전달합니다.
- PostgreSQL에는 회원, 세션, 방, 라운드, 점수와 제시어가 저장됩니다.
- 프론트엔드와 백엔드는 `@sketch-talk/contracts` 패키지의 공통 타입을 사용합니다.

## 프로젝트 구조

```text
sketch-talk/
├── apps/
│   ├── api/                  # NestJS API와 Socket.IO 서버
│   │   ├── prisma/           # Prisma 스키마와 마이그레이션
│   │   ├── src/auth/         # 회원 인증과 세션
│   │   ├── src/guest-session/ # 비회원 세션
│   │   ├── src/rooms/        # 게임방
│   │   ├── src/games/        # 게임 및 라운드
│   │   ├── src/realtime/     # Socket.IO와 그림 동기화
│   │   └── src/words/        # 제시어 풀
│   └── web/                  # React 애플리케이션
│       ├── e2e/              # Playwright E2E 테스트
│       └── src/
│           ├── app/          # 앱 설정과 라우팅
│           ├── entities/     # 도메인 데이터
│           ├── features/     # 사용자 기능
│           ├── pages/        # 라우트 페이지
│           ├── shared/       # 공통 API, 설정과 UI
│           └── widgets/      # 게임 화면 단위 UI
├── packages/
│   └── contracts/            # 프론트엔드·백엔드 공통 타입
├── compose.yaml              # 로컬 PostgreSQL
├── pnpm-workspace.yaml
└── turbo.json
```

## 시작하기

### 준비 사항

- Node.js 24 이상
- pnpm 11
- Docker Desktop

### 1. 저장소 복제 및 패키지 설치

```bash
git clone https://github.com/lkj1313/sketch-talk.git
cd sketch-talk

corepack enable
pnpm install
```

### 2. 환경변수 생성

```bash
cp .env.example .env
cp .env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

개발 환경의 기본 주소는 다음과 같습니다.

```env
# apps/api/.env
DATABASE_URL=postgresql://sketch_talk:sketch_talk_local_password@localhost:5432/sketch_talk?schema=public
WEB_ORIGIN=http://localhost:5173
JWT_ACCESS_SECRET=개발용으로_사용할_충분히_긴_랜덤값
WORD_AUTO_GENERATION_ENABLED=false

# apps/web/.env
VITE_API_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3000
```

JWT Secret은 다음 명령으로 생성할 수 있습니다.

```bash
openssl rand -base64 64
```

`.env` 파일에는 비밀번호와 API 키가 포함되므로 Git에 커밋하지 마세요.

### 3. PostgreSQL 실행

```bash
pnpm docker:up
pnpm docker:ps
```

Docker Compose는 PostgreSQL을 `127.0.0.1:5432`에 실행합니다.

### 4. Prisma 준비

```bash
pnpm --filter api exec prisma generate
pnpm --filter api exec prisma migrate deploy
```

Prisma Studio로 데이터를 확인하려면 다음 명령을 사용합니다.

```bash
pnpm --filter api exec prisma studio
```

### 5. 개발 서버 실행

```bash
pnpm dev
```

| 서비스 | 주소 |
| --- | --- |
| Web | http://localhost:5173 |
| API | http://localhost:3000/api/v1 |
| Socket.IO | `http://localhost:3000/rooms` |

Web과 API를 따로 실행할 수도 있습니다.

```bash
pnpm --filter web dev
pnpm --filter api dev
```

## 제시어 자동 생성

제시어 자동 생성은 기본적으로 비활성화되어 있습니다.

```env
WORD_AUTO_GENERATION_ENABLED=false
```

새 데이터베이스에 제시어를 채워야 한다면 `apps/api/.env`에 Kimi API 정보를 설정하고 자동 생성을 잠시 활성화하세요.

```env
KIMI_CODE_API_KEY=발급받은_API_키
KIMI_CODE_BASE_URL=https://api.kimi.com/coding/v1
KIMI_CODE_MODEL=kimi-for-coding
WORD_AUTO_GENERATION_ENABLED=true
```

API 서버를 한 번 실행하여 보충 완료 로그를 확인한 다음 다시 `false`로 변경하는 것을 권장합니다. 개발 서버의 Watch 모드에서는 파일이 변경될 때 서버가 재시작되므로, 자동 생성을 계속 활성화하면 API가 반복 호출될 수 있습니다.

## 주요 명령어

| 명령어 | 설명 |
| --- | --- |
| `pnpm dev` | Web과 API 개발 서버를 함께 실행합니다. |
| `pnpm build` | 전체 워크스페이스를 빌드합니다. |
| `pnpm lint` | 전체 린트를 실행합니다. |
| `pnpm test` | 전체 단위 테스트를 실행합니다. |
| `pnpm test:e2e:web` | Playwright 브라우저 테스트를 실행합니다. |
| `pnpm storybook` | Storybook을 6006 포트에서 실행합니다. |
| `pnpm docker:up` | 로컬 PostgreSQL을 실행합니다. |
| `pnpm docker:down` | 로컬 PostgreSQL을 종료합니다. |
| `pnpm docker:logs` | PostgreSQL 로그를 확인합니다. |

## 주요 HTTP API

모든 API에는 `/api/v1` 접두사가 붙습니다.

| Method | Endpoint | 설명 |
| --- | --- | --- |
| `POST` | `/auth/signup` | 회원가입 |
| `POST` | `/auth/login` | 로그인 |
| `POST` | `/auth/refresh` | Access Token 재발급 |
| `POST` | `/auth/logout` | 로그아웃 |
| `GET` | `/auth/me` | 현재 회원 조회 |
| `POST` | `/guest-sessions` | 비회원 세션 발급 |
| `GET` | `/rooms` | 방 목록 조회 |
| `POST` | `/rooms` | 방 생성 |
| `GET` | `/rooms/:code` | 방 상세 조회 |
| `POST` | `/rooms/:code/participants` | 방 참가 |
| `DELETE` | `/rooms/:code/participants/me` | 방 퇴장 |
| `PATCH` | `/rooms/:code/participants/me/ready` | 준비 상태 변경 |
| `POST` | `/rooms/:code/start` | 게임 시작 |
| `GET` | `/users/me/game-records` | 회원 게임 기록 조회 |

API 응답은 성공 여부, HTTP 상태 코드, 데이터 또는 에러 정보를 갖는 공통 형식으로 반환됩니다.

## 실시간 이벤트

Socket.IO는 `/rooms` 네임스페이스와 `/api/v1/socket.io` 경로를 사용합니다.

| 구분 | 주요 이벤트 |
| --- | --- |
| 방 | `room:subscribe`, `room:state`, `room:participant-joined`, `room:ready-changed` |
| 게임 | `room:game-started`, `game:state`, `game:round-started`, `game:finished` |
| 채팅 | `game:message`, `game:chat-message`, `game:correct-answer` |
| 그림 | `drawing:stroke`, `drawing:stroke-added`, `drawing:clear`, `drawing:sync` |

## 테스트 전략

기능 단위 테스트뿐 아니라 두 개의 브라우저가 실제로 한 게임을 완료하는 흐름까지 자동화했습니다.

| 계층 | 검증 내용 |
| --- | --- |
| Backend Unit | 인증, 방 상태 전환, 게임 점수, 라운드 스케줄러, 제시어 풀을 검증합니다. |
| Backend E2E | HTTP API, 쿠키, 데이터베이스 제약조건과 인증 흐름을 검증합니다. |
| Frontend Unit | 폼 검증, 상태 훅, 라우트 보호, 게임 UI와 Canvas 도구를 검증합니다. |
| Realtime | Gateway 이벤트, 방 구독, 연결 종료와 그림 상태 동기화를 검증합니다. |
| Playwright E2E | 회원과 비회원 브라우저가 방에 입장하여 그림을 공유하고 게임을 완료하는 과정을 검증합니다. |

Playwright에서는 서로 분리된 브라우저 컨텍스트를 사용하여 실제 멀티플레이 환경을 재현합니다.

```text
회원가입 및 로그인
→ 회원이 방 생성
→ 비회원이 방 참가
→ 준비 및 게임 시작
→ Canvas 그림 전송과 상대 화면 픽셀 변화 확인
→ 채팅 정답 판정
→ 모든 라운드 완료
→ 최종 순위와 회원 기록 확인
```

### 테스트 실행

```bash
# 백엔드 단위 테스트
pnpm --filter api test

# 백엔드 E2E 테스트
pnpm --filter api test:e2e

# 프론트엔드 단위 테스트
pnpm --filter web test:run

# 실제 브라우저 게임 흐름
pnpm test:e2e:web

# 프로덕션 빌드 확인
pnpm build
```

## 현재 상태

- 핵심 게임 MVP 구현 완료
- Web, API 및 실시간 통신 테스트 구축
- Storybook을 이용한 주요 게임 UI 확인 지원
- 운영 배포는 아직 구성하지 않았습니다.

## 향후 개선 사항

- GitHub Actions를 이용한 테스트 및 배포 자동화
- Redis Adapter를 이용한 Socket.IO 다중 서버 확장
- 서버 재시작 시 진행 중인 게임과 타이머 복구 강화
- 제시어 생성 작업의 분산 잠금 및 수동 실행 명령 제공
- 부하 테스트와 실시간 이벤트 모니터링 추가
