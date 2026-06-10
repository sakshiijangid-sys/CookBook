import fs from 'fs';
import path from 'path';
import { Recipe, MealPlan, Product } from '../src/types';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Initial seed data representing seeded documents in our "MongoDB"
const defaultRecipes: Recipe[] = [
  {
    _id: "rec1",
    name: "Classic Avocado Toast",
    description: "Crispy dark rye toast topped with thick, seasoned smashed avocado, cherry tomatoes, and a sprinkle of organic red chili flakes.",
    image: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=600&auto=format&fit=crop&q=60",
    category: "Breakfast",
    prepTime: 10,
    cookTime: 5,
    servings: 2,
    ingredients: [
      { name: "Ripe Avocados", amount: "2", unit: "pieces" },
      { name: "Sourdough Bread", amount: "4", unit: "slices" },
      { name: "Cherry Tomatoes", amount: "100", unit: "g" },
      { name: "Lemon Juice", amount: "1", unit: "tbsp" },
      { name: "Chili Flakes", amount: "1", unit: "tsp" },
      { name: "Sea Salt & Black Pepper", amount: "1", unit: "pinch" }
    ],
    steps: [
      "Toast sourdough slices to a deep golden brown crisp.",
      "In a medium bowl, peel and gently smash the fresh ripe avocados with a fork, mixing in fresh lemon juice, sea salt, and black pepper.",
      "Spread the smashed avocado uniformly over the warm toasted bread slices.",
      "Halve the cherry tomatoes and place them gently on top of the avocado bed.",
      "Garnish with a sprinkle of red chili flakes and extra sea salt before serving."
    ],
    tags: ["Vegetarian", "Quick", "Healthy"],
    price: 4.50,
    createdAt: new Date().toISOString()
  },
  {
    _id: "rec2",
    name: "Creamy Tuscan Tomato Pasta",
    description: "A rich, velvety pasta combined with sun-dried tomatoes, fresh baby spinach, organic garlic, and dairy-free creamy sauce.",
    image: "https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=600&auto=format&fit=crop&q=60",
    category: "Lunch",
    prepTime: 15,
    cookTime: 15,
    servings: 4,
    ingredients: [
      { name: "Penne Pasta", amount: "400", unit: "g" },
      { name: "Sun-Dried Tomatoes", amount: "150", unit: "g" },
      { name: "Fresh Baby Spinach", amount: "200", unit: "g" },
      { name: "Garlic Cloves", amount: "4", unit: "minced" },
      { name: "Heavy Cream (or Coconut Cream)", amount: "250", unit: "ml" },
      { name: "Grated Parmesan Cheese", amount: "50", unit: "g" },
      { name: "Olive Oil", amount: "2", unit: "tbsp" }
    ],
    steps: [
      "Cook penne pasta in a large pot of boiling salted water until al dente, drain and set aside.",
      "Heat olive oil in a heavy skillet and sauté minced garlic until organic aromas fill the kitchen (~1 minute).",
      "Add sun-dried tomatoes and cook for 2 minutes to release oils and flavors.",
      "Pour in cream and bring to a gentle simmer. Add grated parmesan cheese and stir until dissolved and thick.",
      "Add the fresh spinach, letting it wilt gently into the sauce.",
      "Toss the hot pasta into the skillet, stirring to fully coat, and cook for 1 minute before plating."
    ],
    tags: ["Italian", "Creamy", "Hearty"],
    price: 12.90,
    createdAt: new Date().toISOString()
  },
  {
    _id: "rec3",
    name: "Garlic Butter Lemon Salmon",
    description: "Pan-seared premium Atlantic salmon fillet basted with a velvety browned garlic butter sauce and fresh lemon juice.",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=60",
    category: "Dinner",
    prepTime: 10,
    cookTime: 12,
    servings: 2,
    ingredients: [
      { name: "Salmon Fillets", amount: "2", unit: "pieces" },
      { name: "Unsalted Butter", amount: "3", unit: "tbsp" },
      { name: "Garlic Cloves", amount: "3", unit: "minced" },
      { name: "Fresh Lemon Juice", amount: "2", unit: "tbsp" },
      { name: "Lemon Slices", amount: "4", unit: "pieces" },
      { name: "Fresh Parsley", amount: "2", unit: "tbsp chopped" }
    ],
    steps: [
      "Pat salmon fillets dry with paper towels and season both sides generously with salt and black pepper.",
      "Heat a large skillet over medium-high heat with a drizzle of olive oil, sear salmon flesh-side down for 5 minutes.",
      "Flip salmon carefully. Add butter and minced garlic to the pan, swirling to brown.",
      "Spoon the melted garlic butter repeatedly over the cooking salmon for another 4 to 5 minutes.",
      "Pour in fresh lemon juice and add lemon slices. Sauté for 1 quick minute, garnish with chopped parsley and serve immediately."
    ],
    tags: ["Keto", "High Protein", "Seafood"],
    price: 18.50,
    createdAt: new Date().toISOString()
  },
  {
    _id: "rec4",
    name: "Greek Berry Smoothie Bowl",
    description: "A supercharged, chilled smoothie blend of blueberries, strawberries, and thick honey Greek yogurt, topped with homemade nutty granola.",
     image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&auto=format&fit=crop&q=60",
    category: "Breakfast",
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    ingredients: [
      { name: "Frozen Mixed Berries", amount: "1.5", unit: "cups" },
      { name: "Greek Yogurt", amount: "1", unit: "cup" },
      { name: "Almond Milk", amount: "0.25", unit: "cup" },
      { name: "Granola", amount: "0.5", unit: "cup" },
      { name: "Chia Seeds", amount: "1", unit: "tbsp" },
      { name: "Raw Honey", amount: "1", unit: "tbsp" }
    ],
    steps: [
      "Add frozen berries, Greek yogurt, almond milk, and raw honey to a high-speed blender.",
      "Blend on high until perfectly smooth, creamy, and thick like soft-serve ice cream.",
      "Pour the vibrant berry blend into a wide wooden serving bowl.",
      "Artfully line the granola, chia seeds, and some extra fresh sliced strawberries on top in distinct rows.",
      "Drizzle extra honey and serve immediately while cold."
    ],
    tags: ["Healthy", "Gluten-Free", "Fruit"],
    price: 5.90,
    createdAt: new Date().toISOString()
  },
  {
    _id: "rec5",
    name: "Fudgy Chocolate Chip Cookies",
    description: "Chewy on the inside, crispy on the edges, loaded with dark chocolate chunks and topped with flakey salt.",
    image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&auto=format&fit=crop&q=60",
    category: "Dessert",
    prepTime: 15,
    cookTime: 10,
    servings: 12,
    ingredients: [
      { name: "All-Purpose Flour", amount: "250", unit: "g" },
      { name: "Melted Butter", amount: "150", unit: "g" },
      { name: "Brown Sugar", amount: "150", unit: "g" },
      { name: "White Sugar", amount: "50", unit: "g" },
      { name: "Egg & Egg Yolk", amount: "2", unit: "pieces" },
      { name: "Dark Chocolate Chunks", amount: "200", unit: "g" },
      { name: "Flakey Sea Salt", amount: "1", unit: "pinch" }
    ],
    steps: [
      "In a large bowl, whisk melted butter, brown sugar, and white sugar until smooth.",
      "Add egg and egg yolk, whisking vigorously until the mixture dynamically thickens and lightens in color.",
      "Gently fold in the flour and chocolate chunks until just combined (do not overmix).",
      "Scoop dough into balls and chill in the freezer for at least 15 minutes.",
      "Bake at 180°C (350°F) for 10 minutes until edges are light golden brown but centers are still soft and gooey. Sprinkle instantly with flakey sea salt."
    ],
    tags: ["Baking", "Chocolate", "Indulgent"],
    price: 6.20,
    createdAt: new Date().toISOString()
  },
  {
    _id: "rec6",
    name: "Artisan Madagascan Vanilla Ice Cream",
    description: "Rich, creamy vanilla bean ice cream made with organic heavy cream, slow-churned vanilla seeds from Madagascar.",
    image: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=600&auto=format&fit=crop&q=60",
    category: "Dessert",
    prepTime: 20,
    cookTime: 10,
    servings: 6,
    ingredients: [
      { name: "Heavy Whipping Cream", amount: "500", unit: "ml" },
      { name: "Whole Milk", amount: "250", unit: "ml" },
      { name: "Granulated Sugar", amount: "150", unit: "g" },
      { name: "Vanilla Bean Pod", amount: "1", unit: "piece" },
      { name: "Egg Yolks", amount: "5", unit: "pieces" }
    ],
    steps: [
      "In a medium saucepan, join whole milk, sugar, and the scraped vanilla bean seeds with the pod. Heat until just simmering.",
      "Gently whisk the egg yolks in a separate heat-safe bowl.",
      "Slowly pour a ladle of warm milk mixture into the eggs while whisking constantly to temper the yolks.",
      "Return the tempered mixture to the saucepan and cook over low heat until it coats the back of a spoon.",
      "Strain into a clean bowl, stir in the cold heavy cream, and chill completely in the refrigerator.",
      "Churn in an ice cream maker for 25 minutes, then freeze for 4 hours before serving."
    ],
    tags: ["Cold", "Classic", "Sweet"],
    price: 8.50,
    createdAt: new Date().toISOString()
  },
  {
    _id: "rec7",
    name: "Golden Crust Double Smashed Burger",
    description: "Sizzling double smashed beef patties with crispy lace edges, melted American cheese, pickles, and tangy house burger sauce on toasted brioche.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=60",
    category: "Dinner",
    prepTime: 15,
    cookTime: 10,
    servings: 2,
    ingredients: [
      { name: "Ground Beef Blend (80/20)", amount: "350", unit: "g" },
      { name: "Brioche Buns", amount: "2", unit: "pieces" },
      { name: "American Cheese Slices", amount: "4", unit: "pieces" },
      { name: "Tangy Burger Sauce", amount: "4", unit: "tbsp" },
      { name: "Clarified Butter", amount: "1", unit: "tbsp" },
      { name: "Pickled Cucumber Slices", amount: "8", unit: "pieces" }
    ],
    steps: [
      "Form ground beef into 4 loose round balls (about 85g each) and keep chilled until ready to sear.",
      "Spread clarified butter on split brioche buns and toast in a hot cast-iron skillet until beautifully browned.",
      "Heat the clean cast-iron pan until scorching hot. Place beef balls onto the skillet with generous spacing.",
      "Use a heavy metal spatula to smash each ball perfectly flat. Season immediately with sea salt.",
      "Cook for 2 minutes to develop a thick, deep-golden, caramelized lacy crust. Flip carefully.",
      "Place a slice of American cheese on each patty, stack them in pairs, and cover for 30 seconds to melt.",
      "Assemble by spreading house sauce on toasted bottom bun, adding pickled cucumbers, cheese patty, and bun top."
    ],
    tags: ["Beef", "Savory", "American"],
    price: 14.20,
    createdAt: new Date().toISOString()
  },
  {
    _id: "rec8",
    name: "Spicy Sichuan Chili Oil Noodles",
    description: "Springy wheat noodles tossed in a fragrant, fiery house Sichuan chili oil, sesame paste, roasted peanuts, and green scallions.",
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&auto=format&fit=crop&q=60",
    category: "Lunch",
    prepTime: 10,
    cookTime: 10,
    servings: 2,
    ingredients: [
      { name: "Wheat Noodles", amount: "300", unit: "g" },
      { name: "Sichuan Chili Oil", amount: "3", unit: "tbsp" },
      { name: "Chinkiang Black Vinegar", amount: "2", unit: "tbsp" },
      { name: "Toasted Sesame Paste", amount: "1.5", unit: "tbsp" },
      { name: "Light Soy Sauce", amount: "2", unit: "tbsp" },
      { name: "Crushed Roasted Peanuts", amount: "2", unit: "tbsp" },
      { name: "Minced Garlic & Scallions", amount: "3", unit: "tbsp" }
    ],
    steps: [
      "In a wide serving bowl, whisk soy sauce, Sichuan chili oil, sesame paste, black vinegar, and minced garlic together.",
      "Boil noodles in hot water for 4–5 minutes until soft and springy with a slight bite.",
      "Ladle 2 tablespoons of hot noodle water into the sauce bowl and stir to loosen the sesame sauce.",
      "Drain noodles and transfer them hot directly into the ingredients sauce bowl.",
      "Toss vigorously until the noodles are fully coated in the red chili sauce oil.",
      "Garnish with chopped green scallions, fresh cilantro, and roasted crushed peanuts before enjoying."
    ],
    tags: ["Spicy", "Noodles", "Sichuan"],
    price: 11.80,
    createdAt: new Date().toISOString()
  },
  {
    _id: "rec9",
    name: "Velvety Fudge Chocolate Cake",
    description: "An incredibly moist chocolate cake layers glazed in a decadent, rich dark chocolate fudge buttercream.",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=60",
    category: "Dessert",
    prepTime: 25,
    cookTime: 30,
    servings: 10,
    ingredients: [
      { name: "All-Purpose Flour", amount: "250", unit: "g" },
      { name: "Granulated Sugar", amount: "350", unit: "g" },
      { name: "Cocoa Powder", amount: "90", unit: "g" },
      { name: "Buttermilk", amount: "240", unit: "ml" },
      { name: "Hot Coffee (or Boiling Water)", amount: "240", unit: "ml" },
      { name: "Fresh Egg Eggs", amount: "2", unit: "pieces" },
      { name: "Softened Butter", amount: "200", unit: "g" },
      { name: "Powdered Sugar", amount: "300", unit: "g" }
    ],
    steps: [
      "Preheat your oven to 175°C (350°F) and line two 8-inch round cake pans with parchment paper.",
      "Whisk flour, sugar, coco powder, baking powder, and a pinch of salt in a deep bowl.",
      "Add buttermilk, eggs, oil, and vanilla extract. Beat with an electric mixer until fully smooth.",
      "Slowly pour in hot coffee, mixing on low speed (the batter will be thin, which makes the cake super moist).",
      "Divide evenly between pans and bake for 30 minutes until a toothpick inserted in the center comes out clean.",
      "Let cool completely. Cream softened butter, powdered sugar, and cocoa powder into a thick buttercream and frost the layers."
    ],
    tags: ["Chocolate", "Baking", "Rich"],
    price: 16.90,
    createdAt: new Date().toISOString()
  },
  {
    _id: "rec10",
    name: "Creamy Walnut Basil Pesto Pasta",
    description: "Al dente trottole pasta tossed in fresh sweet basil, roasted garlic, toasted walnuts, cold-pressed olive oil, and aged Pecorino Romano.",
    image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600&auto=format&fit=crop&q=60",
    category: "Dinner",
    prepTime: 12,
    cookTime: 10,
    servings: 3,
    ingredients: [
      { name: "Fresh Trottole Pasta", amount: "350", unit: "g" },
      { name: "Sweet Basil Leaves", amount: "3", unit: "cups packed" },
      { name: "Toasted Walnuts", amount: "50", unit: "g" },
      { name: "Garlic Cloves", amount: "2", unit: "pieces" },
      { name: "Extra Virgin Olive Oil", amount: "120", unit: "ml" },
      { name: "Grated Pecorino Romano", amount: "75", unit: "g" },
      { name: "Sea Salt & Pepper", amount: "1", unit: "pinch" }
    ],
    steps: [
      "Toast walnut halves in a dry pan over low-medium heat until fragrant, then let them cool.",
      "Boil trottole pasta in a large pot of salted water until perfectly al dente (~9 minutes). Reserve 1 cup of pasta water.",
      "In a food processor, pulse basil leaves, garlic, Pecorino cheese, and toasted walnuts until coarsely chopped.",
      "With the processor running, slowly stream in extra virgin olive oil to emulsify into a rich green pesto.",
      "Drain pasta and stir in the fresh basil pesto, adding a splash of reserved starched water to create a silky, glossy coating.",
      "Plate instantly, topped with more grated cheese and a fresh sprig of sweet basil."
    ],
    tags: ["Italian", "Vegetarian", "Pesto"],
    price: 13.50,
    createdAt: new Date().toISOString()
  }
];

