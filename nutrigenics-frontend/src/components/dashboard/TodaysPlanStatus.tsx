import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { planService } from '@/services/plan.service';
import { motion } from 'framer-motion';
import {
    Sun,
    Coffee,
    Moon,
    Plus,
    ChevronRight,
    Check,
    UtensilsCrossed,
    RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MealPlan, Recipe } from '@/types';

interface TodaysMealPlans {
    breakfast: MealPlan[];
    lunch: MealPlan[];
    dinner: MealPlan[];
}

interface TodaysPlanStatusProps {
    onRefresh?: () => void;
}

const mealConfig = {
    breakfast: {
        label: 'Breakfast',
        icon: Coffee,
        gradient: 'from-amber-400/20 to-orange-400/20',
        bgColor: 'bg-amber-50 dark:bg-amber-950/30',
        accentColor: 'text-amber-600 dark:text-amber-400',
        borderColor: 'border-amber-200 dark:border-amber-800',
        time: '6:00 AM - 10:00 AM'
    },
    lunch: {
        label: 'Lunch',
        icon: Sun,
        gradient: 'from-emerald-400/20 to-teal-400/20',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
        accentColor: 'text-emerald-600 dark:text-emerald-400',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
        time: '12:00 PM - 2:00 PM'
    },
    dinner: {
        label: 'Dinner',
        icon: Moon,
        gradient: 'from-indigo-400/20 to-purple-400/20',
        bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
        accentColor: 'text-indigo-600 dark:text-indigo-400',
        borderColor: 'border-indigo-200 dark:border-indigo-800',
        time: '6:00 PM - 9:00 PM'
    }
};

