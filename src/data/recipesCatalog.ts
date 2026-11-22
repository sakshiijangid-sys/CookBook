import { MealPlan, Recipe } from '../types';

const SIGNATURE_RECIPES: Recipe[] = [
  {
    _id: 'rec1',
    name: 'Classic Avocado Toast',
    description: 'Crispy dark rye toast topped with thick, seasoned smashed avocado, cherry tomatoes, and a sprinkle of organic red chili flakes.',
    image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=600&auto=format&fit=crop&q=60',
    category: 'Breakfast',
    prepTime: 10,
    cookTime: 5,
    servings: 2,
    ingredients: [
      { name: 'Ripe Avocados', amount: '2', unit: 'pieces' },
      { name: 'Sourdough Bread', amount: '4', unit: 'slices' },
      { name: 'Cherry Tomatoes', amount: '100', unit: 'g' },
      { name: 'Lemon Juice', amount: '1', unit: 'tbsp' },
      { name: 'Chili Flakes', amount: '1', unit: 'tsp' },
      { name: 'Sea Salt & Black Pepper', amount: '1', unit: 'pinch' },
    ],
    steps: [
      'Toast sourdough slices to a deep golden brown crisp.',
      'In a medium bowl, peel and gently smash the fresh ripe avocados with a fork, mixing in fresh lemon juice, sea salt, and black pepper.',
      'Spread the smashed avocado uniformly over the warm toasted bread slices.',
      'Halve the cherry tomatoes and place them gently on top of the avocado bed.',
      'Garnish with a sprinkle of red chili flakes and extra sea salt before serving.',
    ],
    tags: ['Vegetarian', 'Quick', 'Healthy'],
    price: 4.5,
  },
  {
    _id: 'rec2',
    name: 'Creamy Tuscan Tomato Pasta',
    description: 'A rich, velvety pasta combined with sun-dried tomatoes, fresh baby spinach, organic garlic, and dairy-free creamy sauce.',
    image: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=600&auto=format&fit=crop&q=60',
    category: 'Lunch',
    prepTime: 15,
    cookTime: 15,
    servings: 4,
    ingredients: [
      { name: 'Penne Pasta', amount: '400', unit: 'g' },
      { name: 'Sun-Dried Tomatoes', amount: '150', unit: 'g' },
      { name: 'Fresh Baby Spinach', amount: '200', unit: 'g' },
      { name: 'Garlic Cloves', amount: '4', unit: 'minced' },
      { name: 'Heavy Cream', amount: '250', unit: 'ml' },
      { name: 'Grated Parmesan Cheese', amount: '50', unit: 'g' },
      { name: 'Olive Oil', amount: '2', unit: 'tbsp' },
    ],
    steps: [
      'Cook penne pasta in a large pot of boiling salted water until al dente, drain and set aside.',
      'Heat olive oil in a heavy skillet and sauté minced garlic until fragrant (~1 minute).',
      'Add sun-dried tomatoes and cook for 2 minutes to release oils and flavors.',
      'Pour in cream and bring to a gentle simmer. Add grated parmesan cheese and stir until dissolved and thick.',
      'Add the fresh spinach, letting it wilt gently into the sauce.',
      'Toss the hot pasta into the skillet, stirring to fully coat, and cook for 1 minute before plating.',
    ],
    tags: ['Italian', 'Creamy', 'Hearty'],
    price: 12.9,
  },
  {
    _id: 'rec3',
    name: 'Garlic Butter Lemon Salmon',
    description: 'Pan-seared premium Atlantic salmon fillet basted with a velvety browned garlic butter sauce and fresh lemon juice.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=60',
    category: 'Dinner',
    prepTime: 10,
    cookTime: 12,
    servings: 2,
    ingredients: [
      { name: 'Salmon Fillets', amount: '2', unit: 'pieces' },
      { name: 'Unsalted Butter', amount: '3', unit: 'tbsp' },
      { name: 'Garlic Cloves', amount: '3', unit: 'minced' },
      { name: 'Fresh Lemon Juice', amount: '2', unit: 'tbsp' },
      { name: 'Lemon Slices', amount: '4', unit: 'pieces' },
      { name: 'Fresh Parsley', amount: '2', unit: 'tbsp chopped' },
    ],
    steps: [
      'Pat salmon fillets dry with paper towels and season both sides generously with salt and black pepper.',
      'Heat a large skillet over medium-high heat with a drizzle of olive oil, sear salmon flesh-side down for 5 minutes.',
      'Flip salmon carefully. Add butter and minced garlic to the pan, swirling to brown.',
      'Spoon the melted garlic butter repeatedly over the cooking salmon for another 4 to 5 minutes.',
      'Pour in fresh lemon juice and add lemon slices. Sauté for 1 quick minute, garnish with chopped parsley and serve immediately.',
    ],
    tags: ['Keto', 'High Protein', 'Seafood'],
    price: 18.5,
  },
  {
    _id: 'rec4',
    name: 'Greek Berry Smoothie Bowl',
    description: 'A supercharged, chilled smoothie blend of blueberries, strawberries, and thick honey Greek yogurt, topped with crunchy granola.',
    image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&auto=format&fit=crop&q=60',
    category: 'Breakfast',
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    ingredients: [
      { name: 'Frozen Mixed Berries', amount: '1.5', unit: 'cups' },
      { name: 'Greek Yogurt', amount: '1', unit: 'cup' },
      { name: 'Almond Milk', amount: '0.25', unit: 'cup' },
      { name: 'Granola', amount: '0.5', unit: 'cup' },
      { name: 'Chia Seeds', amount: '1', unit: 'tbsp' },
      { name: 'Raw Honey', amount: '1', unit: 'tbsp' },
    ],
    steps: [
      'Add frozen berries, Greek yogurt, almond milk, and raw honey to a high-speed blender.',
      'Blend on high until perfectly smooth, creamy, and thick like soft-serve ice cream.',
      'Pour the vibrant berry blend into a wide serving bowl.',
      'Artfully line the granola, chia seeds, and extra sliced strawberries on top.',
      'Drizzle extra honey and serve immediately while cold.',
    ],
    tags: ['Healthy', 'Gluten-Free', 'Fruit'],
    price: 5.9,
  },
  {
    _id: 'rec5',
    name: 'Fudgy Chocolate Chip Cookies',
    description: 'Chewy on the inside, crispy on the edges, loaded with dark chocolate chunks and topped with flakey sea salt.',
    image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&auto=format&fit=crop&q=60',
    category: 'Dessert',
    prepTime: 15,
    cookTime: 10,
    servings: 12,
    ingredients: [
      { name: 'All-Purpose Flour', amount: '250', unit: 'g' },
      { name: 'Melted Butter', amount: '150', unit: 'g' },
      { name: 'Brown Sugar', amount: '150', unit: 'g' },
      { name: 'White Sugar', amount: '50', unit: 'g' },
      { name: 'Eggs', amount: '2', unit: 'pieces' },
      { name: 'Dark Chocolate Chunks', amount: '200', unit: 'g' },
      { name: 'Flakey Sea Salt', amount: '1', unit: 'pinch' },
    ],
    steps: [
      'In a large bowl, whisk melted butter, brown sugar, and white sugar until smooth.',
      'Add eggs, whisking vigorously until the mixture thickens and lightens in color.',
      'Gently fold in the flour and chocolate chunks until just combined.',
      'Scoop dough into balls and chill in the freezer for at least 15 minutes.',
      'Bake at 180°C (350°F) for 10 minutes until edges are golden brown. Sprinkle with flakey sea salt.',
    ],
    tags: ['Baking', 'Chocolate', 'Indulgent'],
    price: 6.2,
  },
  {
    _id: 'rec6',
    name: 'Artisan Madagascan Vanilla Ice Cream',
    description: 'Rich, creamy vanilla bean ice cream made with organic heavy cream and slow-churned vanilla seeds from Madagascar.',
    image: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=600&auto=format&fit=crop&q=60',
    category: 'Dessert',
    prepTime: 20,
    cookTime: 10,
    servings: 6,
    ingredients: [
      { name: 'Heavy Whipping Cream', amount: '500', unit: 'ml' },
      { name: 'Whole Milk', amount: '250', unit: 'ml' },
      { name: 'Granulated Sugar', amount: '150', unit: 'g' },
      { name: 'Vanilla Bean Pod', amount: '1', unit: 'piece' },
      { name: 'Egg Yolks', amount: '5', unit: 'pieces' },
    ],
    steps: [
      'In a medium saucepan, combine whole milk, sugar, and scraped vanilla bean seeds with the pod. Heat until just simmering.',
      'Gently whisk the egg yolks in a separate heat-safe bowl.',
      'Slowly pour a ladle of warm milk mixture into the eggs while whisking constantly to temper the yolks.',
      'Return the tempered mixture to the saucepan and cook over low heat until it coats the back of a spoon.',
      'Strain into a clean bowl, stir in the cold heavy cream, and chill completely before churning.',
    ],
    tags: ['Cold', 'Classic', 'Sweet'],
    price: 8.5,
  },
  {
    _id: 'rec7',
    name: 'Golden Crust Double Smashed Burger',
    description: 'Sizzling double smashed beef patties with crispy lace edges, melted American cheese, pickles, and tangy house burger sauce on toasted brioche.',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=60',
    category: 'Dinner',
    prepTime: 15,
    cookTime: 10,
    servings: 2,
    ingredients: [
      { name: 'Ground Beef Blend', amount: '350', unit: 'g' },
      { name: 'Brioche Buns', amount: '2', unit: 'pieces' },
      { name: 'American Cheese Slices', amount: '4', unit: 'pieces' },
      { name: 'Burger Sauce', amount: '4', unit: 'tbsp' },
      { name: 'Clarified Butter', amount: '1', unit: 'tbsp' },
      { name: 'Pickled Cucumber Slices', amount: '8', unit: 'pieces' },
    ],
    steps: [
      'Form ground beef into 4 loose round balls and keep chilled until ready to sear.',
      'Spread clarified butter on split brioche buns and toast in a hot cast-iron skillet until browned.',
      'Place beef balls onto a scorching-hot skillet and smash flat with a heavy metal spatula.',
      'Season with sea salt, sear 2 minutes for a caramelized lacy crust, flip, and melt cheese over stacked patties.',
      'Assemble on toasted brioche with burger sauce and pickles.',
    ],
    tags: ['Beef', 'Savory', 'American'],
    price: 14.2,
  },
  {
    _id: 'rec8',
    name: 'Spicy Sichuan Chili Oil Noodles',
    description: 'Springy wheat noodles tossed in fragrant house Sichuan chili oil, sesame paste, roasted peanuts, and green scallions.',
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&auto=format&fit=crop&q=60',
    category: 'Lunch',
    prepTime: 10,
    cookTime: 10,
    servings: 2,
    ingredients: [
      { name: 'Wheat Noodles', amount: '300', unit: 'g' },
      { name: 'Sichuan Chili Oil', amount: '3', unit: 'tbsp' },
      { name: 'Black Vinegar', amount: '2', unit: 'tbsp' },
      { name: 'Toasted Sesame Paste', amount: '1.5', unit: 'tbsp' },
      { name: 'Light Soy Sauce', amount: '2', unit: 'tbsp' },
      { name: 'Crushed Roasted Peanuts', amount: '2', unit: 'tbsp' },
      { name: 'Scallions & Garlic', amount: '3', unit: 'tbsp' },
    ],
    steps: [
      'Whisk soy sauce, Sichuan chili oil, sesame paste, black vinegar, and minced garlic in a wide bowl.',
      'Boil wheat noodles for 4–5 minutes until springy with a slight bite.',
      'Ladle 2 tablespoons of hot noodle water into the sauce bowl to emulsify.',
      'Toss hot drained noodles thoroughly into the sauce and garnish with scallions and crushed peanuts.',
    ],
    tags: ['Spicy', 'Noodles', 'Sichuan'],
    price: 11.8,
  },
  {
    _id: 'rec9',
    name: 'Velvety Fudge Chocolate Cake',
    description: 'An incredibly moist layered chocolate cake glazed in a decadent, rich dark chocolate fudge buttercream.',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=60',
    category: 'Dessert',
    prepTime: 25,
    cookTime: 30,
    servings: 10,
    ingredients: [
      { name: 'All-Purpose Flour', amount: '250', unit: 'g' },
      { name: 'Granulated Sugar', amount: '350', unit: 'g' },
      { name: 'Cocoa Powder', amount: '90', unit: 'g' },
      { name: 'Buttermilk', amount: '240', unit: 'ml' },
      { name: 'Eggs', amount: '2', unit: 'pieces' },
      { name: 'Softened Butter', amount: '200', unit: 'g' },
      { name: 'Powdered Sugar', amount: '300', unit: 'g' },
    ],
    steps: [
      'Preheat oven to 175°C (350°F) and line two 8-inch round cake pans with parchment paper.',
      'Whisk flour, sugar, cocoa powder, baking powder, and salt in a deep bowl.',
      'Beat in buttermilk, eggs, and hot coffee until smooth.',
      'Bake for 30 minutes until a toothpick comes out clean, cool completely, and frost with whipped cocoa buttercream.',
    ],
    tags: ['Chocolate', 'Baking', 'Rich'],
    price: 16.9,
  },
  {
    _id: 'rec10',
    name: 'Crispy Roasted Chickpea & Kale Crunch',
    description: 'Crunchy oven-roasted chickpeas and spiced kale ribbons tossed in cold-pressed olive oil, smoked paprika, and sea salt.',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=60',
    category: 'Snack',
    prepTime: 10,
    cookTime: 20,
    servings: 3,
    ingredients: [
      { name: 'Organic Chickpeas', amount: '250', unit: 'g' },
      { name: 'Kale Leaves', amount: '120', unit: 'g' },
      { name: 'Extra Virgin Olive Oil', amount: '2', unit: 'tbsp' },
      { name: 'Smoked Paprika', amount: '1', unit: 'tsp' },
      { name: 'Sea Salt', amount: '1', unit: 'pinch' },
    ],
    steps: [
      'Pat chickpeas completely dry and toss with olive oil, smoked paprika, and sea salt.',
      'Roast at 200°C (400°F) for 20 minutes until golden and crisp.',
      'Massage kale ribbons lightly with olive oil and bake 6 minutes until crisp, then combine and serve.',
    ],
    tags: ['Crispy', 'Healthy', 'Vegan'],
    price: 4.8,
  },
];