const defaultProducts: Product[] = [
  { _id: "prod1", name: "Premium Saffron Threads", price: 29.99, description: "Hand-picked high grade Persian saffron threads.", category: "Spices" },
  { _id: "prod2", name: "Organic Extra Virgin Olive Oil", price: 18.50, description: "Cold-pressed extra-virgin olive oil from Tuscany.", category: "Oil" },
  { _id: "prod3", name: "Himalayan Pink Rock Salt Grinder", price: 6.99, description: "Pure mineral pink salt crystals with built-in grinder.", category: "Seasoning" }
];

const defaultMealPlans: MealPlan[] = [
  { day: "Monday", breakfast: "rec1", lunch: "rec2", dinner: "rec3" },
  { day: "Tuesday", breakfast: "rec4", lunch: "rec2", dinner: "rec5" },
  { day: "Wednesday", breakfast: "rec1", lunch: "rec4", dinner: "rec3" },
  { day: "Thursday", breakfast: "rec1", lunch: "rec2", dinner: "rec3" },
  { day: "Friday", breakfast: "rec4", lunch: "rec1", dinner: "rec2" },
  { day: "Saturday", breakfast: "rec4", lunch: "rec2", dinner: "rec5" },
  { day: "Sunday", breakfast: "rec1", lunch: "rec3", dinner: "rec4" }
];

interface DbSchema {
  recipes: Recipe[];
  mealPlans: MealPlan[];
  products: Product[];
}

