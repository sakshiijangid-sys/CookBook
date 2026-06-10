import React, { useState } from 'react';
import { Recipe } from '../types';
import { X, Clock, Users, Flame, Check, Sparkles } from 'lucide-react';

interface RecipeDetailsModalProps {
  recipe: Recipe;
  onClose: () => void;
}

export default function RecipeDetailsModal({ recipe, onClose }: RecipeDetailsModalProps) {
  const [checkedIngredients, setCheckedIngredients] = useState<{ [name: string]: boolean }>({});
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const toggleIngredient = (name: string) => {
    setCheckedIngredients(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto animate-fade-in">
      <div 
        id="recipe-details-modal" 
        className="relative w-full max-w-3xl rounded-2xl border border-slate-250 bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Banner with absolute close */}
        <div className="relative h-64 md:h-80 w-full overflow-hidden bg-slate-100 shrink-0">
          <img 
            id={`recipe-details-img-${recipe._id}`}
            src={recipe.image || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&auto=format&fit=crop&q=60'} 
            alt={recipe.name} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&auto=format&fit=crop&q=60';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />
          
          <button 
            id="close-details-top"
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full bg-white p-2.5 text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition shadow-md cursor-pointer"
            title="Close recipe view"
          >
            <X size={16} />
          </button>

          {/* Banner text overlay */}
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <span className="inline-flex rounded-md bg-emerald-600/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider mb-2 font-sans">
              {recipe.category}
            </span>
            <h2 className="font-sans text-2xl md:text-3xl font-extrabold tracking-tight drop-shadow-md">
              {recipe.name}
            </h2>
            <p className="font-sans text-xs text-slate-200 mt-1 line-clamp-2 max-w-2xl drop-shadow-xs">
              {recipe.description}
            </p>
          </div>
        </div>

        {/* Modal Scrollable Contents */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 select-none">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
            <div className="flex flex-col items-center justify-center text-center py-2 border-r border-slate-200/60">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 font-sans mb-1">Prepared In</span>
              <div className="flex items-center gap-1">
                <Clock size={13} className="text-emerald-600" />
                <span className="font-sans text-xs font-bold text-slate-800">{recipe.prepTime} mins</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center text-center py-2 border-r border-slate-200/60">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 font-sans mb-1">Cook Time</span>
              <div className="flex items-center gap-1">
                <Flame size={13} className="text-emerald-600" />
                <span className="font-sans text-xs font-bold text-slate-800">{recipe.cookTime} mins</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center text-center py-2 border-r border-slate-200/60">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 font-sans mb-1">Yields</span>
              <div className="flex items-center gap-1">
                <Users size={13} className="text-emerald-600" />
                <span className="font-sans text-xs font-bold text-slate-800">{recipe.servings} Servings</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center text-center py-2">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 font-sans mb-1">Cook Cost</span>
              <div className="flex items-center gap-1">
                <span className="font-sans text-xs font-extrabold text-emerald-600">${recipe.price.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {/* Ingredients Side Section (2/5 size) */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
                Ingredients Checklist
              </h3>
              <p className="font-sans text-[11px] text-slate-400 mb-1 leading-normal">
                Check off ingredients you have gathered or stocked already:
              </p>

              <div className="space-y-2">
                {recipe.ingredients.map((ing, idx) => {
                  const isChecked = !!checkedIngredients[ing.name];
                  return (
                    <div 
                      key={idx}
                      onClick={() => toggleIngredient(ing.name)}
                      className={`flex items-start gap-3 p-2 rounded-xl transition duration-150 cursor-pointer ${
                        isChecked ? 'bg-slate-50 text-slate-400' : 'hover:bg-emerald-50/20'
                      }`}
                    >
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-white transition ${
                        isChecked ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300 bg-white'
                      }`}>
                        {isChecked && <Check size={11} strokeWidth={3} />}
                      </span>

                      <div className="font-sans text-xs flex-1">
                        <span className={`font-semibold mr-1 text-slate-700 ${isChecked ? 'line-through text-slate-400' : ''}`}>
                          {ing.amount} {ing.unit}
                        </span>
                        <span className={isChecked ? 'line-through text-slate-400' : 'text-slate-850'}>
                          {ing.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Directions Main Section (3/5 size) */}
            <div className="md:col-span-3 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-800">
                  Directions steps
                </h3>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                  <Sparkles size={10} /> Live Guide
                </span>
              </div>
              <p className="font-sans text-[11px] text-slate-400 leading-normal">
                Click a step to highlight it. Keeps you on track and focused as you cook!
              </p>

              <div className="space-y-4">
                {recipe.steps.map((step, idx) => {
                  const isHighlighted = activeStep === idx;
                  return (
                    <div 
                      key={idx}
                      onClick={() => setActiveStep(idx)}
                      className={`flex gap-4 p-3 rounded-xl transition duration-200 cursor-pointer border ${
                        isHighlighted 
                          ? 'bg-emerald-50/40 border-emerald-250 shadow-xs' 
                          : 'border-transparent hover:bg-slate-50'
                      }`}
                    >
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-sans text-xs font-bold leading-none transition ${
                        isHighlighted 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {idx + 1}
                      </span>

                      <p className={`font-sans text-xs leading-relaxed ${
                        isHighlighted ? 'font-medium text-slate-950' : 'text-slate-650'
                      }`}>
                        {step}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Controls Footer */}
        <div className="flex items-center justify-between border-t border-slate-150 px-6 py-4 bg-slate-50/80 shrink-0">
          <div className="flex gap-2">
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 rounded-xl font-sans text-xs font-semibold text-white transition leading-none shadow-xs hover:shadow-md cursor-pointer"
          >
            Finished Cooking
          </button>
        </div>
      </div>
    </div>
  );
}
