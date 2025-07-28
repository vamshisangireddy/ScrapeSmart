import axios from 'axios';
import * as cheerio from 'cheerio';
import type { DetectedField, PageInfo } from '@shared/schema';

interface MLAnalysisResult {
  elementType: string;
  confidence: number;
  semanticMeaning: string;
  extractionStrategy: string;
}

interface AdvancedScrapingOptions {
  useNLP: boolean;
  enablePatternLearning: boolean;
  semanticAnalysis: boolean;
  confidenceThreshold: number;
}

export class MLWebScraper {
  private patternCache = new Map<string, DetectedField[]>();
  private semanticRules = new Map<string, RegExp[]>();
  
  constructor() {
    this.initializeSemanticRules();
  }

  private initializeSemanticRules(): void {
    // Advanced semantic pattern recognition
    this.semanticRules.set('price', [
      /\$[\d,]+\.?\d*/gi,
      /\b\d+[\.,]\d+\s*(USD|EUR|GBP|dollars?|euros?|pounds?)\b/gi,
      /\b(price|cost|amount|fee):\s*[\$€£]?[\d,]+\.?\d*/gi
    ]);
    
    this.semanticRules.set('email', [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi
    ]);
    
    this.semanticRules.set('phone', [
      /\b\+?[\d\s\-\(\)]{10,}\b/gi,
      /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/gi
    ]);
    
    this.semanticRules.set('date', [
      /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/gi,
      /\b\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}\b/gi,
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi
    ]);
  }

  public async analyzePageWithML(url: string, options: AdvancedScrapingOptions = {
    useNLP: true,
    enablePatternLearning: true,
    semanticAnalysis: true,
    confidenceThreshold: 0.7
  }): Promise<{ pageInfo: PageInfo; detectedFields: DetectedField[] }> {
    
    try {
      const html = await this.fetchPage(url);
      const $ = cheerio.load(html);
      
      const pageInfo = this.extractPageInfo($, url);
      
      // Multi-layered analysis approach
      const structuralFields = await this.analyzeStructuralPatterns($);
      const semanticFields = options.semanticAnalysis ? await this.analyzeSemanticPatterns($) : [];
      const learnedFields = options.enablePatternLearning ? await this.applyLearnedPatterns($, url) : [];
      
      // Merge and deduplicate fields using ML confidence scores
      const allFields = [...structuralFields, ...semanticFields, ...learnedFields];
      const optimizedFields = this.optimizeFieldSelection(allFields, options.confidenceThreshold);
      
      // Cache successful patterns for future learning
      if (options.enablePatternLearning) {
        this.cacheSuccessfulPatterns(url, optimizedFields);
      }
      
      return {
        pageInfo,
        detectedFields: optimizedFields
      };
      
    } catch (error) {
      throw new Error(`ML Analysis failed: ${error}`);
    }
  }

  private async fetchPage(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 15000,
        maxRedirects: 5
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch page: ${error}`);
    }
  }

  private extractPageInfo($: cheerio.CheerioAPI, url: string): PageInfo {
    const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled Page';
    const domain = new URL(url).hostname;
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || 
                       $('p').first().text().trim().substring(0, 200) || 
                       'AI-powered analysis complete';
    
    return { url, title, domain, description, type: 'ml-analyzed' };
  }

  private async analyzeStructuralPatterns($: cheerio.CheerioAPI): Promise<DetectedField[]> {
    const fields: DetectedField[] = [];
    let fieldCounter = 1;

    // Advanced container pattern detection with ML scoring
    const containerPatterns = [
      { selector: '.country, [class*="country"]', weight: 0.95, type: 'country-data' },
      { selector: '.product, [class*="product"]', weight: 0.90, type: 'product-data' },
      { selector: '.item, [class*="item"]', weight: 0.85, type: 'item-data' },
      { selector: '.card, [class*="card"]', weight: 0.80, type: 'card-data' },
      { selector: 'article, .article', weight: 0.85, type: 'article-data' },
      { selector: '.listing, [class*="listing"]', weight: 0.88, type: 'listing-data' },
      { selector: 'tr:has(td)', weight: 0.92, type: 'table-data' }
    ];

    for (const pattern of containerPatterns) {
      const containers = $(pattern.selector);
      if (containers.length >= 2) {
        const patternFields = await this.analyzeContainerPattern($, containers, pattern, fieldCounter);
        fields.push(...patternFields);
        fieldCounter += patternFields.length;
      }
    }

    return fields;
  }

  private async analyzeContainerPattern(
    $: cheerio.CheerioAPI, 
    containers: cheerio.Cheerio<any>, 
    pattern: { selector: string; weight: number; type: string },
    fieldCounter: number
  ): Promise<DetectedField[]> {
    const fields: DetectedField[] = [];
    const firstContainer = containers.first();

    // Intelligent element detection within containers
    const elementPatterns = [
      { selector: 'h1, h2, h3, h4, h5, h6', type: 'heading', priority: 0.9 },
      { selector: '.price, [class*="price"], [data-price]', type: 'price', priority: 0.95 },
      { selector: '.title, [class*="title"]:not(title)', type: 'title', priority: 0.88 },
      { selector: '.description, [class*="desc"]', type: 'description', priority: 0.82 },
      { selector: 'a[href]', type: 'link', priority: 0.75 },
      { selector: 'img[src]', type: 'image', priority: 0.70 },
      { selector: '.date, [class*="date"]', type: 'date', priority: 0.85 },
      { selector: '.location, [class*="location"]', type: 'location', priority: 0.80 }
    ];

    for (const element of elementPatterns) {
      const elementsInFirst = firstContainer.find(element.selector);
      if (elementsInFirst.length > 0) {
        const allValues = this.extractValuesFromContainers($, containers, element.selector, element.type);
        
        if (allValues.length >= Math.max(2, containers.length * 0.3)) { // Dynamic threshold
          const confidence = this.calculateMLConfidence(
            allValues.length, 
            containers.length, 
            element.priority, 
            pattern.weight
          );

          fields.push({
            id: `ml_${element.type}_${fieldCounter++}`,
            name: this.generateSmartFieldName(element.type, allValues),
            type: element.type,
            selectors: [`${pattern.selector} ${element.selector}`],
            elements: allValues.length,
            sampleData: allValues.slice(0, 5),
            confidence: Math.round(confidence),
            selected: confidence > 75
          });
        }
      }
    }

    return fields;
  }

  private async analyzeSemanticPatterns($: cheerio.CheerioAPI): Promise<DetectedField[]> {
    const fields: DetectedField[] = [];
    let fieldCounter = 1;

    // Get all text content for NLP analysis
    const textContent = $('body').text();
    
    for (const [type, patterns] of this.semanticRules.entries()) {
      const matches = new Set<string>();
      
      for (const pattern of patterns) {
        const found = textContent.match(pattern);
        if (found) {
          found.forEach(match => matches.add(match.trim()));
        }
      }

      if (matches.size > 0) {
        const sampleData = Array.from(matches).slice(0, 10);
        const confidence = this.calculateSemanticConfidence(matches.size, type);
        
        fields.push({
          id: `semantic_${type}_${fieldCounter++}`,
          name: this.generateSmartFieldName(type, sampleData),
          type: type,
          selectors: [`text-pattern:${type}`],
          elements: matches.size,
          sampleData,
          confidence,
          selected: confidence > 80
        });
      }
    }

    return fields;
  }

  private async applyLearnedPatterns($: cheerio.CheerioAPI, url: string): Promise<DetectedField[]> {
    const domain = new URL(url).hostname;
    const cachedPatterns = this.patternCache.get(domain);
    
    if (!cachedPatterns) return [];
    
    const fields: DetectedField[] = [];
    
    for (const pattern of cachedPatterns) {
      const elements = $(pattern.selectors[0]);
      if (elements.length > 0) {
        const values = this.extractValuesFromElements($, elements, pattern.type);
        if (values.length > 0) {
          fields.push({
            ...pattern,
            id: `learned_${pattern.type}_${Date.now()}`,
            elements: values.length,
            sampleData: values.slice(0, 5),
            confidence: Math.min(pattern.confidence + 5, 98) // Boost confidence for learned patterns
          });
        }
      }
    }
    
    return fields;
  }

  private extractValuesFromContainers(
    $: cheerio.CheerioAPI, 
    containers: cheerio.Cheerio<any>, 
    selector: string, 
    type: string
  ): string[] {
    const values: string[] = [];
    
    containers.each((i, container) => {
      const $container = $(container);
      $container.find(selector).each((j, element) => {
        const $element = $(element);
        let value = '';
        
        switch (type) {
          case 'image':
            value = $element.attr('src') || $element.attr('data-src') || $element.attr('alt') || '';
            break;
          case 'link':
            value = $element.attr('href') || $element.text().trim();
            break;
          default:
            value = $element.text().trim();
        }
        
        if (value && value.length > 0) {
          values.push(value);
        }
      });
    });
    
    return values.filter(v => v.length > 0);
  }

  private extractValuesFromElements($: cheerio.CheerioAPI, elements: cheerio.Cheerio<any>, type: string): string[] {
    const values: string[] = [];
    
    elements.each((i, element) => {
      const $element = $(element);
      let value = '';
      
      switch (type) {
        case 'image':
          value = $element.attr('src') || $element.attr('data-src') || $element.attr('alt') || '';
          break;
        case 'link':
          value = $element.attr('href') || $element.text().trim();
          break;
        default:
          value = $element.text().trim();
      }
      
      if (value && value.length > 0) {
        values.push(value);
      }
    });
    
    return values;
  }

  private calculateMLConfidence(
    foundElements: number, 
    totalContainers: number, 
    elementPriority: number, 
    patternWeight: number
  ): number {
    const coverage = foundElements / totalContainers;
    const baseScore = coverage * 100;
    const priorityBoost = elementPriority * 20;
    const patternBoost = patternWeight * 15;
    
    return Math.min(95, Math.max(60, baseScore + priorityBoost + patternBoost));
  }

  private calculateSemanticConfidence(matchCount: number, type: string): number {
    const baseConfidence = Math.min(90, 60 + (matchCount * 5));
    const typeBoosts: Record<string, number> = {
      'price': 10,
      'email': 15,
      'phone': 12,
      'date': 8
    };
    
    return Math.min(95, baseConfidence + (typeBoosts[type] || 0));
  }

  private generateSmartFieldName(type: string, sampleData: string[]): string {
    const typeNames: Record<string, string> = {
      'heading': 'Headings',
      'price': 'Prices',
      'title': 'Titles',
      'description': 'Descriptions',
      'link': 'Links',
      'image': 'Images',
      'date': 'Dates',
      'location': 'Locations',
      'email': 'Email Addresses',
      'phone': 'Phone Numbers',
      'country': 'Countries',
      'product': 'Products'
    };
    
    // Try to infer more specific names from sample data
    if (sampleData.length > 0) {
      const sample = sampleData[0].toLowerCase();
      if (type === 'heading' && sample.includes('country')) return 'Country Names';
      if (type === 'heading' && sample.includes('product')) return 'Product Names';
      if (type === 'price' && sample.includes('$')) return 'USD Prices';
      if (type === 'description' && sample.length > 100) return 'Long Descriptions';
    }
    
    return typeNames[type] || `${type.charAt(0).toUpperCase()}${type.slice(1)}s`;
  }

  private optimizeFieldSelection(fields: DetectedField[], threshold: number): DetectedField[] {
    // Remove duplicates and low-confidence fields
    const uniqueFields = new Map<string, DetectedField>();
    
    for (const field of fields) {
      if (field.confidence >= threshold * 100) {
        const key = `${field.type}_${field.name}`;
        const existing = uniqueFields.get(key);
        
        if (!existing || field.confidence > existing.confidence) {
          uniqueFields.set(key, field);
        }
      }
    }
    
    return Array.from(uniqueFields.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 20); // Limit to top 20 fields
  }

  private cacheSuccessfulPatterns(url: string, fields: DetectedField[]): void {
    const domain = new URL(url).hostname;
    const highConfidenceFields = fields.filter(f => f.confidence > 85);
    
    if (highConfidenceFields.length > 0) {
      this.patternCache.set(domain, highConfidenceFields);
    }
  }

  public async scrapeWithML(url: string, selectedFields: DetectedField[]): Promise<Record<string, any>[]> {
    try {
      const html = await this.fetchPage(url);
      const $ = cheerio.load(html);
      
      return this.executeAdvancedExtraction($, selectedFields);
    } catch (error) {
      throw new Error(`ML Scraping failed: ${error}`);
    }
  }

  private executeAdvancedExtraction($: cheerio.CheerioAPI, selectedFields: DetectedField[]): Record<string, any>[] {
    // Detect the most likely data structure pattern
    const structureAnalysis = this.analyzeDataStructure($, selectedFields);
    
    switch (structureAnalysis.pattern) {
      case 'container-based':
        return this.extractFromContainers($, structureAnalysis.containers, selectedFields);
      case 'table-based':
        return this.extractFromTables($, selectedFields);
      case 'list-based':
        return this.extractFromLists($, selectedFields);
      default:
        return this.extractIndividually($, selectedFields);
    }
  }

  private analyzeDataStructure($: cheerio.CheerioAPI, fields: DetectedField[]): {
    pattern: string;
    containers?: cheerio.Cheerio<any>;
  } {
    // Check for container patterns
    const containerSelectors = ['.country', '.product', '.item', '.card', 'article'];
    for (const selector of containerSelectors) {
      const containers = $(selector);
      if (containers.length >= 3) {
        return { pattern: 'container-based', containers };
      }
    }
    
    // Check for table patterns
    if ($('table').length > 0 && $('tr').length > 3) {
      return { pattern: 'table-based' };
    }
    
    // Check for list patterns
    if ($('ul li, ol li').length > 5) {
      return { pattern: 'list-based' };
    }
    
    return { pattern: 'individual' };
  }

  private extractFromContainers($: cheerio.CheerioAPI, containers: cheerio.Cheerio<any>, fields: DetectedField[]): Record<string, any>[] {
    const results: Record<string, any>[] = [];
    
    containers.each((index, container) => {
      const $container = $(container);
      const record: Record<string, any> = {};
      
      fields.forEach(field => {
        const values: string[] = [];
        
        field.selectors.forEach(selector => {
          if (selector.startsWith('text-pattern:')) {
            // Handle semantic patterns
            const text = $container.text();
            const type = selector.replace('text-pattern:', '');
            const patterns = this.semanticRules.get(type) || [];
            
            patterns.forEach(pattern => {
              const matches = text.match(pattern);
              if (matches) values.push(...matches);
            });
          } else {
            // Handle DOM selectors
            const cleanSelector = selector.replace(/^[^:]+\s+/, '');
            $container.find(cleanSelector).each((i, el) => {
              const $el = $(el);
              let value = '';
              
              if (field.type === 'image') {
                value = $el.attr('src') || $el.attr('data-src') || $el.attr('alt') || '';
              } else if (field.type === 'link') {
                value = $el.attr('href') || $el.text().trim();
              } else {
                value = $el.text().trim();
              }
              
              if (value) values.push(value);
            });
          }
        });
        
        if (values.length > 0) {
          record[field.name] = values.length === 1 ? values[0] : values;
        }
      });
      
      if (Object.keys(record).length > 0) {
        results.push(record);
      }
    });
    
    return results;
  }

  private extractFromTables($: cheerio.CheerioAPI, fields: DetectedField[]): Record<string, any>[] {
    const results: Record<string, any>[] = [];
    const table = $('table').first();
    const headers = table.find('th').map((i, el) => $(el).text().trim()).get();
    
    table.find('tbody tr, tr').each((index, row) => {
      if ($(row).find('th').length > 0) return; // Skip header rows
      
      const record: Record<string, any> = {};
      const cells = $(row).find('td');
      
      cells.each((cellIndex, cell) => {
        const $cell = $(cell);
        const headerName = headers[cellIndex] || `Column ${cellIndex + 1}`;
        const value = $cell.text().trim();
        
        if (value) {
          record[headerName] = value;
        }
      });
      
      if (Object.keys(record).length > 0) {
        results.push(record);
      }
    });
    
    return results;
  }

  private extractFromLists($: cheerio.CheerioAPI, fields: DetectedField[]): Record<string, any>[] {
    const results: Record<string, any>[] = [];
    
    $('ul li, ol li').each((index, item) => {
      const $item = $(item);
      const record: Record<string, any> = {};
      
      fields.forEach(field => {
        field.selectors.forEach(selector => {
          const cleanSelector = selector.replace(/^[^:]+\s+/, '');
          const elements = selector.includes(' ') ? $item.find(cleanSelector) : $item.is(cleanSelector) ? $item : $();
          
          elements.each((i, el) => {
            const $el = $(el);
            let value = '';
            
            if (field.type === 'image') {
              value = $el.attr('src') || $el.attr('alt') || '';
            } else if (field.type === 'link') {
              value = $el.attr('href') || $el.text().trim();
            } else {
              value = $el.text().trim();
            }
            
            if (value) {
              record[field.name] = value;
            }
          });
        });
      });
      
      if (Object.keys(record).length > 0) {
        results.push(record);
      }
    });
    
    return results;
  }

  private extractIndividually($: cheerio.CheerioAPI, fields: DetectedField[]): Record<string, any>[] {
    const fieldData: Record<string, string[]> = {};
    let maxLength = 0;
    
    fields.forEach(field => {
      const values: string[] = [];
      
      field.selectors.forEach(selector => {
        if (selector.startsWith('text-pattern:')) {
          const type = selector.replace('text-pattern:', '');
          const patterns = this.semanticRules.get(type) || [];
          const text = $('body').text();
          
          patterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) values.push(...matches);
          });
        } else {
          $(selector).each((i, el) => {
            const $el = $(el);
            let value = '';
            
            if (field.type === 'image') {
              value = $el.attr('src') || $el.attr('alt') || '';
            } else if (field.type === 'link') {
              value = $el.attr('href') || $el.text().trim();
            } else {
              value = $el.text().trim();
            }
            
            if (value) values.push(value);
          });
        }
      });
      
      fieldData[field.name] = values;
      maxLength = Math.max(maxLength, values.length);
    });
    
    const results: Record<string, any>[] = [];
    for (let i = 0; i < maxLength; i++) {
      const record: Record<string, any> = {};
      let hasData = false;
      
      fields.forEach(field => {
        const values = fieldData[field.name];
        if (values && values[i]) {
          record[field.name] = values[i];
          hasData = true;
        }
      });
      
      if (hasData) {
        results.push(record);
      }
    }
    
    return results;
  }
}