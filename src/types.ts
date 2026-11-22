/**
 * TypeScript types for CookBook Recipe Book, Weekly Planner, Grocery List & NutriCare
 */

export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

export interface Product {
  _id: string;
  name: string;
  price: number;
  description: string;
  category: string;
}

export interface Recipe {
  _id: string;
  name: string;
  description: string;
  image: string;
  category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Dessert' | 'Snack';
  prepTime: number;
  cookTime: number;
  servings: number;
  ingredients: Ingredient[];
  steps: string[];
  tags: string[];
  price: number;
  createdAt?: string;
}

export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export interface MealPlan {
  day: DayOfWeek;
  breakfast?: string;
  lunch?: string;
  dinner?: string;
}

export interface GroceryItemRecord {
  id: string;
  itemKey: string;
  name: string;
  amount: string;
  unit: string;
  checked: boolean;
  isCustom: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface HealthyAlternative {
  name: string;
  description: string;
}

export interface NutritionData {
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

export interface NutriScanRecord extends NutritionData {
  id: string;
  query: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}
