import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Code, ArrowLeft, BookOpen, Users, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { SandboxModal } from "@/components/SandboxModal";
import { useToast } from "@/components/ui/use-toast";
import { API_URL } from "@/config";
export default function BatchDetails() {
  const { batchId } = useParams();
  const [batch, setBatch] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creatingAssignment, setCreatingAssignment] = useState(false);
  const [currentAssignmentId, setCurrentAssignmentId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [assignment, setAssignment] = useState(null);
  
  useEffect(() => {
    const fetchBatchDetails = async () => {
      try {
        // Fetch batch details
        const batchResponse = await fetch(`${API_URL}/api/batches/${batchId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!batchResponse.ok) {
          throw new Error('Failed to fetch batch details');
        }

        const batchData = await batchResponse.json();
        
        // Normalize student data if needed
        if (batchData.students) {
          batchData.students = batchData.students.map(student => ({
            id: student._id || student.id,
            username: student.username || student.name || 'Unknown Student',
            email: student.email || 'No email'
          }));
        }
        
        setBatch(batchData);
        
        // If API already provides assignments, use those
        if (batchData.assignments && Array.isArray(batchData.assignments)) {
          setAssignments(batchData.assignments);
        } else {
          // Otherwise fetch assignments separately
          const assignmentsResponse = await fetch(`${API_URL}/api/classes/${batchData.class._id}/assignments`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          if (!assignmentsResponse.ok) {
            throw new Error('Failed to fetch assignments');
          }

          const assignmentsData = await assignmentsResponse.json();
          setAssignments(assignmentsData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (batchId) {
      fetchBatchDetails();
    }
  }, [batchId]);

  const handleViewAssignment = async (assignmentId: string) => {
    setCurrentAssignmentId(assignmentId);
    setCreatingAssignment(true);
    
    try {

      fetch(`${API_URL}/api/assignments/${assignmentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
        .then(response => response.json())
        .then(data => {
          if (data && data._id) {
            setAssignment(data);
          } else {
            setError("Assignment not found");
          }
        })
        .catch(err => {
          console.error("Error fetching assignment:", err);
          setError("Failed to load assignment");
        });
        console.log("Assignment data:", assignment);
      const response = await fetch("http://localhost:8000/create/assignment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignment_name: assignmentId,
          language: assignment.language,
          requirements: assignment.requirements, // You might want to make this dynamic based on the assignment
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Environment Ready",
          description: "Your coding sandbox has been prepared",
        });
        
        // Navigate to the assignment page
        navigate(`/assignments/${assignmentId}`);
      } else {
        throw new Error(data.detail || "Failed to create sandbox");
      }
    } catch (error) {
      console.error("Error creating sandbox:", error);
      toast({
        title: "Error",
        description: "Failed to prepare your coding environment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingAssignment(false);
      setCurrentAssignmentId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8 text-center">
        <p>Loading batch details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <Button variant="outline" asChild className="mb-4">
          <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard</Link>
        </Button>
        <div className="p-4 bg-destructive/10 rounded-md text-destructive">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="container py-8">
        <Button variant="outline" asChild className="mb-4">
          <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard</Link>
        </Button>
        <div className="p-4 bg-primary/5 rounded-md">
          <p>Batch not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Code className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">LearnIQ</span>
          </Link>
        </div>
      </header>

      <main className="container py-8">
        <Button variant="outline" asChild className="mb-6">
          <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard</Link>
        </Button>

        <div className="bg-primary/5 p-6 rounded-lg mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold">{batch.class.name}</h1>
              <p className="text-muted-foreground mt-1">{batch.class.subject}</p>
            </div>
            <Badge className="self-start md:self-center" variant="outline">
              Batch: {batch.name}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span>{batch.students.length} Students Enrolled</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span>Started {new Date(batch.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span>{batch.schedule || "Flexible Schedule"}</span>
            </div>
          </div>

          {batch.class.description && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Course Description</h3>
              <p className="text-muted-foreground">{batch.class.description}</p>
            </div>
          )}
        </div>

        <Tabs defaultValue="assignments" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
          </TabsList>
          
          <TabsContent value="assignments" className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Course Assignments</h2>
            
            {assignments.length === 0 ? (
              <div className="text-center py-12 bg-muted/20 rounded-lg">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No assignments yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  There are no assignments for this course yet. Check back later.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignments.map((assignment) => (
                  <Card key={assignment._id} className="overflow-hidden border border-border/40 hover:border-border/80 transition-all">
                    <CardHeader className="bg-muted/20 pb-3">
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      <CardDescription>
                        {assignment.modules.length} modules
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {assignment.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="mb-1">
                          {assignment.dueDate 
                            ? `Due: ${new Date(assignment.dueDate).toLocaleDateString()}` 
                            : "No due date"}
                        </Badge>
                        <Button 
                          size="sm" 
                          className="gap-1"
                          onClick={() => handleViewAssignment(assignment._id)}
                        >
                          View Assignment
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="students">
            <h2 className="text-2xl font-bold mb-4">Enrolled Students</h2>
            {batch.students && batch.students.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 font-medium px-4 py-2 bg-muted/30 rounded-t-md">
                  <div>Name</div>
                  <div>Email</div>
                  <div>Status</div>
                </div>
                {batch.students.map((student) => {
                  // Use username or fallback to a default identifier
                  const displayName = student.username || student.name || 'Student';
                  // Get initial safely
                  const initial = displayName.charAt(0).toUpperCase();
                  
                  return (
                    <div key={student._id || student.id} className="grid grid-cols-3 px-4 py-3 border-b border-border/40 hover:bg-muted/20 rounded-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                          {initial}
                        </div>
                        <span>{displayName}</span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        {student.email || 'No email provided'}
                      </div>
                      <div className="flex items-center">
                        <Badge variant="outline" className="bg-primary/5">Active</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/20 rounded-lg">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No students enrolled</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  This batch doesn't have any enrolled students yet.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-border py-6 mt-auto">
        <div class="container">
          <div class="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} LearnIQ. All rights reserved.
          </div>
        </div>
      </footer>

      <SandboxModal 
        isOpen={creatingAssignment} 
        onOpenChange={(open) => {
          if (!open) setCreatingAssignment(false);
        }} 
      />
    </div>
  );
}