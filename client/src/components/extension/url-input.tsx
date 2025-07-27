import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Globe, Search, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface UrlInputProps {
  currentUrl?: string;
  onUrlSubmit: (url: string) => void;
  isAnalyzing?: boolean;
}

export function UrlInput({ currentUrl = '', onUrlSubmit, isAnalyzing = false }: UrlInputProps) {
  const [url, setUrl] = useState(currentUrl);
  const [urlStatus, setUrlStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  const validateUrl = (inputUrl: string) => {
    try {
      new URL(inputUrl);
      setUrlStatus('valid');
      return true;
    } catch {
      setUrlStatus('invalid');
      return false;
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    
    if (newUrl.length > 8) {
      validateUrl(newUrl);
    } else {
      setUrlStatus('idle');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url && validateUrl(url)) {
      onUrlSubmit(url);
    }
  };

  const getStatusIcon = () => {
    switch (urlStatus) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'invalid':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Globe className="h-4 w-4 text-gray-400" />;
    }
  };

  const presetUrls = [
    { name: 'E-commerce Store', url: 'https://www.example-store.com/products' },
    { name: 'News Articles', url: 'https://www.example-news.com/tech' },
    { name: 'Social Media Posts', url: 'https://www.example-social.com/posts' },
    { name: 'Job Listings', url: 'https://www.example-jobs.com/listings' }
  ];

  return (
    <div className="p-4 border-b border-gray-100">
      <h3 className="font-medium text-gray-900 mb-3 flex items-center">
        <Globe className="text-primary mr-2 h-4 w-4" />
        Target Webpage
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Label htmlFor="webpage-url" className="text-sm text-gray-700">
            Enter webpage URL to analyze
          </Label>
          <div className="relative mt-1">
            <Input
              id="webpage-url"
              type="url"
              value={url}
              onChange={handleUrlChange}
              placeholder="https://example.com/products"
              className={`pr-10 ${
                urlStatus === 'valid' ? 'border-emerald-300 focus:border-emerald-500' :
                urlStatus === 'invalid' ? 'border-red-300 focus:border-red-500' :
                'border-gray-300'
              }`}
              disabled={isAnalyzing}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {getStatusIcon()}
            </div>
          </div>
          {urlStatus === 'invalid' && (
            <p className="text-xs text-red-600 mt-1">Please enter a valid URL</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={!url || urlStatus !== 'valid' || isAnalyzing}
          className="w-full bg-primary hover:bg-blue-700 text-white"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing Page...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Analyze This Page
            </>
          )}
        </Button>
      </form>

      <div className="mt-4">
        <Label className="text-xs text-gray-600 mb-2 block">Quick Examples:</Label>
        <div className="grid grid-cols-2 gap-2">
          {presetUrls.map((preset, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="text-xs h-auto p-2 justify-start"
              onClick={() => {
                setUrl(preset.url);
                setUrlStatus('valid');
              }}
              disabled={isAnalyzing}
            >
              <div className="text-left">
                <div className="font-medium">{preset.name}</div>
                <div className="text-gray-500 truncate">{preset.url}</div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {url && urlStatus === 'valid' && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Ready to analyze</p>
              <p className="text-xs text-blue-700 truncate">{url}</p>
            </div>
            <Badge variant="outline" className="bg-blue-100 text-blue-600 border-blue-200">
              Valid URL
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}