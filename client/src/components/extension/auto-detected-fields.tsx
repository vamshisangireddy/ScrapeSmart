import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Wand2, Plus, Target } from "lucide-react";
import type { DetectedField } from '@shared/schema';

interface AutoDetectedFieldsProps {
  fields: DetectedField[];
  isDetecting: boolean;
  onToggleField: (fieldId: string) => void;
  onDetectMore: () => void;
}

export function AutoDetectedFields({ 
  fields, 
  isDetecting, 
  onToggleField, 
  onDetectMore 
}: AutoDetectedFieldsProps) {
  const selectedCount = fields.filter(field => field.selected).length;

  return (
    <div className="p-4 border-b border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-medium text-gray-900 flex items-center">
          <Wand2 className="text-primary mr-2 h-4 w-4" />
          Auto-Detected Fields
        </h2>
        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-emerald-200">
          <Target className="h-3 w-3 mr-1" />
          {selectedCount} selected
        </Badge>
      </div>
      
      {isDetecting ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2 text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
            <span className="text-sm">Detecting fields...</span>
          </div>
        </div>
      ) : fields.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No fields detected</p>
          <p className="text-xs">Try refreshing or detecting manually</p>
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field) => (
            <div
              key={field.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => onToggleField(field.id)}
            >
              <div className="flex items-center space-x-3">
                <Checkbox 
                  checked={field.selected}
                  onChange={() => {}} // Handled by parent onClick
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900">{field.name}</p>
                    <Badge 
                      variant="outline" 
                      className="text-xs px-1.5 py-0.5"
                    >
                      {field.confidence}%
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {field.selectors.join(', ')}
                  </p>
                  {field.sampleData.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      Sample: {field.sampleData[0]}
                    </p>
                  )}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          ))}
        </div>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        className="w-full mt-3 text-primary hover:text-primary hover:bg-primary/5"
        onClick={onDetectMore}
        disabled={isDetecting}
      >
        <Plus className="h-4 w-4 mr-1" />
        Detect More Fields
      </Button>
    </div>
  );
}
