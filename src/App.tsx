import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import LecturerDashboard from "./pages/lecturer/Dashboard";
import LecturerClasses from "./pages/lecturer/Classes";
import StartSession from "./pages/lecturer/StartSession";
import ActiveSession from "./pages/lecturer/ActiveSession";
import SessionHistory from "./pages/lecturer/SessionHistory";
import LecturerReports from "./pages/lecturer/Reports";
import LecturerAnalytics from "./pages/lecturer/Analytics";
import StudentDashboard from "./pages/student/Dashboard";
import Scanner from "./pages/student/Scanner";
import AttendanceHistory from "./pages/student/AttendanceHistory";
import StudentSettings from "./pages/student/Settings";
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
            <Route path="/" element={<Index />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Lecturer Routes */}
            <Route 
              path="/lecturer/dashboard" 
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <LecturerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lecturer/classes" 
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <LecturerClasses />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lecturer/session/:classId" 
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <StartSession />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lecturer/active-session/:sessionId" 
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <ActiveSession />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/lecturer/history" 
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <SessionHistory />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lecturer/reports" 
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <LecturerReports />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lecturer/analytics" 
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <LecturerAnalytics />
                </ProtectedRoute>
              } 
            />
            
            {/* Student Routes */}
            <Route 
              path="/student/dashboard" 
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/scanner" 
              element={
                <ProtectedRoute requiredRole="student">
                  <Scanner />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/attendance" 
              element={
                <ProtectedRoute requiredRole="student">
                  <AttendanceHistory />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/settings" 
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentSettings />
                </ProtectedRoute>
              } 
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
