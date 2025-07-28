// Modern Content Script for WebScraper Pro v2.0
// Production-ready content script with advanced ML field detection

class MLFieldDetector {
  constructor() {
    this.detectedFields = [];
    this.analysisCache = new Map();
    this.observerActive = false;
    
    // Advanced semantic patterns with ML confidence scoring
    this.semanticPatterns = {
      price: {
        patterns: [
          /\$[\d,]+\.?\d*/gi,
          /\b\d+[\.,]\d+\s*(USD|EUR|GBP|dollars?|euros?|pounds?)\b/gi,
          /\b(price|cost|amount|fee):\s*[\$€£]?[\d,]+\.?\d*/gi
        ],
        confidence: 0.95
      },
      email: {
        patterns: [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi],
        confidence: 0.98
      },
      phone: {
        patterns: [
          /\b\+?[\d\s\-\(\)]{10,}\b/gi,
          /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/gi
        ],
        confidence: 0.92
      },
      date: {
        patterns: [
          /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/gi,
          /\b\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}\b/gi,
          /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi
        ],
        confidence: 0.88
      }
    };

    // Advanced CSS selectors for intelligent detection
    this.intelligentSelectors = {
      containers: [
        '.country, [class*="country"]',
        '.product, [class*="product"]',
        '.item, [class*="item"]',
        '.card, [class*="card"]',
        'article, .article',
        '.listing, [class*="listing"]',
        '.entry, [class*="entry"]',
        '.row[class*="data"], .data-row'
      ],
      content: {
        titles: ['h1, h2, h3, h4, h5, h6', '.title, [class*="title"]:not(title)', '.name, [class*="name"]'],
        prices: ['.price, [class*="price"]', '[data-price]', '.cost, .amount'],
        descriptions: ['.description, [class*="desc"]', 'p', '.summary, .content'],
        images: ['img[src]', '.image img', '[class*="photo"] img'],
        links: ['a[href]', '.link[href]'],
        dates: ['.date, [class*="date"]', 'time', '[datetime]'],
        locations: ['.location, [class*="location"]', '.address, [class*="address"]']
      }
    };

