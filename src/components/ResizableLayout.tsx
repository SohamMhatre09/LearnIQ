import React, { useState, useEffect } from 'react';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";

interface ResizableLayoutProps {
  leftContent?: React.ReactNode;
  centerContent: React.ReactNode;
  rightContent?: React.ReactNode;
  showLeft?: boolean;
  showRight?: boolean;
}

export function ResizableLayout({
  leftContent,
  centerContent,
  rightContent,
  showLeft = true,
  showRight = true
}: ResizableLayoutProps) {
  // Determine initial layout based on visible panels
  const getInitialLayout = () => {
    if (showLeft && showRight) return [25, 50, 25];
    if (showLeft) return [30, 70];
    if (showRight) return [70, 30];
    return [100];
  };

  const [layout, setLayout] = useState(getInitialLayout());

  // Update layout when visibility changes
  useEffect(() => {
    setLayout(getInitialLayout());
  }, [showLeft, showRight]);

  if (!showLeft && !showRight) {
    return <div className="h-full">{centerContent}</div>;
  }

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full"
      onLayout={(sizes) => setLayout(sizes)}
    >
      {showLeft && (
        <>
          <ResizablePanel defaultSize={layout[0]} minSize={20} maxSize={40}>
            {leftContent}
          </ResizablePanel>
          <ResizableHandle withHandle />
        </>
      )}
      
      <ResizablePanel defaultSize={showLeft && showRight ? layout[1] : (showLeft || showRight ? layout[1] : layout[0])}>
        {centerContent}
      </ResizablePanel>
      
      {showRight && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={layout[showLeft ? 2 : 1]} minSize={20} maxSize={40}>
            {rightContent}
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
}