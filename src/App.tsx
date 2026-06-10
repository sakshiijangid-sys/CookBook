import React, { useState, useEffect } from 'react';
import { Recipe, MealPlan } from './types';
import { CurrencyType, FALLBACK_RATES } from './utils/currency';
import RecipeCard from './components/RecipeCard';
import { AnimatePresence } from 'motion/react';
import RecipeDetailsModal from './components/RecipeDetailsModal';
import MealPlannerView from './components/MealPlannerView';
import ShoppingListView from './components/ShoppingListView';
import NutriCareView from './components/NutriCareView';
import SkeletonLoader from './components/SkeletonLoader';
import { 
  BookOpen, 
  Calendar, 
  ShoppingBag, 
  Plus, 
  Search, 
  ChefHat, 
  Loader2, 
  Utensils, 
  Info, 
  ChevronRight,
  Sparkles,
  Heart,
  Database,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  FileJson,
  X,
  Copy
} from 'lucide-react';

export default function App() {
  // Tabs State
  const [activeTab, setActiveTab] = useState<'recipes' | 'planner' | 'nutricare' | 'shopping'>('recipes');

  // Backup & Restore State
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [backupError, setBackupError] = useState('');
  const [backupSuccess, setBackupSuccess] = useState('');
  
  // Clipboard Copy and on-demand fetch states
  const [copyingDb, setCopyingDb] = useState(false);
  const [copyingLock, setCopyingLock] = useState(false);

  // Handle database file download (db.json)
  const handleDownloadBackup = () => {
    try {
      const anchor = document.createElement('a');
      anchor.href = '/api/backup';
      anchor.target = '_blank'; // Opens in new tab to guarantee download bypass in sandboxed iframes
      anchor.download = 'db.json';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      setBackupSuccess('Initiated db.json download in your browser.');
      setTimeout(() => setBackupSuccess(''), 4000);
    } catch (err: any) {
      setBackupError('Download error: ' + err.message);
      setTimeout(() => setBackupError(''), 4000);
    }
  };

  // Handle package-lock file download
  const handleDownloadPackageLock = () => {
    try {
      const anchor = document.createElement('a');
      anchor.href = '/api/package-lock';
      anchor.target = '_blank'; // Opens in new tab to guarantee download bypass in sandboxed iframes
      anchor.download = 'package-lock.json';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      setBackupSuccess('Initiated package-lock.json download in your browser.');
      setTimeout(() => setBackupSuccess(''), 4000);
    } catch (err: any) {
      setBackupError('Download error: ' + err.message);
      setTimeout(() => setBackupError(''), 4000);
    }
  };

  // Clipboard copies for perfect fallback support
  const handleCopyDbToClipboard = async () => {
    try {
      setCopyingDb(true);
      setBackupError('');
      setBackupSuccess('');
      const res = await fetch('/api/backup');
      if (!res.ok) throw new Error('Failed to retrieve db.json from container');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setBackupSuccess('Copied db.json contents successfully to your clip board!');
      setTimeout(() => setBackupSuccess(''), 4000);
    } catch (err: any) {
      setBackupError('Clipboard extraction error: ' + err.message);
      setTimeout(() => setBackupError(''), 5000);
    } finally {
      setCopyingDb(false);
    }
  };

  const handleCopyLockToClipboard = async () => {
    try {
      setCopyingLock(true);
      setBackupError('');
      setBackupSuccess('');
      const res = await fetch('/api/package-lock');
      if (!res.ok) throw new Error('Failed to retrieve package-lock.json from container');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setBackupSuccess('Copied package-lock.json contents successfully to your clip board!');
      setTimeout(() => setBackupSuccess(''), 4000);
    } catch (err: any) {
      setBackupError('Clipboard extraction error: ' + err.message);
      setTimeout(() => setBackupError(''), 5000);
    } finally {
      setCopyingLock(false);
    }
  };

  // Process and upload db.json
  const handleImportBackupFile = async (file: File) => {
    if (!file) return;
    setBackupError('');
    setBackupSuccess('');
    
    // File validation
    if (!file.name.endsWith('.json')) {
      setBackupError('Error: Database file must be a JSON (.json) file');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch (jsonErr) {
          throw new Error('File contents are not valid standard JSON');
        }

        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Backup must be a JSON object containing recipes');
        }
        if (!Array.isArray(parsed.recipes)) {
          throw new Error('Invalid file schema: "recipes" list is missing or invalid');
        }

        const response = await fetch('/api/backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed)
        });

        if (!response.ok) {
          const errRes = await response.json().catch(() => ({ error: 'Upload failed' }));
          throw new Error(errRes.error || 'Server rejected database file');
        }

        setBackupSuccess('Database successfully restored! Page reloading...');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err: any) {
        setBackupError(err.message || 'Error occurred during processing');
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImportBackupFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleImportBackupFile(e.target.files[0]);
    }
  };

  // Global Currency State
  const [currency, setCurrency] = useState<CurrencyType>(() => {
    const saved = localStorage.getItem('cookbook_currency');
    return (saved as CurrencyType) || 'USD';
  });
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(FALLBACK_RATES);

  // Fetch real-time exchange rates on mount
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
      } catch (err) {
        console.warn('Real-time currency rates fetch failed. Using preloaded fallback rates.', err);
      }
    }
    fetchLiveRates();
  }, []);

  // Save selected currency choice to localStorage
  useEffect(() => {
    localStorage.setItem('cookbook_currency', currency);
  }, [currency]);

  // Application Data States
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);

  // Search & Filters State for Recipe views
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string>('');
  
  // Pagination / Load More states to optimize rendering latency
  const [visibleCount, setVisibleCount] = useState(24);

  // Reset pagination when category, search, or tag filter settings change
  useEffect(() => {
    setVisibleCount(24);
  }, [selectedCategory, searchTerm, selectedTag]);

  // UI Control states
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  
  // Loading & Error boundary states
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Initial Load: Fetch recipes and mealplans in parallel
  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const [recipesRes, mealPlansRes] = await Promise.all([
          fetch('/api/recipes'),
          fetch('/api/mealplan')
        ]);

        if (!recipesRes.ok || !mealPlansRes.ok) {
          throw new Error('Failed to load assets from Express server cluster');
        }

        const [recipesData, mealPlansData] = await Promise.all([
          recipesRes.json(),
          mealPlansRes.json()
        ]);

        setRecipes(recipesData);
        setMealPlans(mealPlansData);
      } catch (err: any) {
        console.error("Initial data load error:", err);
        setErrorMsg('Unable to connect to the Express & MongoDB-style backend. Is the server running?');
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // --- API Mutation Helpers ---

  // Delete Recipe - DELETE /api/recipes/:id
  const handleDeleteRecipe = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering details modal
    if (!window.confirm('Delete this recipe permanentely?')) return;
    
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Unsuccessful delete operation');
      
      setRecipes(prev => prev.filter(r => r._id !== id));
      
      // Also clean up any assigned planner slots using this recipe ID
      const updatedPlans = await Promise.all(
        mealPlans.map(async (p) => {
          let needsUpdate = false;
          const cleanPlan = { ...p };
          if (cleanPlan.breakfast === id) { cleanPlan.breakfast = undefined; needsUpdate = true; }
          if (cleanPlan.lunch === id) { cleanPlan.lunch = undefined; needsUpdate = true; }
          if (cleanPlan.dinner === id) { cleanPlan.dinner = undefined; needsUpdate = true; }
          
          if (needsUpdate) {
            await fetch('/api/mealplan', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(cleanPlan)
            });
          }
          return cleanPlan;
        })
      );
      setMealPlans(updatedPlans);
    } catch (err: any) {
      alert(err.message || 'Failed to delete recipe');
    }
  };

  // Update Meal Planner Slot - POST /api/mealplan
  const handleUpdateMeal = async (day: MealPlan['day'], slot: 'breakfast' | 'lunch' | 'dinner', recipeId: string | null) => {
    try {
      // Find current day plan or start empty
      const currentDayPlan = mealPlans.find(p => p.day === day) || { day };
      const updatedParam = {
        ...currentDayPlan,
        [slot]: recipeId || undefined
      };

      const res = await fetch('/api/mealplan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedParam)
      });

      if (!res.ok) throw new Error('Failed to save meal assignment');
      const savedPlan = await res.json();

      setMealPlans(prev => {
        const index = prev.findIndex(p => p.day === day);
        if (index === -1) return [...prev, savedPlan];
        const copy = [...prev];
        copy[index] = savedPlan;
        return copy;
      });
    } catch (err: any) {
      alert(err.message || 'Failed to update plan');
    }
  };


  // --- Recipe Search & Filtering ---
  
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = 
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
      recipe.ingredients.some(ing => ing.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || recipe.category === selectedCategory;
    const matchesTag = !selectedTag || recipe.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase());

    return matchesSearch && matchesCategory && matchesTag;
  });

  // Extract all unique tags across recipes to easily quick-filter
  const uniqueTags = Array.from(
    new Set(recipes.flatMap(r => r.tags || []).map(t => t.trim()))
  ).sort();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Upper Brand bar */}
      <header className="border-b border-slate-200 bg-white relative w-full z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-xs">
              <ChefHat size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-sans text-sm font-extrabold tracking-tight text-slate-800 flex items-center gap-2 leading-none">
                CookBook
              </h1>
              <p className="font-sans text-[9px] font-bold text-emerald-600 tracking-wider uppercase mt-0.5">
                Your ultimate guide to cook
              </p>
            </div>
          </div>

          {/* Navigation Tabs and Database Management Trigger */}
          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="hidden md:flex space-x-1">
              <button
                onClick={() => setActiveTab('recipes')}
                className={`px-4 py-1.5 rounded-lg font-sans text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                  activeTab === 'recipes' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <BookOpen size={13} />
                Recipe Book
              </button>
              <button
                onClick={() => setActiveTab('nutricare')}
                className={`px-4 py-1.5 rounded-lg font-sans text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                  activeTab === 'nutricare' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Heart size={13} className="text-rose-500 fill-rose-500" />
                Nutri Care
              </button>
              <button
                onClick={() => setActiveTab('shopping')}
                className={`px-4 py-1.5 rounded-lg font-sans text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                  activeTab === 'shopping' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <ShoppingBag size={13} />
                Grocery List
              </button>
              <button
                onClick={() => setActiveTab('planner')}
                className={`px-4 py-1.5 rounded-lg font-sans text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                  activeTab === 'planner' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Calendar size={13} />
                Weekly Planner
              </button>
            </nav>

            <button
              onClick={() => {
                setBackupError('');
                setBackupSuccess('');
                setIsBackupModalOpen(true);
              }}
              title="Database Backup & Restore center"
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/50 text-slate-600 hover:text-emerald-700 font-sans text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <Database size={13} className="text-emerald-600" />
              <span className="hidden sm:inline">Backup & Restore</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {isLoading ? (
          <SkeletonLoader />
        ) : errorMsg ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 text-center max-w-xl mx-auto mt-10 space-y-4">
            <h3 className="font-sans text-base font-bold text-rose-900">Database Connection Error</h3>
            <p className="font-sans text-xs text-rose-700 leading-relaxed">{errorMsg}</p>
            <div className="p-3 bg-white/85 rounded-xl border border-rose-100 font-mono text-[10px] text-left text-rose-900 whitespace-pre-wrap">
              Is Node Express listening on Port 3000? Verify "npm run dev" commands exist.
            </div>
          </div>
        ) : (
          <>
            {/* View renders depending on chosen activeTab */}
            {activeTab === 'recipes' && (
              <div className="space-y-6 animate-tab-fade">
                
                {/* Filter / Search Bar */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
                  <div className="flex flex-col md:flex-row gap-3">
                    {/* Search Field */}
                    <div className="relative flex-1">
                      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        id="recipe-search"
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        placeholder="Search recipes, ingredients (e.g. avocado, pasta), or tags..."
                        className="w-full bg-slate-100/80 border-none rounded-full py-2.5 pl-10 pr-4 font-sans text-xs text-slate-800 placeholder-slate-400 focus:bg-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all duration-200"
                      />
                    </div>

                    {/* Category quick selectors */}
                    <div className="flex gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none font-sans text-xs">
                      {['All', 'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack'].map((cat) => (
                        <button
                          key={cat}
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

                  {/* Sub-Filters / Tags list */}
                  {uniqueTags.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                      <span className="font-sans text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Popular Tags:
                      </span>
                      {selectedTag && (
                        <button
                          onClick={() => setSelectedTag('')}
                          className="px-2 py-0.5 rounded bg-slate-900 text-white font-sans text-[9px] font-bold"
                        >
                          × Clear ({selectedTag})
                        </button>
                      )}
                      {uniqueTags.map((t) => (
                        <button
                          key={t}
                          onClick={() => setSelectedTag(t === selectedTag ? '' : t)}
                          className={`px-2 py-0.5 rounded font-sans text-[10px] font-medium tracking-wide transition ${
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

                {/* Recipe lists info bar */}
                <div className="flex items-center justify-between pb-1">
                  <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-400">
                    Seeded Recipes ({filteredRecipes.length} shown)
                  </span>
                </div>

                {/* Grid */}
                {filteredRecipes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-16 rounded-2xl border border-dashed border-slate-200 bg-white text-center">
                    <Utensils size={32} className="text-slate-300 gap-1.5 mb-2" />
                    <p className="font-sans text-sm font-bold text-slate-700">No Matching Culinary Delights found</p>
                    <p className="font-sans text-xs text-slate-400 mt-0.5">Try altering your search keywords or tags filters!</p>
                  </div>
                ) : (
                  <>
                    <div id="recipe-cards-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <AnimatePresence mode="popLayout">
                        {filteredRecipes.slice(0, visibleCount).map((recipe) => (
                          <RecipeCard 
                            key={recipe._id}
                            recipe={recipe}
                            onSelect={setSelectedRecipe}
                            onDelete={handleDeleteRecipe}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                    {filteredRecipes.length > visibleCount && (
                      <div className="mt-10 flex justify-center">
                        <button
                          onClick={() => setVisibleCount(prev => prev + 24)}
                          className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold font-sans text-xs flex items-center gap-2 transition cursor-pointer shadow-xs border border-slate-200/50"
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
                recipes={recipes}
                mealPlans={mealPlans}
                onUpdateMeal={handleUpdateMeal}
                onSelectRecipeDetails={setSelectedRecipe}
              />
            )}

            {activeTab === 'shopping' && (
              <ShoppingListView 
                recipes={recipes}
                mealPlans={mealPlans}
                currency={currency}
                exchangeRates={exchangeRates}
                setCurrency={setCurrency}
              />
            )}

            {activeTab === 'nutricare' && (
              <NutriCareView />
            )}
          </>
        )}
      </main>

      {/* Footer information details */}
      <footer className="border-t border-slate-200 bg-white py-8 mt-12 shrink-0">
        <div className="max-w-2xl mx-auto px-4 text-center font-sans space-y-2">
          <p className="text-sm font-semibold text-emerald-800">Thank you for visiting CookBook!</p>
          <p className="text-xs text-slate-600 leading-relaxed">
            We hope this personalized digital planner makes your culinary journey simpler, organized, and filled with delicious adventures. Keep testing new recipes, scheduling vibrant dinners, and sharing the joy of homemade meals!
          </p>
          <p className="text-[10px] text-slate-400 font-medium pt-1">
            © 2026 CookBook • Curated with passion for home chefs everywhere
          </p>
        </div>
      </footer>

      {/* Mobile Sticky Action Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-40 px-4 py-2.5 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('recipes')}
          className={`flex flex-col items-center gap-1 p-1 ${activeTab === 'recipes' ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          <BookOpen size={18} />
          <span className="font-sans text-[9px] font-bold">Recipes</span>
        </button>
        <button
          onClick={() => setActiveTab('nutricare')}
          className={`flex flex-col items-center gap-1 p-1 ${activeTab === 'nutricare' ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}
        >
          <Heart size={18} className={activeTab === 'nutricare' ? 'text-rose-500 fill-rose-500' : 'text-slate-400'} />
          <span className="font-sans text-[9px] font-bold">Nutri Care</span>
        </button>
        <button
          onClick={() => setActiveTab('shopping')}
          className={`flex flex-col items-center gap-1 p-1 ${activeTab === 'shopping' ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          <ShoppingBag size={18} />
          <span className="font-sans text-[9px] font-bold">Groceries</span>
        </button>
        <button
          onClick={() => setActiveTab('planner')}
          className={`flex flex-col items-center gap-1 p-1 ${activeTab === 'planner' ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          <Calendar size={18} />
          <span className="font-sans text-[9px] font-bold">Planner</span>
        </button>
      </div>



      {/* Recipe view details details overlay */}
      {selectedRecipe && (
        <RecipeDetailsModal 
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}

      {/* Database Backup & Restore Center Modal Overlay */}
      {isBackupModalOpen && (
        <div id="db-backup-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-scale-up">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 bg-emerald-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-800">
                <Database size={16} className="text-emerald-600 animate-pulse" />
                <h3 className="font-sans text-sm font-bold tracking-tight">Database Center</h3>
              </div>
              <button
                onClick={() => setIsBackupModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full transition cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              <p className="font-sans text-xs text-slate-500 leading-relaxed">
                Manage, export, or restore your customized culinary cookbook. Restoring a backup fully replaces your local cookbook database with the chosen setup.
              </p>

              {/* Database Metrics Stats */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <div>
                  <span className="block font-sans text-lg font-extrabold text-emerald-700 leading-none">
                    {recipes.length}
                  </span>
                  <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Recipes
                  </span>
                </div>
                <div>
                  <span className="block font-sans text-lg font-extrabold text-emerald-700 leading-none">
                    {mealPlans.filter(p => p.breakfast || p.lunch || p.dinner).length}
                  </span>
                  <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Scheduled
                  </span>
                </div>
                <div>
                  <span className="block font-sans text-lg font-extrabold text-emerald-700 leading-none">
                    {recipes.reduce((acc, r) => acc + (r.ingredients ? r.ingredients.length : 0), 0)}
                  </span>
                  <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Ingredients
                  </span>
                </div>
              </div>

              {/* Status alerts */}
              {backupSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 flex gap-2.5 items-start text-emerald-800 animate-slide-up">
                  <CheckCircle size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div className="font-sans text-[11px] leading-relaxed">
                    <span className="font-semibold">{backupSuccess}</span>
                  </div>
                </div>
              )}

              {backupError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 flex gap-2.5 items-start text-rose-800 animate-slide-up">
                  <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                  <div className="font-sans text-[11px] leading-relaxed">
                    <span className="font-semibold">{backupError}</span>
                  </div>
                </div>
              )}

              {/* Section 1: Export Data & Files */}
              <div className="space-y-4">
                <span className="block font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Step 1: Export / Download Project Files
                </span>
                
                {/* File 1: db.json */}
                <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="block font-sans text-xs font-bold text-slate-800 leading-tight">
                        Database Local Storage (db.json)
                      </span>
                      <span className="block font-sans text-[9px] text-slate-400 mt-0.5 leading-normal">
                        Contains your customized dinner courses, curated grocery items, lists, and timetables.
                      </span>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 font-sans text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider shrink-0">
                      Data
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleDownloadBackup}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-[10px] sm:text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <Download size={12} />
                      Download File
                    </button>
                    <button
                      onClick={handleCopyDbToClipboard}
                      disabled={copyingDb}
                      className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-sans text-[10px] sm:text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      {copyingDb ? (
                        <Loader2 size={12} className="animate-spin text-emerald-600" />
                      ) : (
                        <Copy size={12} className="text-slate-500" />
                      )}
                      {copyingDb ? 'Loading...' : 'Copy Raw JSON'}
                    </button>
                  </div>
                </div>

                {/* File 2: package-lock.json */}
                <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="block font-sans text-xs font-bold text-slate-800 leading-tight">
                        NPM Locks Configuration (package-lock.json)
                      </span>
                      <span className="block font-sans text-[9px] text-slate-400 mt-0.5 leading-normal">
                        Deterministic tree lock outlining standard external production dependencies.
                      </span>
                    </div>
                    <span className="bg-purple-100 text-purple-800 font-sans text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider shrink-0">
                      Config
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleDownloadPackageLock}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-sans text-[10px] sm:text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <Download size={12} />
                      Download File
                    </button>
                    <button
                      onClick={handleCopyLockToClipboard}
                      disabled={copyingLock}
                      className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-sans text-[10px] sm:text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      {copyingLock ? (
                        <Loader2 size={12} className="animate-spin text-purple-600" />
                      ) : (
                        <Copy size={12} className="text-slate-500" />
                      )}
                      {copyingLock ? 'Loading...' : 'Copy Raw Lock'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 2: Import / Restore Data */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="block font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Step 2: Install / Restore Backup
                </span>
                
                {/* Drag and Drop Zone Container */}
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('db-file-picker')?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition duration-200 cursor-pointer flex flex-col items-center justify-center gap-2 relative overflow-hidden ${
                    dragActive 
                      ? 'border-emerald-600 bg-emerald-50/70 scale-[0.99] shadow-xs' 
                      : 'border-slate-200 hover:border-emerald-500 hover:bg-slate-50/50'
                  }`}
                >
                  <input 
                    id="db-file-picker"
                    type="file" 
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden"
                  />
                  <div className={`p-2 rounded-lg ${dragActive ? 'bg-emerald-100' : 'bg-slate-100'} transition duration-200`}>
                    <FileJson size={18} className={dragActive ? 'text-emerald-700' : 'text-slate-500'} />
                  </div>
                  <div>
                    <span className="block font-sans text-xs font-bold text-slate-700">
                      {dragActive ? 'Drop your backup file now' : 'Select or drag backup file'}
                    </span>
                    <span className="block font-sans text-[10px] text-slate-400 mt-1">
                      Supports only raw .json files exported from CookBook
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsBackupModalOpen(false)}
                className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg font-sans text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
