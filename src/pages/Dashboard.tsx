import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { AssignmentList } from "@/components/AssignmentList";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Code, Layers, BookOpen, User, ArrowRight, BookOpenCheck, Users, Sparkles, Plus } from "lucide-react";
import { AuthNav } from "@/components/AuthNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { API_URL } from "@/config";
// Add import for AlertDialog components
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
// Add import for DropdownMenu components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
// Add framer-motion for animations
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

// Enhanced animated greeting component with particle effects
function AnimatedGreeting({ displayText }) {
  const [typingComplete, setTypingComplete] = useState(false);
  const [textIndex, setTextIndex] = useState(0);
  
  // Reset animation when displayText changes
  useEffect(() => {
    setTextIndex(0);
    setTypingComplete(false);
  }, [displayText]);
  
  // Faster, smoother typing animation effect
  useEffect(() => {
    if (textIndex < displayText.length && !typingComplete) {
      const typingTimer = setTimeout(() => {
        setTextIndex(prevIndex => prevIndex + 1);
      }, 20);
      
      return () => clearTimeout(typingTimer);
    } else if (textIndex >= displayText.length) {
      setTypingComplete(true);
    }
  }, [textIndex, displayText, typingComplete]);
  
  return (
    <motion.h1 
      className="text-3xl font-bold tracking-tight relative"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {displayText.substring(0, textIndex)}
      {/* Add cursor effect */}
      {!typingComplete && (
        <motion.span 
          className="inline-block w-[2px] h-[1.2em] bg-yellow-400 ml-1 align-middle"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
      {typingComplete && (
        <motion.span 
          className="absolute -right-8 top-0 text-primary"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
        >
          ✨
        </motion.span>
      )}
    </motion.h1>
  );
}

// New component for floating particles around important elements
function ParticleEffect({ className }) {
  return (
    <div className={`absolute pointer-events-none ${className}`}>
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-yellow-400/20 w-1.5 h-1.5"
          initial={{ 
            x: Math.random() * 40 - 20, 
            y: Math.random() * 40 - 20, 
            opacity: 0 
          }}
          animate={{ 
            x: Math.random() * 80 - 40,
            y: Math.random() * 80 - 40,
            opacity: [0, 0.8, 0]
          }}
          transition={{ 
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            repeatType: "reverse",
            delay: Math.random() * 2
          }}
        />
      ))}
    </div>
  );
}

// Card entrance animation
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ 
    opacity: 1, 
    y: 0,
    transition: { 
      delay: i * 0.1,
      duration: 0.5,
      type: "spring",
      damping: 12
    }
  })
};

