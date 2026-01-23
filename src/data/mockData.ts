import type { Recipe, MealPlan, Patient, NutrientSummary } from '@/types';

// --- MOCK USER PROFILE ---
export const MOCK_GUEST_PROFILE: Patient = {
    id: 999,
    user: { id: 999, email: "guest@nutrigenics.care" },
    fname: "Guest",
    lname: "User",
    date_of_birth: "1995-06-15",
    gender: "Female",
    height: 168,
    weight: 65,
    activity_level: "moderate",
    dietary_preferences: ["Mediterranean", "Low Carb"],
    allergies: ["Peanuts"],
    health_conditions: [],
    goal: "Maintain Weight",
    bmi: 23.0,
    consent_accepted: true,
    created_at: new Date().toISOString(),
    nutrient_targets: { // Add this to match interface
        calories: 2100,
        protein: 110,
        carbs: 220,
        fat: 70,
        fiber: 30
    }
} as unknown as Patient;

// --- MOCK RECIPES ---
export const MOCK_RECIPES: Recipe[] = [
    {
        id: 101,
        name: "Avocado & Poached Egg Toast",
        description: "Creamy avocado spread on toasted sourdough topped with a perfectly poached egg and chili flakes.",
        image: "https://images.unsplash.com/photo-1525351484163-7529414395d8?auto=format&fit=crop&w=800&q=80",
        ingredients: [
            { ingredient_name: "Sourdough Bread", quantity: "2 slices" },
            { ingredient_name: "Avocado", quantity: "1 ripe" },
            { ingredient_name: "Eggs", quantity: "2 large" },
            { ingredient_name: "Chili Flakes", quantity: "1 pinch" },
            { ingredient_name: "Lemon Juice", quantity: "1 tsp" }
        ],
        instructions: [
            "Toast the sourdough slices until golden brown.",
            "Mash the avocado with lemon juice, salt, and pepper.",
            "Poach the eggs in simmering water for 3-4 minutes.",
            "Spread avocado on toast, top with egg, and sprinkle with chili flakes."
        ],
        calories: 450,
        protein: 18,
        carbs: 35,
        fat: 28,
        time: "15 min",
        difficulty: "Easy",
        servings: 1,
        tags: ["Breakfast", "High Protein", "Vegetarian"],
        recipe_meal_type: ["breakfast"],
        is_bookmarked: false
    },
    {
        id: 102,
        name: "Grilled Salmon with Quinoa Bowl",
        description: "A nutritious bowl featuring grilled Atlantic salmon, fluffy quinoa, and roasted vegetables.",
        image: "https://images.unsplash.com/photo-1467003909585-2f8a7270028d?auto=format&fit=crop&w=800&q=80",
        ingredients: [
            { ingredient_name: "Salmon Fillet", quantity: "150g" },
            { ingredient_name: "Quinoa", quantity: "1/2 cup cooked" },
            { ingredient_name: "Asparagus", quantity: "100g" },
            { ingredient_name: "Cherry Tomatoes", quantity: "1/2 cup" },
            { ingredient_name: "Olive Oil", quantity: "1 tbsp" }
        ],
        instructions: [
            "Season salmon with herbs and lemon.",
            "Grill salmon for 4-5 minutes per side.",
            "Roast asparagus and tomatoes with olive oil at 200°C for 15 mins.",
            "Assemble bowl with quinoa base, veggies, and salmon."
        ],
        calories: 580,
        protein: 42,
        carbs: 45,
        fat: 24,
        time: "25 min",
        difficulty: "Medium",
        servings: 1,
        tags: ["Lunch", "Dinner", "Gluten Free", "High Omega-3"],
        recipe_meal_type: ["lunch", "dinner"],
        is_bookmarked: true
    },
    {
        id: 103,
        name: "Berry & Spinach Power Smoothie",
        description: "A refreshing antioxidant-rich smoothie perfect for post-workout recovery.",
        image: "https://images.unsplash.com/photo-1553530666-ba11a9069509?auto=format&fit=crop&w=800&q=80",
        ingredients: [
            { ingredient_name: "Spinach", quantity: "1 cup" },
            { ingredient_name: "Mixed Berries", quantity: "1 cup frozen" },
            { ingredient_name: "Banana", quantity: "1 medium" },
            { ingredient_name: "Protein Powder", quantity: "1 scoop" },
            { ingredient_name: "Almond Milk", quantity: "1 cup" }
        ],
        instructions: [
            "Add all ingredients to a blender.",
            "Blend on high speed until smooth.",
            "Add ice if desired for thicker consistency."
        ],
        calories: 320,
        protein: 25,
        carbs: 48,
        fat: 5,
        time: "5 min",
        difficulty: "Easy",
        servings: 1,
        tags: ["Snack", "Breakfast", "Vegan"],
        recipe_meal_type: ["breakfast", "snack"]
    },
    {
        id: 104,
        name: "Mediterranean Chickpea Salad",
        description: "Fresh herbs, crisp cucumbers, and protein-packed chickpeas in a zesty lemon dressing.",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
        ingredients: [
            "Chickpeas", "Cucumber", "Red Onion", "Feta Cheese", "Parsley", "Lemon Vinaigrette"
        ],
        instructions: ["Chop veggies", "Mix ingredients", "Toss with dressing"],
        calories: 380,
        protein: 15,
        carbs: 42,
        fat: 16,
        time: "10 min",
        difficulty: "Easy",
        servings: 2,
        tags: ["Lunch", "Vegetarian"],
        recipe_meal_type: ["lunch"]
    },
    {
        id: 105,
        name: "Lemon Herb Roasted Chicken",
        description: "Juicy chicken thighs roasted with rosemary, thyme, and lemon wedges.",
        image: "https://images.unsplash.com/photo-1598103442097-8b7439453e2e?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Chicken Thighs", "Lemon", "Rosemary", "Garlic", "Olive Oil"],
        instructions: ["Marinate chicken", "Roast at 400F for 35 mins"],
        calories: 620,
        protein: 50,
        carbs: 5,
        fat: 45,
        time: "45 min",
        difficulty: "Medium",
        servings: 4,
        tags: ["Dinner", "Keto", "High Protein"],
        recipe_meal_type: ["dinner"]
    }
] as unknown as Recipe[];

