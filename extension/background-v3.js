// Modern Service Worker for WebScraper Pro v2.0
// Production-ready background script with advanced ML integration

class WebScraperService {
  constructor() {
    this.baseUrl = this.getApiBaseUrl();
    this.templates = new Map();
    this.analytics = {
      totalScrapes: 0,
      sessionsToday: 0,
      lastActivity: null
    };
    
    this.initializeService();
  }

  getApiBaseUrl() {
    // Production: Connect to deployed Cloudflare Workers or Replit app
    if (chrome.runtime.getManifest().version.includes('prod')) {
      return 'https://webscraper-pro.your-domain.workers.dev';
    }
    // Development: Connect to local server
    return 'http://localhost:5000';
  }

  async initializeService() {
    // Load stored templates and preferences
    await this.loadStoredData();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize daily analytics reset
    this.setupAnalyticsTimer();
    
    console.log('WebScraper Pro Service Worker initialized');
  }

  setupEventListeners() {
    // Handle extension installation/updates
    chrome.runtime.onInstalled.addListener(this.handleInstall.bind(this));
    
    // Handle messages from popup and content scripts
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    
    // Handle tab updates for analytics
    chrome.tabs.onUpdated.addListener(this.handleTabUpdate.bind(this));
  }

  async handleInstall(details) {
    if (details.reason === 'install') {
      // First-time installation
      await this.setDefaultPreferences();
      this.showWelcomeNotification();
    } else if (details.reason === 'update') {
      // Extension update
      console.log('WebScraper Pro updated to version', chrome.runtime.getManifest().version);
    }
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'analyzePageML':
          return await this.analyzePageWithML(request.url, request.options);
          
        case 'scrapePageML':
          return await this.scrapePageWithML(request.url, request.fields);
          
        case 'saveTemplate':
          return await this.saveScrapingTemplate(request.template);
          
        case 'loadTemplates':
          return await this.loadScrapingTemplates();
          
        case 'exportData':
          return await this.exportScrapedData(request.data, request.format, request.filename);
          
        case 'getAnalytics':
          return await this.getAnalytics();
          
        case 'updatePreferences':
          return await this.updatePreferences(request.preferences);
          
        default:
          throw new Error(`Unknown action: ${request.action}`);
      }
    } catch (error) {
      console.error('Background script error:', error);
      return { success: false, error: error.message };
    }
  }

  async analyzePageWithML(url, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, options })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update analytics
      this.analytics.totalScrapes++;
      this.analytics.lastActivity = new Date().toISOString();
      await this.saveAnalytics();

      return { success: true, ...result };
    } catch (error) {
      console.error('ML Analysis error:', error);
      return { success: false, error: error.message };
    }
  }

  async scrapePageWithML(url, selectedFields) {
    try {
      const response = await fetch(`${this.baseUrl}/api/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url, 
          selectedFields,
          useML: true 
        })
      });

      if (!response.ok) {
        throw new Error(`Scraping failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update analytics
      this.analytics.totalScrapes++;
      this.analytics.lastActivity = new Date().toISOString();
      await this.saveAnalytics();

      return { success: true, ...result };
    } catch (error) {
      console.error('ML Scraping error:', error);
      return { success: false, error: error.message };
    }
  }

  async saveScrapingTemplate(template) {
    try {
      // Save locally
      const templateId = `template_${Date.now()}`;
      const fullTemplate = {
        ...template,
        id: templateId,
        createdAt: new Date().toISOString()
      };
      
      this.templates.set(templateId, fullTemplate);
      await this.saveStoredData();

      // Also save to server if available
      try {
        await fetch(`${this.baseUrl}/api/templates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fullTemplate)
        });
      } catch (serverError) {
        console.warn('Could not save template to server:', serverError);
      }

      return { success: true, template: fullTemplate };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async loadScrapingTemplates() {
    try {
      // Load from local storage
      const localTemplates = Array.from(this.templates.values());
      
      // Try to load from server as well
      try {
        const response = await fetch(`${this.baseUrl}/api/templates`);
        if (response.ok) {
          const serverData = await response.json();
          const serverTemplates = serverData.templates || [];
          
          // Merge templates (prefer server versions)
          const mergedTemplates = [...localTemplates];
          serverTemplates.forEach(serverTemplate => {
            const existingIndex = mergedTemplates.findIndex(t => t.id === serverTemplate.id);
            if (existingIndex >= 0) {
              mergedTemplates[existingIndex] = serverTemplate;
            } else {
              mergedTemplates.push(serverTemplate);
            }
          });
          
          return { success: true, templates: mergedTemplates };
        }
      } catch (serverError) {
        console.warn('Could not load templates from server:', serverError);
      }

      return { success: true, templates: localTemplates };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async exportScrapedData(data, format, filename) {
    try {
      let content, mimeType, extension;
      
      switch (format) {
        case 'json':
          content = JSON.stringify(data, null, 2);
          mimeType = 'application/json';
          extension = 'json';
          break;
          
        case 'csv':
          content = this.convertToCSV(data);
          mimeType = 'text/csv';
          extension = 'csv';
          break;
          
        case 'xml':
          content = this.convertToXML(data);
          mimeType = 'application/xml';
          extension = 'xml';
          break;
          
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // Create blob and download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      const downloadId = await chrome.downloads.download({
        url: url,
        filename: `${filename || 'scraped_data'}.${extension}`,
        saveAs: true
      });

      // Clean up blob URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 10000);

      return { success: true, downloadId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          const stringValue = Array.isArray(value) ? value.join('; ') : String(value);
          return `"${stringValue.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  }

  convertToXML(data) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<data>\n';
    
    data.forEach((item, index) => {
      xml += `  <item id="${index + 1}">\n`;
      Object.entries(item).forEach(([key, value]) => {
        const stringValue = Array.isArray(value) ? value.join('; ') : String(value);
        xml += `    <${key}><![CDATA[${stringValue}]]></${key}>\n`;
      });
      xml += '  </item>\n';
    });
    
    xml += '</data>';
    return xml;
  }

  async getAnalytics() {
    try {
      // Combine local and server analytics
      const localAnalytics = { ...this.analytics };
      
      try {
        const response = await fetch(`${this.baseUrl}/api/analytics`);
        if (response.ok) {
          const serverAnalytics = await response.json();
          return { success: true, analytics: { ...localAnalytics, ...serverAnalytics } };
        }
      } catch (serverError) {
        console.warn('Could not load server analytics:', serverError);
      }

      return { success: true, analytics: localAnalytics };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async setDefaultPreferences() {
    const defaultPrefs = {
      defaultFormat: 'csv',
      autoDetect: true,
      defaultDelay: 1000,
      useMLAnalysis: true,
      confidenceThreshold: 0.7,
      enablePatternLearning: true,
      semanticAnalysis: true,
      theme: 'light'
    };

    await chrome.storage.sync.set({ preferences: defaultPrefs });
  }

  async updatePreferences(preferences) {
    try {
      await chrome.storage.sync.set({ preferences });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async loadStoredData() {
    try {
      const result = await chrome.storage.local.get(['templates', 'analytics']);
      
      if (result.templates) {
        this.templates = new Map(Object.entries(result.templates));
      }
      
      if (result.analytics) {
        this.analytics = { ...this.analytics, ...result.analytics };
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  }

  async saveStoredData() {
    try {
      await chrome.storage.local.set({
        templates: Object.fromEntries(this.templates),
        analytics: this.analytics
      });
    } catch (error) {
      console.error('Error saving stored data:', error);
    }
  }

  async saveAnalytics() {
    try {
      await chrome.storage.local.set({ analytics: this.analytics });
    } catch (error) {
      console.error('Error saving analytics:', error);
    }
  }

  setupAnalyticsTimer() {
    // Reset daily session count at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.analytics.sessionsToday = 0;
      this.saveAnalytics();
      
      // Set up daily timer
      setInterval(() => {
        this.analytics.sessionsToday = 0;
        this.saveAnalytics();
      }, 24 * 60 * 60 * 1000); // 24 hours
    }, timeUntilMidnight);
  }

  handleTabUpdate(tabId, changeInfo, tab) {
    // Track page navigation analytics
    if (changeInfo.status === 'complete' && tab.url) {
      this.analytics.sessionsToday++;
      this.saveAnalytics();
    }
  }

  showWelcomeNotification() {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: 'WebScraper Pro Installed!',
      message: 'AI-powered web scraping extension is ready. Click the extension icon to get started.'
    });
  }
}

// Initialize the service
const webScraperService = new WebScraperService();

// Keep service worker alive
chrome.runtime.onStartup.addCallback(() => {
  console.log('WebScraper Pro Service Worker started');
});