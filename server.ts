import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to instantiate server-side GoogleGenAI client with required User-Agent
function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('Warning: GEMINI_API_KEY is not defined in environment variables.');
  }
  return new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. Multi-turn Chat Endpoint
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const {
      message,
      history = [],
      role = 'cfo_advisor',
      model = 'gemini-3.8-flash',
      enableSearch = false,
      companyContext
    } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message parameter is required and must be a string' });
      return;
    }

    const ai = getGenAIClient();

    // Map model selection to valid @google/genai model names
    let selectedModel = 'gemini-3.8-flash';
    if (model === 'gemini-4-argon' || model === 'argon') {
      selectedModel = 'gemini-4-argon';
    } else if (model === 'gemini-3.1-flash-lite' || model === 'flash-lite' || model === 'lite') {
      selectedModel = 'gemini-3.1-flash-lite';
    } else {
      selectedModel = 'gemini-3.8-flash';
    }

    // Role-specific System Instructions
    let roleInstruction = '';
    switch (role) {
      case 'tax_auditor':
        roleInstruction = `You are a Senior Egyptian Tax and Audit Partner specializing in Egyptian Tax Law 91/2005, Law 206/2020 (Unified Tax Procedures), Egyptian Accounting Standards (EAS / معايير المحاسبة المصرية), ETA electronic invoicing requirements, and deferred tax calculation under EAS 24 / IAS 12. Provide rigorous, citation-backed advice with specific references to article numbers, decree dates, and formal tax treatment.`;
        break;
      case 'treasury_fx':
        roleInstruction = `You are an Executive Treasury Director and FX Specialist versed in Central Bank of Egypt (CBE) foreign currency regulations, EAS 13 / IAS 21 foreign exchange translation, working capital optimization, cash conversion cycles (CCC), interest expense hedging, and commercial bank financing terms in Egypt.`;
        break;
      case 'forensic_auditor':
        roleInstruction = `You are a Forensic Accounting and Internal Audit Lead inspecting trial balances, unclassified ledger accounts, unusual debit/credit variances, journal entry anomalies, and segregation-of-duties risks according to International Standards on Auditing (ISA) and Egyptian Auditing Standards.`;
        break;
      case 'cfo_advisor':
      default:
        roleInstruction = `You are the Chief Financial Officer (CFO) and Strategic Financial Advisor for Ledger IQ. You provide concise, high-impact executive guidance on corporate profitability, gross margins, EBITDA, working capital, leverage, EAS/IFRS compliance, and 5-year strategic planning. Distinguish clearly between empirical ledger data and strategic hypotheses.`;
        break;
    }

    const contextAddition = companyContext
      ? `\nActive Company Context:\nName: ${companyContext.name || 'Al-Ahram Industrial'}\nReporting Standard: ${companyContext.framework || 'EAS'}\nBase Currency: ${companyContext.currency || 'EGP'}\nScale: ${companyContext.scale || 'thousands'}\nMetrics: Net Profit: ${companyContext.netProfit || 'N/A'}, Gross Margin: ${companyContext.grossMargin || 'N/A'}, Cash: ${companyContext.cash || 'N/A'}`
      : '';

    const systemInstruction = `${roleInstruction}${contextAddition}\nProvide clear, highly structured responses in the requested language (Arabic or English). Use markdown tables, bold key metrics, and bulleted recommendations where appropriate.`;

    // Construct tools configuration if search is toggled
    const config: Record<string, unknown> = {
      systemInstruction,
    };

    if (enableSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    // Format previous messages for the model
    // @google/genai contents format: array of { role: 'user' | 'model', parts: [{ text: ... }] }
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history) && history.length > 0) {
      for (const item of history) {
        if (item && item.text && (item.role === 'user' || item.role === 'model')) {
          contents.push({
            role: item.role,
            parts: [{ text: String(item.text) }],
          });
        }
      }
    }

    // Append current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config,
    });

    const responseText = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    res.json({
      success: true,
      model: selectedModel,
      text: responseText,
      groundingChunks,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/chat:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while processing Gemini chat',
    });
  }
});

// 2. Google Search Grounding Endpoint (gemini-3.8-flash with googleSearch tool)
app.post('/api/gemini/search', async (req: Request, res: Response) => {
  try {
    const { query, language = 'ar' } = req.body;

    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Query parameter is required' });
      return;
    }

    const ai = getGenAIClient();

    const systemInstruction = `You are a research analyst for Egyptian financial regulations, tax decrees, CBE interest rates, inflation figures, and market benchmarks. Always use Google Search grounding to retrieve real-time, verified regulatory data, official gazette publications, CBE corridor rates, and current economic statistics. Present responses with exact citations, effective dates, and URLs in ${language === 'ar' ? 'Arabic' : 'English'}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: query,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources = groundingChunks
      .map((chunk: any) => chunk.web)
      .filter((web: any) => web && web.uri);

    res.json({
      success: true,
      model: 'gemini-3.8-flash',
      text,
      groundingChunks,
      webSources,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/search:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error during Search Grounding',
    });
  }
});

// 3. Google Maps Grounding Endpoint (gemini-3.8-flash with googleMaps tool)
app.post('/api/gemini/maps', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      lat = 30.0444, // Default Cairo coordinates
      lng = 31.2357,
      language = 'ar'
    } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt parameter is required' });
      return;
    }

    const ai = getGenAIClient();

    // Skill guidelines:
    // When using googleMaps:
    // - Where relevant, include user location in toolConfig.retrievalConfig.latLng
    // - DO NOT set responseMimeType
    // - DO NOT set responseSchema
    // - MUST extract URLs from groundingChunks and list them on the web app
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are a location navigator for corporate accountants and CFOs in Egypt. You help locate official tax authority offices (مأموريات الضرائب ومراكز كبار الممولين), Central Bank of Egypt branches, commercial banks, GAFI centers, and auditor offices. Describe locations, addresses, and accessibility clearly in ${language === 'ar' ? 'Arabic' : 'English'}.`,
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: Number(lat),
              longitude: Number(lng),
            },
          },
        },
      },
    });

    const text = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    // Extract map places and links
    const mapPlaces: Array<{ uri: string; title: string }> = [];
    if (Array.isArray(groundingChunks)) {
      for (const chunk of groundingChunks as any[]) {
        if (chunk.maps && chunk.maps.uri) {
          mapPlaces.push({
            uri: chunk.maps.uri,
            title: chunk.maps.title || 'Location on Google Maps',
          });
        }
      }
    }

    res.json({
      success: true,
      model: 'gemini-3.8-flash',
      text,
      groundingChunks,
      mapPlaces,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/maps:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error during Maps Grounding',
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Ledger IQ] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