function generateDiverseRecipes(existingRecipes: Recipe[]): Recipe[] {
  const recipes = [...existingRecipes];
  const usedRecipeNames = new Set<string>(recipes.map(r => r.name));
  
  const categories = ["Breakfast", "Lunch", "Dinner", "Dessert", "Snack"];
  
  // Categorized ingredients pools for highly realistic recipe items!
  const ingredientPools: { [cat: string]: { name: string; unit: string; minAmt: number; maxAmt: number }[] } = {
    "Breakfast": [
      { name: "Organic Eggs", unit: "pieces", minAmt: 2, maxAmt: 4 },
      { name: "Ripe Avocados", unit: "pieces", minAmt: 1, maxAmt: 2 },
      { name: "Whole Wheat Toast", unit: "slices", minAmt: 2, maxAmt: 4 },
      { name: "Sourdough Bread", unit: "slices", minAmt: 2, maxAmt: 4 },
      { name: "Unsalted Butter", unit: "tbsp", minAmt: 1, maxAmt: 2 },
      { name: "Chili Flakes", unit: "tsp", minAmt: 0.5, maxAmt: 1.5 },
      { name: "Fresh Baby Spinach", unit: "g", minAmt: 50, maxAmt: 100 },
      { name: "Cherry Tomatoes", unit: "g", minAmt: 50, maxAmt: 100 },
      { name: "Greek Yogurt", unit: "cup", minAmt: 1, maxAmt: 2 },
      { name: "Granola", unit: "cup", minAmt: 0.25, maxAmt: 0.5 },
      { name: "Raw Honey", unit: "tbsp", minAmt: 1, maxAmt: 2 },
      { name: "Maple Syrup", unit: "tbsp", minAmt: 1, maxAmt: 3 },
      { name: "Chia Seeds", unit: "tbsp", minAmt: 1, maxAmt: 2 },
      { name: "Fresh Blueberries", unit: "cup", minAmt: 0.5, maxAmt: 1 },
      { name: "Crispy Bacon Slices", unit: "pieces", minAmt: 2, maxAmt: 4 },
      { name: "Smoked Salmon", unit: "g", minAmt: 50, maxAmt: 100 },
      { name: "Oats", unit: "cup", minAmt: 0.5, maxAmt: 1.5 },
      { name: "Almond Milk", unit: "cup", minAmt: 1, maxAmt: 2 },
      { name: "Cream Cheese", unit: "tbsp", minAmt: 2, maxAmt: 4 }
    ],
    "Lunch": [
      { name: "Grilled Chicken Breast", unit: "g", minAmt: 150, maxAmt: 250 },
      { name: "Quinoa", unit: "g", minAmt: 100, maxAmt: 200 },
      { name: "Tuna Canned", unit: "g", minAmt: 120, maxAmt: 180 },
      { name: "Romaine Lettuce", unit: "head", minAmt: 0.5, maxAmt: 1 },
      { name: "Extra Virgin Olive Oil", unit: "tbsp", minAmt: 1, maxAmt: 2 },
      { name: "Balsamic Vinegar", unit: "tbsp", minAmt: 1, maxAmt: 2 },
      { name: "Cucumbers", unit: "pieces", minAmt: 0.5, maxAmt: 1 },
      { name: "Feta Cheese", unit: "g", minAmt: 50, maxAmt: 100 },
      { name: "Whole Wheat Wrap", unit: "pieces", minAmt: 1, maxAmt: 2 },
      { name: "Bell Peppers", unit: "pieces", minAmt: 0.5, maxAmt: 1.5 },
      { name: "Fresh Basil Pesto", unit: "tbsp", minAmt: 2, maxAmt: 3 },
      { name: "Parmesan Cheese", unit: "g", minAmt: 30, maxAmt: 50 },
      { name: "Hummus", unit: "tbsp", minAmt: 2, maxAmt: 4 },
      { name: "Cherry Tomatoes", unit: "g", minAmt: 80, maxAmt: 150 },
      { name: "Black Beans", unit: "g", minAmt: 100, maxAmt: 200 },
      { name: "Cheddar Cheese", unit: "g", minAmt: 50, maxAmt: 100 },
      { name: "Fresh Cilantro", unit: "tbsp", minAmt: 1, maxAmt: 2 },
      { name: "Sichuan Chili Oil", unit: "tbsp", minAmt: 1, maxAmt: 2 },
      { name: "Ramen Noodles", unit: "g", minAmt: 150, maxAmt: 250 }
    ],
    "Dinner": [
      { name: "Prime Atlantic Salmon", unit: "g", minAmt: 150, maxAmt: 300 },
      { name: "Beef Tenderloin Ribeye", unit: "g", minAmt: 200, maxAmt: 350 },
      { name: "Chicken Breast Fillets", unit: "g", minAmt: 200, maxAmt: 400 },
      { name: "Organic Firm Tofu", unit: "g", minAmt: 200, maxAmt: 300 },
      { name: "Garlic Cloves", unit: "minced", minAmt: 2, maxAmt: 5 },
      { name: "Unsalted Butter", unit: "tbsp", minAmt: 2, maxAmt: 4 },
      { name: "Lemon Juice", unit: "tbsp", minAmt: 1, maxAmt: 2 },
      { name: "Penne Pasta", unit: "g", minAmt: 200, maxAmt: 400 },
      { name: "Heavy Cream", unit: "ml", minAmt: 100, maxAmt: 250 },
      { name: "Asparagus Spears", unit: "g", minAmt: 100, maxAmt: 150 },
      { name: "Jasmine Rice", unit: "g", minAmt: 150, maxAmt: 300 },
      { name: "Broccoli Florets", unit: "g", minAmt: 100, maxAmt: 200 },
      { name: "Shallots", unit: "pieces", minAmt: 1, maxAmt: 2 },
      { name: "Teriyaki Sauce", unit: "tbsp", minAmt: 2, maxAmt: 4 },
      { name: "Soy Sauce", unit: "tbsp", minAmt: 1, maxAmt: 3 },
      { name: "Fresh Basil Leaves", unit: "cup", minAmt: 0.5, maxAmt: 1 },
      { name: "Mushrooms", unit: "g", minAmt: 100, maxAmt: 150 },
      { name: "Parmesan Romano", unit: "g", minAmt: 30, maxAmt: 70 }
    ],
    "Dessert": [
      { name: "All-Purpose Flour", unit: "g", minAmt: 150, maxAmt: 300 },
      { name: "Granulated Sugar", unit: "g", minAmt: 100, maxAmt: 250 },
      { name: "Brown Sugar", unit: "g", minAmt: 50, maxAmt: 150 },
      { name: "Cocoa Powder", unit: "g", minAmt: 40, maxAmt: 100 },
      { name: "Unsalted Butter", unit: "g", minAmt: 100, maxAmt: 200 },
      { name: "Premium Vanilla Extract", unit: "tsp", minAmt: 1, maxAmt: 2 },
      { name: "Whole Milk", unit: "ml", minAmt: 100, maxAmt: 250 },
      { name: "Heavy Whipping Cream", unit: "ml", minAmt: 200, maxAmt: 400 },
      { name: "Dark Chocolate Chips", unit: "g", minAmt: 100, maxAmt: 200 },
      { name: "Fresh Egg Yolks", unit: "pieces", minAmt: 2, maxAmt: 5 },
      { name: "Powdered Sugar", unit: "g", minAmt: 100, maxAmt: 200 },
      { name: "Fresh Raspberries", unit: "g", minAmt: 50, maxAmt: 100 },
      { name: "Flakey Sea Salt", unit: "pinch", minAmt: 1, maxAmt: 2 },
      { name: "Baking Powder", unit: "tsp", minAmt: 1, maxAmt: 2 },
      { name: "Cream Cheese", unit: "g", minAmt: 150, maxAmt: 300 }
    ],
    "Snack": [
      { name: "Kale Leaves", unit: "g", minAmt: 100, maxAmt: 200 },
      { name: "Organic Chickpeas", unit: "g", minAmt: 150, maxAmt: 300 },
      { name: "Raw Nuts & Seeds Blend", unit: "cup", minAmt: 0.5, maxAmt: 1.5 },
      { name: "Sweet Potatoes", unit: "pieces", minAmt: 1, maxAmt: 2 },
      { name: "Fresh Strawberries", unit: "g", minAmt: 100, maxAmt: 200 },
      { name: "Edamame Pods", unit: "g", minAmt: 150, maxAmt: 250 },
      { name: "Popcorn Kernels", unit: "cup", minAmt: 0.25, maxAmt: 0.5 },
      { name: "Classic Hummus Dip", unit: "tbsp", minAmt: 3, maxAmt: 6 },
      { name: "Fresh Fruit Skewers", unit: "pieces", minAmt: 2, maxAmt: 4 },
      { name: "Avocado Guacamole", unit: "cup", minAmt: 0.5, maxAmt: 1 },
      { name: "Crispy Tortilla Chips", unit: "g", minAmt: 50, maxAmt: 100 },
      { name: "Organic Brown Rice Cakes", unit: "pieces", minAmt: 2, maxAmt: 4 },
      { name: "Creamy Peanut Butter", unit: "tbsp", minAmt: 2, maxAmt: 4 },
      { name: "Zucchini Spears", unit: "g", minAmt: 100, maxAmt: 200 },
      { name: "Premium Medjool Dates", unit: "pieces", minAmt: 4, maxAmt: 8 }
    ]
  };

  const stepsPools: { [cat: string]: string[] } = {
    "Breakfast": [
      "Prepare all basic breakfast ingredients on a clean workstation.",
      "Heat a non-stick skillet over medium-low heat with butter or olive oil.",
      "Ladle or portion the primary batter or egg prep into the warm pan.",
      "Toast or heat the complementary bread or starch to a light, crispy brown.",
      "Sauté or whip the primary breakfast components until warm and wonderfully fragrant.",
      "Transfer the toasted pieces to a clean display plate and stack or spread neatly.",
      "Slowly dress with sweet syrup, active honey drizzle, or quality extra virgin oil.",
      "Garnish cleanly with fresh berries, chopped scallions, or a sprinkle of toasted seeds."
    ],
    "Lunch": [
      "Wash and chop all vegetables, salad greens, and prep items with care.",
      "If using a protein, season nicely and sear on medium-high heat until cooked through.",
      "Whisk or combine the dressing ingredients in a small glass jar until completely emulsified.",
      "In a large decorative mixing bowl, toss the grain, base greens, and colorful toppings.",
      "Toast the artisan wrap or sandwich bread until crisp and slightly charred.",
      "Assemble cleanly, placing sliced protein on top of the fresh salad or inside the toasted bread.",
      "Drizzle the homemade dressing or savory pesto sauce evenly over the top.",
      "Add a final sprinkle of crumbly cheese, nuts, and crushed toasted garlic plates."
    ],
    "Dinner": [
      "Preheat the oven or sear skillet to correct high temperature before starting.",
      "Pat the primary protein or gourmet steak completely dry and season both sides generously.",
      "Heat olive oil or butter in a heavy skillet until shimmering; sear protein for beautiful browning.",
      "Reduce heat, baste continuously with melted garlic butter, shallots, and fresh herbs.",
      "Boil side pasta, aromatic jasmine rice, or prep mashed potatoes until perfectly tender.",
      "Roast garden asparagus or fresh broccoli spears under a broiler for a rich caramelized finish.",
      "Deglaze the juicy skillet pan with light lemon juice or broth to create a velvety reduction sauce.",
      "Artfully slice protein, layer on the warm starches, and spoon savory reduction sauce over the plate."
    ],
    "Dessert": [
      "Preheat oven accurately to 175°C (350°F) and prepare the cooking pan with parchment paper.",
      "Sift dry flour, sugar, premium organic cocoa powder, and rising agent together into a deep bowl.",
      "Whisk local eggs with sugar and vanilla until the mixture thickens and achieves ribbon stage.",
      "Gently fold the dry ingredients into the creamy wet batter until just combined.",
      "Stir in dark melted chocolate chips, roasted nuts, or colorful hand-picked fresh fruit.",
      "Pour into the baking molds and smooth the top evenly with an offset spatula.",
      "Bake until a wooden toothpick inserted into the center emerges clean and hot.",
      "Let cool fully before dusting carefully with powdered sugar or spreading a thick fudge glaze."
    ],
    "Snack": [
      "Gather and measure all snack items, checking crispness and quality.",
      "For warm snacks, bake, roast or pop the items onto a hot cooking pan.",
      "Season evenly with fine sea salts, spice overlays, or fresh citrus zest.",
      "In a small aesthetic dip bowl, mix companion sauces, hummus, or soft cheese spreads.",
      "Slice fresh fruit or organic root crisps into easy finger-food portions.",
      "Stack or layer snacks elegantly in small wooden bowls or share boards.",
      "Drizzle with nut butters, floral raw honey, or fine melted chocolate strings.",
      "Serve instantly as a high-nutrition booster or a crisp, flavorful bite."
    ]
  };

  const tagsPools: Record<string, string[]> = {
    "Breakfast": ["Healthy", "Quick", "Vegetarian", "Sweet", "High Protein", "Gluten-Free", "Warm", "Classic"],
    "Lunch": ["Fresh", "Easy", "Light", "Mediterranean", "Low Carb", "Vegetarian", "Creamy", "Asian"],
    "Dinner": ["High Protein", "Savory", "Gourmet", "Hearty", "Keto", "Seafood", "Italian", "Steak"],
    "Dessert": ["Sweet", "Baking", "Chocolate", "Classic", "Rich", "Indulgent", "Cold", "Fruit"],
    "Snack": ["Crispy", "Healthy", "Crunchy", "Bite-Sized", "Energy", "Quick", "Savory", "Gluten-Free"]
  };

  const nameComponents: { [cat: string]: { adjectives: string[]; mains: string[]; accents: string[] } } = {
    "Breakfast": {
      adjectives: ["Crispy", "Fluffy", "Spiced", "Sweet", "Savory", "Organic", "Golden", "Smoked", "Healthy", "Warm", "Toasted", "Bacon &", "Fruity", "Zesty", "Artisan", "Sun-Dried", "Gourmet", "Vermont", "California", "Swiss"],
      mains: ["Avocado Toast", "Maple Pancake", "French Toast", "Greek Yogurt Parfait", "Oatmeal Bowl", "Eggs Benedict", "Frittata", "Breakfast Burrito", "Florentine Omelet", "Gluten-Free Waffle", "Chia Pudding", "Acai Bowl", "Bagel with Schmear", "Shakshuka", "Hash Brown Skillet", "Breakfast Panini", "Steel Cut Oats", "Muesli Bowl", "Egg White Scramble", "Buttermilk Waffle"],
      accents: ["with Fresh Berries", "topped with Thyme", "with Smashed Garlic", "infused with Vanilla", "with Roasted Peppers", "with Sea Salt", "accompanied by Honey", "with Fresh Dill", "garnished with Scallions", "drizzled with Maple", "with Sliced Banana", "sprinkled with Almonds", "with Toasted Chia", "with Chive Cream", "paired with Spinach"]
    },
    "Lunch": {
      adjectives: ["Tuscan", "Mediterranean", "Spicy Sichuan", "Zesty Lemon", "Garlic Butter", "Herb-Crusted", "Sesame Ginger", "BBQ Side", "Creamy", "Chilled", "Fresh Garden", "California Style", "Gourmet", "Asian-Style", "Mexican", "Sautéed", "Provencal", "Smoky", "Green-Goddess", "Harvest"],
      mains: ["Chicken Quinoa Salad", "Caesar Wrap", "Penne Pesto Pasta", "Tomato Basil Soup", "Turkey Avocado Club", "Buddha Veggie Bowl", "Tuna Melt", "Falafel Hummus Pita", "Szechuan Noodle Bowl", "Beef Quesadilla", "Salmon Poke Bowl", "Caprese Panini", "Greek Chickpea Salad", "Cobb Salad Plate", "Lentil Soup Pot", "BLT Croissant", "Edamame Soba Bowls", "Minestrone Stew", "Falafel Salad Wrap", "Shrimp Taco Trio"],
      accents: ["with Balsamic Glaze", "topped with Pecans", "with Warm Focaccia", "with Crispy Garlic", "drizzled with Aioli", "with Sweet Potato Wedges", "with Roasted Chickpeas", "topped with Parmigiano", "with Cilantro Cream", "garnished with Radishes", "with Sesames", "with Sliced Cucumber", "drizzled with Vinaigrette", "with Sunflower Seeds", "paired with Pita Chips"]
    },
    "Dinner": {
      adjectives: ["Pan-Seared", "Slow-Roasted", "Flame-Grilled", "Baked", "Tender", "Rich Cured", "Braised", "Blackened", "Honey Glazed", "Garlic Butter", "Citrus Herb", "Sweet Chili", "Savory", "Pesto Infused", "Panko-Crusted", "Red-Wine", "Smothered", "Rustic", "Chef's Classic", "Teriyaki"],
      mains: ["Atlantic Salmon Fillet", "Ribeye Steak Platter", "Honey Mustard Chicken", "Slow-Cooked Pork Chop", "Lentil Shepherd's Pie", "Sea Bass Fillet", "Beef Stroganoff", "Lobster Mac & Cheese", "Eggplant Parmesan", "Shrimp Scampi Fettuccine", "Chicken Parmigiana", "Teriyaki Tofu Skewers", "Wild Mushroom Risotto", "BBQ Baby Back Ribs", "Halibut Pan Roast", "Duck Breast Seared", "Stuffed Bell Peppers", "Beef Roast Slices", "Lamb Meatball Bowl", "Chicken Tikka Masala"],
      accents: ["on Jasmine Rice", "with Garlic Broccoli", "with Mashed Potatoes", "with Asparagus Sauté", "with Chimichurri Sauce", "with Red Wine Sauce", "with Roasted Brussels Sprouts", "garnished with Parsley", "with Glazed Carrots", "topped with Thyme Butter", "on Creamy Polenta", "with Sautéed Haricots", "with Wild Mushrooms", "paired with Sweet Onions", "with Lemon Butter Drizzle"]
    },
    "Dessert": {
      adjectives: ["Velvety Fudge", "Artisan Seed", "Chilled", "Fluffy", "Crisp Tart", "Decadent", "Warm Melted", "Gooey", "Silky Smooth", "Classic", "Rich Creamy", "Tangy", "Elegant", "Fruity", "French-style", "Triple-Choc", "Golden-Brown", "Espresso-Infused", "Madison", "Sweetened"],
      mains: ["Chocolate Lava Cake", "New York Cheesecake", "Vanilla Custard Bowl", "Key Lime Pie", "Double Choice Cookie", "Apple Berry Crumble", "Strawberry Shortcake", "Amaretto Tiramisu Cup", "Caramel Walnut Brownie", "Crème Brûlée", "Matcha Panna Cotta", "Lemon Meringue Tart", "Coconut Macaroons", "Red Velvet Cupcake", "Peach Galette", "Banana Foster Flambé", "White Chocolate Mousse", "Blueberry Scone Stack", "Pecan Pie Slice", "Chocolate Soufflé"],
      accents: ["with Whipped Cream", "with Raspberries", "with Dark Chocolate", "with Powdered Sugar", "with Caramel Drizzle", "with Flakey Sea Salt", "with Mint Leaves", "with Vanilla Bean Glaze", "drizzled with Honey", "topped with Strawberries", "with Toasted Coconut", "with Candied Pecans", "with Chocolate curls", "with Zesty Orange Peel", "with Smashed Pistachios"]
    },
    "Snack": {
      adjectives: ["Crispy", "Healthy", "Crunchy", "Spiced", "Sweet", "Savory", "Zesty", "Baked", "Toasted", "Bite-Sized", "Energy-Boosting", "Roasted", "Smoked", "Cheesy", "Gourmet", "Maple-Glazed", "Seasoned", "Salted", "Quick", "Nutritious"],
      mains: ["Kale Chips", "Roasted Chickpeas", "Trail Mix Bowl", "Granola Bar Duo", "Sweet Potato Crisps", "Raw Energy Bites", "Dipped Strawberry Pack", "Edamame Pod Plate", "Gourmet Popcorn", "Hummus Dip Platter", "Fruit Skewers", "Guacamole Chips Trio", "Peanut Butter Rice Cakes", "Crispy Zucchini Fries", "Bacon Wrapped Dates"],
      accents: ["with Cinnamon Dust", "with Sea Salt Grinds", "sprinkled with Paprika", "drizzled with Peanut Butter", "infused with Lime Juice", "topped with Parmigiano", "with Roasted Garlic", "with Chocolate Drizzle", "garnished with Chili Powder", "with Sesame Coating", "with Chili Flakes", "paired with Ranch Dip", "topped with Walnuts", "with Yogurt Dipping Sauce", "drizzled with Balsamic"]
    }
  };

  // Deterministic LCG
  let seedVal = 987654321;
  function randomLCG() {
    seedVal = (1103515245 * seedVal + 12345) % 2147483648;
    return seedVal / 2147483648;
  }

  function pickRandom<T>(arr: T[]): T {
    const idx = Math.floor(randomLCG() * arr.length);
    return arr[idx];
  }

  for (const cat of categories) {
    const currentCount = recipes.filter(r => r.category === cat).length;
    // We aim for precisely 70 recipes per category
    let targetToGenerate = 70 - currentCount;
    if (targetToGenerate < 0) targetToGenerate = 0;

    const comps = nameComponents[cat];
    const ingPool = ingredientPools[cat];
    const stepPool = stepsPools[cat];
    const tagPool = tagsPools[cat];

    for (let i = 0; i < targetToGenerate; i++) {
      let recipeName = "";
      while (true) {
        let adj = pickRandom(comps.adjectives);
        let main = pickRandom(comps.mains);
        let accent = pickRandom(comps.accents);
        recipeName = `${adj} ${main} ${accent}`;
        if (!usedRecipeNames.has(recipeName)) {
          usedRecipeNames.add(recipeName);
          break;
        }
      }

      const numIngredients = 4 + Math.floor(randomLCG() * 4);
      const chosenIngredients: { name: string; amount: string; unit: string }[] = [];
      const usedIngs = new Set<string>();

      while (chosenIngredients.length < numIngredients) {
        const candidate = pickRandom(ingPool);
        if (!usedIngs.has(candidate.name)) {
          usedIngs.add(candidate.name);
          const range = candidate.maxAmt - candidate.minAmt;
          let amtVal = candidate.minAmt + (randomLCG() * range);
          let amtStr = amtVal % 1 === 0 ? amtVal.toFixed(0) : amtVal.toFixed(1);
          chosenIngredients.push({
            name: candidate.name,
            amount: amtStr,
            unit: candidate.unit
          });
        }
      }

      const desc = `Indulge in a beautifully crafted ${recipeName.toLowerCase()}, perfect for any lover of authentic, balanced gourmet food. Features premium local ingredients, expert seasoning, and simple home-chef guidelines.`;

      const basePrice = cat === "Breakfast" ? 4.90 : cat === "Lunch" ? 9.90 : cat === "Dinner" ? 14.90 : cat === "Snack" ? 3.90 : 5.90;
      const finalPrice = Math.round((basePrice + randomLCG() * 8.50) * 10) / 10;

      const numSteps = 4 + Math.floor(randomLCG() * 2);
      const recipeSteps: string[] = [];
      const sortedPoolIdxs = Array.from({ length: stepPool.length }, (_, idx) => idx).slice(0, numSteps);
      sortedPoolIdxs.forEach(idx => {
        recipeSteps.push(stepPool[idx]);
      });

      const numTags = 2 + Math.floor(randomLCG() * 2);
      const recipeTags: string[] = [];
      const usedTags = new Set<string>();
      while (recipeTags.length < numTags) {
        const tag = pickRandom(tagPool);
        if (!usedTags.has(tag)) {
          usedTags.add(tag);
          recipeTags.push(tag);
        }
      }

      const prepTime = 5 * (1 + Math.floor(randomLCG() * 5));
      const cookTime = 5 * (Math.floor(randomLCG() * 8));

      // Resolve a gorgeous, category/keyword-associated smart image URL directly here!
      const resolvedImage = getSmartRecipeImage(recipeName, cat, undefined, i);

      recipes.push({
        _id: `rec_gen_${cat.toLowerCase()}_${i}`,
        name: recipeName,
        description: desc,
        image: resolvedImage,
        category: cat as any,
        prepTime,
        cookTime,
        servings: 1 + Math.floor(randomLCG() * 4),
        ingredients: chosenIngredients,
        steps: recipeSteps,
        tags: recipeTags,
        price: finalPrice,
        createdAt: new Date().toISOString()
      });
    }
  }

  return recipes;
}

function initDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  let dbData: DbSchema;
  let needsWrite = false;

  if (!fs.existsSync(DB_FILE)) {
    dbData = {
      recipes: defaultRecipes,
      mealPlans: defaultMealPlans,
      products: defaultProducts
    };
    needsWrite = true;
  } else {
    try {
      dbData = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch (e) {
      dbData = {
        recipes: defaultRecipes,
        mealPlans: defaultMealPlans,
        products: defaultProducts
      };
      needsWrite = true;
    }
  }

  // Cross-reference counts to verify if the 70-size seed already ran successfully
  const categoriesToCheck = ["Breakfast", "Lunch", "Dinner", "Dessert", "Snack"];
  const countsPerCategory = categoriesToCheck.map(cat => dbData.recipes.filter(r => r.category === cat).length);
  const minCount = Math.min(...countsPerCategory);
  const maxCount = Math.max(...countsPerCategory);

  if (minCount < 70 || maxCount > 70) {
    console.log(`[SEED] Standardizing recipes database to exactly 70 per category (Min: ${minCount}, Max: ${maxCount})`);
    
    // Group existing recipes by category
    const categorizedRecipes: Record<string, Recipe[]> = {};
    categoriesToCheck.forEach(cat => {
      categorizedRecipes[cat] = dbData.recipes.filter(r => r.category === cat);
    });

    // Prune categories that exceed 70
    categoriesToCheck.forEach(cat => {
      if (categorizedRecipes[cat].length > 70) {
        categorizedRecipes[cat] = categorizedRecipes[cat].slice(0, 70);
      }
    });

    // Reassemble pruned list
    let prunedRecipes: Recipe[] = [];
    categoriesToCheck.forEach(cat => {
      prunedRecipes = prunedRecipes.concat(categorizedRecipes[cat]);
    });

    // Generate up to 70 if any category is underfilled
    dbData.recipes = generateDiverseRecipes(prunedRecipes);
    needsWrite = true;
  }

  // Migrate any existing recipes to ensure 100% unique, relevant images!
  let migratedCount = 0;
  dbData.recipes = dbData.recipes.map(recipe => {
    const isGenerated = recipe._id.startsWith('rec_gen_');
    const endsWithNumMatch = recipe._id.match(/_(\d+)$/);
    const textHash = hashString(recipe.name);
    
    let targetIndex = textHash % 70;
    if (isGenerated && endsWithNumMatch) {
      targetIndex = parseInt(endsWithNumMatch[1], 10);
    }
    
    const newImage = getSmartRecipeImage(recipe.name, recipe.category, undefined, targetIndex);
    if (recipe.image !== newImage) {
      recipe.image = newImage;
      migratedCount++;
    }
    return recipe;
  });

  if (migratedCount > 0) {
    needsWrite = true;
    console.log(`[MIGRATION] Successfully updated ${migratedCount} recipes inside the json database with unique, high-quality, category-relevant images!`);
  }

  if (needsWrite) {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
    console.log(`[SEED] Success! Saved database file with ${dbData.recipes.length} recipes.`);
  }
}