// --- MOCK MEAL PLAN (Today) ---
const today = new Date().toISOString().split('T')[0];

export const MOCK_MEAL_PLAN: MealPlan[] = [
    {
        id: 1,
        recipe: MOCK_RECIPES[0],
        recipe_id: 101,
        date: today,
        meal_type: "breakfast",
        completed: true,
        calories: 450,
        protein: 18,
        carbs: 35,
        fat: 28,
        portion: 1
    },
    {
        id: 2,
        recipe: MOCK_RECIPES[1], // Salmon
        recipe_id: 102,
        date: today,
        meal_type: "lunch",
        completed: false,
        calories: 580,
        protein: 42,
        carbs: 45,
        fat: 24,
        portion: 1
    },
    {
        id: 3,
        recipe: MOCK_RECIPES[2], // Smoothie
        recipe_id: 103,
        date: today,
        meal_type: "snack",
        completed: false,
        calories: 320,
        protein: 25,
        carbs: 48,
        fat: 5,
        portion: 1
    },
    {
        id: 4,
        recipe: MOCK_RECIPES[4], // Chicken
        recipe_id: 105,
        date: today,
        meal_type: "dinner",
        completed: false,
        calories: 620,
        protein: 50,
        carbs: 5,
        fat: 45,
        portion: 1
    }
];

// --- MOCK HISTORY (Last 30 Days) ---
const getPastDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
};

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Scenarios helpers
const scenarios = [
    { name: 'Balanced', p: 110, c: 220, f: 70, cal: 2100 },
    { name: 'High Protein', p: 150, c: 150, f: 80, cal: 2200 },
    { name: 'Cheat Day', p: 80, c: 300, f: 100, cal: 2800 },
    { name: 'Low Calorie', p: 100, c: 150, f: 50, cal: 1600 },
    { name: 'Active Day', p: 130, c: 250, f: 60, cal: 2300 }
];

