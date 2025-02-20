import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MessageInputProps {
  onResponse: (content: string) => void;
}

export default function MessageInput({ onResponse }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/messages", { content, role: "user" });
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

  return (
    <form onSubmit={handleSubmit} className="border-t p-4">
      <div className="flex gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="min-h-[80px]"
        />
        <Button type="submit" size="icon" disabled={sendMessage.isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}