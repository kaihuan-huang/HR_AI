import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface MessageInputProps {
  onResponse: (content: string) => void;
  workspaceContent?: string | null;
}

export default function MessageInput({ onResponse, workspaceContent }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const payload = {
        content,
        role: "user",
        context: workspaceContent ? {
          workspace: workspaceContent
        } : undefined
      };

      const res = await apiRequest("POST", "/api/messages", payload);
      return res.json();
    },
    onSuccess: (data) => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      // Send AI's response to workspace
      if (data.aiMessage) {
        onResponse(data.aiMessage.content);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage.mutate(message);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="border-t p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={
              workspaceContent
                ? "Suggest edits or give feedback on the sequence..."
                : "Describe your campaign idea or ask for suggestions..."
            }
            className="min-h-[80px] pr-24 resize-none bg-white/50 focus:bg-white transition-colors duration-200"
          />
          <div className="absolute right-3 bottom-3 text-xs text-muted-foreground pointer-events-none">
            Press Enter to send
          </div>
        </div>
        <Button 
          type="submit" 
          size="icon" 
          disabled={sendMessage.isPending || !message.trim()}
          className={`transition-all duration-200 ${
            message.trim() ? 'opacity-100 scale-100' : 'opacity-50 scale-95'
          }`}
        >
          {sendMessage.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </motion.form>
  );
}