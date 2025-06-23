import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Editor from "@monaco-editor/react";
import { useTheme } from "@/components/ThemeProvider";
import { Play, RotateCcw, Sun, Moon, Lightbulb } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import * as monaco from 'monaco-editor';

interface CodeEditorProps {
  module: {
    id: number;
    title: string;
    codeTemplate: string;
    learningText: string;
    hints: string[];
    expectedOutput: string;
  };
  onSubmit: (code: string, moduleId: number) => void;
  onRun: (code: string, moduleId: number) => void;
  isExecuting: boolean;
  assignmentName?: string;
  code?: string;
  onCodeChange?: (code: string) => void;
  isLastModule?: boolean;
  isCurrentModuleCompleted?: boolean;
  onFinalSubmit?: () => void;
}

interface EditableSection {
  startLine: number;
  endLine: number;
}

export function CodeEditor({ 
  module,
  onSubmit, 
  onRun, 
  isExecuting,
  assignmentName,
  code: externalCode,
  onCodeChange,
  isLastModule = false,
  isCurrentModuleCompleted = false,
  onFinalSubmit
}: CodeEditorProps) {
  const { theme: systemTheme } = useTheme();
  const [editorTheme, setEditorTheme] = useState<"light" | "vs-dark">(systemTheme === 'dark' ? 'vs-dark' : 'light');
  const [code, setCode] = useState<string>("");
  const [hintDialogOpen, setHintDialogOpen] = useState(false);
  const [generatingHint, setGeneratingHint] = useState(false);
  const [aiHint, setAiHint] = useState<string>("");
  const [hintQuery, setHintQuery] = useState<string>("");
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);
  
  // Toggle the editor theme
  const toggleEditorTheme = () => {
    setEditorTheme(editorTheme === 'vs-dark' ? 'light' : 'vs-dark');
  };

  useEffect(() => {
    // Update editor theme when system theme changes
    setEditorTheme(systemTheme === 'dark' ? 'vs-dark' : 'light');
  }, [systemTheme]);

  // Process code template to remove tags and identify editable sections
  const processCodeTemplate = (rawCode: string) => {
    if (!rawCode) return { cleanCode: "", editableSections: [] };

    // Step 1: Find all editable sections in the original code
    const editableSections: EditableSection[] = [];
    const lines = rawCode.split('\n');
    let currentEditableStart: number | null = null;
    let adjustedLineIndex = 1; // Monaco uses 1-based line numbers
    
    // Step 2: Remove tags and track which lines will be editable
    const cleanLines: string[] = [];
    
    for (const line of lines) {
      let processedLine = line;
      let shouldIncludeLine = true;
      
      // Check for opening editable tag
      if (line.includes('<editable>')) {
        currentEditableStart = adjustedLineIndex;
        processedLine = processedLine.replace(/<editable>/g, '');
        
        // If line becomes empty after removing tag, don't include it
        if (processedLine.trim() === '') {
          shouldIncludeLine = false;
        }
      }
      
      // Check for closing editable tag
      if (line.includes('</editable>')) {
        processedLine = processedLine.replace(/<\/editable>/g, '');
        
        if (currentEditableStart !== null) {
          // If the processed line has content, include it in the section
          const endLine = shouldIncludeLine && processedLine.trim() !== '' ? adjustedLineIndex : adjustedLineIndex - 1;
          
          editableSections.push({
            startLine: currentEditableStart,
            endLine: endLine
          });
          currentEditableStart = null;
        }
        
        // If line becomes empty after removing tag, don't include it
        if (processedLine.trim() === '') {
          shouldIncludeLine = false;
        }
      }
      
      // Add the line to clean code if it should be included
      if (shouldIncludeLine) {
        cleanLines.push(processedLine);
        adjustedLineIndex++;
      }
    }
    
    // Handle case where editable section wasn't closed
    if (currentEditableStart !== null) {
      editableSections.push({
        startLine: currentEditableStart,
        endLine: adjustedLineIndex - 1
      });
    }

    return {
      cleanCode: cleanLines.join('\n'),
      editableSections
    };
  };

  // Apply decorations to highlight editable sections
  const applyEditableHighlights = (editableSections: EditableSection[]) => {
    if (!editorRef.current) return;

    // Clear existing decorations
    decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);

    // Define highlight color based on theme
    const highlightColor = editorTheme === 'vs-dark' 
      ? 'rgba(255, 255, 255, 0.08)' // Light highlight for dark theme
      : 'rgba(0, 0, 0, 0.05)'; // Dark highlight for light theme

    // Create decorations for editable sections
    const decorations: monaco.editor.IModelDeltaDecoration[] = editableSections.map(section => ({
      range: new monaco.Range(section.startLine, 1, section.endLine, 1),
      options: {
        isWholeLine: true,
        className: 'editable-line-highlight',
        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        overviewRuler: {
          color: highlightColor,
          position: monaco.editor.OverviewRulerLane.Left
        },
        minimap: {
          color: highlightColor,
          position: monaco.editor.MinimapPosition.Inline
        }
      }
    }));

    // Apply decorations
    decorationsRef.current = editorRef.current.deltaDecorations([], decorations);

    // Add CSS for the highlight if it doesn't exist
    if (!document.getElementById('editable-highlight-styles')) {
      const style = document.createElement('style');
      style.id = 'editable-highlight-styles';
      style.textContent = `
        .editable-line-highlight {
          background-color: ${highlightColor} !important;
        }
      `;
      document.head.appendChild(style);
    } else {
      // Update existing styles for theme changes
      const existingStyle = document.getElementById('editable-highlight-styles');
      if (existingStyle) {
        existingStyle.textContent = `
          .editable-line-highlight {
            background-color: ${highlightColor} !important;
          }
        `;
      }
    }
  };

  // Update internal code when external code changes or module changes
  useEffect(() => {
    let codeToProcess = "";
    
    if (externalCode !== undefined) {
      codeToProcess = externalCode;
    } else if (module && module.codeTemplate) {
      codeToProcess = module.codeTemplate;
    }

    const { cleanCode, editableSections } = processCodeTemplate(codeToProcess);
    setCode(cleanCode);

    // Apply highlights after a short delay to ensure editor is ready
    setTimeout(() => {
      applyEditableHighlights(editableSections);
    }, 100);
  }, [externalCode, module.id, editorTheme]);

  // Update highlights when theme changes
  useEffect(() => {
    if (editorRef.current) {
      const { editableSections } = processCodeTemplate(
        externalCode || module?.codeTemplate || ""
      );
      applyEditableHighlights(editableSections);
    }
  }, [editorTheme]);

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
      // Call the parent's onCodeChange handler
      if (onCodeChange) {
        onCodeChange(value);
      }
    }
  };

  const handleSubmit = () => {
    onSubmit(code, module.id);
  };

  const handleRun = async () => {
    await onRun(code, module.id);
  };

  const handleResetCode = () => {
    if (module && module.codeTemplate) {
      const { cleanCode, editableSections } = processCodeTemplate(module.codeTemplate);
      setCode(cleanCode);
      
      // Reapply highlights after reset
      setTimeout(() => {
        applyEditableHighlights(editableSections);
      }, 100);
    }
  };

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    
    // Apply initial highlights
    const { editableSections } = processCodeTemplate(
      externalCode || module?.codeTemplate || ""
    );
    applyEditableHighlights(editableSections);

    // Add keyboard shortcut for running code
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRun();
    });
  };

  const requestAiHint = async () => {
    setGeneratingHint(true);
    try {
      // Construct the prompt for the AI
      const prompt = `
I'm working on a coding assignment with the following requirements:
Title: ${module.title}
Instructions: ${module.learningText}
Expected Output: ${module.expectedOutput}

Here's my current code:
\`\`\`python
${code}
\`\`\`

My specific question is: ${hintQuery}

Please provide a helpful hint that guides me toward the solution without giving me the complete answer. Help me understand the concept and suggest an approach to solve the problem. If the user specifically mentions about the coding snippet help him by giving him the solution.
`;

      // Call Gemini API with correct model name
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
            topK: 40,
            topP: 0.95
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      // Process the response from Gemini API
      const result = await response.json();
      
      if (result.candidates && result.candidates[0] && result.candidates[0].content) {
        const aiResponse = result.candidates[0].content.parts[0].text;
        setAiHint(aiResponse);
      } else {
        throw new Error("Invalid response format from API");
      }
      
      setGeneratingHint(false);

    } catch (error) {
      console.error("Error generating hint:", error);
      setAiHint("Sorry, there was an error generating your hint. Please try again.");
      setGeneratingHint(false);
    }
  };

  // Monaco editor options
  const editorOptions = {
    scrollBeyondLastLine: false,
    minimap: { enabled: false },
    fontSize: 14,
    automaticLayout: true,
    wordWrap: "on",
    lineNumbers: "on",
    folding: true,
    bracketPairColorization: { enabled: true },
    padding: { top: 16, bottom: 16 },
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetCode}
            className="flex items-center gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset Code
          </Button>
          <Button
            variant="secondary" 
            size="sm"
            onClick={handleRun}
            disabled={isExecuting}
            className="flex items-center gap-1"
          >
            <Play className="h-3.5 w-3.5" /> Run Code
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHintDialogOpen(true)}
            className="flex items-center gap-1 border-amber-400/50 text-amber-500 hover:bg-amber-500/10"
          >
            <Lightbulb className="h-3.5 w-3.5" /> AI Hint
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          {isLastModule ? (
            <Button 
              onClick={onFinalSubmit} 
              className="ml-auto"
              disabled={!isCurrentModuleCompleted}
            >
              Submit Assignment
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              className="ml-auto"
            >
              Submit Solution
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleEditorTheme}
            title={editorTheme === 'vs-dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {editorTheme === 'vs-dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      
      {/* Code Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="python"
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          options={editorOptions}
          theme={editorTheme}
        />
      </div>
      
      <div className="p-2 border-t bg-muted text-xs text-muted-foreground">
        <kbd className="px-1 py-0.5 bg-muted-foreground/20 rounded">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-muted-foreground/20 rounded">Enter</kbd> to run your code
      </div>

      {/* AI Hint Dialog */}
      <Dialog open={hintDialogOpen} onOpenChange={setHintDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-400" />
              AI Coding Assistant
            </DialogTitle>
            <DialogDescription>
              Ask a specific question about your code and get a hint without revealing the complete solution.
            </DialogDescription>
          </DialogHeader>
          
          {!aiHint ? (
            <>
              <div className="space-y-4 py-4">
                <Textarea 
                  placeholder="What are you stuck on? Be specific about the problem you're facing."
                  value={hintQuery}
                  onChange={(e) => setHintQuery(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  onClick={requestAiHint}
                  disabled={!hintQuery.trim() || generatingHint}
                >
                  {generatingHint ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating hint...
                    </>
                  ) : (
                    "Get Hint"
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="bg-muted p-4 rounded-md text-sm">
                  {aiHint}
                </div>
              </div>
              <DialogFooter className="flex flex-row justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setAiHint("");
                    setHintQuery("");
                  }}
                >
                  Ask Another Question
                </Button>
                <Button 
                  onClick={() => setHintDialogOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}