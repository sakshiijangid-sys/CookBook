import React from 'react';
import { Recipe } from '../types';
import { CurrencyType, FALLBACK_RATES, formatPrice } from '../utils/currency';
import { Clock, Users, Flame, Tag, BookOpen, EyeOff } from 'lucide-react';

interface RecipeCardProps {
  recipe: Recipe;
  currency?: CurrencyType;
  exchangeRates?: Record<string, number>;
  onSelect: (recipe: Recipe) => void;
  onHide?: (id: string, e: React.MouseEvent<Element>) => void | Promise<void>;
}

function RecipeCard({
  recipe,
  currency = 'USD',
  exchangeRates = FALLBACK_RATES,
  onSelect,
  onHide,
}: RecipeCardProps) {
  const { name, description, image, category, prepTime, cookTime, servings, price, tags } = recipe;

  return (
    <div
      id={`recipe-card-${recipe._id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
      onClick={() => onSelect(recipe)}
    >
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        <img
          id={`recipe-card-img-${recipe._id}`}
          src={
            image ||
            'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&auto=format&fit=crop&q=60'
          }
          alt={name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src =
              'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&auto=format&fit=crop&q=60';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/45 via-slate-900/10 to-transparent" />

        <span className="absolute top-3 left-3 rounded-lg bg-emerald-600/95 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white shadow-sm font-sans flex items-center gap-1">
          <Flame size={11} className="fill-current" />
          {category}
        </span>

        <span className="absolute top-3 right-3 rounded-lg bg-slate-900/90 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 font-mono">
          Est: {formatPrice(price, currency, exchangeRates)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-sans text-base font-bold tracking-tight text-slate-800 group-hover:text-emerald-600 transition-colors duration-200">
            {name}
          </h3>
          {onHide && (
            <button
              id={`hide-recipe-${recipe._id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onHide(recipe._id, e);
              }}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-500 transition-colors duration-150 shrink-0 cursor-pointer"
              title="Hide recipe from cookbook"
            >
              <EyeOff size={14} />
            </button>
          )}
        </div>

        <p className="mb-4 h-10 line-clamp-2 font-sans text-xs text-slate-500 leading-relaxed">
          {description}
        </p>

        <div className="mb-4 grid grid-cols-3 gap-2 border-t border-b border-slate-100 py-3 font-sans text-xs text-slate-600 leading-none">
          <div className="flex flex-col items-center justify-center border-r border-slate-100 px-1 py-0.5">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Prep
            </span>
            <div className="flex items-center gap-1">
              <Clock size={11} className="text-emerald-600" />
              <span className="font-semibold text-slate-800">{prepTime}m</span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center border-r border-slate-100 px-1 py-0.5">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Cook
            </span>
            <div className="flex items-center gap-1">
              <Flame size={11} className="text-emerald-600" />
              <span className="font-semibold text-slate-800">{cookTime}m</span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center px-1 py-0.5">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Serves
            </span>
            <div className="flex items-center gap-1">
              <Users size={11} className="text-emerald-600" />
              <span className="font-semibold text-slate-800">{servings}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-sans text-[10px] font-medium text-slate-600"
            >
              <Tag size={9} className="text-slate-400" />
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-sans text-[10px] font-medium text-slate-400">
              +{tags.length - 3}
            </span>
          )}
        </div>

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-2.5 text-xs font-semibold text-emerald-800 group-hover:bg-emerald-100 transition-colors duration-200">
            <BookOpen size={13} />
            View Full Recipe
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(RecipeCard);
