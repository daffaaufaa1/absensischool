import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";

// Lazy load all pages - only downloaded when user navigates to them
const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Absensi = lazy(() => import("@/pages/Absensi"));
const Jurnal = lazy(() => import("@/pages/Jurnal"));
const InputNilai = lazy(() => import("@/pages/InputNilai"));
const Kehadiran = lazy(() => import("@/pages/Kehadiran"));
const Biodata = lazy(() => import("@/pages/Biodata"));
const PengurusAccess = lazy(() => import("@/pages/PengurusAccess"));
const AdminPanel = lazy(() => import("@/pages/AdminPanel"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

// Minimal loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />

                {/* Admin route */}
                <Route path="/admin" element={<AdminPanel />} />

                {/* Protected routes with layout */}
                <Route
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/absensi" element={<Absensi />} />
                  <Route
                    path="/jurnal"
                    element={
                      <ProtectedRoute allowedRoles={['guru']}>
                        <Jurnal />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/nilai"
                    element={
                      <ProtectedRoute allowedRoles={['guru']}>
                        <InputNilai />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/kehadiran" element={<Kehadiran />} />
                  <Route path="/biodata" element={<Biodata />} />
                  <Route
                    path="/pengurus-access"
                    element={
                      <ProtectedRoute allowedRoles={['guru']}>
                        <PengurusAccess />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* Redirects */}
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
