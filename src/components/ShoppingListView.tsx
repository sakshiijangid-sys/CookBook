import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GroceryItemRecord, MealPlan, Recipe } from '../types';
import {
  ShoppingBag,
  CheckSquare,
  Square,
  RefreshCw,
  HelpCircle,
  Sparkles,
  ChevronDown,
  Check,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { CurrencyType, formatPrice, CURRENCY_DETAILS } from '../utils/currency';

export interface PriceState {
  price?: number;
  explanation?: string;
  loading?: boolean;
}

interface ShoppingListViewProps {
  recipes: Recipe[];
  mealPlans: MealPlan[];
  groceryRecords: Record<string, GroceryItemRecord>;
  prices: Record<string, PriceState>;
  setPrices: React.Dispatch<React.SetStateAction<Record<string, PriceState>>>;
  currency: CurrencyType;
  exchangeRates: Record<string, number>;
  setCurrency: (currency: CurrencyType) => void;
  onSaveGroceryItem: (item: {
    itemKey: string;
    name: string;
    amount: string;
    unit: string;
    checked: boolean;
    isCustom: boolean;
  }) => Promise<void>;
  onDeleteCustomItem: (itemKey: string) => Promise<void>;
  onResetChecks: () => Promise<void>;
}

interface GroupedIngredient {
  key: string;
  name: string;
  items: { amount: string; unit: string; recipeName: string }[];
}

export default function ShoppingListView({
  recipes,
  mealPlans,
  groceryRecords,
  prices,
  setPrices,
  currency,
  exchangeRates,
  setCurrency,
  onSaveGroceryItem,
  onDeleteCustomItem,
  onResetChecks,
}: ShoppingListViewProps) {
  const [draftQuantities, setDraftQuantities] = useState<Record<string, { amount: string; unit: string }>>({});
  const [isPricingAll, setIsPricingAll] = useState(false);
  const [pricingError, setPricingError] = useState('');
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const requestedKeysRef = useRef<Record<string, boolean>>({});

  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('pieces');
  const [formNotice, setFormNotice] = useState('');

  const customItems = useMemo(
    () =>
      Object.values(groceryRecords)
        .filter((r) => r.isCustom)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [groceryRecords]
  );

  const consolidatedIngredients = useMemo(() => {
    const list: GroupedIngredient[] = [];
    const hash: Record<string, GroupedIngredient> = {};

    const plannedRecipeIds: string[] = [];
    mealPlans.forEach((plan) => {
      if (plan.breakfast) plannedRecipeIds.push(plan.breakfast);
      if (plan.lunch) plannedRecipeIds.push(plan.lunch);
      if (plan.dinner) plannedRecipeIds.push(plan.dinner);
    });

    if (plannedRecipeIds.length === 0) return [];

    plannedRecipeIds.forEach((recipeId) => {
      const recipe = recipes.find((r) => r._id === recipeId);
      if (!recipe) return;

      recipe.ingredients.forEach((ing) => {
        const normalizedName = ing.name.trim().toLowerCase();
        if (!hash[normalizedName]) {
          hash[normalizedName] = {
            key: normalizedName,
            name: ing.name.trim(),
            items: [],
          };
          list.push(hash[normalizedName]);
        }
        hash[normalizedName].items.push({
          amount: ing.amount,
          unit: ing.unit,
          recipeName: recipe.name,
        });
      });
    });

    list.forEach((grouped) => {
      const recipeMap: Record<string, { amount: string; unit: string }[]> = {};
      grouped.items.forEach((item) => {
        if (!recipeMap[item.recipeName]) recipeMap[item.recipeName] = [];
        recipeMap[item.recipeName].push({ amount: item.amount, unit: item.unit });
      });

      const consolidatedItems: { amount: string; unit: string; recipeName: string }[] = [];
      Object.entries(recipeMap).forEach(([rName, occurrences]) => {
        const unitGroups: Record<string, number[]> = {};
        const nonNumeric: string[] = [];

        occurrences.forEach((occ) => {
          const num = parseFloat(occ.amount);
          if (!isNaN(num)) {
            const uKey = occ.unit.trim().toLowerCase();
            if (!unitGroups[uKey]) unitGroups[uKey] = [];
            unitGroups[uKey].push(num);
          } else {
            const a = occ.amount.trim();
            const u = occ.unit.trim();
            if (a && u) nonNumeric.push(`${a} ${u}`);
            else if (a || u) nonNumeric.push(a || u);
          }
        });

        if (Object.keys(unitGroups).length === 1 && nonNumeric.length === 0) {
          const uKey = Object.keys(unitGroups)[0];
          const sum = unitGroups[uKey].reduce((s, v) => s + v, 0);
          const rounded = Math.round(sum * 100) / 100;
          const origUnit = occurrences.find((o) => o.unit.trim().toLowerCase() === uKey)?.unit || uKey;
          consolidatedItems.push({ amount: rounded.toString(), unit: origUnit, recipeName: rName });
        } else {
          const parts: string[] = [];
          Object.entries(unitGroups).forEach(([uKey, values]) => {
            const sum = values.reduce((s, v) => s + v, 0);
            const origUnit = occurrences.find((o) => o.unit.trim().toLowerCase() === uKey)?.unit || uKey;
            const rounded = Math.round(sum * 100) / 100;
            parts.push(`${rounded}${origUnit ? ' ' + origUnit : ''}`);
          });
          nonNumeric.forEach((str) => parts.push(str));
          consolidatedItems.push({ amount: parts.join(' + '), unit: '', recipeName: rName });
        }
      });

      grouped.items = consolidatedItems;
    });

    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [recipes, mealPlans]);

  const computeSuggestedQuantity = (grouped: GroupedIngredient): { amount: string; unit: string } => {
    const totalUnitGroups: Record<string, number[]> = {};
    grouped.items.forEach((item) => {
      const num = parseFloat(item.amount);
      if (!isNaN(num)) {
        const uKey = item.unit.trim().toLowerCase();
        if (!totalUnitGroups[uKey]) totalUnitGroups[uKey] = [];
        totalUnitGroups[uKey].push(num);
      }
    });

    const uKeys = Object.keys(totalUnitGroups);
    if (uKeys.length > 0) {
      const uKey = uKeys[0];
      const sum = totalUnitGroups[uKey].reduce((s, v) => s + v, 0);
      const origUnit = grouped.items.find((i) => i.unit.trim().toLowerCase() === uKey)?.unit || uKey;
      return { amount: String(Math.round(sum * 100) / 100), unit: origUnit || 'unit' };
    }
    if (grouped.items.length > 0) {
      return { amount: grouped.items[0].amount || '1', unit: grouped.items[0].unit || 'unit' };
    }
    return { amount: '1', unit: 'unit' };
  };

  const getBuyQuantity = (key: string, fallback: { amount: string; unit: string }) => {
    if (draftQuantities[key]) return draftQuantities[key];
    const saved = groceryRecords[key];
    if (saved) return { amount: saved.amount, unit: saved.unit };
    return fallback;
  };

  const fetchPrice = async (key: string, name: string, quantity: string, unit: string) => {
    if (!quantity || isNaN(parseFloat(quantity))) return;
    setPricingError('');
    setPrices((prev) => ({ ...prev, [key]: { ...prev[key], loading: true } }));

    try {
      const res = await fetch('/api/gemini/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, quantity, unit }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to estimate ingredient price.');
      }

      setPrices((prev) => ({
        ...prev,
        [key]: {
          price: data.estimatedPriceUSD,
          explanation: data.explanation,
          loading: false,
        },
      }));
    } catch (err: any) {
      setPricingError(err?.message || 'Unable to estimate price right now.');
      setPrices((prev) => ({
        ...prev,
        [key]: { ...prev[key], loading: false },
      }));
    }
  };

  const fetchPricesBatch = async (
    itemsToRequest: { key: string; name: string; quantity: string; unit: string }[]
  ) => {
    if (itemsToRequest.length === 0) return;
    setPricingError('');

    setPrices((prev) => {
      const next = { ...prev };
      itemsToRequest.forEach((item) => {
        next[item.key] = { ...next[item.key], loading: true };
      });
      return next;
    });

    try {
      const res = await fetch('/api/gemini/price/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToRequest }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to estimate batch market prices.');
      }

      setPrices((prev) => {
        const next = { ...prev };
        itemsToRequest.forEach((item) => {
          next[item.key] = { ...next[item.key], loading: false };
        });
        if (Array.isArray(data.items)) {
          data.items.forEach((item: any) => {
            next[item.key] = {
              price: item.estimatedPriceUSD,
              explanation: item.explanation,
              loading: false,
            };
          });
        }
        return next;
      });
    } catch (err: any) {
      setPricingError(err?.message || 'Unable to fetch market prices right now.');
      itemsToRequest.forEach((item) => {
        if (typeof prices[item.key]?.price !== 'number') {
          delete requestedKeysRef.current[item.key];
        }
      });
      setPrices((prev) => {
        const next = { ...prev };
        itemsToRequest.forEach((item) => {
          next[item.key] = { ...next[item.key], loading: false };
        });
        return next;
      });
    }
  };

  const autoPriceAll = async () => {
    if (isPricingAll || (consolidatedIngredients.length === 0 && customItems.length === 0)) return;
    setIsPricingAll(true);

    const itemsToRequest = [
      ...consolidatedIngredients.map((grouped) => {
        const q = getBuyQuantity(grouped.key, computeSuggestedQuantity(grouped));
        return { key: grouped.key, name: grouped.name, quantity: q.amount, unit: q.unit };
      }),
      ...customItems.map((item) => {
        const q = getBuyQuantity(item.itemKey, { amount: item.amount, unit: item.unit });
        return { key: item.itemKey, name: item.name, quantity: q.amount, unit: q.unit };
      }),
    ];

    await fetchPricesBatch(itemsToRequest);
    setIsPricingAll(false);
  };

  useEffect(() => {
    const missingItems: { key: string; name: string; quantity: string; unit: string }[] = [];

    consolidatedIngredients.forEach((grouped) => {
      if (!prices[grouped.key] && !requestedKeysRef.current[grouped.key]) {
        requestedKeysRef.current[grouped.key] = true;
        const q = getBuyQuantity(grouped.key, computeSuggestedQuantity(grouped));
        missingItems.push({ key: grouped.key, name: grouped.name, quantity: q.amount, unit: q.unit });
      }
    });

    customItems.forEach((item) => {
      if (!prices[item.itemKey] && !requestedKeysRef.current[item.itemKey]) {
        requestedKeysRef.current[item.itemKey] = true;
        const q = getBuyQuantity(item.itemKey, { amount: item.amount, unit: item.unit });
        missingItems.push({ key: item.itemKey, name: item.name, quantity: q.amount, unit: q.unit });
      }
    });

    if (missingItems.length > 0) {
      fetchPricesBatch(missingItems);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consolidatedIngredients, customItems]);

  const handleToggleCheck = async (
    key: string,
    name: string,
    defaultQty: { amount: string; unit: string },
    isCustom: boolean
  ) => {
    const current = groceryRecords[key];
    const q = getBuyQuantity(key, defaultQty);
    await onSaveGroceryItem({
      itemKey: key,
      name,
      amount: q.amount,
      unit: q.unit,
      checked: !(current?.checked ?? false),
      isCustom,
    });
  };

  const handleInputChange = (key: string, amount: string, unit: string) => {
    setDraftQuantities((prev) => ({
      ...prev,
      [key]: { amount: amount.slice(0, 40), unit: unit.slice(0, 40) },
    }));
  };

  const handleInputBlur = async (
    key: string,
    name: string,
    amount: string,
    unit: string,
    isCustom: boolean
  ) => {
    const checked = groceryRecords[key]?.checked ?? false;
    await onSaveGroceryItem({
      itemKey: key,
      name,
      amount: amount || '1',
      unit: unit || 'unit',
      checked,
      isCustom,
    });
    fetchPrice(key, name, amount || '1', unit || 'unit');
  };

  const handleAddCustomItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormNotice('');
    const trimmed = newItemName.trim().slice(0, 160);
    if (!trimmed) return;
    const slug = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80);
    const sanitizedKey = `custom_${slug || 'item'}`;

    if (groceryRecords[sanitizedKey]) {
      setFormNotice(`"${trimmed}" is already on your grocery list.`);
      return;
    }

    const amt = newItemAmount.trim().slice(0, 40) || '1';
    const unt = newItemUnit.trim().slice(0, 40) || 'pieces';

    await onSaveGroceryItem({
      itemKey: sanitizedKey,
      name: trimmed,
      amount: amt,
      unit: unt,
      checked: false,
      isCustom: true,
    });

    setNewItemName('');
    setNewItemAmount('1');
    setNewItemUnit('pieces');
    requestedKeysRef.current[sanitizedKey] = true;
    fetchPrice(sanitizedKey, trimmed, amt, unt);
  };

  const totalBasketCost = useMemo(() => {
    let sum = 0;
    Object.keys(prices).forEach((key) => {
      if (groceryRecords[key]?.checked) {
        const val = prices[key];
        if (val && typeof val.price === 'number') {
          sum += val.price;
        }
      }
    });
    return Math.round(sum * 100) / 100;
  }, [prices, groceryRecords]);

  const hasLoadedAnyPrice = useMemo(
    () => (Object.values(prices) as PriceState[]).some((p) => typeof p?.price === 'number'),
    [prices]
  );

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
              type="button"
              onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:border-emerald-200 px-3 py-1.5 rounded-lg font-sans text-xs font-bold text-slate-700 transition cursor-pointer shadow-xs"
            >
              <span className="text-xs shrink-0">{CURRENCY_DETAILS[currency]?.flag}</span>
              <span>{CURRENCY_DETAILS[currency]?.label || currency}</span>
              <ChevronDown
                size={11}
                className={`text-slate-400 transition-transform duration-200 shrink-0 ${
                  isCurrencyDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isCurrencyDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsCurrencyDropdownOpen(false)} />
                <div className="absolute left-0 mt-1.5 w-52 rounded-xl border border-slate-200 bg-white p-1 shadow-lg z-50 animate-fade-in">
                  <div className="px-2.5 py-1.5 border-b border-slate-100 text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                    Select Currency
                  </div>
                  <div className="space-y-0.5 max-h-60 overflow-y-auto mt-1">
                    {(Object.keys(CURRENCY_DETAILS) as CurrencyType[]).map((key) => {
                      const config = CURRENCY_DETAILS[key];
                      const isSelected = key === currency;
                      return (
                        <button
                          key={key}
                          type="button"
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
                              <div className="text-[9px] text-slate-400 mt-0.5 font-normal">
                                {config.name}
                              </div>
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
              type="button"
              onClick={autoPriceAll}
              disabled={isPricingAll}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700/20 px-3 py-1.5 rounded-lg font-sans text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={11} className={isPricingAll ? 'animate-spin' : ''} />
              {isPricingAll ? 'Updating Market...' : 'Update Market Prices'}
            </button>
            <button
              type="button"
              onClick={onResetChecks}
              className="flex items-center gap-1 hover:bg-emerald-100/50 bg-white/80 border border-emerald-200/60 px-3 py-1.5 rounded-lg font-sans text-xs font-semibold text-slate-700 transition cursor-pointer"
            >
              <RefreshCw size={11} className="text-emerald-600" />
              Reset Checks
            </button>
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        {/* Quick-Add Extra Grocery Staple */}
        <form
          onSubmit={handleAddCustomItem}
          className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row items-end gap-3"
        >
          <div className="flex-1 w-full space-y-1">
            <label
              htmlFor="custom-grocery-name"
              className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider"
            >
              Add Custom Staple
            </label>
            <input
              id="custom-grocery-name"
              type="text"
              maxLength={160}
              value={newItemName}
              onChange={(e) => {
                setNewItemName(e.target.value);
                if (formNotice) setFormNotice('');
              }}
              placeholder="e.g. Fresh Milk, Olive Oil, Brown Eggs..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>

          <div className="w-full sm:w-20 space-y-1">
            <label
              htmlFor="custom-grocery-amt"
              className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider"
            >
              Qty
            </label>
            <input
              id="custom-grocery-amt"
              type="text"
              maxLength={40}
              value={newItemAmount}
              onChange={(e) => setNewItemAmount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-center text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>

          <div className="w-full sm:w-24 space-y-1">
            <label
              htmlFor="custom-grocery-unit"
              className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider"
            >
              Unit
            </label>
            <input
              id="custom-grocery-unit"
              type="text"
              maxLength={40}
              value={newItemUnit}
              onChange={(e) => setNewItemUnit(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-center text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>

          <button
            type="submit"
            disabled={!newItemName.trim()}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-sans text-xs font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer h-[34px] shrink-0"
          >
            <Plus size={14} />
            Add
          </button>
        </form>

        {formNotice && (
          <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2 font-sans">
            {formNotice}
          </div>
        )}

        {pricingError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 flex items-center justify-between gap-3 text-xs text-rose-700">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0 text-rose-600" />
              <span>{pricingError}</span>
            </div>
            <button
              type="button"
              onClick={autoPriceAll}
              className="font-bold underline text-rose-800 shrink-0 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {consolidatedIngredients.length === 0 && customItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-12 px-4 text-center">
            <ShoppingBag size={36} className="text-slate-300 mb-3" />
            <p className="font-sans text-sm font-bold text-slate-700">No Ingredients to Buy Yet</p>
            <p className="font-sans text-xs text-slate-400 mt-1 max-w-sm">
              Assign meals inside the Weekly Planner or add custom staples above to generate your grocery list.
            </p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {hasLoadedAnyPrice && (
              <div className="flex items-center justify-between bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="bg-emerald-100 p-2 rounded-xl text-emerald-700 shrink-0">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Estimated Basket Cost
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {totalBasketCost > 0
                        ? 'Server-estimated total for checked ingredients'
                        : 'Check items below to include them in your basket total'}
                    </span>
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

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-6">
              {consolidatedIngredients.length > 0 && (
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <span className="font-sans text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                      Planned Recipe Ingredients
                    </span>
                    <span className="font-sans text-[11px] font-semibold text-slate-500">
                      {consolidatedIngredients.filter((g) => groceryRecords[g.key]?.checked).length} /{' '}
                      {consolidatedIngredients.length} Checked
                    </span>
                  </div>

                  <div className="space-y-3">
                    {consolidatedIngredients.map((grouped) => {
                      const suggested = computeSuggestedQuantity(grouped);
                      const isChecked = Boolean(groceryRecords[grouped.key]?.checked);
                      const buyQty = getBuyQuantity(grouped.key, suggested);
                      const pState = prices[grouped.key];

                      const totalUnitGroups: Record<string, number[]> = {};
                      const totalNonNumeric: string[] = [];
                      grouped.items.forEach((item) => {
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
                        const origUnit =
                          grouped.items.find((i) => i.unit.trim().toLowerCase() === uKey)?.unit || uKey;
                        const rounded = Math.round(sum * 100) / 100;
                        totalParts.push(`${rounded}${origUnit ? ' ' + origUnit : ''}`);
                      });
                      totalNonNumeric.forEach((str) => totalParts.push(str));
                      const requirementStr = totalParts.join(' + ');

                      return (
                        <div
                          key={grouped.key}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border transition select-none ${
                            isChecked
                              ? 'bg-slate-50 border-slate-100 text-slate-400'
                              : 'bg-white border-slate-200/70 hover:border-emerald-200 text-slate-800'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleCheck(grouped.key, grouped.name, suggested, false)}
                            className="shrink-0 mt-1 cursor-pointer focus:outline-none"
                          >
                            {isChecked ? (
                              <CheckSquare size={16} className="text-emerald-600" />
                            ) : (
                              <Square size={16} className="text-slate-300 hover:text-emerald-500 transition" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0 font-sans text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span
                                onClick={() => handleToggleCheck(grouped.key, grouped.name, suggested, false)}
                                className={`font-semibold tracking-tight text-sm cursor-pointer ${
                                  isChecked ? 'line-through text-slate-400' : 'text-slate-800'
                                }`}
                              >
                                {grouped.name}
                              </span>
                              {requirementStr &&
                                (isChecked ? (
                                  <span className="text-[10px] font-sans font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                    Needed: {requirementStr}
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleInputChange(grouped.key, suggested.amount, suggested.unit);
                                      handleInputBlur(
                                        grouped.key,
                                        grouped.name,
                                        suggested.amount,
                                        suggested.unit,
                                        false
                                      );
                                    }}
                                    className="text-[10px] font-sans font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-100 px-2.5 py-0.5 rounded-md transition cursor-pointer"
                                  >
                                    Match Needed: {requirementStr}
                                  </button>
                                ))}
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-100">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-sans">
                                  Buy amount:
                                </span>
                                <div className="flex items-center">
                                  <input
                                    type="text"
                                    value={buyQty.amount}
                                    disabled={isChecked}
                                    onChange={(e) =>
                                      handleInputChange(grouped.key, e.target.value, buyQty.unit)
                                    }
                                    onBlur={() =>
                                      handleInputBlur(
                                        grouped.key,
                                        grouped.name,
                                        buyQty.amount,
                                        buyQty.unit,
                                        false
                                      )
                                    }
                                    placeholder="1"
                                    className="w-14 px-2 py-1 rounded-l-md border border-slate-200 text-xs text-slate-800 font-mono text-center focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-400"
                                  />
                                  <input
                                    type="text"
                                    value={buyQty.unit}
                                    disabled={isChecked}
                                    onChange={(e) =>
                                      handleInputChange(grouped.key, buyQty.amount, e.target.value)
                                    }
                                    onBlur={() =>
                                      handleInputBlur(
                                        grouped.key,
                                        grouped.name,
                                        buyQty.amount,
                                        buyQty.unit,
                                        false
                                      )
                                    }
                                    placeholder="unit"
                                    className="w-20 px-2 py-1 rounded-r-md border-y border-r border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-400"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {pState?.loading ? (
                                  <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                                    <RefreshCw size={11} className="animate-spin text-emerald-600" />
                                    <span className="text-[10px]">Pricing...</span>
                                  </div>
                                ) : pState?.price !== undefined ? (
                                  <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                                    <span className="font-mono text-xs font-extrabold text-emerald-700">
                                      {formatPrice(pState.price, currency, exchangeRates)}
                                    </span>
                                    {pState.explanation && (
                                      <div className="group relative cursor-help" title={pState.explanation}>
                                        <HelpCircle
                                          size={11}
                                          className="text-emerald-500 hover:text-emerald-700 transition"
                                        />
                                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-800 text-white text-[10px] p-2 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition z-50 font-normal leading-normal">
                                          {pState.explanation}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      fetchPrice(grouped.key, grouped.name, buyQty.amount, buyQty.unit)
                                    }
                                    className="text-[10px] font-bold text-emerald-700 border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 px-2 py-1 rounded-lg transition cursor-pointer"
                                  >
                                    Check Price
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1 mt-2.5">
                              {grouped.items.map((item, id) => (
                                <span
                                  key={id}
                                  className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-sm transition ${
                                    isChecked
                                      ? 'bg-slate-100 text-slate-400'
                                      : 'bg-slate-100 text-slate-500 font-medium'
                                  }`}
                                >
                                  <span className="font-semibold">
                                    {item.amount} {item.unit}
                                  </span>
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

              {customItems.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 font-sans">
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                        Extra Staples
                      </span>
                      <span className="text-[10px] bg-emerald-100/70 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                        {customItems.length}
                      </span>
                    </div>
                    <span className="font-sans text-[11px] font-semibold text-slate-500">
                      {customItems.filter((item) => item.checked).length} / {customItems.length} Checked
                    </span>
                  </div>

                  <div className="space-y-3">
                    {customItems.map((item) => {
                      const isChecked = Boolean(item.checked);
                      const buyQty = getBuyQuantity(item.itemKey, {
                        amount: item.amount,
                        unit: item.unit,
                      });
                      const pState = prices[item.itemKey];

                      return (
                        <div
                          key={item.itemKey}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border transition select-none ${
                            isChecked
                              ? 'bg-slate-50 border-slate-100 text-slate-400'
                              : 'bg-white border-slate-200/70 hover:border-emerald-200 text-slate-800'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleCheck(
                                item.itemKey,
                                item.name,
                                { amount: item.amount, unit: item.unit },
                                true
                              )
                            }
                            className="shrink-0 mt-1 cursor-pointer focus:outline-none"
                          >
                            {isChecked ? (
                              <CheckSquare size={16} className="text-emerald-600" />
                            ) : (
                              <Square size={16} className="text-slate-300 hover:text-emerald-500 transition" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0 font-sans text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                onClick={() =>
                                  handleToggleCheck(
                                    item.itemKey,
                                    item.name,
                                    { amount: item.amount, unit: item.unit },
                                    true
                                  )
                                }
                                className={`font-semibold tracking-tight text-sm cursor-pointer ${
                                  isChecked ? 'line-through text-slate-400' : 'text-slate-800'
                                }`}
                              >
                                {item.name}
                              </span>

                              <button
                                type="button"
                                onClick={() => onDeleteCustomItem(item.itemKey)}
                                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-md transition cursor-pointer"
                                title="Remove item"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-100">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-sans">
                                  Buy amount:
                                </span>
                                <div className="flex items-center">
                                  <input
                                    type="text"
                                    value={buyQty.amount}
                                    disabled={isChecked}
                                    onChange={(e) =>
                                      handleInputChange(item.itemKey, e.target.value, buyQty.unit)
                                    }
                                    onBlur={() =>
                                      handleInputBlur(
                                        item.itemKey,
                                        item.name,
                                        buyQty.amount,
                                        buyQty.unit,
                                        true
                                      )
                                    }
                                    placeholder="1"
                                    className="w-14 px-2 py-1 rounded-l-md border border-slate-200 text-xs text-slate-800 font-mono text-center focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-400"
                                  />
                                  <input
                                    type="text"
                                    value={buyQty.unit}
                                    disabled={isChecked}
                                    onChange={(e) =>
                                      handleInputChange(item.itemKey, buyQty.amount, e.target.value)
                                    }
                                    onBlur={() =>
                                      handleInputBlur(
                                        item.itemKey,
                                        item.name,
                                        buyQty.amount,
                                        buyQty.unit,
                                        true
                                      )
                                    }
                                    placeholder="unit"
                                    className="w-20 px-2 py-1 rounded-r-md border-y border-r border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-400"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {pState?.loading ? (
                                  <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                                    <RefreshCw size={11} className="animate-spin text-emerald-600" />
                                    <span className="text-[10px]">Pricing...</span>
                                  </div>
                                ) : pState?.price !== undefined ? (
                                  <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                                    <span className="font-mono text-xs font-extrabold text-emerald-700">
                                      {formatPrice(pState.price, currency, exchangeRates)}
                                    </span>
                                    {pState.explanation && (
                                      <div className="group relative cursor-help" title={pState.explanation}>
                                        <HelpCircle
                                          size={11}
                                          className="text-emerald-500 hover:text-emerald-700 transition"
                                        />
                                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-800 text-white text-[10px] p-2 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition z-50 font-normal leading-normal">
                                          {pState.explanation}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      fetchPrice(item.itemKey, item.name, buyQty.amount, buyQty.unit)
                                    }
                                    className="text-[10px] font-bold text-emerald-700 border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 px-2 py-1 rounded-lg transition cursor-pointer"
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
