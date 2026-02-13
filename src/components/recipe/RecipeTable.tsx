import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    ChevronDown,
    Clock,
    Flame,
    Heart,
    Bookmark,
    Utensils,
    Sparkles,
    Users,
    ChefHat
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Recipe } from "@/types";
import { cn } from "@/lib/utils";

interface RecipeTableProps {
    recipes: Recipe[];
    onLike: (id: number) => void;
    onBookmark: (id: number) => void;
}

export function RecipeTable({ recipes, onLike, onBookmark }: RecipeTableProps) {
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const toggleExpand = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const getNutrient = (recipe: Recipe, name: string) => {
        return recipe.recipe_nutrient_set?.find(n =>
            (n.nutrient?.name === name) ||
            ((n as any).nutrient_name === name)
        );
    };

    const getCalories = (recipe: Recipe) => {
        const cal = getNutrient(recipe, 'Calories');
        return Math.round(Number(cal?.nutrient_quantity || 0));
    };

    return (
        <div className="space-y-3">
            {recipes.map((recipe, index) => (
                <motion.div
                    key={recipe.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className="group"
                >
                    {/* Main Row Card */}
                    <div
                        className={cn(
                            "relative overflow-hidden rounded-2xl border border-border bg-card/80 backdrop-blur-sm",
                            "transition-all duration-300 ease-out cursor-pointer",
                            "hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20",
                            "hover:scale-[1.01] hover:bg-card",
                            expandedId === recipe.id && "border-primary/30 shadow-lg shadow-primary/10 bg-card"
                        )}
                        onClick={() => toggleExpand(recipe.id)}
                    >
                        <div className="flex items-center gap-4 p-4">
                            {/* Recipe Image with Gradient Overlay */}
                            <div className="relative flex-shrink-0">
                                <Avatar className="h-16 w-16 rounded-xl shadow-md ring-2 ring-background">
                                    <AvatarImage
                                        src={recipe.recipe_image}
                                        alt={recipe.recipe_name}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl">
                                        <Utensils className="h-6 w-6 text-primary" />
                                    </AvatarFallback>
                                </Avatar>
                                {/* Floating Badge for Popular Recipes */}
                                {recipe.bookmark_counter && recipe.bookmark_counter > 10 && (
                                    <div className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                        <Sparkles className="h-2.5 w-2.5 inline" />
                                    </div>
                                )}
                            </div>

                            {/* Recipe Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-foreground truncate text-base group-hover:text-primary transition-colors">
                                            {recipe.recipe_name}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            {recipe.recipe_time_minutes && (
                                                <Badge variant="secondary" className="gap-1 text-xs font-normal bg-muted/80 hover:bg-muted">
                                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                                    {recipe.recipe_time_minutes} min
                                                </Badge>
                                            )}
                                            <Badge variant="secondary" className="gap-1 text-xs font-normal bg-muted/80 hover:bg-muted">
                                                <Flame className="h-3 w-3 text-orange-500" />
                                                {getCalories(recipe)} cal
                                            </Badge>
                                            {recipe.recipe_yields && (
                                                <Badge variant="secondary" className="gap-1 text-xs font-normal bg-muted/80 hover:bg-muted">
                                                    <Users className="h-3 w-3 text-muted-foreground" />
                                                    {recipe.recipe_yields} servings
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onLike(recipe.id)}
                                    aria-label={recipe.is_liked ? `Unlike ${recipe.recipe_name}` : `Like ${recipe.recipe_name}`}
                                    className={cn(
                                        "h-10 w-10 rounded-xl transition-all duration-200",
                                        recipe.is_liked
                                            ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                            : "hover:bg-muted text-muted-foreground hover:text-red-500"
                                    )}
                                >
                                    <Heart className={cn("h-5 w-5", recipe.is_liked && "fill-current")} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onBookmark(recipe.id)}
                                    aria-label={recipe.is_bookmarked ? `Remove bookmark for ${recipe.recipe_name}` : `Bookmark ${recipe.recipe_name}`}
                                    className={cn(
                                        "h-10 w-10 rounded-xl transition-all duration-200",
                                        recipe.is_bookmarked
                                            ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                                            : "hover:bg-muted text-muted-foreground hover:text-amber-500"
                                    )}
                                >
                                    <Bookmark className={cn("h-5 w-5", recipe.is_bookmarked && "fill-current")} />
                                </Button>
                                <div className={cn(
                                    "h-10 w-10 flex items-center justify-center rounded-xl bg-muted/50 transition-transform duration-300",
                                    expandedId === recipe.id && "rotate-180"
                                )}>
                                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                </div>
                            </div>
                        </div>

                        {/* Expandable Details Section */}
                        <AnimatePresence>
                            {expandedId === recipe.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="overflow-hidden"
                                >
                                    <div className="border-t border-border/50 bg-gradient-to-b from-muted/30 to-transparent">
                                        <div className="p-6 grid gap-6 md:grid-cols-2">
                                            {/* Left Column: Image & Ingredients */}
                                            <div className="space-y-5">
                                                {/* Recipe Image */}
                                                <div className="relative aspect-video rounded-xl overflow-hidden shadow-lg ring-1 ring-border/50">
                                                    <img
                                                        src={recipe.recipe_image}
                                                        alt={recipe.recipe_name}
                                                        className="object-cover w-full h-full"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                                </div>

                                                {/* Ingredients */}
                                                <div className="bg-background/60 backdrop-blur-sm rounded-xl p-4 border border-border/50">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="p-1.5 rounded-lg bg-primary/10">
                                                            <ChefHat className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <h4 className="font-semibold text-sm text-foreground">Ingredients</h4>
                                                    </div>
                                                    <ul className="space-y-2">
                                                        {recipe.recipe_ingredient_set?.slice(0, 8).map((ing, i) => (
                                                            <li key={i} className="flex items-center gap-2 text-sm">
                                                                <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                                                                <span className="font-medium text-foreground">
                                                                    {(ing as any).ingredient?.name || ing.ingredient_name}
                                                                </span>
                                                                {ing.quantity && (
                                                                    <span className="text-muted-foreground text-xs ml-auto">
                                                                        {ing.quantity}
                                                                    </span>
                                                                )}
                                                            </li>
                                                        ))}
                                                        {(recipe.recipe_ingredient_set?.length || 0) > 8 && (
                                                            <li className="text-xs text-muted-foreground italic">
                                                                +{(recipe.recipe_ingredient_set?.length || 0) - 8} more ingredients
                                                            </li>
                                                        )}
                                                    </ul>
                                                </div>
                                            </div>

                                            {/* Right Column: Nutrition & Instructions */}
                                            <div className="space-y-5">
                                                {/* Nutritional Information */}
                                                <div className="bg-background/60 backdrop-blur-sm rounded-xl p-4 border border-border/50">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="p-1.5 rounded-lg bg-green-500/10">
                                                            <Flame className="h-4 w-4 text-green-500" />
                                                        </div>
                                                        <h4 className="font-semibold text-sm text-foreground">Nutrition</h4>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {(recipe.recipe_nutrient_set || []).slice(0, 6).map((n: any, idx: number) => {
                                                            const rawName = n.nutrient?.name || n.nutrient_name || '';
                                                            let label = rawName;
                                                            if (label === 'Carbs') label = 'Carbs';
                                                            if (!label) return null;

                                                            // Define colors for different nutrients
                                                            const colors: Record<string, string> = {
                                                                'Calories': 'from-orange-500/20 to-orange-500/5 text-orange-600',
                                                                'Protein': 'from-blue-500/20 to-blue-500/5 text-blue-600',
                                                                'Carbs': 'from-amber-500/20 to-amber-500/5 text-amber-600',
                                                                'Fat': 'from-purple-500/20 to-purple-500/5 text-purple-600',
                                                                'Fiber': 'from-green-500/20 to-green-500/5 text-green-600',
                                                            };
                                                            const colorClass = colors[label] || 'from-muted to-muted/50 text-foreground';

                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className={cn(
                                                                        "p-3 rounded-lg bg-gradient-to-br border border-border/30 text-center",
                                                                        colorClass
                                                                    )}
                                                                >
                                                                    <span className="text-lg font-bold block">
                                                                        {Math.round(Number(n.nutrient_quantity))}
                                                                    </span>
                                                                    <span className="text-xs font-medium uppercase opacity-80 block truncate">
                                                                        {label}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Instructions */}
                                                <div className="bg-background/60 backdrop-blur-sm rounded-xl p-4 border border-border/50">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="p-1.5 rounded-lg bg-violet-500/10">
                                                            <Sparkles className="h-4 w-4 text-violet-500" />
                                                        </div>
                                                        <h4 className="font-semibold text-sm text-foreground">Instructions</h4>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-6">
                                                        {(recipe as any).recipe_instructions || recipe.recipe_description || 'No instructions available.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            ))}

            {/* Empty State */}
            {recipes.length === 0 && (
                <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4">
                        <Utensils className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">No recipes found</h3>
                    <p className="text-muted-foreground text-sm">Start exploring recipes to add them here!</p>
                </div>
            )}
        </div>
    );
}
