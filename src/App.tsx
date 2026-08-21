import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { BottomNav } from "./components/BottomNav";
import { useReminderCheck } from "./lib/useReminderCheck";
import { TodosPage } from "./routes/TodosPage";
import { HabitsPage } from "./routes/HabitsPage";

const queryClient = new QueryClient();

function AppShell() {
  useReminderCheck();
  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col">
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<TodosPage />} />
          <Route path="/habits" element={<HabitsPage />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AppShell />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
