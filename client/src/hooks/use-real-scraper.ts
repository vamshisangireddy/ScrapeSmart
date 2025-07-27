import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { DetectedField, PageInfo } from '@shared/schema';

export interface ScrapingResult {
  pageInfo: PageInfo;
  detectedFields: DetectedField[];
}

export interface ScrapedData {
  success: boolean;
  data: Record<string, any>[];
  count: number;
}

export function useRealScraper() {
  const [currentUrl, setCurrentUrl] = useState('https://www.scrapethissite.com/pages/simple/');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<Record<string, any>[]>([]);
  const queryClient = useQueryClient();

  // Analyze webpage mutation
  const analyzePageMutation = useMutation({
    mutationFn: async (url: string): Promise<ScrapingResult> => {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ url }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Failed to analyze page');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setIsAnalyzing(false);
      queryClient.setQueryData(['analysis', currentUrl], data);
    },
    onError: (error) => {
      setIsAnalyzing(false);
      console.error('Analysis failed:', error);
    }
  });

  // Scrape webpage mutation
  const scrapePageMutation = useMutation({
    mutationFn: async ({ url, selectedFields }: { url: string; selectedFields: DetectedField[] }): Promise<ScrapedData> => {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        body: JSON.stringify({ url, selectedFields }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Failed to scrape page');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setIsScraping(false);
      setScrapedData(data.data);
    },
    onError: (error) => {
      setIsScraping(false);
      console.error('Scraping failed:', error);
    }
  });

  // Export data mutation
  const exportDataMutation = useMutation({
    mutationFn: async ({ data, format, filename }: { data: any[]; format: string; filename: string }) => {
      const response = await fetch('/api/export', {
        method: 'POST',
        body: JSON.stringify({ data, format, filename }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Failed to export data');
      }
      
      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  });

  // Get current analysis - disabled for now, will trigger via mutation
  const { data: analysisData, isLoading: isLoadingAnalysis } = useQuery({
    queryKey: ['analysis', currentUrl],
    queryFn: async (): Promise<ScrapingResult> => {
      throw new Error('Use mutation instead');
    },
    enabled: false, // Disabled, use mutation instead
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const analyzeUrl = useCallback(async (url: string) => {
    setCurrentUrl(url);
    setIsAnalyzing(true);
    analyzePageMutation.mutate(url);
  }, [analyzePageMutation]);

  const scrapePage = useCallback(async (selectedFields: DetectedField[]) => {
    setIsScraping(true);
    scrapePageMutation.mutate({ url: currentUrl, selectedFields });
  }, [currentUrl, scrapePageMutation]);

  const exportData = useCallback(async (format: string, filename: string) => {
    if (scrapedData.length === 0) {
      throw new Error('No data to export');
    }
    exportDataMutation.mutate({ data: scrapedData, format, filename });
  }, [scrapedData, exportDataMutation]);

  const toggleField = useCallback((fieldId: string) => {
    if (analysisData) {
      const updatedFields = analysisData.detectedFields.map(field => 
        field.id === fieldId 
          ? { ...field, selected: !field.selected }
          : field
      );
      
      queryClient.setQueryData(['analysis', currentUrl], {
        ...analysisData,
        detectedFields: updatedFields
      });
    }
  }, [analysisData, currentUrl, queryClient]);

  return {
    currentUrl,
    pageInfo: analysisData?.pageInfo,
    detectedFields: analysisData?.detectedFields || [],
    scrapedData,
    isAnalyzing: isAnalyzing || isLoadingAnalysis,
    isScraping,
    isExporting: exportDataMutation.isPending,
    analyzeUrl,
    scrapePage,
    exportData,
    toggleField,
    analysisError: analyzePageMutation.error?.message,
    scrapingError: scrapePageMutation.error?.message,
    exportError: exportDataMutation.error?.message
  };
}