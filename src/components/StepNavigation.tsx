
import { Button } from "@/components/ui/button";
import { Assignment } from "@/lib/assignments";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StepNavigationProps {
  assignment: Assignment;
  currentStepIndex: number;
  onStepChange: (stepIndex: number) => void;
}

export function StepNavigation({
  assignment,
  currentStepIndex,
  onStepChange,
}: StepNavigationProps) {
  const navigate = useNavigate();
  const totalSteps = assignment.steps.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  const handlePrevious = () => {
    if (!isFirstStep) {
      onStepChange(currentStepIndex - 1);
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      onStepChange(currentStepIndex + 1);
    } else {
      // If it's the last step, navigate back to the assignments list
      navigate("/");
    }
  };

  return (
    <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
      <div className="text-sm text-muted-foreground">
        <span>Step </span>
        <span className="font-medium text-foreground">{currentStepIndex + 1}</span>
        <span> of </span>
        <span className="font-medium text-foreground">{totalSteps}</span>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={isFirstStep}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleNext}
          className="flex items-center gap-1"
        >
          {isLastStep ? "Finish" : "Next"}
          {!isLastStep && <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
