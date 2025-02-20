import { useQuery } from "@tanstack/react-query";
import { Message } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

export default function MessageList() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 p-4 flex items-center justify-center">
        <p className="text-muted-foreground">Loading messages...</p>
      </div>
    );
  }

  // Only show user messages
  const userMessages = messages.filter(message => message.role === "user");

  return (
    <ScrollArea ref={scrollRef} className="flex-1 p-4">
      <div className="space-y-4">
        {userMessages.map((message) => (
          <div
            key={message.id}
            className="flex w-max max-w-[80%] ml-auto rounded-lg px-4 py-2 bg-primary text-primary-foreground"
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}