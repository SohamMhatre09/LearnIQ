import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Code, FileText, Trash2, Edit, Users, CheckCircle, Clock, AlertTriangle, Play, Eye } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import axios from "axios";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

import { API_URL } from "@/config";
const API_BASE_URL = `${API_URL}/api`;

export default function AssignmentManagement() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch assignment details
  const fetchAssignmentDetails = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const response = await axios.get(`${API_BASE_URL}/assignments/${assignmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAssignment(response.data);
    } catch (error) {
      console.error("Error fetching assignment:", error);
      toast({
        title: "Error",
        description: "Failed to fetch assignment details.",
        variant: "destructive",
      });
      // If assignment not found, redirect to classrooms
      if ((error as any).response?.status === 404) {
        navigate("/teacher/classrooms");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentDetails();
    }
  }, [assignmentId]);

  const handleDeleteAssignment = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      await axios.delete(`${API_BASE_URL}/assignments/${assignmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({
        title: "Success",
        description: "Assignment deleted successfully!",
      });

      // Navigate back to the classroom
      if (assignment?.class?._id) {
        navigate(`/teacher/classrooms/${assignment.class._id}`);
      } else {
        navigate("/teacher/classrooms");
      }
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast({
        title: "Error",
        description: "Failed to delete the assignment.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Handle preview assignment - takes teacher to student view in preview mode
  const handlePreviewAssignment = () => {
    navigate(`/assignments/preview/${assignmentId}`);
  };

  const renderStats = () => {
    if (!assignment?.stats) return null;
    
    const { totalStudents, submitted, inProgress, notStarted } = assignment.stats;
    
    // Calculate percentages for the progress bars
    const submittedPercentage = totalStudents ? Math.round((submitted / totalStudents) * 100) : 0;
    const inProgressPercentage = totalStudents ? Math.round((inProgress / totalStudents) * 100) : 0;
    const notStartedPercentage = totalStudents ? Math.round((notStarted / totalStudents) * 100) : 0;
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Student Progress</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Completed</p>
                    <p className="text-2xl font-bold">{submitted}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-green-500 border-green-200 bg-green-50">
                  {submittedPercentage}%
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium">In Progress</p>
                    <p className="text-2xl font-bold">{inProgress}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-amber-500 border-amber-200 bg-amber-50">
                  {inProgressPercentage}%
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Not Started</p>
                    <p className="text-2xl font-bold">{notStarted}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-gray-500 border-gray-200 bg-gray-50">
                  {notStartedPercentage}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container h-16 flex items-center">
            <Code className="h-6 w-6 text-primary mr-2" />
            <span className="font-semibold text-lg">Assignment</span>
          </div>
        </header>
        
        <main className="container py-8">
          <div className="flex justify-center items-center h-[50vh]">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container h-16 flex items-center">
          <Code className="h-6 w-6 text-primary mr-2" />
          <span className="font-semibold text-lg">Assignment Management</span>
        </div>
      </header>

      <main className="container py-8">
        <Button
          variant="outline"
          asChild
          className="mb-6"
        >
          <Link to={`/teacher/classrooms/${assignment?.class?._id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Classroom
          </Link>
        </Button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">{assignment?.title}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono">
                {assignment?.language}
              </Badge>
              <p className="text-muted-foreground">Class: {assignment?.class?.name}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="default" 
              className="gap-2" 
              onClick={handlePreviewAssignment}
            >
              <Eye className="h-4 w-4" /> Try It Out
            </Button>
            <Button 
              variant="outline" 
              className="gap-2" 
              asChild
            >
              <Link to={`/teacher/assignments/${assignmentId}/edit`}>
                <Edit className="h-4 w-4" /> Edit Assignment
              </Link>
            </Button>
            <Button 
              variant="destructive"
              className="gap-2"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="modules">Modules ({assignment?.modules?.length || 0})</TabsTrigger>
            <TabsTrigger value="students">
              Student Progress
              {assignment?.stats && (
                <Badge variant="secondary" className="ml-2">
                  {assignment.stats.totalStudents}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Assignment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <h3>Description</h3>
                  <p className="whitespace-pre-wrap">{assignment?.description}</p>
                  
                  {assignment?.requirements?.length > 0 && (
                    <>
                      <h3>Requirements</h3>
                      <ul>
                        {assignment.requirements.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {renderStats()}
          </TabsContent>

          <TabsContent value="modules" className="space-y-6">
            <div className="space-y-4">
              {assignment?.modules?.map((module, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="bg-muted/50">
                    <CardTitle className="text-lg">
                      {module.title || `Module ${module.id}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-2">Learning Text</h3>
                        <p className="text-muted-foreground text-sm whitespace-pre-wrap">{module.learningText}</p>
                      </div>
                      
                      {module.codeTemplate && (
                        <div>
                          <h3 className="font-medium mb-2">Code Template</h3>
                          <pre className="bg-muted overflow-x-auto p-4 rounded-md text-xs">
                            <code>{module.codeTemplate}</code>
                          </pre>
                        </div>
                      )}
                      
                      {module.hints?.length > 0 && (
                        <div>
                          <h3 className="font-medium mb-2">Hints</h3>
                          <ul className="list-disc pl-5 space-y-1">
                            {module.hints.map((hint, i) => (
                              <li key={i} className="text-sm text-muted-foreground">{hint}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {module.expectedOutput && (
                        <div>
                          <h3 className="font-medium mb-2">Expected Output</h3>
                          <div className="bg-muted p-4 rounded-md text-sm font-mono">
                            {module.expectedOutput}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Progress</CardTitle>
                <CardDescription>Track student submissions and progress</CardDescription>
              </CardHeader>
              <CardContent>
                {assignment?.stats?.submissions?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium">Student</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Progress</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Last Updated</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {assignment.stats.submissions.map((sub, idx) => (
                          <tr key={idx} className="hover:bg-muted/50">
                            <td className="px-4 py-3 text-sm">{sub.student?.username || sub.student}</td>
                            <td className="px-4 py-3">
                              {sub.status === 'completed' ? (
                                <Badge className="bg-green-500">Completed</Badge>
                              ) : sub.status === 'in-progress' ? (
                                <Badge className="bg-amber-500">In Progress</Badge>
                              ) : (
                                <Badge variant="outline">Not Started</Badge>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="w-full bg-muted rounded-full h-2.5">
                                <div 
                                  className="bg-primary h-2.5 rounded-full" 
                                  style={{ width: `${sub.progress || 0}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-muted-foreground mt-1 block">
                                {sub.progress || 0}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {sub.updatedAt 
                                ? new Date(sub.updatedAt).toLocaleDateString() 
                                : 'Never'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No student submissions yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All student submissions and progress for this assignment will be permanently lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAssignment}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Assignment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}