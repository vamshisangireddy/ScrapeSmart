import { useState } from "react";
import { useRealScraper } from "@/hooks/use-real-scraper";
import { AutoDetectedFields } from "@/components/extension/auto-detected-fields";
import { ExportOptionsComponent } from "@/components/extension/export-options";
import { UrlInput } from "@/components/extension/url-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Bot, 
  Globe, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Database,
  FileText,
  Settings
} from "lucide-react";

export default function RealScraperPage() {
  const {
    currentUrl,
    pageInfo,
    detectedFields,
    scrapedData,
    isAnalyzing,
    isScraping,
    isExporting,
    analyzeUrl,
    scrapePage,
    exportData,
    toggleField,
    analysisError,
    scrapingError,
    exportError
  } = useRealScraper();

  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json' | 'xml' | 'excel'>('csv');
  const [filename, setFilename] = useState('scraped_data');

  const selectedFieldsCount = detectedFields.filter(field => field.selected).length;
  const hasScrapedData = scrapedData.length > 0;

  const handleStartScraping = async () => {
    const selectedFields = detectedFields.filter(field => field.selected);
    if (selectedFields.length === 0) {
      alert('Please select at least one field to scrape');
      return;
    }
    await scrapePage(selectedFields);
  };

  const handleExport = async () => {
    if (!hasScrapedData) {
      alert('No data to export. Please scrape data first.');
      return;
    }
    await exportData(selectedFormat, filename);
  };

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
                <p className="text-sm text-gray-600">Real-time web scraping powered by AI</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">
              <Globe className="h-3 w-3 mr-1" />
              Live Scraper
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - URL Input & Settings */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Website Analysis
                </CardTitle>
                <CardDescription>
                  Enter any URL to analyze and extract data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UrlInput
                  currentUrl={currentUrl}
                  onUrlSubmit={analyzeUrl}
                  isAnalyzing={isAnalyzing}
                />
              </CardContent>
            </Card>

            {pageInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Page Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Title:</span>
                    <p className="text-gray-800 mt-1">{pageInfo.title}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Domain:</span>
                    <p className="text-gray-800 mt-1">{pageInfo.domain}</p>
                  </div>
                  {pageInfo.description && (
                    <div>
                      <span className="font-medium text-gray-600">Description:</span>
                      <p className="text-gray-800 mt-1">{pageInfo.description}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-600">Fields Detected:</span>
                    <p className="text-gray-800 mt-1">{detectedFields.length}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Selected:</span>
                    <p className="text-gray-800 mt-1">{selectedFieldsCount}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Export Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Export Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ExportOptionsComponent
                  selectedFormat={selectedFormat}
                  exportOptions={{
                    format: selectedFormat,
                    filename,
                    includePagination: false,
                    autoScroll: true,
                    removeDuplicates: true,
                    delay: 1000
                  }}
                  onOptionsChange={(options: any) => setFilename(options.filename)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Field Detection */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Database className="h-5 w-5 mr-2" />
                    Detected Fields
                  </span>
                  {isAnalyzing && <Loader2 className="h-4 w-4 animate-spin" />}
                </CardTitle>
                <CardDescription>
                  AI-detected data fields from the webpage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AutoDetectedFields
                  fields={detectedFields}
                  isDetecting={isAnalyzing}
                  onToggleField={toggleField}
                  onDetectMore={() => analyzeUrl(currentUrl)}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Button 
                onClick={handleStartScraping}
                disabled={selectedFieldsCount === 0 || isScraping || isAnalyzing}
                className="w-full"
                size="lg"
              >
                {isScraping ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Scraping Data...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Start Scraping ({selectedFieldsCount} fields)
                  </>
                )}
              </Button>

              <Button 
                onClick={handleExport}
                disabled={!hasScrapedData || isExporting}
                variant="outline"
                className="w-full"
                size="lg"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export as {selectedFormat.toUpperCase()}
                  </>
                )}
              </Button>
            </div>

            {/* Progress indicator */}
            {isScraping && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Scraping in progress...</span>
                      <span>Processing</span>
                    </div>
                    <Progress value={75} className="w-full" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className={`h-5 w-5 mr-2 ${hasScrapedData ? 'text-green-600' : 'text-gray-400'}`} />
                  Scraped Data
                </CardTitle>
                <CardDescription>
                  {hasScrapedData 
                    ? `${scrapedData.length} items extracted successfully`
                    : 'No data scraped yet'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasScrapedData ? (
                  <div className="space-y-4">
                    <div className="max-h-96 overflow-y-auto">
                      <div className="space-y-3">
                        {scrapedData.slice(0, 10).map((item, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm">
                            <div className="font-medium text-gray-600 mb-2">Item {index + 1}</div>
                            {Object.entries(item).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-gray-600">{key}:</span>
                                <span className="text-gray-800 ml-2 text-right">
                                  {Array.isArray(value) ? value.join(', ') : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ))}
                        {scrapedData.length > 10 && (
                          <div className="text-center text-gray-500 text-sm">
                            ... and {scrapedData.length - 10} more items
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Start scraping to see extracted data here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Error Messages */}
        {(analysisError || scrapingError || exportError) && (
          <div className="mt-8">
            {analysisError && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Analysis Error: {analysisError}
                </AlertDescription>
              </Alert>
            )}
            {scrapingError && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Scraping Error: {scrapingError}
                </AlertDescription>
              </Alert>
            )}
            {exportError && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Export Error: {exportError}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>
    </div>
  );
}