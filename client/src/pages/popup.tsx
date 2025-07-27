import { useExtension } from "@/hooks/use-extension";
import { AutoDetectedFields } from "@/components/extension/auto-detected-fields";
import { ExportOptionsComponent } from "@/components/extension/export-options";
import { ProgressOverlay } from "@/components/extension/progress-overlay";
import { ActionButtons } from "@/components/extension/action-buttons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Bot } from "lucide-react";

export default function PopupPage() {
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

  if (!isExtensionContext) {
    return (
      <div className="w-[380px] h-[580px] bg-white flex items-center justify-center">
        <div className="text-center p-8">
          <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Extension Required
          </h2>
          <p className="text-sm text-gray-600">
            This interface requires the Chrome extension context to function properly.
          </p>
        </div>
      </div>
    );
  }

  const selectedFieldsCount = detectedFields.filter(field => field.selected).length;

  return (
    <div className="w-[380px] h-[580px] bg-white shadow-2xl overflow-hidden flex flex-col">
      {/* Header */}
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

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
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

      {/* Action Buttons */}
      <ActionButtons
        isScraping={isScraping}
        selectedFieldsCount={selectedFieldsCount}
        onStartScraping={startScraping}
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
  );
}
