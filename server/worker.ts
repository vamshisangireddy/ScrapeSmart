import { Router } from 'itty-router';
import { WebScraper } from './scraper';
import { MLWebScraper } from './ml-scraper';
import { detectedFieldSchema } from '../shared/schema';

const router = Router();
const scraper = new WebScraper();
const mlScraper = new MLWebScraper();

router.get('/api/health', () => {
  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0-ml',
    features: ['ml-analysis', 'semantic-detection', 'pattern-learning'],
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

router.post('/api/analyze', async (request) => {
  const body = await request.json();
  const { url, options = {} } = body;
  if (!url || typeof url !== 'string') {
    return new Response(JSON.stringify({ error: 'URL is required' }), { status: 400 });
  }
  try {
    new URL(url);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid URL format' }), { status: 400 });
  }
  const mlOptions = {
    useNLP: options.useNLP !== false,
    enablePatternLearning: options.enablePatternLearning !== false,
    semanticAnalysis: options.semanticAnalysis !== false,
    confidenceThreshold: options.confidenceThreshold || 0.7,
  };
  try {
    const result = await mlScraper.analyzePageWithML(url, mlOptions);
    return new Response(JSON.stringify({ ...result, metadata: { analysisType: 'ml-powered', processingTime: Date.now(), featuresUsed: Object.keys(mlOptions).filter(key => mlOptions[key]) } }), { headers: { 'Content-Type': 'application/json' } });
  } catch (mlError) {
    const fallbackResult = await scraper.analyzePage(url);
    return new Response(JSON.stringify({ ...fallbackResult, metadata: { analysisType: 'fallback', processingTime: Date.now(), note: 'Used fallback scraper due to ML analysis failure' } }), { headers: { 'Content-Type': 'application/json' } });
  }
});

router.post('/api/scrape', async (request) => {
  const body = await request.json();
  const { url, selectedFields, useML = true } = body;
  if (!url || typeof url !== 'string') {
    return new Response(JSON.stringify({ error: 'URL is required' }), { status: 400 });
  }
  if (!selectedFields || !Array.isArray(selectedFields)) {
    return new Response(JSON.stringify({ error: 'Selected fields are required' }), { status: 400 });
  }
  try {
    new URL(url);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid URL format' }), { status: 400 });
  }
  const validatedFields = selectedFields.map(field => detectedFieldSchema.parse(field));
  let scrapedData;
  let processingMethod = 'standard';
  if (useML) {
    try {
      scrapedData = await mlScraper.scrapeWithML(url, validatedFields);
      processingMethod = 'ml-powered';
    } catch (mlError) {
      scrapedData = await scraper.scrapePage(url, validatedFields);
      processingMethod = 'fallback';
    }
  } else {
    scrapedData = await scraper.scrapePage(url, validatedFields);
  }
  return new Response(JSON.stringify({ success: true, data: scrapedData, count: scrapedData.length, metadata: { processingMethod, itemCount: scrapedData.length, fieldsExtracted: validatedFields.length, timestamp: new Date().toISOString() } }), { headers: { 'Content-Type': 'application/json' } });
});

// Add other endpoints as needed (export, templates, analytics)

export default {
  fetch: router.handle,
};
