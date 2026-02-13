
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Flame, ChefHat, X, Heart, Bookmark, Plus } from "lucide-react";
import { NutritionGrid } from "@/components/recipes/NutritionGrid";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/types";
import { useState } from "react";
import { toast } from "sonner";
import { planService } from "@/services/plan.service";
import { recipeService } from "@/services/recipe.service";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RecipeDetailDialogProps {
    recipe: Recipe | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function RecipeDetailDialog({ recipe, open, onOpenChange }: RecipeDetailDialogProps) {
    const [portion] = useState(1);
    const [showAddPlan, setShowAddPlan] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
    const [selectedMealType, setSelectedMealType] = useState("breakfast");
    const [addingToPlan, setAddingToPlan] = useState(false);

    // Local state for interactions within the dialog
    const [isLiked, setIsLiked] = useState(recipe?.is_liked || false);
    const [isBookmarked, setIsBookmarked] = useState(recipe?.is_bookmarked || false);

    if (!recipe) return null;

    const getNutrientValue = (name: string): number => {
        // @ts-ignore
        if (!recipe?.nutrition_facts) return 0;
        // @ts-ignore
        const nutrient = recipe.nutrition_facts.find((n: any) =>
            n.name.toLowerCase() === name.toLowerCase() ||
            n.label?.toLowerCase() === name.toLowerCase()
        );
        return nutrient ? parseFloat(nutrient.amount) : 0;
    };

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const imageUrl = recipe.image
        ? recipe.image.startsWith('http')
            ? recipe.image
            : `${API_BASE_URL}${recipe.image}`
        : '';

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
            setShowAddPlan(false);
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
            setIsLiked(!newState);
            toast.error("Failed to like recipe");
        }
    };

    const toggleBookmark = async () => {
        if (!recipe) return;
        const newState = !isBookmarked;
        setIsBookmarked(newState);
        try {
            await recipeService.bookmarkRecipe(recipe.id);
        } catch (e) {
            setIsBookmarked(!newState);
            toast.error("Failed to bookmark recipe");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 overflow-y-auto bg-white rounded-3xl border-0 shadow-2xl">
                <DialogTitle className="sr-only">{recipe.name} Details</DialogTitle>
                <div className="relative">

                    {/* Close Button - Absolute Top Right */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 z-50 bg-white/50 backdrop-blur-md hover:bg-white rounded-full shadow-sm"
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="w-5 h-5" />
                    </Button>

                    {/* Hero Image Section */}
                    <div className="relative h-64 md:h-80 w-full">
                        {imageUrl ? (
                            <img src={imageUrl} alt={recipe.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">No Image</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                        <div className="absolute bottom-6 left-6 right-6 text-white">
                            <h2 className="text-3xl md:text-4xl font-bold mb-2">{recipe.name}</h2>
                            <div className="flex flex-wrap gap-2">
                                {recipe.tags?.map((tag: string | any, idx) => {
                                    const label = typeof tag === 'string' ? tag : tag.name;
                                    return (
                                        <Badge key={idx} variant="secondary" className="bg-white/20 text-white backdrop-blur-sm border-0">
                                            {label}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 md:p-8 space-y-8">
                        {/* Stats Row */}
                        <div className="flex items-center gap-6 text-gray-700 p-4 bg-gray-50 rounded-2xl justify-around">
                            <div className="flex flex-col items-center gap-1">
                                <Clock className="w-5 h-5 text-emerald-500" />
                                <span className="font-semibold">{recipe.time}</span>
                            </div>
                            <div className="w-px h-8 bg-gray-200" />
                            <div className="flex flex-col items-center gap-1">
                                <Flame className="w-5 h-5 text-rose-500" />
                                <span className="font-semibold">{Math.round(recipe.calories || 0)} kcal</span>
                            </div>
                            <div className="w-px h-8 bg-gray-200" />
                            <div className="flex flex-col items-center gap-1">
                                <ChefHat className="w-5 h-5 text-emerald-500" />
                                <span className="font-semibold">{recipe.servings} serv</span>
                            </div>
                        </div>

                        {/* Content Grid */}
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Left: Ingredients & Instructions */}
                            <div className="space-y-8">
                                {/* Ingredients */}
                                <div>
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <span className="w-1 h-6 bg-emerald-500 rounded-full" /> Ingredients
                                    </h3>
                                    <div className="space-y-2">
                                        {(recipe.ingredients || []).map((ingredient, idx) => {
                                            const label = typeof ingredient === 'string' ? ingredient : `${ingredient.quantity} ${ingredient.ingredient_name}`;
                                            return (
                                                <div key={idx} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-300 flex-shrink-0" />
                                                    <span className="text-gray-600 leading-relaxed">{label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Instructions */}
                                <div>
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <span className="w-1 h-6 bg-emerald-500 rounded-full" /> Instructions
                                    </h3>
                                    <div className="space-y-6">
                                        {(recipe.instructions || []).map((step, idx) => (
                                            <div key={idx} className="flex gap-4">
                                                <div className="flex-none w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                                                    {idx + 1}
                                                </div>
                                                <p className="text-gray-600 leading-relaxed pt-1">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Nutrition & Actions */}
                            <div className="space-y-8">
                                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-gray-900">Nutrition</h3>
                                        <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded-full">Per serving</span>
                                    </div>
                                    <NutritionGrid
                                        calories={recipe.calories || 0}
                                        protein={getNutrientValue('Protein')}
                                        carbs={getNutrientValue('Carbohydrates')}
                                        fat={getNutrientValue('Fat')}
                                        nutrients={[
                                            { label: 'Fiber', value: getNutrientValue('Fiber'), unit: 'g' },
                                            { label: 'Sugar', value: getNutrientValue('Sugars'), unit: 'g' },
                                            { label: 'Sodium', value: getNutrientValue('Sodium'), unit: 'mg' },
                                        ]}
                                    />
                                </div>

                                {!showAddPlan ? (
                                    <div className="space-y-3">
                                        <Button
                                            size="lg"
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-14 font-semibold text-lg shadow-lg shadow-emerald-100"
                                            onClick={() => setShowAddPlan(true)}
                                        >
                                            <Plus className="w-5 h-5 mr-2" /> Add to Meal Plan
                                        </Button>

                                        <div className="flex gap-3">
                                            <Button variant="outline" className="flex-1 h-12 rounded-xl border-gray-200" onClick={toggleLike}>
                                                <Heart className={cn("w-5 h-5 mr-2", isLiked ? "fill-red-500 text-red-500" : "text-gray-400")} />
                                                {isLiked ? 'Liked' : 'Like'}
                                            </Button>
                                            <Button variant="outline" className="flex-1 h-12 rounded-xl border-gray-200" onClick={toggleBookmark}>
                                                <Bookmark className={cn("w-5 h-5 mr-2", isBookmarked ? "fill-amber-400 text-amber-400" : "text-gray-400")} />
                                                {isBookmarked ? 'Saved' : 'Save'}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-bold text-gray-900">Add to Plan</h4>
                                            <Button variant="ghost" size="sm" onClick={() => setShowAddPlan(false)} className="h-8 w-8 p-0 rounded-full"><X className="w-4 h-4" /></Button>
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <Label className="text-xs font-bold text-gray-500 uppercase">Date</Label>
                                                <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-white" />
                                            </div>
                                            <div>
                                                <Label className="text-xs font-bold text-gray-500 uppercase">Meal</Label>
                                                <Select value={selectedMealType} onValueChange={setSelectedMealType}>
                                                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="breakfast">Breakfast</SelectItem>
                                                        <SelectItem value="lunch">Lunch</SelectItem>
                                                        <SelectItem value="dinner">Dinner</SelectItem>
                                                        <SelectItem value="snack">Snack</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button className="w-full bg-emerald-600 text-white" onClick={handleAddToPlan} disabled={addingToPlan}>
                                                {addingToPlan ? 'Adding...' : 'Confirm'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
