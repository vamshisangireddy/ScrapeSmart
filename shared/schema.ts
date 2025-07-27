import { z } from "zod";

// Extension data models
export const detectedFieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  selectors: z.array(z.string()),
  elements: z.number(),
  sampleData: z.array(z.string()),
  confidence: z.number(),
  selected: z.boolean().default(true),
  headers: z.array(z.string()).optional()
});

export const scrapingTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  domain: z.string(),
  fields: z.array(detectedFieldSchema),
  exportFormat: z.enum(['csv', 'json', 'xml', 'excel']),
  options: z.object({
    includePagination: z.boolean().default(false),
    autoScroll: z.boolean().default(true),
    removeDuplicates: z.boolean().default(true),
    delay: z.number().default(1000)
  }),
  createdAt: z.string()
});

export const scrapedDataSchema = z.object({
  field: z.string(),
  type: z.string(),
  data: z.array(z.any())
});

export const exportOptionsSchema = z.object({
  format: z.enum(['csv', 'json', 'xml', 'excel']),
  filename: z.string(),
  includePagination: z.boolean().default(false),
  autoScroll: z.boolean().default(true),
  removeDuplicates: z.boolean().default(true),
  delay: z.number().default(1000)
});

export const pageInfoSchema = z.object({
  url: z.string(),
  title: z.string(),
  domain: z.string()
});

// Types
export type DetectedField = z.infer<typeof detectedFieldSchema>;
export type ScrapingTemplate = z.infer<typeof scrapingTemplateSchema>;
export type ScrapedData = z.infer<typeof scrapedDataSchema>;
export type ExportOptions = z.infer<typeof exportOptionsSchema>;
export type PageInfo = z.infer<typeof pageInfoSchema>;

// Extension storage interface
export interface ExtensionStorage {
  templates: ScrapingTemplate[];
  preferences: {
    defaultFormat: 'csv' | 'json' | 'xml' | 'excel';
    autoDetect: boolean;
    defaultDelay: number;
  };
  recentScrapes: {
    url: string;
    timestamp: string;
    fieldsCount: number;
  }[];
}
