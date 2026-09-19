import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { BottomNav } from "./components/BottomNav";
import { TodayPage } from "./routes/TodayPage";
import { GardenPage } from "./routes/GardenPage";
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
          <Route path="/" element={<TodayPage />} />
          <Route path="/garden" element={<GardenPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
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
