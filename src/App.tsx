import React, { useEffect, useMemo, useState } from 'react';
import { CURATED_RECIPES, DEFAULT_MEAL_PLANS } from './data/recipesCatalog';
import {
  DayOfWeek,
  GroceryItemRecord,
  MealPlan,
  NutriScanRecord,
  NutritionData,
  Recipe,
} from './types';
import { CurrencyType, FALLBACK_RATES } from './utils/currency';
import RecipeCard from './components/RecipeCard';
import RecipeDetailsModal from './components/RecipeDetailsModal';
import MealPlannerView from './components/MealPlannerView';
import ShoppingListView, { PriceState } from './components/ShoppingListView';
import NutriCareView from './components/NutriCareView';
import {
  BookOpen,
  Calendar,
  ShoppingBag,
  Search,
  ChefHat,
  Utensils,
  Heart,
  RotateCcw,
} from 'lucide-react';

function makeSafeDocId(prefix: string, rawKey: string): string {
  let h = 2166136261;
  const normalized = rawKey.toLowerCase().trim();
  for (let i = 0; i < normalized.length; i++) {
    h ^= normalized.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const safePrefix = prefix.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 20) || 'doc';
  const slug = normalized
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
  const suffix = (h >>> 0).toString(16);
  const combined = slug ? `${safePrefix}_${slug}_${suffix}` : `${safePrefix}_${suffix}`;
  return combined.slice(0, 128);
}

const WORKSPACE_STORAGE_KEY = 'cookbook_workspace_v1';
const VALID_CURRENCIES: CurrencyType[] = ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'CAD', 'AUD'];
const VALID_DAYS: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

interface PersistedWorkspace {
  currency: CurrencyType;
  hiddenRecipeIds: string[];
  mealPlans: MealPlan[];
  groceryRecords: Record<string, GroceryItemRecord>;
  nutriScans: NutriScanRecord[];
}

