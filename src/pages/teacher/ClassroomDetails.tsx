import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Search, Plus, ArrowLeft, Copy, BookOpen, Users, MoreVertical, Calendar, FileText, Code } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { API_URL } from "@/config";
const API_BASE_URL = `${API_URL}/api`; // Update this with your actual API URL

export default function ClassroomDetails() {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [classroom, setClassroom] = useState(null);
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingClassroom, setIsEditingClassroom] = useState(false);
  const [editedClassroomData, setEditedClassroomData] = useState({
    name: "",
    subject: "",
    description: "",
  });
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);
  const [newBatchData, setNewBatchData] = useState({
    name: "",
    schedule: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isEditBatchDialogOpen, setIsEditBatchDialogOpen] = useState(false);
  const [editedBatchData, setEditedBatchData] = useState({ name: "" });
  const [isEditingBatch, setIsEditingBatch] = useState(false);
  const [isViewStudentsDialogOpen, setIsViewStudentsDialogOpen] = useState(false);
  const [batchStudents, setBatchStudents] = useState([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  // Assignment List Section
  const [assignments, setAssignments] = useState([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

  // Function to fetch classroom details
  const fetchClassroomDetails = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      // Fetch classroom details
      const classroomResponse = await axios.get(`${API_BASE_URL}/classes/${classroomId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Fetch batches for this classroom
      const batchesResponse = await axios.get(
        `${API_BASE_URL}/classes/${classroomId}/batches`, 
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Count total students across all batches
      let totalStudents = 0;
      batchesResponse.data.forEach(batch => {
        totalStudents += batch.students.length;
      });
      
      // Transform classroom data to match component expectations
      const classroomData = {
        id: classroomResponse.data._id,
        name: classroomResponse.data.name,
        subject: classroomResponse.data.subject,
        description: classroomResponse.data.description || "",
        studentsCount: totalStudents,
        createdAt: classroomResponse.data.createdAt
      };
      
      // Transform batches data to match component expectations
      const batchesData = batchesResponse.data.map(batch => ({
        id: batch._id,
        name: batch.name,
        schedule: "", // API doesn't have schedule field currently
        enrollmentCode: batch.enrollmentCode,
        studentsCount: batch.students.length,
        createdAt: batch.createdAt
      }));
      
      setClassroom(classroomData);
      setBatches(batchesData);
      
      // Set initial edit form values
      setEditedClassroomData({
        name: classroomData.name,
        subject: classroomData.subject,
        description: classroomData.description,
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching classroom details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch classroom details. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      // Redirect to classroom list if there's an error (probably classroom not found)
      navigate("/teacher/classrooms");
    }
  };

  // Fetch assignments for this classroom
  const fetchAssignments = async () => {
    if (!classroomId) return;
    
    setIsLoadingAssignments(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const response = await axios.get(
        `${API_BASE_URL}/classes/${classroomId}/assignments`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setAssignments(response.data);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast({
        title: "Error",
        description: "Failed to fetch assignments",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  useEffect(() => {
    if (classroomId) {
      fetchClassroomDetails();
    }
  }, [classroomId, navigate]);

  useEffect(() => {
    if (classroomId && !isLoading) {
      fetchAssignments();
    }
  }, [classroomId, isLoading]);

  const handleCreateBatch = async (e) => {
    e.preventDefault();
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
          classId: classroomId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Add the new batch to our state
      const newBatch = {
        id: response.data.batch._id,
        name: response.data.batch.name,
        schedule: "", // API doesn't support schedule currently
        enrollmentCode: response.data.batch.enrollmentCode,
        studentsCount: 0,
        createdAt: response.data.batch.createdAt,
      };
      
      setBatches([...batches, newBatch]);
      setNewBatchData({ name: "", schedule: "" });
      setIsDialogOpen(false);
      
      toast({
        title: "Success",
        description: "New batch created successfully!",
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
  
  const handleUpdateClassroom = async (e) => {
    e.preventDefault();
    setIsEditingClassroom(true);
    
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      const response = await axios.put(
        `${API_BASE_URL}/classes/${classroomId}`,
        editedClassroomData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Update the classroom in our state
      setClassroom({
        ...classroom,
        name: editedClassroomData.name,
        subject: editedClassroomData.subject,
        description: editedClassroomData.description,
      });
      
      setIsEditDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Classroom updated successfully!",
      });
    } catch (error) {
      console.error("Error updating classroom:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update classroom. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEditingClassroom(false);
    }
  };

  const handleDeleteBatch = async () => {
    if (!batchToDelete) return;
    
    setIsDeleting(true);
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
      
      // Remove the batch from our state
      const updatedBatches = batches.filter(batch => batch.id !== batchToDelete);
      setBatches(updatedBatches);
      
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
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setBatchToDelete(null);
    }
  };

  const handleEditBatch = (batch) => {
    setSelectedBatch(batch);
    setEditedBatchData({ name: batch.name });
    setIsEditBatchDialogOpen(true);
  };

  const handleUpdateBatch = async (e) => {
    e.preventDefault();
    if (!selectedBatch) return;
    
    setIsEditingBatch(true);
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      await axios.put(
        `${API_BASE_URL}/batches/${selectedBatch.id}`,
        { name: editedBatchData.name },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Update the batch in our state
      const updatedBatches = batches.map(batch => 
        batch.id === selectedBatch.id 
          ? { ...batch, name: editedBatchData.name }
          : batch
      );
      
      setBatches(updatedBatches);
      setIsEditBatchDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Batch updated successfully!",
      });
    } catch (error) {
      console.error("Error updating batch:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update batch. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEditingBatch(false);
    }
  };

  const handleViewBatchStudents = async (batch) => {
    setSelectedBatch(batch);
    setIsLoadingStudents(true);
    
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      const response = await axios.get(
        `${API_BASE_URL}/batches/${batch.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setBatchStudents(response.data.students || []);
      setIsViewStudentsDialogOpen(true);
    } catch (error) {
      console.error("Error fetching batch students:", error);
      toast({
        title: "Error",
        description: "Failed to fetch students. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleCopyEnrollmentCode = (code) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Enrollment code copied to clipboard",
    });
  };

  const filteredBatches = batches.filter(batch => 
    batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (batch.schedule && batch.schedule.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container h-16 flex items-center justify-between">
            <Link to="/teacher/classrooms" className="flex items-center gap-2">
              <Pencil className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">LearnIQ Teacher</span>
            </Link>
          </div>
        </header>

        <main className="container py-8">
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container h-16 flex items-center justify-between">
          <Link to="/teacher/classrooms" className="flex items-center gap-2">
            <Pencil className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">CodeLearn Teacher</span>
          </Link>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-8">
          <Button variant="outline" asChild className="mb-4">
            <Link to="/teacher/classrooms">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Classrooms
            </Link>
          </Button>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-1">{classroom?.name}</h1>
              <p className="text-muted-foreground">{classroom?.subject}</p>
            </div>
            
            <div className="flex gap-2">
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Pencil className="h-4 w-4" /> Edit Classroom
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Classroom</DialogTitle>
                    <DialogDescription>
                      Update the details for this classroom.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleUpdateClassroom}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="editClassName">Classroom Name</Label>
                        <Input 
                          id="editClassName" 
                          value={editedClassroomData.name}
                          onChange={(e) => setEditedClassroomData({...editedClassroomData, name: e.target.value})}
                          placeholder="e.g., Web Development"
                          required
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="editSubject">Subject</Label>
                        <Input 
                          id="editSubject" 
                          value={editedClassroomData.subject}
                          onChange={(e) => setEditedClassroomData({...editedClassroomData, subject: e.target.value})}
                          placeholder="e.g., Computer Science"
                          required
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="editDescription">Description</Label>
                        <Textarea 
                          id="editDescription" 
                          value={editedClassroomData.description}
                          onChange={(e) => setEditedClassroomData({...editedClassroomData, description: e.target.value})}
                          placeholder="Brief description of the classroom"
                          rows={3}
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isEditingClassroom}>
                        {isEditingClassroom ? "Updating..." : "Update Classroom"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="bg-muted/20 p-6 rounded-lg">
            <div className="flex flex-col md:flex-row gap-6 justify-between mb-4">
              <div className="max-w-2xl">
                <h3 className="text-lg font-medium mb-2">Description</h3>
                <p className="text-muted-foreground">{classroom?.description}</p>
              </div>
              
              <div className="shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{classroom?.studentsCount} Students Total</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span>{batches.length} Batches</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-1">Manage Batches</h2>
            <p className="text-muted-foreground">Create and manage batches for this classroom</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Create New Batch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Batch</DialogTitle>
                <DialogDescription>
                  Add details for your new batch. Students will use the automatically generated enrollment code to join.
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
                      placeholder="e.g., Morning Batch"
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="schedule">Schedule (Optional)</Label>
                    <Input 
                      id="schedule" 
                      value={newBatchData.schedule}
                      onChange={(e) => setNewBatchData({...newBatchData, schedule: e.target.value})}
                      placeholder="e.g., Mon, Wed, Fri 9:00-10:30 AM"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreatingBatch}>
                    {isCreatingBatch ? "Creating..." : "Create Batch"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search batches..."
              className="pl-9 w-full md:max-w-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <AnimatePresence>
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {filteredBatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBatches.map((batch) => (
                  <motion.div
                    key={batch.id}
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Card className="h-full flex flex-col">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle>{batch.name}</CardTitle>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditBatch(batch)}>
                                Edit Batch
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewBatchStudents(batch)}>
                                View Students
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => {
                                  setBatchToDelete(batch.id);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                Delete Batch
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <CardDescription>Created on {new Date(batch.createdAt).toLocaleDateString()}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{batch.studentsCount} Students</span>
                          </div>
                          {batch.schedule && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{batch.schedule}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
                            <span className="text-sm font-medium">Enrollment Code:</span>
                            <code className="text-sm bg-background px-1 py-0.5 rounded">
                              {batch.enrollmentCode}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 ml-auto"
                              onClick={() => handleCopyEnrollmentCode(batch.enrollmentCode)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" className="w-full" onClick={() => handleViewBatchStudents(batch)}>
                          View Students
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No batches found</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  {searchQuery ? "No batches match your search query" : "You haven't created any batches for this classroom yet"}
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  Create Your First Batch
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Assignment Management Section */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Manage Assignments</h2>
              <p className="text-muted-foreground">Create and manage assignments for this classroom</p>
            </div>
            
            <Button asChild className="gap-2">
              <Link to={`/teacher/assignments/create?classId=${classroomId}`}>
                <Plus className="h-4 w-4" /> Create New Assignment
              </Link>
            </Button>
          </div>

          {/* Assignment List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {isLoadingAssignments ? (
              <div className="col-span-full flex justify-center py-8">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : assignments.length > 0 ? (
              <>
                {assignments.map((assignment) => (
                  <Card key={assignment._id} className="relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="line-clamp-1">{assignment.title}</CardTitle>
                        <div className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-medium">
                          {assignment.language}
                        </div>
                      </div>
                      <CardDescription>
                        Created: {new Date(assignment.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-2 text-muted-foreground mb-2">{assignment.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Code className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{assignment.modules.length} Modules</span>
                      </div>
                      {assignment.requirements && assignment.requirements.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {assignment.requirements.slice(0, 3).map((req, index) => (
                            <span key={index} className="bg-secondary/30 text-xs px-1.5 py-0.5 rounded">
                              {req}
                            </span>
                          ))}
                          {assignment.requirements.length > 3 && (
                            <span className="bg-secondary/30 text-xs px-1.5 py-0.5 rounded">
                              +{assignment.requirements.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="ghost" asChild>
                        <Link to={`/teacher/assignments/${assignment._id}`}>View Details</Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link to={`/teacher/assignments/${assignment._id}/edit`}>
                          <FileText className="h-4 w-4 mr-2" /> Edit
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}

                <Card className="h-full flex flex-col justify-center items-center p-6 border-dashed">
                  <div className="rounded-full bg-primary/10 p-3 mb-4">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium mb-2">Create Assignment</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Add another coding assignment for your students
                  </p>
                  <Button asChild>
                    <Link to={`/teacher/assignments/create?classId=${classroomId}`}>
                      Create Assignment
                    </Link>
                  </Button>
                </Card>
              </>
            ) : (
              <>
                <Card className="h-full flex flex-col justify-center items-center p-6 border-dashed">
                  <div className="rounded-full bg-primary/10 p-3 mb-4">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium mb-2">Create Assignment</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Add coding assignments for your students
                  </p>
                  <Button asChild>
                    <Link to={`/teacher/assignments/create?classId=${classroomId}`}>
                      Get Started
                    </Link>
                  </Button>
                </Card>
              </>
            )}
          </div>
        </div>
      </main>
      
      {/* Edit Batch Dialog */}
      <Dialog open={isEditBatchDialogOpen} onOpenChange={setIsEditBatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Batch</DialogTitle>
            <DialogDescription>
              Update the details for this batch.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdateBatch}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="editBatchName">Batch Name</Label>
                <Input 
                  id="editBatchName" 
                  value={editedBatchData.name}
                  onChange={(e) => setEditedBatchData({...editedBatchData, name: e.target.value})}
                  placeholder="e.g., Morning Batch"
                  required
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditBatchDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isEditingBatch}>
                {isEditingBatch ? "Updating..." : "Update Batch"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Students Dialog */}
      <Dialog open={isViewStudentsDialogOpen} onOpenChange={setIsViewStudentsDialogOpen}>
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
            <Button onClick={() => setIsViewStudentsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this batch?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Deleting this batch will remove all student enrollments
              and assignments associated with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteBatch}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Batch"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}