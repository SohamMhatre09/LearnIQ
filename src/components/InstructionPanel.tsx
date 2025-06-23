import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StepNavigation } from "@/components/StepNavigation";
import { Lightbulb, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface InstructionPanelProps {
  assignment: any;
  currentStepIndex: number;
  onStepChange: (stepIndex: number) => void;
  completedModules: string[];
}

export function InstructionPanel({
  assignment,
  currentStepIndex,
  onStepChange,
  completedModules,
}: InstructionPanelProps) {
  const { toast } = useToast();
  const [showHint, setShowHint] = useState(false);
  
  const currentModule = assignment.modules[currentStepIndex];
  const totalModules = assignment.modules.length;
  const isFirstModule = currentStepIndex === 0;
  const isLastModule = currentStepIndex === totalModules - 1;

  const handlePrevious = () => {
    if (!isFirstModule) {
      onStepChange(currentStepIndex - 1);
    }
  };

  const handleNext = () => {
    if (!isLastModule) {
      onStepChange(currentStepIndex + 1);
    }
  };

  const currentStep = currentModule;
  const isCurrentStepCompleted = completedModules.includes(currentStep.id.toString());
  const isNextStepUnlocked = 
    currentStepIndex + 1 < totalModules && 
    (completedModules.includes(currentStep.id) || currentStepIndex === 0);

  const toggleHint = () => {
    setShowHint(!showHint);
  };

  const renderContent = (content: string) => {
    // Very simple Markdown parsing (for a real app would use a proper MD library)
    return content.split("\n").map((line, i) => {
      if (line.startsWith("- ")) {
        return (
          <li key={i} className="ml-4 mb-2">
            {renderInlineCode(line.substring(2))}
          </li>
        );
      } else if (line.startsWith("1. ") || line.startsWith("2. ") || line.startsWith("3. ")) {
        return (
          <li key={i} className="ml-4 list-decimal mb-2">
            {renderInlineCode(line.substring(3))}
          </li>
        );
      } else if (line === "") {
        return <br key={i} />;
      } else {
        return <p key={i} className="mb-4">{renderInlineCode(line)}</p>;
      }
    });
  };

  const renderInlineCode = (text: string) => {
    const parts = text.split("`");
    return parts.map((part, i) => {
      // Every odd index is code
      if (i % 2 === 1) {
        return (
          <code
            key={i}
            className="bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded code-font text-sm"
          >
            {part}
          </code>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-semibold mb-1">{currentStep.title}</h1>
        <p className="text-sm text-muted-foreground">
          {assignment.title}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {renderContent(currentStep.learningText || "")}
        </div>

        {currentStep.hints && currentStep.hints.length > 0 && (
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-full justify-start",
                showHint && "border-primary/50"
              )}
              onClick={toggleHint}
            >
              <Lightbulb
                className={cn(
                  "h-4 w-4 mr-2",
                  showHint ? "text-amber-400" : "text-muted-foreground"
                )}
              />
              {showHint ? "Hide Hints" : "Show Hints"}
            </Button>
            {showHint && currentStep.hints && (
              <Card className="p-4 bg-muted/50 border-primary/20 animate-scale-in">
                <ul className="text-sm list-disc pl-5 space-y-2">
                  {currentStep.hints.map((hint, index) => (
                    <li key={index}>{hint}</li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={isFirstModule}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentStepIndex + 1} / {totalModules}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={isLastModule || !isCurrentStepCompleted}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}