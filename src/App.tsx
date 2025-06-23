import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { TeacherRoute } from "@/components/TeacherRoute";
import { StudentRoute } from "@/components/StudentRoute";
import NotFound from "./pages/NotFound";
import { lazy, Suspense, ReactNode } from "react";

// Landing page
const Landing = lazy(() => import("./pages/Landing"));

// Existing pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Assignment = lazy(() => import("./pages/Assignment"));
const BatchDetails = lazy(() => import("./pages/BatchDetails"));

// Auth pages
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Profile = lazy(() => import("./pages/Profile"));

// Teacher-specific pages
const TeacherDashboard = lazy(() => import("./pages/teacher/Dashboard"));
const ClassroomManagement = lazy(() => import("./pages/teacher/ClassroomManagement"));
const ClassroomDetails = lazy(() => import("./pages/teacher/ClassroomDetails"));
const CreateAssignment = lazy(() => import("./pages/teacher/CreateAssignment"));
const AssignmentManagement = lazy(() => import("./pages/teacher/AssignmentManagement"));
const EditAssignment = lazy(() => import("./pages/teacher/EditAssignment"));

// Create query client instance
const queryClient = new QueryClient();

// Combine all providers into one component
const AppProviders = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {children}
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">Loading...</div>
);

const App = () => (
  <AppProviders>
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Protected routes */}
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          
          {/* Student routes */}
          <Route path="/dashboard" element={<StudentRoute><Dashboard /></StudentRoute>} />
          <Route path="/assignments/:id" element={<StudentRoute><Assignment /></StudentRoute>} />
          <Route path="/batches/:batchId" element={<StudentRoute><BatchDetails /></StudentRoute>} />
          
          {/* Teacher routes */}
          <Route path="/teacher/dashboard" element={<TeacherRoute><TeacherDashboard /></TeacherRoute>} />
          <Route path="/teacher/classrooms" element={<TeacherRoute><ClassroomManagement /></TeacherRoute>} />
          <Route path="/teacher/classrooms/:classroomId" element={<TeacherRoute><ClassroomDetails /></TeacherRoute>} />
          <Route path="/teacher/assignments/create" element={<TeacherRoute><CreateAssignment /></TeacherRoute>} />
          <Route path="/teacher/assignments/:assignmentId" element={<TeacherRoute><AssignmentManagement /></TeacherRoute>} />
          <Route path="/teacher/assignments/:assignmentId/edit" element={<TeacherRoute><EditAssignment /></TeacherRoute>} />
          <Route path="/assignments/preview/:id" element={<TeacherRoute><Assignment /></TeacherRoute>} />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </AppProviders>
);

export default App;
