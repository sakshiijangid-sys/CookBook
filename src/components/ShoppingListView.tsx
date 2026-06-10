import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Recipe, MealPlan } from '../types';
import { ShoppingBag, CheckSquare, Square, RefreshCw, HelpCircle, DollarSign, Sparkles, ChevronDown, Check, Plus, Trash2 } from 'lucide-react';
import { CurrencyType, formatPrice, CURRENCY_DETAILS } from '../utils/currency';

interface ShoppingListViewProps {
  recipes: Recipe[];
  mealPlans: MealPlan[];
  currency: CurrencyType;
  exchangeRates: Record<string, number>;
  setCurrency: (currency: CurrencyType) => void;
}

interface GroupedIngredient {
  key: string;
  name: string;
  items: { amount: string; unit: string; recipeName: string }[];
}

interface PriceState {
  price?: number;
  explanation?: string;
  loading?: boolean;
}

interface CustomIngredient {
  key: string;
  name: string;
  amount: string;
  unit: string;
}

export default function ShoppingListView({ recipes, mealPlans, currency, exchangeRates, setCurrency }: ShoppingListViewProps) {
  const [checkedKeys, setCheckedKeys] = useState<{ [key: string]: boolean }>({});
  const [buyQuantities, setBuyQuantities] = useState<{ [key: string]: { amount: string; unit: string } }>({});
  const [prices, setPrices] = useState<{ [key: string]: PriceState }>({});
  const [isPricingAll, setIsPricingAll] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const requestedKeysRef = useRef<Record<string, boolean>>({});

  const [customItems, setCustomItems] = useState<CustomIngredient[]>(() => {
    try {
      const saved = localStorage.getItem('cookbook_custom_shopping_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cookbook_custom_shopping_items', JSON.stringify(customItems));
  }, [customItems]);

  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('pieces');

  const addCustomItem = (name: string, amount: string, unit: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const sanitizedKey = 'custom_' + trimmed.toLowerCase().replace(/\s+/g, '_');
    
    if (customItems.some(item => item.key === sanitizedKey)) {
      alert(`"${trimmed}" is already on your grocery list!`);
      return;
    }

    const newItem: CustomIngredient = {
      key: sanitizedKey,
      name: trimmed,
      amount: amount || '1',
      unit: unit || 'pieces'
    };

    setCustomItems(prev => [...prev, newItem]);
    setBuyQuantities(prev => ({
      ...prev,
      [sanitizedKey]: {
        amount: amount || '1',
        unit: unit || 'pieces'
      }
    }));

    // Trigger price fetch automatically
    fetchPrice(sanitizedKey, trimmed, amount || '1', unit || 'pieces');
  };

  const deleteCustomItem = (key: string) => {
    setCustomItems(prev => prev.filter(item => item.key !== key));
  };

  const consolidatedIngredients = useMemo(() => {
    const list: GroupedIngredient[] = [];
    const hash: { [name: string]: GroupedIngredient } = {};

    // Gather all recipe IDs currently planned in the 7 days
    const plannedRecipeIds: string[] = [];
    mealPlans.forEach(plan => {
      if (plan.breakfast) plannedRecipeIds.push(plan.breakfast);
      if (plan.lunch) plannedRecipeIds.push(plan.lunch);
      if (plan.dinner) plannedRecipeIds.push(plan.dinner);
    });

    if (plannedRecipeIds.length === 0) {
      return [];
    }

    // Traverse details
    plannedRecipeIds.forEach(recipeId => {
      const recipe = recipes.find(r => r._id === recipeId);
      if (!recipe) return;

      recipe.ingredients.forEach(ing => {
        const normalizedName = ing.name.trim().toLowerCase();
        
        if (!hash[normalizedName]) {
          hash[normalizedName] = {
            key: normalizedName,
            name: ing.name.trim(),
            items: []
          };
          list.push(hash[normalizedName]);
        }
        
        hash[normalizedName].items.push({
          amount: ing.amount,
          unit: ing.unit,
          recipeName: recipe.name
        });
      });
    });

    // Consolidate items by recipeName so that each recipe is listed only once per ingredient
    list.forEach(grouped => {
      const recipeMap: { [recipeName: string]: { amount: string; unit: string }[] } = {};
      grouped.items.forEach(item => {
        if (!recipeMap[item.recipeName]) {
          recipeMap[item.recipeName] = [];
        }
        recipeMap[item.recipeName].push({ amount: item.amount, unit: item.unit });
      });

      const consolidatedItems: { amount: string; unit: string; recipeName: string }[] = [];
      Object.entries(recipeMap).forEach(([rName, occurrences]) => {
        const unitGroups: { [unit: string]: number[] } = {};
        const nonNumericOccurrences: string[] = [];

        occurrences.forEach(occ => {
          const num = parseFloat(occ.amount);
          if (!isNaN(num)) {
            const uKey = occ.unit.trim().toLowerCase();
            if (!unitGroups[uKey]) unitGroups[uKey] = [];
            unitGroups[uKey].push(num);
          } else {
            const trimmedAmount = occ.amount.trim();
            const trimmedUnit = occ.unit.trim();
            if (trimmedAmount && trimmedUnit) {
              nonNumericOccurrences.push(`${trimmedAmount} ${trimmedUnit}`);
            } else if (trimmedAmount || trimmedUnit) {
              nonNumericOccurrences.push(trimmedAmount || trimmedUnit);
            }
          }
        });

        // If there's only one unit group and no non-numeric occurrences, keep format clean
        if (Object.keys(unitGroups).length === 1 && nonNumericOccurrences.length === 0) {
          const uKey = Object.keys(unitGroups)[0];
          const sum = unitGroups[uKey].reduce((s, v) => s + v, 0);
          const rounded = Math.round(sum * 100) / 100;
          const origUnit = occurrences.find(o => o.unit.trim().toLowerCase() === uKey)?.unit || uKey;
          consolidatedItems.push({
            amount: rounded.toString(),
            unit: origUnit,
            recipeName: rName
          });
        } else {
          const parts: string[] = [];
          Object.entries(unitGroups).forEach(([uKey, values]) => {
            const sum = values.reduce((s, v) => s + v, 0);
            const origUnit = occurrences.find(o => o.unit.trim().toLowerCase() === uKey)?.unit || uKey;
            const rounded = Math.round(sum * 100) / 100;
            parts.push(`${rounded}${origUnit ? ' ' + origUnit : ''}`);
          });
          nonNumericOccurrences.forEach(str => parts.push(str));
          consolidatedItems.push({
            amount: parts.join(' + '),
            unit: '',
            recipeName: rName
          });
        }
      });

      grouped.items = consolidatedItems;
    });

    // Sort alphabetically
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [recipes, mealPlans]);

  // Sync and pre-populate editable buy fields based on aggregate requirement
  useEffect(() => {
    setBuyQuantities(prev => {
      let updated = false;
      const next = { ...prev };
      consolidatedIngredients.forEach(grouped => {
        if (!next[grouped.key]) {
          // Calculate smart aggregate
          const totalUnitGroups: { [unit: string]: number[] } = {};
          const totalNonNumeric: string[] = [];
          grouped.items.forEach(item => {
            const num = parseFloat(item.amount);
            if (!isNaN(num)) {
              const uKey = item.unit.trim().toLowerCase();
              if (!totalUnitGroups[uKey]) totalUnitGroups[uKey] = [];
              totalUnitGroups[uKey].push(num);
            } else {
              totalNonNumeric.push(`${item.amount} ${item.unit}`);
            }
          });

          let finalAmt = '';
          let finalUnit = '';

          const uKeys = Object.keys(totalUnitGroups);
          if (uKeys.length > 0) {
            const uKey = uKeys[0];
            const sum = totalUnitGroups[uKey].reduce((s, v) => s + v, 0);
            finalAmt = String(Math.round(sum * 100) / 100);
            finalUnit = grouped.items.find(i => i.unit.trim().toLowerCase() === uKey)?.unit || uKey;
          } else if (grouped.items.length > 0) {
            finalAmt = grouped.items[0].amount;
            finalUnit = grouped.items[0].unit;
          }

          next[grouped.key] = {
            amount: finalAmt || '1',
            unit: finalUnit || 'unit'
          };
          updated = true;
        }
      });
      return updated ? next : prev;
    });
  }, [consolidatedIngredients]);

  // Pricing trigger to hit Gemini pricing API
  const fetchPrice = async (key: string, name: string, quantity: string, unit: string) => {
    if (!quantity || isNaN(parseFloat(quantity))) return;
    setPrices(prev => ({
      ...prev,
      [key]: { ...prev[key], loading: true }
    }));
    try {
      const res = await fetch('/api/gemini/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, quantity, unit })
      });
      if (!res.ok) throw new Error('Failed to fetch pricing estimation');
      const data = await res.json();
      setPrices(prev => ({
        ...prev,
        [key]: {
          price: data.estimatedPriceUSD,
          explanation: data.explanation,
          loading: false
        }
      }));
    } catch (err) {
      console.error(err);
      setPrices(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          loading: false
        }
      }));
    }
  };

  // Pricing trigger to hit Gemini pricing API in a single batch request
  const fetchPricesBatch = async (itemsToRequest: { key: string; name: string; quantity: string; unit: string }[]) => {
    if (itemsToRequest.length === 0) return;
    
    // Set loading state for all keys being fetched
    setPrices(prev => {
      const next = { ...prev };
      itemsToRequest.forEach(item => {
        next[item.key] = { ...next[item.key], loading: true };
      });
      return next;
    });

    try {
      const res = await fetch('/api/gemini/price/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToRequest })
      });
      if (!res.ok) throw new Error('Failed to fetch pricing estimation in batch');
      const data = await res.json();
      
      setPrices(prev => {
        const next = { ...prev };
        // Set all initiated requested items loading to false first to ensure no infinitely stuck items
        itemsToRequest.forEach(item => {
          next[item.key] = {
            ...next[item.key],
            loading: false
          };
        });

        if (Array.isArray(data.items)) {
          data.items.forEach((item: any) => {
            next[item.key] = {
              price: item.estimatedPriceUSD,
              explanation: item.explanation,
              loading: false
            };
          });
        }
        return next;
      });
    } catch (err) {
      console.error(err);
      setPrices(prev => {
        const next = { ...prev };
        itemsToRequest.forEach(item => {
          next[item.key] = { ...next[item.key], loading: false };
        });
        return next;
      });
    }
  };

  // Perform bulk market auto-estimation for visible items
  const autoPriceAll = async () => {
    if (isPricingAll || (consolidatedIngredients.length === 0 && customItems.length === 0)) return;
    setIsPricingAll(true);

    const itemsToRequest = [
      ...consolidatedIngredients.map(grouped => {
        const buyQty = buyQuantities[grouped.key] || { amount: '1', unit: 'unit' };
        return {
          key: grouped.key,
          name: grouped.name,
          quantity: buyQty.amount,
          unit: buyQty.unit
        };
      }),
      ...customItems.map(item => {
        const buyQty = buyQuantities[item.key] || { amount: item.amount, unit: item.unit };
        return {
          key: item.key,
          name: item.name,
          quantity: buyQty.amount,
          unit: buyQty.unit
        };
      })
    ];

    await fetchPricesBatch(itemsToRequest);
    setIsPricingAll(false);
  };

  // Autostart pricing on first load/populate of ingredients using the high-performance batch API
  useEffect(() => {
    const allItemsToLoad = [
      ...consolidatedIngredients,
      ...customItems.map(item => ({
        key: item.key,
        name: item.name,
        items: []
      }))
    ];

    if (allItemsToLoad.length > 0 && Object.keys(buyQuantities).length >= allItemsToLoad.length) {
      // Find what ingredients are missing pricing state and have not been requested yet
      const missingKeys = allItemsToLoad.filter(
        grouped => !prices[grouped.key] && !requestedKeysRef.current[grouped.key]
      );
      
      if (missingKeys.length > 0) {
        // Mark as requested immediately to prevent multiple fast renders triggering requests
        missingKeys.forEach(grouped => {
          requestedKeysRef.current[grouped.key] = true;
        });

        const itemsToRequest = missingKeys.map(grouped => {
          const buyQty = buyQuantities[grouped.key] || { amount: '1', unit: 'unit' };
          return {
            key: grouped.key,
            name: grouped.name,
            quantity: buyQty.amount,
            unit: buyQty.unit
          };
        });
        fetchPricesBatch(itemsToRequest);
      }
    }
    // We intentionally omit prices dependency to prevent an infinite recursive-fetch loop
  }, [consolidatedIngredients, customItems, buyQuantities]);

  const toggleCheck = (key: string) => {
    setCheckedKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const clearChecked = () => {
    setCheckedKeys({});
  };

  const handleInputChange = (key: string, amount: string, unit: string) => {
    setBuyQuantities(prev => ({
      ...prev,
      [key]: { amount, unit }
    }));
  };

  const handleInputBlur = (key: string, name: string, amount: string, unit: string) => {
    fetchPrice(key, name, amount, unit);
  };

  const checkedCount = Object.values(checkedKeys).filter(Boolean).length;

  const totalBasketCost = useMemo(() => {
    let sum = 0;
    Object.keys(prices).forEach(key => {
      if (checkedKeys[key]) {
        const val = prices[key];
        if (val && typeof val.price === 'number') {
          sum += val.price;
        }
      }
    });
    return Math.round(sum * 100) / 100;
  }, [prices, checkedKeys]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-sans text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <ShoppingBag size={16} className="text-emerald-600" />
            Grocery List
          </h3>
          
          <div className="relative mt-2">
            <button
              id="currency-converter-btn"
              onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:border-emerald-200 px-3 py-1.5 rounded-lg font-sans text-xs font-bold text-slate-700 transition cursor-pointer shadow-xs"
            >
              <span className="text-xs shrink-0">{CURRENCY_DETAILS[currency]?.flag}</span>
              <span>{CURRENCY_DETAILS[currency]?.label || currency}</span>
              <ChevronDown size={11} className={`text-slate-400 transition-transform duration-200 shrink-0 ${isCurrencyDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCurrencyDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsCurrencyDropdownOpen(false)} 
                />
                <div className="absolute left-0 mt-1.5 w-52 rounded-xl border border-slate-200 bg-white p-1 shadow-lg z-50 animate-fade-in">
                  <div className="px-2.5 py-1.5 border-b border-slate-100 text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                    Select Currency
                  </div>
                  <div className="space-y-0.5 max-h-60 overflow-y-auto mt-1 scrollbar-thin">
                    {(Object.keys(CURRENCY_DETAILS) as CurrencyType[]).map((key) => {
                      const config = CURRENCY_DETAILS[key];
                      const isSelected = key === currency;
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            setCurrency(key);
                            setIsCurrencyDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left font-sans text-xs transition-colors cursor-pointer ${
                            isSelected 
                              ? 'bg-emerald-50 text-emerald-800 font-semibold' 
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs">{config.flag}</span>
                            <div>
                              <div className="font-bold leading-none">{config.label}</div>
                              <div className="text-[9px] text-slate-400 mt-0.5 font-normal">{config.name}</div>
                            </div>
                          </div>
                          {isSelected && <Check size={11} className="text-emerald-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        {(consolidatedIngredients.length > 0 || customItems.length > 0) && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={autoPriceAll}
              disabled={isPricingAll}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700/20 px-3 py-1.5 rounded-lg font-sans text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={11} className={isPricingAll ? "animate-spin" : ""} />
              {isPricingAll ? "Updating Market..." : "Update Market Prices"}
            </button>
            <button
              onClick={clearChecked}
              className="flex items-center gap-1 hover:bg-emerald-100/50 bg-white/60 border border-emerald-200/50 px-3 py-1.5 rounded-lg font-sans text-xs font-semibold text-slate-700 transition cursor-pointer"
            >
              <RefreshCw size={11} className="text-emerald-600" />
              Reset Checks
            </button>
          </div>
        )}
      </div>

      {/* Quick-Add Custom Sourcing Form */}
      <div className="max-w-2xl mx-auto space-y-4">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (newItemName.trim()) {
              addCustomItem(newItemName, newItemAmount, newItemUnit);
              setNewItemName('');
              setNewItemAmount('1');
              setNewItemUnit('pieces');
            }
          }}
          className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row items-end gap-3"
        >
          <div className="flex-1 w-full space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Extra Sourcing Item / Custom Ingredient
            </span>
            <div className="relative">
              <input 
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g. Fresh Milk, Brown Eggs, Olive Oil..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>
          </div>
          
          <div className="w-full sm:w-24 space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Amount
            </span>
            <input 
              type="text"
              value={newItemAmount}
              onChange={(e) => setNewItemAmount(e.target.value)}
              placeholder="1"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-center text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>

          <div className="w-full sm:w-28 space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Unit
            </span>
            <input 
              type="text"
              value={newItemUnit}
              onChange={(e) => setNewItemUnit(e.target.value)}
              placeholder="pieces"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-center text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer h-9 shrink-0 animate-scale-up"
          >
            <Plus size={14} />
            Add Item
          </button>
        </form>

        {consolidatedIngredients.length === 0 && customItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-12 px-4 text-center">
            <ShoppingBag size={36} className="text-slate-300 mb-3 animate-bounce" />
            <p className="font-sans text-sm font-bold text-slate-700">No Ingredients to Buy Yet</p>
            <p className="font-sans text-xs text-slate-400 mt-1 max-w-sm">
              Configure meals inside the Weekly Planner, or use the form above to add custom standalone ingredients directly!
            </p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            
            {/* Total Estimated Basket summary section */}
            {totalBasketCost > 0 && (
              <div className="flex items-center justify-between bg-emerald-50/35 p-4 rounded-2xl border border-emerald-100 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="bg-emerald-100 p-2 rounded-xl text-emerald-700 shrink-0">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Estimated Basket Cost</span>
                    <span className="text-[10px] text-slate-500">Based on market prices of checked ingredients</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-400 block">Total Est.</span>
                  <span className="font-mono text-lg font-black text-emerald-800">
                    {formatPrice(totalBasketCost, currency, exchangeRates)}
                  </span>
                </div>
              </div>
            )}

            {/* Main List Container */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-6">
              
              {/* SECTION 1: Dynamic Recipe Ingredients */}
              {consolidatedIngredients.length > 0 && (
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                        Recipe-Bound Ingredients
                      </span>
                      <span className="text-[10px] bg-emerald-100/60 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        {consolidatedIngredients.length}
                      </span>
                    </div>
                    <span className="font-sans text-[11px] font-semibold text-slate-500">
                      {consolidatedIngredients.filter(grouped => checkedKeys[grouped.key]).length} / {consolidatedIngredients.length} Checked
                    </span>
                  </div>

                  <div className="space-y-3 pr-1">
                    {consolidatedIngredients.map((grouped) => {
                      const isChecked = !!checkedKeys[grouped.key];
                      const buyQty = buyQuantities[grouped.key] || { amount: '1', unit: 'unit' };
                      const pState = prices[grouped.key];

                      // Calculate aggregate requirement to display as reference
                      const totalUnitGroups: { [unit: string]: number[] } = {};
                      const totalNonNumeric: string[] = [];
                      grouped.items.forEach(item => {
                        const num = parseFloat(item.amount);
                        if (!isNaN(num)) {
                          const uKey = item.unit.trim().toLowerCase();
                          if (!totalUnitGroups[uKey]) totalUnitGroups[uKey] = [];
                          totalUnitGroups[uKey].push(num);
                        } else {
                          totalNonNumeric.push(`${item.amount} ${item.unit}`);
                        }
                      });

                      const totalParts: string[] = [];
                      Object.entries(totalUnitGroups).forEach(([uKey, values]) => {
                        const sum = values.reduce((s, v) => s + v, 0);
                        const origUnit = grouped.items.find(i => i.unit.trim().toLowerCase() === uKey)?.unit || uKey;
                        const rounded = Math.round(sum * 100) / 100;
                        totalParts.push(`${rounded}${origUnit ? ' ' + origUnit : ''}`);
                      });
                      totalNonNumeric.forEach(str => totalParts.push(str));
                      const requirementStr = totalParts.join(' + ');

                      return (
                        <div 
                          key={grouped.key}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border transition select-none ${
                            isChecked 
                              ? 'bg-slate-50 border-slate-100 text-slate-400' 
                              : 'bg-white border-slate-100/80 hover:bg-emerald-50/10 hover:border-emerald-100/30 text-slate-800'
                          }`}
                        >
                          {/* Checkbox */}
                          <button 
                            type="button"
                            onClick={() => toggleCheck(grouped.key)}
                            className="shrink-0 mt-1 cursor-pointer focus:outline-none"
                          >
                            {isChecked ? (
                              <CheckSquare size={16} className="text-emerald-600" />
                            ) : (
                              <Square size={16} className="text-slate-300 hover:text-emerald-500 transition" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0 font-sans text-xs">
                            {/* Ingredient Name & Requirement Note */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span 
                                onClick={() => toggleCheck(grouped.key)}
                                className={`font-semibold tracking-tight text-sm cursor-pointer ${
                                  isChecked ? 'line-through text-slate-400' : 'text-slate-800'
                                }`}
                              >
                                {grouped.name}
                              </span>
                              {requirementStr && (
                                isChecked ? (
                                  <span className="text-[10px] font-sans font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                    Needed: {requirementStr}
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const parts = requirementStr.split(' ');
                                      const amt = parseFloat(requirementStr) ? String(parseFloat(requirementStr)) : '1';
                                      const unt = parts.slice(1).join(' ') || 'unit';
                                      handleInputChange(grouped.key, amt, unt);
                                      fetchPrice(grouped.key, grouped.name, amt, unt);
                                    }}
                                    className="text-[10px] font-sans font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-100 px-2.5 py-0.5 rounded-full transition cursor-pointer"
                                    title="Click to fill needed quantity to buy"
                                  >
                                    Match Needed: {requirementStr}
                                  </button>
                                )
                              )}
                            </div>

                            {/* Interactive Quantity Selection and Price Badge */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-100/50">
                              
                              {/* Inputs */}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-sans">Buy amount:</span>
                                <div className="flex items-center mt-1 sm:mt-0">
                                  <input
                                    type="text"
                                    value={buyQty.amount}
                                    disabled={isChecked}
                                    onChange={(e) => handleInputChange(grouped.key, e.target.value, buyQty.unit)}
                                    onBlur={() => handleInputBlur(grouped.key, grouped.name, buyQty.amount, buyQty.unit)}
                                    placeholder="1"
                                    className="w-14 px-2 py-1 rounded-l-md border border-slate-200 text-xs text-slate-800 font-mono text-center focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-400"
                                  />
                                  <input
                                    type="text"
                                    value={buyQty.unit}
                                    disabled={isChecked}
                                    onChange={(e) => handleInputChange(grouped.key, buyQty.amount, e.target.value)}
                                    onBlur={() => handleInputBlur(grouped.key, grouped.name, buyQty.amount, buyQty.unit)}
                                    placeholder="unit"
                                    className="w-18 px-2 py-1 rounded-r-md border-y border-r border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-400"
                                  />
                                </div>
                              </div>

                              {/* Dynamic Cost Area */}
                              <div className="flex items-center gap-2 pr-1">
                                {pState?.loading ? (
                                  <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                                    <RefreshCw size={11} className="animate-spin text-emerald-600" />
                                    <span className="text-[10px]">Pricing...</span>
                                  </div>
                                ) : pState?.price !== undefined ? (
                                  <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100/50 px-2 py-1 rounded-lg">
                                    <span className="font-mono text-xs font-extrabold text-emerald-700">
                                      {formatPrice(pState.price, currency, exchangeRates)}
                                    </span>
                                    {pState.explanation && (
                                      <div 
                                        className="group relative cursor-help"
                                        title={pState.explanation}
                                      >
                                        <HelpCircle size={11} className="text-emerald-400 hover:text-emerald-600 transition" />
                                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-800 text-white text-[9px] p-2 rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition z-50 font-normal leading-normal">
                                          {pState.explanation}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => fetchPrice(grouped.key, grouped.name, buyQty.amount, buyQty.unit)}
                                    className="text-[10px] font-bold text-emerald-600 border border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50 px-2 py-1 rounded-lg transition"
                                  >
                                    Check Price
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Recipes involved */}
                            <div className="flex flex-wrap gap-1 mt-2.5">
                              {grouped.items.map((item, id) => (
                                <span 
                                  key={id} 
                                  className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-sm transition ${
                                    isChecked 
                                      ? 'bg-slate-100 text-slate-400/60' 
                                      : 'bg-slate-100 text-slate-500 font-medium'
                                  }`}
                                >
                                  <span className="font-semibold">{item.amount} {item.unit}</span>
                                  <span className="text-[8px] text-slate-400">for</span>
                                  <span className="max-w-[120px] truncate">{item.recipeName}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 2: Standalone Sourced Custom Items */}
              {customItems.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 font-sans">
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                        Extra Sourced Items & Staples
                      </span>
                      <span className="text-[10px] bg-emerald-100/60 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        {customItems.length}
                      </span>
                    </div>
                    <span className="font-sans text-[11px] font-semibold text-slate-500">
                      {customItems.filter(item => checkedKeys[item.key]).length} / {customItems.length} Checked
                    </span>
                  </div>

                  <div className="space-y-3 pr-1">
                    {customItems.map((item) => {
                      const isChecked = !!checkedKeys[item.key];
                      const buyQty = buyQuantities[item.key] || { amount: item.amount, unit: item.unit };
                      const pState = prices[item.key];

                      return (
                        <div 
                          key={item.key}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border transition select-none ${
                            isChecked 
                              ? 'bg-slate-50 border-slate-100 text-slate-400' 
                              : 'bg-white border-slate-100/80 hover:bg-emerald-50/10 hover:border-emerald-100/30 text-slate-800'
                          }`}
                        >
                          {/* Checkbox */}
                          <button 
                            type="button"
                            onClick={() => toggleCheck(item.key)}
                            className="shrink-0 mt-1 cursor-pointer focus:outline-none"
                          >
                            {isChecked ? (
                              <CheckSquare size={16} className="text-emerald-600" />
                            ) : (
                              <Square size={16} className="text-slate-300 hover:text-emerald-500 transition" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0 font-sans text-xs">
                            {/* Ingredient Name & Actions */}
                            <div className="flex items-center justify-between gap-2">
                              <span 
                                onClick={() => toggleCheck(item.key)}
                                className={`font-semibold tracking-tight text-sm cursor-pointer ${
                                  isChecked ? 'line-through text-slate-400' : 'text-slate-800'
                                }`}
                              >
                                {item.name}
                              </span>
                              
                              <button
                                type="button"
                                onClick={() => deleteCustomItem(item.key)}
                                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-md transition cursor-pointer"
                                title="Remove item"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            {/* Interactive Quantity Selection and Price Badge */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-100/50">
                              
                              {/* Inputs */}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-sans">Buy amount:</span>
                                <div className="flex items-center mt-1 sm:mt-0">
                                  <input
                                    type="text"
                                    value={buyQty.amount}
                                    disabled={isChecked}
                                    onChange={(e) => handleInputChange(item.key, e.target.value, buyQty.unit)}
                                    onBlur={() => handleInputBlur(item.key, item.name, buyQty.amount, buyQty.unit)}
                                    placeholder="1"
                                    className="w-14 px-2 py-1 rounded-l-md border border-slate-200 text-xs text-slate-800 font-mono text-center focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-400"
                                  />
                                  <input
                                    type="text"
                                    value={buyQty.unit}
                                    disabled={isChecked}
                                    onChange={(e) => handleInputChange(item.key, buyQty.amount, e.target.value)}
                                    onBlur={() => handleInputBlur(item.key, item.name, buyQty.amount, buyQty.unit)}
                                    placeholder="unit"
                                    className="w-18 px-2 py-1 rounded-r-md border-y border-r border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-400"
                                  />
                                </div>
                              </div>

                              {/* Dynamic Cost Area */}
                              <div className="flex items-center gap-2 pr-1">
                                {pState?.loading ? (
                                  <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                                    <RefreshCw size={11} className="animate-spin text-emerald-600" />
                                    <span className="text-[10px]">Pricing...</span>
                                  </div>
                                ) : pState?.price !== undefined ? (
                                  <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100/50 px-2 py-1 rounded-lg">
                                    <span className="font-mono text-xs font-extrabold text-emerald-700">
                                      {formatPrice(pState.price, currency, exchangeRates)}
                                    </span>
                                    {pState.explanation && (
                                      <div 
                                        className="group relative cursor-help"
                                        title={pState.explanation}
                                      >
                                        <HelpCircle size={11} className="text-emerald-400 hover:text-emerald-600 transition" />
                                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-800 text-white text-[9px] p-2 rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition z-50 font-normal leading-normal">
                                          {pState.explanation}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => fetchPrice(item.key, item.name, buyQty.amount, buyQty.unit)}
                                    className="text-[10px] font-bold text-emerald-600 border border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50 px-2 py-1 rounded-lg transition"
                                  >
                                    Check Price
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
