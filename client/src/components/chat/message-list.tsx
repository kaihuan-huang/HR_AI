import { useQuery } from "@tanstack/react-query";
import { Message } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

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

  return (
    <ScrollArea ref={scrollRef} className="flex-1 p-4">
      <AnimatePresence>
        <div className="space-y-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                "flex flex-col max-w-[80%] space-y-1",
                message.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div className={cn(
                "rounded-lg px-4 py-2",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}>
                <ReactMarkdown
                  className="prose prose-sm dark:prose-invert max-w-none"
                  components={{
                    p: ({ children }) => <p className="whitespace-pre-wrap m-0">{children}</p>,
                    a: ({ children, href }) => (
                      <a href={href} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    )
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
              <span className="text-xs text-muted-foreground">
                {format(new Date(message.createdAt), 'h:mm a')}
              </span>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </ScrollArea>
  );
}