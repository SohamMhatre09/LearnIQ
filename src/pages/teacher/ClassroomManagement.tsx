import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Search, Plus, BookOpen, MoreVertical, Trash2, Users, School } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { API_URL } from "@/config";
const API_BASE_URL = `${API_URL}/api`; // Update this with your actual API URL

export default function ClassroomManagement() {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [newClassData, setNewClassData] = useState({
    name: "",
    subject: "",
    description: "",
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [newBatchData, setNewBatchData] = useState({ name: "" });
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);
  // New state for batch management
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [batches, setBatches] = useState([]);
  const [isBatchesLoading, setIsBatchesLoading] = useState(false);
  const [isBatchesDialogOpen, setIsBatchesDialogOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState(null);
  const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState(false);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchStudents, setBatchStudents] = useState([]);
  const [isStudentsDialogOpen, setIsStudentsDialogOpen] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  
  // Function to fetch teacher's classrooms
  const fetchTeacherClassrooms = async () => {
    setIsLoading(true);
    try {
      // Get auth token from localStorage or your auth context
      const token = localStorage.getItem("token");
      
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      const response = await axios.get(`${API_BASE_URL}/classes/teacher`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Transform the API response to match our component's expected format
      const transformedClassrooms = await Promise.all(response.data.map(async (classroom) => {
        // For each classroom, fetch its batches to get the count
        const batchesResponse = await axios.get(
          `${API_BASE_URL}/classes/${classroom._id}/batches`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        // Count students across all batches
        let totalStudents = 0;
        batchesResponse.data.forEach(batch => {
          totalStudents += batch.students.length;
        });
        
        return {
          id: classroom._id,
          name: classroom.name,
          subject: classroom.subject,
          description: classroom.description || "",
          batches: batchesResponse.data.length,
          students: totalStudents,
          createdAt: classroom.createdAt
        };
      }));
      
      setClassrooms(transformedClassrooms);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching classrooms:", error);
      toast({
        title: "Error",
        description: "Failed to fetch classrooms. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  // Function to fetch batches for a classroom
  const fetchClassroomBatches = async (classId) => {
    setIsBatchesLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      const response = await axios.get(
        `${API_BASE_URL}/classes/${classId}/batches`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setBatches(response.data);
      setIsBatchesLoading(false);
    } catch (error) {
      console.error("Error fetching batches:", error);
      toast({
        title: "Error",
        description: "Failed to fetch batches. Please try again.",
        variant: "destructive",
      });
      setIsBatchesLoading(false);
    }
  };

  // Function to fetch batch details including students
  const fetchBatchStudents = async (batchId) => {
    setIsLoadingStudents(true);
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      const response = await axios.get(
        `${API_BASE_URL}/batches/${batchId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setBatchStudents(response.data.students || []);
      setIsLoadingStudents(false);
    } catch (error) {
      console.error("Error fetching batch students:", error);
      toast({
        title: "Error",
        description: "Failed to fetch students. Please try again.",
        variant: "destructive",
      });
      setIsLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchTeacherClassrooms();
  }, []);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setIsCreatingClass(true);
    
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      const response = await axios.post(
        `${API_BASE_URL}/classes`,
        newClassData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Add the new class to our state
      const newClass = {
        id: response.data.class._id,
        name: response.data.class.name,
        subject: response.data.class.subject,
        description: response.data.class.description || "",
        batches: 0,
        students: 0,
        createdAt: response.data.class.createdAt,
      };
      
      setClassrooms([newClass, ...classrooms]);
      setNewClassData({ name: "", subject: "", description: "" });
      setIsDialogOpen(false);
      
      toast({
        title: "Success",
        description: "New classroom created successfully!",
      });
    } catch (error) {
      console.error("Error creating classroom:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create classroom. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingClass(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!classToDelete) return;
    
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      await axios.delete(`${API_BASE_URL}/classes/${classToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const updatedClassrooms = classrooms.filter(classroom => classroom.id !== classToDelete);
      setClassrooms(updatedClassrooms);
      
      toast({
        title: "Success",
        description: "Classroom deleted successfully!",
      });
    } catch (error) {
      console.error("Error deleting classroom:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete classroom. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setClassToDelete(null);
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!selectedClass) return;
    
    setIsCreatingBatch(true);
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      const response = await axios.post(
        `${API_BASE_URL}/batches`,
        {
          name: newBatchData.name,
          classId: selectedClass
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Update the classroom in our state to increment batch count
      const updatedClassrooms = classrooms.map(classroom => {
        if (classroom.id === selectedClass) {
          return {
            ...classroom,
            batches: classroom.batches + 1
          };
        }
        return classroom;
      });
      
      setClassrooms(updatedClassrooms);
      setNewBatchData({ name: "" });
      setIsBatchDialogOpen(false);
      
      toast({
        title: "Success",
        description: "New batch created successfully! Enrollment code: " + response.data.batch.enrollmentCode,
      });
    } catch (error) {
      console.error("Error creating batch:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create batch. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBatch(false);
    }
  };

  // Function to delete a batch
  const handleDeleteBatch = async () => {
    if (!batchToDelete) return;
    
    setIsDeletingBatch(true);
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      await axios.delete(`${API_BASE_URL}/batches/${batchToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Remove deleted batch from state
      const updatedBatches = batches.filter(batch => batch._id !== batchToDelete);
      setBatches(updatedBatches);
      
      // Update classroom batch count
      const updatedClassrooms = classrooms.map(classroom => {
        if (classroom.id === selectedClassId) {
          return {
            ...classroom,
            batches: classroom.batches - 1
          };
        }
        return classroom;
      });
      
      setClassrooms(updatedClassrooms);
      
      toast({
        title: "Success",
        description: "Batch deleted successfully!",
      });
    } catch (error) {
      console.error("Error deleting batch:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete batch. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingBatch(false);
      setIsBatchDeleteDialogOpen(false);
      setBatchToDelete(null);
    }
  };

  const handleViewBatches = (classId) => {
    setSelectedClassId(classId);
    fetchClassroomBatches(classId);
    setIsBatchesDialogOpen(true);
  };

  const handleViewBatchStudents = (batch) => {
    setSelectedBatch(batch);
    fetchBatchStudents(batch._id);
    setIsStudentsDialogOpen(true);
  };

  const filteredClassrooms = classrooms.filter(classroom => 
    classroom.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    classroom.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    classroom.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container h-16 flex items-center justify-between">
          <Link to="/teacher/dashboard" className="flex items-center gap-2">
            <Pencil className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">LearnIQ Teacher</span>
          </Link>
          {/* Could add more header elements here */}
        </div>
      </header>

      <main className="container py-8">
        <motion.div 
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl font-bold mb-1">Manage Classrooms</h1>
            <p className="text-muted-foreground">Create and manage your teaching classrooms</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Create New Classroom
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Classroom</DialogTitle>
                <DialogDescription>
                  Add details for your new classroom. You can add batches to this classroom later.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateClass}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="className">Classroom Name</Label>
                    <Input 
                      id="className" 
                      value={newClassData.name}
                      onChange={(e) => setNewClassData({...newClassData, name: e.target.value})}
                      placeholder="e.g., Web Development"
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input 
                      id="subject" 
                      value={newClassData.subject}
                      onChange={(e) => setNewClassData({...newClassData, subject: e.target.value})}
                      placeholder="e.g., Computer Science"
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      value={newClassData.description}
                      onChange={(e) => setNewClassData({...newClassData, description: e.target.value})}
                      placeholder="Brief description of the classroom"
                      rows={3}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreatingClass}>
                    {isCreatingClass ? "Creating..." : "Create Classroom"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          {/* Batch Creation Dialog */}
          <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Batch</DialogTitle>
                <DialogDescription>
                  Add a new batch to the selected classroom. Students will be able to join using the generated enrollment code.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateBatch}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="batchName">Batch Name</Label>
                    <Input 
                      id="batchName" 
                      value={newBatchData.name}
                      onChange={(e) => setNewBatchData({...newBatchData, name: e.target.value})}
                      placeholder="e.g., Morning Batch 2024"
                      required
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsBatchDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreatingBatch}>
                    {isCreatingBatch ? "Creating..." : "Create Batch"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Batches Management Dialog */}
          <Dialog open={isBatchesDialogOpen} onOpenChange={setIsBatchesDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Manage Batches</DialogTitle>
                <DialogDescription>
                  View and manage batches for this classroom
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                {isBatchesLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  </div>
                ) : batches.length > 0 ? (
                  <div className="space-y-4">
                    {batches.map((batch) => (
                      <Card key={batch._id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{batch.name}</CardTitle>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleViewBatchStudents(batch)}
                                >
                                  View Students
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => {
                                    setBatchToDelete(batch._id);
                                    setIsBatchDeleteDialogOpen(true);
                                  }}
                                >
                                  Delete Batch
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{batch.students?.length || 0} Students</span>
                          </div>
                          <div className="mt-2 text-sm">
                            <span className="font-medium">Enrollment Code: </span> 
                            <span className="font-mono bg-muted px-1 py-0.5 rounded text-xs">{batch.enrollmentCode}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No batches found for this classroom</p>
                    <Button 
                      onClick={() => {
                        setSelectedClass(selectedClassId);
                        setIsBatchDialogOpen(true);
                        setIsBatchesDialogOpen(false);
                      }}
                    >
                      Create Batch
                    </Button>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBatchesDialogOpen(false)}>
                  Close
                </Button>
                {batches.length > 0 && (
                  <Button 
                    onClick={() => {
                      setSelectedClass(selectedClassId);
                      setIsBatchDialogOpen(true);
                      setIsBatchesDialogOpen(false);
                    }}
                  >
                    Add New Batch
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Student List Dialog */}
          <Dialog open={isStudentsDialogOpen} onOpenChange={setIsStudentsDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Batch Students</DialogTitle>
                <DialogDescription>
                  {selectedBatch ? `Students enrolled in ${selectedBatch.name}` : "Student list"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                {isLoadingStudents ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  </div>
                ) : batchStudents.length > 0 ? (
                  <div className="border rounded-md">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="py-2 px-4 text-left font-medium text-sm">Name</th>
                          <th className="py-2 px-4 text-left font-medium text-sm">Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batchStudents.map((student, index) => (
                          <tr key={student.id} className={`${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}`}>
                            <td className="py-2 px-4 text-sm">{student.name}</td>
                            <td className="py-2 px-4 text-sm text-muted-foreground">{student.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No students enrolled in this batch yet</p>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button onClick={() => setIsStudentsDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search classrooms..."
              className="pl-9 w-full md:max-w-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <AnimatePresence>
          {isLoading ? (
            <motion.div 
              className="flex justify-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </motion.div>
          ) : (
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Tabs defaultValue="all">
                <TabsList className="mb-6">
                  <TabsTrigger value="all">All Classrooms</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="archived">Archived</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  {filteredClassrooms.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredClassrooms.map((classroom) => (
                        <motion.div
                          key={classroom.id}
                          whileHover={{ y: -5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <Card className="h-full flex flex-col">
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <CardTitle>{classroom.name}</CardTitle>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <Link to={`/teacher/classrooms/${classroom.id}/edit`}>Edit Classroom</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedClass(classroom.id);
                                        setIsBatchDialogOpen(true);
                                      }}
                                    >
                                      Add Batch
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleViewBatches(classroom.id)}
                                    >
                                      Manage Batches
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="text-destructive"
                                      onClick={() => {
                                        setClassToDelete(classroom.id);
                                        setIsDeleteDialogOpen(true);
                                      }}
                                    >
                                      Delete Classroom
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <CardDescription>{classroom.subject}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                              <p className="text-sm text-muted-foreground mb-4">
                                {classroom.description}
                              </p>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{classroom.students} Students</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{classroom.batches} Batches</span>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter>
                              <Button asChild variant="outline" className="w-full">
                                <Link to={`/teacher/classrooms/${classroom.id}`}>Manage Classroom</Link>
                              </Button>
                            </CardFooter>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                        <School className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No classrooms found</h3>
                      <p className="text-muted-foreground max-w-md mx-auto mb-6">
                        {searchQuery ? "No classrooms match your search query" : "You haven't created any classrooms yet"}
                      </p>
                      <Button onClick={() => setIsDialogOpen(true)}>
                        Create Your First Classroom
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                {/* Similar content for other tabs */}
                <TabsContent value="active">
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Active classrooms view</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="archived">
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Archived classrooms view</p>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Delete Confirmation Dialog for Classroom */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this classroom?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Deleting this classroom will remove all associated batches,
              assignments, and student enrollments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteClass}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Classroom"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog for Batch */}
      <AlertDialog open={isBatchDeleteDialogOpen} onOpenChange={setIsBatchDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this batch?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Deleting this batch will remove all student enrollments.
              Students will no longer have access to this class.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteBatch}
              disabled={isDeletingBatch}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingBatch ? "Deleting..." : "Delete Batch"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}