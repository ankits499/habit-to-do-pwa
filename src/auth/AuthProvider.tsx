import { createContext, useContext, type ReactNode } from "react";

// This app has no server, so there's no real sign-in — everything is
// scoped to a single local user so the app opens straight to Todos/Habits.
type AuthUser = { id: string; email: string };

type AuthContextValue = {
  user: AuthUser;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const FAKE_USER: AuthUser = { id: "local-user", email: "you@local" };

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthContext.Provider value={{ user: FAKE_USER }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
