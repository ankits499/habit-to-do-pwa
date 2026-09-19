import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { BottomNav } from "./components/BottomNav";
import { TodayPage } from "./routes/TodayPage";
import { GardenPage } from "./routes/GardenPage";
import { useToday } from "./lib/useToday";
import { persister } from "./lib/persist";
import { ToastProvider } from "./lib/toast";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: WEEK_MS, // must be >= persist maxAge or restored data is dropped
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
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: WEEK_MS,
        // Queued offline writes aren't persisted (their functions can't be restored).
        dehydrateOptions: { shouldDehydrateMutation: () => false },
      }}
    >
      <AuthProvider>
        <ToastProvider>
          <HashRouter>
            <AppShell />
          </HashRouter>
        </ToastProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}

export default App;