    this.initializeDetector();
  }

  initializeDetector() {
    // Auto-detect when page is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => this.performIntelligentDetection(), 1000);
      });
    } else {
      setTimeout(() => this.performIntelligentDetection(), 1000);
    }

    // Set up dynamic content monitoring
    this.setupDynamicMonitoring();
  }

  setupDynamicMonitoring() {
    // Monitor for dynamic content changes
    const observer = new MutationObserver((mutations) => {
      let shouldReAnalyze = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if significant content was added
          const addedElements = Array.from(mutation.addedNodes)
            .filter(node => node.nodeType === Node.ELEMENT_NODE)
            .filter(node => node.children?.length > 0 || node.textContent?.trim().length > 20);
          
          if (addedElements.length > 0) {
            shouldReAnalyze = true;
          }
        }
      });

      if (shouldReAnalyze && !this.observerActive) {
        this.observerActive = true;
        setTimeout(() => {
          this.performIntelligentDetection();
          this.observerActive = false;
        }, 2000);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });
  }

  async performIntelligentDetection() {
    try {
      const url = window.location.href;
      const cacheKey = this.generateCacheKey(url);
      
      // Check cache first
      if (this.analysisCache.has(cacheKey)) {
        this.detectedFields = this.analysisCache.get(cacheKey);
        return this.detectedFields;
      }

      console.log('🔍 Performing ML-powered field detection...');
      
      const fields = [];
      let fieldCounter = 1;

      // 1. Structural Pattern Analysis
      const structuralFields = await this.analyzeStructuralPatterns(fieldCounter);
      fields.push(...structuralFields);
      fieldCounter += structuralFields.length;

      // 2. Semantic Pattern Analysis
      const semanticFields = await this.analyzeSemanticPatterns(fieldCounter);
      fields.push(...semanticFields);
      fieldCounter += semanticFields.length;

      // 3. Visual Layout Analysis
      const visualFields = await this.analyzeVisualPatterns(fieldCounter);
      fields.push(...visualFields);
      fieldCounter += visualFields.length;

      // 4. Context-Aware Deduplication and Optimization
      const optimizedFields = this.optimizeDetectedFields(fields);

      // Cache results
      this.analysisCache.set(cacheKey, optimizedFields);
      this.detectedFields = optimizedFields;

      console.log(`✅ Detected ${optimizedFields.length} high-confidence fields`);
      
      return optimizedFields;
    } catch (error) {
      console.error('Field detection error:', error);
      return [];
    }
  }

  async analyzeStructuralPatterns(startCounter) {
    const fields = [];
    let counter = startCounter;

    // Check for repeating container patterns
    for (const containerSelector of this.intelligentSelectors.containers) {
      const containers = document.querySelectorAll(containerSelector);
      
      if (containers.length >= 2) { // Lower threshold for more sensitive detection
        const containerFields = await this.analyzeContainerPattern(containers, containerSelector, counter);
        fields.push(...containerFields);
        counter += containerFields.length;
      }
    }

    // Special handling for tables
    const tables = document.querySelectorAll('table');
    tables.forEach((table, tableIndex) => {
      const tableFields = this.analyzeTableStructure(table, tableIndex, counter);
      fields.push(...tableFields);
      counter += tableFields.length;
    });

    return fields;
  }

  async analyzeContainerPattern(containers, selector, startCounter) {
    const fields = [];
    let counter = startCounter;
    const firstContainer = containers[0];

    // Analyze each content type within containers
    Object.entries(this.intelligentSelectors.content).forEach(([contentType, selectors]) => {
      selectors.forEach(contentSelector => {
        const elementsInFirst = firstContainer.querySelectorAll(contentSelector);
        
        if (elementsInFirst.length > 0) {
          const allValues = this.extractValuesFromContainers(
            containers, 
            contentSelector, 
            contentType
          );

          if (allValues.length >= Math.max(2, containers.length * 0.4)) { // Dynamic threshold
            const confidence = this.calculateMLConfidence(
              allValues.length,
              containers.length,
              contentType,
              selector
            );

            if (confidence >= 70) { // Only include high-confidence fields
              fields.push({
                id: `ml_${contentType}_${counter++}`,
                name: this.generateIntelligentName(contentType, allValues),
                type: contentType,
                selectors: [`${selector} ${contentSelector}`],
                elements: allValues.length,
                sampleData: allValues.slice(0, 5),
                confidence: Math.round(confidence),
                selected: confidence > 80
              });
            }
          }
        }
      });
    });

    return fields;
  }

  async analyzeSemanticPatterns(startCounter) {
    const fields = [];
    let counter = startCounter;

    // Get page text for semantic analysis
    const pageText = document.body.textContent || '';
    
    Object.entries(this.semanticPatterns).forEach(([type, config]) => {
      const matches = new Set();
      
      config.patterns.forEach(pattern => {
        const found = pageText.match(pattern);
        if (found) {
          found.forEach(match => matches.add(match.trim()));
        }
      });

      if (matches.size > 0) {
        const sampleData = Array.from(matches).slice(0, 10);
        const confidence = Math.min(95, config.confidence * 100 + (matches.size * 2));
        
        fields.push({
          id: `semantic_${type}_${counter++}`,
          name: this.generateIntelligentName(type, sampleData),
          type: type,
          selectors: [`semantic:${type}`],
          elements: matches.size,
          sampleData,
          confidence: Math.round(confidence),
          selected: confidence > 85
        });
      }
    });

    return fields;
  }

  async analyzeVisualPatterns(startCounter) {
    const fields = [];
    let counter = startCounter;

    // Analyze visual patterns like repeated positioning, similar styling
    const visualPatterns = this.detectVisuallyRepeatedElements();
    
    visualPatterns.forEach(pattern => {
      if (pattern.elements.length >= 3 && pattern.confidence > 70) {
        const sampleData = pattern.elements
          .slice(0, 5)
          .map(el => this.extractElementValue(el, pattern.type))
          .filter(val => val);

        if (sampleData.length > 0) {
          fields.push({
            id: `visual_${pattern.type}_${counter++}`,
            name: this.generateIntelligentName(pattern.type, sampleData),
            type: pattern.type,
            selectors: [pattern.selector],
            elements: pattern.elements.length,
            sampleData,
            confidence: Math.round(pattern.confidence),
            selected: pattern.confidence > 80
          });
        }
      }
    });

    return fields;
  }

  detectVisuallyRepeatedElements() {
    const patterns = [];
    const processedSelectors = new Set();

    // Look for elements with similar visual properties
    const allElements = document.querySelectorAll('*');
    const elementGroups = new Map();

    allElements.forEach(el => {
      if (el.children.length === 0 && el.textContent.trim().length > 0) {
        const style = window.getComputedStyle(el);
        const key = `${style.fontSize}_${style.fontWeight}_${style.color}_${el.tagName}`;
        
        if (!elementGroups.has(key)) {
          elementGroups.set(key, []);
        }
        elementGroups.get(key).push(el);
      }
    });

    // Analyze groups for patterns
    elementGroups.forEach((elements, styleKey) => {
      if (elements.length >= 3) {
        const type = this.inferTypeFromContent(elements);
        const selector = this.generateOptimalSelector(elements);
        
        if (!processedSelectors.has(selector)) {
          processedSelectors.add(selector);
          
          patterns.push({
            type,
            elements,
            selector,
            confidence: this.calculateVisualConfidence(elements, type)
          });
        }
      }
    });

    return patterns;
  }

  analyzeTableStructure(table, tableIndex, startCounter) {
    const fields = [];
    let counter = startCounter;

    const headers = table.querySelectorAll('th');
    const rows = table.querySelectorAll('tbody tr, tr:not(:first-child)');

    if (headers.length > 0 && rows.length > 0) {
      headers.forEach((header, colIndex) => {
        const headerText = header.textContent.trim();
        if (headerText) {
          const columnData = Array.from(rows)
            .map(row => row.cells[colIndex]?.textContent?.trim())
            .filter(text => text);

          if (columnData.length > 0) {
            const type = this.inferTypeFromContent(columnData);
            const confidence = this.calculateTableColumnConfidence(columnData, type);

            fields.push({
              id: `table_${tableIndex}_col_${colIndex}_${counter++}`,
              name: headerText,
              type: type,
              selectors: [`table:nth-of-type(${tableIndex + 1}) td:nth-child(${colIndex + 1})`],
              elements: columnData.length,
              sampleData: columnData.slice(0, 5),
              confidence: Math.round(confidence),
              selected: confidence > 80
            });
          }
        }
      });
    }

    return fields;
  }

  extractValuesFromContainers(containers, selector, type) {
    const values = [];
    
    containers.forEach(container => {
      const elements = container.querySelectorAll(selector);
      elements.forEach(element => {
        const value = this.extractElementValue(element, type);
        if (value) {
          values.push(value);
        }
      });
    });

    return values.filter(v => v.length > 0);
  }

  extractElementValue(element, type) {
    switch (type) {
      case 'images':
        return element.src || element.getAttribute('data-src') || element.alt || '';
      case 'links':
        return element.href || element.textContent.trim();
      case 'dates':
        return element.getAttribute('datetime') || element.textContent.trim();
      default:
        return element.textContent.trim();
    }
  }

  calculateMLConfidence(foundElements, totalContainers, contentType, containerSelector) {
    const coverage = foundElements / totalContainers;
    const baseScore = coverage * 100;
    
    // Type-specific confidence boosts
    const typeBoosts = {
      'titles': 15,
      'prices': 20,
      'descriptions': 10,
      'images': 8,
      'links': 5,
      'dates': 12,
      'locations': 10
    };
    
    // Container-specific boosts
    const containerBoosts = {
      'country': 15,
      'product': 12,
      'item': 10,
      'card': 8,
      'article': 10
    };

    let boost = typeBoosts[contentType] || 0;
    Object.keys(containerBoosts).forEach(key => {
      if (containerSelector.includes(key)) {
        boost += containerBoosts[key];
      }
    });

    return Math.min(95, Math.max(60, baseScore + boost));
  }

  calculateVisualConfidence(elements, type) {
    const consistencyScore = this.calculateVisualConsistency(elements);
    const contentScore = this.calculateContentQuality(elements, type);
    
    return (consistencyScore + contentScore) / 2;
  }

  calculateVisualConsistency(elements) {
    if (elements.length < 2) return 50;
    
    const positions = elements.map(el => {
      const rect = el.getBoundingClientRect();
      return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
    });

    // Calculate position variance
    const avgX = positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length;
    const avgY = positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length;
    
    const variance = positions.reduce((sum, pos) => {
      return sum + Math.pow(pos.x - avgX, 2) + Math.pow(pos.y - avgY, 2);
    }, 0) / positions.length;

    // Lower variance = higher consistency
    return Math.max(50, 100 - Math.sqrt(variance) / 10);
  }

  calculateContentQuality(elements, type) {
    const texts = elements.map(el => el.textContent.trim()).filter(t => t);
    if (texts.length === 0) return 0;

    const avgLength = texts.reduce((sum, text) => sum + text.length, 0) / texts.length;
    const lengthVariance = texts.reduce((sum, text) => sum + Math.pow(text.length - avgLength, 2), 0) / texts.length;
    
    // Type-specific quality scoring
    const typeQualityChecks = {
      'prices': (text) => /[\$€£\d.,]+/.test(text),
      'dates': (text) => /\d/.test(text),
      'emails': (text) => /@/.test(text),
      'phones': (text) => /[\d\-\(\)\s+]/.test(text)
    };

    let qualityScore = 70;
    
    if (typeQualityChecks[type]) {
      const validCount = texts.filter(typeQualityChecks[type]).length;
      qualityScore = (validCount / texts.length) * 100;
    }

    // Penalize high length variance (inconsistent content)
    const consistencyPenalty = Math.min(20, Math.sqrt(lengthVariance) / 5);
    
    return Math.max(50, qualityScore - consistencyPenalty);
  }

  calculateTableColumnConfidence(columnData, type) {
    const nonEmptyData = columnData.filter(data => data && data.length > 0);
    const fillRate = nonEmptyData.length / columnData.length;
    
    let typeScore = 70;
    if (type === 'prices' && nonEmptyData.some(data => /[\$€£\d.,]+/.test(data))) {
      typeScore = 90;
    } else if (type === 'dates' && nonEmptyData.some(data => /\d{1,4}[\/\-\.]\d{1,4}/.test(data))) {
      typeScore = 85;
    } else if (type === 'emails' && nonEmptyData.some(data => /@/.test(data))) {
      typeScore = 95;
    }

    return fillRate * typeScore;
  }

  inferTypeFromContent(elements) {
    const sampleTexts = Array.isArray(elements) 
      ? elements.slice(0, 5).map(el => typeof el === 'string' ? el : el.textContent.trim())
      : [elements];

    const combinedText = sampleTexts.join(' ').toLowerCase();

    // Semantic type inference
    if (/\$|€|£|price|cost|amount/.test(combinedText)) return 'prices';
    if (/@/.test(combinedText)) return 'emails';
    if (/\d{3}[\-\s]?\d{3}[\-\s]?\d{4}/.test(combinedText)) return 'phones';
    if (/\d{1,4}[\/\-\.]\d{1,4}/.test(combinedText)) return 'dates';
    if (/address|location|street|city/.test(combinedText)) return 'locations';
    if (combinedText.length > 100) return 'descriptions';
    if (combinedText.length < 30) return 'titles';
    
    return 'text';
  }

  generateOptimalSelector(elements) {
    // Generate the most specific yet stable selector
    const element = elements[0];
    const tagName = element.tagName.toLowerCase();
    
    // Try class-based selector first
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        return `${tagName}.${classes[0]}`;
      }
    }
    
    // Try attribute-based selector
    const attributes = ['data-id', 'id', 'name', 'data-field'];
    for (const attr of attributes) {
      if (element.hasAttribute(attr)) {
        return `${tagName}[${attr}="${element.getAttribute(attr)}"]`;
      }
    }
    
    // Fallback to tag name
    return tagName;
  }

  generateIntelligentName(type, sampleData) {
    const typeNames = {
      'titles': 'Titles',
      'prices': 'Prices',
      'descriptions': 'Descriptions',
      'images': 'Images',
      'links': 'Links',
      'dates': 'Dates',
      'locations': 'Locations',
      'emails': 'Email Addresses',
      'phones': 'Phone Numbers',
      'text': 'Text Content'
    };

    // Try to infer more specific names from sample data
    if (sampleData.length > 0) {
      const sample = sampleData[0].toLowerCase();
      
      if (type === 'titles') {
        if (sample.includes('country')) return 'Country Names';
        if (sample.includes('product')) return 'Product Names';
        if (sample.includes('company')) return 'Company Names';
      }
      
      if (type === 'prices') {
        if (sample.includes('$')) return 'USD Prices';
        if (sample.includes('€')) return 'EUR Prices';
        if (sample.includes('£')) return 'GBP Prices';
      }
      
      if (type === 'descriptions' && sampleData[0].length > 200) {
        return 'Long Descriptions';
      }
    }

    return typeNames[type] || `${type.charAt(0).toUpperCase()}${type.slice(1)}`;
  }

  optimizeDetectedFields(fields) {
    // Remove duplicates and low-quality fields
    const fieldMap = new Map();
    
    fields.forEach(field => {
      const key = `${field.type}_${field.name}`;
      const existing = fieldMap.get(key);
      
      if (!existing || field.confidence > existing.confidence) {
        fieldMap.set(key, field);
      }
    });

    // Sort by confidence and limit results
    return Array.from(fieldMap.values())
      .filter(field => field.confidence >= 70) // Only high-confidence fields
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 25); // Limit to top 25 fields
  }

  generateCacheKey(url) {
    // Generate a cache key based on URL and page structure
    const elementCount = document.querySelectorAll('*').length;
    const textLength = document.body.textContent.length;
    return `${url}_${elementCount}_${textLength}`;
  }

  // Public API for extension communication
  async detectFields() {
    return await this.performIntelligentDetection();
  }

  async scrapeSelectedFields(selectedFields) {
    const results = [];
    
    try {
      // Use the most sophisticated extraction method available
      const extractionMethod = this.determineOptimalExtractionMethod(selectedFields);
      
      switch (extractionMethod) {
        case 'container-based':
          return this.extractFromContainerPattern(selectedFields);
        case 'table-based':
          return this.extractFromTablePattern(selectedFields);
        case 'semantic-based':
          return this.extractFromSemanticPattern(selectedFields);
        default:
          return this.extractIndividually(selectedFields);
      }
    } catch (error) {
      console.error('Scraping error:', error);
      return [];
    }
  }

  determineOptimalExtractionMethod(selectedFields) {
    // Analyze the structure to determine the best extraction approach
    const hasContainerFields = selectedFields.some(f => f.selectors[0].includes(' '));
    const hasSemanticFields = selectedFields.some(f => f.selectors[0].startsWith('semantic:'));
    const hasTableFields = selectedFields.some(f => f.selectors[0].includes('table'));
    
    if (hasContainerFields) return 'container-based';
    if (hasTableFields) return 'table-based';
    if (hasSemanticFields) return 'semantic-based';
    
    return 'individual';
  }

  extractFromContainerPattern(selectedFields) {
    // Find the most common container pattern
    const containerSelectors = new Set();
    selectedFields.forEach(field => {
      const selector = field.selectors[0];
      if (selector.includes(' ')) {
        const containerPart = selector.split(' ')[0];
        containerSelectors.add(containerPart);
      }
    });

    const mostCommonContainer = Array.from(containerSelectors)[0];
    if (!mostCommonContainer) return this.extractIndividually(selectedFields);

    const containers = document.querySelectorAll(mostCommonContainer);
    const results = [];

    containers.forEach(container => {
      const record = {};
      
      selectedFields.forEach(field => {
        const selector = field.selectors[0].replace(mostCommonContainer + ' ', '');
        const elements = container.querySelectorAll(selector);
        
        if (elements.length > 0) {
          const values = Array.from(elements).map(el => 
            this.extractElementValue(el, field.type)
          ).filter(val => val);
          
          if (values.length > 0) {
            record[field.name] = values.length === 1 ? values[0] : values;
          }
        }
      });

      if (Object.keys(record).length > 0) {
        results.push(record);
      }
    });

    return results;
  }

  extractFromTablePattern(selectedFields) {
    const results = [];
    const tables = document.querySelectorAll('table');
    
    tables.forEach(table => {
      const rows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
      
      rows.forEach(row => {
        const record = {};
        
        selectedFields.forEach(field => {
          if (field.selectors[0].includes('table')) {
            // Extract table column index from selector
            const match = field.selectors[0].match(/nth-child\((\d+)\)/);
            if (match) {
              const colIndex = parseInt(match[1]) - 1;
              const cell = row.cells[colIndex];
              if (cell) {
                record[field.name] = cell.textContent.trim();
              }
            }
          }
        });

        if (Object.keys(record).length > 0) {
          results.push(record);
        }
      });
    });

    return results;
  }

  extractFromSemanticPattern(selectedFields) {
    const results = [];
    const pageText = document.body.textContent;
    
    const record = {};
    selectedFields.forEach(field => {
      if (field.selectors[0].startsWith('semantic:')) {
        const type = field.selectors[0].replace('semantic:', '');
        const patterns = this.semanticPatterns[type]?.patterns || [];
        
        const matches = new Set();
        patterns.forEach(pattern => {
          const found = pageText.match(pattern);
          if (found) {
            found.forEach(match => matches.add(match.trim()));
          }
        });

        if (matches.size > 0) {
          record[field.name] = Array.from(matches);
        }
      }
    });

    if (Object.keys(record).length > 0) {
      results.push(record);
    }

    return results;
  }

  extractIndividually(selectedFields) {
    const fieldData = {};
    let maxLength = 0;

    selectedFields.forEach(field => {
      const values = [];
      
      field.selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        Array.from(elements).forEach(element => {
          const value = this.extractElementValue(element, field.type);
          if (value) {
            values.push(value);
          }
        });
      });

      fieldData[field.name] = values;
      maxLength = Math.max(maxLength, values.length);
    });

    const results = [];
    for (let i = 0; i < maxLength; i++) {
      const record = {};
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

  getPageInfo() {
    return {
      url: window.location.href,
      title: document.title,
      domain: window.location.hostname,
      description: document.querySelector('meta[name="description"]')?.content || 
                   document.querySelector('meta[property="og:description"]')?.content ||
                   'AI-powered content extraction'
    };
  }
}

// Initialize the ML field detector
const mlDetector = new MLFieldDetector();

// Enhanced message handling with AI capabilities
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      switch (request.action) {
        case 'detectFields':
          const fields = await mlDetector.detectFields();
          sendResponse({ success: true, fields });
          break;
          
        case 'scrapeFields':
          const scrapedData = await mlDetector.scrapeSelectedFields(request.fields);
          sendResponse({ success: true, data: scrapedData });
          break;
          
        case 'getPageInfo':
          const pageInfo = mlDetector.getPageInfo();
          sendResponse({ success: true, ...pageInfo });
          break;
          
        case 'reAnalyze':
          // Force re-analysis by clearing cache
          mlDetector.analysisCache.clear();
          const newFields = await mlDetector.detectFields();
          sendResponse({ success: true, fields: newFields });
          break;
          
        default:
          sendResponse({ success: false, error: `Unknown action: ${request.action}` });
      }
    } catch (error) {
      console.error('Content script error:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();
  
  return true; // Keep message channel open for async response
});

// Proactive field detection on page load
console.log('🚀 WebScraper Pro ML Content Script loaded');