import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const PRIMARY_MODEL = 'gemini-3.1-flash-lite';
const SECONDARY_MODEL = 'gemini-4-hydrogen';

interface CachedEntry<T> {
  value: T;
  expiresAt: number;
}

const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
const MAX_CACHE_ENTRIES = 500;
const nutritionCache = new Map<string, CachedEntry<any>>();
const priceCache = new Map<string, CachedEntry<{ estimatedPriceUSD: number; explanation: string }>>();

function getCached<T>(cache: Map<string, CachedEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCached<T>(cache: Map<string, CachedEntry<T>>, key: string, value: T): void {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function classifyGeminiError(err: unknown): { status: number; message: string } {
  const apiStatus = typeof (err as { status?: unknown })?.status === 'number'
    ? (err as { status: number }).status
    : undefined;
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();

  if (apiStatus === 429 || lower.includes('429') || lower.includes('resource_exhausted') || lower.includes('quota')) {
    return {
      status: 429,
      message: 'Free-tier Gemini API quota limit reached. Please wait and try again, or select a billing-enabled API key in Settings > Secrets to increase your quota.',
    };
  }
  if (apiStatus === 403 || lower.includes('403') || lower.includes('permission_denied') || lower.includes('api_key_invalid') || lower.includes('api key')) {
    return {
      status: 403,
      message: 'Gemini API authentication failed. Please verify your GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  if (apiStatus === 503 || lower.includes('503') || lower.includes('unavailable')) {
    return {
      status: 503,
      message: 'Nutrition & pricing AI service is temporarily busy. Please click Retry in a moment.',
    };
  }
  if (apiStatus === 404 || lower.includes('404') || lower.includes('not_found')) {
    return {
      status: 502,
      message: 'Configured Gemini model is unavailable for this API endpoint.',
    };
  }
  if (apiStatus === 400 || lower.includes('invalid_argument')) {
    return {
      status: 400,
      message: `Invalid nutrition/pricing request parameter: ${msg.slice(0, 180)}`,
    };
  }
  return {
    status: 502,
    message: `Unable to complete AI analysis right now (${apiStatus ? `HTTP ${apiStatus}` : 'upstream error'}). Please try again shortly.`,
  };
}

async function generateWithModelFallback<T>(
  runner: (model: string, thinkingLevel: ThinkingLevel) => Promise<T>
): Promise<T> {
  try {
    return await runner(PRIMARY_MODEL, ThinkingLevel.MINIMAL);
  } catch (primaryErr) {
    const apiStatus = typeof (primaryErr as { status?: unknown })?.status === 'number'
      ? (primaryErr as { status: number }).status
      : undefined;
    const msg = primaryErr instanceof Error ? primaryErr.message.toLowerCase() : String(primaryErr).toLowerCase();
    const shouldTrySecondary =
      apiStatus === 429 ||
      apiStatus === 503 ||
      apiStatus === 404 ||
      msg.includes('429') ||
      msg.includes('resource_exhausted') ||
      msg.includes('503') ||
      msg.includes('unavailable');

    if (!shouldTrySecondary) {
      throw primaryErr;
    }

    return await runner(SECONDARY_MODEL, ThinkingLevel.LOW);
  }
}

function clampPrice(val: unknown): number {
  const num = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(num) || num <= 0) return 1.99;
  return Math.round(Math.max(0.15, Math.min(250, num)) * 100) / 100;
}

function sanitizeString(val: unknown, maxLen: number, fallback = ''): string {
  if (typeof val !== 'string') return fallback;
  return val.trim().slice(0, maxLen);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '256kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // --- Server-Side Gemini Batch Grocery Pricing ---
  app.post('/api/gemini/price/batch', async (req, res) => {
    try {
      const rawItems = req.body?.items;
      if (!Array.isArray(rawItems) || rawItems.length === 0) {
        return res.status(400).json({ error: 'Items array is required.' });
      }
      if (rawItems.length > 100) {
        return res.status(400).json({ error: 'Maximum of 100 items can be priced per batch.' });
      }

      const items = rawItems
        .map((item: any) => ({
          key: sanitizeString(item?.key, 160),
          name: sanitizeString(item?.name, 160),
          quantity: sanitizeString(item?.quantity, 40, '1') || '1',
          unit: sanitizeString(item?.unit, 40, 'unit') || 'unit',
        }))
        .filter((item) => item.key.length > 0 && item.name.length > 0);

      if (items.length === 0) {
        return res.status(400).json({ error: 'Valid items with key and name are required.' });
      }

      const cachedHits: { key: string; estimatedPriceUSD: number; explanation: string }[] = [];
      const uncachedItems: typeof items = [];

      for (const item of items) {
        const cacheKey = `${item.name.toLowerCase()}|${item.quantity.toLowerCase()}|${item.unit.toLowerCase()}`;
        const hit = getCached(priceCache, cacheKey);
        if (hit) {
          cachedHits.push({ key: item.key, ...hit });
        } else {
          uncachedItems.push(item);
        }
      }

      if (uncachedItems.length === 0) {
        const totalUSD = Math.round(cachedHits.reduce((sum, item) => sum + item.estimatedPriceUSD, 0) * 100) / 100;
        return res.json({ items: cachedHits, totalUSD });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'Gemini API key is not configured. Add GEMINI_API_KEY in Settings > Secrets.',
        });
      }

      const prompt = `Estimate the realistic retail US grocery store price in USD for each of these items. Use realistic estimates corresponding strictly to their keys.
CRITICAL QUANTITY SCALING: Be careful with units! If an item has a quantity like 500 and unit "g" or "grams", estimate the retail cost for that portion or standard package (e.g. 500g of flour is around $1.50 - $2.50, NOT $100+). If an item is in teaspoons, tablespoons, or milliliters, treat it as a realistic grocery fraction or small pack. Most standard recipe ingredients cost between $0.20 and $15.00.

Items to price:
${uncachedItems.map((i, idx) => `${idx + 1}. Key: "${i.key}", Name: "${i.name}", Qty: "${i.quantity}", Unit: "${i.unit}"`).join('\n')}`;

      const response = await generateWithModelFallback((model, thinkingLevel) =>
        ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      key: { type: Type.STRING },
                      estimatedPriceUSD: { type: Type.NUMBER },
                      explanation: { type: Type.STRING },
                    },
                    required: ['key', 'estimatedPriceUSD', 'explanation'],
                  },
                },
              },
              required: ['items'],
            },
          },
        })
      );

      const rawText = response.text?.trim();
      if (!rawText) {
        return res.status(502).json({ error: 'Empty response from pricing service.' });
      }

      const parsed = JSON.parse(rawText);
      const validKeys = new Set(uncachedItems.map((i) => i.key));
      const itemByKey = new Map(uncachedItems.map((i) => [i.key, i]));

      const freshPricedItems = Array.isArray(parsed?.items)
        ? parsed.items
            .filter((entry: any) => typeof entry?.key === 'string' && validKeys.has(entry.key))
            .map((entry: any) => {
              const normalized = {
                key: entry.key as string,
                estimatedPriceUSD: clampPrice(entry.estimatedPriceUSD),
                explanation: sanitizeString(entry.explanation, 300, 'Estimated US retail grocery price.'),
              };
              const orig = itemByKey.get(normalized.key);
              if (orig) {
                const cacheKey = `${orig.name.toLowerCase()}|${orig.quantity.toLowerCase()}|${orig.unit.toLowerCase()}`;
                setCached(priceCache, cacheKey, {
                  estimatedPriceUSD: normalized.estimatedPriceUSD,
                  explanation: normalized.explanation,
                });
              }
              return normalized;
            })
        : [];

      const pricedItems = [...cachedHits, ...freshPricedItems];
      const totalUSD = Math.round(pricedItems.reduce((sum: number, item: any) => sum + item.estimatedPriceUSD, 0) * 100) / 100;
      return res.json({ items: pricedItems, totalUSD });
    } catch (err) {
      const mapped = classifyGeminiError(err);
      console.warn(`Batch pricing failed (${mapped.status}): ${mapped.message}`);
      return res.status(mapped.status).json({ error: mapped.message });
    }
  });

  // --- Server-Side Gemini Single-Item Grocery Pricing ---
  app.post('/api/gemini/price', async (req, res) => {
    try {
      const name = sanitizeString(req.body?.name, 160);
      const quantity = sanitizeString(req.body?.quantity, 40, '1') || '1';
      const unit = sanitizeString(req.body?.unit, 40, 'unit') || 'unit';

      if (!name) {
        return res.status(400).json({ error: 'Ingredient name is required.' });
      }

      const cacheKey = `${name.toLowerCase()}|${quantity.toLowerCase()}|${unit.toLowerCase()}`;
      const cached = getCached(priceCache, cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'Gemini API key is not configured. Add GEMINI_API_KEY in Settings > Secrets.',
        });
      }

      const prompt = `Estimate the realistic retail supermarket price in USD for buying this specific ingredient portion.
CRITICAL QUANTITY SCALING: Be careful with units (e.g., 500g flour is ~$1.50-$2.50, 1 tbsp oil is ~$0.25). Most ingredients cost between $0.20 and $15.00.

Item: ${name}
Quantity: ${quantity}
Unit: ${unit}`;

      const response = await generateWithModelFallback((model, thinkingLevel) =>
        ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                estimatedPriceUSD: { type: Type.NUMBER },
                explanation: { type: Type.STRING },
              },
              required: ['estimatedPriceUSD', 'explanation'],
            },
          },
        })
      );

      const rawText = response.text?.trim();
      if (!rawText) {
        return res.status(502).json({ error: 'Empty response from pricing service.' });
      }

      const parsed = JSON.parse(rawText);
      const result = {
        estimatedPriceUSD: clampPrice(parsed?.estimatedPriceUSD),
        explanation: sanitizeString(parsed?.explanation, 300, 'Estimated US retail grocery price.'),
      };
      setCached(priceCache, cacheKey, result);
      return res.json(result);
    } catch (err) {
      const mapped = classifyGeminiError(err);
      console.warn(`Single item pricing failed (${mapped.status}): ${mapped.message}`);
      return res.status(mapped.status).json({ error: mapped.message });
    }
  });

  // --- Server-Side Gemini NutriCare Nutrition & Health Classifier ---
  app.post('/api/gemini/nutrition', async (req, res) => {
    try {
      const mealName = sanitizeString(req.body?.mealName, 200);
      if (!mealName) {
        return res.status(400).json({ error: 'A valid meal or food name (up to 200 characters) is required.' });
      }

      const cacheKey = mealName.toLowerCase();
      const cached = getCached(nutritionCache, cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'Gemini API key is not configured. Add GEMINI_API_KEY in Settings > Secrets to run NutriCare scans.',
        });
      }

      const prompt = `Perform an accurate, realistic nutritional and health analysis for a standard single serving of the following food, meal, fruit, or vegetable: "${mealName}".
Determine its macronutrients (calories, carbohydrates, proteins, fats), significant vitamins, essential minerals, and whether it is primarily a whole fruit or vegetable.
Calculate a realistic Health Score from 0 to 100 (where 80-100 is nutrient-dense whole food, 50-79 is moderate, and under 50 indicates ultra-processed, high sodium, high added sugar, or high saturated fat).
If healthScore < 60 or the item has notable dietary risks, set "isUnhealthy": true, explain concisely in "unhealthyExplanation", and recommend 2-3 specific healthier alternatives. Otherwise set "isUnhealthy": false with an empty "unhealthyExplanation" and empty "healthyAlternatives" array.
Provide one concise, accurate scientific or culinary nutrition "funFact".`;

      const response = await generateWithModelFallback((model, thinkingLevel) =>
        ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                mealName: { type: Type.STRING },
                isFruitOrVegetable: { type: Type.BOOLEAN },
                calories: { type: Type.STRING },
                carbohydrates: { type: Type.STRING },
                proteins: { type: Type.STRING },
                fats: { type: Type.STRING },
                vitamins: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                minerals: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                healthScore: { type: Type.INTEGER },
                isUnhealthy: { type: Type.BOOLEAN },
                unhealthyExplanation: { type: Type.STRING },
                healthyAlternatives: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      description: { type: Type.STRING },
                    },
                    required: ['name', 'description'],
                  },
                },
                funFact: { type: Type.STRING },
              },
              required: [
                'mealName',
                'isFruitOrVegetable',
                'calories',
                'carbohydrates',
                'proteins',
                'fats',
                'vitamins',
                'minerals',
                'healthScore',
                'isUnhealthy',
                'unhealthyExplanation',
                'healthyAlternatives',
                'funFact',
              ],
            },
          },
        })
      );

      const rawText = response.text?.trim();
      if (!rawText) {
        return res.status(502).json({ error: 'Empty response from nutrition engine.' });
      }

      const parsed = JSON.parse(rawText);
      const rawScore = Number(parsed?.healthScore);
      const healthScore = Number.isFinite(rawScore)
        ? Math.max(0, Math.min(100, Math.round(rawScore)))
        : 50;

      const normalized = {
        mealName: sanitizeString(parsed?.mealName, 200, mealName) || mealName,
        isFruitOrVegetable: Boolean(parsed?.isFruitOrVegetable),
        calories: sanitizeString(parsed?.calories, 40, 'N/A') || 'N/A',
        carbohydrates: sanitizeString(parsed?.carbohydrates, 40, 'N/A') || 'N/A',
        proteins: sanitizeString(parsed?.proteins, 40, 'N/A') || 'N/A',
        fats: sanitizeString(parsed?.fats, 40, 'N/A') || 'N/A',
        vitamins: Array.isArray(parsed?.vitamins)
          ? parsed.vitamins.map((v: unknown) => sanitizeString(v, 120)).filter(Boolean).slice(0, 15)
          : [],
        minerals: Array.isArray(parsed?.minerals)
          ? parsed.minerals.map((m: unknown) => sanitizeString(m, 120)).filter(Boolean).slice(0, 15)
          : [],
        healthScore,
        isUnhealthy: Boolean(parsed?.isUnhealthy),
        unhealthyExplanation: sanitizeString(parsed?.unhealthyExplanation, 1000),
        healthyAlternatives: Array.isArray(parsed?.healthyAlternatives)
          ? parsed.healthyAlternatives
              .filter((alt: any) => alt && typeof alt.name === 'string' && typeof alt.description === 'string')
              .map((alt: any) => ({
                name: sanitizeString(alt.name, 200),
                description: sanitizeString(alt.description, 600),
              }))
              .filter((alt: any) => alt.name.length > 0 && alt.description.length > 0)
              .slice(0, 10)
          : [],
        funFact: sanitizeString(parsed?.funFact, 1000),
      };

      setCached(nutritionCache, cacheKey, normalized);
      return res.json(normalized);
    } catch (err) {
      const mapped = classifyGeminiError(err);
      console.warn(`Nutrition analysis failed (${mapped.status}): ${mapped.message}`);
      return res.status(mapped.status).json({ error: mapped.message });
    }
  });

  // --- Vite Dev Middleware and Production Static Files ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CookBook Server] Running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Critical server failure on startup:', err);
});
