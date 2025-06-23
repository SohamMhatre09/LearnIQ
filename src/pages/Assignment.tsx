import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { 
  getAssignmentById, 
  getUserCode, 
  saveUserCode,
  markStepCompleted
} from "@/lib/assignments";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { InstructionPanel } from "@/components/InstructionPanel";
import { CodeEditor } from "@/components/CodeEditor";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ResizableLayout } from "@/components/ResizableLayout";
import { ArrowLeft, LayoutPanelLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { OutputPanel } from "@/components/OutputPanel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SandboxModal } from "@/components/SandboxModal";

import { API_URL } from "@/config";
const API_BASE_URL = `${API_URL}`;

export default function Assignment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [assignment, setAssignment] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [code, setCode] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [showPanels, setShowPanels] = useState(true);
  const [output, setOutput] = useState("");
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [preparingSandbox, setPreparingSandbox] = useState(false);
  const [sandboxReady, setSandboxReady] = useState(false);
  
  // Check if we're in preview mode
  const isPreviewMode = location.pathname.includes('/preview/');

  useEffect(() => {
    if (!id) return;
    
    // Fetch the assignment data
    let assignmentId = id;
    
    // In preview mode, use the actual ID without modifying it
    // The id is already correctly extracted from the URL parameter
    const endpoint = isPreviewMode 
      ? `${API_BASE_URL}/api/assignments/${assignmentId}`
      : `${API_BASE_URL}/api/assignments/${assignmentId}`;

    console.log("Fetching assignment from:", endpoint);
    
    fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data && data._id) {
          setAssignment(data);
          // Initialize with first module's code
          if (data.modules && data.modules.length > 0) {
            setCode(data.modules[0].codeTemplate || "");
          }
          
          // Fetch completed modules from the server unless in preview mode
          if (!isPreviewMode) {
            fetchCompletedModules(assignmentId);
          }
        } else {
          setError("Assignment not found");
        }
      })
      .catch(err => {
        console.error("Error fetching assignment:", err);
        setError(`Failed to load assignment: ${err.message}`);
      });
  }, [id, isPreviewMode]);
  
  // New function to fetch completed modules from the server
  const fetchCompletedModules = async (assignmentId: string) => {
    try {
      console.log('Fetching completed modules for assignment:', assignmentId);
      const response = await fetch(`${API_BASE_URL}/api/assignments/${assignmentId}/completed-modules`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (!response.ok) {
        console.error(`Server returned ${response.status}: ${response.statusText}`);
        throw new Error(`Failed to fetch completed modules: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched completed modules:', data);
      
      if (data.completedModules && Array.isArray(data.completedModules)) {
        // Convert number IDs to strings for consistency
        const moduleIds = data.completedModules.map(id => id.toString());
        setCompletedModules(moduleIds);
        console.log('Updated completed modules state:', moduleIds);
      }
    } catch (error) {
      console.error("Error fetching completed modules:", error);
      // Fallback to localStorage for backward compatibility
      const saved = localStorage.getItem(`completed_${assignmentId}`);
      if (saved) {
        try {
          const savedModules = JSON.parse(saved);
          console.log('Using localStorage fallback for completed modules:', savedModules);
          setCompletedModules(savedModules);
        } catch (e) {
          console.error('Error parsing localStorage data:', e);
        }
      }
    }
  };

  // Updated markModuleAsCompleted function to use the server instead of localStorage
  const markModuleAsCompleted = async (moduleId: string) => {
    if (!completedModules.includes(moduleId)) {
      // In preview mode, just update the local state without API calls
      if (isPreviewMode) {
        const updatedModules = [...completedModules, moduleId];
        setCompletedModules(updatedModules);
        
        toast({
          title: "Progress saved (preview)",
          description: "Module marked as complete in preview mode only. No data saved to database.",
        });
        
        console.log("Preview mode: Module marked as completed locally:", moduleId);
        return;
      }

      // Original code for student mode with DB operations
      try {
        console.log('Marking module as completed:', moduleId);
        console.log('API URL:', `${API_BASE_URL}/api/assignments/${id}/modules/${moduleId}/complete`);
        
        const response = await fetch(`${API_BASE_URL}/api/assignments/${id}/modules/${moduleId}/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            code: code // Send the current code too
          }),
        });
        
        if (!response.ok) {
          console.error(`Server returned ${response.status}: ${response.statusText}`);
          throw new Error('Failed to mark module as completed');
        }
        
        const data = await response.json();
        console.log('Server response for completed module:', data);
        
        // Update the local state with the server response
        if (data.completedModules && Array.isArray(data.completedModules)) {
          // Convert number IDs to strings for consistency
          const moduleIds = data.completedModules.map(id => id.toString());
          setCompletedModules(moduleIds);
          console.log('Updated completed modules from server:', moduleIds);
        } else {
          // Fallback behavior if server doesn't return completed modules
          const updatedCompletedModules = [...completedModules, moduleId];
          setCompletedModules(updatedCompletedModules);
          console.log('Using fallback for completed modules update:', updatedCompletedModules);
        }
        
        // Keep the localStorage update for backward compatibility
        const updatedModules = [...completedModules, moduleId];
        localStorage.setItem(`completed_${id}`, JSON.stringify(updatedModules));
        
        toast({
          title: "Progress saved!",
          description: "Your progress has been saved to your account.",
        });
      } catch (error) {
        console.error("Error marking module as completed:", error);
        
        // Fallback to localStorage only
        const updatedModules = [...completedModules, moduleId];
        setCompletedModules(updatedModules);
        localStorage.setItem(`completed_${id}`, JSON.stringify(updatedModules));
        
        toast({
          title: "Saved locally",
          description: "Progress saved locally. Sync will happen when connection is restored.",
          variant: "default"
        });
      }
    }
  };

  const handleModuleChange = (moduleIndex) => {
    if (assignment && assignment.modules && assignment.modules[moduleIndex]) {
      // Skip lock check in preview mode
      if (!isPreviewMode) {
        // Check if trying to access a locked module
        if (moduleIndex > 0 && moduleIndex > currentStepIndex + 1) {
          const previousModules = assignment.modules.slice(0, moduleIndex);
          const allPreviousCompleted = previousModules.every(module => 
            completedModules.includes(module.id.toString())
          );
          
          if (!allPreviousCompleted) {
            toast({
              title: "Module locked",
              description: "You need to complete previous modules first",
              variant: "destructive"
            });
            return;
          }
        }
      }
      
      // Save current code before changing modules
      if (!isPreviewMode) {
        saveUserCode(id, assignment.modules[currentStepIndex].id, code);
      }
      
      setCurrentStepIndex(moduleIndex);
      
      // Load code for the new module
      if (!isPreviewMode) {
        const savedCode = getUserCode(id, assignment.modules[moduleIndex].id);
        if (savedCode) {
          setCode(savedCode);
        } else {
          setCode(assignment.modules[moduleIndex].codeTemplate || "");
        }
      } else {
        // In preview mode, always load the template code
        setCode(assignment.modules[moduleIndex].codeTemplate || "");
      }
      
      // Clear output when switching modules
      setOutput("");
    }
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    // Auto-save code
    if (assignment && !isPreviewMode) {
      saveUserCode(id, assignment.modules[currentStepIndex].id, newCode);
    }
  };

  // Add a new effect to create sandbox for preview mode
  useEffect(() => {
    // Only set up sandbox in preview mode and when we have the assignment data
    if (isPreviewMode && assignment && !sandboxReady) {
      setupPreviewSandbox();
    }
  }, [isPreviewMode, assignment]);

  // New function to set up sandbox for teacher preview
  const setupPreviewSandbox = async () => {
    try {
      setPreparingSandbox(true);
      console.log("Setting up preview sandbox for assignment:", id);
      
      const response = await fetch("http://localhost:8000/create/assignment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignment_name: id,
          language: assignment.language || "python",
          requirements: assignment.requirements || [],
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log("Preview sandbox created successfully");
        setSandboxReady(true);
        toast({
          title: "Preview Environment Ready",
          description: "Your teacher preview sandbox has been prepared",
        });
      } else {
        throw new Error(data.detail || "Failed to create preview sandbox");
      }
    } catch (error) {
      console.error("Error creating preview sandbox:", error);
      toast({
        title: "Sandbox Error",
        description: "Failed to prepare the preview environment. Some features may not work.",
        variant: "destructive",
      });
    } finally {
      setPreparingSandbox(false);
    }
  };

  const handleRunCode = async () => {
    if (!assignment) return;
    
    setRunning(true);
    setOutput("Running code...");
    
    try {
      // Preprocess the code to remove <editable> and </editable> tags
      const processedCode = code.replace(/<editable>|<\/editable>/g, '');
      
      // Check if we're in preview mode but sandbox isn't ready
      if (isPreviewMode && !sandboxReady) {
        // Try to set up sandbox if not ready yet
        await setupPreviewSandbox();
        // If still not ready, throw error
        if (!sandboxReady) {
          throw new Error("Preview environment not ready. Please try again.");
        }
      }
      
      // Execute the code via your API
      const response = await fetch("http://localhost:8000/execute/code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          assignment_name: id,
          language: assignment.language || "python", 
          code: processedCode
        }),
      });
      
      const data = await response.json();
      
      // Format the output
      let formattedOutput = "";
      
      if (data.output) {
        formattedOutput += data.output;
      }
      
      if (data.error || data.detail) {
        formattedOutput += "\n\n" + (data.error || data.detail);
      }
      
      setOutput(formattedOutput || "No output");
      
      // Check if output matches expected output
      const currentModule = assignment.modules[currentStepIndex];
      if (currentModule.expectedOutput && formattedOutput.trim() === currentModule.expectedOutput.trim()) {
        // In preview mode, just update local state without DB operations
        markModuleAsCompleted(currentModule.id.toString());
        toast({
          title: "Success!",
          description: isPreviewMode ? 
            "Output matches expected result! Module marked as complete (preview only)." : 
            "Your solution is correct. Great job!",
        });
      }
    } catch (error) {
      console.error("Error executing code:", error);
      setOutput(`Error executing code: ${error.message}`);
    } finally {
      setRunning(false);
    }
  };

  const handleResetCode = () => {
    if (assignment) {
      const templateCode = assignment.modules[currentStepIndex].codeTemplate || "";
      setCode(templateCode);
      toast({
        title: "Code reset",
        description: "Your code has been reset to the template",
      });
    }
  };

  const togglePanels = () => {
    setShowPanels(!showPanels);
  };

  // Function to handle final submission
  const handleFinalSubmit = () => {
    // In preview mode, show a different message
    if (isPreviewMode) {
      toast({
        title: "Preview Mode",
        description: "In student mode, this would submit the assignment for grading.",
      });
      // Navigate back to the assignment management page
      navigate(`/teacher/assignments/${id}`);
      return;
    }

    toast({
      title: "Assignment Completed!",
      description: "Congratulations! You've successfully completed this assignment.",
    });
    // Here you would typically send a request to your backend to mark the assignment as completed
  };

  const handleExitPreview = () => {
    // Navigate back to the assignment management page
    navigate(`/teacher/assignments/${id}`);
  };

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">{error}</h1>
          <Button onClick={() => navigate("/")}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse-light">Loading assignment...</div>
      </div>
    );
  }

  // Get the current module
  const currentModule = assignment.modules[currentStepIndex];

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="container h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => isPreviewMode ? handleExitPreview() : navigate("/")}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <BreadcrumbNav
              items={[
                { label: isPreviewMode ? "Teacher Preview" : "Assignments", href: isPreviewMode ? "#" : "/" },
                { label: assignment.title },
                { label: currentModule.title },
              ]}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePanels}
              className="rounded-full"
              title={showPanels ? "Hide side panels" : "Show side panels"}
            >
              <LayoutPanelLeft className="h-5 w-5" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {/* {isPreviewMode && (
          <div className="container pt-2">
            <Alert variant="default" className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="text-amber-700 dark:text-amber-400">Teacher Preview Mode</AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-400">
                You are viewing this assignment as a student would see it. Your progress is tracked locally but won't be saved to the database.
                <br/>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/30" 
                  onClick={handleExitPreview}
                >
                  Exit Preview
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )} */}

        <ResizableLayout
          leftContent={
            showPanels && (
              <InstructionPanel
                assignment={assignment}
                currentStepIndex={currentStepIndex}
                onStepChange={handleModuleChange}
                completedModules={completedModules}
                isPreviewMode={isPreviewMode}  // Pass this flag to the component
              />
            )
          }
          centerContent={
            <CodeEditor
              module={currentModule}
              onSubmit={handleRunCode}
              onRun={handleRunCode}
              isExecuting={running}
              assignmentName={assignment.title}
              code={code} // Pass the current code as a prop
              onCodeChange={handleCodeChange} // Pass the change handler as a prop
              isLastModule={currentStepIndex === assignment.modules.length - 1}
              isCurrentModuleCompleted={completedModules.includes(currentModule.id)}
              onFinalSubmit={handleFinalSubmit}
            />
          }
          rightContent={
            showPanels && (
              <OutputPanel
                output={output}
                isExecuting={running}
                expectedOutput={currentModule.expectedOutput}
                onSuccess={() => {
                  // Use our preview-aware function instead of markStepCompleted
                  if (isPreviewMode) {
                    // Just update local state in preview mode
                    markModuleAsCompleted(currentModule.id);
                  } else {
                    // Normal behavior for students
                    markStepCompleted(id, currentModule.id);
                  }
                }}
              />
            )
          }
          showLeft={showPanels}
          showRight={showPanels}
        />
      </main>
      <SandboxModal 
        isOpen={preparingSandbox} 
        onOpenChange={(open) => {
          if (!open) setPreparingSandbox(false);
        }} 
      />
    </div>
  );
}
