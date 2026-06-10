import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { RecipeModel, MealPlanModel, ProductModel } from './server/db';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing requests
  app.use(express.json());

  // Log incoming API calls for helpful diagnostics
  app.use((req, res, next) => {
    console.log(`[API ${new Date().toISOString().slice(11, 19)}] ${req.method} ${req.url}`);
    next();
  });

  // --- Express REST API for Products ---
  
  app.get('/api/products', async (req, res) => {
    try {
      const products = await ProductModel.find();
      res.json(products);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch products' });
    }
  });

  app.post('/api/products', async (req, res) => {
    try {
      const { name, price, description, category } = req.body;
      if (!name || price === undefined) {
        return res.status(400).json({ error: 'Name and price are required' });
      }
      const newProduct = await ProductModel.create({
        name,
        price: Number(price),
        description: description || '',
        category: category || 'General'
      });
      res.status(201).json(newProduct);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create product' });
    }
  });

  app.delete('/api/products/:id', async (req, res) => {
    try {
      const success = await ProductModel.findByIdAndDelete(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json({ message: 'Product successfully deleted' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete product' });
    }
  });

  // --- Express REST API for Recipes (utilizing MongoDB-like nested arrays) ---

  app.get('/api/recipes', async (req, res) => {
    try {
      const { category, search, tag } = req.query;
      let recipes = await RecipeModel.find();

      if (category && category !== 'All') {
        recipes = recipes.filter(r => r.category.toLowerCase() === String(category).toLowerCase());
      }

      if (tag) {
        recipes = recipes.filter(r => r.tags.some(t => t.toLowerCase() === String(tag).toLowerCase()));
      }

      if (search) {
        const searchTerm = String(search).toLowerCase();
        recipes = recipes.filter(r => 
          r.name.toLowerCase().includes(searchTerm) || 
          r.description.toLowerCase().includes(searchTerm) ||
          r.ingredients.some(ing => ing.name.toLowerCase().includes(searchTerm)) ||
          r.tags.some(t => t.toLowerCase().includes(searchTerm))
        );
      }

      res.json(recipes);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch recipes' });
    }
  });

  app.get('/api/recipes/:id', async (req, res) => {
    try {
      const recipe = await RecipeModel.findById(req.params.id);
      if (!recipe) {
        return res.status(404).json({ error: 'Recipe not found' });
      }
      res.json(recipe);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch recipe' });
    }
  });

  app.post('/api/recipes', async (req, res) => {
    try {
      const { name, description, image, category, prepTime, cookTime, servings, ingredients, steps, tags, price } = req.body;
      
      // Validation matching a solid schema check
      if (!name || !category || !ingredients || !steps) {
        return res.status(400).json({ error: 'Missing required recipe fields: name, category, ingredients, and steps are required' });
      }

      const newRecipe = await RecipeModel.create({
        name,
        description: description || '',
        image: image || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&auto=format&fit=crop&q=60',
        category,
        prepTime: Number(prepTime) || 0,
        cookTime: Number(cookTime) || 0,
        servings: Number(servings) || 1,
        ingredients: Array.isArray(ingredients) ? ingredients : [],
        steps: Array.isArray(steps) ? steps : [],
        tags: Array.isArray(tags) ? tags : [],
        price: Number(price) || 0
      });

      res.status(201).json(newRecipe);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create recipe' });
    }
  });

  app.put('/api/recipes/:id', async (req, res) => {
    try {
      const updated = await RecipeModel.findByIdAndUpdate(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Recipe not found' });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update recipe' });
    }
  });

  app.delete('/api/recipes/:id', async (req, res) => {
    try {
      const success = await RecipeModel.findByIdAndDelete(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Recipe not found' });
      }
      res.json({ message: 'Recipe successfully deleted' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete recipe' });
    }
  });

  // --- Express REST API for Meal Plans ---
  app.get('/api/mealplan', async (req, res) => {
    try {
      const plan = await MealPlanModel.find();
      res.json(plan);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch meal plan' });
    }
  });

  app.post('/api/mealplan', async (req, res) => {
    try {
      const { day, breakfast, lunch, dinner } = req.body;
      if (!day) {
        return res.status(400).json({ error: 'Day of week is required' });
      }
      const updatedPlan = await MealPlanModel.updatePlan(day, {
        breakfast: breakfast || undefined,
        lunch: lunch || undefined,
        dinner: dinner || undefined
      });
      res.json(updatedPlan);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update meal plan' });
    }
  });

  // --- Express REST API for Database Backup & Restore/Import (db.json) ---
  
  app.get('/api/backup', async (req, res) => {
    try {
      const backupPath = path.join(process.cwd(), 'data', 'db.json');
      if (!fs.existsSync(backupPath)) {
        return res.status(404).json({ error: 'Database file not found' });
      }
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=db.json');
      res.sendFile(backupPath);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to download db.json' });
    }
  });

  app.get('/api/package-lock', async (req, res) => {
    try {
      const lockPath = path.join(process.cwd(), 'package-lock.json');
      if (!fs.existsSync(lockPath)) {
        return res.status(404).json({ error: 'package-lock.json file not found' });
      }
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=package-lock.json');
      res.sendFile(lockPath);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to download package-lock.json' });
    }
  });

  app.post('/api/backup', async (req, res) => {
    try {
      const uploadedData = req.body;
      if (!uploadedData || typeof uploadedData !== 'object') {
        return res.status(400).json({ error: 'Invalid file: payload must be a JSON object' });
      }
      if (!Array.isArray(uploadedData.recipes)) {
        return res.status(400).json({ error: 'Invalid backup: "recipes" array is required' });
      }
      if (!Array.isArray(uploadedData.mealPlans)) {
        uploadedData.mealPlans = [];
      }
      if (!Array.isArray(uploadedData.products)) {
        uploadedData.products = [];
      }

      const backupPath = path.join(process.cwd(), 'data', 'db.json');
      fs.writeFileSync(backupPath, JSON.stringify(uploadedData, null, 2), 'utf-8');
      res.json({ message: 'Database successfully imported and restored! Page will reload shortly.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to restore database from backup file' });
    }
  });

  // --- Helper function for dynamic local grocery price fallback estimates ---
  function generateLocalFallbackPrice(name: string, quantity: string, unit: string) {
    const normName = name.toLowerCase().trim();
    const normUnit = (unit || '').toLowerCase().trim();
    const qtyNum = parseFloat(quantity) || 1;
    
    // Scale quantity dynamically based on units to represent normal supermarket purchase units
    let scaleFactor = 1;
    if (['g', 'gram', 'grams', 'gr'].includes(normUnit)) {
      scaleFactor = 1 / 450; // standard 450g or 1lb package
    } else if (['ml', 'milliliter', 'milliliters'].includes(normUnit)) {
      scaleFactor = 1 / 500; // standard 500ml bottle
    } else if (['tsp', 'tsps', 'teaspoon', 'teaspoons'].includes(normUnit)) {
      scaleFactor = 1 / 96; // typical jar holds many teaspoons (about 96 tsp)
    } else if (['tbsp', 'tbsps', 'tablespoon', 'tablespoons'].includes(normUnit)) {
      scaleFactor = 1 / 32; // typical bottle/jar holds ~32 tablespoons
    } else if (['oz', 'ounce', 'ounces', 'ozs'].includes(normUnit)) {
      scaleFactor = 1 / 16; // 16 oz = 1 lb package unit
    } else if (['kg', 'kilogram', 'kilograms'].includes(normUnit)) {
      scaleFactor = 2.2; // 1 kg is 2.2 lbs
    } else if (['pinch', 'pinches', 'dash', 'dashes', 'clove', 'cloves', 'sprig', 'sprigs'].includes(normUnit)) {
      scaleFactor = 0.05; // tiny fractional item
    }

    const scaledQty = Math.max(0.1, qtyNum * scaleFactor);

    let basePrice = 1.99;
    if (normName.includes('lemon') || normName.includes('lime')) {
      basePrice = 0.60;
    } else if (normName.includes('egg')) {
      basePrice = 0.25;
    } else if (normName.includes('milk') || normName.includes('cream')) {
      basePrice = 3.29;
    } else if (normName.includes('sugar') || normName.includes('flour')) {
      basePrice = 1.49;
    } else if (normName.includes('butter')) {
      basePrice = 2.99;
    } else if (normName.includes('cheese') || normName.includes('mozzarella') || normName.includes('parmesan')) {
      basePrice = 3.49;
    } else if (normName.includes('chicken') || normName.includes('beef') || normName.includes('meat') || normName.includes('salmon') || normName.includes('pork') || normName.includes('lamb') || normName.includes('turkey')) {
      basePrice = 7.99;
    } else if (normName.includes('onion') || normName.includes('garlic') || normName.includes('ginger') || normName.includes('shallot')) {
      basePrice = 0.89;
    } else if (normName.includes('salt') || normName.includes('pepper') || normName.includes('spice') || normName.includes('powder') || normName.includes('herb') || normName.includes('oregano') || normName.includes('cinnamon') || normName.includes('cumin')) {
      basePrice = 1.89;
    } else if (normName.includes('oil') || normName.includes('vinegar')) {
      basePrice = 4.49;
    } else if (normName.includes('tomato') || normName.includes('potato') || normName.includes('carrot') || normName.includes('cucumber') || normName.includes('celery') || normName.includes('spinach') || normName.includes('lettuce')) {
      basePrice = 1.29;
    } else if (normName.includes('rice') || normName.includes('pasta') || normName.includes('noodle') || normName.includes('bread')) {
      basePrice = 1.69;
    } else {
      const charSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      basePrice = 1.20 + (charSum % 250) / 100;
    }

    let estimatedPriceUSD = Math.round(basePrice * scaledQty * 100) / 100;
    if (estimatedPriceUSD < 0.15) {
      estimatedPriceUSD = 0.15; // Set lower bound limit
    } else if (estimatedPriceUSD > 49.99) {
      estimatedPriceUSD = 49.99; // Set reasonable upper bound for individual grocery entries
    }

    return {
      estimatedPriceUSD,
      explanation: `Estimated catalog price ($${basePrice.toFixed(2)}/unit scaled to standard supermarket retail package representation).`
    };
  }

  // --- Express REST API for Gemini Batch Market Pricing ---
  app.post('/api/gemini/price/batch', async (req, res) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Items array is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        const results = items.map(item => {
          const fallback = generateLocalFallbackPrice(item.name, item.quantity, item.unit);
          return { key: item.key, ...fallback };
        });
        return res.json({ items: results });
      }

      // Lazy load Gemini SDK
      const { GoogleGenAI, Type } = await import('@google/genai');
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `Estimate the average retail US grocery store price in USD for each of these items. Use realistic estimates corresponding strictly to their keys.
CRITICAL QUANTITY SCALING WARNING: Be extremely careful with units! If an item has a quantity like 500 and unit "g" or "grams", do NOT multiply the unit count directly to get hundreds of dollars (e.g. 500g of flour is around $1.50 - $2.50, NOT $100+). If an item is in teaspoons, tablespoons, milliliters, or grams, treat it as a small fraction of a single cheap package or bottle, or estimate the retail cost of a standard bundle/box. Keep prices user-affordable and realistic. Most standard ingredients should cost between $0.20 and $12.00 total.

Items to price:
${items.map((i, idx) => `${idx + 1}. Key: "${i.key}", Name: "${i.name}", Qty: "${i.quantity}", Unit: "${i.unit}"`).join('\n')}

Format your response as a JSON object containing an "items" array. Each array element must have:
- key: string matching the item key exactly.
- estimatedPriceUSD: number representing average price in USD.
- explanation: brief explanation text.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
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
                    explanation: { type: Type.STRING }
                  },
                  required: ["key", "estimatedPriceUSD", "explanation"]
                }
              }
            },
            required: ["items"]
          }
        }
      });

      if (response.text) {
        const result = JSON.parse(response.text.trim());
        return res.json(result);
      } else {
        throw new Error("No response text from Gemini API");
      }
    } catch (err: any) {
      const errStr = String(err);
      if (errStr.includes('429') || errStr.includes('quota') || errStr.includes('quotaExceeded') || errStr.includes('RESOURCE_EXHAUSTED')) {
        console.warn('Gemini 429 rate limit hit in batch pricing. Using fallback offline estimates.');
      } else {
        console.error('Error in batch pricing:', err);
      }

      const { items } = req.body || {};
      const results = (items || []).map((item: any) => {
        const fallback = generateLocalFallbackPrice(item.name || 'item', item.quantity || '1', item.unit || '');
        return { key: item.key, ...fallback };
      });
      return res.json({ items: results });
    }
  });

  // --- Express REST API for Gemini Market Pricing ---
  app.post('/api/gemini/price', async (req, res) => {
    try {
      const { name, quantity, unit } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Ingredient name is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        const fallback = generateLocalFallbackPrice(name, quantity, unit);
        return res.json(fallback);
      }

      const { GoogleGenAI, Type } = await import('@google/genai');
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const qtyVal = quantity || '1';
      const unitVal = unit || 'unit';

      const prompt = `Estimate the realistic retail supermarket price in USD for buying this specific item.
CRITICAL QUANTITY SCALING WARNING: Be extremely careful with units! If an item has a quantity like 500 and unit "g" or "grams", do NOT multiply the unit count directly to get hundreds of dollars (e.g. 500g of flour is around $1.50 - $2.50, NOT $100+). If an item is in teaspoons, tablespoons, milliliters, or grams, treat it as a small fraction of a single cheap package or bottle, or estimate the retail cost of a standard box/can/pack. Keep prices user-affordable and realistic. Most standard ingredients should cost between $0.20 and $12.00 total.

Item: ${name}
Quantity: ${qtyVal}
Unit: ${unitVal}

Provide your response in JSON format specifying:
- estimatedPriceUSD: the estimated average grocery store price in USD for this item at a typical US supermarket as a floating number (e.g., 2.99 or 0.75).
- explanation: a brief one-sentence explanation of how this price was calculated based on general market prices (e.g., "Fresh limes usually cost around $0.50 per piece").`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              estimatedPriceUSD: {
                type: Type.NUMBER,
                description: "The calculated price in USD."
              },
              explanation: {
                type: Type.STRING,
                description: "Brief reasoning for the price."
              }
            },
            required: ["estimatedPriceUSD", "explanation"]
          }
        }
      });

      if (response.text) {
        const result = JSON.parse(response.text.trim());
        res.json(result);
      } else {
        throw new Error("No response content from Gemini API");
      }
    } catch (err: any) {
      const errStr = String(err);
      if (errStr.includes('429') || errStr.includes('quota') || errStr.includes('quotaExceeded') || errStr.includes('RESOURCE_EXHAUSTED')) {
        console.warn('Gemini 429 rate limit hit in single-item pricing. Using fallback estimate.');
      } else {
        console.error('Error in single-item pricing:', err);
      }
      
      const { name, quantity, unit } = req.body || {};
      const fallback = generateLocalFallbackPrice(name || 'item', quantity || '1', unit || '');
      res.json(fallback);
    }
  });

  // --- Express REST API for Gemini Nutrition & Health Classifier ---
  app.post('/api/gemini/nutrition', async (req, res) => {
    const { mealName } = req.body;
    if (!mealName) {
      return res.status(400).json({ error: 'Meal or food name is required' });
    }

    // Dynamic fallback structure
    function generateFallbackNutrition(name: string) {
      const norm = name.toLowerCase().trim();
      if (norm.includes('apple')) {
        return {
          mealName: "Apple (Fresh)",
          isFruitOrVegetable: true,
          calories: "95 kcal",
          carbohydrates: "25g",
          proteins: "0.5g",
          fats: "0.3g",
          vitamins: ["Vitamin C (14% DV)", "Vitamin B6 (5% DV)"],
          minerals: ["Potassium (6% DV)", "Magnesium (2% DV)"],
          healthScore: 98,
          isUnhealthy: false,
          unhealthyExplanation: "",
          healthyAlternatives: [],
          funFact: "Apples contain soluble fiber called pectin, which helps improve gut bacteria and lower cholesterol."
        };
      }
      if (norm.includes('banana')) {
        return {
          mealName: "Banana (Fresh)",
          isFruitOrVegetable: true,
          calories: "105 kcal",
          carbohydrates: "27g",
          proteins: "1.3g",
          fats: "0.3g",
          vitamins: ["Vitamin B6 (33% DV)", "Vitamin C (11% DV)"],
          minerals: ["Potassium (10% DV)", "Magnesium (8% DV)"],
          healthScore: 92,
          isUnhealthy: false,
          unhealthyExplanation: "",
          healthyAlternatives: [],
          funFact: "Bananas are harvested green and artificially ripened using ethylene gas right before arriving at your local supermarket."
        };
      }
      if (norm.includes('burger') || norm.includes('cheeseburger')) {
        return {
          mealName: "Cheeseburger (Fast Food)",
          isFruitOrVegetable: false,
          calories: "535 kcal",
          carbohydrates: "40g",
          proteins: "30g",
          fats: "28g",
          vitamins: ["Vitamin B12 (35% DV)", "Folate (15% DV)"],
          minerals: ["Sodium (48% DV)", "Iron (22% DV)", "Calcium (20% DV)"],
          healthScore: 35,
          isUnhealthy: true,
          unhealthyExplanation: "High levels of saturated fats, sodium, and highly refined white-flour buns with processed cheeses.",
          healthyAlternatives: [
            { name: "Turkey Burger on Whole Grain Bun", description: "Much leaner meat cut with high fiber whole grains for steady blood sugar." },
            { name: "Grilled Chicken Breast Wrap", description: "Significantly lower saturated fat with solid lean protein punch." },
            { name: "Black Bean Quinoa Burger", description: "A high-fiber, completely plant-based alternative with heart-healthy proteins." }
          ],
          funFact: "The average fast-food cheeseburger often exceeds half your daily recommended maximum sodium intake in a single serving."
        };
      }
      if (norm.includes('pizza')) {
        return {
          mealName: "Pepperoni Pizza (Slice)",
          isFruitOrVegetable: false,
          calories: "290 kcal",
          carbohydrates: "32g",
          proteins: "12g",
          fats: "12g",
          vitamins: ["Thiamin (15% DV)", "Riboflavin (12% DV)"],
          minerals: ["Sodium (30% DV)", "Calcium (15% DV)"],
          healthScore: 42,
          isUnhealthy: true,
          unhealthyExplanation: "Rich in processed meats containing harmful nitrites, refined wheat crust, and elevated sodium.",
          healthyAlternatives: [
            { name: "Cauliflower Crust Veggie Pizza", description: "Lowers total carb load significantly while magnifying dietary fiber." },
            { name: "Whole Wheat Margherita Pizza", description: "Offers complex carbs and healthier fats from fresh mozzarella and olive oil." }
          ],
          funFact: "Tomato sauce on pizza is high in lycopene, a powerful antioxidant that is actually more easily absorbed after cooking!"
        };
      }
      if (norm.includes('salad')) {
        return {
          mealName: "Mixed Garden Salad",
          isFruitOrVegetable: true,
          calories: "140 kcal",
          carbohydrates: "8g",
          proteins: "3g",
          fats: "11g",
          vitamins: ["Vitamin A (80% DV)", "Vitamin K (150% DV)", "Vitamin C (25% DV)"],
          minerals: ["Folate (15% DV)", "Iron (6% DV)"],
          healthScore: 95,
          isUnhealthy: false,
          unhealthyExplanation: "",
          healthyAlternatives: [],
          funFact: "Adding healthy fats like olive oil or avocado to your salad dramatically increases your body's absorption of fat-soluble vitamins (A, D, E, K) from the leafy greens."
        };
      }

      // General fallback computation
      const isHealthy = !norm.includes('fry') && !norm.includes('candy') && !norm.includes('cake') && !norm.includes('donut') && !norm.includes('soda') && !norm.includes('fried') && !norm.includes('chips') && !norm.includes('cookie') && !norm.includes('ice cream');
      const score = isHealthy ? Math.min(95, 65 + (name.length % 30)) : Math.max(15, 20 + (name.length % 25));
      
      return {
        mealName: name.charAt(0).toUpperCase() + name.slice(1),
        isFruitOrVegetable: norm.includes('vegetable') || norm.includes('fruit') || norm.includes('pear') || norm.includes('orange') || norm.includes('carrot') || norm.includes('cucumber') || norm.includes('broccoli') || norm.includes('berry') || norm.includes('spinach') || norm.includes('tomato'),
        calories: `${120 + (name.length % 5) * 60} kcal`,
        carbohydrates: `${15 + (name.length % 7) * 8}g`,
        proteins: `${5 + (name.length % 9) * 4}g`,
        fats: `${2 + (name.length % 6) * 3}g`,
        vitamins: ["Vitamin C (12% DV)", "Vitamin A (10% DV)"],
        minerals: ["Calcium (4% DV)", "Iron (6% DV)"],
        healthScore: score,
        isUnhealthy: !isHealthy,
        unhealthyExplanation: isHealthy ? "" : "Contains high levels of refined ingredients, saturated/trans fats, or simple sugars.",
        healthyAlternatives: isHealthy ? [] : [
          { name: `Baked Protein-Rich ${name.charAt(0).toUpperCase() + name.slice(1)} Substitute`, description: "Uses natural fiber substitutions, low glycogen binders, and healthy spice grilling." },
          { name: "Organic Veggies with Hummus Dip", description: "Provides excellent raw micronutrients and complex heart-healthy carbohydrates." }
        ],
        funFact: "Dynamic food logging and nutritional awareness helps build sustainable eating habits and controls blood sugar spikes!"
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log(`[Nutrition] Offline Mode fallback calculations for: "${mealName}"`);
      return res.json(generateFallbackNutrition(mealName));
    }

    try {
      const { GoogleGenAI, Type } = await import('@google/genai');
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `Perform a realistic nutritional and health analysis of the following food, meal, fruit or vegetable: "${mealName}".
Determine its macro nutrients (calories, carbs, proteins, fats), significant vitamins, minerals, and whether it qualifies primarily as a fruit or vegetable.
Additionally, calculate a descriptive Health Score from 1 to 100 (where 90-100 is highly nutritious, and under 50 suggests unhealthy profiles).
If the item is unhealthy, flag "isUnhealthy": true, explain briefly in unhealthyExplanation, and recommend 2-3 specific healthy alternatives. Otherwise flag "isUnhealthy": false.

Structure your response strictly as JSON with this exact schema:
{
  "mealName": string (normalized elegant name),
  "isFruitOrVegetable": boolean,
  "calories": string (e.g., "150 kcal"),
  "carbohydrates": string (e.g., "25g"),
  "proteins": string (e.g., "3g"),
  "fats": string (e.g., "2g"),
  "vitamins": array of strings (list 2-4 key vitamins, with percentages if known, e.g., ["Vitamin C (15%)", "Vitamin A"]),
  "minerals": array of strings (list 1-3 key minerals, e.g., ["Zinc (4%)", "Iron"]),
  "healthScore": integer (1 to 100),
  "isUnhealthy": boolean,
  "unhealthyExplanation": string (if isUnhealthy is true, explain why, otherwise empty string),
  "healthyAlternatives": array of objects, where each object has:
     - "name": string
     - "description": string
  "funFact": string (a short, exciting scientific or cooking fact about this food's nutrition)
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
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
                items: { type: Type.STRING }
              },
              minerals: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
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
                    description: { type: Type.STRING }
                  },
                  required: ["name", "description"]
                }
              },
              funFact: { type: Type.STRING }
            },
            required: [
              "mealName", "isFruitOrVegetable", "calories", "carbohydrates", 
              "proteins", "fats", "vitamins", "minerals", "healthScore", 
              "isUnhealthy", "unhealthyExplanation", "healthyAlternatives", "funFact"
            ]
          }
        }
      });

      if (response.text) {
        const result = JSON.parse(response.text.trim());
        return res.json(result);
      } else {
        throw new Error("Empty response from Gemini API");
      }
    } catch (err: any) {
      const errStr = String(err);
      if (errStr.includes('429') || errStr.includes('quota') || errStr.includes('quotaExceeded') || errStr.includes('RESOURCE_EXHAUSTED')) {
        console.warn('Gemini 429 rate limit hit in nutrition analysis. Using fallback offline calculations.');
      } else {
        console.error('Error generating nutrition content:', err);
      }
      // Fallback gracefully on rate limits or API downtime
      return res.json(generateFallbackNutrition(mealName));
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
    // Support SPA router fallback on '*' for Express v4
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Recipe Server] Running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical server failure on startup:", err);
});
