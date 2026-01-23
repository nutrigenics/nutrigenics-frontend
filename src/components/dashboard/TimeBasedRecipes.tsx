import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { recipeService } from '@/services/recipe.service';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight,
    Sun,
    Sunrise,
    Moon,
    Coffee,
    UtensilsCrossed,
    Info
} from 'lucide-react';
import type { Recipe } from '@/types';

const MEAL_TYPES = [
    { id: 'Breakfast', label: 'Breakfast', icon: Sunrise },
    { id: 'Lunch', label: 'Lunch', icon: Sun },
    { id: 'Dinner', label: 'Dinner', icon: Moon },
    { id: 'Snack', label: 'Snack', icon: Coffee },
];

function getMealTypeFromTime(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'Breakfast';
    if (hour >= 11 && hour < 15) return 'Lunch';
    if (hour >= 15 && hour < 21) return 'Dinner';
    return 'Snack';
}

function getGreeting(): { text: string; subtext: string } {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
        return {
            text: 'Good morning!',
            subtext: 'Start your day with a nutritious breakfast'
        };
    }
    if (hour >= 12 && hour < 17) {
        return {
            text: 'Good afternoon!',
            subtext: 'Time for a satisfying lunch'
        };
    }
    if (hour >= 17 && hour < 21) {
        return {
            text: 'Good evening!',
            subtext: 'Wind down with a healthy dinner'
        };
    }
    return {
        text: 'Late night?',
        subtext: 'How about a light snack?'
    };
}

export function TimeBasedRecipes() {
    const defaultMealType = useMemo(() => getMealTypeFromTime(), []);
    const greeting = useMemo(() => getGreeting(), []);

    const [selectedMealType, setSelectedMealType] = useState(defaultMealType);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [usedFallback, setUsedFallback] = useState(false);

    useEffect(() => {
        fetchRecipes(selectedMealType);
    }, [selectedMealType]);

    const fetchRecipes = async (mealType: string) => {
        try {
            setIsLoading(true);
            const result = await recipeService.getTimeBasedRecipes(mealType, 4);
            setRecipes(result.recipes || []);
            setUsedFallback(result.usedFallback || false);
        } catch (error) {
            console.error('Error fetching time-based recipes:', error);
            setRecipes([]);
            setUsedFallback(false);
        } finally {
            setIsLoading(false);
        }
    };

    const SelectedIcon = MEAL_TYPES.find(m => m.id === selectedMealType)?.icon || Sun;

    return (
        <div className="mb-12">
            <div className="flex items-end justify-between mb-6 px-2">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <SelectedIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground mb-1">
                            {greeting.text}
                        </h2>
                        <p className="text-muted-foreground font-medium">
                            {greeting.subtext}
                        </p>
                    </div>
                </div>
                <Link to="/recipes">
                    <Button variant="ghost" className="text-foreground hover:bg-muted font-medium">
                        View All <ChevronRight className="ml-1 w-4 h-4" />
                    </Button>
                </Link>
            </div>

            <Tabs
                value={selectedMealType}
                onValueChange={setSelectedMealType}
                className="w-full"
            >
                <TabsList className="mb-6 bg-white p-2 h-auto flex-wrap justify-start rounded-full">
                    {MEAL_TYPES.map((meal) => (
                        <TabsTrigger
                            key={meal.id}
                            value={meal.id}
                            className="px-6 py-2.5 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                        >
                            <div className="flex items-center gap-2">
                                <meal.icon className="w-4 h-4" />
                                <span>{meal.label}</span>
                            </div>
                        </TabsTrigger>
                    ))}
                </TabsList>

                <div className="min-h-[300px]">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="space-y-3">
                                    <Skeleton className="h-48 w-full rounded-3xl" />
                                    <Skeleton className="h-4 w-3/4 rounded-xl" />
                                    <Skeleton className="h-4 w-1/2 rounded-xl" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedMealType}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                            >
                                {recipes.length > 0 ? (
                                    <>
                                        {usedFallback && (
                                            <Alert className="col-span-4 mb-6 border-primary/50 bg-primary/5">
                                                <Info className="w-4 h-4 text-primary" />
                                                <AlertDescription className="text-sm text-foreground">
                                                    Limited {selectedMealType.toLowerCase()} recipes with your preferences. Showing popular recipes instead.
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                        {recipes.map((recipe) => (
                                            <RecipeCard
                                                key={recipe.id}
                                                recipe={recipe}

                                            />
                                        ))}
                                    </>
                                ) : (
                                    <div className="col-span-4 text-center py-16 bg-muted/30 rounded-3xl">
                                        <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                                        <p className="text-muted-foreground font-medium">
                                            No {selectedMealType.toLowerCase()} recipes found matching your preferences.
                                        </p>
                                        <Link to="/recipes" className="inline-block mt-4">
                                            <Button variant="outline" className="rounded-xl">
                                                Browse All Recipes
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </Tabs>
        </div>
    );
}
