import React from 'react';
import { DayOfWeek, MealPlan, Recipe } from '../types';
import { CurrencyType, FALLBACK_RATES, formatPrice } from '../utils/currency';
import { Calendar } from 'lucide-react';

interface MealPlannerViewProps {
  recipes: Recipe[];
  mealPlans: MealPlan[];
  currency?: CurrencyType;
  exchangeRates?: Record<string, number>;
  onUpdateMeal: (day: DayOfWeek, slot: 'breakfast' | 'lunch' | 'dinner', recipeId: string | null) => Promise<void>;
  onSelectRecipeDetails: (recipe: Recipe) => void;
}

const DAYS: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export default function MealPlannerView({
  recipes,
  mealPlans,
  currency = 'USD',
  exchangeRates = FALLBACK_RATES,
  onUpdateMeal,
  onSelectRecipeDetails,
}: MealPlannerViewProps) {
  const getRecipeById = (id?: string): Recipe | undefined => {
    if (!id) return undefined;
    return recipes.find((r) => r._id === id);
  };

  const getDayPlan = (day: DayOfWeek): MealPlan => {
    return mealPlans.find((p) => p.day === day) || { day };
  };

  const totalScheduled = DAYS.reduce((acc, day) => {
    const plan = getDayPlan(day);
    return acc + (plan.breakfast ? 1 : 0) + (plan.lunch ? 1 : 0) + (plan.dinner ? 1 : 0);
  }, 0);

  return (
    <div className="space-y-6 animate-tab-fade">
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Calendar size={17} className="text-emerald-600" />
          <h3 className="font-sans text-sm font-extrabold text-slate-800">
            Weekly Meal Planner
          </h3>
        </div>
        <span className="font-sans text-xs font-semibold text-emerald-800 bg-white border border-emerald-200/70 px-3 py-1 rounded-lg self-start sm:self-auto">
          {totalScheduled} / 21 Slots Scheduled
        </span>
      </div>

      <div id="weekly-planner-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {DAYS.map((day) => {
          const plan = getDayPlan(day);
          const count = (plan.breakfast ? 1 : 0) + (plan.lunch ? 1 : 0) + (plan.dinner ? 1 : 0);

          return (
            <div
              key={day}
              id={`planner-day-${day}`}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col"
            >
              <div className="mb-3 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-sans font-bold text-xs uppercase tracking-wider text-slate-800">
                  {day}
                </span>
                <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-md uppercase">
                  {count} / 3 planned
                </span>
              </div>

              <div className="space-y-3 flex-1">
                <MealSlotRow
                  slotName="Breakfast"
                  recipe={getRecipeById(plan.breakfast)}
                  availableRecipes={recipes.filter((r) => r.category === 'Breakfast' || r.category === 'Snack')}
                  currency={currency}
                  exchangeRates={exchangeRates}
                  onSelectRecipe={(recipeId) => onUpdateMeal(day, 'breakfast', recipeId)}
                  onSelectDetails={onSelectRecipeDetails}
                />

                <MealSlotRow
                  slotName="Lunch"
                  recipe={getRecipeById(plan.lunch)}
                  availableRecipes={recipes.filter((r) => r.category === 'Lunch' || r.category === 'Dinner')}
                  currency={currency}
                  exchangeRates={exchangeRates}
                  onSelectRecipe={(recipeId) => onUpdateMeal(day, 'lunch', recipeId)}
                  onSelectDetails={onSelectRecipeDetails}
                />

                <MealSlotRow
                  slotName="Dinner"
                  recipe={getRecipeById(plan.dinner)}
                  availableRecipes={recipes.filter((r) => r.category === 'Dinner' || r.category === 'Lunch')}
                  currency={currency}
                  exchangeRates={exchangeRates}
                  onSelectRecipe={(recipeId) => onUpdateMeal(day, 'dinner', recipeId)}
                  onSelectDetails={onSelectRecipeDetails}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface MealSlotRowProps {
  slotName: 'Breakfast' | 'Lunch' | 'Dinner';
  recipe?: Recipe;
  availableRecipes: Recipe[];
  currency: CurrencyType;
  exchangeRates: Record<string, number>;
  onSelectRecipe: (id: string | null) => void;
  onSelectDetails: (recipe: Recipe) => void;
}

function MealSlotRow({
  slotName,
  recipe,
  availableRecipes,
  currency,
  exchangeRates,
  onSelectRecipe,
  onSelectDetails,
}: MealSlotRowProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-slate-400">
          {slotName}
        </span>
        {recipe && (
          <button
            type="button"
            onClick={() => onSelectRecipe(null)}
            className="text-[9px] font-semibold text-rose-500 hover:text-rose-700 transition cursor-pointer"
            title="Clear meal slot"
          >
            Clear
          </button>
        )}
      </div>

      {recipe ? (
        <div
          className="group relative overflow-hidden rounded-xl bg-slate-50 hover:bg-emerald-50/40 p-2 border border-slate-100 hover:border-emerald-200/60 transition duration-200 cursor-pointer flex gap-2.5"
          onClick={() => onSelectDetails(recipe)}
        >
          <img
            id={`meal-planner-img-${recipe._id}`}
            src={
              recipe.image ||
              'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&auto=format&fit=crop&q=60'
            }
            alt={recipe.name}
            className="h-10 w-10 shrink-0 rounded-lg object-cover border border-slate-100"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src =
                'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&auto=format&fit=crop&q=60';
            }}
          />
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <h4 className="font-sans text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition truncate leading-snug">
              {recipe.name}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-slate-400">
              <span>{recipe.prepTime + recipe.cookTime} mins</span>
              <span>•</span>
              <span className="font-semibold text-slate-700 font-sans">
                {formatPrice(recipe.price, currency, exchangeRates)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-2 hover:bg-slate-50 hover:border-emerald-400/50 transition-colors duration-150">
          <select
            value=""
            onChange={(e) => {
              const val = e.target.value;
              onSelectRecipe(val === '' ? null : val);
            }}
            className="w-full bg-transparent font-sans text-xs font-semibold text-slate-500 focus:outline-hidden cursor-pointer"
          >
            <option value="" disabled>
              + Plan {slotName}
            </option>
            {availableRecipes.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name} ({formatPrice(r.price, currency, exchangeRates)})
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
