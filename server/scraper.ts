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
          confidence: 98,
          selected: true
        });
      }
    }

    // Capital city
    const capitalSpan = firstContainer.find('.country-capital');
    if (capitalSpan.length > 0) {
      const allCapitals = containers.map((i, el) => $(el).find('.country-capital').text().trim()).get().filter(cap => cap);
      if (allCapitals.length > 0) {
        fields.push({
          id: `field_capital_${fieldCounter++}`,
          name: 'Capital City',
          type: 'capital',
          selectors: ['.country-capital'],
          elements: allCapitals.length,
          sampleData: allCapitals.slice(0, 5),
          confidence: 96,
          selected: true
        });
      }
    }

    // Population
    const populationSpan = firstContainer.find('.country-population');
    if (populationSpan.length > 0) {
      const allPopulations = containers.map((i, el) => $(el).find('.country-population').text().trim()).get().filter(pop => pop);
      if (allPopulations.length > 0) {
        fields.push({
          id: `field_population_${fieldCounter++}`,
          name: 'Population',
          type: 'population',
          selectors: ['.country-population'],
          elements: allPopulations.length,
          sampleData: allPopulations.slice(0, 5),
          confidence: 95,
          selected: true
        });
      }
    }

    // Area
    const areaSpan = firstContainer.find('.country-area');
    if (areaSpan.length > 0) {
      const allAreas = containers.map((i, el) => $(el).find('.country-area').text().trim()).get().filter(area => area);
      if (allAreas.length > 0) {
        fields.push({
          id: `field_area_${fieldCounter++}`,
          name: 'Area (km²)',
          type: 'area',
          selectors: ['.country-area'],
          elements: allAreas.length,
          sampleData: allAreas.slice(0, 5),
          confidence: 94,
          selected: true
        });
      }
    }
  }

  private analyzeContainerPattern($: cheerio.CheerioAPI, containers: cheerio.Cheerio<any>, fields: DetectedField[], fieldCounter: number, containerSelector: string): void {
    const firstContainer = containers.first();
    
    // Analyze the structure of the first container to identify field patterns
    const headings = firstContainer.find('h1, h2, h3, h4, h5, h6');
    const strongTexts = firstContainer.find('strong, b');
    const spans = firstContainer.find('span[class]');
    const divs = firstContainer.find('div[class]');

    // Detect title/name fields
    if (headings.length > 0) {
      const selector = `${containerSelector} ${headings.get(0).tagName.toLowerCase()}`;
      const allTitles = containers.map((i, el) => $(el).find(headings.get(0).tagName.toLowerCase()).first().text().trim()).get().filter(title => title);
      if (allTitles.length >= 3) {
        fields.push({
          id: `field_title_${fieldCounter++}`,
          name: 'Title/Name',
          type: 'title',
          selectors: [selector],
          elements: allTitles.length,
          sampleData: allTitles.slice(0, 5),
          confidence: 92,
          selected: true
        });
      }
    }

    // Detect labeled fields (strong: value pattern)
    strongTexts.each((i, strongEl) => {
      const strongText = $(strongEl).text().trim();
      if (strongText.includes(':')) {
        const label = strongText.split(':')[0].trim();
        const nextSibling = $(strongEl).next();
        if (nextSibling.length > 0) {
          const selector = `${containerSelector} strong:contains("${label}") + *`;
          const allValues = containers.map((i, el) => {
            const value = $(el).find(`strong:contains("${label}")`).next().text().trim();
            return value;
          }).get().filter(val => val);
          
          if (allValues.length >= 3) {
            fields.push({
              id: `field_${label.toLowerCase().replace(/\s+/g, '_')}_${fieldCounter++}`,
              name: label,
              type: this.guessFieldType(label),
              selectors: [selector],
              elements: allValues.length,
              sampleData: allValues.slice(0, 5),
              confidence: 88,
              selected: true
            });
          }
        }
      }
    });

    // Detect class-based fields
    spans.each((i, spanEl) => {
      const className = $(spanEl).attr('class');
      if (className && className.includes('-')) {
        const fieldName = className.split('-').pop();
        if (fieldName && fieldName.length > 2) {
          const selector = `${containerSelector} .${className}`;
          const allValues = containers.map((i, el) => $(el).find(`.${className}`).text().trim()).get().filter(val => val);
          
          if (allValues.length >= 3 && !fields.some(f => f.selectors.includes(selector))) {
            fields.push({
              id: `field_${fieldName}_${fieldCounter++}`,
              name: this.formatFieldName(fieldName),
              type: this.guessFieldType(fieldName),
              selectors: [selector],
              elements: allValues.length,
              sampleData: allValues.slice(0, 5),
              confidence: 85,
              selected: true
            });
          }
        }
      }
    });
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
    return fieldName
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

    // Detect links
    const links = $('a[href]').not('script, style');
    if (links.length > 0) {
      const sampleData = links.slice(0, 5).map((i, el) => $(el).text().trim()).get().filter(text => text);
      if (sampleData.length > 0) {
        fields.push({
          id: `field_links_${fieldCounter++}`,
          name: 'Links',
          type: 'link',
          selectors: ['a[href]'],
          elements: links.length,
          sampleData,
          confidence: 85,
          selected: false
        });
      }
    }

    // Detect images
    const images = $('img[src]').not('script, style');
    if (images.length > 0) {
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

    // Detect paragraphs with substantial text
    const paragraphs = $('p').not('script, style').filter((i, el) => $(el).text().trim().length > 20);
    if (paragraphs.length > 0) {
      const sampleData = paragraphs.slice(0, 3).map((i, el) => $(el).text().trim().substring(0, 100) + '...').get();
      fields.push({
        id: `field_paragraphs_${fieldCounter++}`,
        name: 'Paragraphs',
        type: 'description',
        selectors: ['p'],
        elements: paragraphs.length,
        sampleData,
        confidence: 75,
        selected: false
      });
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

    // Detect list items
    const listItems = $('li').not('script, style').filter((i, el) => $(el).text().trim().length > 5);
    if (listItems.length > 5) {
      const sampleData = listItems.slice(0, 5).map((i, el) => $(el).text().trim()).get();
      fields.push({
        id: `field_list_items_${fieldCounter++}`,
        name: 'List Items',
        type: 'list',
        selectors: ['li'],
        elements: listItems.length,
        sampleData,
        confidence: 82,
        selected: false
      });
    }

    // Detect form inputs
    const inputs = $('input[name], select[name], textarea[name]').not('script, style');
    if (inputs.length > 0) {
      const sampleData = inputs.slice(0, 5).map((i, el) => $(el).attr('name') || $(el).attr('placeholder')).get();
      fields.push({
        id: `field_form_inputs_${fieldCounter++}`,
        name: 'Form Fields',
        type: 'form',
        selectors: ['input[name]', 'select[name]', 'textarea[name]'],
        elements: inputs.length,
        sampleData,
        confidence: 88,
        selected: false
      });
    }

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

    // Detect product names
    const products = $('[class*="product"], [class*="item"], [class*="title"]:not(title)').not('script, style, meta');
    if (products.length > 0) {
      const sampleData = products.slice(0, 5).map((i, el) => $(el).text().trim()).get().filter(text => text && text.length > 3);
      if (sampleData.length > 0) {
        fields.push({
          id: `field_products_${fieldCounter++}`,
          name: 'Product/Item Names',
          type: 'product',
          selectors: ['[class*="product"]', '[class*="item"]', '[class*="title"]:not(title)'],
          elements: products.length,
          sampleData,
          confidence: 87,
          selected: true
        });
      }
    }

    return fields.sort((a, b) => b.confidence - a.confidence);
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
      const results: Record<string, any>[] = [];

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
      const record: Record<string, any> = { id: index + 1 };

      // Extract country name
      const countryName = $container.find('h3').text().trim();
      if (countryName) record['Country Name'] = countryName;

      // Extract capital
      const capital = $container.find('.country-capital').text().trim();
      if (capital) record['Capital'] = capital;

      // Extract population
      const population = $container.find('.country-population').text().trim();
      if (population) record['Population'] = population;

      // Extract area
      const area = $container.find('.country-area').text().trim();
      if (area) record['Area'] = area;

      // Extract any other selected fields
      selectedFields.forEach(field => {
        if (!record[field.name]) {
          field.selectors.forEach(selector => {
            const value = $container.find(selector).text().trim();
            if (value && !record[field.name]) {
              record[field.name] = value;
            }
          });
        }
      });

      if (Object.keys(record).length > 1) {
        results.push(record);
      }
    });

    return results;
  }

  private extractFromContainers($: cheerio.CheerioAPI, containers: cheerio.Cheerio<any>, selectedFields: DetectedField[]): Record<string, any>[] {
    const results: Record<string, any>[] = [];

    containers.slice(0, 100).each((index, container) => {
      const $container = $(container);
      const record: Record<string, any> = { id: index + 1 };

      selectedFields.forEach(field => {
        let bestValue = '';
        let maxScore = 0;

        field.selectors.forEach(selector => {
          const elements = $container.find(selector);
          elements.each((i, el) => {
            const text = $(el).text().trim();
            if (text) {
              const score = this.scoreFieldMatch(text, field.type);
              if (score > maxScore) {
                maxScore = score;
                bestValue = text;
              }
            }
          });
        });

        if (bestValue) {
          record[field.name] = bestValue;
        }
      });

      if (Object.keys(record).length > 1) {
        results.push(record);
      }
    });

    return results;
  }

  private extractByIndividualSelectors($: cheerio.CheerioAPI, selectedFields: DetectedField[]): Record<string, any>[] {
    const results: Record<string, any>[] = [];
    const maxItems = Math.min(50, this.getMaxElementCount($, selectedFields));

    for (let i = 0; i < maxItems; i++) {
      const record: Record<string, any> = { id: i + 1 };
      let hasData = false;

      selectedFields.forEach(field => {
        field.selectors.forEach(selector => {
          if (!record[field.name]) {
            const element = $(selector).eq(i);
            if (element.length > 0) {
              const text = element.text().trim();
              if (text) {
                record[field.name] = text;
                hasData = true;
              }
            }
          }
        });
      });

      if (hasData) {
        results.push(record);
      } else {
        break;
      }
    }

    return results;
  }

  private scoreFieldMatch(text: string, fieldType: string): number {
    let score = 1;
    const lowerText = text.toLowerCase();

    switch (fieldType) {
      case 'price':
        if (/[\$£€¥]|\d+\.?\d*/.test(text)) score += 3;
        break;
      case 'population':
        if (/^\d{1,3}(,\d{3})*$/.test(text) || /^\d+$/.test(text)) score += 3;
        break;
      case 'area':
        if (/\d+\.?\d*/.test(text) && (lowerText.includes('km') || lowerText.includes('mi'))) score += 3;
        break;
      case 'email':
        if (/@/.test(text)) score += 3;
        break;
      case 'phone':
        if (/[\+\-\(\)\d\s]{10,}/.test(text)) score += 2;
        break;
      case 'title':
        if (text.length > 5 && text.length < 100) score += 1;
        break;
    }

    return score;
  }

  private getMaxElementCount($: cheerio.CheerioAPI, selectedFields: DetectedField[]): number {
    let maxCount = 0;

    selectedFields.forEach(field => {
      field.selectors.forEach(selector => {
        const count = $(selector).length;
        if (count > maxCount) {
          maxCount = count;
        }
      });
    });

    return maxCount;
  }
}