let dbCache: DbSchema | null = null;

function readDb(): DbSchema {
  if (dbCache) {
    return dbCache;
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    dbCache = JSON.parse(data);
    return dbCache!;
  } catch (err) {
    console.error("Error reading db.json, returning defaults", err);
    return { recipes: defaultRecipes, mealPlans: defaultMealPlans, products: defaultProducts };
  }
}

function writeDb(data: DbSchema) {
  try {
    dbCache = data;
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error writing db.json", err);
  }
}

const BREAKFAST_FALLBACKS = [
  "photo-1525351484163-7529414344d8", // Eggs avocado toast
  "photo-1506084868230-bb9d95c24759", // Berry loaded waffle
  "photo-1533089860892-a7c6f0a88666", // Syrup pancake stack
  "photo-1528207776546-365bb710ee93", // Strawberry pancakes
  "photo-1515276340591-e6851590ec7f", // Soft waffle breakfast
  "photo-1496412705862-e0088f16f791", // Morning table layout
  "photo-1504754524776-8f4f37790ca0", // Poached egg on scrambled bread
  "photo-1484723091739-30a097e8f929", // Organic mixed fruit toast
  "photo-1538089934305-7793b5143324", // Sunny side up skillet eggs
  "photo-1513442538419-bc67d301edc1", // Hot oatmeal morning coffee
  "photo-1541519227354-08fa5d50c44d", // Smashed avocado toast
  "photo-1495214783159-3503fd1b572d", // Poached egg yolks toast
  "photo-1509440159596-0249088772ff", // Buttered sourdough slice
  "photo-1497534446932-c925b458314e", // Milk and berries smoothie bowl
  "photo-1541271696-eedd7e5b0f35", // Salmon cream bagel
  "photo-1571877227200-a0d98ea607e9", // Green kiwi fruit cereal bowl
  "photo-1488477181946-6428a0291777", // Mixed yogurt parfait jar
  "photo-1508736891632-411a0cc3f6d7", // Creamy organic chia pudding
  "photo-1517709360219-b40af9688b46", // Rolled oats bowl
  "photo-1518047601542-79f18c655718", // Fresh custom bagel stack
  "photo-1536304997881-a372c179924b", // Benedict english muffin
  "photo-1550259114-ad7188f0a967", // Sliced apple morning layout
  "photo-1505253716362-afaea1d3d1af", // Morning french toast berries
  "photo-1517433456452-f9633a875f6f", // Jam crackers morning spread
  "photo-1536304997881-a372c179924b"  // Breakfast toast table
];

