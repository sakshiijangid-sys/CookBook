import React from 'react';
import { Recipe } from '../types';
import { Clock, Users, Flame, Tag, BookOpen, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface RecipeCardProps {
  key?: any;
  recipe: Recipe;
  onSelect: (recipe: Recipe) => void;
  onDelete?: (id: string, e: React.MouseEvent<Element>) => void | Promise<void>;
}

function RecipeCard({ recipe, onSelect, onDelete }: RecipeCardProps) {
  // Destructure for readability
  const { name, description, image, category, prepTime, cookTime, servings, price, tags } = recipe;

  return (
    <motion.div 
      id={`recipe-card-${recipe._id}`}
      layout="position"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-shadow duration-300 hover:shadow-md cursor-pointer"
      onClick={() => onSelect(recipe)}
    >
      {/* Recipe Image with category tag overlay */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        <img 
          id={`recipe-card-img-${recipe._id}`}
          src={image || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&auto=format&fit=crop&q=60'} 
          alt={name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&auto=format&fit=crop&q=60';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-slate-900/10 to-transparent" />
        
        {/* Category Badge */}
        <span className="absolute top-3 left-3 rounded-full bg-emerald-600/95 px-3 py-1 text-xs font-semibold tracking-wide text-white shadow-sm font-sans flex items-center gap-1">
          <Flame size={12} className="fill-current" />
          {category}
        </span>

        {/* Cost Badge */}
        <span className="absolute top-3 right-3 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-emerald-400 font-sans">
          Est: ${price.toFixed(2)}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="font-sans text-base font-bold tracking-tight text-slate-800 group-hover:text-emerald-600 transition-colors duration-200">
            {name}
          </h3>
          {onDelete && (
            <button
               id={`delete-recipe-${recipe._id}`}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(recipe._id, e);
              }}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-rose-500 transition-all duration-200"
              title="Delete recipe"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>

        <p className="mb-4 h-10 line-clamp-2 font-sans text-xs text-slate-500 leading-relaxed flex-1">
          {description}
        </p>

        {/* Recipe Meta Info */}
        <div className="mb-4 grid grid-cols-3 gap-2 border-t border-b border-slate-100 py-3 font-sans text-xs text-slate-600 leading-none">
          <div className="flex flex-col items-center justify-center border-r border-slate-100 px-1 py-0.5">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Prep</span>
            <div className="flex items-center gap-1">
              <Clock size={11} className="text-emerald-600" />
              <span className="font-semibold text-slate-800">{prepTime}m</span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center border-r border-slate-100 px-1 py-0.5">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Cook</span>
            <div className="flex items-center gap-1">
              <Flame size={11} className="text-emerald-600" />
              <span className="font-semibold text-slate-800">{cookTime}m</span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center px-1 py-0.5">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Serves</span>
            <div className="flex items-center gap-1">
              <Users size={11} className="text-emerald-600" />
              <span className="font-semibold text-slate-800">{servings}</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 3).map((tag, idx) => (
            <span 
              key={idx} 
              className="inline-flex items-center gap-0.5 rounded bg-slate-100 px-2.5 py-0.5 font-sans text-[10px] font-medium text-slate-600 border border-transparent"
            >
              <Tag size={9} className="text-slate-400 animate-pulse" />
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-sans text-[10px] font-medium text-slate-400">
              +{tags.length - 3}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 py-2.5 text-xs font-semibold text-emerald-800 group-hover:bg-emerald-100 transition-colors duration-200">
          <BookOpen size={13} />
          View Fully Detailed Recipe
        </div>
      </div>
    </motion.div>
  );
}

export default React.memo(RecipeCard);