export default function Dashboard() {
  const [greeting, setGreeting] = useState("");
  const [motivationalMsg, setMotivationalMsg] = useState("");
  const [displayText, setDisplayText] = useState("");
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [enrolledBatches, setEnrolledBatches] = useState([]);
  const [studentAssignments, setStudentAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enrollmentCode, setEnrollmentCode] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false);
  const [isLeavingBatch, setIsLeavingBatch] = useState(false);
  const [selectedBatchToLeave, setSelectedBatchToLeave] = useState(null);
  const [leaveBatchDialogOpen, setLeaveBatchDialogOpen] = useState(false);
  
  // Ref for scroll animations
  const scrollRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end start"]
  });
  
  // Transform values for scroll-based animations
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const headerScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.98]);

  useEffect(() => {
    // Set greeting based on time of day
    const setTimeBasedGreeting = () => {
      const hour = new Date().getHours();
      const greetings = [
        "Level up your coding skills!",
        "Let's build something fire today!",
        "Code mode: activated!",
        "Main character energy today!",
        "Coding projects? Let's slay!",
        "These skills? Absolutely elite!",
        "Time to cook up some code!",
        "Build something legendary now!",
        "Your code? Immaculate vibes!",
        "Creating the future, frfr."
      ];
      
      let timeGreeting = "";
      if (hour < 12) {
        timeGreeting = "Good morning!";
      } else if (hour < 17) {
        timeGreeting = "Good afternoon!";
      } else {
        timeGreeting = "Good evening!";
      }
      
      // Select a random encouraging message
      const randomIndex = Math.floor(Math.random() * greetings.length);
      setGreeting(timeGreeting);
      setMotivationalMsg(greetings[randomIndex]);
      
      // Create combined message for animation
      const combinedMessage = `${timeGreeting} ${greetings[randomIndex]}`;
      setDisplayText(combinedMessage);
    };

    setTimeBasedGreeting();

    // Fetch enrolled batches
    const fetchEnrolledBatches = async () => {
      try {
        const response = await fetch(`${API_URL}/api/batches/enrolled`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setEnrolledBatches(data);
        }
      } catch (error) {
        console.error('Error fetching enrolled batches:', error);
      }
    };

    // Fetch student assignments
    const fetchStudentAssignments = async () => {
      try {
        const response = await fetch(`${API_URL}/api/student/assignments`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setStudentAssignments(data);
        }
      } catch (error) {
        console.error('Error fetching student assignments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnrolledBatches();
    fetchStudentAssignments();
  }, [refreshKey]); // Add refreshKey as a dependency

  // Calculate pending assignments
  const pendingAssignments = studentAssignments.filter(
    assignment => !assignment.submitted
  ).length;

  // Add function to handle batch enrollment
  const handleEnrollBatch = async () => {
    if (!enrollmentCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter an enrollment code",
        variant: "destructive"
      });
      return;
    }

    setIsEnrolling(true);
    try {
      const response = await fetch(`${API_URL}/api/batches/enroll` , {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ enrollmentCode })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success!",
          description: data.message || "Successfully enrolled in the batch",
        });
        // Close dialog and refresh data
        setEnrollmentDialogOpen(false);
        setEnrollmentCode("");
        setRefreshKey(Date.now()); // This will trigger a re-fetch
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to enroll in batch",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error enrolling in batch:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  // Add function to handle leaving a batch
  const handleLeaveBatch = async () => {
    if (!selectedBatchToLeave) return;
    
    setIsLeavingBatch(true);
    try {
      const response = await fetch(`${API_URL}/api/batches/${selectedBatchToLeave}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success!",
          description: data.message || "Successfully left the batch",
        });
        // Close dialog and refresh data
        setLeaveBatchDialogOpen(false);
        setSelectedBatchToLeave(null);
        setRefreshKey(Date.now()); // This will trigger a re-fetch
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to leave batch",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error leaving batch:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLeavingBatch(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" ref={scrollRef}>
      <motion.header 
        className="border-b border-border sticky top-0 z-50 backdrop-blur-sm"
        style={{ opacity: headerOpacity, scale: headerScale }}
      >
        <div className="container h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Code className="h-6 w-6 text-primary" />
            </motion.div>
            <span className="font-semibold text-lg">LearnIQ</span>
          </Link>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6">
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
              >
                <Link to="/" className="text-sm font-medium animate-hover hover:text-primary">
                  Dashboard
                </Link>
              </motion.div>
              <motion.div 
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
              >
                <Link to="/progress" className="text-sm font-medium text-muted-foreground animate-hover hover:text-foreground">
                  My Progress
                </Link>
              </motion.div>
            </nav>
            <Separator orientation="vertical" className="h-6 hidden md:block" />
            <ThemeToggle />
            <AuthNav />
          </div>
        </div>
      </motion.header>

      <main className="flex-1">
        <motion.section 
          className="bg-yellow-400/5 dark:bg-yellow-400/10 py-10 border-b border-border relative overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="container relative">
            <ParticleEffect className="inset-0" />
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-1">
                <motion.div
                  animate={{ 
                    rotate: [0, 15, -15, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2.5, 
                    repeat: Infinity,
                    repeatType: "reverse", 
                    ease: "easeInOut" 
                  }}
                >
                  <Sparkles className="h-5 w-5 text-primary" />
                </motion.div>
                <AnimatedGreeting key={refreshKey} displayText={displayText} />
              </div>
              <motion.div 
                className="flex items-center text-sm text-muted-foreground mt-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <span className="inline-flex items-center">
                  <BookOpen className="h-4 w-4 mr-1" />
                  {pendingAssignments} pending assignments
                </span>
                <span className="mx-2">•</span>
                <span className="inline-flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {enrolledBatches.length} enrolled courses
                </span>
              </motion.div>
            </div>
          </div>
          
          {/* Gradient animated overlay */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/10 opacity-50"
            animate={{ x: ['0%', '100%', '0%'] }}
            transition={{ duration: 15, ease: "linear", repeat: Infinity }}
          />
        </motion.section>

        <section className="container py-8">
          <Tabs defaultValue="batches" className="w-full">
            <div className="flex justify-between items-center mb-6">
              <TabsList className="grid max-w-md grid-cols-2">
                <TabsTrigger value="batches">My Batches</TabsTrigger>
                <TabsTrigger value="assignments">
                  Assignments
                  {pendingAssignments > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 300, 
                        damping: 10 
                      }}
                    >
                      <Badge variant="destructive" className="ml-2">
                        {pendingAssignments}
                      </Badge>
                    </motion.div>
                  )}
                </TabsTrigger>
              </TabsList>
              
              {/* Join Batch button with hover effect */}
              <Dialog open={enrollmentDialogOpen} onOpenChange={setEnrollmentDialogOpen}>
                <DialogTrigger asChild>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="sm" className="gap-1">
                      <Plus className="h-4 w-4" /> Join Batch
                    </Button>
                  </motion.div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Join a Batch</DialogTitle>
                    <DialogDescription>
                      Enter the enrollment code provided by your instructor to join a batch.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="enrollmentCode">Enrollment Code</Label>
                      <Input
                        id="enrollmentCode"
                        placeholder="Enter code (e.g., ABC123)"
                        value={enrollmentCode}
                        onChange={(e) => setEnrollmentCode(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="secondary" 
                      onClick={() => setEnrollmentDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleEnrollBatch} 
                      disabled={isEnrolling}
                    >
                      {isEnrolling ? "Joining..." : "Join Batch"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <TabsContent value="batches" className="pt-2">
              <AnimatePresence>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {isLoading ? (
                    <motion.div
                      className="col-span-full flex justify-center py-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full"
                      />
                    </motion.div>
                  ) : enrolledBatches.length > 0 ? (
                    enrolledBatches.map((batch, index) => (
                      <motion.div
                        key={batch._id}
                        custom={index}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      >
                        <Card className="overflow-hidden border border-border/40 hover:border-border/80 transition-all h-full">
                          <CardHeader className="bg-primary/5 dark:bg-primary/10 pb-3">
                            <CardTitle className="text-lg">{batch.class.name}</CardTitle>
                            <CardDescription>
                              {batch.class.subject} • Teacher: {batch.class.teacher.username}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {batch.students.length} students enrolled
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <Badge variant="outline" className="mb-1">
                                {batch.schedule || "Flexible Schedule"}
                              </Badge>
                              <div className="flex gap-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                      <span className="sr-only">More options</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem 
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => {
                                        setSelectedBatchToLeave(batch._id);
                                        setLeaveBatchDialogOpen(true);
                                      }}
                                    >
                                      Opt out from batch
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Button size="sm" asChild variant="secondary" className="gap-1">
                                    <Link to={`/batches/${batch._id}`}>
                                      View Details <ArrowRight className="h-3 w-3" />
                                    </Link>
                                  </Button>
                                </motion.div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div 
                      className="col-span-full text-center py-10"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                    >
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                      >
                        <BookOpen className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                      </motion.div>
                      <h3 className="text-lg font-medium mb-2">No batches found</h3>
                      <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                        You're not enrolled in any batches yet.
                      </p>
                      <motion.div 
                        whileHover={{ scale: 1.05 }} 
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button asChild size="sm">
                          <Link to="/available-batches">Browse Available Batches</Link>
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </div>
              </AnimatePresence>
            </TabsContent>
            
            <TabsContent value="assignments" className="pt-2">
              <div className="space-y-4">
                {isLoading ? (
                  <motion.div
                    className="flex justify-center py-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full"
                    />
                  </motion.div>
                ) : studentAssignments.length > 0 ? (
                  studentAssignments.map((item, index) => (
                    <motion.div
                      key={item._id}
                      custom={index}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover={{ y: -3, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    >
                      <Card className="border border-border/40 hover:border-border/80 transition-all">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{item.assignment.title}</CardTitle>
                              <CardDescription>
                                {item.assignment.class.name} • {item.assignment.class.subject}
                              </CardDescription>
                            </div>
                            <motion.div
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.3 + index * 0.1 }}
                            >
                              <Badge variant={item.submitted ? "success" : "destructive"}>
                                {item.submitted ? "Submitted" : "Pending"}
                              </Badge>
                            </motion.div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm mb-3 line-clamp-2">
                            {item.assignment.description}
                          </p>
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Due:</span>{" "}
                              {new Date(item.assignment.dueDate).toLocaleDateString()}
                            </div>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button size="sm" asChild variant={item.submitted ? "outline" : "default"} className="gap-1">
                                <Link to={`/assignments/${item.assignment._id}`}>
                                  {item.submitted ? "View Submission" : "Start Working"} <ArrowRight className="h-3 w-3" />
                                </Link>
                              </Button>
                            </motion.div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <motion.div 
                    className="text-center py-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ 
                        delay: 0.2, 
                        duration: 0.5,
                        type: "spring",
                        stiffness: 200
                      }}
                    >
                      <BookOpenCheck className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                    </motion.div>
                    <h3 className="text-lg font-medium mb-2">All caught up!</h3>
                    <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                      You don't have any assignments right now.
                    </p>
                  </motion.div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>

      <motion.footer 
        className="border-t border-border py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Code className="h-5 w-5 text-primary" />
            </motion.div>
            <span className="font-medium">LearnIQ</span>
          </div>
          <div className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} LearnIQ. All rights reserved.
          </div>
        </div>
      </motion.footer>

      {/* Add this AlertDialog component at the end of your JSX, before closing the main div */}
      <AlertDialog open={leaveBatchDialogOpen} onOpenChange={setLeaveBatchDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to leave this batch?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Leaving the batch will remove you from the
              class and delete all your assignments and progress related to this batch.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLeaveBatch}
              disabled={isLeavingBatch}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLeavingBatch ? "Leaving..." : "Yes, leave batch"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}