const LUNCH_FALLBACKS = [
  "photo-1512621776951-a57141f2eefd", // Green wellness bowl
  "photo-1546069901-ba9599a7e63c", // Tofu salad bowl
  "photo-1540189549336-e6e99c3679fe", // Mediterranean chopped salad
  "photo-1498837167922-ddd27525d352", // Tossed avocado salad
  "photo-1490645935967-10de6ba17061", // Superfood lunch platter
  "photo-1546549032-9571cd6b27df", // Creamy pesto penne
  "photo-1565299585323-38d6b0865b47", // Lunch soft shell tacos
  "photo-1509722747041-616f39b57569", // Premium club sandwich cut
  "photo-1568901346375-23c9450c58cd", // Cheddar cheeseburger
  "photo-1550547660-d9450f859349", // Stacked double sandwich toast
  "photo-1522244459694-ade877a92240", // Panini sandwich details
  "photo-15087369514e2-63645b2bb5ee", // Warm sourdough toast sandwich
  "photo-1553621042-f6e147245754", // Sushi rolls on wood platter
  "photo-1579871494447-9811cf80d66c", // Fresh sushi display card
  "photo-1547592180-85f173990554", // Tomato soup hot ceramic bowl
  "photo-1543339308-43e59d6b73a6", // Shoyu egg ramen cup
  "photo-1511920170033-f8396924c348", // Hot chickpea broth bowl
  "photo-1563379091339-03b21ab4a4f8", // Marinara pasta lunch
  "photo-1551183053-bf91a1d81141", // Garlic pesto pasta plate
  "photo-1542528138-6f96c2e2e717", // Creamy fettuccine bowl
  "photo-1490645935967-10de6ba17061", // Superfood salad mixed
  "photo-1512621776951-a57141f2eefd", // Green bowl quinoa
  "photo-1540189549336-e6e99c3679fe", // Garden mix lunch plate
  "photo-1536304997881-a372c179924b", // Healthy lunch caesar wrap
  "photo-1551248429-40975aa4de74"  // Seared salmon salad
];

const DINNER_FALLBACKS = [
  "photo-1544025162-d76694265947", // Roasted beef sirloin steak asparagus
  "photo-1518492104633-130d0cc84637", // Honey glazed pork chops grilling
  "photo-1532550907401-a500c9a57435", // Herb butter grilled chicken breast
  "photo-1504674900247-0877df9cc836", // Barbecue back ribs platter
  "photo-1467003909585-2f8a72700288", // Ocean glazed salmon fillet plate
  "photo-1555939594-58d7cb561ad1", // Sizzling barbecue hot skewers
  "photo-1543339308-43e59d6b73a6", // Stir-fry veggies jasmine rice bowl
  "photo-1473093295043-cdd812d0e601", // Savory Italian spaghetti plate
  "photo-1534080564583-6be75777b70a", // Luxury seafood lobster platter
  "photo-1551248429-40975aa4de74", // Chicken spinach mushroom roast
  "photo-1529042410759-befb1204b468", // Ground beef marinara meatballs bowl
  "photo-1432139555190-58524dae6a55", // Flame seared tomahawk steak crust
  "photo-1598515214211-89d3c73ae83b", // Authentic Indian chicken tikka masala
  "photo-1562967914-07ef961e0892", // Juicy golden fried chicken thighs
  "photo-1476224203421-9ac39bcb3327", // Family roasted turkey gravy platter
  "photo-1585032226651-759b368d7246", // Sichuan spicy hand-pulled noodle bowl
  "photo-1532634922-8fe0b757fb13", // Shrimp pad thai stir fried noodles
  "photo-1569718212165-3a8278d5f624", // Soy egg hot ramen bowl
  "photo-1519708227418-c8fd9a32b7a2", // Pan seared salmon lemon butter
  "photo-15087369514e2-63645b2bb5ee", // Pork medallions tenderloin plate
  "photo-1544025162-d76694265947", // Flame seared steak fillet mignon
  "photo-1555939594-58d7cb561ad1", // Teriyaki beef skewer hot grill
  "photo-1527324688151-0e627063f26f", // Creamy arborio rice parmesan risotto
  "photo-1540189549336-e6e99c3679fe", // Shrimp garlic marinara pasta
  "photo-1498837167922-ddd27525d352"  // Seared duck breast glaze
];

const DESSERT_FALLBACKS = [
  "photo-1551024506-0bccd828d307", // Soufflé hot chocolate lava cake
  "photo-1565958011703-44f9829ba187", // Velvet chocolate cake slice
  "photo-1578985545062-69928b1d9587", // Display bakery cupcakes cabinet
  "photo-1501443762994-82bd5dace89a", // Triple scoop vanilla cherry ice cream
  "photo-1499636136210-6f4ee915583e", // Chocolate chip cookies stack
  "photo-1511018556340-d16986a1c194", // Fruit blueberry cake slice
  "photo-1587314168485-3236d6710814", // Blueberry cheesecake dessert
  "photo-1579372786545-d24232daf58c", // Sweet colorful French macarons
  "photo-1551024681-6077ff9cc836", // Organic butter cookies pile
  "photo-1519869325930-281384150729", // Double crust sweet cherry pie
  "photo-1541783245831-57d6fb0926d3", // Glazed dark fudge squares
  "photo-15087369514e2-63645b2bb5ee", // Raspberry streusel cupcakes
  "photo-1488477181946-6428a0291777", // Mixed wild berries chia pudding
  "photo-1509440159596-0249088772ff", // Glazed cinnamon rolls hot
  "photo-1517433456452-f9633a875f6f", // Golden warm croissants stack
  "photo-1550259114-ad7188f0a967", // Fresh raspberry tartlet dessert
  "photo-1567620905732-2d1ec7ab7445", // Crepes stack powdered sugar
  "photo-1533089860892-a7c6f0a88666", // Fudge chocolate cake waffles
  "photo-1506084868230-bb9d95c24759", // Blueberry muffin crumbles plate
  "photo-1515276340591-e6851590ec7f", // Fruit yogurt dessert pudding
  "photo-1541519227354-08fa5d50c44d", // Triple chocolate mousse cup
  "photo-1590301157890-4810ed352733", // Strawberry shortcake layers
  "photo-1571877227200-a0d98ea607e9", // Sweet apple pie crumble slice
  "photo-1513442538419-bc67d301edc1", // Dessert catering sweet platter
  "photo-1511018556340-d16986a1c194"  // Lemon pie custard bowl
];

