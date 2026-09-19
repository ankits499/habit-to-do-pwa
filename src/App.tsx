import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { BottomNav } from "./components/BottomNav";
import { TodosPage } from "./routes/TodosPage";
import { HabitsPage } from "./routes/HabitsPage";
import { useToday } from "./lib/useToday";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
    },
  },
});

function AppShell() {
  const today = useToday();
  return (
    <div className="mx-auto flex h-full max-w-[480px] flex-col">
      {/* Re-key on date change so every today-derived view recomputes. */}
      <div key={today} className="min-h-0 flex-1">
        <Routes>
          <Route path="/" element={<TodosPage />} />
          <Route path="/habits" element={<HabitsPage />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HashRouter>
          <AppShell />
        </HashRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
