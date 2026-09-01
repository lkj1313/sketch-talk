import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useSessionStore } from "@/entities/session";

export function AuthenticatedRoute() {
  const user = useSessionStore((state) => state.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
