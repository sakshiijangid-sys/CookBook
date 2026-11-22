import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Apple,
  ShieldAlert,
  History,
  Flame,
  Zap,
  RefreshCw,
  TrendingUp,
  Check,
  UtensilsCrossed,
  RotateCw,
} from 'lucide-react';
import { NutriScanRecord, NutritionData } from '../types';

interface NutriCareViewProps {
  savedScans: NutriScanRecord[];
  activeNutrition: NutritionData | null;
  onSelectNutrition: (data: NutritionData | null) => void;
  onSaveScan: (query: string, data: NutritionData) => Promise<void>;
  onClearHistory: () => Promise<void>;
  externalQuery?: string | null;
  onClearExternalQuery?: () => void;
}

const SUGGESTIONS = [
  { name: 'Fresh Garden Salad', icon: '🥗' },
  { name: 'Double Bacon Cheeseburger', icon: '🍔' },
  { name: 'Steamed Broccoli', icon: '🥦' },
  { name: 'Greek Yogurt Bowl', icon: '🥣' },
  { name: 'Sweet Red Tomato', icon: '🍅' },
  { name: 'Pepperoni Pizza Slice', icon: '🍕' },
];

export default function NutriCareView({
  savedScans,
  activeNutrition,
  onSelectNutrition,
  onSaveScan,
  onClearHistory,
  externalQuery,
  onClearExternalQuery,
}: NutriCareViewProps) {
  const [mealQuery, setMealQuery] = useState('');
  const [lastScannedQuery, setLastScannedQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  React.useEffect(() => {
    if (externalQuery && externalQuery.trim()) {
      const q = externalQuery.trim();
      onClearExternalQuery?.();
      handleAnalyze(q, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalQuery]);

  const handleAnalyze = async (queryText: string, forceRefresh = false) => {
    const trimmed = queryText.trim().slice(0, 200);
    if (!trimmed || loading) return;

    setErrorMsg('');

    // Check saved Firestore/session cache first unless user explicitly requested a re-scan
    if (!forceRefresh) {
      const cached = savedScans.find(
        (s) =>
          s.query.toLowerCase() === trimmed.toLowerCase() ||
          s.mealName.toLowerCase() === trimmed.toLowerCase()
      );
      if (cached) {
        onSelectNutrition(cached);
        setLastScannedQuery(cached.query || trimmed);
        setMealQuery('');
        return;
      }
    }

    setLoading(true);
    setLastScannedQuery(trimmed);

    try {
      const res = await fetch('/api/gemini/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealName: trimmed }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to retrieve nutritional analysis.');
      }

      const normalized: NutritionData = {
        mealName: String(payload.mealName || trimmed),
        isFruitOrVegetable: Boolean(payload.isFruitOrVegetable),
        calories: String(payload.calories || 'N/A'),
        carbohydrates: String(payload.carbohydrates || 'N/A'),
        proteins: String(payload.proteins || 'N/A'),
        fats: String(payload.fats || 'N/A'),
        vitamins: Array.isArray(payload.vitamins) ? payload.vitamins : [],
        minerals: Array.isArray(payload.minerals) ? payload.minerals : [],
        healthScore: Number.isFinite(Number(payload.healthScore))
          ? Math.max(0, Math.min(100, Math.round(Number(payload.healthScore))))
          : 50,
        isUnhealthy: Boolean(payload.isUnhealthy),
        unhealthyExplanation: String(payload.unhealthyExplanation || ''),
        healthyAlternatives: Array.isArray(payload.healthyAlternatives) ? payload.healthyAlternatives : [],
        funFact: String(payload.funFact || ''),
      };

      onSelectNutrition(normalized);
      await onSaveScan(trimmed, normalized);
      setMealQuery('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to analyze this meal right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (name: string) => {
    handleAnalyze(name, false);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Asymmetric Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-tr from-emerald-100/70 via-teal-50/50 to-slate-100 border border-emerald-200/60 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 text-center md:text-left max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-200 rounded-md font-sans text-[10px] font-bold text-emerald-800 tracking-wider uppercase">
            <Sparkles size={11} className="text-emerald-700" />
            NutriCare AI Engine
          </div>
          <h2 className="font-sans text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-tight">
            Transform Meals Into Health Insights
          </h2>
          <p className="font-sans text-xs text-slate-600 leading-relaxed">
            Enter any dish, ingredient, fruit, or vegetable. NutriCare decodes calories, macronutrients, vitamins, and alerts you with wholesome alternatives when a meal scores low.
          </p>
        </div>

        <div className="relative w-24 h-24 shrink-0 bg-white rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-center rotate-3">
          <div className="w-16 h-16 bg-emerald-50 rounded-xl flex items-center justify-center -rotate-3">
            <Apple size={36} className="text-emerald-600 stroke-[1.6]" />
          </div>
        </div>
      </div>

      {/* Asymmetric Split Workspace: 5 cols controls / 7 cols readout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-400">
                Nutritional Scan
              </h3>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAnalyze(mealQuery, false);
              }}
              className="relative flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="meal-nutrition-search"
                  type="text"
                  maxLength={200}
                  value={mealQuery}
                  onChange={(e) => setMealQuery(e.target.value)}
                  placeholder="Enter a meal, e.g., Avocado Toast, Pizza..."
                  className="w-full bg-slate-100/80 border border-transparent rounded-xl py-2.5 pl-10 pr-4 font-sans text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden transition-all"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !mealQuery.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-4 rounded-xl cursor-pointer font-sans font-semibold text-xs transition duration-200 disabled:opacity-50 flex items-center gap-1.5 leading-none shrink-0"
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
              <div className="font-sans text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start justify-between gap-2 leading-relaxed">
                <div className="flex items-start gap-2">
                  <ShieldAlert size={14} className="shrink-0 mt-0.5 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
                {lastScannedQuery && (
                  <button
                    type="button"
                    onClick={() => handleAnalyze(lastScannedQuery, true)}
                    className="text-[11px] font-bold text-rose-800 underline shrink-0 cursor-pointer"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}

            <div className="space-y-2">
              <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Popular Explorations
              </span>
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

          {savedScans.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <History size={13} className="text-slate-400" />
                  <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Recent Scan History
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="font-sans text-[10px] font-bold text-slate-400 hover:text-rose-600 hover:bg-slate-50 px-2 py-0.5 rounded cursor-pointer transition"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {savedScans.map((scan) => (
                  <button
                    key={scan.id}
                    type="button"
                    onClick={() => handleAnalyze(scan.mealName, false)}
                    disabled={loading}
                    className="group w-full flex items-center justify-between px-3 py-2 rounded-lg font-sans text-xs text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition cursor-pointer text-left font-medium"
                  >
                    <span className="truncate pr-2">{scan.mealName}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          scan.healthScore >= 80
                            ? 'bg-emerald-50 text-emerald-700'
                            : scan.healthScore >= 50
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {scan.healthScore}
                      </span>
                      <TrendingUp size={11} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Analysis Readout */}
        <div className="lg:col-span-7">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center flex flex-col items-center justify-center space-y-4 min-h-[360px]">
              <div className="relative flex items-center justify-center">
                <div className="absolute animate-ping rounded-full h-12 w-12 bg-emerald-100" />
                <div className="relative rounded-full h-14 w-14 bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <Apple size={28} className="text-emerald-600" />
                </div>
              </div>
              <div>
                <p className="font-sans text-sm font-bold text-slate-700">
                  Analyzing Nutritional Composition...
                </p>
                <p className="font-sans text-xs text-slate-400 mt-1">
                  Evaluating macros, micronutrients, and health profile
                </p>
              </div>
            </div>
          ) : activeNutrition ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-sans text-lg font-black text-slate-800 tracking-tight">
                        {activeNutrition.mealName}
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleAnalyze(activeNutrition.mealName, true)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                        title="Re-scan fresh nutritional data"
                      >
                        <RotateCw size={13} />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {activeNutrition.isFruitOrVegetable ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-800 font-sans text-[10px] font-bold px-2.5 py-0.5 rounded-md">
                          🍏 Botanical Fruit / Vegetable
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-700 font-sans text-[10px] font-bold px-2.5 py-0.5 rounded-md">
                          🍲 Prepared Culinary Dish
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-sans text-[10px] uppercase font-bold text-slate-400 block tracking-wider leading-none">
                        Health Score
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 font-medium block">
                        Overall density
                      </span>
                    </div>
                    <div
                      className={`w-14 h-14 rounded-full border-4 flex flex-col items-center justify-center shadow-xs ${
                        activeNutrition.healthScore >= 80
                          ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800'
                          : activeNutrition.healthScore >= 50
                            ? 'border-amber-400 bg-amber-50/50 text-amber-800'
                            : 'border-rose-400 bg-rose-50/50 text-rose-800'
                      }`}
                    >
                      <span className="font-sans text-base font-black leading-none">
                        {activeNutrition.healthScore}
                      </span>
                      <span className="text-[7px] font-bold leading-none uppercase mt-0.5">/100</span>
                    </div>
                  </div>
                </div>

                {/* Macros Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3.5 rounded-xl bg-orange-50/50 border border-orange-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-700 shrink-0">
                      <Flame size={15} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                        Calories
                      </span>
                      <span className="font-sans text-xs font-bold text-slate-800 truncate block">
                        {activeNutrition.calories}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-cyan-50/50 border border-cyan-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold font-sans text-[11px] shrink-0">
                      Cb
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                        Carbs
                      </span>
                      <span className="font-sans text-xs font-bold text-slate-800 truncate block">
                        {activeNutrition.carbohydrates}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                      <Zap size={14} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                        Proteins
                      </span>
                      <span className="font-sans text-xs font-bold text-slate-800 truncate block">
                        {activeNutrition.proteins}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold font-sans text-[11px] shrink-0">
                      Ft
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                        Fats
                      </span>
                      <span className="font-sans text-xs font-bold text-slate-800 truncate block">
                        {activeNutrition.fats}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Micronutrients */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-sans text-[9px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                      Vitamins Pack
                    </span>
                    {activeNutrition.vitamins.length > 0 ? (
                      <ul className="space-y-1.5">
                        {activeNutrition.vitamins.map((v, i) => (
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
                    <span className="font-sans text-[9px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                      Essential Minerals
                    </span>
                    {activeNutrition.minerals.length > 0 ? (
                      <ul className="space-y-1.5">
                        {activeNutrition.minerals.map((m, i) => (
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

                {activeNutrition.funFact && (
                  <div className="p-4 bg-amber-50/40 border border-amber-200/60 rounded-xl flex gap-3">
                    <span className="text-lg leading-none shrink-0 text-amber-500">💡</span>
                    <div>
                      <span className="font-sans text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                        Nutrition Fun Fact
                      </span>
                      <p className="font-sans text-xs text-slate-600 italic mt-0.5 leading-relaxed">
                        &ldquo;{activeNutrition.funFact}&rdquo;
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {activeNutrition.isUnhealthy && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 space-y-4 shadow-xs animate-fade-in">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
                      <ShieldAlert size={18} />
                    </div>
                    <div>
                      <h4 className="font-sans text-sm font-extrabold text-rose-900">
                        Health Alert: Dietary Risks Detected
                      </h4>
                      <p className="font-sans text-xs text-rose-700 leading-relaxed mt-0.5">
                        {activeNutrition.unhealthyExplanation ||
                          'This dish contains elevated processed sugars, sodium, or saturated fats.'}
                      </p>
                    </div>
                  </div>

                  {activeNutrition.healthyAlternatives && activeNutrition.healthyAlternatives.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-rose-800 block">
                        Wholesome Alternatives
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeNutrition.healthyAlternatives.map((alt, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleAnalyze(alt.name, false)}
                            className="text-left bg-white border border-rose-100 rounded-xl p-3.5 shadow-xs hover:border-emerald-300 transition cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="p-0.5 bg-emerald-50 rounded-full text-emerald-700">
                                <Check size={11} strokeWidth={3} />
                              </span>
                              <span className="font-sans text-xs font-bold text-slate-800">
                                {alt.name}
                              </span>
                            </div>
                            <p className="font-sans text-[11px] text-slate-500 leading-relaxed mt-1">
                              {alt.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center flex flex-col items-center justify-center space-y-3 min-h-[360px]">
              <UtensilsCrossed size={36} className="text-slate-300" />
              <div>
                <p className="font-sans text-sm font-bold text-slate-700">
                  Ready for Nutritional Scanning
                </p>
                <p className="font-sans text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Type a dish on the left or pick a popular exploration to inspect macros, vitamins, and health scores.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