const SNACK_FALLBACKS = [
  "photo-1518047601542-79f18c655718", // Golden tortilla chips basket
  "photo-1578849278619-e73505e9610f", // Salted crisp movie popcorn bucket
  "photo-1543353071-10c8ba85a904", // Loaded cheddar nachos guacamole
  "photo-1512621776951-a57141f2eefd", // Organic hummus bowl celery carrots
  "photo-1540189549336-e6e99c3679fe", // Mixed premium salted nuts plate
  "photo-1532634922-8fe0b757fb13", // French charcuterie party dip board
  "photo-1499636136210-6f4ee915583e", // Sweet date protein energy balls
  "photo-1504754524776-8f4f37790ca0", // Scrambled egg bagel bite snack
  "photo-1550259114-ad7188f0a967", // Organic grain granola snack bars
  "photo-1497534446932-c925b458314e", // Raw organic almonds mix bowl
  "photo-1513442538419-bc67d301edc1", // Mixed raw cashew bowls
  "photo-1541519227354-08fa5d50c44d", // Avocado toast snack stack
  "photo-1495214783159-3503fd1b572d", // Fruit waffle bites snack
  "photo-1509440159596-0249088772ff", // Sea salted sourdough pretzel sticks
  "photo-1517433456452-f9633a875f6f", // Jam crackers biscuit snack
  "photo-1511018556340-d16986a1c194", // Fresh strawberry fruit skewers
  "photo-1571877227200-a0d98ea607e9", // Mixed kiwi berry layout plate
  "photo-1488477181946-6428a0291777", // Greek yogurt chia snack bowl
  "photo-1508736891632-411a0cc3f6d7", // Crunch multigrain crackers crisp
  "photo-1517709360219-b40af9688b46", // Roasted sunflower seeds bowl
  "photo-1518047601542-79f18c655718", // Baked sweet potato crisp chips
  "photo-1536304997881-a372c179924b", // Benedict english muffin snack half
  "photo-1505253716362-afaea1d3d1af", // Simple cheese slice cracker
  "photo-1551024681-6077ff9cc836", // Small cookie packs on table
  "photo-1515276340591-e6851590ec7f"  // Fresh fruit slices pack
];

// Category-segregated keyword mapping to prevent irrelevant image assignment crossover
const CATEGORY_KEYWORD_IMAGES: Record<string, { keywords: string[]; ids: string[] }[]> = {
  "Breakfast": [
    {
      keywords: ["avocado", "toast", "sourdough", "bruschetta"],
      ids: [
        "photo-1541519227354-08fa5d50c44d", // Classic avo toast
        "photo-1495214783159-3503fd1b572d", // Toast eggs yolk
        "photo-1509440159596-0249088772ff"  // Golden sourdough
      ]
    },
    {
      keywords: ["pancake", "pancakes", "flapjack", "crepe", "crepes", "french toast"],
      ids: [
        "photo-1528207776546-365bb710ee93", // Strawberry pancakes
        "photo-1533089860892-a7c6f0a88666", // Stack with syrup
        "photo-1567620905732-2d1ec7ab7445"  // Breakfast pancakes plate
      ]
    },
    {
      keywords: ["waffle", "waffles"],
      ids: [
        "photo-1515276340591-e6851590ec7f", // Golden waffles
        "photo-1506084868230-bb9d95c24759"  // Waffle loaded berries
      ]
    },
    {
      keywords: ["egg", "eggs", "benedict", "frittata", "omelet", "scramble", "shakshuka"],
      ids: [
        "photo-1525351484163-7529414344d8", // Benedict close up
        "photo-1504754524776-8f4f37790ca0", // Scrambled breakfast
        "photo-1482049016688-2d3e1b311543", // Soft eggs toast
        "photo-1538089934305-7793b5143324"  // Sunny side up skillet
      ]
    },
    {
      keywords: ["smoothie", "parfait", "yogurt", "berry", "berries", "fruit bowl", "acai", "chia"],
      ids: [
        "photo-1590301157890-4810ed352733", // Strawberry acai bowl
        "photo-1515276340591-e6851590ec7f", // Yogurt jar parfait
        "photo-1571877227200-a0d98ea607e9"  // Kiwi fruits greek bowl
      ]
    },
    {
      keywords: ["oatmeal", "oats", "muesli", "porridge"],
      ids: [
        "photo-1517709360219-b40af9688b46", // Oats bowl details
        "photo-1497534446932-c925b458314e"  // Oats banana
      ]
    },
    {
      keywords: ["bagel", "bagels", "lox"],
      ids: [
        "photo-1541271696-eedd7e5b0f35"  // Salmon bagel
      ]
    }
  ],
  "Lunch": [
    {
      keywords: ["salad", "caesar", "cobb", "greek", "caprese", "quinoa"],
      ids: [
        "photo-1512621776951-a57141f2eefd", // Green wellness bowl
        "photo-1498837167922-ddd27525d352", // Fresh green salad
        "photo-1540189549336-e6e99c3679fe", // Walnut feta salad
        "photo-1490645935967-10de6ba17061"  // Elegant plate salad
      ]
    },
    {
      keywords: ["wrap", "burrito", "quesadilla", "taco", "tacos"],
      ids: [
        "photo-1565299585323-38d6b0865b47", // Soft shell tacos
        "photo-1540189549336-e6e99c3679fe"  // Fresh lunch taco
      ]
    },
    {
      keywords: ["sandwich", "club", "panini", "blt", "croissant", "toastie", "toast", "burger", "sliders"],
      ids: [
        "photo-1509722747041-616f39b57569", // BLT sandwich sourdough
        "photo-1550547660-d9450f859349", // Double sandwich stacked
        "photo-1522244459694-ade877a92240"  // Panini sandwich toast
      ]
    },
    {
      keywords: ["poke", "poke bowl", "sushi", "salmon bowl"],
      ids: [
        "photo-1546069901-ba9599a7e63c", // Tofu/tuna bowl
        "photo-1553621042-f6e147245754"  // Sushi rolls platter
      ]
    },
    {
      keywords: ["soup", "chowder", "stew", "minestrone", "lentil", "broth"],
      ids: [
        "photo-1547592180-85f173990554", // Rich tomato soup bowl
        "photo-1543339308-43e59d6b73a6"  // Hot shoyu noodle broth
      ]
    }
  ],
  "Dinner": [
    {
      keywords: ["salmon", "fish", "halibut", "sea bass", "seafood", "shrimp", "lobster", "cod", "tuna"],
      ids: [
        "photo-1519708227418-c8fd9a32b7a2", // Lemon salmon butter seared
        "photo-1467003909585-2f8a72700288", // Ocean glazed salmon fillet
        "photo-1551248429-40975aa4de74"  // Baked chicken spinach/salmon
      ]
    },
    {
      keywords: ["steak", "beef", "ribeye", "roast", "meatball", "meatballs", "lamb", "pork", "ribs", "sirloin", "chop"],
      ids: [
        "photo-1544025162-d76694265947", // Roasted beef sirloin steak asparagus
        "photo-1518492104633-130d0cc84637", // Honey glazed pork chops
        "photo-1432139555190-58524dae6a55"  // Tomahawk steak
      ]
    },
    {
      keywords: ["chicken", "turkey", "poultry", "tikka", "wings", "breast"],
      ids: [
        "photo-1532550907401-a500c9a57435", // Herb butter chicken breast
        "photo-1598515214211-89d3c73ae83b", // Authentic Indian chicken tikka
        "photo-1562967914-07ef961e0892"  // Golden fried chicken crisp
      ]
    },
    {
      keywords: ["noodle", "noodles", "ramen", "soba", "sichuan", "pad thai", "udon"],
      ids: [
        "photo-1585032226651-759b368d7246", // Sichuan noodles
        "photo-1543339308-43e59d6b73a6", // Shoyu ramen
        "photo-1532634922-8fe0b757fb13"  // Spicy pad thai
      ]
    },
    {
      keywords: ["pasta", "spaghetti", "penne", "fettuccine", "pesto", "mac & cheese", "lasagna", "trottole", "carbonara", "rigatoni"],
      ids: [
        "photo-1546549032-9571cd6b27df", // Creamy pesto penne
        "photo-1563379091339-03b21ab4a4f8", // Tomato penne pasta
        "photo-1551183053-bf91a1d81141"  // Garlic pesto plate
      ]
    },
    {
      keywords: ["tofu", "vegetarian", "buddha", "rice bowl", "jasmine", "risotto", "curry", "quinoa bowl", "macro"],
      ids: [
        "photo-1543339308-43e59d6b73a6", // Shoyu broth style jasmin
        "photo-1546069901-ba9599a7e63c"  // Clean tofu bowl
      ]
    }
  ],
  "Dessert": [
    {
      keywords: ["cookie", "cookies", "biscuit", "biscuits"],
      ids: [
        "photo-1499636136210-6f4ee915583e", // Pile of cookies
        "photo-1551024681-6077ff9cc836"  // Cookies jar sweet
      ]
    },
    {
      keywords: ["cake", "cupcake", "cheesecake", "soufflé", "tiramisu", "lava cake", "muffin", "muffins"],
      ids: [
        "photo-1578985545062-69928b1d9587", // Cupcakes stacked
        "photo-1551024506-0bccd828d307", // Soufflé chocolate cake
        "photo-1565958011703-44f9829ba187"  // Cake slice dessert
      ]
    },
    {
      keywords: ["pie", "tart", "crumble", "galette", "pastry"],
      ids: [
        "photo-1519869325930-281384150729", // Double crust cherry pie
        "photo-1511018556340-d16986a1c194"  // Lemon pie custard
      ]
    },
    {
      keywords: ["ice cream", "gelato", "sorbet", "custard", "panna cotta", "mousse", "crème brûlée", "pudding"],
      ids: [
        "photo-1501443762994-82bd5dace89a", // Triple scoop vanilla
        "photo-1579372786545-d24232daf58c"  // Sorbet berries scoop
      ]
    },
    {
      keywords: ["chocolate", "brownie", "brownies", "fudge", "truffles"],
      ids: [
        "photo-1541783245831-57d6fb0926d3", // Melted dark chocolate
        "photo-1551024506-0bccd828d307"  // Chocolate lava fudge
      ]
    }
  ],
  "Snack": [
    {
      keywords: ["chip", "chips", "crisp", "crisps", "nachos", "tortilla", "popcorn", "pretzel", "pretzels"],
      ids: [
        "photo-1518047601542-79f18c655718", // Tortilla chips
        "photo-1578849278619-e73505e9610f"  // Salted popcorn bucket
      ]
    },
    {
      keywords: ["nuts", "trail mix", "seeds", "granola bar", "granola", "bar", "bars"],
      ids: [
        "photo-1511018556340-d16986a1c194", // Sweet breakfast bars
        "photo-1513442538419-bc67d301edc1"  // Mixed raw cashew bowls
      ]
    },
    {
      keywords: ["hummus", "dip", "guacamole", "salsa"],
      ids: [
        "photo-1540189549336-e6e99c3679fe", // Smooth hummus bowl
        "photo-1532634922-8fe0b757fb13"  // Charcuterie dip party
      ]
    }
  ]
};

