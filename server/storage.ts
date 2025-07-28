import { type ScrapingTemplate } from "@shared/schema";
import { randomUUID } from "crypto";

// Enhanced storage interface for scraping extension
export interface IStorage {
  // Template management
  getTemplates(): Promise<ScrapingTemplate[]>;
  saveTemplate(template: Omit<ScrapingTemplate, 'id' | 'createdAt'>): Promise<ScrapingTemplate>;
  deleteTemplate(id: string): Promise<void>;
  
  // Analytics
  getAnalytics(): Promise<{
    totalScrapes: number;
    totalTemplates: number;
    popularDomains: Array<{ domain: string; count: number }>;
    recentActivity: Array<{ timestamp: string; action: string; url: string }>;
  }>;
  
  // Activity tracking
  logActivity(action: string, url: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private templates: Map<string, ScrapingTemplate>;
  private analytics: Array<{ timestamp: string; action: string; url: string; domain: string }>;

  constructor() {
    this.templates = new Map();
    this.analytics = [];
  }

  async getTemplates(): Promise<ScrapingTemplate[]> {
    return Array.from(this.templates.values());
  }

  async saveTemplate(template: Omit<ScrapingTemplate, 'id' | 'createdAt'>): Promise<ScrapingTemplate> {
    const id = randomUUID();
    const fullTemplate: ScrapingTemplate = {
      ...template,
      id,
      createdAt: new Date().toISOString()
    };
    this.templates.set(id, fullTemplate);
    await this.logActivity('template_saved', template.url);
    return fullTemplate;
  }

  async deleteTemplate(id: string): Promise<void> {
    const template = this.templates.get(id);
    if (template) {
      this.templates.delete(id);
      await this.logActivity('template_deleted', template.url);
    }
  }

  async getAnalytics() {
    const totalScrapes = this.analytics.filter(a => a.action === 'scrape_completed').length;
    const totalTemplates = this.templates.size;
    
    // Calculate popular domains
    const domainCounts = new Map<string, number>();
    this.analytics.forEach(activity => {
      const count = domainCounts.get(activity.domain) || 0;
      domainCounts.set(activity.domain, count + 1);
    });
    
    const popularDomains = Array.from(domainCounts.entries())
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    const recentActivity = this.analytics
      .slice(-20)
      .map(({ timestamp, action, url }) => ({ timestamp, action, url }));
    
    return {
      totalScrapes,
      totalTemplates,
      popularDomains,
      recentActivity
    };
  }

  async logActivity(action: string, url: string): Promise<void> {
    try {
      const domain = new URL(url).hostname;
      this.analytics.push({
        timestamp: new Date().toISOString(),
        action,
        url,
        domain
      });
      
      // Keep only last 1000 activities
      if (this.analytics.length > 1000) {
        this.analytics = this.analytics.slice(-1000);
      }
    } catch (error) {
      // Invalid URL, skip logging
    }
  }
}

export const storage = new MemStorage();