const MealCard = ({
    mealType,
    mealPlans,
    isLoading
}: {
    mealType: 'breakfast' | 'lunch' | 'dinner';
    mealPlans: MealPlan[];
    isLoading: boolean;
}) => {
    const config = mealConfig[mealType];
    const Icon = config.icon;
    const hasMeals = mealPlans && mealPlans.length > 0;

    if (isLoading) {
        return (
            <Card className={cn(
                "relative overflow-hidden p-4 border transition-all rounded-3xl",
                config.borderColor
            )}>
                <div className="flex items-center gap-3 mb-3">
                    <Skeleton className="w-10 h-10 rounded-2xl" />
                    <div className="flex-1">
                        <Skeleton className="h-5 w-24 mb-1 rounded-xl" />
                        <Skeleton className="h-3 w-32 rounded-xl" />
                    </div>
                </div>
                <Skeleton className="h-32 w-full rounded-2xl" />
            </Card>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card className={cn(
                "relative overflow-hidden transition-all duration-300 hover:shadow-lg group rounded-3xl h-full flex flex-col",
                config.borderColor,
                "border"
            )}>
                {/* Gradient Background */}
                <div className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-50",
                    config.gradient
                )} />

                {/* Header */}
                <div className="relative p-4 pb-3 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                config.bgColor
                            )}>
                                <Icon className={cn("w-5 h-5", config.accentColor)} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">{config.label}</h3>
                                <p className="text-xs text-muted-foreground">{config.time}</p>
                            </div>
                        </div>
                        {hasMeals && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                <Check className="w-3 h-3 mr-1" />
                                {mealPlans.length} Planned
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="relative px-4 pb-4 flex-1 flex flex-col">
                    {hasMeals ? (
                        <div className="space-y-3">
                            {mealPlans.slice(0, 3).map((plan) => {
                                const recipe = plan.recipe as Recipe | undefined;
                                const name = recipe?.recipe_name || plan.name || plan.custom_name || 'Custom Meal';
                                const image = recipe?.recipe_image || plan.image;

                                return (
                                    <Link key={plan.id} to={plan.recipe_id ? `/recipes/${plan.recipe_id}` : '#'} className="block">
                                        <div className="flex gap-3 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                            {/* Image */}
                                            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-border/50 bg-muted">
                                                {image ? (
                                                    <img
                                                        src={image.startsWith('http')
                                                            ? image
                                                            : `${import.meta.env.VITE_API_URL || 'http://localhost:8003'}${image}`}
                                                        alt={name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <UtensilsCrossed className="w-6 h-6 text-muted-foreground/50" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <h4 className="font-medium text-foreground line-clamp-2 text-sm">
                                                    {name}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-muted-foreground font-medium">
                                                        {plan.calories?.toFixed(0)} kcal
                                                    </span>
                                                    {plan.protein && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-border" />
                                                            <span className="text-xs text-muted-foreground">
                                                                {plan.protein?.toFixed(0)}g pro
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                            {mealPlans.length > 3 && (
                                <div className="text-center pb-1">
                                    <span className="text-xs text-muted-foreground font-medium">
                                        +{mealPlans.length - 3} more items
                                    </span>
                                </div>
                            )}

                            <Link to={`/recipes?meal=${mealType}`} className="block mt-2">
                                <Button variant="ghost" size="sm" className="w-full rounded-xl text-xs h-8 border border-border/50 hover:bg-muted text-muted-foreground">
                                    <Plus className="w-3 h-3 mr-1" /> Add Another
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-4 text-center flex-1 min-h-[120px]">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center mb-3",
                                config.bgColor
                            )}>
                                <UtensilsCrossed className={cn("w-6 h-6", config.accentColor, "opacity-50")} />
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                                No {config.label.toLowerCase()} planned yet
                            </p>
                            <Link to={`/recipes?meal=${mealType}`}>
                                <Button variant="outline" size="sm" className="rounded-full h-8 text-xs">
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Recipe
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </Card>
        </motion.div>
    );
};

export function TodaysPlanStatus({ onRefresh }: TodaysPlanStatusProps) {
    const [todaysMeals, setTodaysMeals] = useState<TodaysMealPlans>({
        breakfast: [],
        lunch: [],
        dinner: []
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchTodaysPlan();
    }, []);

    const fetchTodaysPlan = async () => {
        try {
            setIsLoading(true);
            const today = new Date().toISOString().split('T')[0];
            const planData = await planService.getMealPlan(today);

            // Organize plans by meal type
            const meals: TodaysMealPlans = {
                breakfast: [],
                lunch: [],
                dinner: []
            };

            if (planData && planData.plans) {
                planData.plans.forEach((plan: MealPlan) => {
                    const mealType = plan.meal_type?.toLowerCase() as keyof TodaysMealPlans;
                    if (mealType && mealType in meals) {
                        meals[mealType].push(plan);
                    }
                });
            }

            setTodaysMeals(meals);
        } catch (error) {
            console.error('Error fetching today\'s plan:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const completedCount =
        (todaysMeals.breakfast.length > 0 ? 1 : 0) +
        (todaysMeals.lunch.length > 0 ? 1 : 0) +
        (todaysMeals.dinner.length > 0 ? 1 : 0);

    const handleRefresh = () => {
        fetchTodaysPlan();
        onRefresh?.();
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Today's Meals</h2>
                        <p className="text-sm text-muted-foreground">
                            {completedCount}/3 meal times planned
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={handleRefresh}
                        disabled={isLoading}
                    >
                        <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                    </Button>
                </div>
                <Link to="/plan">
                    <Button variant="ghost" size="sm" className="rounded-full">
                        View All <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </Link>
            </div>

            {/* Meal Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MealCard
                    mealType="breakfast"
                    mealPlans={todaysMeals.breakfast}
                    isLoading={isLoading}
                />
                <MealCard
                    mealType="lunch"
                    mealPlans={todaysMeals.lunch}
                    isLoading={isLoading}
                />
                <MealCard
                    mealType="dinner"
                    mealPlans={todaysMeals.dinner}
                    isLoading={isLoading}
                />
            </div>

            {/* Quick Action */}
            {completedCount < 3 && !isLoading && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center pt-2"
                >
                    <Link to="/recipes">
                        <Button variant="outline" className="rounded-full">
                            <Plus className="w-4 h-4 mr-2" />
                            Browse Recipes to Complete Your Day
                        </Button>
                    </Link>
                </motion.div>
            )}
        </div>
    );
}

export default TodaysPlanStatus;
