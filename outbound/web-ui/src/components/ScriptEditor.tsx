import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogPortal,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAllScriptTemplates, type ScriptTemplate } from "@/app/campaigns/scripts";

interface ScriptEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialScript?: string;
  onSave: (script: string) => void;
  isLoading?: boolean;
}

export function ScriptEditor({
  open,
  onOpenChange,
  initialScript = "",
  onSave,
  isLoading = false,
}: ScriptEditorProps) {
  const [script, setScript] = useState(initialScript);
  const templates = getAllScriptTemplates();

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setScript(template.script);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Edit Campaign Script</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4">
              <Select onValueChange={handleTemplateChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent align="start" side="bottom">
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              className="min-h-[400px] font-mono"
              placeholder="Enter the AI conversation script..."
            />
            <Button onClick={() => onSave(script)} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Script"}
            </Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
} 