import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  FilePlus,
  Plus,
  Trash2,
  ArrowLeft,
  Code,
  Save,
  Terminal,
  BookOpen,
  LightbulbIcon,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import axios from "axios";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { API_URL } from "@/config";
const API_BASE_URL = `${API_URL}/api`;

// Define interfaces for our data structures
interface Module {
  id: number;
  title: string;
  learningText: string;
  codeTemplate: string;
  hints: string[];
  expectedOutput: string;
}

interface AssignmentFormData {
  title: string;
  description: string;
  language: string;
  requirements: string[];
  modules: Module[];
}

export default function EditAssignment() {
  const navigate = useNavigate();
  const { assignmentId } = useParams();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeModuleIndex, setActiveModuleIndex] = useState<number>(0);
  const [newRequirement, setNewRequirement] = useState<string>("");
  const [newHint, setNewHint] = useState<string>("");
  const [classId, setClassId] = useState<string>("");
  const [showPreviewConfirm, setShowPreviewConfirm] = useState<boolean>(false);
  
  // Initialize form data with default values
  const [formData, setFormData] = useState<AssignmentFormData>({
    title: "",
    description: "",
    language: "Python",
    requirements: [],
    modules: [
      {
        id: 1,
        title: "Module 1",
        learningText: "",
        codeTemplate: "",
        hints: [],
        expectedOutput: "",
      },
    ],
  });

  // Fetch assignment details
  const fetchAssignmentDetails = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const response = await axios.get(`${API_BASE_URL}/assignments/${assignmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const assignment = response.data;
      setClassId(assignment.class._id);
      
      setFormData({
        title: assignment.title,
        description: assignment.description,
        language: assignment.language,
        requirements: assignment.requirements || [],
        modules: assignment.modules.map((module: any) => ({
          id: module.id,
          title: module.title,
          learningText: module.learningText || "",
          codeTemplate: module.codeTemplate || "",
          hints: module.hints || [],
          expectedOutput: module.expectedOutput || "",
        }))
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching assignment:", error);
      toast({
        title: "Error",
        description: "Failed to fetch assignment details.",
        variant: "destructive",
      });
      // If assignment not found, redirect to classrooms
      navigate("/teacher/classrooms");
    }
  };

  // Handle preview button click
  const handlePreview = () => {
    // Show confirmation dialog before saving and previewing
    setShowPreviewConfirm(true);
  };

  // Handle confirmation of preview
  const handlePreviewConfirm = async () => {
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      // Save the current changes first
      await axios.put(
        `${API_BASE_URL}/assignments/${assignmentId}`,
        {
          title: formData.title,
          description: formData.description,
          language: formData.language,
          requirements: formData.requirements,
          modules: formData.modules,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast({
        title: "Success",
        description: "Changes saved successfully. Opening preview...",
      });

      // Close the dialog
      setShowPreviewConfirm(false);
      
      // Navigate to the preview page with the correct path
      navigate(`/teacher/assignments/${assignmentId}/preview`);
    } catch (error) {
      console.error("Error saving assignment for preview:", error);
      toast({
        title: "Error",
        description:
          (error as any).response?.data?.message ||
          "Failed to save changes. Please try again.",
        variant: "destructive",
      });
      setShowPreviewConfirm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentDetails();
    }
  }, [assignmentId]);

  // Handle changes to the form data
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLanguageChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      language: value,
    }));
  };

  // Handle changes to module data
  const handleModuleChange = (
    index: number,
    field: keyof Module,
    value: string | string[]
  ) => {
    setFormData((prev) => {
      const updatedModules = [...prev.modules];
      updatedModules[index] = {
        ...updatedModules[index],
        [field]: value,
      };
      return {
        ...prev,
        modules: updatedModules,
      };
    });
  };

  // Add a new module
  const handleAddModule = () => {
    setFormData((prev) => {
      const newId = prev.modules.length + 1;
      return {
        ...prev,
        modules: [
          ...prev.modules,
          {
            id: newId,
            title: `Module ${newId}`,
            learningText: "",
            codeTemplate: "",
            hints: [],
            expectedOutput: "",
          },
        ],
      };
    });
    // Set the newly added module as active
    setActiveModuleIndex(formData.modules.length);
  };

  // Remove a module
  const handleRemoveModule = (index: number) => {
    if (formData.modules.length <= 1) {
      toast({
        title: "Error",
        description: "Assignment must have at least one module",
        variant: "destructive",
      });
      return;
    }

    setFormData((prev) => {
      const updatedModules = [...prev.modules];
      updatedModules.splice(index, 1);
      
      // Renumber module IDs after removal
      const renumberedModules = updatedModules.map((module, i) => ({
        ...module,
        id: i + 1,
        title: `Module ${i + 1}${module.title.includes(':') ? ': ' + module.title.split(': ')[1] : ''}`,
      }));
      
      return {
        ...prev,
        modules: renumberedModules,
      };
    });

    // Adjust active module index if needed
    if (activeModuleIndex >= index && activeModuleIndex > 0) {
      setActiveModuleIndex(activeModuleIndex - 1);
    }
  };

  // Add a requirement
  const handleAddRequirement = () => {
    if (!newRequirement.trim()) return;
    
    setFormData((prev) => ({
      ...prev,
      requirements: [...prev.requirements, newRequirement.trim()],
    }));
    setNewRequirement("");
  };

  // Remove a requirement
  const handleRemoveRequirement = (index: number) => {
    setFormData((prev) => {
      const updatedRequirements = [...prev.requirements];
      updatedRequirements.splice(index, 1);
      return {
        ...prev,
        requirements: updatedRequirements,
      };
    });
  };

  // Add a hint to the current module
  const handleAddHint = () => {
    if (!newHint.trim()) return;
    
    setFormData((prev) => {
      const updatedModules = [...prev.modules];
      updatedModules[activeModuleIndex] = {
        ...updatedModules[activeModuleIndex],
        hints: [...updatedModules[activeModuleIndex].hints, newHint.trim()],
      };
      return {
        ...prev,
        modules: updatedModules,
      };
    });
    setNewHint("");
  };

  // Remove a hint
  const handleRemoveHint = (moduleIndex: number, hintIndex: number) => {
    setFormData((prev) => {
      const updatedModules = [...prev.modules];
      const updatedHints = [...updatedModules[moduleIndex].hints];
      updatedHints.splice(hintIndex, 1);
      updatedModules[moduleIndex] = {
        ...updatedModules[moduleIndex],
        hints: updatedHints,
      };
      return {
        ...prev,
        modules: updatedModules,
      };
    });
  };

  // Submit the form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: "Error",
        description: "Title and description are required",
        variant: "destructive",
      });
      return;
    }

    // Validate modules
    for (let i = 0; i < formData.modules.length; i++) {
      const module = formData.modules[i];
      if (!module.title.trim() || !module.learningText.trim()) {
        toast({
          title: "Error",
          description: `Module ${i + 1} is missing title or learning text`,
          variant: "destructive",
        });
        setActiveModuleIndex(i);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const response = await axios.put(
        `${API_BASE_URL}/assignments/${assignmentId}`,
        {
          title: formData.title,
          description: formData.description,
          language: formData.language,
          requirements: formData.requirements,
          modules: formData.modules,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast({
        title: "Success",
        description: "Assignment updated successfully!",
      });

      // Navigate back to assignment view
      navigate(`/teacher/assignments/${assignmentId}`);
    } catch (error) {
      console.error("Error updating assignment:", error);
      toast({
        title: "Error",
        description:
          (error as any).response?.data?.message ||
          "Failed to update assignment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle module title update with custom name
  const handleModuleTitleChange = (index: number, value: string) => {
    let newTitle = value;
    
    // Ensure the module number remains at the start of the title
    if (!newTitle.startsWith(`Module ${index + 1}`)) {
      // If there's already a colon format, extract the custom part
      if (newTitle.includes(':')) {
        const customPart = newTitle.split(':')[1].trim();
        newTitle = `Module ${index + 1}: ${customPart}`;
      } else {
        // Otherwise format as "Module X: custom title"
        newTitle = `Module ${index + 1}: ${newTitle}`;
      }
    }
    
    handleModuleChange(index, 'title', newTitle);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container h-16 flex items-center">
            <Code className="h-6 w-6 text-primary mr-2" />
            <span className="font-semibold text-lg">Edit Assignment</span>
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
    <div className="min-h-screen bg-background pb-12">
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Edit Assignment</span>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Button
          variant="outline"
          onClick={() => navigate(`/teacher/assignments/${assignmentId}`)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Assignment
        </Button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main form */}
          <div className="flex-grow lg:w-2/3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Assignment Details</CardTitle>
                <CardDescription>
                  Update the information about this assignment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Assignment Title</Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g., A* Pathfinding Algorithm Implementation"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Describe what students will learn and accomplish in this assignment"
                        rows={4}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="language">Programming Language</Label>
                      <Select
                        value={formData.language}
                        onValueChange={handleLanguageChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Python">Python</SelectItem>
                          <SelectItem value="JavaScript">JavaScript</SelectItem>
                          <SelectItem value="Java">Java</SelectItem>
                          <SelectItem value="C++">C++</SelectItem>
                          <SelectItem value="Ruby">Ruby</SelectItem>
                          <SelectItem value="Go">Go</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Requirements/Dependencies</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={newRequirement}
                          onChange={(e) => setNewRequirement(e.target.value)}
                          placeholder="e.g., numpy, express"
                          className="flex-grow"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleAddRequirement}
                        >
                          Add
                        </Button>
                      </div>

                      {formData.requirements.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.requirements.map((req, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-1 bg-secondary/50 px-3 py-1 rounded-full text-sm"
                            >
                              <span>{req}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveRequirement(index)}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Module content */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Module Builder</CardTitle>
                    <CardDescription>
                      Edit the step-by-step modules for this assignment
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleAddModule}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Module selector tabs */}
                <Tabs
                  value={String(activeModuleIndex)}
                  onValueChange={(value) => setActiveModuleIndex(Number(value))}
                  className="mb-6"
                >
                  <TabsList className="mb-2 flex flex-wrap h-auto">
                    {formData.modules.map((module, index) => (
                      <TabsTrigger key={index} value={String(index)}>
                        <div className="flex items-center gap-1">
                          <span>{`Module ${index + 1}`}</span>
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent tab selection
                                handleRemoveModule(index);
                              }}
                              className="ml-1 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {formData.modules.map((module, index) => (
                    <TabsContent
                      key={index}
                      value={String(index)}
                      className="space-y-4 border rounded-lg p-4"
                    >
                      <div>
                        <Label htmlFor={`module-title-${index}`}>
                          Module Title
                        </Label>
                        <Input
                          id={`module-title-${index}`}
                          value={module.title}
                          onChange={(e) =>
                            handleModuleTitleChange(index, e.target.value)
                          }
                          placeholder="e.g., Module 1: Introduction"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`module-learning-${index}`}>
                          Learning Text
                        </Label>
                        <Textarea
                          id={`module-learning-${index}`}
                          value={module.learningText}
                          onChange={(e) =>
                            handleModuleChange(
                              index,
                              "learningText",
                              e.target.value
                            )
                          }
                          placeholder="Explain concepts, provide instructions, etc."
                          rows={6}
                        />
                      </div>

                      <div>
                        <Label htmlFor={`module-code-${index}`}>
                          Code Template
                        </Label>
                        <Textarea
                          id={`module-code-${index}`}
                          value={module.codeTemplate}
                          onChange={(e) =>
                            handleModuleChange(
                              index,
                              "codeTemplate",
                              e.target.value
                            )
                          }
                          placeholder="Provide starter code for students"
                          rows={10}
                          className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Use &lt;editable&gt; tags to mark sections that students can edit
                        </p>
                      </div>

                      <div>
                        <Label htmlFor={`module-output-${index}`}>
                          Expected Output
                        </Label>
                        <Textarea
                          id={`module-output-${index}`}
                          value={module.expectedOutput}
                          onChange={(e) =>
                            handleModuleChange(
                              index,
                              "expectedOutput",
                              e.target.value
                            )
                          }
                          placeholder="What should the code output when correct?"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label>Hints</Label>
                        <div className="flex gap-2 mb-2">
                          <Input
                            value={newHint}
                            onChange={(e) => setNewHint(e.target.value)}
                            placeholder="e.g., Remember to check boundary conditions"
                            className="flex-grow"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={handleAddHint}
                          >
                            Add
                          </Button>
                        </div>

                        {module.hints.length > 0 && (
                          <div className="space-y-2 mt-3">
                            {module.hints.map((hint, hintIndex) => (
                              <div
                                key={hintIndex}
                                className="flex items-center gap-2 bg-muted p-2 rounded"
                              >
                                <LightbulbIcon className="h-4 w-4 text-amber-500 shrink-0" />
                                <p className="text-sm flex-grow">{hint}</p>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveHint(index, hintIndex)
                                  }
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            <div className="flex justify-between gap-4 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/teacher/assignments/${assignmentId}`)}
              >
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handlePreview}
                  variant="secondary"
                  className="gap-2"
                  disabled={isSubmitting}
                >
                  <BookOpen className="h-4 w-4" />
                  Try It Out
                </Button>
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  className="gap-2"
                  disabled={isSubmitting}
                >
                  <Save className="h-4 w-4" />
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>

          {/* Preview panel */}
          <div className="lg:w-1/3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Assignment Preview</CardTitle>
                <CardDescription>
                  See how your assignment will appear to students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4">
                  <h3 className="font-bold text-lg">
                    {formData.title || "Assignment Title"}
                  </h3>
                  <div className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-medium inline-block mt-1 mb-3">
                    {formData.language}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {formData.description || "Assignment description will appear here"}
                  </p>

                  {formData.requirements.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-1">Requirements:</h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.requirements.map((req, i) => (
                          <span
                            key={i}
                            className="bg-secondary/30 px-2 py-0.5 rounded text-xs"
                          >
                            {req}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium mb-2">Modules:</h4>
                    <div className="space-y-2">
                      {formData.modules.map((module, index) => (
                        <div
                          key={index}
                          className="flex items-center p-2 border rounded"
                        >
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium mr-2">
                            {index + 1}
                          </div>
                          <span className="text-sm">
                            {module.title.includes(":")
                              ? module.title.split(":")[1].trim()
                              : module.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Module Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {formData.modules[activeModuleIndex] && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-lg mb-2">
                        {formData.modules[activeModuleIndex].title}
                      </h3>
                      <div className="prose prose-sm max-w-none text-muted-foreground">
                        {formData.modules[activeModuleIndex].learningText ||
                          "Learning text will appear here"}
                      </div>
                    </div>

                    {formData.modules[activeModuleIndex].codeTemplate && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Code Template:</h4>
                        <pre className="bg-muted p-3 rounded overflow-x-auto text-xs">
                          <code>
                            {formData.modules[activeModuleIndex].codeTemplate.slice(0, 150)}
                            {formData.modules[activeModuleIndex].codeTemplate.length > 150
                              ? "..."
                              : ""}
                          </code>
                        </pre>
                      </div>
                    )}

                    {formData.modules[activeModuleIndex].hints.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Hints:</h4>
                        <div className="space-y-1">
                          {formData.modules[activeModuleIndex].hints.map(
                            (hint, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <LightbulbIcon className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-xs">{hint}</p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Dialog to confirm preview and save changes */}
      <Dialog open={showPreviewConfirm} onOpenChange={setShowPreviewConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preview Assignment</DialogTitle>
            <DialogDescription>
              Your changes will be saved before opening the preview. In preview mode, you'll see the assignment exactly as your students will, and can test all functionality.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowPreviewConfirm(false)}>Cancel</Button>
            <Button onClick={handlePreviewConfirm} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save & Preview"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}