import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { Skeleton } from '@/components/ui/skeleton';
import { recipeService } from '@/services/recipe.service';
import { motion } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    Sun,
    Coffee,
    Moon,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Recipe } from '@/types';

interface MealCarouselProps {
    onBookmark?: (recipeId: number) => void;
    onLike?: (recipeId: number) => void;
}

const getMealTypeConfig = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 11) {
        return {
            type: 'breakfast',
            label: 'Breakfast',
            icon: Coffee,
            greeting: 'Start your day right!',
            gradient: 'from-amber-500 to-orange-500',
            bgGradient: 'from-amber-50 to-orange-50  '
        };
    } else if (hour >= 11 && hour < 16) {
        return {
            type: 'lunch',
            label: 'Lunch',
            icon: Sun,
            greeting: 'Power through your afternoon!',
            gradient: 'from-emerald-500 to-teal-500',
            bgGradient: 'from-emerald-50 to-teal-50  '
        };
    } else {
        return {
            type: 'dinner',
            label: 'Dinner',
            icon: Moon,
            greeting: 'End your day deliciously!',
            gradient: 'from-indigo-500 to-purple-500',
            bgGradient: 'from-indigo-50 to-purple-50  '
        };
    }
};

export function MealCarousel({ onBookmark, onLike }: MealCarouselProps) {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const mealConfig = getMealTypeConfig();
    const Icon = mealConfig.icon;

    useEffect(() => {
        fetchRecipes();
    }, []);

    const fetchRecipes = async () => {
        try {
            setIsLoading(true);
            const result = await recipeService.getRecipesByMealType(mealConfig.type);
            setRecipes(result.data?.slice(0, 12) || result.results?.slice(0, 12) || []);
        } catch (error) {
            console.error('Error fetching meal type recipes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const checkScrollButtons = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 340; // Card width + gap
            const newScrollLeft = scrollContainerRef.current.scrollLeft +
                (direction === 'left' ? -scrollAmount : scrollAmount);

            scrollContainerRef.current.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            });

            // Update button states after scroll animation
            setTimeout(checkScrollButtons, 300);
        }
    };

    useEffect(() => {
        checkScrollButtons();
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', checkScrollButtons);
            return () => container.removeEventListener('scroll', checkScrollButtons);
        }
    }, [recipes]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <div>
                        <Skeleton className="h-6 w-48 mb-1" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <div className="flex gap-6 overflow-hidden">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="w-80 h-64 rounded-2xl flex-shrink-0" />
                    ))}
                </div>
            </div>
        );
    }

    if (recipes.length === 0) {
        return null;
    }

    return (
        <div className="relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                        `bg-gradient-to-br ${mealConfig.gradient}`
                    )}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold text-foreground">
                                {mealConfig.label} Ideas
                            </h2>
                            <Sparkles className="w-5 h-5 text-amber-500" />
                        </div>
                        <p className="text-muted-foreground">{mealConfig.greeting}</p>
                    </div>
                </div>

                {/* Navigation & View All */}
                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-2 mr-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-full border-border"
                            onClick={() => scroll('left')}
                            disabled={!canScrollLeft}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-full border-border"
                            onClick={() => scroll('right')}
                            disabled={!canScrollRight}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                    <Link to={`/recipes?meal=${mealConfig.type}`}>
                        <Button variant="ghost" size="sm" className="rounded-full">
                            View All <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Carousel Container */}
            <div className="relative">
                {/* Gradient Overlays for scroll indication */}
                {canScrollLeft && (
                    <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                )}
                {canScrollRight && (
                    <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
                )}

                {/* Scrollable Container */}
                <div
                    ref={scrollContainerRef}
                    className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
                    style={{ scrollSnapType: 'x mandatory' }}
                >
                    {recipes.map((recipe, index) => (
                        <motion.div
                            key={recipe.pk || recipe.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                            className="flex-shrink-0"
                            style={{ scrollSnapAlign: 'start' }}
                        >
                            <div className="w-80">
                                <RecipeCard
                                    recipe={recipe}
                                    onBookmark={onBookmark}
                                    onLike={onLike}
                                />
                            </div>
                        </motion.div>
                    ))}

                    {/* View More Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: recipes.length * 0.05, duration: 0.3 }}
                        className="flex-shrink-0"
                        style={{ scrollSnapAlign: 'start' }}
                    >
                        <Link to={`/recipes?meal=${mealConfig.type}`}>
                            <Card className={cn(
                                "w-80 h-full min-h-[280px] flex flex-col items-center justify-center gap-4 border-2 border-dashed cursor-pointer",
                                "hover:border-primary hover:bg-muted/50 transition-all duration-300",
                                "bg-gradient-to-br opacity-80",
                                mealConfig.bgGradient
                            )}>
                                <div className={cn(
                                    "w-16 h-16 rounded-2xl flex items-center justify-center",
                                    `bg-gradient-to-br ${mealConfig.gradient}`
                                )}>
                                    <ChevronRight className="w-8 h-8 text-white" />
                                </div>
                                <div className="text-center">
                                    <p className="font-semibold text-foreground">View More</p>
                                    <p className="text-sm text-muted-foreground">{mealConfig.label} Recipes</p>
                                </div>
                            </Card>
                        </Link>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default MealCarousel;
