import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, CheckCircle } from "lucide-react";

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
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

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
    if (!newContent.trim()) return;

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

  const handleKeyPress = (e: React.KeyboardEvent, stepId: number, content: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleStepEdit(stepId, content);
    } else if (e.key === 'Escape') {
      setEditingStep(null);
    }
  };

  return (
    <Card className="h-full border-none shadow-none bg-slate-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <span className="text-primary">Sequence</span>
          {steps.length > 0 && (
            <span className="text-xs text-muted-foreground font-normal">
              {steps.length} steps
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <AnimatePresence>
            {steps.length > 0 ? (
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {steps.map((step) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="group"
                    onMouseEnter={() => setHoveredStep(step.id)}
                    onMouseLeave={() => setHoveredStep(null)}
                  >
                    <div className={`
                      p-4 rounded-lg transition-all duration-200
                      ${editingStep === step.id ? 'bg-white shadow-lg' : 'bg-white/50 hover:bg-white hover:shadow-md'}
                    `}>
                      {editingStep === step.id ? (
                        <div className="space-y-2">
                          <Input
                            defaultValue={step.content}
                            onBlur={(e) => handleStepEdit(step.id, e.target.value)}
                            onKeyDown={(e) => handleKeyPress(e, step.id, (e.target as HTMLInputElement).value)}
                            autoFocus
                            className="border-primary/20 focus:border-primary"
                            placeholder="Enter step description..."
                          />
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            <span>Press Enter to save</span>
                            <span>Esc to cancel</span>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer rounded transition-all"
                          onClick={() => setEditingStep(step.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-sm text-muted-foreground mb-1">
                              Step {step.id}
                            </div>
                            {hoveredStep === step.id && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-primary/60 hover:text-primary"
                              >
                                <Edit2 className="h-4 w-4" />
                              </motion.div>
                            )}
                          </div>
                          <div className="text-sm leading-relaxed">{step.content}</div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground"
              >
                <p>No sequence generated.</p>
                <p className="text-sm mt-2">Start chatting to create a sequence.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}