const BREAKFAST_IMAGES = [
  'photo-1525351484163-7529414344d8',
  'photo-1506084868230-bb9d95c24759',
  'photo-1533089860892-a7c6f0a88666',
  'photo-1528207776546-365bb710ee93',
  'photo-1515276340591-e6851590ec7f',
  'photo-1496412705862-e0088f16f791',
  'photo-1504754524776-8f4f37790ca0',
  'photo-1484723091739-30a097e8f929',
  'photo-1538089934305-7793b5143324',
  'photo-1513442538419-bc67d301edc1',
  'photo-1541519227354-08fa5d50c44d',
  'photo-1495214783159-3503fd1b572d',
  'photo-1509440159596-0249088772ff',
  'photo-1497534446932-c925b458314e',
  'photo-1488477181946-6428a0291777',
];

const LUNCH_IMAGES = [
  'photo-1512621776951-a57141f2eefd',
  'photo-1546069901-ba9599a7e63c',
  'photo-1540189549336-e6e99c3679fe',
  'photo-1498837167922-ddd27525d352',
  'photo-1490645935967-10de6ba17061',
  'photo-1546549032-9571cd6b27df',
  'photo-1565299585323-38d6b0865b47',
  'photo-1509722747041-616f39b57569',
  'photo-1550547660-d9450f859349',
  'photo-1553621042-f6e147245754',
  'photo-1579871494447-9811cf80d66c',
  'photo-1547592180-85f173990554',
  'photo-1563379091339-03b21ab4a4f8',
  'photo-1551183053-bf91a1d81141',
];

