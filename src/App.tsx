import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { MusicProvider } from "@/context/MusicContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Sessions from "./pages/Sessions";
import Tracker from "./pages/Tracker";
import Stats from "./pages/Stats";
import Edit from "./pages/Edit";
import Music from "./pages/Music";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import { isTokenValid } from "@/lib/auth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <MusicProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={isTokenValid() ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/register" element={isTokenValid() ? <Navigate to="/" replace /> : <Register />} />
            
            {/* Protected routes with persistent Layout */}
            <Route element={
              <ProtectedRoute>
                <AppLayout>
                  <Outlet />
                </AppLayout>
              </ProtectedRoute>
            }>
              <Route path="/" element={<Sessions />} />
              <Route path="/tracker" element={<Tracker />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/edit" element={<Edit />} />
              <Route path="/music" element={<Music />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </MusicProvider>
  </QueryClientProvider>
);

export default App;
