import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  Settings,
  MoreHorizontal,
  AlignLeft,
  LucideFileCode,
  Braces,
  BadgeCheck,
  GraduationCap,
  BookIcon,
  PenTool,
  Globe,
  Activity,
  LayoutGrid,
  Eye,
  List,
  Loader2,
  BookMarked,
} from "lucide-react";
import axios from "axios";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
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

const LANGUAGE_ICONS = {
  Python: <Terminal className="h-4 w-4" />,
  JavaScript: <Braces className="h-4 w-4" />,
  Java: <LucideFileCode className="h-4 w-4" />,
  "C++": <Code className="h-4 w-4" />,
  Ruby: <PenTool className="h-4 w-4" />,
  Go: <Globe className="h-4 w-4" />,
};

export default function CreateAssignment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [classId, setClassId] = useState<string>("");
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeModuleIndex, setActiveModuleIndex] = useState<number>(0);
  const [newRequirement, setNewRequirement] = useState<string>("");
  const [newHint, setNewHint] = useState<string>("");
  const [view, setView] = useState<"standard" | "compact">("standard");
  const [previewType, setPreviewType] = useState<"module" | "student">("module");
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [showTips, setShowTips] = useState<boolean>(true);
  const [confirmLeave, setConfirmLeave] = useState<boolean>(false);

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

  useEffect(() => {
    // Get classId from URL query params if available
    const params = new URLSearchParams(location.search);
    const classIdFromParams = params.get("classId");

    if (classIdFromParams) {
      setClassId(classIdFromParams);
    }

    // Fetch teacher's classes
    fetchClasses();
  }, [location]);

  // Set up form dirty tracking
  useEffect(() => {
    setIsDirty(formData.title.length > 0 || formData.description.length > 0);
  }, [formData]);

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const response = await axios.get(`${API_BASE_URL}/classes/teacher`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setClasses(response.data);
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast({
        title: "Error",
        description: "Failed to fetch your classes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
    
    // Show toast success message
    toast({
      title: "Module added",
      description: `Module ${formData.modules.length + 1} has been created successfully`,
    });
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
    
    toast({
      title: "Module removed",
      description: `Module has been removed successfully`,
    });
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

  // Handle navigation with unsaved changes check
  const handleNavigateBack = () => {
    if (isDirty) {
      setConfirmLeave(true);
    } else {
      navigate(-1);
    }
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

    if (!classId) {
      toast({
        title: "Error",
        description: "Please select a class for this assignment",
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

      const response = await axios.post(
        `${API_BASE_URL}/assignments`,
        {
          title: formData.title,
          description: formData.description,
          classId: classId,
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
        description: "Assignment created successfully!",
        variant: "default",
      });

      // Navigate back to classroom details
      navigate(`/teacher/classrooms/${classId}`);
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast({
        title: "Error",
        description:
          (error as any).response?.data?.message ||
          "Failed to create assignment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Move module up or down
  const moveModule = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === formData.modules.length - 1)) {
      return;
    }
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    setFormData(prev => {
      const updatedModules = [...prev.modules];
      const moduleToMove = updatedModules[index];
      
      // Remove the module from its current position
      updatedModules.splice(index, 1);
      // Insert it at the new position
      updatedModules.splice(newIndex, 0, moduleToMove);
      
      // Update ids and titles
      const renumberedModules = updatedModules.map((module, i) => {
        const customTitle = module.title.includes(':') ? module.title.split(':')[1].trim() : '';
        return {
          ...module,
          id: i + 1,
          title: customTitle ? `Module ${i + 1}: ${customTitle}` : `Module ${i + 1}`,
        };
      });
      
      return {
        ...prev,
        modules: renumberedModules
      };
    });
    
    // Update active module index
    setActiveModuleIndex(newIndex);
  };

  // Magic Generation
  const [magicTitle, setMagicTitle] = useState<string>("");
  const [isMagicDialogOpen, setIsMagicDialogOpen] = useState<boolean>(false);

  const generateAssignment = async () => {
    if (!magicTitle.trim()) {
      toast({
        title: "Error",
        description: "Please provide a title for your assignment",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const response = await axios.post(
        `${API_BASE_URL}/generate-assignment`,
        { description: magicTitle },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        // Process the generated assignment
        const generatedAssignment = response.data.assignment;
        
        // Extract requirements if they exist
        const requirements = generatedAssignment.requirements || [];
        
        // Process modules and format code templates
        const processedModules = (response.data.modules || []).map((module: any) => {
          let codeTemplate = "";
          
          // Check if we have code parts to process (new format)
          if (Array.isArray(module.codeParts)) {
            // Combine code parts into a single string with <editable> tags
            codeTemplate = module.codeParts.reduce((acc: string, part: any) => {
              if (part.editable) {
                return acc + `<editable>${part.code}</editable>`;
              }
              return acc + part.code;
            }, "");
          } else {
            // Fallback to old format or empty string
            codeTemplate = module.codeTemplate || "";
          }
          
          return {
            id: module.id,
            title: `Module ${module.id}: ${module.title.includes(':') ? module.title.split(':')[1].trim() : module.title}`,
            learningText: module.learningText || "",
            codeTemplate: codeTemplate,
            hints: module.hints || [],
            expectedOutput: module.expectedOutput || "",
          };
        });
        
        // Update form data with the generated content
        setFormData({
          title: generatedAssignment.title || magicTitle,
          description: generatedAssignment.description || "",
          language: generatedAssignment.language || "Python", // Default to Python if not specified
          requirements: requirements,
          modules: processedModules,
        });

        // Close the dialog
        setIsMagicDialogOpen(false);
        
        toast({
          title: "Success",
          description: "Assignment generated successfully!",
          variant: "default",
        });
      } else {
        throw new Error("Failed to generate assignment");
      }
    } catch (error) {
      console.error("Error generating assignment:", error);
      toast({
        title: "Error",
        description: "Failed to generate the assignment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
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

  // Utility function to update a field in the current module
  const updateCurrentModule = (field: keyof Module, value: string | string[]) => {
    handleModuleChange(activeModuleIndex, field, value);
  };

  // Duplicate current module
  const duplicateModule = () => {
    const currentModule = formData.modules[activeModuleIndex];
    const newModuleId = formData.modules.length + 1;
    
    const newModule = {
      ...currentModule,
      id: newModuleId,
      title: `Module ${newModuleId}: ${currentModule.title.includes(':') ? currentModule.title.split(':')[1].trim() : 'Copy'}`,
    };
    
    setFormData(prev => ({
      ...prev,
      modules: [...prev.modules, newModule]
    }));
    
    toast({
      title: "Module duplicated",
      description: `Created a copy of "${currentModule.title}"`,
    });
    
    // Navigate to the new module
    setActiveModuleIndex(formData.modules.length);
  };

  // Get the language icon
  const getLanguageIcon = (lang: string) => {
    return LANGUAGE_ICONS[lang as keyof typeof LANGUAGE_ICONS] || <Code className="h-4 w-4" />;
  };

  // Tips for various sections
  const tips = {
    description: "A clear, concise description helps students understand the assignment goals.",
    codeTemplate: "Use <editable> tags to mark sections of code that students can modify.",
    learningText: "Include explanations, examples, and clear instructions in the learning text.",
    hints: "Good hints guide students without revealing the entire solution.",
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-6 w-6 text-primary" />
            <div>
              <span className="font-semibold text-lg">Create Assignment</span>
              <p className="text-xs text-muted-foreground">Building interactive learning experiences</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={view === "standard" ? "default" : "outline"}
                    size="sm"
                    className="h-8 gap-1"
                    onClick={() => setView("standard")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                    <span className="hidden sm:inline">Standard</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Standard view</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={view === "compact" ? "default" : "outline"}
                    size="sm"
                    className="h-8 gap-1"
                    onClick={() => setView("compact")}
                  >
                    <List className="h-4 w-4" />
                    <span className="hidden sm:inline">Compact</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Compact view</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => setIsAdvancedSettingsOpen(true)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Advanced settings</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Button 
              type="submit"
              onClick={handleSubmit}
              className="gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create Assignment
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={handleNavigateBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setIsMagicDialogOpen(true)}
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            Magic Generate
          </Button>
        </div>

        <div className={`grid ${view === "standard" ? "lg:grid-cols-3 gap-6" : "grid-cols-1 gap-6"}`}>
          {/* Main form - takes 2/3 in standard view, full width in compact */}
          <div className={`${view === "standard" ? "lg:col-span-2" : "col-span-1"} space-y-6`}>
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <BookMarked className="h-5 w-5 text-primary" />
                  Assignment Details
                </CardTitle>
                <CardDescription>
                  Build the foundation of your assignment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pb-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="font-medium">Assignment Title</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g., A* Pathfinding Algorithm Implementation"
                      className="border-primary/20 bg-background"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="classId" className="font-medium">Class</Label>
                    <Select
                      value={classId}
                      onValueChange={(value) => setClassId(value)}
                    >
                      <SelectTrigger className="border-primary/20 bg-background">
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoading ? (
                          <div className="py-2 text-center text-sm">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
                            Loading classes...
                          </div>
                        ) : classes.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">No classes found</div>
                        ) : (
                          classes.map((cls) => (
                            <SelectItem key={cls._id} value={cls._id}>
                              {cls.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description" className="font-medium">Description</Label>
                    {showTips && (
                      <div className="text-xs text-muted-foreground italic">
                        {tips.description}
                      </div>
                    )}
                  </div>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe what students will learn and accomplish in this assignment"
                    className="border-primary/20 bg-background min-h-24"
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language" className="font-medium">Programming Language</Label>
                    <Select
                      value={formData.language}
                      onValueChange={handleLanguageChange}
                    >
                      <SelectTrigger className="border-primary/20 bg-background">
                        <div className="flex items-center gap-2">
                          {getLanguageIcon(formData.language)}
                          <SelectValue placeholder="Select a language" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Python">
                          <div className="flex items-center gap-2">
                            <Terminal className="h-4 w-4" />
                            Python
                          </div>
                        </SelectItem>
                        <SelectItem value="JavaScript">
                          <div className="flex items-center gap-2">
                            <Braces className="h-4 w-4" />
                            JavaScript
                          </div>
                        </SelectItem>
                        <SelectItem value="Java">
                          <div className="flex items-center gap-2">
                            <LucideFileCode className="h-4 w-4" />
                            Java
                          </div>
                        </SelectItem>
                        <SelectItem value="C++">
                          <div className="flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            C++
                          </div>
                        </SelectItem>
                        <SelectItem value="Ruby">
                          <div className="flex items-center gap-2">
                            <PenTool className="h-4 w-4" />
                            Ruby
                          </div>
                        </SelectItem>
                        <SelectItem value="Go">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Go
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Requirements/Dependencies</Label>
                      <Badge variant="outline" className="font-normal">
                        {formData.requirements.length} requirements
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newRequirement}
                        onChange={(e) => setNewRequirement(e.target.value)}
                        placeholder="e.g., numpy, express"
                        className="border-primary/20 bg-background flex-grow"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddRequirement();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleAddRequirement}
                        size="sm"
                        className="px-3"
                      >
                        Add
                      </Button>
                    </div>

                    {formData.requirements.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.requirements.map((req, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 bg-secondary/20 hover:bg-secondary/30 transition-colors px-3 py-1 rounded-full text-sm"
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
              </CardContent>
            </Card>

            {/* Module builder card */}
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <LayoutGrid className="h-5 w-5 text-primary" />
                      Module Builder
                    </CardTitle>
                    <CardDescription>
                      Create step-by-step learning modules for this assignment
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={duplicateModule}
                            className="h-8 px-2"
                          >
                            <FilePlus className="h-4 w-4" />
                            <span className="sr-only">Duplicate Module</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Duplicate current module
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={handleAddModule}
                            className="h-8 gap-1"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Add Module</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Add a new module
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Module selector tabs with improved styling */}
                <Tabs
                  value={String(activeModuleIndex)}
                  onValueChange={(value) => setActiveModuleIndex(Number(value))}
                  className="mb-6"
                >
                  <div className="flex items-center justify-between mb-2">
                    <TabsList className="h-auto p-1 bg-muted/70">
                      {formData.modules.length <= 5 ? (
                        // Show all tabs if 5 or fewer
                        formData.modules.map((module, index) => (
                          <TabsTrigger 
                            key={index} 
                            value={String(index)}
                            className="relative data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                                {index + 1}
                              </div>
                              <span className="max-w-28 truncate">
                                {module.title.includes(':') ? module.title.split(':')[1].trim() : module.title}
                              </span>
                            </div>
                          </TabsTrigger>
                        ))
                      ) : (
                        // Show abbreviated tabs with dropdown if more than 5
                        <>
                          {formData.modules.slice(0, 4).map((module, index) => (
                            <TabsTrigger 
                              key={index} 
                              value={String(index)}
                              className="relative data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                            >
                              <div className="flex items-center gap-2">
                                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                                  {index + 1}
                                </div>
                                <span className="max-w-28 truncate">
                                  {module.title.includes(':') ? module.title.split(':')[1].trim() : module.title}
                                </span>
                              </div>
                            </TabsTrigger>
                          ))}
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-9 px-2">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="ml-1">{formData.modules.length - 4} more</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel>Other Modules</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {formData.modules.slice(4).map((module, idx) => {
                                const actualIndex = idx + 4;
                                return (
                                  <DropdownMenuItem 
                                    key={actualIndex}
                                    onClick={() => setActiveModuleIndex(actualIndex)}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                                        {actualIndex + 1}
                                      </div>
                                      <span className="truncate">
                                        {module.title.includes(':') ? module.title.split(':')[1].trim() : module.title}
                                      </span>
                                    </div>
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
                    </TabsList>
                    
                    <div className="flex items-center gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => moveModule(activeModuleIndex, 'up')}
                              disabled={activeModuleIndex === 0}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Move module up
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => moveModule(activeModuleIndex, 'down')}
                              disabled={activeModuleIndex === formData.modules.length - 1}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Move module down
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  {formData.modules.map((module, index) => (
                    <TabsContent
                      key={index}
                      value={String(index)}
                      className="space-y-4 border rounded-lg p-4 bg-card/50 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-2 flex-grow">
                          <Label htmlFor={`module-title-${index}`} className="font-medium">
                            Module Title
                          </Label>
                          <Input
                            id={`module-title-${index}`}
                            value={module.title}
                            onChange={(e) =>
                              handleModuleTitleChange(index, e.target.value)
                            }
                            placeholder="e.g., Module 1: Introduction"
                            className="border-primary/20"
                          />
                        </div>
                        
                        {index > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive mt-6"
                            onClick={() => handleRemoveModule(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`module-learning-${index}`} className="font-medium">
                            Learning Text
                          </Label>
                          {showTips && (
                            <div className="text-xs text-muted-foreground italic">
                              {tips.learningText}
                            </div>
                          )}
                        </div>
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
                          className="border-primary/20 min-h-32"
                          rows={8}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`module-code-${index}`} className="font-medium">
                            Code Template
                          </Label>
                          {showTips && (
                            <div className="text-xs text-muted-foreground italic">
                              {tips.codeTemplate}
                            </div>
                          )}
                        </div>
                        <div className="relative">
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
                            className="font-mono text-sm border-primary/20 bg-muted/30"
                          />
                          <div className="absolute top-2 right-2">
                            <Badge variant="outline" className="bg-background/80">
                              {formData.language}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <BadgeCheck className="h-4 w-4 text-primary" />
                          Use &lt;editable&gt;code&lt;/editable&gt; tags for student input areas
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`module-output-${index}`} className="font-medium">
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
                            className="font-mono text-sm border-primary/20 bg-muted/30"
                            rows={4}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="font-medium">Hints</Label>
                            {showTips && (
                              <div className="text-xs text-muted-foreground italic">
                                {tips.hints}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 mb-2">
                            <Input
                              value={newHint}
                              onChange={(e) => setNewHint(e.target.value)}
                              placeholder="e.g., Remember to check boundary conditions"
                              className="border-primary/20"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddHint();
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={handleAddHint}
                              className="px-3"
                            >
                              Add
                            </Button>
                          </div>

                          {module.hints.length > 0 ? (
                            <ScrollArea className="h-24 rounded-md border p-2">
                              <div className="space-y-2">
                                {module.hints.map((hint, hintIndex) => (
                                  <div
                                    key={hintIndex}
                                    className="flex items-center gap-2 bg-muted/50 p-2 rounded hover:bg-muted/80 transition-colors"
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
                            </ScrollArea>
                          ) : (
                            <div className="h-24 rounded-md border p-4 flex items-center justify-center text-sm text-muted-foreground">
                              No hints added yet
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Preview panel - 1/3 width in standard, hidden in compact */}
          {view === "standard" && (
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-primary/20 shadow-md sticky top-24">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-primary" />
                      Preview
                    </CardTitle>
                    <div className="flex items-center">
                      <Tabs value={previewType} onValueChange={(value) => setPreviewType(value as "module" | "student")}>
                        <TabsList className="h-8">
                          <TabsTrigger value="module" className="text-xs">Current Module</TabsTrigger>
                          <TabsTrigger value="student" className="text-xs">Student View</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  {previewType === "student" ? (
                    <div className="border rounded-lg p-4 bg-card">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg">
                          {formData.title || "Assignment Title"}
                        </h3>
                        <div className="flex items-center gap-2">
                          {getLanguageIcon(formData.language)}
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            {formData.language}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-4">
                        {formData.description || "Assignment description will appear here"}
                      </p>

                      {formData.requirements.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-1 flex items-center gap-1.5">
                            <Activity className="h-3.5 w-3.5" />
                            Requirements:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {formData.requirements.map((req, i) => (
                              <Badge key={i} variant="secondary" className="bg-secondary/20">
                                {req}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                          <LayoutGrid className="h-3.5 w-3.5" />
                          Modules:
                        </h4>
                        <div className="space-y-2">
                          {formData.modules.map((module, index) => (
                            <div
                              key={index}
                              className={`flex items-center p-2 border rounded ${
                                activeModuleIndex === index ? "bg-primary/5 border-primary/20" : ""
                              }`}
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
                  ) : (
                    <ScrollArea className="h-[480px]">
                      {formData.modules[activeModuleIndex] && (
                        <div className="space-y-4 p-1">
                          <div className="border-b pb-2">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                                {activeModuleIndex + 1}
                              </div>
                              <h3 className="font-semibold">
                                {formData.modules[activeModuleIndex].title}
                              </h3>
                            </div>
                            <div className="prose prose-sm max-w-none text-muted-foreground">
                              {formData.modules[activeModuleIndex].learningText ? (
                                <div className="text-sm text-foreground bg-muted/20 p-3 rounded-md border">
                                  {formData.modules[activeModuleIndex].learningText.split('\n').map((line, i) => (
                                    <p key={i} className={i > 0 ? "mt-2" : ""}>{line || " "}</p>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm italic text-muted-foreground">
                                  Learning text will appear here
                                </div>
                              )}
                            </div>
                          </div>

                          {formData.modules[activeModuleIndex].codeTemplate && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-medium flex items-center gap-1">
                                  <Code className="h-4 w-4" />
                                  Code Template:
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                  {formData.language}
                                </Badge>
                              </div>
                              <div className="relative">
                                <pre className="bg-muted/50 border p-3 rounded overflow-x-auto text-xs font-mono">
                                  <code>
                                    {formData.modules[activeModuleIndex].codeTemplate.split("\n").map((line, i) => {
                                      if (line.includes("<editable>")) {
                                        return (
                                          <div key={i} className="bg-primary/10 border-l-2 border-primary py-0.5 pl-2">
                                            {line.replace(/<editable>|<\/editable>/g, "")}
                                          </div>
                                        );
                                      }
                                      return <div key={i}>{line}</div>;
                                    })}
                                  </code>
                                </pre>
                              </div>
                            </div>
                          )}

                          {formData.modules[activeModuleIndex].expectedOutput && (
                            <div>
                              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                                <Terminal className="h-4 w-4" />
                                Expected Output:
                              </h4>
                              <pre className="bg-muted/50 border p-3 rounded overflow-x-auto text-xs font-mono">
                                <code>
                                  {formData.modules[activeModuleIndex].expectedOutput}
                                </code>
                              </pre>
                            </div>
                          )}

                          {formData.modules[activeModuleIndex].hints.length > 0 && (
                            <div className="pt-2">
                              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                                <LightbulbIcon className="h-4 w-4 text-amber-500" />
                                Hints:
                              </h4>
                              <div className="space-y-2">
                                {formData.modules[activeModuleIndex].hints.map(
                                  (hint, index) => (
                                    <div key={index} className="flex items-start gap-2 bg-muted/30 p-2 rounded border border-muted">
                                      <span className="h-5 w-5 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-xs font-medium shrink-0">
                                        {index + 1}
                                      </span>
                                      <p className="text-sm">{hint}</p>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Magic Generation Dialog */}
      <Dialog open={isMagicDialogOpen} onOpenChange={setIsMagicDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Magic Assignment Generator
            </DialogTitle>
            <DialogDescription>
              Let AI create an assignment for you based on a title. Enter a descriptive title and we'll generate a complete assignment structure.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="magic-title">Assignment Title</Label>
              <Input
                id="magic-title"
                placeholder="e.g., Interactive Binary Search Tutorial"
                value={magicTitle}
                onChange={(e) => setMagicTitle(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                The more specific your title, the better the generated assignment will be.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMagicDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={generateAssignment}
              className="gap-2"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Building assignment...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Advanced Settings Dialog */}
      <Dialog open={isAdvancedSettingsOpen} onOpenChange={setIsAdvancedSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Advanced Settings
            </DialogTitle>
            <DialogDescription>
              Configure additional options for your assignment creation experience
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Show Tips</h4>
                <p className="text-sm text-muted-foreground">Display helpful tips and suggestions</p>
              </div>
              <Switch checked={showTips} onCheckedChange={setShowTips} />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Module Preview</h4>
                <p className="text-sm text-muted-foreground">Default preview type</p>
              </div>
              <Select 
                value={previewType} 
                onValueChange={(value) => setPreviewType(value as "module" | "student")}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="module">Module View</SelectItem>
                  <SelectItem value="student">Student View</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Editor Layout</h4>
                <p className="text-sm text-muted-foreground">Choose your preferred layout</p>
              </div>
              <Select
                value={view}
                onValueChange={(value) => setView(value as "standard" | "compact")}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsAdvancedSettingsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirm Leave Dialog */}
      <Dialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Are you sure you want to leave without saving?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setConfirmLeave(false)}>
              Continue Editing
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                setConfirmLeave(false);
                navigate(-1);
              }}
            >
              Leave Without Saving
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}