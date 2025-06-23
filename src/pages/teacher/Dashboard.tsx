import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, Users, BarChart, Pencil, PlusCircle, 
  GraduationCap, Calendar, CheckCircle, Clock 
} from "lucide-react";
import { motion } from "framer-motion";
import { TeacherIndicator } from "@/components/TeacherIndicator";
import axios from "axios";

export default function TeacherDashboard() {
  const { user, token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalBatches: 0,
    activeAssignments: 0,
    pendingReviews: 0
  });
  const [error, setError] = useState("");
  
  useEffect(() => {
    // Fetch actual teacher statistics from the API
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError("");
        
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/teacher/stats`, 
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        setStats(response.data);
      } catch (err) {
        console.error("Failed to fetch teacher stats:", err);
        setError("Failed to load dashboard statistics. Please try again later.");
        // Set default values in case of error
        setStats({
          totalStudents: 0,
          totalBatches: 0,
          activeAssignments: 0,
          pendingReviews: 0
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, [token]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Pencil className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">LearnIQ Teacher</span>
          </Link>
          <div className="flex items-center gap-3">
            <TeacherIndicator />
            {/* You could add profile dropdown here */}
          </div>
        </div>
      </header>

      <main className="container py-8">
        <motion.section 
          className="relative bg-card rounded-lg border shadow-sm mb-8 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">Welcome, {user?.username || "Teacher"}</h1>
              <p className="text-muted-foreground">Here's an overview of your teaching stats</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/teacher/classrooms" className="gap-2">
                  <BookOpen className="h-4 w-4" /> Manage Classrooms
                </Link>
              </Button>
              <Button className="gap-2" >
                <Link to="/teacher/assignments/create" className="flex items-center">
                  <PlusCircle className="h-4 w-4" /> Create Assignment
                </Link>
              </Button>
            </div>
          </div>
        </motion.section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 w-24 bg-muted rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      Total Students
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalStudents}</div>
                    <p className="text-xs text-muted-foreground">Across all batches</p>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-indigo-500" />
                      Active Batches
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalBatches}</div>
                    <p className="text-xs text-muted-foreground">Currently running</p>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-green-500" />
                      Active Assignments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.activeAssignments}</div>
                    <p className="text-xs text-muted-foreground">Being worked on</p>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      Pending Reviews
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.pendingReviews}</div>
                    <p className="text-xs text-muted-foreground">Submissions awaiting feedback</p>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </div>

        <Tabs defaultValue="recent-activity" className="w-full">
          <TabsList className="grid max-w-md grid-cols-3">
            <TabsTrigger value="recent-activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recent-activity" className="py-6">
            <div className="border rounded-lg divide-y">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="p-4 animate-pulse">
                    <div className="flex gap-4 items-start">
                      <div className="h-8 w-8 bg-muted rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="p-4 hover:bg-muted/50">
                    <div className="flex gap-4 items-start">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <GraduationCap className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium"><span className="text-blue-600">Alex Johnson</span> submitted an assignment</p>
                        <p className="text-sm text-muted-foreground">JavaScript: Building a Todo App • 2 hours ago</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 hover:bg-muted/50">
                    <div className="flex gap-4 items-start">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">You graded <span className="text-green-600">5 submissions</span></p>
                        <p className="text-sm text-muted-foreground">React: Component Lifecycle • Yesterday</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 hover:bg-muted/50">
                    <div className="flex gap-4 items-start">
                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <Users className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium"><span className="text-purple-600">2 new students</span> joined your batch</p>
                        <p className="text-sm text-muted-foreground">Web Development Fundamentals • 2 days ago</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* More activity items */}
                  <div className="text-center p-4">
                    <Button variant="link">View All Activity</Button>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="upcoming" className="py-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upcoming Classes</CardTitle>
                  <CardDescription>Your scheduled teaching sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  {!isLoading && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 rounded-md border">
                        <div>
                          <p className="font-medium">Web Development Fundamentals</p>
                          <p className="text-sm text-muted-foreground">Today, 4:00 - 5:30 PM</p>
                        </div>
                        <Button size="sm" variant="outline">Start Class</Button>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 rounded-md border">
                        <div>
                          <p className="font-medium">Advanced React</p>
                          <p className="text-sm text-muted-foreground">Tomorrow, 6:00 - 7:30 PM</p>
                        </div>
                        <Button size="sm" variant="outline">View Details</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Assignment Deadlines</CardTitle>
                  <CardDescription>Upcoming student submission deadlines</CardDescription>
                </CardHeader>
                <CardContent>
                  {!isLoading && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 rounded-md border">
                        <div>
                          <p className="font-medium">JavaScript: Building a Todo App</p>
                          <p className="text-sm text-muted-foreground">Due Tomorrow • 8 submissions</p>
                        </div>
                        <Button size="sm" variant="outline">View</Button>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 rounded-md border">
                        <div>
                          <p className="font-medium">CSS: Responsive Design Challenge</p>
                          <p className="text-sm text-muted-foreground">Due in 3 days • 5 submissions</p>
                        </div>
                        <Button size="sm" variant="outline">View</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="performance" className="py-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Performance Overview</CardTitle>
                <CardDescription>Average scores and completion rates</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                {isLoading ? (
                  <div className="animate-pulse h-full w-full bg-muted rounded-md"></div>
                ) : (
                  <div className="text-center">
                    <BarChart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Performance charts will be implemented here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}