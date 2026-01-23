import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  Flame,
  Utensils,
  Heart,
  Bookmark,
  Plus,
  Check,
  ChefHat
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { planService } from "@/services/plan.service";
import { recipeService } from "@/services/recipe.service";
import { NutritionGrid } from "@/components/recipes/NutritionGrid";
import { Skeleton } from "@/components/ui/skeleton";

// --- Types ---
interface Recipe {
  id: number;
  name: string;
  image: string;
  time: string;
  calories: number;
  servings: number;
  ingredients: (string | { ingredient_name: string; quantity: string })[];
  instructions: string[];
  nutrition_facts?: any;
  tags?: (string | { id: number; name: string })[];
  is_liked?: boolean;
  is_bookmarked?: boolean;
}

export default function RecipeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interaction States
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Add to Plan Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedMealType, setSelectedMealType] = useState("breakfast");
  const [portion, setPortion] = useState(1);
  const [addingToPlan, setAddingToPlan] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        if (!id) return;
        const data = await recipeService.getRecipeById(Number(id));
        setRecipe(data);
        setIsLiked(data.is_liked || false);
        setIsBookmarked(data.is_bookmarked || false);
      } catch (err) {
        console.error("Error fetching recipe:", err);
        setError("Failed to load recipe details.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  const handleAddToPlan = async () => {
    if (!recipe) return;
    setAddingToPlan(true);
    try {
      await planService.addToPlan({
        date: selectedDate,
        meal_type: selectedMealType,
        recipe_id: recipe.id,
        portion: portion
      });
      toast.success("Added to meal plan!");
      setShowAddModal(false);
    } catch (error) {
      console.error("Error adding to plan:", error);
      toast.error("Failed to add to meal plan");
    } finally {
      setAddingToPlan(false);
    }
  };

  const toggleLike = async () => {
    if (!recipe) return;
    const newState = !isLiked;
    setIsLiked(newState);
    try {
      await recipeService.likeRecipe(recipe.id);
    } catch (e) {
      setIsLiked(!newState); // Revert
      toast.error("Failed to update like status");
    }
  };

  const toggleBookmark = async () => {
    if (!recipe) return;
    const newState = !isBookmarked;
    setIsBookmarked(newState);
    try {
      await recipeService.bookmarkRecipe(recipe.id);
    } catch (e) {
      setIsBookmarked(!newState); // Revert
      toast.error("Failed to update bookmark");
    }
  };

  const getNutrientValue = (name: string): number => {
    if (!recipe?.nutrition_facts) return 0;
    const nutrient = recipe.nutrition_facts.find((n: any) =>
      n.name.toLowerCase() === name.toLowerCase() ||
      n.label?.toLowerCase() === name.toLowerCase()
    );
    return nutrient ? parseFloat(nutrient.amount) : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Skeleton className="h-[40vh] w-full rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Recipe not found</h2>
          <Button onClick={() => navigate(-1)} variant="outline">Go Back</Button>
        </div>
      </div>
    );
  }

  // Calculate scaled nutrition for modal preview
  const previewCalories = (recipe.calories || 0) * portion;
  const previewProtein = getNutrientValue('Protein') * portion;
  const previewCarbs = getNutrientValue('Carbohydrates') * portion;
  const previewFat = getNutrientValue('Fat') * portion;

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  // Ensure image URL is absolute. If it starts with /media, append base URL.
  const imageUrl = recipe.image
    ? recipe.image.startsWith('http')
      ? recipe.image
      : `${API_BASE_URL}${recipe.image}`
    : '';

  return (
    <div className="min-h-screen bg-background pb-20">

      {/* --- HERO SECTION --- */}
      <div className="relative h-[45vh] lg:h-[50vh] w-full overflow-hidden bg-slate-900">
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
              <span className="text-slate-500 font-medium">No Image Available</span>
            </div>
          )}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        </motion.div>

        {/* Top Navigation */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-black/20 backdrop-blur-md hover:bg-black/30 text-white"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-black/20 backdrop-blur-md hover:bg-black/30 text-white"
              onClick={toggleLike}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-black/20 backdrop-blur-md hover:bg-black/30 text-white"
              onClick={toggleBookmark}
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-yellow-500 text-yellow-500' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-10">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex flex-wrap gap-2 mb-3">
                {recipe.tags?.map((tag: string | any, idx) => {
                  const label = typeof tag === 'string' ? tag : tag.name;
                  const key = typeof tag === 'string' ? tag : tag.id;
                  return (
                    <Badge key={`${key}-${idx}`} variant="secondary" className="bg-white/20 backdrop-blur-md text-white border-none">
                      {label}
                    </Badge>
                  );
                }) || (
                    <Badge variant="secondary" className="bg-white/20 backdrop-blur-md text-white border-none">
                      Healthy
                    </Badge>
                  )}
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight shadow-sm">
                {recipe.name}
              </h1>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-8">

          {/* --- LEFT COLUMN: CONTENT --- */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-8"
          >
            {/* Stats Card */}
            <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 flex items-center justify-around border border-gray-100">
              <div className="flex flex-col items-center gap-1">
                <div className="p-2.5 bg-blue-50 rounded-full text-blue-600">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-500">Time</span>
                <span className="font-bold text-gray-900">{recipe.time}</span>
              </div>
              <div className="w-px h-10 bg-gray-100" />
              <div className="flex flex-col items-center gap-1">
                <div className="p-2.5 bg-orange-50 rounded-full text-orange-600">
                  <Flame className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-500">Calories</span>
                <span className="font-bold text-gray-900">{Math.round(recipe.calories || 0)}</span>
              </div>
              <div className="w-px h-10 bg-gray-100" />
              <div className="flex flex-col items-center gap-1">
                <div className="p-2.5 bg-green-50 rounded-full text-green-600">
                  <ChefHat className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-500">Servings</span>
                <span className="font-bold text-gray-900">{recipe.servings} pp</span>
              </div>
            </div>

            {/* Ingredients */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                  <Utensils className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Ingredients</h2>
                <span className="ml-auto text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {(recipe.ingredients || []).length} items
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {(recipe.ingredients || []).map((ingredient, idx) => {
                  const label = typeof ingredient === 'string' ? ingredient : `${ingredient.quantity} ${ingredient.ingredient_name}`;
                  return (
                    <label key={idx} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                      <div className="relative flex items-center">
                        <input type="checkbox" className="peer w-5 h-5 border-2 border-gray-300 rounded-full checked:bg-emerald-500 checked:border-emerald-500 appearance-none transition-all" />
                        <Check className="w-3.5 h-3.5 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 pointer-events-none" />
                      </div>
                      <span className="text-gray-700 group-hover:text-gray-900 transition-colors leading-relaxed">
                        {label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 text-sm font-bold">
                  #
                </span>
                Instructions
              </h2>

              <div className="space-y-8">
                {(recipe.instructions || []).map((step, idx) => (
                  <div key={idx} className="relative flex gap-6 group">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm border border-indigo-100 z-10 group-hover:scale-110 transition-transform">
                        {idx + 1}
                      </div>
                      {idx !== (recipe.instructions || []).length - 1 && (
                        <div className="w-0.5 bg-gray-100 flex-1 mt-2 mb-2" />
                      )}
                    </div>
                    <div className="pb-2">
                      <p className="text-gray-700 leading-relaxed text-lg">
                        {step}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* --- RIGHT COLUMN: NUTRITION & ACTIONS --- */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Add to Plan Card (Sticky on Desktop) */}
            <div className="sticky top-6 space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-xl shadow-indigo-100/50 border border-gray-100">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Add to Meal Plan</h3>
                  <p className="text-sm text-gray-500">Track this recipe in your daily nutrition goals.</p>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-200/50 rounded-xl h-12 text-base font-semibold"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add to Daily Plan
                </Button>
              </div>

              {/* Nutrition Component */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <NutritionGrid
                  calories={recipe.calories || 0}
                  protein={getNutrientValue('Protein')}
                  carbs={getNutrientValue('Carbohydrates')}
                  fat={getNutrientValue('Fat')}
                  nutrients={[
                    { label: 'Fiber', value: getNutrientValue('Fiber'), unit: 'g' },
                    { label: 'Sugar', value: getNutrientValue('Sugars'), unit: 'g' },
                    { label: 'Sodium', value: getNutrientValue('Sodium'), unit: 'mg' },
                    { label: 'Cholesterol', value: getNutrientValue('Cholesterol'), unit: 'mg' },
                    { label: 'Sat. Fat', value: getNutrientValue('Saturated Fat'), unit: 'g' },
                    { label: 'Iron', value: getNutrientValue('Iron'), unit: 'mg' },
                  ]}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* --- ADD TO PLAN DIALOG --- */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md bg-white border border-gray-100 p-0 overflow-hidden rounded-3xl">
          <div className="p-6 bg-gradient-to-b from-emerald-50 to-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <span className="p-2 bg-white rounded-lg shadow-sm">
                  📅
                </span>
                Add to Meal Plan
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 mt-6">

              {/* Date & Type Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-white border-gray-200 h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Meal</Label>
                  <Select value={selectedMealType} onValueChange={setSelectedMealType}>
                    <SelectTrigger className="bg-white border-gray-200 h-10 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast"><span className="flex items-center gap-2">🍳 Breakfast</span></SelectItem>
                      <SelectItem value="lunch"><span className="flex items-center gap-2">☀️ Lunch</span></SelectItem>
                      <SelectItem value="dinner"><span className="flex items-center gap-2">🌙 Dinner</span></SelectItem>
                      <SelectItem value="snack"><span className="flex items-center gap-2">🍎 Snack</span></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Portion Slider/Input */}
              <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-100">
                <div className="flex justify-between items-center">
                  <Label className="font-semibold text-gray-900">Servings</Label>
                  <span className="text-2xl font-bold text-emerald-600">{portion}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={portion}
                  onChange={(e) => setPortion(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>0.5</span>
                  <span>5</span>
                </div>
              </div>

              {/* Nutrition Preview */}
              <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-3">Nutrition Impact</Label>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold text-gray-900">{Math.round(previewCalories)}</div>
                    <div className="text-[10px] text-gray-500 uppercase">Kcal</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">{Math.round(previewProtein)}g</div>
                    <div className="text-[10px] text-gray-500 uppercase">Prot</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">{Math.round(previewCarbs)}g</div>
                    <div className="text-[10px] text-gray-500 uppercase">Carb</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">{Math.round(previewFat)}g</div>
                    <div className="text-[10px] text-gray-500 uppercase">Fat</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <Button variant="ghost" onClick={() => setShowAddModal(false)} className="flex-1 rounded-xl">Cancel</Button>
              <Button onClick={handleAddToPlan} disabled={addingToPlan} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                {addingToPlan ? "Adding..." : "Add to Plan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
