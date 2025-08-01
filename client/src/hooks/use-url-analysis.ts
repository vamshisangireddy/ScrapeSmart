import { useState, useCallback } from 'react';
import type { DetectedField, PageInfo } from '@shared/schema';

// Generate mock fields based on URL patterns
const generateMockFieldsForUrl = (url: string): DetectedField[] => {
  const domain = new URL(url).hostname;
  const pathname = new URL(url).pathname;
  
  // Specific handling for scrapethissite.com
  if (domain.includes('scrapethissite.com') && pathname.includes('simple')) {
    return [
      {
        id: 'field_country_name_1',
        name: 'Country Name',
        type: 'title',
        selectors: ['h3', '.country-name', '.name'],
        elements: 250,
        sampleData: ['Andorra', 'United Arab Emirates', 'Afghanistan', 'Antigua and Barbuda', 'Anguilla'],
        confidence: 98,
        selected: true
      },
      {
        id: 'field_capital_2',
        name: 'Capital City',
        type: 'capital',
        selectors: ['.capital', '.country-capital', 'span.capital'],
        elements: 250,
        sampleData: ['Andorra la Vella', 'Abu Dhabi', 'Kabul', "St. John's", 'The Valley'],
        confidence: 96,
        selected: true
      },
      {
        id: 'field_population_3',
        name: 'Population',
        type: 'population',
        selectors: ['.population', '.country-population', 'span.population'],
        elements: 250,
        sampleData: ['84000', '4975593', '29121286', '86754', '13254'],
        confidence: 95,
        selected: true
      },
      {
        id: 'field_area_4',
        name: 'Area (km²)',
        type: 'area',
        selectors: ['.area', '.country-area', 'span.area'],
        elements: 250,
        sampleData: ['468.0', '82880.0', '647500.0', '443.0', '102.0'],
        confidence: 94,
        selected: true
      }
    ];
  }
  
  // Different field patterns based on URL content
  const getFieldsForType = () => {
    if (pathname.includes('product') || pathname.includes('shop') || pathname.includes('store')) {
      return [
        {
          id: 'field_title_1',
          name: 'Product Title',
          type: 'title',
          selectors: ['h1', '.product-title', '.title'],
          elements: 15,
          sampleData: ['Premium Wireless Headphones', 'Smartwatch Pro Series', 'Gaming Laptop 15-inch'],
          confidence: 95,
          selected: true
        },
        {
          id: 'field_price_2',
          name: 'Price',
          type: 'price',
          selectors: ['.price', '.cost', '[data-price]'],
          elements: 15,
          sampleData: ['$299.99', '$449.00', '$1,299.99'],
          confidence: 98,
          selected: true
        },
        {
          id: 'field_rating_3',
          name: 'Customer Rating',
          type: 'rating',
          selectors: ['.rating', '.stars', '[data-rating]'],
          elements: 13,
          sampleData: ['4.8/5', '4.2/5', '4.9/5'],
          confidence: 87,
          selected: true
        },
        {
          id: 'field_availability_4',
          name: 'Stock Status',
          type: 'availability',
          selectors: ['.stock', '.availability', '.in-stock'],
          elements: 15,
          sampleData: ['In Stock', 'Limited', 'In Stock'],
          confidence: 82,
          selected: false
        }
      ];
    } else if (pathname.includes('news') || pathname.includes('article') || pathname.includes('blog')) {
      return [
        {
          id: 'field_headline_1',
          name: 'Article Headline',
          type: 'title',
          selectors: ['h1', '.headline', '.article-title'],
          elements: 20,
          sampleData: ['Breaking: Tech Innovation Reaches New Heights', 'Market Analysis: Q4 Growth Trends', 'Latest in AI Development'],
          confidence: 96,
          selected: true
        },
        {
          id: 'field_author_2',
          name: 'Author',
          type: 'author',
          selectors: ['.author', '.byline', '[data-author]'],
          elements: 20,
          sampleData: ['John Smith', 'Sarah Johnson', 'Mike Chen'],
          confidence: 89,
          selected: true
        },
        {
          id: 'field_date_3',
          name: 'Publication Date',
          type: 'date',
          selectors: ['.date', '.published', 'time'],
          elements: 20,
          sampleData: ['2024-01-27', '2024-01-26', '2024-01-25'],
          confidence: 94,
          selected: true
        },
        {
          id: 'field_summary_4',
          name: 'Article Summary',
          type: 'description',
          selectors: ['.summary', '.excerpt', '.description'],
          elements: 18,
          sampleData: ['Key insights into the latest market developments...', 'Technology sector shows promising growth...', 'Analysis of current industry trends...'],
          confidence: 78,
          selected: false
        }
      ];
    } else if (pathname.includes('job') || pathname.includes('career') || pathname.includes('hiring')) {
      return [
        {
          id: 'field_job_title_1',
          name: 'Job Title',
          type: 'title',
          selectors: ['h1', '.job-title', '.position'],
          elements: 25,
          sampleData: ['Senior Frontend Developer', 'Product Manager', 'Data Scientist'],
          confidence: 97,
          selected: true
        },
        {
          id: 'field_company_2',
          name: 'Company',
          type: 'company',
          selectors: ['.company', '.employer', '[data-company]'],
          elements: 25,
          sampleData: ['TechCorp Inc.', 'InnovateLab', 'DataSolutions LLC'],
          confidence: 93,
          selected: true
        },
        {
          id: 'field_location_3',
          name: 'Location',
          type: 'location',
          selectors: ['.location', '.city', '[data-location]'],
          elements: 25,
          sampleData: ['San Francisco, CA', 'New York, NY', 'Remote'],
          confidence: 91,
          selected: true
        },
        {
          id: 'field_salary_4',
          name: 'Salary Range',
          type: 'salary',
          selectors: ['.salary', '.compensation', '.pay'],
          elements: 18,
          sampleData: ['$120k - $160k', '$90k - $130k', '$150k - $200k'],
          confidence: 76,
          selected: false
        }
      ];
    } else {
      // Generic webpage fields
      return [
        {
          id: 'field_heading_1',
          name: 'Main Headings',
          type: 'title',
          selectors: ['h1', 'h2', '.heading'],
          elements: 12,
          sampleData: ['Welcome to Our Website', 'About Our Services', 'Contact Information'],
          confidence: 88,
          selected: true
        },
        {
          id: 'field_links_2',
          name: 'Navigation Links',
          type: 'link',
          selectors: ['nav a', '.menu a', '.navigation a'],
          elements: 18,
          sampleData: ['/about', '/services', '/contact'],
          confidence: 85,
          selected: true
        },
        {
          id: 'field_content_3',
          name: 'Text Content',
          type: 'description',
          selectors: ['p', '.content', '.text'],
          elements: 25,
          sampleData: ['Lorem ipsum dolor sit amet...', 'Our company provides...', 'Contact us for more information...'],
          confidence: 72,
          selected: false
        }
      ];
    }
  };

  return getFieldsForType();
};

