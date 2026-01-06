import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bookmark, Heart, ArrowUpRight } from 'lucide-react';
import type { Recipe } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { recipeService } from '@/services/recipe.service';
import { toast } from 'sonner';

interface RecipeCardProps {
    recipe: Recipe;
    onBookmark?: (recipeId: number) => void;
    onLike?: (recipeId: number) => void;
    variant?: 'default' | 'compact';
    onClick?: () => void;
    actions?: React.ReactNode;
    className?: string;
}

export function RecipeCard({ recipe, className, variant = 'default', onClick, actions }: RecipeCardProps) {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const imageUrl = recipe.recipe_image?.startsWith('http')
        ? recipe.recipe_image
        : `${API_BASE_URL}/media/${recipe.recipe_image}`;

    // Local state for optimistic updates
    const [isBookmarked, setIsBookmarked] = useState(recipe.is_bookmarked);
    const [isLiked, setIsLiked] = useState(recipe.is_liked);

    // Get key nutrients
    const nutrients = recipe.recipe_nutrient_set || [];

    const handleBookmark = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const newState = !isBookmarked;
        setIsBookmarked(newState);
        try {
            await recipeService.bookmarkRecipe(recipe.pk);
            toast.success(newState ? 'Recipe saved!' : 'Recipe removed from saved');
        } catch (error) {
            setIsBookmarked(!newState);
            toast.error('Failed to update bookmark');
        }
    };

    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const newState = !isLiked;
        setIsLiked(newState);
        try {
            await recipeService.likeRecipe(recipe.pk);
        } catch (error) {
            setIsLiked(!newState);
            toast.error('Failed to update like');
        }
    };

    const nutrientConfig: Record<string, string> = {
        'Calories': 'Calories',
        'Energy': 'Calories',
        'Protein': 'Protein',
        'Carbohydrates': 'Carbs',
        'Carbs': 'Carbs',
        'Fat': 'Fat',
        'Total Fat': 'Fat',
        'Fiber': 'Fiber',
        'Sugar': 'Sugar',
        'Sugars': 'Sugar',
        'Sodium': 'Sodium',
        'Cholesterol': 'Chol',
        'Saturated Fat': 'Sat. Fat',
        'Iron': 'Iron',
        'Vitamin C': 'Vit C',
    };

    const getFormattedNutrient = (n: any) => {
        const rawName = n.nutrient?.name || n.nutrient_name || '';
        if (!rawName || !n.nutrient_quantity) return null;

        const label = nutrientConfig[rawName] || nutrientConfig[Object.keys(nutrientConfig).find(k => rawName.includes(k)) || ''] || rawName;
        const unit = n.unit || n.nutrient?.unit || '';

        return { label, value: Number(n.nutrient_quantity), unit };
    };

    // --- COMPACT VARIANT ---
    if (variant === 'compact') {
        const getNutrient = (names: string[]) => nutrients.find(n => names.some(name => (n.nutrient?.name === name || (n as any).nutrient_name === name)));

        const calories = getNutrient(['Calories', 'Energy']);
        const protein = getNutrient(['Protein']);
        const carbs = getNutrient(['Carbohydrates', 'Carbs']);
        const fat = getNutrient(['Fat', 'Total Fat']);

        return (
            <div
                onClick={onClick}
                className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border border-border bg-card",
                    "hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group",
                    className
                )}
            >
                <div className="w-14 h-14 rounded-md bg-muted overflow-hidden shrink-0 relative">
                    <img
                        src={imageUrl}
                        alt={recipe.recipe_name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-recipe.jpg'; }}
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate text-sm">{recipe.recipe_name}</h4>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mt-0.5">
                        <span>{recipe.recipe_time_minutes} min</span>
                        {calories && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-border" />
                                <span>{Number(calories.nutrient_quantity).toFixed(0)} kcal</span>
                            </>
                        )}
                    </div>
                </div>
                {actions && (
                    <div onClick={(e) => e.stopPropagation()}>
                        {actions}
                    </div>
                )}
            </div>
        );
    }

    // --- DEFAULT VARIANT CONTENT ---
    const DefaultCardContent = (
        <>
            {/* Recipe Image */}
            <div className="w-full aspect-[3/2] overflow-hidden relative">
                <img
                    src={imageUrl}
                    alt={recipe.recipe_name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-recipe.jpg';
                    }}
                />

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

                {/* Hover: View Details Icon (Only if using Link) */}
                {!onClick && (
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                        <div className="bg-background/80 backdrop-blur-md p-2.5 rounded-xl shadow-lg border border-border">
                            <ArrowUpRight className="w-5 h-5 text-foreground" />
                        </div>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-5">
                <h5 className="text-lg font-bold text-foreground mb-2 line-clamp-2 transition-colors truncate">
                    {recipe.recipe_name}
                </h5>

                {/* Metadata */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1 font-medium">
                        {recipe.recipe_ingredient_set?.length || 0} Ingredients
                    </span>
                    <div className="text-border h-3 w-px bg-border mx-1"></div>
                    <span className="flex items-center gap-1 font-medium">
                        {recipe.recipe_time_minutes} min
                    </span>
                </div>

                {/* Nutrients List */}
                <div className="flex flex-wrap gap-2">
                    {nutrients.map((n, index) => {
                        const data = getFormattedNutrient(n);
                        if (!data) return null;

                        return (
                            <Badge key={index} variant="secondary" className="font-normal px-2.5 py-1">
                                <span className="font-bold mr-1">{data.value.toLocaleString()}{data.unit}</span>
                                <span className="opacity-70 text-[10px] uppercase font-bold">{data.label}</span>
                            </Badge>
                        );
                    })}
                </div>
            </div>
        </>
    );

    // --- DEFAULT VARIANT RENDER ---
    return (
        <Card className={cn(
            'overflow-hidden border-border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-200',
            'group cursor-pointer rounded-3xl',
            className
        )}>
            {onClick ? (
                <div onClick={onClick} className="block cursor-pointer">
                    {DefaultCardContent}
                </div>
            ) : (
                <Link to={`/recipes/${recipe.pk || recipe.id}`} className="block">
                    {DefaultCardContent}
                </Link>
            )}

            {/* Action Buttons */}
            {actions ? (
                <div className="px-5 pb-5 w-full">{actions}</div>
            ) : (
                <div className="px-5 pb-5 flex gap-2 pt-0 w-full">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleBookmark}
                        className={cn(
                            'w-10 h-10 rounded-xl transition-all duration-200',
                            isBookmarked
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900'
                                : 'hover:border-emerald-400 hover:text-emerald-600 dark:hover:border-emerald-800'
                        )}
                        aria-label="Bookmark recipe"
                    >
                        <Bookmark
                            className={cn(
                                "w-4 h-4 transition-transform",
                                isBookmarked && "scale-110 fill-current"
                            )}
                        />
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleLike}
                        className={cn(
                            'w-10 h-10 rounded-xl transition-all duration-200',
                            isLiked
                                ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900'
                                : 'hover:border-rose-400 hover:text-rose-600 dark:hover:border-rose-800'
                        )}
                        aria-label="Like recipe"
                    >
                        <Heart
                            className={cn(
                                "w-4 h-4 transition-transform",
                                isLiked && "scale-110 fill-current"
                            )}
                        />
                    </Button>
                </div>
            )}
        </Card>
    );
}
