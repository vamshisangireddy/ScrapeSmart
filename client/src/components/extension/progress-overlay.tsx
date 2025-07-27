import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Bot, X } from "lucide-react";

interface ProgressOverlayProps {
  isVisible: boolean;
  progress: number;
  status?: string;
  itemsFound?: number;
  timeElapsed?: string;
  onCancel: () => void;
}

export function ProgressOverlay({
  isVisible,
  progress,
  status = "Analyzing page structure",
  itemsFound = 0,
  timeElapsed = "00:00",
  onCancel
}: ProgressOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 m-4 max-w-sm w-full shadow-2xl">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bot className="h-6 w-6 text-primary animate-pulse" />
          </div>
          
          <h3 className="font-semibold text-gray-900 mb-2">
            Scraping in progress...
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            {status}
          </p>
          
          <div className="mb-4">
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
            <Badge variant="outline" className="text-xs">
              {itemsFound} items found
            </Badge>
            <span>{timeElapsed}</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-800"
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