export const MOCK_HISTORY = Array.from({ length: 180 }).map((_, i) => { // Increased to 180 days
    const dateStr = getPastDate(179 - i); // Generate from 179 days ago to today
    const dateObj = new Date(dateStr);
    const dayName = WEEKDAYS[dateObj.getDay()];

    // Pick a scenario: Weekends might be cheat days, others semi-random
    let scenario = scenarios[0]; // Default Balanced
    const isWeekend = dayName === 'Saturday' || dayName === 'Sunday';

    if (isWeekend && Math.random() > 0.5) scenario = scenarios[2]; // 50% chance of cheat day on weekend
    else if (Math.random() > 0.8) scenario = scenarios[4]; // Occasional Active day
    else if (Math.random() > 0.8) scenario = scenarios[1]; // Occasional High Protein
    else if (Math.random() > 0.9) scenario = scenarios[3]; // Rare Low Calorie

    // Vary stats slightly for realism from the scenario base
    const vary = (base: number) => Math.round(base + (Math.random() * (base * 0.15) - (base * 0.07)));

    const total_calories = vary(scenario.cal);
    const total_protein = vary(scenario.p);
    const total_carbohydrates = vary(scenario.c);
    const total_fat = vary(scenario.f);

    return {
        date: dateStr,
        weekday: dayName,
        total_calories,
        total_protein,
        total_carbohydrates,
        total_fat,
        total_fiber: vary(25), // varied fiber
        total_sugar: scenario.name === 'Cheat Day' ? vary(80) : vary(40), // Spike sugar on cheat days
        total_sodium: scenario.name === 'Cheat Day' ? vary(3500) : vary(2100), // Spike sodium on cheat days
        total_cholesterol: vary(200),
        total_saturated_fat: scenario.name === 'Cheat Day' ? vary(35) : vary(20),
        total_unsaturated_fat: vary(40),
        total_trans_fat: scenario.name === 'Cheat Day' ? 1.5 : 0.2, // Some trans fat on cheat days
        meals: [
            { name: "Breakfast", meal_type: "breakfast", calories: Math.round(total_calories * 0.25) },
            { name: "Lunch", meal_type: "lunch", calories: Math.round(total_calories * 0.35) },
            { name: "Dinner", meal_type: "dinner", calories: Math.round(total_calories * 0.30) },
            { name: "Snack", meal_type: "snack", calories: Math.round(total_calories * 0.10) }
        ]
    };
});

// Mock other analytics responses derived from history
export const MOCK_NUTRIENT_STATS = {
    dates: MOCK_HISTORY.map(h => h.date),
    weekdays: MOCK_HISTORY.map(h => h.weekday),
    calories: MOCK_HISTORY.map(h => h.total_calories),
    total_calories: Math.round(MOCK_HISTORY.reduce((a, b) => a + b.total_calories, 0) / MOCK_HISTORY.length),
    macro_nutrients: [
        { name: "Protein", data: MOCK_HISTORY.map(h => h.total_protein) },
        { name: "Carbohydrates", data: MOCK_HISTORY.map(h => h.total_carbohydrates) },
        { name: "Fat", data: MOCK_HISTORY.map(h => h.total_fat) },
        { name: "Fiber", data: MOCK_HISTORY.map(h => h.total_fiber) }
    ],
    micro_nutrients: [
        { name: "Sodium", data: MOCK_HISTORY.map(h => h.total_sodium) },
        { name: "Cholesterol", data: MOCK_HISTORY.map(h => h.total_cholesterol) }
    ],
    limiting_nutrients: [
        { name: "Sugar", data: MOCK_HISTORY.map(h => h.total_sugar) },
        { name: "Saturated Fat", data: MOCK_HISTORY.map(h => h.total_saturated_fat) },
        { name: "Trans-fat", data: MOCK_HISTORY.map(h => h.total_trans_fat) },
        { name: "Unsaturated Fat", data: MOCK_HISTORY.map(h => h.total_unsaturated_fat) }
    ]
};

export const MOCK_NUTRIENT_SUMMARY: NutrientSummary = {
    Calories: 1970,
    Protein: 135,
    Carbohydrates: 133,
    Fat: 102
};
