import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebScraper } from "./scraper";
import { MLWebScraper } from "./ml-scraper";
import { z } from "zod";
import { detectedFieldSchema } from "@shared/schema";

const scraper = new WebScraper();
const mlScraper = new MLWebScraper();

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      version: "2.0.0-ml",
      features: ["ml-analysis", "semantic-detection", "pattern-learning"]
    });
  });

  // Enhanced ML-powered analysis endpoint
  app.post("/api/analyze", async (req, res) => {
    try {
      const { url, options = {} } = req.body;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL is required' });
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
      }

      // Use ML scraper with advanced options
      const mlOptions = {
        useNLP: options.useNLP !== false,
        enablePatternLearning: options.enablePatternLearning !== false,
        semanticAnalysis: options.semanticAnalysis !== false,
        confidenceThreshold: options.confidenceThreshold || 0.7
      };

      try {
        const result = await mlScraper.analyzePageWithML(url, mlOptions);
        res.json({
          ...result,
          metadata: {
            analysisType: "ml-powered",
            processingTime: Date.now(),
            featuresUsed: Object.keys(mlOptions).filter(key => mlOptions[key as keyof typeof mlOptions])
          }
        });
      } catch (mlError) {
        console.warn("ML Analysis failed, using fallback:", mlError);
        // Fallback to basic scraper
        const fallbackResult = await scraper.analyzePage(url);
        res.json({
          ...fallbackResult,
          metadata: {
            analysisType: "fallback",
            processingTime: Date.now(),
            note: "Used fallback scraper due to ML analysis failure"
          }
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ 
        error: 'Failed to analyze page',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Enhanced ML-powered scraping endpoint
  app.post("/api/scrape", async (req, res) => {
    try {
      const { url, selectedFields, useML = true } = req.body;
      
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

      let scrapedData;
      let processingMethod = "standard";

      if (useML) {
        try {
          scrapedData = await mlScraper.scrapeWithML(url, validatedFields);
          processingMethod = "ml-powered";
        } catch (mlError) {
          console.warn("ML scraping failed, using fallback:", mlError);
          scrapedData = await scraper.scrapePage(url, validatedFields);
          processingMethod = "fallback";
        }
      } else {
        scrapedData = await scraper.scrapePage(url, validatedFields);
      }

      // Log activity
      await storage.logActivity('scrape_completed', url);

      res.json({
        success: true,
        data: scrapedData,
        count: scrapedData.length,
        metadata: {
          processingMethod,
          itemCount: scrapedData.length,
          fieldsExtracted: validatedFields.length,
          timestamp: new Date().toISOString()
        }
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

  // Template management endpoints
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getTemplates();
      res.json({ templates });
    } catch (error) {
      console.error("Template retrieval error:", error);
      res.status(500).json({ error: "Failed to retrieve templates" });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const template = req.body;
      const savedTemplate = await storage.saveTemplate(template);
      res.json({ template: savedTemplate });
    } catch (error) {
      console.error("Template save error:", error);
      res.status(500).json({ error: "Failed to save template" });
    }
  });

  app.delete("/api/templates/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTemplate(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Template deletion error:", error);
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  // Analytics endpoint
  app.get("/api/analytics", async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ error: "Failed to retrieve analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
