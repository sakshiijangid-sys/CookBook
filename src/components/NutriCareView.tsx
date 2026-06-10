import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  Apple, 
  Heart, 
  ShieldAlert, 
  History, 
  Flame, 
  Zap, 
  RefreshCw, 
  TrendingUp, 
  Check, 
  Info, 
  UtensilsCrossed 
} from 'lucide-react';

interface HealthyAlternative {
  name: string;
  description: string;
}

interface NutritionData {
  mealName: string;
  isFruitOrVegetable: boolean;
  calories: string;
  carbohydrates: string;
  proteins: string;
  fats: string;
  vitamins: string[];
  minerals: string[];
  healthScore: number;
  isUnhealthy: boolean;
  unhealthyExplanation: string;
  healthyAlternatives: HealthyAlternative[];
  funFact: string;
}

export default function NutriCareView() {
  const [mealQuery, setMealQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [nutrition, setNutrition] = useState<NutritionData | null>(null);
  
  // High fidelity suggestion chips for instant exploration
  const SUGGESTIONS = [
    { name: 'Fresh Salad', icon: '🥗' },
    { name: 'Double Bacon Cheeseburger', icon: '🍔' },
    { name: 'Steamed Broccoli', icon: '🥦' },
    { name: 'Greek Yogurt Bowl', icon: '🥣' },
    { name: 'Sweet Red Tomato', icon: '🍅' },
    { name: 'Slice of Pepperoni Pizza', icon: '🍕' }
  ];

  // Persistent Search History logic
  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('nutricare_history');
    return saved ? JSON.parse(saved) : ['Fresh Salad', 'Double Bacon Cheeseburger'];
  });

  useEffect(() => {
    localStorage.setItem('nutricare_history', JSON.stringify(history));
  }, [history]);

  // Query Nutrition stats from Express + Gemini Proxy API
  const handleAnalyze = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) return;

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/gemini/nutrition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mealName: trimmed })
      });

      if (!res.ok) {
        throw new Error('Failed to retrieve nutritional analysis');
      }

      const dataResponse: NutritionData = await res.json();
      setNutrition(dataResponse);

      // Append code to history cleanly, avoiding duplicate adjacents
      setHistory(prev => {
        const filtered = prev.filter(item => item.toLowerCase() !== trimmed.toLowerCase());
        return [dataResponse.mealName, ...filtered].slice(0, 8); // Hold up to 8 items max
      });
      setMealQuery('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'There was an issue contacting the Gemini analysis engine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (name: string) => {
    setMealQuery(name);
    handleAnalyze(name);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('nutricare_history');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Dynamic Splash Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-tr from-emerald-100/60 via-teal-50/40 to-cyan-100/30 border border-emerald-200/50 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 text-center md:text-left max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-200 rounded-full font-sans text-[10px] font-bold text-emerald-800 tracking-wide uppercase">
            <Sparkles size={11} className="text-emerald-700 animate-pulse" />
            Nutri Care AI Engine
          </div>
          <h2 className="font-sans text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-none">
            Transform Meals Into Health Insights
          </h2>
          <p className="font-sans text-xs text-slate-600 leading-relaxed">
            Enter any dish, ingredient, fruit, or vegetable. Our Gemini-guided system decodes calories, vital vitamins, carbohydrates, proteins, and alerts you with wholesome alternatives if a meal is unhealthy.
          </p>
        </div>
        
        {/* Animated Accent Plate */}
        <div className="relative w-28 h-28 shrink-0 bg-white rounded-full border border-emerald-100 shadow-md flex items-center justify-center animate-bounce-slow">
          <div className="absolute inset-2 bg-emerald-50 rounded-full flex items-center justify-center">
            <Apple size={44} className="text-emerald-600 stroke-[1.5]" />
          </div>
          <span className="absolute bottom-1 right-1 text-base bg-emerald-100 border border-white rounded-full p-1 leading-none shadow-xs">🥗</span>
        </div>
      </div>

      {/* Interactive Main Body Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Search and Control Side - Col Span 5 */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-5">
            <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-400">Nutritional Scan</h3>
            
            {/* Input Form Box */}
            <form onSubmit={(e) => { e.preventDefault(); handleAnalyze(mealQuery); }} className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="meal-nutrition-search"
                  type="text"
                  value={mealQuery}
                  onChange={(e) => setMealQuery(e.target.value)}
                  placeholder="Enter a meal, e.g., Avocado Toast, Pizza..."
                  className="w-full bg-slate-100/75 border-none rounded-xl py-2.5 pl-10 pr-4 font-sans text-xs text-slate-800 placeholder-slate-400 focus:bg-slate-100/90 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !mealQuery.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 rounded-xl cursor-pointer font-sans font-semibold text-xs transition duration-200 disabled:opacity-50 flex items-center gap-1 px-4 leading-none"
              >
                {loading ? (
                  <RefreshCw size={13} className="animate-spin text-white" />
                ) : (
                  <>
                    <span>Scan</span>
                    <Sparkles size={11} />
                  </>
                )}
              </button>
            </form>

            {errorMsg && (
              <div className="font-sans text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start gap-1.5 leading-relaxed">
                <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Quick Suggestion Chips */}
            <div className="space-y-2">
              <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Popular Explorations</span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => handleChipClick(s.name)}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 px-3 py-1.5 rounded-lg font-sans text-xs text-slate-600 hover:text-emerald-800 transition cursor-pointer disabled:opacity-60"
                  >
                    <span>{s.icon}</span>
                    <span className="font-medium">{s.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Search History Sidebar */}
          {history.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <History size={13} className="text-slate-400" />
                  <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400">Search History</span>
                </div>
                <button
                  onClick={clearHistory}
                  className="font-sans text-[9px] font-bold text-slate-400 hover:text-rose-500 hover:bg-slate-50 px-2 py-0.5 rounded cursor-pointer transition"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto scrollbar-thin">
                {history.map((h, i) => (
                  <button
                    key={`${h}-${i}`}
                    onClick={() => handleChipClick(h)}
                    disabled={loading}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-sans text-xs text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition cursor-pointer text-left font-medium"
                  >
                    <span>{h}</span>
                    <TrendingUp size={11} className="text-slate-300 group-hover:text-emerald-500" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Dashboard Analysis Display Panel - Col Span 7 */}
        <div className="lg:col-span-7">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center flex flex-col items-center justify-center space-y-4 min-h-[350px]">
              <div className="relative flex items-center justify-center">
                <div className="absolute animate-ping rounded-full h-12 w-12 bg-emerald-100" />
                <div className="relative rounded-full h-14 w-14 bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <Apple size={28} className="text-emerald-600 animate-spin" />
                </div>
              </div>
              <div>
                <p className="font-sans text-sm font-bold text-slate-700">Analyzing Nutritional Composition...</p>
                <p className="font-sans text-xs text-slate-400 mt-1">Consulting Gemini medical database dictionary</p>
              </div>
            </div>
          ) : nutrition ? (
            <div className="space-y-6">
              
              {/* Primary analysis summary card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
                
                {/* Name bar & Type designation */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-sans text-lg font-black text-slate-800 tracking-tight">
                      {nutrition.mealName}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      {nutrition.isFruitOrVegetable ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-800 font-sans text-[10px] font-bold px-2 py-0.5 rounded-full">
                          🍏 Botanical Fruit / Vegetable
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-250 text-slate-700 font-sans text-[10px] font-bold px-2 py-0.5 rounded-full">
                          🍲 Prepared Culinary Dish
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Health Score Dial visual representation */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-sans text-[10px] uppercase font-bold text-slate-400 block tracking-wider leading-none">Health Score</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 font-medium">Ranked overall density</span>
                    </div>
                    <div className={`w-14 h-14 rounded-full border-4 flex flex-col items-center justify-center shadow-xs ${
                      nutrition.healthScore >= 80 
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800' 
                        : nutrition.healthScore >= 50 
                          ? 'border-amber-400 bg-amber-50/50 text-amber-800'
                          : 'border-rose-400 bg-rose-50/50 text-rose-800'
                    }`}>
                      <span className="font-sans text-base font-black leading-none">{nutrition.healthScore}</span>
                      <span className="text-[7px] font-bold leading-none uppercase mt-0.5">/100</span>
                    </div>
                  </div>
                </div>

                {/* Macro metrics visual gauges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Calories Indicator */}
                  <div className="p-3.5 rounded-xl bg-orange-50/50 border border-orange-100/50 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-700">
                      <Flame size={15} />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Calories</span>
                      <span className="font-sans text-xs font-bold text-slate-800">{nutrition.calories}</span>
                    </div>
                  </div>

                  {/* Carbohydrates Indicator */}
                  <div className="p-3.5 rounded-xl bg-cyan-50/50 border border-cyan-100/50 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold font-sans text-[11px]">
                      Cb
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Carbs</span>
                      <span className="font-sans text-xs font-bold text-slate-800">{nutrition.carbohydrates}</span>
                    </div>
                  </div>

                  {/* Proteins Indicator */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100/50 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                      <Zap size={14} />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Proteins</span>
                      <span className="font-sans text-xs font-bold text-slate-800">{nutrition.proteins}</span>
                    </div>
                  </div>

                  {/* Fats Indicator */}
                  <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100/50 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold font-sans text-[11px]">
                      Ft
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Fats</span>
                      <span className="font-sans text-xs font-bold text-slate-800">{nutrition.fats}</span>
                    </div>
                  </div>
                </div>

                {/* Micronutrients breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-sans text-[9px] uppercase font-bold text-slate-400 tracking-wider block mb-2">Vitamins Pack</span>
                    {nutrition.vitamins.length > 0 ? (
                      <ul className="space-y-1.5">
                        {nutrition.vitamins.map((v, i) => (
                          <li key={i} className="flex items-center gap-2 font-sans text-xs text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span>{v}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="font-sans text-xs text-slate-400 italic">No significant vitamins logged.</p>
                    )}
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-sans text-[9px] uppercase font-bold text-slate-400 tracking-wider block mb-2">Essential Minerals</span>
                    {nutrition.minerals.length > 0 ? (
                      <ul className="space-y-1.5">
                        {nutrition.minerals.map((m, i) => (
                          <li key={i} className="flex items-center gap-2 font-sans text-xs text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="font-sans text-xs text-slate-400 italic">No significant minerals logged.</p>
                    )}
                  </div>
                </div>

                {/* Fun Facts component */}
                {nutrition.funFact && (
                  <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-xl flex gap-3">
                    <span className="text-lg leading-none shrink-0 text-amber-500">💡</span>
                    <div>
                      <span className="font-sans text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Nutrition Fun Fact</span>
                      <p className="font-sans text-xs text-slate-600 italic mt-0.5 leading-relaxed">"{nutrition.funFact}"</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Unhealthy Alerts and Replacements Section */}
              {nutrition.isUnhealthy && (
                <div className="rounded-2xl border border-rose-250 bg-rose-50/45 p-6 space-y-4 shadow-xs animate-fade-in">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
                      <ShieldAlert size={18} />
                    </div>
                    <div>
                      <h4 className="font-sans text-sm font-extrabold text-rose-900">Health Alert: Dietary Risks Detected</h4>
                      <p className="font-sans text-xs text-rose-700 leading-relaxed mt-0.5">
                        {nutrition.unhealthyExplanation || 'This dish is flagged as unhealthy containing elevated processed sugars, high sodium configurations, or calorie loads with heavy trans oils.'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Clean Alternatives list */}
                  {nutrition.healthyAlternatives && nutrition.healthyAlternatives.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-rose-800 block">
                        Superfood alternatives for replacement:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {nutrition.healthyAlternatives.map((alt, idx) => (
                          <div key={idx} className="bg-white border border-rose-100 rounded-xl p-3.5 shadow-2xs hover:border-emerald-200 transition">
                            <div className="flex items-center gap-1.5">
                              <span className="p-0.5 bg-emerald-50 rounded-full text-emerald-700">
                                <Check size={11} strokeWidth={3} />
                              </span>
                              <span className="font-sans text-xs font-bold text-slate-800">{alt.name}</span>
                            </div>
                            <p className="font-sans text-[11px] text-slate-500 leading-relaxed mt-1">
                              {alt.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            /* Standby view */
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center flex flex-col items-center justify-center space-y-3 min-h-[350px]">
              <UtensilsCrossed size={36} className="text-slate-300" />
              <div>
                <p className="font-sans text-sm font-bold text-slate-700">Ready for Nutritional Scanning</p>
                <p className="font-sans text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Type a dish above or tap on one of the popular items to see interactive nutrition indexes and health ratings.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
