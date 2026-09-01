import type {
  MemberGameHistory,
  MemberGameStats,
} from "@sketch-talk/contracts";
import { ArrowLeftIcon, TrophyIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { useMemberGameRecord } from "@/entities/game-record";
import { useSessionStore } from "@/entities/session";
import { Button, Spinner } from "@/shared/ui";

export function ProfilePage() {
  const user = useSessionStore((state) => state.user);
  const recordQuery = useMemberGameRecord();

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto w-full max-w-5xl">
        <Button variant="ghost" render={<Link to="/lobby" />}>
          <ArrowLeftIcon aria-hidden="true" />
          로비로 돌아가기
        </Button>

        <header className="mt-4 rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <p className="text-sm font-medium text-muted-foreground">내 기록</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {user?.nickname}님
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{user?.email}</p>
        </header>

        {recordQuery.isPending ? (
          <div className="flex min-h-72 items-center justify-center">
            <Spinner className="size-8" aria-label="게임 기록 불러오는 중" />
          </div>
        ) : recordQuery.isError || !recordQuery.data ? (
          <section className="mt-6 rounded-2xl border bg-card p-8 text-center">
            <h2 className="text-lg font-semibold">
              게임 기록을 불러오지 못했습니다.
            </h2>
            <Button className="mt-4" onClick={() => void recordQuery.refetch()}>
              다시 시도
            </Button>
          </section>
        ) : (
          <div className="mt-6 space-y-6">
            <StatsGrid stats={recordQuery.data.stats} />
            <GameHistory games={recordQuery.data.recentGames} />
          </div>
        )}
      </div>
    </main>
  );
}

function StatsGrid({ stats }: { stats: MemberGameStats }) {
  const items = [
    ["플레이", `${stats.gamesPlayed}회`],
    ["승리", `${stats.wins}회`],
    ["누적 점수", `${stats.totalScore}점`],
    ["최고 점수", `${stats.bestScore}점`],
  ] as const;

  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-2xl border bg-card p-5 shadow-sm">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="mt-1 text-2xl font-bold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function GameHistory({ games }: { games: MemberGameHistory[] }) {
  return (
    <section className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-2">
        <TrophyIcon aria-hidden="true" className="size-5 text-amber-500" />
        <h2 className="text-xl font-semibold">최근 게임</h2>
      </div>

      {games.length === 0 ? (
        <p className="mt-6 rounded-xl bg-muted p-6 text-center text-sm text-muted-foreground">
          아직 완료한 게임이 없습니다.
        </p>
      ) : (
        <ol className="mt-6 space-y-3">
          {games.map((game) => (
            <li
              key={game.gameSessionId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background p-4"
            >
              <div>
                <p className="font-semibold">{game.roomTitle}</p>
                <time className="text-xs text-muted-foreground">
                  {formatGameDate(game.endedAt)}
                </time>
              </div>
              <div className="text-right">
                <p className="font-bold">
                  {game.rank}위 · {game.score}점
                </p>
                <p className="text-xs text-muted-foreground">
                  참가자 {game.playerCount}명
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function formatGameDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
