import {
  MessageCircleIcon,
  PaletteIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useSessionStore } from "@/entities/session";
import { Button } from "@/shared/ui";

const FEATURES = [
  {
    icon: PaletteIcon,
    title: "함께 그리기",
    description: "한 사람이 그리면 모두의 화면에 그림이 실시간으로 나타납니다.",
  },
  {
    icon: MessageCircleIcon,
    title: "대화하며 맞히기",
    description: "음성으로 자유롭게 이야기하고 채팅으로 정답에 도전합니다.",
  },
  {
    icon: UsersIcon,
    title: "링크로 바로 초대",
    description:
      "방 링크 하나만 공유하면 회원과 비회원 모두 참여할 수 있습니다.",
  },
] as const;

export function HomePage() {
  const user = useSessionStore((state) => state.user);

  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2 font-bold tracking-tight"
          aria-label="Sketch Talk 홈"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <PaletteIcon aria-hidden="true" className="size-5" />
          </span>
          Sketch Talk
        </Link>

        <nav aria-label="주요 메뉴" className="flex items-center gap-2">
          {user ? (
            <Button variant="ghost" render={<Link to="/me" />}>
              내 기록
            </Button>
          ) : (
            <Button variant="ghost" render={<Link to="/login" />}>
              로그인
            </Button>
          )}
          <Button render={<Link to="/lobby" />}>게임 시작</Button>
        </nav>
      </header>

      <section className="relative px-4 pb-20 pt-12 sm:px-6 sm:pt-20 lg:px-8">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 -z-10 mx-auto h-[560px] max-w-5xl rounded-full bg-muted/80 blur-3xl"
        />

        <div className="mx-auto grid w-full max-w-7xl items-center gap-14 lg:grid-cols-[1fr_0.9fr]">
          <div className="text-center lg:text-left">
            <p className="mx-auto inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1.5 text-sm font-medium shadow-sm lg:mx-0">
              <SparklesIcon aria-hidden="true" className="size-4" />
              실시간 그림 퀴즈 게임
            </p>
            <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl">
              Sketch Talk
            </h1>
            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-4xl">
              말하고, 그리고, 맞혀보세요.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg lg:mx-0">
              친구들과 음성으로 대화하며 그림을 그리고, 채팅으로 정답을 맞히는
              실시간 캐치마인드 게임입니다.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Button
                size="lg"
                className="h-11 px-6"
                render={<Link to="/lobby" />}
              >
                지금 게임 시작하기
              </Button>
              {!user && (
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 px-6"
                  render={<Link to="/signup" />}
                >
                  기록을 남기려면 회원가입
                </Button>
              )}
            </div>
          </div>

          <GamePreview />
        </div>
      </section>

      <section className="border-t bg-muted/30 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              복잡한 준비 없이 바로 시작하세요
            </h2>
            <p className="mt-3 text-muted-foreground">
              방을 만들고 링크를 공유하면 게임 준비가 끝납니다.
            </p>
          </div>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <li
                key={title}
                className="rounded-2xl border bg-card p-6 shadow-sm"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

function GamePreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl" aria-hidden="true">
      <div className="rotate-1 rounded-3xl border bg-card p-3 shadow-2xl sm:p-5">
        <div className="flex items-center justify-between border-b pb-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">즐거운 그림방</span>
          <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">
            실시간 연결됨
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_140px]">
          <div className="aspect-[4/3] overflow-hidden rounded-2xl border bg-white p-4">
            <svg viewBox="0 0 320 240" className="size-full">
              <path
                d="M55 174 C78 105 122 70 172 74 C224 78 261 121 271 178"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="9"
              />
              <path
                d="M92 169 C105 135 129 116 161 116 C194 116 220 137 233 169 Z"
                fill="none"
                stroke="currentColor"
                strokeLinejoin="round"
                strokeWidth="8"
              />
              <circle cx="136" cy="146" r="6" />
              <circle cx="187" cy="146" r="6" />
              <path
                d="M145 162 Q161 174 179 162"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="5"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <PreviewMessage name="그림왕" message="이건 쉬워요!" />
            <PreviewMessage name="정답왕" message="햄버거" />
            <PreviewMessage name="철수" message="모자 쓴 사람?" />
            <div className="rounded-xl bg-primary p-3 text-xs text-primary-foreground">
              정답왕님이 정답을 맞혔습니다! +100점
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-4 -left-3 -z-10 size-28 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute -right-3 -top-4 -z-10 size-32 rounded-full bg-primary/10 blur-2xl" />
    </div>
  );
}

function PreviewMessage({ name, message }: { name: string; message: string }) {
  return (
    <div className="rounded-xl border bg-background p-3 text-xs">
      <p className="font-semibold">{name}</p>
      <p className="mt-1 text-muted-foreground">{message}</p>
    </div>
  );
}