function loadWorkspaceFromStorage(): PersistedWorkspace {
  const defaults: PersistedWorkspace = {
    currency: 'USD',
    hiddenRecipeIds: [],
    mealPlans: DEFAULT_MEAL_PLANS,
    groceryRecords: {},
    nutriScans: [],
  };

  try {
    const raw = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return defaults;

    const currency = VALID_CURRENCIES.includes(parsed.currency)
      ? (parsed.currency as CurrencyType)
      : 'USD';

    const hiddenRecipeIds = Array.isArray(parsed.hiddenRecipeIds)
      ? parsed.hiddenRecipeIds.filter((id: unknown): id is string => typeof id === 'string').slice(0, 500)
      : [];

    const mealPlans: MealPlan[] = Array.isArray(parsed.mealPlans)
      ? parsed.mealPlans
          .filter((p: any) => p && VALID_DAYS.includes(p.day))
          .map((p: any) => ({
            day: p.day as DayOfWeek,
            breakfast: typeof p.breakfast === 'string' && p.breakfast ? p.breakfast : undefined,
            lunch: typeof p.lunch === 'string' && p.lunch ? p.lunch : undefined,
            dinner: typeof p.dinner === 'string' && p.dinner ? p.dinner : undefined,
          }))
      : DEFAULT_MEAL_PLANS;

    const groceryRecords: Record<string, GroceryItemRecord> = {};
    if (parsed.groceryRecords && typeof parsed.groceryRecords === 'object') {
      Object.entries(parsed.groceryRecords).forEach(([k, v]: [string, any]) => {
        if (v && typeof v.itemKey === 'string' && typeof v.name === 'string') {
          groceryRecords[k] = {
            id: typeof v.id === 'string' ? v.id : makeSafeDocId(v.isCustom ? 'custom' : 'ing', v.itemKey),
            itemKey: v.itemKey.slice(0, 160),
            name: v.name.slice(0, 160),
            amount: typeof v.amount === 'string' ? v.amount.slice(0, 40) : '1',
            unit: typeof v.unit === 'string' ? v.unit.slice(0, 40) : 'unit',
            checked: Boolean(v.checked),
            isCustom: Boolean(v.isCustom),
          };
        }
      });
    }

    const nutriScans: NutriScanRecord[] = Array.isArray(parsed.nutriScans)
      ? parsed.nutriScans
          .filter((s: any) => s && typeof s.mealName === 'string')
          .slice(0, 12)
          .map((s: any) => ({
            id: typeof s.id === 'string' ? s.id : makeSafeDocId('scan', s.mealName.toLowerCase()),
            query: typeof s.query === 'string' ? s.query : s.mealName,
            mealName: s.mealName,
            isFruitOrVegetable: Boolean(s.isFruitOrVegetable),
            calories: typeof s.calories === 'string' ? s.calories : 'N/A',
            carbohydrates: typeof s.carbohydrates === 'string' ? s.carbohydrates : 'N/A',
            proteins: typeof s.proteins === 'string' ? s.proteins : 'N/A',
            fats: typeof s.fats === 'string' ? s.fats : 'N/A',
            vitamins: Array.isArray(s.vitamins) ? s.vitamins.filter((x: unknown): x is string => typeof x === 'string') : [],
            minerals: Array.isArray(s.minerals) ? s.minerals.filter((x: unknown): x is string => typeof x === 'string') : [],
            healthScore: typeof s.healthScore === 'number' ? s.healthScore : 50,
            isUnhealthy: Boolean(s.isUnhealthy),
            unhealthyExplanation: typeof s.unhealthyExplanation === 'string' ? s.unhealthyExplanation : '',
            healthyAlternatives: Array.isArray(s.healthyAlternatives) ? s.healthyAlternatives : [],
            funFact: typeof s.funFact === 'string' ? s.funFact : '',
          }))
      : [];

    return {
      currency,
      hiddenRecipeIds,
      mealPlans: mealPlans.length > 0 ? mealPlans : DEFAULT_MEAL_PLANS,
      groceryRecords,
      nutriScans,
    };
  } catch {
    return defaults;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'recipes' | 'planner' | 'nutricare' | 'shopping'>('recipes');

  const initialWorkspace = useMemo(() => loadWorkspaceFromStorage(), []);

  // Workspace preferences & state (no sign-in required; prices stay strictly in session memory)
  const [currency, setCurrencyState] = useState<CurrencyType>(initialWorkspace.currency);
  const [hiddenRecipeIds, setHiddenRecipeIds] = useState<string[]>(initialWorkspace.hiddenRecipeIds);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>(initialWorkspace.mealPlans);
  const [groceryRecords, setGroceryRecords] = useState<Record<string, GroceryItemRecord>>(
    initialWorkspace.groceryRecords
  );
  const [nutriScans, setNutriScans] = useState<NutriScanRecord[]>(initialWorkspace.nutriScans);

  const [groceryPrices, setGroceryPrices] = useState<Record<string, PriceState>>({});
  const [activeNutrition, setActiveNutrition] = useState<NutritionData | null>(null);
  const [pendingNutriQuery, setPendingNutriQuery] = useState<string | null>(null);

  // Currency exchange rates
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(FALLBACK_RATES);

  // Recipe Book Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState(24);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Fetch live exchange rates once
  useEffect(() => {
    async function fetchLiveRates() {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (res.ok) {
          const data = await res.json();
          if (data && data.rates) {
            setExchangeRates(data.rates);
          }
        }
      } catch {
        // Fallback rates remain active
      }
    }
    fetchLiveRates();
  }, []);

  // Persist non-sensitive workspace preferences locally (never persists prices or credentials)
  useEffect(() => {
    try {
      const payload: PersistedWorkspace = {
        currency,
        hiddenRecipeIds,
        mealPlans,
        groceryRecords,
        nutriScans,
      };
      window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota or private-mode restrictions
    }
  }, [currency, hiddenRecipeIds, mealPlans, groceryRecords, nutriScans]);

  useEffect(() => {
    setVisibleCount(24);
  }, [selectedCategory, searchTerm, selectedTag]);

  const visibleRecipes = useMemo(() => {
    const hiddenSet = new Set(hiddenRecipeIds);
    return CURATED_RECIPES.filter((r) => !hiddenSet.has(r._id));
  }, [hiddenRecipeIds]);

  const filteredRecipes = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return visibleRecipes.filter((recipe) => {
      const matchesSearch =
        !q ||
        recipe.name.toLowerCase().includes(q) ||
        recipe.description.toLowerCase().includes(q) ||
        recipe.tags.some((t) => t.toLowerCase().includes(q)) ||
        recipe.ingredients.some((i) => i.name.toLowerCase().includes(q));
      const matchesCategory = selectedCategory === 'All' || recipe.category === selectedCategory;
      const matchesTag =
        !selectedTag || recipe.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase());
      return matchesSearch && matchesCategory && matchesTag;
    });
  }, [visibleRecipes, searchTerm, selectedCategory, selectedTag]);

  const uniqueTags = useMemo(
    () => Array.from(new Set(visibleRecipes.flatMap((r) => r.tags || []).map((t) => t.trim()))).sort(),
    [visibleRecipes]
  );

  // Handlers
  const handleSetCurrency = (nextCurrency: CurrencyType) => {
    setCurrencyState(nextCurrency);
  };

  const handleHideRecipe = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHiddenRecipeIds((prev) => Array.from(new Set([...prev, id])).slice(0, 500));
    setMealPlans((prev) =>
      prev.map((p) => ({
        ...p,
        breakfast: p.breakfast === id ? undefined : p.breakfast,
        lunch: p.lunch === id ? undefined : p.lunch,
        dinner: p.dinner === id ? undefined : p.dinner,
      }))
    );
  };

  const handleRestoreHiddenRecipes = () => {
    setHiddenRecipeIds([]);
  };

  const handleUpdateMeal = async (
    day: DayOfWeek,
    slot: 'breakfast' | 'lunch' | 'dinner',
    recipeId: string | null
  ) => {
    setMealPlans((prev) => {
      const existingPlan = prev.find((p) => p.day === day);
      const updatedPlan: MealPlan = {
        ...(existingPlan || { day }),
        [slot]: recipeId || undefined,
      };
      const idx = prev.findIndex((p) => p.day === day);
      if (idx === -1) return [...prev, updatedPlan];
      const next = [...prev];
      next[idx] = updatedPlan;
      return next;
    });
  };

  const handleSaveGroceryItem = async (params: {
    itemKey: string;
    name: string;
    amount: string;
    unit: string;
    checked: boolean;
    isCustom: boolean;
  }) => {
    const existing = groceryRecords[params.itemKey];
    const docId = existing?.id || makeSafeDocId(params.isCustom ? 'custom' : 'ing', params.itemKey);

    setGroceryRecords((prev) => ({
      ...prev,
      [params.itemKey]: {
        id: docId,
        ...params,
      },
    }));
  };

  const handleDeleteCustomGroceryItem = async (itemKey: string) => {
    setGroceryRecords((prev) => {
      const next = { ...prev };
      delete next[itemKey];
      return next;
    });
    setGroceryPrices((prev) => {
      const next = { ...prev };
      delete next[itemKey];
      return next;
    });
  };

  const handleResetGroceryChecks = async () => {
    setGroceryRecords((prev) => {
      const next: Record<string, GroceryItemRecord> = {};
      (Object.entries(prev) as [string, GroceryItemRecord][]).forEach(([k, v]) => {
        next[k] = { ...v, checked: false };
      });
      return next;
    });
  };

  const handleSaveNutriScan = async (queryText: string, data: NutritionData) => {
    const docId = makeSafeDocId('scan', queryText.toLowerCase());
    setNutriScans((prev) => {
      const filtered = prev.filter((s) => s.id !== docId);
      return [{ id: docId, query: queryText, ...data }, ...filtered].slice(0, 12);
    });
  };

  const handleClearNutriHistory = async () => {
    setNutriScans([]);
  };

  const handleScanFromRecipe = (mealName: string) => {
    setPendingNutriQuery(mealName);
    setActiveTab('nutricare');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-emerald-100 selection:text-emerald-950 pb-16 md:pb-0">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 w-full z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-xs">
              <ChefHat size={19} className="stroke-[2.3]" />
            </div>
            <div>
              <h1 className="font-sans text-sm font-extrabold tracking-tight text-slate-800 leading-none">
                CookBook
              </h1>
              <p className="font-sans text-[10px] font-bold text-emerald-600 tracking-wider uppercase mt-0.5">
                Culinary Planner &amp; NutriCare
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('recipes')}
              className={`px-3.5 py-2 rounded-xl font-sans text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'recipes'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <BookOpen size={14} />
              Recipe Book
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('nutricare')}
              className={`px-3.5 py-2 rounded-xl font-sans text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'nutricare'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Heart
                size={14}
                className={activeTab === 'nutricare' ? 'text-white fill-white' : 'text-rose-500 fill-rose-500'}
              />
              NutriCare
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('shopping')}
              className={`px-3.5 py-2 rounded-xl font-sans text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'shopping'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <ShoppingBag size={14} />
              Grocery List
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('planner')}
              className={`px-3.5 py-2 rounded-xl font-sans text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'planner'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Calendar size={14} />
              Weekly Planner
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {activeTab === 'recipes' && (
          <div className="space-y-6 animate-tab-fade">
            {/* Asymmetric Search & Category Strip */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="recipe-search"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search recipes, ingredients (e.g. avocado, pasta), or tags..."
                      className="w-full bg-slate-100/80 border border-transparent rounded-xl py-2.5 pl-10 pr-4 font-sans text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden transition-all"
                    />
                  </div>

                  <div className="flex gap-1 overflow-x-auto pb-1 md:pb-0 font-sans text-xs">
                    {['All', 'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-2 rounded-lg font-medium transition whitespace-nowrap cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-emerald-50 text-emerald-700 font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {uniqueTags.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                    <span className="font-sans text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Tags:
                    </span>
                    {selectedTag && (
                      <button
                        type="button"
                        onClick={() => setSelectedTag('')}
                        className="px-2 py-0.5 rounded bg-slate-900 text-white font-sans text-[9px] font-bold cursor-pointer"
                      >
                        × Clear ({selectedTag})
                      </button>
                    )}
                    {uniqueTags.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedTag(t === selectedTag ? '' : t)}
                        className={`px-2 py-0.5 rounded font-sans text-[10px] font-medium tracking-wide transition cursor-pointer ${
                          selectedTag === t
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Asymmetric Quick Summary Card */}
              <div className="lg:col-span-4 rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 p-5 flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                      Curated Collection
                    </span>
                    <p className="font-sans text-lg font-black text-slate-800 mt-0.5">
                      {filteredRecipes.length} Recipes Available
                    </p>
                  </div>
                  {hiddenRecipeIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleRestoreHiddenRecipes}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-white border border-emerald-200 px-2.5 py-1 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
                    >
                      <RotateCcw size={11} />
                      Restore ({hiddenRecipeIds.length})
                    </button>
                  )}
                </div>
                <p className="font-sans text-xs text-slate-500 leading-relaxed">
                  Tap any recipe to view ingredients, step-by-step instructions, or run an instant NutriCare breakdown.
                </p>
              </div>
            </div>

            {filteredRecipes.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 rounded-2xl border border-dashed border-slate-200 bg-white text-center">
                <Utensils size={32} className="text-slate-300 mb-2" />
                <p className="font-sans text-sm font-bold text-slate-700">
                  No Matching Recipes Found
                </p>
                <p className="font-sans text-xs text-slate-400 mt-0.5">
                  Try adjusting your search keywords, category, or tag filters.
                </p>
              </div>
            ) : (
              <>
                <div
                  id="recipe-cards-grid"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {filteredRecipes.slice(0, visibleCount).map((recipe) => (
                    <RecipeCard
                      key={recipe._id}
                      recipe={recipe}
                      currency={currency}
                      exchangeRates={exchangeRates}
                      onSelect={setSelectedRecipe}
                      onHide={handleHideRecipe}
                    />
                  ))}
                </div>
                {filteredRecipes.length > visibleCount && (
                  <div className="mt-10 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + 24)}
                      className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold font-sans text-xs flex items-center gap-2 transition cursor-pointer shadow-xs border border-slate-200/60"
                    >
                      Show More Recipes ({filteredRecipes.length - visibleCount} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'planner' && (
          <MealPlannerView
            recipes={visibleRecipes}
            mealPlans={mealPlans}
            currency={currency}
            exchangeRates={exchangeRates}
            onUpdateMeal={handleUpdateMeal}
            onSelectRecipeDetails={setSelectedRecipe}
          />
        )}

        {activeTab === 'shopping' && (
          <ShoppingListView
            recipes={visibleRecipes}
            mealPlans={mealPlans}
            groceryRecords={groceryRecords}
            prices={groceryPrices}
            setPrices={setGroceryPrices}
            currency={currency}
            exchangeRates={exchangeRates}
            setCurrency={handleSetCurrency}
            onSaveGroceryItem={handleSaveGroceryItem}
            onDeleteCustomItem={handleDeleteCustomGroceryItem}
            onResetChecks={handleResetGroceryChecks}
          />
        )}

        {activeTab === 'nutricare' && (
          <NutriCareView
            savedScans={nutriScans}
            activeNutrition={activeNutrition}
            onSelectNutrition={setActiveNutrition}
            onSaveScan={handleSaveNutriScan}
            onClearHistory={handleClearNutriHistory}
            externalQuery={pendingNutriQuery}
            onClearExternalQuery={() => setPendingNutriQuery(null)}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 mt-12 shrink-0">
        <div className="max-w-2xl mx-auto px-4 text-center font-sans space-y-2">
          <p className="text-sm font-semibold text-emerald-800">Thank you for visiting CookBook!</p>
          <p className="text-xs text-slate-600 leading-relaxed">
            Plan balanced meals, generate consolidated grocery estimates, and scan nutritional profiles seamlessly.
          </p>
          <p className="text-[10px] text-slate-400 font-medium pt-1">
            © 2026 CookBook • Curated for home chefs
          </p>
        </div>
      </footer>

      {/* Mobile Sticky Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-40 px-4 py-2.5 flex items-center justify-around shadow-lg">
        <button
          type="button"
          onClick={() => setActiveTab('recipes')}
          className={`flex flex-col items-center gap-1 p-1 ${
            activeTab === 'recipes' ? 'text-emerald-600' : 'text-slate-400'
          }`}
        >
          <BookOpen size={18} />
          <span className="font-sans text-[9px] font-bold">Recipes</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('nutricare')}
          className={`flex flex-col items-center gap-1 p-1 ${
            activeTab === 'nutricare' ? 'text-emerald-700 font-bold' : 'text-slate-400'
          }`}
        >
          <Heart
            size={18}
            className={activeTab === 'nutricare' ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}
          />
          <span className="font-sans text-[9px] font-bold">NutriCare</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('shopping')}
          className={`flex flex-col items-center gap-1 p-1 ${
            activeTab === 'shopping' ? 'text-emerald-600' : 'text-slate-400'
          }`}
        >
          <ShoppingBag size={18} />
          <span className="font-sans text-[9px] font-bold">Groceries</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('planner')}
          className={`flex flex-col items-center gap-1 p-1 ${
            activeTab === 'planner' ? 'text-emerald-600' : 'text-slate-400'
          }`}
        >
          <Calendar size={18} />
          <span className="font-sans text-[9px] font-bold">Planner</span>
        </button>
      </div>

      {selectedRecipe && (
        <RecipeDetailsModal
          recipe={selectedRecipe}
          currency={currency}
          exchangeRates={exchangeRates}
          onClose={() => setSelectedRecipe(null)}
          onScanInNutriCare={handleScanFromRecipe}
        />
      )}
    </div>
  );
}
