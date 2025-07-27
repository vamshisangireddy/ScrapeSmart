import type { DetectedField, ScrapedData, ExportOptions, PageInfo, ScrapingTemplate } from '@shared/schema';
import { MockExtensionAPI } from './mock-extension';

// Type-safe Chrome API checks
const isExtensionEnvironment = () => {
  return typeof window !== 'undefined' && 
         typeof (window as any).chrome !== 'undefined' && 
         (window as any).chrome.runtime?.id;
};

// Chrome extension messaging utilities
export class ExtensionAPI {
  static async getCurrentTab(): Promise<any> {
    if (!isExtensionEnvironment()) {
      return MockExtensionAPI.getCurrentTab();
    }
    
    const chrome = (window as any).chrome;
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0] || null;
  }

  static async sendMessageToActiveTab(message: any): Promise<any> {
    if (!isExtensionEnvironment()) {
      return MockExtensionAPI.sendMessageToActiveTab(message);
    }

    const chrome = (window as any).chrome;
    const tab = await this.getCurrentTab();
    if (!tab?.id) throw new Error('No active tab found');
    
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tab.id, message, (response: any) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  static async detectFields(): Promise<DetectedField[]> {
    if (!isExtensionEnvironment()) {
      return MockExtensionAPI.detectFields();
    }

    try {
      const response = await this.sendMessageToActiveTab({ action: 'detectFields' });
      if (response?.success) {
        return response.fields.map((field: any) => ({
          ...field,
          selected: true
        }));
      }
      throw new Error(response?.error || 'Failed to detect fields');
    } catch (error) {
      console.error('Field detection failed:', error);
      return [];
    }
  }

  static async scrapeFields(selectedFields: DetectedField[]): Promise<ScrapedData[]> {
    if (!isExtensionEnvironment()) {
      return MockExtensionAPI.scrapeFields(selectedFields);
    }

    try {
      const response = await this.sendMessageToActiveTab({ 
        action: 'scrapeFields', 
        fields: selectedFields 
      });
      
      if (response?.success) {
        return response.data;
      }
      throw new Error(response?.error || 'Failed to scrape fields');
    } catch (error) {
      console.error('Scraping failed:', error);
      return [];
    }
  }

  static async getPageInfo(): Promise<PageInfo | null> {
    if (!isExtensionEnvironment()) {
      return MockExtensionAPI.getPageInfo();
    }

    try {
      const response = await this.sendMessageToActiveTab({ action: 'getPageInfo' });
      if (response?.success) {
        return response;
      }
      return null;
    } catch (error) {
      console.error('Failed to get page info:', error);
      return null;
    }
  }

  static async exportData(data: ScrapedData[], options: ExportOptions): Promise<void> {
    if (!isExtensionEnvironment()) {
      return MockExtensionAPI.exportData(data, options);
    }

    const chrome = (window as any).chrome;
    const filename = options.filename || `scraped-data-${Date.now()}.${options.format}`;
    
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'exportData',
        data: data,
        format: options.format,
        filename: filename
      }, (response: any) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response?.success) {
          resolve();
        } else {
          reject(new Error(response?.error || 'Export failed'));
        }
      });
    });
  }

  static async saveTemplate(template: Omit<ScrapingTemplate, 'id' | 'createdAt'>): Promise<void> {
    if (!isExtensionEnvironment()) {
      return MockExtensionAPI.saveTemplate(template);
    }

    const chrome = (window as any).chrome;
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'saveTemplate',
        template: template
      }, (response: any) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response?.success) {
          resolve();
        } else {
          reject(new Error(response?.error || 'Failed to save template'));
        }
      });
    });
  }

  static async loadTemplates(): Promise<ScrapingTemplate[]> {
    if (!isExtensionEnvironment()) {
      return MockExtensionAPI.loadTemplates();
    }

    const chrome = (window as any).chrome;
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'loadTemplates'
      }, (response: any) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response?.success) {
          resolve(response.templates || []);
        } else {
          reject(new Error(response?.error || 'Failed to load templates'));
        }
      });
    });
  }

  static generateFilename(format: string, pageTitle?: string): string {
    return MockExtensionAPI.generateFilename(format, pageTitle);
  }

  static async checkExtensionContext(): Promise<boolean> {
    if (!isExtensionEnvironment()) {
      return MockExtensionAPI.checkExtensionContext();
    }
    const chrome = (window as any).chrome;
    return chrome.runtime.id !== undefined;
  }
}

export default ExtensionAPI;
