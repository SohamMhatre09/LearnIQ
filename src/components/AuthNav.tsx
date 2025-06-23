import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User, GraduationCap, Pencil, Settings, Users } from "lucide-react";
import { TeacherIndicator } from "@/components/TeacherIndicator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AuthNav() {
  const { user, isAuthenticated, logout } = useAuth();
  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="hover:text-yellow-400">
          <Link to="/login">Sign In</Link>
        </Button>
        <Button size="sm" asChild className="bg-yellow-400 text-black hover:bg-yellow-500 font-medium">
          <Link to="/register">Sign Up</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <TeacherIndicator />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <User className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span>{user.username}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>              {user.role === "teacher" && (
                <span className="text-xs flex items-center gap-1 text-blue-500 mt-1 font-medium">
                  <Pencil className="h-3 w-3" />
                  Teacher Account
                </span>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {user.role === "teacher" ? (
            // Teacher-specific menu items
            <>
              <DropdownMenuItem asChild>
                <Link to="/teacher/dashboard">Teacher Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/teacher/batches">Manage Batches</Link>
              </DropdownMenuItem>
            </>
          ) : (
            // Student-specific menu items
            <DropdownMenuItem asChild>
              <Link to="/dashboard">Dashboard</Link>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem asChild>
            <Link to="/profile">Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={logout}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}