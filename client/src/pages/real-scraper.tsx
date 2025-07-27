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
  const [viewMode, setViewMode] = useState<'table' | 'json' | 'cards'>('table');

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
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Export Format</label>
                  <select 
                    value={selectedFormat} 
                    onChange={(e) => setSelectedFormat(e.target.value as any)}
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                    <option value="xml">XML</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Filename</label>
                  <input 
                    type="text" 
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-md"
                    placeholder="scraped_data"
                  />
                </div>
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
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className={`h-5 w-5 mr-2 ${hasScrapedData ? 'text-green-600' : 'text-gray-400'}`} />
                    Live Data Preview
                  </div>
                  {hasScrapedData && (
                    <Badge variant="secondary">
                      {scrapedData.length} items
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {hasScrapedData 
                    ? `Real-time preview of ${scrapedData.length} extracted items`
                    : 'Live data will appear here as you scrape'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasScrapedData ? (
                  <div className="space-y-4">
                    {/* Data View Tabs */}
                    <div className="flex space-x-2 border-b">
                      <Button 
                        variant={viewMode === 'table' ? 'default' : 'ghost'} 
                        size="sm" 
                        onClick={() => setViewMode('table')}
                        className={viewMode === 'table' ? 'border-b-2 border-primary' : ''}
                      >
                        Table View
                      </Button>
                      <Button 
                        variant={viewMode === 'json' ? 'default' : 'ghost'} 
                        size="sm"
                        onClick={() => setViewMode('json')}
                        className={viewMode === 'json' ? 'border-b-2 border-primary' : ''}
                      >
                        JSON View
                      </Button>
                      <Button 
                        variant={viewMode === 'cards' ? 'default' : 'ghost'} 
                        size="sm"
                        onClick={() => setViewMode('cards')}
                        className={viewMode === 'cards' ? 'border-b-2 border-primary' : ''}
                      >
                        Card View
                      </Button>
                    </div>

                    {/* Table View */}
                    {viewMode === 'table' && (
                      <div className="max-h-96 overflow-auto border rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left border-r">#</th>
                              {Object.keys(scrapedData[0] || {}).filter(key => key !== 'id').map((key) => (
                                <th key={key} className="px-3 py-2 text-left border-r">
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {scrapedData.slice(0, 50).map((item, index) => (
                              <tr key={index} className="border-b hover:bg-gray-50">
                                <td className="px-3 py-2 border-r font-medium text-gray-600">
                                  {index + 1}
                                </td>
                                {Object.entries(item).filter(([key]) => key !== 'id').map(([key, value]) => (
                                  <td key={key} className="px-3 py-2 border-r">
                                    <div className="max-w-xs truncate" title={String(value)}>
                                      {Array.isArray(value) ? value.join(', ') : String(value)}
                                    </div>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        
                        {scrapedData.length > 50 && (
                          <div className="p-3 text-center text-gray-500 text-sm bg-gray-50">
                            Showing first 50 items. Total: {scrapedData.length} items
                          </div>
                        )}
                      </div>
                    )}

                    {/* JSON View */}
                    {viewMode === 'json' && (
                      <div className="max-h-96 overflow-auto border rounded-lg bg-gray-50 p-4">
                        <pre className="text-xs overflow-x-auto">
                          {JSON.stringify(scrapedData.slice(0, 10), null, 2)}
                        </pre>
                        {scrapedData.length > 10 && (
                          <div className="mt-4 text-center text-gray-500 text-sm">
                            Showing first 10 items as JSON. Total: {scrapedData.length} items
                          </div>
                        )}
                      </div>
                    )}

                    {/* Card View */}
                    {viewMode === 'cards' && (
                      <div className="max-h-96 overflow-y-auto space-y-3">
                        {scrapedData.slice(0, 20).map((item, index) => (
                          <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
                              <Badge variant="outline" className="text-xs">
                                {Object.keys(item).length - 1} fields
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              {Object.entries(item).filter(([key]) => key !== 'id').map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-sm font-medium text-gray-600">{key}:</span>
                                  <span className="text-sm text-gray-800 text-right ml-2 max-w-xs truncate">
                                    {Array.isArray(value) ? value.join(', ') : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        {scrapedData.length > 20 && (
                          <div className="text-center text-gray-500 text-sm">
                            Showing first 20 items. Total: {scrapedData.length} items
                          </div>
                        )}
                      </div>
                    )}

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{scrapedData.length}</div>
                        <div className="text-sm text-gray-600">Total Items</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {Object.keys(scrapedData[0] || {}).length - 1}
                        </div>
                        <div className="text-sm text-gray-600">Data Fields</div>
                      </div>
                    </div>

                    {/* Live Updates Indicator */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-gray-600">Live Preview Active</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.reload()}
                      >
                        Refresh Data
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Database className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="font-medium mb-2">No Data Yet</h3>
                    <p className="text-sm">Select fields and start scraping to see live data preview</p>
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