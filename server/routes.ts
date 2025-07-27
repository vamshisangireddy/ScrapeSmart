import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebScraper } from "./scraper";
import { z } from "zod";
import { detectedFieldSchema } from "@shared/schema";

const scraper = new WebScraper();

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Analyze a webpage and detect fields
  app.post("/api/analyze", async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL is required' });
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
      }

      const result = await scraper.analyzePage(url);
      res.json(result);
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ 
        error: 'Failed to analyze page',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Scrape data from a webpage
  app.post("/api/scrape", async (req, res) => {
    try {
      const { url, selectedFields } = req.body;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL is required' });
      }

      if (!selectedFields || !Array.isArray(selectedFields)) {
        return res.status(400).json({ error: 'Selected fields are required' });
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
      }

      // Validate selected fields
      const validatedFields = selectedFields.map(field => {
        try {
          return detectedFieldSchema.parse(field);
        } catch {
          throw new Error(`Invalid field structure: ${field.name || 'unknown'}`);
        }
      });

      const scrapedData = await scraper.scrapePage(url, validatedFields);
      res.json({
        success: true,
        data: scrapedData,
        count: scrapedData.length
      });
    } catch (error) {
      console.error('Scraping error:', error);
      res.status(500).json({ 
        error: 'Failed to scrape page',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Export scraped data in different formats
  app.post("/api/export", async (req, res) => {
    try {
      const { data, format, filename } = req.body;
      
      if (!data || !Array.isArray(data)) {
        return res.status(400).json({ error: 'Data is required' });
      }

      if (!format || !['csv', 'json', 'xml', 'excel'].includes(format)) {
        return res.status(400).json({ error: 'Valid format is required (csv, json, xml, excel)' });
      }

      const exportFilename = filename || `scraped_data_${Date.now()}`;
      
      switch (format) {
        case 'json':
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename="${exportFilename}.json"`);
          res.json(data);
          break;
          
        case 'csv':
          if (data.length === 0) {
            return res.status(400).json({ error: 'No data to export' });
          }
          
          const headers = Object.keys(data[0]);
          const csvContent = [
            headers.join(','),
            ...data.map(row => 
              headers.map(header => {
                const value = row[header] || '';
                const stringValue = Array.isArray(value) ? value.join('; ') : String(value);
                return `"${stringValue.replace(/"/g, '""')}"`;
              }).join(',')
            )
          ].join('\n');
          
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="${exportFilename}.csv"`);
          res.send(csvContent);
          break;
          
        case 'xml':
          const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<data>
${data.map((item, index) => `  <item id="${index + 1}">
${Object.entries(item).map(([key, value]) => {
  const stringValue = Array.isArray(value) ? value.join('; ') : String(value);
  return `    <${key}><![CDATA[${stringValue}]]></${key}>`;
}).join('\n')}
  </item>`).join('\n')}
</data>`;
          
          res.setHeader('Content-Type', 'application/xml');
          res.setHeader('Content-Disposition', `attachment; filename="${exportFilename}.xml"`);
          res.send(xmlContent);
          break;
          
        default:
          res.status(400).json({ error: 'Excel format not implemented yet' });
      }
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ 
        error: 'Failed to export data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