export function hashString(str: string): number {
  let hash = 0;
  for (let h = 0; h < str.length; h++) {
    hash = str.charCodeAt(h) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function getUniqueImageForCategory(category: string, idx: number): string {
  const cat = category.toLowerCase();
  let imageId = "";
  
  if (cat === "breakfast") {
    imageId = BREAKFAST_FALLBACKS[idx % BREAKFAST_FALLBACKS.length];
  } else if (cat === "lunch") {
    imageId = LUNCH_FALLBACKS[idx % LUNCH_FALLBACKS.length];
  } else if (cat === "dinner") {
    imageId = DINNER_FALLBACKS[idx % DINNER_FALLBACKS.length];
  } else if (cat === "dessert") {
    imageId = DESSERT_FALLBACKS[idx % DESSERT_FALLBACKS.length];
  } else if (cat === "snack") {
    imageId = SNACK_FALLBACKS[idx % SNACK_FALLBACKS.length];
  } else {
    const allPools = [...BREAKFAST_FALLBACKS, ...LUNCH_FALLBACKS, ...DINNER_FALLBACKS, ...DESSERT_FALLBACKS, ...SNACK_FALLBACKS];
    imageId = allPools[idx % allPools.length];
  }
  
  const cleanImageId = imageId.trim().replace(/^photo-/, '');
  return `https://images.unsplash.com/photo-${cleanImageId}?w=600&auto=format&fit=crop&q=60`;
}

function getSmartRecipeImage(name: string, category: string, currentImage?: string, index?: number): string {
  const lowerName = name.toLowerCase();
  const catName = category || "Lunch";
  
  // 1. Try search keywords first, but filter strictly under the matching category pool to avoid cross-pollution!
  const catMappings = CATEGORY_KEYWORD_IMAGES[catName] || [];
  for (const mapping of catMappings) {
    for (const key of mapping.keywords) {
      if (lowerName.includes(key)) {
        // Deterministically select amongst the matched keyword array based on the recipe's name hash
        const hashIdx = hashString(name) % mapping.ids.length;
        const cleanImageId = mapping.ids[hashIdx].replace(/^photo-/, '');
        return `https://images.unsplash.com/photo-${cleanImageId}?w=600&auto=format&fit=crop&q=60`;
      }
    }
  }

  // 2. Fall back to a deterministic index if provided (+ offset by name to avoid falls back being identical)
  if (index !== undefined && index >= 0) {
    return getUniqueImageForCategory(catName, index + hashString(name));
  }

  // 3. Otherwise use name hash for category fallback selection
  const textHash = hashString(name);
  return getUniqueImageForCategory(catName, textHash);
}

// Ensure database file exists
initDb();

// MongoDB/Mongoose Model Simulation Interface
export const RecipeModel = {
  async find(filters: Partial<Recipe> = {}): Promise<Recipe[]> {
    const db = readDb();
    let result = db.recipes;
    
    // Simple filter matching
    if (filters.category) {
      result = result.filter(r => r.category === filters.category);
    }
    
    return result;
  },

  async findById(id: string): Promise<Recipe | null> {
    const db = readDb();
    return db.recipes.find(r => r._id === id) || null;
  },

  async create(recipeData: Omit<Recipe, '_id'>): Promise<Recipe> {
    const db = readDb();
    const cleanImage = getSmartRecipeImage(recipeData.name, recipeData.category, recipeData.image);
    const newRecipe: Recipe = {
      ...recipeData,
      image: cleanImage,
      _id: 'rec_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    db.recipes.push(newRecipe);
    writeDb(db);
    return newRecipe;
  },

  async findByIdAndUpdate(id: string, updateData: Partial<Recipe>): Promise<Recipe | null> {
    const db = readDb();
    const idx = db.recipes.findIndex(r => r._id === id);
    if (idx === -1) return null;
    
    db.recipes[idx] = {
      ...db.recipes[idx],
      ...updateData,
      _id: id // Ensure id doesn't change
    };
    writeDb(db);
    return db.recipes[idx];
  },

  async findByIdAndDelete(id: string): Promise<boolean> {
    const db = readDb();
    const initialLen = db.recipes.length;
    db.recipes = db.recipes.filter(r => r._id !== id);
    if (db.recipes.length === initialLen) return false;
    writeDb(db);
    return true;
  }
};

export const MealPlanModel = {
  async find(): Promise<MealPlan[]> {
    const db = readDb();
    return db.mealPlans;
  },

  async findOne(query: { day: string }): Promise<MealPlan | null> {
    const db = readDb();
    return db.mealPlans.find(mp => mp.day === query.day) || null;
  },

  async updatePlan(day: string, update: Partial<MealPlan>): Promise<MealPlan> {
    const db = readDb();
    let idx = db.mealPlans.findIndex(mp => mp.day === day);
    if (idx === -1) {
      const newPlan: MealPlan = { day: day as any, ...update };
      db.mealPlans.push(newPlan);
      writeDb(db);
      return newPlan;
    } else {
      db.mealPlans[idx] = {
        ...db.mealPlans[idx],
        ...update
      };
      writeDb(db);
      return db.mealPlans[idx];
    }
  }
};

export const ProductModel = {
  async find(): Promise<Product[]> {
    const db = readDb();
    return db.products;
  },

  async create(productData: Omit<Product, '_id'>): Promise<Product> {
    const db = readDb();
    const newProduct: Product = {
      ...productData,
      _id: 'prod_' + Math.random().toString(36).substr(2, 9)
    };
    db.products.push(newProduct);
    writeDb(db);
    return newProduct;
  },

  async findByIdAndDelete(id: string): Promise<boolean> {
    const db = readDb();
    const len = db.products.length;
    db.products = db.products.filter(p => p._id !== id);
    if (db.products.length === len) return false;
    writeDb(db);
    return true;
  }
};
