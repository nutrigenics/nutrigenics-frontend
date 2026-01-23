import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Clock, Users, ChefHat, Bookmark, Heart, Plus, ArrowLeft, Calendar as CalendarIcon, X
} from 'lucide-react';
import { recipeService } from '@/services/recipe.service';
import { planService } from '@/services/plan.service';
import type { Recipe } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Helper component for the Leaf icon
function LeafyGreenIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 22h20" />
      <path d="M12 22v-9" />
      <path d="M9.5 7.5a4.95 4.95 0 1 0-7 7A4.95 4.95 0 0 0 9.5 7.5Z" />
      <path d="M14.5 7.5a4.95 4.95 0 1 0 7 7 4.95 4.95 0 0 0-7-7Z" />
    </svg>
  )
}

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  // Use flexible Recipe type
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Add to Plan State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planDate, setPlanDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [planMealType, setPlanMealType] = useState('breakfast');
  const [isAddingToPlan, setIsAddingToPlan] = useState(false);
  const [portionQuantity, setPortionQuantity] = useState(1);

  useEffect(() => {
    if (id) {
      fetchRecipeDetail();
    }
  }, [id]);

  const fetchRecipeDetail = async () => {
    try {
      setIsLoading(true);
      const data = await recipeService.getRecipeById(Number(id));
      setRecipe(data);
    } catch (error) {
      console.error('Error fetching recipe:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getNutrientValue = (name: string) => {
    if (!recipe) return 0;
    const nutrients = recipe.nutrients || recipe.recipe_nutrient_set || [];
    // Strict checked for exact match or robust check
    const n = nutrients.find(n => {
      const nName = (n.nutrient?.name || (n as any).nutrient_name || '').toLowerCase();
      const target = name.toLowerCase();
      return nName === target || nName.includes(target) || (target === 'carbohydrates' && nName === 'carbs');
    });

    if (n && n.nutrient_quantity) {
      return Number(n.nutrient_quantity) || 0;
    }
    return 0;
  };

  const handleBookmark = async () => {
    if (!recipe) return;
    try {
      const recipeId = recipe.id || recipe.pk;
      if (!recipeId) return;

      await recipeService.bookmarkRecipe(recipeId);
      await fetchRecipeDetail();
    } catch (error) {
      console.error('Error bookmarking recipe:', error);
    }
  };

  const handleLike = async () => {
    if (!recipe) return;
    try {
      const recipeId = recipe.id || recipe.pk;
      if (!recipeId) return;

      await recipeService.likeRecipe(recipeId);
      await fetchRecipeDetail();
      toast.success(recipe.is_liked ? 'Unliked recipe' : 'Liked recipe');
    } catch (error) {
      console.error('Error liking recipe:', error);
      toast.error('Failed to update like');
    }
  };

  const handleAddToPlan = async () => {
    if (!recipe) return;
    const recipeId = recipe.id || recipe.pk;
    if (!recipeId) return;

    try {
      setIsAddingToPlan(true);

      // Calculate total nutrients based on portion
      const calories = getNutrientValue('Calories') * portionQuantity;
      const protein = getNutrientValue('Protein') * portionQuantity;
      const carbs = getNutrientValue('Carbohydrates') * portionQuantity; // Check for 'Carbs' too if needed
      const fat = getNutrientValue('Fat') * portionQuantity;

      await planService.addToPlan({
        recipe_id: recipeId,
        date: planDate,
        meal_type: planMealType,
        // Send calculated values so backend stores them
        calories: calories,
        protein: protein,
        carbs: carbs,
        fat: fat,
        // Store portion info if backend supports it (or just for calculation)
        // If backend Plan model doesn't have portion_quantity, it will ignore it or error? 
        // PlanSerializer allows extra fields? No, model doesn't have it.
        // We'll trust the calculated nutrients are what matters.
      });
      toast.success('Successfully added to your meal plan!');
      setIsPlanModalOpen(false);
    } catch (error) {
      console.error('Error adding to plan:', error);
      toast.error('Failed to add to meal plan');
    } finally {
      setIsAddingToPlan(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <div className="w-full h-96 bg-muted rounded-[2.5rem] animate-pulse mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="h-64 bg-muted rounded-[2rem] animate-pulse col-span-2" />
          <div className="h-64 bg-muted rounded-[2rem] animate-pulse" />
        </div>
      </>
    );
  }

  if (!recipe) {
    return (
      <>
        <div className="text-center py-20 bg-muted/50 rounded-[3rem]">
          <h2 className="text-3xl font-bold text-foreground mb-4">Recipe Not Found</h2>
          <Link to="/recipes">
            <Button className="rounded-xl px-8 h-12 font-bold">Back to Recipes</Button>
          </Link>
        </div>
      </>
    );
  }

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const imageUrl = recipe.recipe_image?.startsWith('http')
    ? recipe.recipe_image
    : `${API_BASE_URL}/media/${recipe.recipe_image}`;

  // Helper to normalize array data (handling both string[] and Object[])
  const getListNames = (list?: any[]): string[] => {
    if (!list) return [];
    return list.map(item => (typeof item === 'string' ? item : item.name));
  };

  // Normalizing Data Access
  const cuisines = getListNames(recipe.cuisine || recipe.recipe_cuisine);
  const diets = getListNames(recipe.diet || recipe.recipe_diet);
  const ingredients = recipe.ingredients || recipe.recipe_ingredient_set || [];
  const nutrients = recipe.nutrients || recipe.recipe_nutrient_set || [];
  const instructions = recipe.recipe_instructions || recipe.recipe_description || "No description available.";

  return (
    <>
      {/* Add to Plan Modal */}
      <AnimatePresence>
        {isPlanModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setIsPlanModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border p-6 rounded-[2rem] shadow-2xl z-50"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Add to Meal Plan</h3>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsPlanModalOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="date"
                        value={planDate}
                        onChange={(e) => setPlanDate(e.target.value)}
                        className="pl-10 h-12 rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Portion (Servings)</Label>
                    <Input
                      type="number"
                      min="0.25"
                      step="0.25"
                      value={portionQuantity}
                      onChange={(e) => setPortionQuantity(parseFloat(e.target.value) || 1)}
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Meal Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setPlanMealType(type)}
                        className={`p-3 rounded-xl border transition-all capitalize font-medium ${planMealType === type
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted/50 border-transparent hover:bg-muted'
                          }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nutrient Preview */}
                <div className="bg-muted/50 p-4 rounded-xl border border-border">
                  <p className="text-xs text-muted-foreground font-bold uppercase mb-2">Estimated per {portionQuantity} serving(s)</p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Cals</p>
                      <p className="font-bold">{(getNutrientValue('Calories') * portionQuantity).toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Prot</p>
                      <p className="font-bold">{(getNutrientValue('Protein') * portionQuantity).toFixed(1)}g</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Carbs</p>
                      <p className="font-bold">{(getNutrientValue('Carbohydrates') * portionQuantity).toFixed(1)}g</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Fat</p>
                      <p className="font-bold">{(getNutrientValue('Fat') * portionQuantity).toFixed(1)}g</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleAddToPlan}
                  disabled={isAddingToPlan}
                  className="w-full h-12 rounded-xl text-lg font-bold"
                >
                  {isAddingToPlan ? 'Adding...' : 'Confirm'}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Back Button */}
      <Link to="/recipes" className="inline-flex items-center text-muted-foreground hover:text-foreground font-bold mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Recipes
      </Link>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full rounded-[2.5rem] overflow-hidden shadow-2xl mb-8 group"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent z-10" />
        <img
          src={imageUrl}
          alt={recipe.recipe_name}
          className="w-full h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-recipe.jpg';
          }}
        />

        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 z-20">
          <div className="flex flex-wrap gap-2 mb-4">
            {cuisines.map((cuisine, i) => (
              <span key={i} className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider rounded-lg border border-white/10">
                {cuisine}
              </span>
            ))}
            {diets.map((diet, i) => (
              <span key={i} className="px-3 py-1 bg-emerald-500/80 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider rounded-lg border border-white/10">
                {diet}
              </span>
            ))}
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight max-w-4xl">
            {recipe.recipe_name}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-white/90">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="font-bold">{recipe.recipe_time_minutes || 0} min</span>
            </div>
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5" />
              <span className="font-bold">{recipe.recipe_steps || 0} steps</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span className="font-bold">{ingredients.length || 0} ingredients</span>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <Button
                onClick={handleLike}
                variant="ghost"
                className="text-white hover:bg-white/20 rounded-xl h-12 w-12 p-0"
              >
                <Heart className={`w-6 h-6 ${recipe.is_liked ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              <Button
                onClick={handleBookmark}
                variant="ghost"
                className="text-white hover:bg-white/20 rounded-xl h-12 w-12 p-0"
              >
                <Bookmark className={`w-6 h-6 ${recipe.is_bookmarked ? 'fill-primary text-primary' : ''}`} />
              </Button>
              <Button
                onClick={() => setIsPlanModalOpen(true)}
                className="bg-background text-foreground hover:bg-muted font-bold h-12 px-6 rounded-xl shadow-lg border-0"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add to Plan
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Instructions & Ingredients */}
        <div className="lg:col-span-2 space-y-8">
          {/* Instructions Section */}
          <Card className="p-6 rounded-lg border-border shadow-sm">
            <h2 className="text-xl font-semibold text-foreground mb-5 flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-muted-foreground" />
              Cooking Instructions
            </h2>
            <div className="space-y-3">
              {instructions.split('\n').filter(step => step.trim()).length > 0 ? (
                instructions.split('\n').filter(step => step.trim()).map((step, index) => (
                  <div key={index} className="flex gap-3 p-3 rounded-md bg-muted/50 border-l-2 border-primary">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium text-xs">
                      {index + 1}
                    </div>
                    <p className="text-foreground leading-relaxed flex-1 text-sm">{step.trim()}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No instructions available.</p>
              )}
            </div>
          </Card>

          {/* Ingredients Section */}
          <Card className="p-6 rounded-lg border-border shadow-sm">
            <h2 className="text-xl font-semibold text-foreground mb-5 flex items-center gap-2">
              <LeafyGreenIcon className="w-5 h-5 text-muted-foreground" />
              Ingredients
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ingredients.length > 0 ? (
                ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-md bg-muted/50 border border-border">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">{ingredient.ingredient_name}</p>
                      <p className="text-xs text-muted-foreground">{ingredient.quantity}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No ingredients listed.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Nutrition */}
        <div className="space-y-6">
          <Card className="p-6 rounded-lg border-border shadow-sm">
            <h2 className="text-xl font-semibold text-foreground mb-5">Nutrition Facts</h2>

            <div className="space-y-3">
              {nutrients.length > 0 ? (
                nutrients.map((nutrient, index) => {
                  const name = nutrient.nutrient?.name?.toLowerCase() || "";
                  let dotColor = "bg-primary";
                  if (name.includes('protein')) dotColor = "bg-blue-500";
                  else if (name.includes('fat')) dotColor = "bg-amber-500";
                  else if (name.includes('carb')) dotColor = "bg-orange-500";

                  return (
                    <div key={index} className="flex items-center justify-between p-3 rounded-md bg-muted/50 border border-border">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                        <span className="font-medium text-foreground text-sm">{nutrient.nutrient?.name}</span>
                      </div>
                      <span className="font-semibold text-foreground">{nutrient.nutrient_quantity}<span className="text-xs text-muted-foreground font-normal ml-0.5">{nutrient.unit}</span></span>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-sm">No nutrition data available.</p>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">Percent daily values are based on a 2,000 calorie diet.</p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
