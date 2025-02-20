import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import MessageList from "@/components/chat/message-list";
import MessageInput from "@/components/chat/message-input";
import Workspace from "@/components/chat/workspace";
import { LogOut } from "lucide-react";
import { useState } from "react";

export default function ChatPage() {
  const { user, logoutMutation } = useAuth();
  const [workspaceContent, setWorkspaceContent] = useState<string | null>(null);

  const handleWorkspaceEdit = (content: string) => {
    setWorkspaceContent(content);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">AI Chat</h1>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">
            Logged in as {user?.username}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr,400px] overflow-hidden">
        <main className="flex flex-col h-full border-r">
          <MessageList />
          <MessageInput 
            onResponse={(content) => setWorkspaceContent(content)}
            workspaceContent={workspaceContent} 
          />
        </main>

        <aside className="hidden md:block p-6">
          <Workspace 
            content={workspaceContent} 
            onEdit={handleWorkspaceEdit}
          />
        </aside>
      </div>
    </div>
  );
}