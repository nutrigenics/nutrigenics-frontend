import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {

  Clock,
  Flame,
  Heart,
  Bookmark,
  Plus,
  Check,
  ChefHat,
  CalendarDays,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { planService } from "@/services/plan.service";
import { recipeService } from "@/services/recipe.service";
import { NutritionGrid } from "@/components/recipes/NutritionGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Skeleton className="h-[40vh] w-full rounded-xl" />
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
  const imageUrl = recipe.image
    ? recipe.image.startsWith('http')
      ? recipe.image
      : `${API_BASE_URL}${recipe.image}`
    : '';

  return (
    <div className="min-h-screen">

      <div className="w-full">

        {/* Navigation */}
        {/* <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            className="group pl-0 hover:bg-transparent hover:text-emerald-600 transition-colors"
            onClick={() => navigate(-1)}
          >
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors mr-3">
              <ArrowLeft className="w-5 h-5 text-gray-900 group-hover:text-emerald-600" />
            </div>
            <span className="font-semibold text-lg text-gray-900 group-hover:text-emerald-600">Back</span>
          </Button>


        </div> */}

        {/* --- Top Section: Image & Key Info --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16 border p-6 rounded-xl bg-white">
          {/* Left: Image */}
          <div
            className="relative aspect-[4/3] rounded-2xl"
          >
            {imageUrl ? (
              <img src={imageUrl} alt={recipe.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white flex items-center justify-center text-gray-400 border rounded-2xl">No Image</div>
            )}
          </div>

          {/* Right: Details & Actions */}
          <div className="flex flex-col justify-start space-y-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight tracking-tight line-clamp-2">
                {recipe.name}
              </h1>
              <div className="flex flex-wrap gap-2 mb-6">
                {recipe.tags?.map((tag: string | any, idx) => {
                  const label = typeof tag === 'string' ? tag : tag.name;
                  const key = typeof tag === 'string' ? tag : tag.id;
                  return (
                    <Badge key={`${key}-${idx}`} variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100 px-3 py-1 text-sm font-medium">
                      {label}
                    </Badge>
                  );
                }) || <Badge variant="secondary" className="bg-green-50 text-green-700">Healthy</Badge>}
              </div>

              {/* Key Stats */}
              <div className="flex items-center gap-8 text-gray-700 mb-8">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-500" />
                  <span className="font-semibold text-lg">{recipe.time}</span>
                </div>
                <div className="w-px h-6 bg-gray-200" />
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-rose-500" />
                  <span className="font-semibold text-lg">{Math.round(recipe.calories || 0)} <span className="text-sm text-gray-400 font-normal">kcal</span></span>
                </div>
                <div className="w-px h-6 bg-gray-200" />
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-emerald-500" />
                  <span className="font-semibold text-lg">{recipe.servings} <span className="text-sm text-gray-400 font-normal">servings</span></span>
                </div>
              </div>
            </div>

            {/* Primary Action */}
            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1 md:flex-none h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-semibold flex items-center justify-center gap-1 transition-transform active:scale-95"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="w-6 h-6" strokeWidth={3} />
                Add to Meal Plan
              </Button>

              <Button
                size="icon"
                variant="outline"
                className="h-14 w-14 rounded-2xl border-2 border-gray-200 bg-white hover:bg-red-50 hover:border-red-100 hover:text-red-500 transition-all active:scale-95"
                onClick={toggleLike}
                aria-label={isLiked ? "Unlike recipe" : "Like recipe"}
              >
                <Heart className={cn("w-6 h-6 transition-colors", isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400')} />
              </Button>

              <Button
                size="icon"
                variant="outline"
                className="h-14 w-14 rounded-2xl border-2 border-gray-200 bg-white hover:bg-amber-50 hover:border-amber-100 hover:text-amber-500 transition-all active:scale-95"
                onClick={toggleBookmark}
                aria-label={isBookmarked ? "Remove bookmark" : "Bookmark recipe"}
              >
                <Bookmark className={cn("w-6 h-6 transition-colors", isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400')} />
              </Button>
            </div>
          </div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-12">

          {/* --- LEFT COLUMN: Ingredients & Instructions --- */}
          <div className="space-y-12">

            {/* Ingredients */}
            <div className="w-full bg-white p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Ingredients</h2>
                <span className="text-sm font-medium text-gray-400">
                  {recipe.ingredients.length} items
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                {(recipe.ingredients || []).map((ingredient, idx) => {
                  const label = typeof ingredient === 'string' ? ingredient : `${ingredient.quantity} ${ingredient.ingredient_name}`;
                  return (
                    <label key={idx} className="flex items-start gap-4 p-3 -ml-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                      <div className="relative flex items-center mt-0.5">
                        <input type="checkbox" className="peer w-5 h-5 border-2 border-gray-300 rounded-md checked:bg-emerald-600 checked:border-emerald-600 appearance-none transition-all" />
                        <Check className="w-3.5 h-3.5 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                      </div>
                      <span className="text-gray-600 group-hover:text-gray-900 font-medium transition-colors leading-relaxed text-base">
                        {label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Instructions */}
            <div className="w-full bg-white p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Instructions</h2>
              </div>

              <div className="space-y-10 pl-3">
                {(recipe.instructions || []).map((step, idx) => (
                  <div key={idx} className="relative flex gap-8 group">
                    {/* Vertical Line */}
                    {idx !== (recipe.instructions || []).length - 1 && (
                      <div className="absolute left-[19px] top-12 bottom-[-40px] w-[2px] bg-gray-100 group-hover:bg-emerald-50 transition-colors" />
                    )}

                    <div className="flex flex-col items-center flex-none">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-base border-2 border-emerald-100 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm border-emerald-100">
                        {idx + 1}
                      </div>
                    </div>
                    <div className="pt-1.5 pb-4">
                      <p className="text-gray-700 leading-relaxed text-lg group-hover:text-gray-900 transition-colors">
                        {step}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: NUTRITION (Now simplified as action is at top) --- */}
          <div className="space-y-6 mb-16">
            <div className="bg-white rounded-[2rem] p-8 border border-gray-100 sticky top-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-emerald-500 rounded-full" /> Nutrition Facts
              </h3>
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
        </div>
      </div>

      {/* --- ADD TO PLAN DIALOG --- */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md bg-[#F8FAFC] border-0 shadow-2xl p-0 overflow-hidden rounded-xl gap-0">
          <div className="h-16 px-6 bg-white border-b border-gray-100 flex items-center justify-between">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-gray-900">
              <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <CalendarDays className="w-4 h-4" />
              </span>
              Add to Plan
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)} className="rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-50" aria-label="Close add to meal plan dialog">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6 space-y-6">

            {/* Date & Type Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Date</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-white border-0 shadow-sm h-12 rounded-xl text-gray-900 font-medium focus-visible:ring-1 focus-visible:ring-emerald-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Meal Type</Label>
                <Select value={selectedMealType} onValueChange={setSelectedMealType}>
                  <SelectTrigger className="bg-white border-0 shadow-sm h-12 rounded-xl text-gray-900 font-medium focus:ring-1 focus:ring-emerald-200">
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
            <div className="space-y-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center">
                <Label className="font-semibold text-gray-900">Servings</Label>
                <span className="text-2xl font-bold text-emerald-600 tracking-tight">{portion}x</span>
              </div>

              <div className="pt-2">
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={portion}
                  onChange={(e) => setPortion(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-xs font-bold text-gray-300 mt-2 uppercase tracking-wider">
                  <span>0.5</span>
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
              </div>
            </div>

            {/* Nutrition Preview */}
            <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/50">
              <Label className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-4 text-center">Projected Nutrition</Label>
              <div className="grid grid-cols-4 gap-2 text-center divide-x divide-emerald-200/50">
                <div className="px-1">
                  <div className="text-xl font-bold text-gray-900">{Math.round(previewCalories)}</div>
                  <div className="text-xs text-gray-500 font-medium mt-0.5">Kcal</div>
                </div>
                <div className="px-1">
                  <div className="text-xl font-bold text-gray-900">{Math.round(previewProtein)}g</div>
                  <div className="text-xs text-gray-500 font-medium mt-0.5">Prot</div>
                </div>
                <div className="px-1">
                  <div className="text-xl font-bold text-gray-900">{Math.round(previewCarbs)}g</div>
                  <div className="text-xs text-gray-500 font-medium mt-0.5">Carb</div>
                </div>
                <div className="px-1">
                  <div className="text-xl font-bold text-gray-900">{Math.round(previewFat)}g</div>
                  <div className="text-xs text-gray-500 font-medium mt-0.5">Fat</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 pt-2 flex gap-3 bg-white border-t border-gray-50">
            <Button variant="ghost" onClick={() => setShowAddModal(false)} className="flex-1 rounded-xl h-12 font-medium text-gray-500 hover:text-gray-900">Cancel</Button>
            <Button
              onClick={handleAddToPlan}
              disabled={addingToPlan}
              className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 shadow-lg shadow-emerald-200 font-semibold"
            >
              {addingToPlan ? "Adding..." : "Add to Plan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
