import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import TeacherRoute from "./components/TeacherRoute";
import Landing from "./pages/Landing";
import LoginPage from "./pages/auth/Login";
import RegisterPage from "./pages/auth/Register";
import ForgotPasswordPage from "./pages/auth/ForgotPassword";
import ResetPasswordPage from "./pages/auth/ResetPassword";
import StudentDashboard from "./pages/student/Dashboard";
import TeacherDashboard from "./pages/teacher/Dashboard";
import NotFoundPage from "./pages/NotFound";
import SettingsPage from "./pages/Settings";
import ClassroomsList from "./pages/teacher/ClassroomsList";
import ClassroomDetail from "./pages/teacher/ClassroomDetail";
import CreateClassroom from "./pages/teacher/CreateClassroom";
import EditClassroom from "./pages/teacher/EditClassroom";
import CreateAssignment from "./pages/teacher/CreateAssignment";
import EditAssignment from "./pages/teacher/EditAssignment";
import AssignmentManagement from "./pages/teacher/AssignmentManagement";
import Assignment from "./pages/Assignment";

export default function App() {
  const { user, authChecked } = useAuth();

  // Handle initial loading state
  if (!authChecked) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="theme-preference">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={user ? <Navigate to={user.role === "teacher" ? "/teacher" : "/student"} /> : <Landing />} />
        <Route path="/login" element={user ? <Navigate to={user.role === "teacher" ? "/teacher" : "/student"} /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to={user.role === "teacher" ? "/teacher" : "/student"} /> : <RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        
        {/* Protected routes for all authenticated users */}
        <Route element={<ProtectedRoute />}>
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/assignment/:id" element={<Assignment />} />
        </Route>
        
        {/* Teacher routes */}
        <Route element={<TeacherRoute />}>
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/teacher/classrooms" element={<ClassroomsList />} />
          <Route path="/teacher/classrooms/create" element={<CreateClassroom />} />
          <Route path="/teacher/classrooms/:classroomId" element={<ClassroomDetail />} />
          <Route path="/teacher/classrooms/:classroomId/edit" element={<EditClassroom />} />
          <Route path="/teacher/classrooms/:classroomId/assignments/create" element={<CreateAssignment />} />
          <Route path="/teacher/assignments/:assignmentId" element={<AssignmentManagement />} />
          <Route path="/teacher/assignments/:assignmentId/edit" element={<EditAssignment />} />
          <Route path="/teacher/assignments/:assignmentId/preview" element={<Assignment />} />
        </Route>
        
        {/* Student routes */}
        <Route element={<ProtectedRoute requiredRole="student" />}>
          <Route path="/student" element={<StudentDashboard />} />
          {/* Add more student routes here */}
        </Route>
        
        {/* Catch-all route for 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <Toaster />
    </ThemeProvider>
  );
}