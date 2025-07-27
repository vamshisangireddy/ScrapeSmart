import type { DetectedField, ScrapedData, ExportOptions, PageInfo, ScrapingTemplate } from '@shared/schema';

// Mock data for web preview
const mockFields: DetectedField[] = [
  {
    id: 'field_title_1',
    name: 'Product Title',
    type: 'title',
    selectors: ['h1', '.product-title', '.title'],
    elements: 12,
    sampleData: ['MacBook Pro 16-inch', 'iPhone 15 Pro Max', 'iPad Air'],
    confidence: 95,
    selected: true
  },
  {
    id: 'field_price_2',
    name: 'Price',
    type: 'price',
    selectors: ['.price', '.cost', '[data-price]'],
    elements: 12,
    sampleData: ['$2,399.00', '$1,199.00', '$599.00'],
    confidence: 92,
    selected: true
  },
  {
    id: 'field_description_3',
    name: 'Description',
    type: 'description',
    selectors: ['.description', '.product-details', 'p'],
    elements: 12,
    sampleData: ['Supercharged by M3 Max chip with 14-core CPU', 'Pro camera system with 48MP Main camera', 'All-new design with larger 10.9-inch Liquid Retina display'],
    confidence: 88,
    selected: true
  },
  {
    id: 'field_rating_4',
    name: 'Rating',
    type: 'rating',
    selectors: ['.rating', '.stars', '[data-rating]'],
    elements: 10,
    sampleData: ['4.8/5', '4.5/5', '4.9/5'],
    confidence: 85,
    selected: false
  },
  {
    id: 'field_availability_5',
    name: 'Stock Status',
    type: 'availability',
    selectors: ['.stock', '.availability', '.in-stock'],
    elements: 12,
    sampleData: ['In Stock', 'Limited Supply', 'In Stock'],
    confidence: 78,
    selected: false
  }
];

const mockPageInfo: PageInfo = {
  url: 'https://www.example-store.com/products',
  title: 'Premium Electronics Store - Product Catalog',
  domain: 'example-store.com'
};

export class MockExtensionAPI {
  static async getCurrentTab(): Promise<any> {
    return {
      id: 1,
      url: mockPageInfo.url,
      title: mockPageInfo.title
    };
  }

  static async sendMessageToActiveTab(message: any): Promise<any> {
    // Simulate message handling
    await new Promise(resolve => setTimeout(resolve, 500));
    
    switch (message.action) {
      case 'detectFields':
        return { success: true, fields: mockFields };
      case 'scrapeFields':
        return { 
          success: true, 
          data: message.fields.map((field: DetectedField) => ({
            field: field.name,
            type: field.type,
            data: field.sampleData
          }))
        };
      case 'getPageInfo':
        return { success: true, ...mockPageInfo };
      default:
        return { success: false, error: 'Unknown action' };
    }
  }

  static async detectFields(): Promise<DetectedField[]> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return mockFields.map(field => ({ ...field, selected: true }));
  }

  static async scrapeFields(selectedFields: DetectedField[]): Promise<ScrapedData[]> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return selectedFields.map(field => ({
      field: field.name,
      type: field.type,
      data: field.sampleData
    }));
  }

  static async getPageInfo(): Promise<PageInfo> {
    return mockPageInfo;
  }

  static async exportData(data: ScrapedData[], options: ExportOptions): Promise<void> {
    // Mock export by downloading a file
    let content: string;
    let mimeType: string;
    
    switch (options.format) {
      case 'csv':
        content = this.convertToCSV(data);
        mimeType = 'text/csv';
        break;
      case 'json':
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        break;
      case 'xml':
        content = this.convertToXML(data);
        mimeType = 'application/xml';
        break;
      case 'excel':
        content = this.convertToCSV(data); // Simplified for mock
        mimeType = 'text/csv';
        break;
      default:
        throw new Error('Unsupported format');
    }
    
    // Create and trigger download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = options.filename || `scraped-data.${options.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private static convertToCSV(data: ScrapedData[]): string {
    if (!data.length) return '';
    
    const headers = data.map(item => item.field);
    const maxRows = Math.max(...data.map(item => item.data.length));
    
    let csv = headers.map(h => `"${h}"`).join(',') + '\n';
    
    for (let i = 0; i < maxRows; i++) {
      const row = data.map(item => {
        const value = item.data[i] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csv += row.join(',') + '\n';
    }
    
    return csv;
  }

  private static convertToXML(data: ScrapedData[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<scrapeResults>\n';
    
    data.forEach((field) => {
      xml += `  <field name="${this.escapeXML(field.field)}" type="${this.escapeXML(field.type)}">\n`;
      field.data.forEach((item, index) => {
        xml += `    <item index="${index}">${this.escapeXML(String(item))}</item>\n`;
      });
      xml += '  </field>\n';
    });
    
    xml += '</scrapeResults>';
    return xml;
  }

  private static escapeXML(str: string): string {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  static async saveTemplate(template: Omit<ScrapingTemplate, 'id' | 'createdAt'>): Promise<void> {
    // Mock save to localStorage
    const templates = JSON.parse(localStorage.getItem('scrapingTemplates') || '[]');
    templates.push({
      ...template,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('scrapingTemplates', JSON.stringify(templates));
  }

  static async loadTemplates(): Promise<ScrapingTemplate[]> {
    return JSON.parse(localStorage.getItem('scrapingTemplates') || '[]');
  }

  static generateFilename(format: string, pageTitle?: string): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const title = pageTitle ? 
      pageTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30) : 
      'scraped-data';
    return `${title}-${timestamp}.${format}`;
  }

  static async checkExtensionContext(): Promise<boolean> {
    // Always return true for mock environment
    return true;
  }
}