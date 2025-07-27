import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, FileSpreadsheet, File, Code, ExpandIcon } from "lucide-react";
import type { ExportOptions } from '@shared/schema';

interface ExportOptionsProps {
  selectedFormat: 'csv' | 'json' | 'xml' | 'excel';
  exportOptions: ExportOptions;
  previewData?: any[];
  onSelectFormat: (format: 'csv' | 'json' | 'xml' | 'excel') => void;
  onUpdateOptions: (updates: Partial<ExportOptions>) => void;
}

export function ExportOptionsComponent({ 
  selectedFormat, 
  exportOptions, 
  previewData = [], 
  onSelectFormat, 
  onUpdateOptions 
}: ExportOptionsProps) {
  const formatIcons = {
    csv: FileSpreadsheet,
    json: Code,
    excel: FileSpreadsheet,
    xml: FileText
  };

  const formatLabels = {
    csv: 'CSV',
    json: 'JSON',
    excel: 'Excel',
    xml: 'XML'
  };

  return (
    <div className="p-4 border-b border-gray-100">
      <h3 className="font-medium text-gray-900 mb-3 flex items-center">
        <Download className="text-primary mr-2 h-4 w-4" />
        Export Format
      </h3>
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        {(['csv', 'json', 'excel', 'xml'] as const).map((format) => {
          const Icon = formatIcons[format];
          const isSelected = selectedFormat === format;
          
          return (
            <Button
              key={format}
              variant={isSelected ? "default" : "outline"}
              className={`p-3 h-auto flex-col space-y-1 ${
                isSelected 
                  ? 'bg-primary text-white border-primary' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => onSelectFormat(format)}
            >
              <Icon className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
              <span className={`text-xs font-medium ${
                isSelected ? 'text-white' : 'text-gray-600'
              }`}>
                {formatLabels[format]}
              </span>
            </Button>
          );
        })}
      </div>

      {/* Advanced Options */}
      <div className="space-y-3 text-sm border-t pt-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="pagination" className="text-gray-700">Include pagination</Label>
          <Checkbox 
            id="pagination"
            checked={exportOptions.includePagination}
            onCheckedChange={(checked) => 
              onUpdateOptions({ includePagination: checked as boolean })
            }
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="autoscroll" className="text-gray-700">Auto-scroll detection</Label>
          <Checkbox 
            id="autoscroll"
            checked={exportOptions.autoScroll}
            onCheckedChange={(checked) => 
              onUpdateOptions({ autoScroll: checked as boolean })
            }
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="duplicates" className="text-gray-700">Remove duplicates</Label>
          <Checkbox 
            id="duplicates"
            checked={exportOptions.removeDuplicates}
            onCheckedChange={(checked) => 
              onUpdateOptions({ removeDuplicates: checked as boolean })
            }
          />
        </div>
        
        <div>
          <Label htmlFor="delay" className="text-gray-700 block mb-1">
            Delay between requests (ms)
          </Label>
          <Input
            id="delay"
            type="number"
            value={exportOptions.delay}
            min={0}
            max={5000}
            onChange={(e) => 
              onUpdateOptions({ delay: parseInt(e.target.value) || 1000 })
            }
            className="text-sm"
          />
        </div>

        <div>
          <Label htmlFor="filename" className="text-gray-700 block mb-1">
            Filename
          </Label>
          <Input
            id="filename"
            type="text"
            value={exportOptions.filename}
            placeholder={`scraped-data-${Date.now()}.${selectedFormat}`}
            onChange={(e) => 
              onUpdateOptions({ filename: e.target.value })
            }
            className="text-sm"
          />
        </div>
      </div>
      
      {/* Data Preview */}
      {previewData.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 text-xs mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 font-medium">
              Preview ({Math.min(previewData.length, 5)} rows)
            </span>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <ExpandIcon className="h-3 w-3" />
            </Button>
          </div>
          <div className="bg-white rounded border text-xs overflow-hidden">
            <div className="bg-gray-100 px-2 py-1 border-b text-gray-700 font-medium">
              {previewData[0]?.field || 'field'},{previewData[1]?.field || 'value'}
            </div>
            {previewData.slice(0, 3).map((item, index) => (
              <div key={index} className="px-2 py-1 border-b last:border-b-0 text-gray-600 truncate">
                "{item.field || 'Sample'}","{item.data?.[0] || 'data'}"
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