const DINNER_IMAGES = [
  'photo-1544025162-d76694265947',
  'photo-1518492104633-130d0cc84637',
  'photo-1532550907401-a500c9a57435',
  'photo-1504674900247-0877df9cc836',
  'photo-1467003909585-2f8a72700288',
  'photo-1555939594-58d7cb561ad1',
  'photo-1543339308-43e59d6b73a6',
  'photo-1473093295043-cdd812d0e601',
  'photo-1534080564583-6be75777b70a',
  'photo-1551248429-40975aa4de74',
  'photo-1529042410759-befb1204b468',
  'photo-1598515214211-89d3c73ae83b',
  'photo-1569718212165-3a8278d5f624',
  'photo-1519708227418-c8fd9a32b7a2',
];

const DESSERT_IMAGES = [
  'photo-1551024506-0bccd828d307',
  'photo-1565958011703-44f9829ba187',
  'photo-1578985545062-69928b1d9587',
  'photo-1501443762994-82bd5dace89a',
  'photo-1499636136210-6f4ee915583e',
  'photo-1511018556340-d16986a1c194',
  'photo-1587314168485-3236d6710814',
  'photo-1579372786545-d24232daf58c',
  'photo-1519869325930-281384150729',
  'photo-1541783245831-57d6fb0926d3',
  'photo-1567620905732-2d1ec7ab7445',
];

