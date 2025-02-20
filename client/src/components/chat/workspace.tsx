import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface WorkspaceProps {
  content: string | null;
}

export default function Workspace({ content }: WorkspaceProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Sequence</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-12rem)]">
          {content ? (
            <div className="space-y-4">
              {content.split('\n').map((line, index) => (
                <p key={index} className="text-sm">{line}</p>
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
