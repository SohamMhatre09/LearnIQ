import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface OutputPanelProps {
  output: string;
  isExecuting: boolean;
  expectedOutput?: string;
  onSuccess?: () => void;
}

export function OutputPanel({ output, isExecuting, expectedOutput, onSuccess }: OutputPanelProps) {
  const [activeTab, setActiveTab] = useState<"output" | "expected" | "console">("output");
  const [outputMatches, setOutputMatches] = useState<boolean | null>(null);
  
  // Switch to output tab when execution starts
  useEffect(() => {
    if (isExecuting) {
      setActiveTab("output");
      setOutputMatches(null);
    }
  }, [isExecuting]);
  
  // Check if output matches expected output
  useEffect(() => {
    if (!isExecuting && output && expectedOutput) {
      // Normalize both outputs (trim whitespace and remove extra spaces/newlines)
      const normalizedOutput = output.trim().replace(/\s+/g, ' ');
      const normalizedExpected = expectedOutput.trim().replace(/\s+/g, ' ');
      
      const matches = normalizedOutput === normalizedExpected;
      setOutputMatches(matches);
      
      if (matches && onSuccess) {
        onSuccess();
      }
    }
  }, [output, expectedOutput, isExecuting, onSuccess]);

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col border-0 rounded-none">
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as "output" | "expected" | "console")}
          className="flex-1 flex flex-col"
        >
          <CardHeader className="pb-2 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Output</CardTitle>
                {outputMatches !== null && (
                  outputMatches ? (
                    <div className="flex items-center text-green-500 gap-1 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      <span>Correct</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-500 gap-1 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>Incorrect</span>
                    </div>
                  )
                )}
              </div>
              <TabsList className="grid w-[260px] grid-cols-3">
                <TabsTrigger value="output">Output</TabsTrigger>
                {expectedOutput && <TabsTrigger value="expected">Expected</TabsTrigger>}
                <TabsTrigger value="console">Console</TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            <TabsContent value="output" className="m-0 flex-1 flex flex-col">
              <div className={cn(
                "h-full p-4 font-mono text-sm overflow-auto",
                outputMatches === true ? "bg-green-50 dark:bg-green-950/20" : "",
                outputMatches === false ? "bg-red-50 dark:bg-red-950/20" : ""
              )}>
                {isExecuting ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                    <span>Running...</span>
                  </div>
                ) : output ? (
                  <pre className="whitespace-pre-wrap">{output}</pre>
                ) : (
                  <div className="text-muted-foreground text-center p-8">
                    Run your code to see the output here
                  </div>
                )}
              </div>
            </TabsContent>
            
            {expectedOutput && (
              <TabsContent value="expected" className="m-0 flex-1 flex flex-col">
                <div className="h-full p-4 font-mono text-sm overflow-auto">
                  <pre className="whitespace-pre-wrap">{expectedOutput}</pre>
                </div>
              </TabsContent>
            )}
            
            <TabsContent value="console" className="m-0 flex-1 flex flex-col">
              <div className="h-full p-4 font-mono text-sm overflow-auto">
                <div className="text-muted-foreground text-center p-8">
                  Console logs will appear here
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}