import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Play, Save, FolderOpen, Loader2 } from "lucide-react";
import { useState } from "react";

interface ActionButtonsProps {
  isScraping: boolean;
  selectedFieldsCount: number;
  onStartScraping: () => Promise<void>;
  onSaveTemplate: (name: string) => Promise<void>;
  onLoadTemplate: () => void;
}

export function ActionButtons({
  isScraping,
  selectedFieldsCount,
  onStartScraping,
  onSaveTemplate,
  onLoadTemplate
}: ActionButtonsProps) {
  const [templateName, setTemplateName] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleStartScraping = async () => {
    if (selectedFieldsCount === 0) {
      alert("Please select at least one field to scrape");
      return;
    }
    
    try {
      await onStartScraping();
    } catch (error) {
      console.error("Scraping failed:", error);
      alert("Scraping failed: " + (error as Error).message);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;
    
    setIsSavingTemplate(true);
    try {
      await onSaveTemplate(templateName.trim());
      setTemplateName("");
      setShowSaveDialog(false);
    } catch (error) {
      console.error("Failed to save template:", error);
      alert("Failed to save template: " + (error as Error).message);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  return (
    <div className="p-4 bg-gray-50 border-t border-gray-200">
      <div className="space-y-2">
        <Button
          className="w-full bg-primary hover:bg-blue-700 text-white font-medium py-3 px-4 flex items-center justify-center"
          onClick={handleStartScraping}
          disabled={isScraping || selectedFieldsCount === 0}
        >
          {isScraping ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Scraping...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Start Scraping
            </>
          )}
        </Button>
        
        <div className="flex space-x-2">
          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 py-2 px-4 flex items-center justify-center"
                disabled={selectedFieldsCount === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Save Scraping Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Enter template name..."
                    className="mt-1"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowSaveDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveTemplate}
                    disabled={!templateName.trim() || isSavingTemplate}
                  >
                    {isSavingTemplate ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button
            variant="outline"
            className="flex-1 py-2 px-4 flex items-center justify-center"
            onClick={onLoadTemplate}
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Load Template
          </Button>
        </div>
      </div>
    </div>
  );
}
