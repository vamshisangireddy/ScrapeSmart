import type { DetectedField, ScrapedData, ExportOptions, PageInfo, ScrapingTemplate } from '@shared/schema';

// Chrome extension messaging utilities
export class ExtensionAPI {
  static async getCurrentTab(): Promise<chrome.tabs.Tab | null> {
    if (typeof chrome === 'undefined' || !chrome.tabs) return null;
    
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0] || null;
  }

  static async sendMessageToActiveTab(message: any): Promise<any> {
    const tab = await this.getCurrentTab();
    if (!tab?.id) throw new Error('No active tab found');
    
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tab.id!, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  static async detectFields(): Promise<DetectedField[]> {
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
    const filename = options.filename || `scraped-data-${Date.now()}.${options.format}`;
    
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'exportData',
        data: data,
        format: options.format,
        filename: filename
      }, (response) => {
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
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'saveTemplate',
        template: template
      }, (response) => {
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
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'loadTemplates'
      }, (response) => {
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
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const title = pageTitle ? 
      pageTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30) : 
      'scraped-data';
    return `${title}-${timestamp}.${format}`;
  }

  static async checkExtensionContext(): Promise<boolean> {
    return typeof chrome !== 'undefined' && 
           chrome.runtime && 
           chrome.runtime.id !== undefined;
  }
}

export default ExtensionAPI;
