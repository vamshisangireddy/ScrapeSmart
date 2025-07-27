import { useExtension } from "@/hooks/use-extension";
import { AutoDetectedFields } from "@/components/extension/auto-detected-fields";
import { ExportOptionsComponent } from "@/components/extension/export-options";
import { ProgressOverlay } from "@/components/extension/progress-overlay";
import { ActionButtons } from "@/components/extension/action-buttons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Bot, Monitor, Chrome, Download, Wand2 } from "lucide-react";

export default function DemoPage() {
  const {
    isExtensionContext,
    pageInfo,
    detectedFields,
    isDetecting,
    isScraping,
    scrapingProgress,
    selectedFormat,
    exportOptions,
    detectFields,
    toggleField,
    selectFormat,
    startScraping,
    saveTemplate,
    updateExportOptions
  } = useExtension();

  const selectedFieldsCount = detectedFields.filter(field => field.selected).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-blue-700 rounded-xl flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">WebScraper Pro</h1>
                <p className="text-sm text-gray-600">Intelligent web scraping extension demo</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">
              <Chrome className="h-3 w-3 mr-1" />
              Chrome Extension
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Demo Info */}
          <div className="space-y-6">
            <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Monitor className="h-5 w-5 mr-2 text-primary" />
                Extension Preview
              </h2>
              <p className="text-gray-600 mb-4">
                This is a live preview of the WebScraper Pro Chrome extension popup interface. 
                The extension provides intelligent field detection and multi-format export capabilities 
                for any webpage.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Wand2 className="h-4 w-4 text-primary" />
                  <span className="text-sm text-gray-700">Automatic field detection using AI</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Download className="h-4 w-4 text-primary" />
                  <span className="text-sm text-gray-700">Export to CSV, JSON, XML, and Excel</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4 text-primary" />
                  <span className="text-sm text-gray-700">Customizable scraping templates</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Demo Features</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Pre-loaded sample data from an e-commerce site</li>
                  <li>• Fully functional export system</li>
                  <li>• Real-time progress tracking</li>
                  <li>• Template saving and loading</li>
                </ul>
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
              <h3 className="font-medium text-gray-900 mb-3">Current Page Analysis</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">URL:</span>
                  <span className="font-mono text-xs text-gray-800">{pageInfo?.url}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Domain:</span>
                  <span className="text-gray-800">{pageInfo?.domain}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fields Detected:</span>
                  <span className="text-gray-800">{detectedFields.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Selected:</span>
                  <span className="text-gray-800">{selectedFieldsCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Extension Popup */}
          <div className="flex justify-center">
            <div className="w-[380px] bg-white shadow-2xl rounded-xl overflow-hidden border border-gray-200">
              {/* Extension Header */}
              <header className="bg-gradient-to-r from-primary to-blue-700 text-white p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <h1 className="font-semibold text-sm">WebScraper Pro</h1>
                    <p className="text-xs text-blue-100">
                      {pageInfo?.domain || 'Current page ready'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 bg-white/10 hover:bg-white/20 p-0"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </header>

              {/* Extension Main Content */}
              <div className="h-[480px] overflow-y-auto">
                <AutoDetectedFields
                  fields={detectedFields}
                  isDetecting={isDetecting}
                  onToggleField={toggleField}
                  onDetectMore={detectFields}
                />

                <ExportOptionsComponent
                  selectedFormat={selectedFormat}
                  exportOptions={exportOptions}
                  previewData={detectedFields.filter(f => f.selected).map(f => ({
                    field: f.name,
                    data: f.sampleData
                  }))}
                  onSelectFormat={selectFormat}
                  onUpdateOptions={updateExportOptions}
                />
              </div>

              {/* Extension Action Buttons */}
              <ActionButtons
                isScraping={isScraping}
                selectedFieldsCount={selectedFieldsCount}
                onStartScraping={async () => { await startScraping(); }}
                onSaveTemplate={saveTemplate}
                onLoadTemplate={() => {/* TODO: Implement template loading */}}
              />

              {/* Progress Overlay */}
              <ProgressOverlay
                isVisible={isScraping}
                progress={scrapingProgress}
                status="Extracting data from page..."
                itemsFound={selectedFieldsCount}
                timeElapsed={`00:${Math.floor(scrapingProgress / 10).toString().padStart(2, '0')}`}
                onCancel={() => {/* TODO: Implement cancel */}}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}