// Content script for DOM analysis and field detection
(function() {
  'use strict';

  class FieldDetector {
    constructor() {
      this.detectedFields = [];
      this.commonSelectors = {
        title: ['h1', '.title', '.product-title', '.product-name', '[data-title]', '.name'],
        price: ['.price', '.cost', '.amount', '[data-price]', '.money', '.currency'],
        description: ['.description', '.details', '.product-description', '.summary', 'p'],
        image: ['img', '.image', '.product-image', '.photo', '.picture'],
        rating: ['.rating', '.stars', '.score', '[data-rating]', '.review-score'],
        link: ['a[href]', '.link', '.product-link'],
        category: ['.category', '.tag', '.genre', '.type'],
        brand: ['.brand', '.manufacturer', '.company'],
        availability: ['.stock', '.availability', '.in-stock', '.out-of-stock'],
        sku: ['.sku', '.product-id', '.item-id', '[data-sku]']
      };
    }

    detectFields() {
      this.detectedFields = [];
      
      for (const [fieldType, selectors] of Object.entries(this.commonSelectors)) {
        const elements = this.findElementsBySelectors(selectors);
        if (elements.length > 0) {
          this.detectedFields.push({
            id: `field_${fieldType}_${Date.now()}`,
            name: this.formatFieldName(fieldType),
            type: fieldType,
            selectors: this.getUniqueSelectors(elements),
            elements: elements.length,
            sampleData: this.extractSampleData(elements.slice(0, 3)),
            confidence: this.calculateConfidence(fieldType, elements)
          });
        }
      }

      // Detect tables
      this.detectTableData();
      
      // Detect lists
      this.detectListData();

      return this.detectedFields.sort((a, b) => b.confidence - a.confidence);
    }

    findElementsBySelectors(selectors) {
      const elements = [];
      const seen = new Set();

      for (const selector of selectors) {
        try {
          const found = document.querySelectorAll(selector);
          found.forEach(el => {
            if (!seen.has(el) && this.isValidElement(el)) {
              seen.add(el);
              elements.push(el);
            }
          });
        } catch (e) {
          console.warn('Invalid selector:', selector);
        }
      }

      return elements;
    }

    isValidElement(element) {
      // Filter out hidden elements, scripts, styles, etc.
      if (!element || element.offsetParent === null) return false;
      if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK'].includes(element.tagName)) return false;
      
      const text = element.textContent?.trim();
      if (!text || text.length < 2) return false;
      
      return true;
    }

    getUniqueSelectors(elements) {
      const selectors = new Set();
      
      elements.forEach(el => {
        // Try to generate unique selectors
        if (el.id) selectors.add(`#${el.id}`);
        if (el.className) {
          const classes = el.className.split(' ').filter(c => c.trim());
          if (classes.length > 0) {
            selectors.add(`.${classes.join('.')}`);
          }
        }
        selectors.add(el.tagName.toLowerCase());
      });

      return Array.from(selectors).slice(0, 3);
    }

    extractSampleData(elements) {
      return elements.map(el => {
        let text = el.textContent?.trim() || '';
        if (el.tagName === 'IMG') {
          text = el.src || el.alt || '';
        } else if (el.tagName === 'A') {
          text = el.href || el.textContent?.trim() || '';
        }
        return text.length > 100 ? text.substring(0, 100) + '...' : text;
      });
    }

    calculateConfidence(fieldType, elements) {
      let confidence = Math.min(elements.length * 10, 100);
      
      // Boost confidence based on common patterns
      const hasGoodSelectors = elements.some(el => 
        el.className?.toLowerCase().includes(fieldType) ||
        el.id?.toLowerCase().includes(fieldType)
      );
      
      if (hasGoodSelectors) confidence += 20;
      if (elements.length > 5) confidence += 10;
      
      return Math.min(confidence, 100);
    }

    detectTableData() {
      const tables = document.querySelectorAll('table');
      
      tables.forEach((table, index) => {
        const rows = table.querySelectorAll('tr');
        if (rows.length > 1) {
          const headers = this.extractTableHeaders(table);
          const data = this.extractTableData(table);
          
          if (headers.length > 0 && data.length > 0) {
            this.detectedFields.push({
              id: `table_${index}_${Date.now()}`,
              name: `Table ${index + 1}`,
              type: 'table',
              selectors: [`table:nth-of-type(${index + 1})`],
              elements: rows.length - 1,
              sampleData: data.slice(0, 3),
              headers: headers,
              confidence: 85
            });
          }
        }
      });
    }

    extractTableHeaders(table) {
      const headerRow = table.querySelector('thead tr, tr:first-child');
      if (!headerRow) return [];
      
      return Array.from(headerRow.querySelectorAll('th, td')).map(cell => 
        cell.textContent?.trim() || ''
      );
    }

    extractTableData(table) {
      const rows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
      return Array.from(rows).slice(0, 5).map(row => 
        Array.from(row.querySelectorAll('td, th')).map(cell => 
          cell.textContent?.trim() || ''
        )
      );
    }

    detectListData() {
      const lists = document.querySelectorAll('ul, ol');
      
      lists.forEach((list, index) => {
        const items = list.querySelectorAll('li');
        if (items.length > 2) {
          const sampleData = Array.from(items).slice(0, 5).map(item => 
            item.textContent?.trim() || ''
          );
          
          this.detectedFields.push({
            id: `list_${index}_${Date.now()}`,
            name: `List ${index + 1}`,
            type: 'list',
            selectors: [`${list.tagName.toLowerCase()}:nth-of-type(${index + 1}) li`],
            elements: items.length,
            sampleData: sampleData,
            confidence: 70
          });
        }
      });
    }

    formatFieldName(fieldType) {
      return fieldType.charAt(0).toUpperCase() + fieldType.slice(1).replace(/([A-Z])/g, ' $1');
    }

    scrapeSelectedFields(selectedFields) {
      const results = [];
      
      selectedFields.forEach(field => {
        const elements = this.findElementsBySelectors(field.selectors);
        const data = elements.map(el => this.extractElementData(el, field.type));
        
        results.push({
          field: field.name,
          type: field.type,
          data: data
        });
      });
      
      return results;
    }

    extractElementData(element, type) {
      switch (type) {
        case 'image':
          return element.src || element.getAttribute('data-src') || '';
        case 'link':
          return element.href || '';
        case 'price':
          const text = element.textContent || '';
          const priceMatch = text.match(/[\$€£¥]?[\d,]+\.?\d*/);
          return priceMatch ? priceMatch[0] : text.trim();
        default:
          return element.textContent?.trim() || '';
      }
    }
  }

  // Initialize field detector
  const detector = new FieldDetector();

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
      case 'detectFields':
        const fields = detector.detectFields();
        sendResponse({ success: true, fields });
        break;
        
      case 'scrapeFields':
        const scrapedData = detector.scrapeSelectedFields(request.fields);
        sendResponse({ success: true, data: scrapedData });
        break;
        
      case 'getPageInfo':
        sendResponse({
          success: true,
          url: window.location.href,
          title: document.title,
          domain: window.location.hostname
        });
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
    
    return true; // Keep message channel open for async response
  });

  // Auto-detect fields when content script loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => detector.detectFields(), 1000);
    });
  } else {
    setTimeout(() => detector.detectFields(), 1000);
  }
})();
