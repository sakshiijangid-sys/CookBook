/**
 * TypeScript types for Recipe Book & Planner
 */

export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

export interface Recipe {
  _id: string;
  name: string;
  description: string;
  image: string;
  category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Dessert' | 'Snack';
  prepTime: number; // in mins
  cookTime: number; // in mins
  servings: number;
  ingredients: Ingredient[];
  steps: string[];
  tags: string[];
  price: number; // Cost estimate for the recipe
  createdAt?: string;
}

export interface MealSlot {
  breakfast?: Recipe | null;
  lunch?: Recipe | null;
  dinner?: Recipe | null;
}

export interface MealPlan {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  breakfast?: string; // Recipe ID
  lunch?: string; // Recipe ID
  dinner?: string; // Recipe ID
}

export interface Product {
  _id: string;
  name: string;
  price: number;
  description: string;
  category: string;
}
