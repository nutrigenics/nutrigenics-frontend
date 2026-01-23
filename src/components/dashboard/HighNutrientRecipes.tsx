import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { recipeService } from '@/services/recipe.service';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Flame, Leaf, Beef, Wheat, UtensilsCrossed, Info } from 'lucide-react';
import type { Recipe } from '@/types';

const NUTRIENTS = [
    { id: 'Protein', label: 'High Protein', icon: Beef },
    { id: 'Fiber', label: 'High Fiber', icon: Leaf },
    { id: 'Carbohydrates', label: 'High Carbs', icon: Wheat },
    { id: 'Fat', label: 'Low Fat', icon: Flame }
];

export function HighNutrientRecipes() {
    const [selectedNutrient, setSelectedNutrient] = useState('Protein');
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [usedFallback, setUsedFallback] = useState(false);

    useEffect(() => {
        fetchRecipes(selectedNutrient);
    }, [selectedNutrient]);

    const fetchRecipes = async (nutrient: string) => {
        try {
            setIsLoading(true);
            const result = await recipeService.getHighNutrientRecipes(nutrient, 3);
            setRecipes(result.recipes || []);
            setUsedFallback(result.usedFallback || false);
        } catch (error) {
            console.error('Error fetching nutrient recipes:', error);
            setRecipes([]);
            setUsedFallback(false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mb-12">
            <div className="flex items-end justify-between mb-6 px-2">
                <div>
                    <h2 className="text-2xl font-bold text-foreground mb-1">Nutrient Focus</h2>
                    <p className="text-muted-foreground font-medium">Recipes optimized for your health goals</p>
                </div>
                <Link to="/recipes">
                    <Button variant="ghost" className="text-foreground hover:bg-muted font-medium rounded-xl">
                        View All <ChevronRight className="ml-1 w-4 h-4" />
                    </Button>
                </Link>
            </div>

            <Tabs
                defaultValue="Protein"
                value={selectedNutrient}
                onValueChange={setSelectedNutrient}
                className="w-full"
            >
                <TabsList className="mb-6 bg-muted/50 p-1.5 h-auto flex-wrap justify-start rounded-2xl">
                    {NUTRIENTS.map((nutrient) => (
                        <TabsTrigger
                            key={nutrient.id}
                            value={nutrient.id}
                            className="px-4 py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                        >
                            <div className="flex items-center gap-2">
                                <nutrient.icon className="w-4 h-4" />
                                <span>{nutrient.label}</span>
                            </div>
                        </TabsTrigger>
                    ))}
                </TabsList>

                <div className="min-h-[300px]">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
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
                                key={selectedNutrient}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="grid grid-cols-1 md:grid-cols-3 gap-6"
                            >
                                {recipes.length > 0 ? (
                                    <>
                                        {usedFallback && (
                                            <Alert className="col-span-3 mb-6 border-primary/50 bg-primary/5">
                                                <Info className="w-4 h-4 text-primary" />
                                                <AlertDescription className="text-sm text-foreground">
                                                    Limited high {selectedNutrient.toLowerCase()} recipes available. Showing popular recipes instead.
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
                                    <div className="col-span-3 text-center py-16 bg-muted/30 rounded-3xl">
                                        <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                                        <p className="text-muted-foreground font-medium">No high {selectedNutrient.toLowerCase()} recipes found.</p>
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
