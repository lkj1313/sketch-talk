import { SearchXIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/shared/ui";

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <section className="w-full max-w-lg rounded-3xl border bg-card p-8 text-center shadow-sm sm:p-12">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted">
          <SearchXIcon aria-hidden="true" className="size-7" />
        </span>
        <p className="mt-6 text-sm font-semibold text-muted-foreground">404</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          페이지를 찾을 수 없습니다.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          주소가 잘못되었거나 삭제된 페이지입니다. 홈이나 로비에서 다시
          시작해주세요.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          <Button variant="outline" render={<Link to="/" />}>
            홈으로 이동
          </Button>
          <Button render={<Link to="/lobby" />}>게임 로비로 이동</Button>
        </div>
      </section>
    </main>
  );
}
