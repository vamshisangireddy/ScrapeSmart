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

    // Detect headings
    const headings = $('h1, h2, h3, h4, h5, h6').not('script, style');
    if (headings.length > 0) {
      const sampleData = headings.slice(0, 5).map((i, el) => $(el).text().trim()).get();
      fields.push({
        id: `field_heading_${fieldCounter++}`,
        name: 'Headings',
        type: 'title',
        selectors: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
        elements: headings.length,
        sampleData,
        confidence: 90,
        selected: true
      });
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

      // Group elements by their parent containers to maintain relationships
      const containers = new Set<any>();
      
      // Find common parent containers
      selectedFields.forEach(field => {
        field.selectors.forEach(selector => {
          const elements = $(selector);
          elements.each((i, el) => {
            let parent = $(el).parent()[0];
            if (parent) containers.add(parent);
          });
        });
      });

      // If we found containers, extract data per container
      if (containers.size > 0) {
        Array.from(containers).slice(0, 100).forEach((container, index) => {
          const $container = $(container);
          const record: Record<string, any> = {};
          
          selectedFields.forEach(field => {
            const values: string[] = [];
            field.selectors.forEach(selector => {
              $container.find(selector).each((i, el) => {
                const text = $(el).text().trim();
                if (text && !values.includes(text)) {
                  values.push(text);
                }
              });
            });
            
            if (values.length > 0) {
              record[field.name] = values.length === 1 ? values[0] : values;
            }
          });
          
          if (Object.keys(record).length > 0) {
            results.push({ id: index + 1, ...record });
          }
        });
      } else {
        // Fallback: extract all matching elements
        const maxItems = 50;
        for (let i = 0; i < maxItems; i++) {
          const record: Record<string, any> = {};
          let hasData = false;
          
          selectedFields.forEach(field => {
            field.selectors.forEach(selector => {
              const element = $(selector).eq(i);
              if (element.length > 0) {
                const text = element.text().trim();
                if (text) {
                  record[field.name] = text;
                  hasData = true;
                }
              }
            });
          });
          
          if (hasData) {
            results.push({ id: i + 1, ...record });
          } else {
            break;
          }
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to scrape page: ${error}`);
    }
  }
}