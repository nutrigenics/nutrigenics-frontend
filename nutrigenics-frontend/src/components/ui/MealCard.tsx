import { Card } from '@/components/ui/card';
import { Check, Clock } from 'lucide-react';
import type { MealPlan } from '@/types';

interface MealCardProps {
    meal: MealPlan;
    onComplete?: () => void;
    onView?: () => void;
    compact?: boolean;
}

export function MealCard({ meal, onComplete, onView, compact = false }: MealCardProps) {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    // Type guard for optional recipe
    if (!meal.recipe) {
        return null;
    }

    const imageUrl = meal.recipe.recipe_image.startsWith('http')
        ? meal.recipe.recipe_image
        : `${API_BASE_URL}/media/${meal.recipe.recipe_image}`;

    const mealTypeColors = {
        breakfast: 'from-amber-400 to-orange-500',
        lunch: 'from-emerald-400 to-teal-500',
        dinner: 'from-indigo-400 to-purple-500',
    };

    return (
        <Card
            className={cn(
                'overflow-hidden border-2 transition-all duration-300 hover:shadow-lg',
                meal.completed ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 hover:border-gray-300',
                compact ? 'p-3' : 'p-4'
            )}
        >
            <div className={cn('flex gap-4', compact ? 'items-center' : 'flex-col sm:flex-row')}>
                {/* Meal Image */}
                <div className={cn('relative overflow-hidden rounded-xl flex-shrink-0', compact ? 'w-16 h-16' : 'w-full sm:w-32 h-32')}>
                    <img
                        src={imageUrl}
                        alt={meal.recipe.recipe_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-recipe.jpg';
                        }}
                    />
                    {meal.completed && (
                        <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-[2px] flex items-center justify-center">
                            <div className="bg-emerald-500 rounded-full p-2">
                                <Check className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Meal Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                            <span className={cn(
                                'inline-block px-2 py-1 rounded-full text-xs font-medium mb-1 text-white',
                                `bg-gradient-to-r ${mealTypeColors[meal.meal_type as keyof typeof mealTypeColors] || mealTypeColors.breakfast}`
                            )}>
                                {meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}
                            </span>
                            <h3 className={cn(
                                'font-semibold text-gray-900 truncate',
                                compact ? 'text-sm' : 'text-lg'
                            )}>
                                {meal.recipe.recipe_name}
                            </h3>
                        </div>
                    </div>

                    {!compact && (
                        <>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {meal.recipe.recipe_time_minutes} min
                                </span>
                                {meal.recipe.recipe_nutrient_set?.find(n => n.nutrient.name === 'Calories') && (
                                    <span className="font-medium">
                                        {meal.recipe.recipe_nutrient_set.find(n => n.nutrient.name === 'Calories')?.nutrient_quantity} cal
                                    </span>
                                )}
                            </div>

                            <div className="flex gap-2">
                                {onView && (
                                    <button
                                        onClick={onView}
                                        className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        View Recipe
                                    </button>
                                )}
                                {onComplete && !meal.completed && (
                                    <button
                                        onClick={onComplete}
                                        className="flex-1 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-colors"
                                    >
                                        Mark Complete
                                    </button>
                                )}
                                {meal.completed && (
                                    <div className="flex-1 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-lg text-center">
                                        ✓ Completed
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Card>
    );
}

function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}