const SNACK_IMAGES = [
  'photo-1518047601542-79f18c655718',
  'photo-1578849278619-e73505e9610f',
  'photo-1543353071-10c8ba85a904',
  'photo-1512621776951-a57141f2eefd',
  'photo-1540189549336-e6e99c3679fe',
  'photo-1532634922-8fe0b757fb13',
  'photo-1497534446932-c925b458314e',
  'photo-1513442538419-bc67d301edc1',
  'photo-1488477181946-6428a0291777',
];

const IMAGE_POOLS: Record<Recipe['category'], string[]> = {
  Breakfast: BREAKFAST_IMAGES,
  Lunch: LUNCH_IMAGES,
  Dinner: DINNER_IMAGES,
  Dessert: DESSERT_IMAGES,
  Snack: SNACK_IMAGES,
};

function buildGeneratedCatalog(): Recipe[] {
  const recipes: Recipe[] = [...SIGNATURE_RECIPES];
  const usedNames = new Set(recipes.map((r) => r.name));
  const categories: Recipe['category'][] = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack'];

  const ingredientPools: Record<Recipe['category'], { name: string; unit: string; min: number; max: number }[]> = {
    Breakfast: [
      { name: 'Organic Eggs', unit: 'pieces', min: 2, max: 4 },
      { name: 'Ripe Avocados', unit: 'pieces', min: 1, max: 2 },
      { name: 'Sourdough Bread', unit: 'slices', min: 2, max: 4 },
      { name: 'Fresh Baby Spinach', unit: 'g', min: 50, max: 100 },
      { name: 'Greek Yogurt', unit: 'cup', min: 1, max: 2 },
      { name: 'Granola', unit: 'cup', min: 0.5, max: 1 },
      { name: 'Fresh Blueberries', unit: 'cup', min: 0.5, max: 1 },
      { name: 'Oats', unit: 'cup', min: 0.5, max: 1.5 },
      { name: 'Almond Milk', unit: 'cup', min: 1, max: 2 },
      { name: 'Raw Honey', unit: 'tbsp', min: 1, max: 2 },
    ],
    Lunch: [
      { name: 'Grilled Chicken Breast', unit: 'g', min: 150, max: 250 },
      { name: 'Quinoa', unit: 'g', min: 100, max: 200 },
      { name: 'Romaine Lettuce', unit: 'head', min: 0.5, max: 1 },
      { name: 'Extra Virgin Olive Oil', unit: 'tbsp', min: 1, max: 2 },
      { name: 'Cherry Tomatoes', unit: 'g', min: 80, max: 150 },
      { name: 'Feta Cheese', unit: 'g', min: 50, max: 100 },
      { name: 'Cucumbers', unit: 'pieces', min: 1, max: 2 },
      { name: 'Bell Peppers', unit: 'pieces', min: 1, max: 2 },
      { name: 'Black Beans', unit: 'g', min: 100, max: 200 },
      { name: 'Fresh Basil Pesto', unit: 'tbsp', min: 2, max: 3 },
    ],
    Dinner: [
      { name: 'Atlantic Salmon', unit: 'g', min: 180, max: 300 },
      { name: 'Chicken Breast Fillets', unit: 'g', min: 200, max: 400 },
      { name: 'Garlic Cloves', unit: 'minced', min: 2, max: 5 },
      { name: 'Unsalted Butter', unit: 'tbsp', min: 2, max: 4 },
      { name: 'Lemon Juice', unit: 'tbsp', min: 1, max: 2 },
      { name: 'Penne Pasta', unit: 'g', min: 200, max: 400 },
      { name: 'Asparagus Spears', unit: 'g', min: 100, max: 150 },
      { name: 'Jasmine Rice', unit: 'g', min: 150, max: 300 },
      { name: 'Broccoli Florets', unit: 'g', min: 100, max: 200 },
      { name: 'Mushrooms', unit: 'g', min: 100, max: 150 },
    ],
    Dessert: [
      { name: 'All-Purpose Flour', unit: 'g', min: 150, max: 300 },
      { name: 'Granulated Sugar', unit: 'g', min: 100, max: 250 },
      { name: 'Cocoa Powder', unit: 'g', min: 40, max: 100 },
      { name: 'Unsalted Butter', unit: 'g', min: 100, max: 200 },
      { name: 'Vanilla Extract', unit: 'tsp', min: 1, max: 2 },
      { name: 'Heavy Whipping Cream', unit: 'ml', min: 200, max: 400 },
      { name: 'Dark Chocolate Chips', unit: 'g', min: 100, max: 200 },
      { name: 'Fresh Raspberries', unit: 'g', min: 50, max: 100 },
    ],
    Snack: [
      { name: 'Kale Leaves', unit: 'g', min: 100, max: 200 },
      { name: 'Organic Chickpeas', unit: 'g', min: 150, max: 300 },
      { name: 'Raw Nuts & Seeds', unit: 'cup', min: 0.5, max: 1.5 },
      { name: 'Sweet Potatoes', unit: 'pieces', min: 1, max: 2 },
      { name: 'Fresh Strawberries', unit: 'g', min: 100, max: 200 },
      { name: 'Classic Hummus Dip', unit: 'tbsp', min: 3, max: 6 },
      { name: 'Creamy Peanut Butter', unit: 'tbsp', min: 2, max: 4 },
      { name: 'Medjool Dates', unit: 'pieces', min: 4, max: 8 },
    ],
  };

  const nameParts: Record<Recipe['category'], { adj: string[]; main: string[]; accent: string[] }> = {
    Breakfast: {
      adj: ['Crispy', 'Fluffy', 'Golden', 'Organic', 'Savory', 'Spiced', 'Warm', 'Artisan'],
      main: ['Avocado Toast', 'Maple Pancakes', 'Yogurt Parfait', 'Oatmeal Bowl', 'Frittata', 'Shakshuka', 'Chia Pudding'],
      accent: ['with Fresh Berries', 'with Sea Salt', 'topped with Thyme', 'with Toasted Almonds', 'drizzled with Honey'],
    },
    Lunch: {
      adj: ['Tuscan', 'Mediterranean', 'Zesty', 'Fresh Garden', 'Herbed', 'Creamy', 'Harvest'],
      main: ['Chicken Quinoa Bowl', 'Caesar Wrap', 'Penne Pesto', 'Tomato Basil Soup', 'Chickpea Salad', 'Poke Bowl'],
      accent: ['with Balsamic Glaze', 'with Crispy Garlic', 'with Roasted Chickpeas', 'garnished with Radishes'],
    },
    Dinner: {
      adj: ['Pan-Seared', 'Slow-Roasted', 'Garlic Butter', 'Citrus Herb', 'Flame-Grilled', 'Pesto Infused'],
      main: ['Atlantic Salmon', 'Herb Chicken Platter', 'Wild Mushroom Risotto', 'Tofu Rice Bowl', 'Shrimp Fettuccine'],
      accent: ['on Jasmine Rice', 'with Garlic Broccoli', 'with Asparagus Sauté', 'with Lemon Butter Drizzle'],
    },
    Dessert: {
      adj: ['Velvety', 'Artisan', 'Chilled', 'Silky', 'Classic', 'Decadent'],
      main: ['Chocolate Lava Cake', 'Cheesecake Tart', 'Berry Crumble', 'Walnut Brownie', 'Vanilla Panna Cotta'],
      accent: ['with Raspberries', 'with Flakey Sea Salt', 'with Dark Chocolate', 'with Mint Leaves'],
    },
    Snack: {
      adj: ['Crispy', 'Crunchy', 'Spiced', 'Roasted', 'Energizing', 'Zesty'],
      main: ['Kale Chips', 'Roasted Chickpeas', 'Trail Mix Bowl', 'Sweet Potato Crisps', 'Hummus Platter'],
      accent: ['with Smoked Paprika', 'with Sea Salt', 'infused with Lime', 'topped with Sesame'],
    },
  };

  const tagPools: Record<Recipe['category'], string[]> = {
    Breakfast: ['Healthy', 'Quick', 'Vegetarian', 'High Protein', 'Gluten-Free'],
    Lunch: ['Fresh', 'Easy', 'Mediterranean', 'Low Carb', 'Vegetarian'],
    Dinner: ['High Protein', 'Savory', 'Gourmet', 'Hearty', 'Seafood'],
    Dessert: ['Sweet', 'Baking', 'Chocolate', 'Classic', 'Indulgent'],
    Snack: ['Crispy', 'Healthy', 'Crunchy', 'Quick', 'Gluten-Free'],
  };

  const stepTemplates: Record<Recipe['category'], string[]> = {
    Breakfast: [
      'Gather and prep fresh breakfast ingredients on a clean board.',
      'Heat a non-stick skillet over medium-low heat with olive oil or butter.',
      'Cook or assemble the primary components until warm and golden.',
      'Plate neatly and garnish with fresh berries, herbs, or seeds.',
    ],
    Lunch: [
      'Wash and chop all fresh vegetables, greens, and herbs.',
      'Sear or season the main protein and grains until tender.',
      'Whisk dressing ingredients in a small bowl until emulsified.',
      'Toss together in a serving bowl and finish with garnishes.',
    ],
    Dinner: [
      'Preheat your skillet or oven and pat primary proteins dry.',
      'Sear over medium-high heat until golden brown and caramelized.',
      'Prepare complementary grains, pasta, or roasted vegetables.',
      'Plate thoughtfully and spoon warm pan reduction over the dish.',
    ],
    Dessert: [
      'Preheat oven to 175°C (350°F) and line baking pan with parchment.',
      'Combine dry and wet ingredients smoothly without overmixing.',
      'Bake or chill until perfectly set in the center.',
      'Cool and finish with chocolate, berries, or flakey salt.',
    ],
    Snack: [
      'Measure and dry all snack ingredients for maximum crispness.',
      'Toss lightly with olive oil and aromatic spices.',
      'Roast or chill as needed, then arrange on a sharing board.',
      'Serve fresh with your favorite companion dip.',
    ],
  };

  let seed = 987654321;
  const nextRand = () => {
    seed = (1103515245 * seed + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const pick = <T,>(arr: T[]): T => arr[Math.floor(nextRand() * arr.length)];

  for (const cat of categories) {
    const existingCount = recipes.filter((r) => r.category === cat).length;
    const toAdd = Math.max(0, 12 - existingCount);
    const parts = nameParts[cat];
    const pool = ingredientPools[cat];
    const imgs = IMAGE_POOLS[cat];

    for (let i = 0; i < toAdd; i++) {
      let name = '';
      for (let attempts = 0; attempts < 50; attempts++) {
        const candidate = `${pick(parts.adj)} ${pick(parts.main)} ${pick(parts.accent)}`;
        if (!usedNames.has(candidate)) {
          name = candidate;
          usedNames.add(candidate);
          break;
        }
      }
      if (!name) {
        name = `${pick(parts.adj)} ${pick(parts.main)} #${i + 1}`;
      }

      const numIngs = 4 + Math.floor(nextRand() * 3);
      const chosenIngs: Recipe['ingredients'] = [];
      const usedIngs = new Set<string>();
      while (chosenIngs.length < numIngs && usedIngs.size < pool.length) {
        const item = pick(pool);
        if (!usedIngs.has(item.name)) {
          usedIngs.add(item.name);
          const rawAmt = item.min + nextRand() * (item.max - item.min);
          const amt = rawAmt % 1 === 0 ? rawAmt.toFixed(0) : rawAmt.toFixed(1);
          chosenIngs.push({ name: item.name, amount: amt, unit: item.unit });
        }
      }

      const tagSet = new Set<string>();
      while (tagSet.size < 3) {
        tagSet.add(pick(tagPools[cat]));
      }

      const basePrice = cat === 'Breakfast' ? 4.9 : cat === 'Lunch' ? 9.9 : cat === 'Dinner' ? 14.9 : cat === 'Snack' ? 3.9 : 5.9;
      const price = Math.round((basePrice + nextRand() * 7.5) * 10) / 10;
      const photoId = imgs[(i + existingCount) % imgs.length];

      recipes.push({
        _id: `rec_cat_${cat.toLowerCase()}_${i + 1}`,
        name,
        description: `A thoughtfully balanced ${name.toLowerCase()}, crafted with fresh market ingredients and clear home-chef steps.`,
        image: `https://images.unsplash.com/${photoId}?w=600&auto=format&fit=crop&q=60`,
        category: cat,
        prepTime: 5 * (1 + Math.floor(nextRand() * 4)),
        cookTime: 5 * Math.floor(nextRand() * 6),
        servings: 1 + Math.floor(nextRand() * 4),
        ingredients: chosenIngs,
        steps: stepTemplates[cat],
        tags: Array.from(tagSet),
        price,
      });
    }
  }

  return recipes;
}

export const CURATED_RECIPES: Recipe[] = buildGeneratedCatalog();

export const DEFAULT_MEAL_PLANS: MealPlan[] = [
  { day: 'Monday', breakfast: 'rec1', lunch: 'rec2', dinner: 'rec3' },
  { day: 'Tuesday', breakfast: 'rec4', lunch: 'rec8', dinner: 'rec7' },
  { day: 'Wednesday', breakfast: 'rec1', lunch: 'rec2', dinner: 'rec3' },
  { day: 'Thursday', breakfast: 'rec4', lunch: 'rec8', dinner: 'rec7' },
  { day: 'Friday', breakfast: 'rec1', lunch: 'rec2', dinner: 'rec3' },
  { day: 'Saturday', breakfast: 'rec4', lunch: 'rec8', dinner: 'rec7' },
  { day: 'Sunday', breakfast: 'rec1', lunch: 'rec2', dinner: 'rec3' },
];
