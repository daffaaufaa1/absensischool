import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Absensi from "@/pages/Absensi";
import Jurnal from "@/pages/Jurnal";
import InputNilai from "@/pages/InputNilai";
import Kehadiran from "@/pages/Kehadiran";
import Biodata from "@/pages/Biodata";
import PengurusAccess from "@/pages/PengurusAccess";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

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
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