export function useUrlAnalysis() {
  const [currentUrl, setCurrentUrl] = useState('https://www.scrapethissite.com/pages/simple/');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pageInfo, setPageInfo] = useState<PageInfo>({
    url: 'https://www.scrapethissite.com/pages/simple/',
    title: 'Countries of the World - Scrape This Site',
    domain: 'scrapethissite.com',
    description: 'A simple example page listing information about all countries in the world (250 items)',
    type: 'directory'
  });
  const [detectedFields, setDetectedFields] = useState<DetectedField[]>(() => 
    generateMockFieldsForUrl('https://www.scrapethissite.com/pages/simple/')
  );

  const analyzeUrl = useCallback(async (url: string) => {
    setIsAnalyzing(true);
    setCurrentUrl(url);
    
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const pathname = urlObj.pathname;
      
      // Generate appropriate title based on URL
      let title = 'Website Analysis Results';
      let description = `Intelligent analysis of ${domain} page structure and content.`;
      let type = 'general';
      
      if (domain.includes('scrapethissite.com') && pathname.includes('simple')) {
        title = 'Countries of the World - Scrape This Site';
        description = 'A simple example page listing information about all countries in the world (250 items)';
        type = 'directory';
      } else if (pathname.includes('product') || pathname.includes('shop')) {
        title = `${domain} - Product Catalog`;
        type = 'ecommerce';
      } else if (pathname.includes('news') || pathname.includes('article')) {
        title = `${domain} - News & Articles`;
        type = 'news';
      } else if (pathname.includes('job') || pathname.includes('career')) {
        title = `${domain} - Career Opportunities`;
        type = 'jobs';
      } else {
        title = `${domain} - Website Content`;
      }
      
      const newPageInfo: PageInfo = {
        url,
        title,
        domain,
        description,
        type
      };
      
      const newFields = generateMockFieldsForUrl(url);
      
      setPageInfo(newPageInfo);
      setDetectedFields(newFields);
    } catch (error) {
      console.error('Failed to analyze URL:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const toggleField = useCallback((fieldId: string) => {
    setDetectedFields(prev => 
      prev.map(field => 
        field.id === fieldId 
          ? { ...field, selected: !field.selected }
          : field
      )
    );
  }, []);

  return {
    currentUrl,
    pageInfo,
    detectedFields,
    isAnalyzing,
    analyzeUrl,
    toggleField
  };
}