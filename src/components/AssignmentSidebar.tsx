import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Lightbulb, CheckCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface ModuleProps {
  title: string;
  learningText: string;
  hints: string[];
  isActive: boolean;
  isCompleted: boolean;
  onClick: () => void;
}

export function ModuleCard({ 
  title, 
  learningText, 
  hints, 
  isActive, 
  isCompleted, 
  onClick 
}: ModuleProps) {
  const [hintsOpen, setHintsOpen] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on the hints button or content
    if (!(e.target as HTMLElement).closest('.hints-section')) {
      onClick();
    }
  };

  return (
    <Card 
      className={cn(
        "w-full mb-4 cursor-pointer transition-all duration-200 hover:shadow-md",
        isActive ? 'border-primary ring-1 ring-primary/30' : 'border-muted',
        isCompleted ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : ''
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <CardTitle className="text-lg">{title}</CardTitle>
        {isCompleted && (
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          {learningText}
        </div>
        
        {hints.length > 0 && (
          <Collapsible open={hintsOpen} onOpenChange={setHintsOpen} className="hints-section">
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full flex justify-between">
                <div className="flex items-center">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  <span>Hints</span>
                </div>
                {hintsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="border rounded-md p-3 bg-muted/30">
                <ul className="list-disc pl-5 space-y-2">
                  {hints.map((hint, index) => (
                    <li key={index} className="text-sm">{hint}</li>
                  ))}
                </ul>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}

interface AssignmentModule {
  id: number;
  title: string;
  learningText: string;
  codeTemplate: string;
  hints: string[];
  expectedOutput: string;
}

interface AssignmentSidebarProps {
  title: string;
  description: string;
  modules: AssignmentModule[];
  activeModuleId: number;
  completedModules?: number[];
  onModuleSelect: (moduleId: number) => void;
}

export function AssignmentSidebar({ 
  title, 
  description, 
  modules, 
  activeModuleId,
  completedModules = [],
  onModuleSelect
}: AssignmentSidebarProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b sticky top-0 bg-background z-10">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground mt-2">{description}</p>
      </div>
      
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {modules.map(module => (
          <ModuleCard 
            key={module.id}
            title={module.title}
            learningText={module.learningText}
            hints={module.hints}
            isActive={module.id === activeModuleId}
            isCompleted={completedModules.includes(module.id)}
            onClick={() => onModuleSelect(module.id)}
          />
        ))}
      </div>
    </div>
  );
}