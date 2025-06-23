
import { useState, useEffect } from "react";
import { Assignment, getAssignments, getModules, getAssignmentsByModule, getUserProgress } from "@/lib/assignments";
import { AssignmentCard } from "@/components/AssignmentCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

type SortOption = "recommended" | "title" | "difficulty" | "popular";
type FilterOption = "all" | "completed" | "in-progress";

export function AssignmentList() {
  const [modules, setModules] = useState<string[]>([]);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("recommended");
  const [filterOption, setFilterOption] = useState<FilterOption>("all");
  const [userProgress, setUserProgress] = useState<Record<string, any>>({});

  useEffect(() => {
    const modulesList = getModules();
    if (modulesList.length > 0) {
      setModules(modulesList);
      setActiveModule(modulesList[0]);
      setAssignments(getAssignmentsByModule(modulesList[0]));
      setFilteredAssignments(getAssignmentsByModule(modulesList[0]));
    }
    setUserProgress(getUserProgress());
  }, []);

  useEffect(() => {
    if (activeModule) {
      const moduleAssignments = getAssignmentsByModule(activeModule);
      setAssignments(moduleAssignments);
      applyFilters(moduleAssignments, searchQuery, sortOption, filterOption);
    }
  }, [activeModule, sortOption, filterOption, userProgress]);

  const applyFilters = (
    assignments: Assignment[],
    query: string,
    sort: SortOption,
    filter: FilterOption
  ) => {
    // Filter by search query
    let filtered = assignments.filter((assignment) =>
      assignment.title.toLowerCase().includes(query.toLowerCase())
    );

    // Filter by completion status
    if (filter === "completed") {
      filtered = filtered.filter(
        (assignment) => userProgress[assignment.id]?.completed
      );
    } else if (filter === "in-progress") {
      filtered = filtered.filter(
        (assignment) =>
          userProgress[assignment.id] && !userProgress[assignment.id].completed
      );
    }

    // Sort assignments
    if (sort === "title") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "difficulty") {
      const difficultyOrder = { Beginner: 1, Intermediate: 2, Advanced: 3 };
      filtered.sort(
        (a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
      );
    }
    // For "recommended" and "popular", we'll use the default order for now

    setFilteredAssignments(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters(assignments, query, sortOption, filterOption);
  };

  const handleModuleChange = (module: string) => {
    setActiveModule(module);
  };

  const isAssignmentCompleted = (assignmentId: string) => {
    return userProgress[assignmentId]?.completed || false;
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assignments..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
          <Select
            value={sortOption}
            onValueChange={(value) => setSortOption(value as SortOption)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recommended">Recommended</SelectItem>
              <SelectItem value="title">Title (A-Z)</SelectItem>
              <SelectItem value="difficulty">Difficulty (Easy to Hard)</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filterOption}
            onValueChange={(value) => setFilterOption(value as FilterOption)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignments</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue={modules[0]} className="w-full" onValueChange={handleModuleChange}>
        <TabsList className="w-full flex overflow-x-auto no-scrollbar mb-6">
          {modules.map((module) => (
            <TabsTrigger key={module} value={module} className="flex-1 whitespace-nowrap">
              {module}
            </TabsTrigger>
          ))}
        </TabsList>

        {modules.map((module) => (
          <TabsContent key={module} value={module} className="w-full">
            {filteredAssignments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAssignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    completed={isAssignmentCompleted(assignment.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-60 text-center">
                <Filter className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No assignments found</h3>
                <p className="text-muted-foreground">
                  Try changing your search or filter criteria
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
