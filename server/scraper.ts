import axios from 'axios';
import * as cheerio from 'cheerio';
import type { DetectedField, PageInfo } from '@shared/schema';

export interface ScrapingResult {
  pageInfo: PageInfo;
  detectedFields: DetectedField[];
  scrapedData?: Record<string, any>[];
}

export class WebScraper {
  private async fetchPage(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch page: ${error}`);
    }
  }

  private analyzePageStructure($: cheerio.CheerioAPI): DetectedField[] {
    const fields: DetectedField[] = [];
    let fieldCounter = 1;

    // Analyze page structure to detect repeated patterns
    this.detectRepeatedPatterns($, fields, fieldCounter);

    // Detect specific content patterns
    this.detectContentPatterns($, fields, fieldCounter);

    return fields.sort((a, b) => b.confidence - a.confidence);
  }

  private detectRepeatedPatterns($: cheerio.CheerioAPI, fields: DetectedField[], fieldCounter: number): void {
    // Look for repeated container patterns that suggest data lists
    const potentialContainers = [
      'div[class*="country"]',
      'div[class*="item"]', 
      'div[class*="card"]',
      'div[class*="entry"]',
      'div[class*="row"]',
      'li',
      'tr',
      '.col-md-4',
      '[class*="product"]'
    ];

    for (const containerSelector of potentialContainers) {
      const containers = $(containerSelector);
      if (containers.length >= 3) { // Need at least 3 items to consider it a pattern
        this.analyzeContainerPattern($, containers, fields, fieldCounter, containerSelector);
      }
    }

    // Special case for scrapethissite.com countries page
    const countryDivs = $('.country');
    if (countryDivs.length > 0) {
      this.analyzeCountryPattern($, countryDivs, fields, fieldCounter);
    }
  }

  private analyzeCountryPattern($: cheerio.CheerioAPI, containers: cheerio.Cheerio<any>, fields: DetectedField[], fieldCounter: number): void {
    // Analyze the country pattern specifically
    const firstContainer = containers.first();
    
    // Country name (usually h3 or first heading)
    const countryName = firstContainer.find('h3').text().trim();
    if (countryName) {
      const allNames = containers.map((i, el) => $(el).find('h3').text().trim()).get().filter(name => name);
      if (allNames.length > 0) {
        fields.push({
          id: `field_country_name_${fieldCounter++}`,
          name: 'Country Name',
          type: 'country',
          selectors: ['.country h3'],
          elements: allNames.length,
          sampleData: allNames.slice(0, 5),
          confidence: 95,
          selected: true
        });
      }
    }

    // Capital
    const capital = firstContainer.find('.country-capital').text().trim();
    if (capital) {
      const allCapitals = containers.map((i, el) => $(el).find('.country-capital').text().trim()).get().filter(cap => cap);
      if (allCapitals.length > 0) {
        fields.push({
          id: `field_capital_${fieldCounter++}`,
          name: 'Capital',
          type: 'capital',
          selectors: ['.country-capital'],
          elements: allCapitals.length,
          sampleData: allCapitals.slice(0, 5),
          confidence: 90,
          selected: true
        });
      }
    }

    // Population
    const population = firstContainer.find('.country-population').text().trim();
    if (population) {
      const allPopulations = containers.map((i, el) => $(el).find('.country-population').text().trim()).get().filter(pop => pop);
      if (allPopulations.length > 0) {
        fields.push({
          id: `field_population_${fieldCounter++}`,
          name: 'Population',
          type: 'population',
          selectors: ['.country-population'],
          elements: allPopulations.length,
          sampleData: allPopulations.slice(0, 5),
          confidence: 90,
          selected: true
        });
      }
    }

    // Area
    const area = firstContainer.find('.country-area').text().trim();
    if (area) {
      const allAreas = containers.map((i, el) => $(el).find('.country-area').text().trim()).get().filter(area => area);
      if (allAreas.length > 0) {
        fields.push({
          id: `field_area_${fieldCounter++}`,
          name: 'Area',
          type: 'area',
          selectors: ['.country-area'],
          elements: allAreas.length,
          sampleData: allAreas.slice(0, 5),
          confidence: 90,
          selected: true
        });
      }
    }
  }

  private analyzeContainerPattern($: cheerio.CheerioAPI, containers: cheerio.Cheerio<any>, fields: DetectedField[], fieldCounter: number, containerSelector: string): void {
    const firstContainer = containers.first();
    
    // Look for common patterns within containers
    const commonElements = [
      { selector: 'h1, h2, h3, h4, h5, h6', type: 'heading', name: 'Headings' },
      { selector: '.price, [class*="price"]', type: 'price', name: 'Prices' },
      { selector: 'a[href]', type: 'link', name: 'Links' },
      { selector: 'img[src]', type: 'image', name: 'Images' },
      { selector: 'p', type: 'description', name: 'Descriptions' }
    ];

    for (const element of commonElements) {
      const elementInFirst = firstContainer.find(element.selector).first();
      if (elementInFirst.length > 0) {
        const allValues = containers.map((i, container) => {
          const found = $(container).find(element.selector).first();
          return element.type === 'image' ? found.attr('src') || found.attr('alt') : found.text().trim();
        }).get().filter(value => value);

        if (allValues.length >= containers.length * 0.5) { // At least 50% of containers have this element
          fields.push({
            id: `field_${element.type}_${fieldCounter++}`,
            name: this.formatFieldName(element.name),
            type: element.type,
            selectors: [`${containerSelector} ${element.selector}`],
            elements: allValues.length,
            sampleData: allValues.slice(0, 5),
            confidence: 85,
            selected: true
          });
        }
      }
    }
  }

  private detectContentPatterns($: cheerio.CheerioAPI, fields: DetectedField[], fieldCounter: number): void {
    // Detect common e-commerce patterns
    const prices = $('[class*="price"], [id*="price"], .cost, .amount').not('script, style');
    if (prices.length > 0) {
      const sampleData = prices.slice(0, 5).map((i, el) => $(el).text().trim()).get().filter(text => text);
      if (sampleData.length > 0) {
        fields.push({
          id: `field_prices_${fieldCounter++}`,
          name: 'Prices',
          type: 'price',
          selectors: ['[class*="price"]', '[id*="price"]', '.cost', '.amount'],
          elements: prices.length,
          sampleData,
          confidence: 92,
          selected: true
        });
      }
    }

    // Detect images
    const images = $('img[src]').not('script, style');
    if (images.length > 3) {
      const sampleData = images.slice(0, 5).map((i, el) => $(el).attr('alt') || $(el).attr('src')).get();
      fields.push({
        id: `field_images_${fieldCounter++}`,
        name: 'Images',
        type: 'image',
        selectors: ['img[src]'],
        elements: images.length,
        sampleData,
        confidence: 80,
        selected: false
      });
    }

    // Detect links
    const links = $('a[href]').not('script, style');
    if (links.length > 5) {
      const sampleData = links.slice(0, 5).map((i, el) => $(el).text().trim()).get().filter(text => text);
      if (sampleData.length > 0) {
        fields.push({
          id: `field_links_${fieldCounter++}`,
          name: 'Links',
          type: 'link',
          selectors: ['a[href]'],
          elements: links.length,
          sampleData,
          confidence: 75,
          selected: false
        });
      }
    }

    // Detect tables
    const tables = $('table').not('script, style');
    if (tables.length > 0) {
      tables.each((i, table) => {
        const $table = $(table);
        const headers = $table.find('th').map((i, el) => $(el).text().trim()).get();
        const rows = $table.find('tr').length;
        
        if (headers.length > 0) {
          fields.push({
            id: `field_table_${i + 1}_${fieldCounter++}`,
            name: `Table ${i + 1} Data`,
            type: 'table',
            selectors: [`table:eq(${i}) td`],
            elements: rows,
            sampleData: headers.slice(0, 5),
            confidence: 95,
            selected: true
          });
        }
      });
    }

    // Detect headings
    const headings = $('h1, h2, h3, h4, h5, h6').not('script, style');
    if (headings.length > 0) {
      const sampleData = headings.slice(0, 5).map((i, el) => $(el).text().trim()).get().filter(text => text);
      if (sampleData.length > 0) {
        fields.push({
          id: `field_headings_${fieldCounter++}`,
          name: 'Headings',
          type: 'heading',
          selectors: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
          elements: headings.length,
          sampleData,
          confidence: 88,
          selected: false
        });
      }
    }
  }

  private guessFieldType(label: string): string {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('price') || lowerLabel.includes('cost') || lowerLabel.includes('amount')) return 'price';
    if (lowerLabel.includes('population')) return 'population';
    if (lowerLabel.includes('capital')) return 'capital';
    if (lowerLabel.includes('area') || lowerLabel.includes('size')) return 'area';
    if (lowerLabel.includes('country') || lowerLabel.includes('nation')) return 'country';
    if (lowerLabel.includes('name') || lowerLabel.includes('title')) return 'title';
    if (lowerLabel.includes('date') || lowerLabel.includes('time')) return 'date';
    if (lowerLabel.includes('email')) return 'email';
    if (lowerLabel.includes('phone')) return 'phone';
    if (lowerLabel.includes('address') || lowerLabel.includes('location')) return 'location';
    return 'text';
  }

  private formatFieldName(fieldName: string): string {
    return fieldName
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  public async analyzePage(url: string): Promise<ScrapingResult> {
    try {
      const html = await this.fetchPage(url);
      const $ = cheerio.load(html);
      
      const title = $('title').text().trim() || 'Untitled Page';
      const domain = new URL(url).hostname;
      const description = $('meta[name="description"]').attr('content') || 
                         $('meta[property="og:description"]').attr('content') || 
                         'Page analysis complete';

      const pageInfo: PageInfo = {
        url,
        title,
        domain,
        description,
        type: 'analyzed'
      };

      const detectedFields = this.analyzePageStructure($);

      return {
        pageInfo,
        detectedFields
      };
    } catch (error) {
      throw new Error(`Failed to analyze page: ${error}`);
    }
  }

  public async scrapePage(url: string, selectedFields: DetectedField[]): Promise<Record<string, any>[]> {
    try {
      const html = await this.fetchPage(url);
      const $ = cheerio.load(html);

      // Use improved scraping algorithm based on field types
      return this.extractDataByPattern($, selectedFields);
    } catch (error) {
      throw new Error(`Failed to scrape page: ${error}`);
    }
  }

  private extractDataByPattern($: cheerio.CheerioAPI, selectedFields: DetectedField[]): Record<string, any>[] {
    const results: Record<string, any>[] = [];

    // Check if this is a country page pattern
    const countryContainers = $('.country');
    if (countryContainers.length > 0) {
      return this.extractCountryData($, countryContainers, selectedFields);
    }

    // Look for repeated container patterns
    const containerPatterns = [
      '.col-md-4',
      '[class*="item"]',
      '[class*="card"]',
      '[class*="product"]',
      'li:has(h1, h2, h3, h4, h5, h6)',
      'div:has(h1, h2, h3, h4, h5, h6)',
      'tr:has(td)'
    ];

    for (const pattern of containerPatterns) {
      const containers = $(pattern);
      if (containers.length >= 3) {
        return this.extractFromContainers($, containers, selectedFields);
      }
    }

    // Fallback: extract by individual selectors
    return this.extractByIndividualSelectors($, selectedFields);
  }

  private extractCountryData($: cheerio.CheerioAPI, containers: cheerio.Cheerio<any>, selectedFields: DetectedField[]): Record<string, any>[] {
    const results: Record<string, any>[] = [];

    containers.each((index, container) => {
      const $container = $(container);
      const record: Record<string, any> = {};

      selectedFields.forEach(field => {
        switch (field.type) {
          case 'country':
            record[field.name] = $container.find('h3').text().trim();
            break;
          case 'capital':
            record[field.name] = $container.find('.country-capital').text().trim();
            break;
          case 'population':
            record[field.name] = $container.find('.country-population').text().trim();
            break;
          case 'area':
            record[field.name] = $container.find('.country-area').text().trim();
            break;
        }
      });

      if (Object.keys(record).length > 0) {
        results.push(record);
      }
    });

    return results;
  }

  private extractFromContainers($: cheerio.CheerioAPI, containers: cheerio.Cheerio<any>, selectedFields: DetectedField[]): Record<string, any>[] {
    const results: Record<string, any>[] = [];

    containers.each((index, container) => {
      const $container = $(container);
      const record: Record<string, any> = {};

      selectedFields.forEach(field => {
        const values: string[] = [];
        
        field.selectors.forEach(selector => {
          $container.find(selector).each((i, el) => {
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
              values.push(value);
            }
          });
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

  private extractByIndividualSelectors($: cheerio.CheerioAPI, selectedFields: DetectedField[]): Record<string, any>[] {
    const results: Record<string, any>[] = [];
    
    // Find the maximum number of elements across all fields
    let maxElements = 0;
    const fieldData: Record<string, string[]> = {};

    selectedFields.forEach(field => {
      const values: string[] = [];
      
      field.selectors.forEach(selector => {
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
          
          if (value) {
            values.push(value);
          }
        });
      });

      fieldData[field.name] = values;
      maxElements = Math.max(maxElements, values.length);
    });

    // Create records by combining data at each index
    for (let i = 0; i < maxElements; i++) {
      const record: Record<string, any> = {};
      let hasData = false;

      selectedFields.forEach(field => {
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