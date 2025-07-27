import { useState, useEffect, useCallback } from 'react';
import ExtensionAPI from '@/lib/extension-utils';
import type { DetectedField, ScrapedData, ExportOptions, PageInfo } from '@shared/schema';

export function useExtension() {
  const [isExtensionContext, setIsExtensionContext] = useState(false);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [detectedFields, setDetectedFields] = useState<DetectedField[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapingProgress, setScrapingProgress] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json' | 'xml' | 'excel'>('csv');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    filename: '',
    includePagination: false,
    autoScroll: true,
    removeDuplicates: true,
    delay: 1000
  });

  // Check if running in extension context
  useEffect(() => {
    ExtensionAPI.checkExtensionContext().then(setIsExtensionContext);
  }, []);

  // Load page info when extension loads
  useEffect(() => {
    if (isExtensionContext) {
      ExtensionAPI.getPageInfo().then(setPageInfo);
    }
  }, [isExtensionContext]);

  // Auto-detect fields when page info is loaded
  useEffect(() => {
    if (pageInfo) {
      detectFields();
    }
  }, [pageInfo]);

  const detectFields = useCallback(async () => {
    if (!isExtensionContext) return;
    
    setIsDetecting(true);
    try {
      const fields = await ExtensionAPI.detectFields();
      setDetectedFields(fields);
    } catch (error) {
      console.error('Field detection failed:', error);
    } finally {
      setIsDetecting(false);
    }
  }, [isExtensionContext]);

  const toggleField = useCallback((fieldId: string) => {
    setDetectedFields(prev => 
      prev.map(field => 
        field.id === fieldId 
          ? { ...field, selected: !field.selected }
          : field
      )
    );
  }, []);

  const selectFormat = useCallback((format: 'csv' | 'json' | 'xml' | 'excel') => {
    setSelectedFormat(format);
    setExportOptions(prev => ({ ...prev, format }));
  }, []);

  const startScraping = useCallback(async () => {
    if (!isExtensionContext) return;
    
    const selectedFields = detectedFields.filter(field => field.selected);
    if (selectedFields.length === 0) {
      throw new Error('No fields selected for scraping');
    }

    setIsScraping(true);
    setScrapingProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setScrapingProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const scrapedData = await ExtensionAPI.scrapeFields(selectedFields);
      
      clearInterval(progressInterval);
      setScrapingProgress(100);

      // Generate filename if not provided
      if (!exportOptions.filename) {
        const filename = ExtensionAPI.generateFilename(
          exportOptions.format,
          pageInfo?.title
        );
        setExportOptions(prev => ({ ...prev, filename }));
      }

      // Export the data
      await ExtensionAPI.exportData(scrapedData, {
        ...exportOptions,
        filename: exportOptions.filename || ExtensionAPI.generateFilename(
          exportOptions.format,
          pageInfo?.title
        )
      });

      return scrapedData;
    } catch (error) {
      console.error('Scraping failed:', error);
      throw error;
    } finally {
      setIsScraping(false);
      setScrapingProgress(0);
    }
  }, [isExtensionContext, detectedFields, exportOptions, pageInfo]);

  const saveTemplate = useCallback(async (name: string) => {
    if (!isExtensionContext || !pageInfo) return;

    const selectedFields = detectedFields.filter(field => field.selected);
    
    await ExtensionAPI.saveTemplate({
      name,
      url: pageInfo.url,
      domain: pageInfo.domain,
      fields: selectedFields,
      exportFormat: selectedFormat,
      options: {
        includePagination: exportOptions.includePagination,
        autoScroll: exportOptions.autoScroll,
        removeDuplicates: exportOptions.removeDuplicates,
        delay: exportOptions.delay
      }
    });
  }, [isExtensionContext, pageInfo, detectedFields, selectedFormat, exportOptions]);

  const updateExportOptions = useCallback((updates: Partial<ExportOptions>) => {
    setExportOptions(prev => ({ ...prev, ...updates }));
  }, []);

  return {
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
  };
}
