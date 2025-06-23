
import { Assignment } from "@/lib/assignments";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, BookOpen, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface AssignmentCardProps {
  assignment: Assignment;
  completed?: boolean;
}

export function AssignmentCard({ assignment, completed = false }: AssignmentCardProps) {
  const navigate = useNavigate();
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "text-difficulty-beginner";
      case "Intermediate":
        return "text-difficulty-intermediate";
      case "Advanced":
        return "text-difficulty-advanced";
      default:
        return "text-difficulty-beginner";
    }
  };
  
  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return <Award className="h-4 w-4" />;
      case "Intermediate":
        return <Award className="h-4 w-4" />;
      case "Advanced":
        return <Award className="h-4 w-4" />;
      default:
        return <Award className="h-4 w-4" />;
    }
  };

  return (    <Card 
      className={cn(
        "w-full h-full relative overflow-hidden animate-hover hover:shadow-card-hover cursor-pointer border-2",
        completed ? "border-l-4 border-l-yellow-400" : ""
      )}
      onClick={() => navigate(`/assignment/${assignment.id}`)}
    >
      {completed && (
        <div className="absolute top-3 right-3">
          <CheckCircle className="h-5 w-5 text-yellow-400" />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className={cn("flex items-center gap-1", getDifficultyColor(assignment.difficulty))}>
            {getDifficultyIcon(assignment.difficulty)}
            {assignment.difficulty}
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {assignment.estimatedTime}
          </Badge>
        </div>
        <CardTitle className="text-xl tracking-tight">{assignment.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-2">
          Module: <span className="font-medium text-foreground">{assignment.module}</span>
        </p>
        {assignment.prerequisites.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Prerequisites: {assignment.prerequisites.join(", ")}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-0">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          {assignment.steps.length} step{assignment.steps.length !== 1 ? "s" : ""}
        </div>        <div className="text-sm font-medium text-blue-500 animate-hover hover:underline hover:text-blue-600">
          {completed ? "Review" : "Start learning"} →
        </div>
      </CardFooter>
    </Card>
  );
}
