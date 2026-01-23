import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
// MainLayout removed
// import { MainLayout } from '@/layouts/MainLayout';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChefHat, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { recipeService } from '@/services/recipe.service';
import type { Recipe } from '@/types';

export default function RecipeResultsPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const observer = useRef<IntersectionObserver | null>(null);
    const lastRecipeElementRef = useCallback((node: HTMLDivElement | null) => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoading, hasMore]);

    // Extract filter info for display
    const cuisine = searchParams.get('cuisine');
    const diet = searchParams.get('diet');
    const mealType = searchParams.get('meal_type');

    const getPageTitle = () => {
        if (cuisine) return `${cuisine} Cuisine`;
        if (diet) return `${diet} Recipes`;
        if (mealType) return `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Recipes`;
        return 'Recipe Results';
    };

    useEffect(() => {
        // Reset when filters change
        setRecipes([]);
        setPage(1);
        setHasMore(true);
    }, [cuisine, diet, mealType]);

    useEffect(() => {
        const fetchRecipes = async () => {
            try {
                setIsLoading(true);
                const params: any = { page };
                if (cuisine) params.cuisine = cuisine;
                if (diet) params.diet = diet;
                if (mealType) params.meal_type = mealType;

                const response = await recipeService.getAllRecipes(params);

                const newRecipes = response.results || response;

                if (response.results) {
                    setRecipes(prev => page === 1 ? newRecipes : [...prev, ...newRecipes]);
                    setHasMore(!!response.next);
                } else if (Array.isArray(response)) {
                    setRecipes(response);
                    setHasMore(false);
                }

            } catch (error) {
                console.error('Error fetching recipes:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecipes();
    }, [page, cuisine, diet, mealType]);

    const handleBookmark = async (recipeId: number) => {
        try {
            await recipeService.bookmarkRecipe(recipeId);
        } catch (error) {
            console.error('Bookmark error:', error);
        }
    };

    const handleLike = async (recipeId: number) => {
        try {
            await recipeService.likeRecipe(recipeId);
        } catch (error) {
            console.error('Like error:', error);
        }
    };

    return (
        <>
            <div className="mb-8">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/recipes')}
                    className="mb-4 pl-0 hover:bg-transparent hover:text-primary transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Categories
                </Button>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                        {getPageTitle()}
                    </h1>
                    <p className="text-muted-foreground">
                        Explore our collection of delicious {getPageTitle().toLowerCase()}.
                    </p>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map((recipe, index) => {
                    if (recipes.length === index + 1) {
                        return (
                            <div ref={lastRecipeElementRef} key={recipe.id || index}>
                                <RecipeCard recipe={recipe} onBookmark={handleBookmark} onLike={handleLike} />
                            </div>
                        );
                    } else {
                        return (
                            <motion.div
                                key={recipe.id || index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <RecipeCard recipe={recipe} onBookmark={handleBookmark} onLike={handleLike} />
                            </motion.div>
                        );
                    }
                })}
            </div >

            {isLoading && (
                <div className="py-10 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                    <p className="mt-2 text-muted-foreground text-sm">Loading more recipes...</p>
                </div>
            )
            }

            {
                !isLoading && recipes.length === 0 && (
                    <div className="text-center py-20 bg-muted/30 rounded-[3rem] border-2 border-dashed border-border">
                        <div className="w-20 h-20 bg-card rounded-full shadow-sm flex items-center justify-center mx-auto mb-6">
                            <ChefHat className="w-10 h-10 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">No recipes found</h3>
                        <p className="text-muted-foreground">Try selecting a different category.</p>
                    </div>
                )
            }

            {
                !hasMore && recipes.length > 0 && (
                    <div className="py-10 text-center text-muted-foreground text-sm">
                        You've reached the end of the list.
                    </div>
                )
            }
        </>
    );
}
