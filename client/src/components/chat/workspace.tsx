import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

interface Step {
  id: number;
  content: string;
}

interface WorkspaceProps {
  content: string | null;
  onEdit?: (content: string) => void;
}

export default function Workspace({ content, onEdit }: WorkspaceProps) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [editingStep, setEditingStep] = useState<number | null>(null);

  useEffect(() => {
    if (content) {
      // Try to parse content as steps if it contains line items
      const lines = content.split('\n').filter(line => line.trim());
      if (lines.some(line => line.startsWith('Step '))) {
        const newSteps = lines.map((line, index) => ({
          id: index + 1,
          content: line.replace(/^Step \d+:\s*/, '').trim()
        }));
        setSteps(newSteps);
      } else {
        setSteps([{ id: 1, content: content }]);
      }
    }
  }, [content]);

  const handleStepEdit = (stepId: number, newContent: string) => {
    setSteps(steps.map(step => 
      step.id === stepId ? { ...step, content: newContent } : step
    ));
    setEditingStep(null);

    if (onEdit) {
      const updatedContent = steps
        .map(step => `Step ${step.id}: ${step.content}`)
        .join('\n');
      onEdit(updatedContent);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Sequence</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-12rem)]">
          {steps.length > 0 ? (
            <div className="space-y-4">
              {steps.map((step) => (
                <div key={step.id} className="p-4 bg-muted rounded-lg">
                  {editingStep === step.id ? (
                    <div className="space-y-2">
                      <Input
                        defaultValue={step.content}
                        onBlur={(e) => handleStepEdit(step.id, e.target.value)}
                        autoFocus
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingStep(null)}
                      >
                        Done
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="cursor-pointer hover:bg-muted-foreground/10 p-2 rounded"
                      onClick={() => setEditingStep(step.id)}
                    >
                      <div className="font-semibold text-sm text-muted-foreground mb-1">
                        Step {step.id}
                      </div>
                      <div className="text-sm">{step.content}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No sequence generated.</p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}