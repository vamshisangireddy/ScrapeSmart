// Background script for Chrome extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('WebScraper Pro extension installed');
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'exportData':
      handleDataExport(request.data, request.format, request.filename);
      sendResponse({ success: true });
      break;
      
    case 'saveTemplate':
      saveScrapingTemplate(request.template);
      sendResponse({ success: true });
      break;
      
    case 'loadTemplates':
      loadScrapingTemplates().then(templates => {
        sendResponse({ success: true, templates });
      });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
  
  return true;
});

async function handleDataExport(data, format, filename) {
  let blob;
  let mimeType;
  
  try {
    switch (format) {
      case 'csv':
        const csvContent = convertToCSV(data);
        blob = new Blob([csvContent], { type: 'text/csv' });
        mimeType = 'text/csv';
        break;
        
      case 'json':
        const jsonContent = JSON.stringify(data, null, 2);
        blob = new Blob([jsonContent], { type: 'application/json' });
        mimeType = 'application/json';
        break;
        
      case 'xml':
        const xmlContent = convertToXML(data);
        blob = new Blob([xmlContent], { type: 'application/xml' });
        mimeType = 'application/xml';
        break;
        
      case 'excel':
        // For Excel, we'll create a simple XML format that Excel can read
        const excelContent = convertToExcelXML(data);
        blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
        mimeType = 'application/vnd.ms-excel';
        filename = filename.replace('.xlsx', '.xls');
        break;
        
      default:
        throw new Error('Unsupported format');
    }
    
    const url = URL.createObjectURL(blob);
    
    chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: true
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Download failed:', chrome.runtime.lastError);
      } else {
        console.log('Download started with ID:', downloadId);
        // Clean up the blob URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
    });
    
  } catch (error) {
    console.error('Export failed:', error);
  }
}

function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  // Get all unique headers
  const headers = new Set();
  data.forEach(row => {
    if (row.data && Array.isArray(row.data)) {
      row.data.forEach((_, index) => {
        headers.add(row.field + (row.data.length > 1 ? `_${index + 1}` : ''));
      });
    } else {
      headers.add(row.field);
    }
  });
  
  const headerArray = Array.from(headers);
  let csv = headerArray.map(h => `"${h}"`).join(',') + '\n';
  
  // Find the maximum number of rows
  const maxRows = Math.max(...data.map(field => 
    field.data ? field.data.length : 1
  ));
  
  // Create rows
  for (let i = 0; i < maxRows; i++) {
    const row = headerArray.map(header => {
      const field = data.find(f => header.startsWith(f.field));
      if (field && field.data && field.data[i] !== undefined) {
        return `"${String(field.data[i]).replace(/"/g, '""')}"`;
      }
      return '""';
    });
    csv += row.join(',') + '\n';
  }
  
  return csv;
}

function convertToXML(data) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<scrapeResults>\n';
  
  data.forEach((field, fieldIndex) => {
    xml += `  <field name="${escapeXML(field.field)}" type="${escapeXML(field.type)}">\n`;
    if (field.data && Array.isArray(field.data)) {
      field.data.forEach((item, itemIndex) => {
        xml += `    <item index="${itemIndex}">${escapeXML(String(item))}</item>\n`;
      });
    }
    xml += '  </field>\n';
  });
  
  xml += '</scrapeResults>';
  return xml;
}

function convertToExcelXML(data) {
  let xml = '<?xml version="1.0"?>\n';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
  xml += ' xmlns:o="urn:schemas-microsoft-com:office:office"\n';
  xml += ' xmlns:x="urn:schemas-microsoft-com:office:excel"\n';
  xml += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\n';
  xml += ' xmlns:html="http://www.w3.org/TR/REC-html40">\n';
  xml += '<Worksheet ss:Name="ScrapedData">\n<Table>\n';
  
  // Headers
  xml += '<Row>\n';
  data.forEach(field => {
    xml += `<Cell><Data ss:Type="String">${escapeXML(field.field)}</Data></Cell>\n`;
  });
  xml += '</Row>\n';
  
  // Find max rows
  const maxRows = Math.max(...data.map(field => 
    field.data ? field.data.length : 1
  ));
  
  // Data rows
  for (let i = 0; i < maxRows; i++) {
    xml += '<Row>\n';
    data.forEach(field => {
      const value = field.data && field.data[i] ? field.data[i] : '';
      xml += `<Cell><Data ss:Type="String">${escapeXML(String(value))}</Data></Cell>\n`;
    });
    xml += '</Row>\n';
  }
  
  xml += '</Table>\n</Worksheet>\n</Workbook>';
  return xml;
}

function escapeXML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function saveScrapingTemplate(template) {
  const templates = await loadScrapingTemplates();
  templates.push({
    ...template,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  });
  
  chrome.storage.local.set({ scrapingTemplates: templates });
}

async function loadScrapingTemplates() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['scrapingTemplates'], (result) => {
      resolve(result.scrapingTemplates || []);
    });
  });
}
