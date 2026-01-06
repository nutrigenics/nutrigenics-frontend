import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { SkeletonStatCard, SkeletonRecipeCard } from '@/components/ui/skeleton';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { Zap, ArrowRight, Utensils, Flame, ChevronRight } from 'lucide-react';
import { planService } from '@/services/plan.service';
import { recipeService } from '@/services/recipe.service';
import { TodaysPlanStatus } from '@/components/dashboard/TodaysPlanStatus';
import { PopularCuisines } from '@/components/dashboard/PopularCuisines';
import { HighNutrientRecipes } from '@/components/dashboard/HighNutrientRecipes';
import { TimeBasedRecipes } from '@/components/dashboard/TimeBasedRecipes';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import type { NutrientSummary, Patient, Recipe } from '@/types';

export default function DashboardPage() {
  const { profile } = useAuth();
  const [greeting, setGreeting] = useState('Welcome');
  const [currentDate, setCurrentDate] = useState('');
  const [nutrientIntake, setNutrientIntake] = useState<NutrientSummary | null>(null);
  const [recommendedRecipes, setRecommendedRecipes] = useState<Recipe[]>([]);
  const [popularRecipes, setPopularRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set greeting based on time of day
  useEffect(() => {
    const updateGreetingAndDate = () => {
      const now = new Date();
      const hour = now.getHours();

      if (hour < 12) setGreeting('Good Morning');
      else if (hour < 18) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');

      // Format date: "Today, 17 Dec 2024"
      const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
      setCurrentDate(`Today, ${now.toLocaleDateString('en-US', options)}`);
    };

    updateGreetingAndDate();
  }, []);

  // Fetch dashboard data from Django backend
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch today's meal plan and nutrient intake
      try {
        const planData = await planService.getMealPlan();
        if (planData && planData.nutrient_summary) {
          setNutrientIntake(planData.nutrient_summary);
        }
      } catch (err) {
        console.warn('Could not fetch meal plan:', err);
      }

      // Fetch all recipes
      try {
        const allRecipes = await recipeService.getAllRecipes();
        if (allRecipes && allRecipes.results) {
          setRecommendedRecipes(allRecipes.results.slice(0, 6));
          setPopularRecipes(allRecipes.results.slice(6, 12));
        }
      } catch (err) {
        console.error('Error fetching recipes:', err);
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state with skeleton
  if (isLoading) {
    return (
      <>
        {/* Skeleton Header */}
        <div className="w-full mb-8 p-8 bg-muted rounded-3xl animate-pulse">
          <div className="h-8 bg-muted-foreground/20 rounded-xl w-1/4 mb-4" />
          <div className="h-12 bg-muted-foreground/20 rounded-xl w-1/2 mb-2" />
        </div>

        {/* Skeleton Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>

        {/* Skeleton Recipe Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonRecipeCard key={i} />
          ))}
        </div>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Card className="p-10 text-center border-destructive/20 bg-destructive/5 rounded-3xl">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Connection Error</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">{error}</p>
          <Button onClick={fetchDashboardData} className="rounded-xl px-8 h-12">
            Try Again
          </Button>
        </Card>
      </>
    );
  }

  const userName = (profile as Patient)?.fname || 'there';

  return (
    <>
      {/* Hero Header */}
      <div className="w-full mb-8 px-2 relative overflow-hidden">
        <div className="relative flex flex-col md:flex-row-reverse items-start gap-2 z-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-fit flex items-center gap-2 mb-2"
          >
            <span className="text-muted-foreground text-sm font-medium flex items-center whitespace-nowrap gap-1">
              {currentDate}
            </span>
          </motion.div>

          <div className="w-full">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-foreground mb-2 tracking-tight"
            >
              {greeting}, <span className="text-foreground">{userName}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground px-1"
            >
              Track your meals and stay on target with your personalized plan.
            </motion.p>
          </div>
        </div>
      </div>

      {/* Today's Meals Section */}
      <div className="mb-12">
        <TodaysPlanStatus onRefresh={fetchDashboardData} />
      </div>

      {nutrientIntake ? (
        <Card className="p-10 border-border shadow-sm hover:shadow-md transition-shadow bg-card rounded-3xl mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Today's Nutrition</h2>
              <p className="text-muted-foreground">Based on your tracked meals</p>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-foreground bg-muted px-3 py-1 rounded-full">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>{nutrientIntake.Calories?.toFixed(0) || 0} kcal consumed</span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center">
            {/* Calories */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <CircularProgress
                  value={nutrientIntake.Calories || 0}
                  max={(profile as Patient)?.nutrient_targets?.calories || 2000}
                  color="text-orange-500"
                  size="lg"
                >
                  <Flame className="w-6 h-6 text-orange-500 fill-orange-500/20" />
                </CircularProgress>
              </div>
              <div className="text-center">
                <p className="font-bold text-foreground">Calories</p>
                <p className="text-sm text-muted-foreground">
                  {nutrientIntake.Calories?.toFixed(0)} / {(profile as Patient)?.nutrient_targets?.calories || 2000}
                </p>
              </div>
            </div>

            {/* Protein */}
            <div className="flex flex-col items-center gap-3">
              <CircularProgress
                value={nutrientIntake.Protein || 0}
                max={(profile as Patient)?.nutrient_targets?.protein || 150}
                color="text-blue-500"
                size="lg"
              />
              <div className="text-center">
                <p className="font-bold text-foreground">Protein</p>
                <p className="text-sm text-muted-foreground">
                  {nutrientIntake.Protein?.toFixed(0)} / {(profile as Patient)?.nutrient_targets?.protein || 150}g
                </p>
              </div>
            </div>

            {/* Carbs */}
            <div className="flex flex-col items-center gap-3">
              <CircularProgress
                value={nutrientIntake.Carbohydrates || 0}
                max={(profile as Patient)?.nutrient_targets?.carbs || 300}
                color="text-amber-500"
                size="lg"
              />
              <div className="text-center">
                <p className="font-bold text-foreground">Carbs</p>
                <p className="text-sm text-muted-foreground">
                  {nutrientIntake.Carbohydrates?.toFixed(0)} / {(profile as Patient)?.nutrient_targets?.carbs || 300}g
                </p>
              </div>
            </div>

            {/* Fat */}
            <div className="flex flex-col items-center gap-3">
              <CircularProgress
                value={nutrientIntake.Fat || 0}
                max={(profile as Patient)?.nutrient_targets?.fat || 70}
                color="text-indigo-500"
                size="lg"
              />
              <div className="text-center">
                <p className="font-bold text-foreground">Fat</p>
                <p className="text-sm text-muted-foreground">
                  {nutrientIntake.Fat?.toFixed(0)} / {(profile as Patient)?.nutrient_targets?.fat || 70}g
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Link to="/analytics">
              <Button variant="ghost" className="p-6 text-muted-foreground hover:text-foreground cursor-pointer">
                View Detailed Analytics <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="w-full rounded-3xl p-10 md:p-14 border-border shadow-sm mb-12 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-left">
            <span className="px-4 py-2 bg-muted rounded-full text-xs font-bold text-muted-foreground uppercase tracking-wider mb-6 inline-block">Let's Get Started</span>
            <h2 className="text-4xl font-bold text-foreground mb-4 tracking-tight">Craft Your Perfect <br className="hidden md:block" />Daily Plan</h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed max-w-md">Kickstart your wellness journey with nutritious meals. Select from our curated options to build your day.</p>
            <Link to="/plan">
              <Button size="lg" className="h-14 px-8 rounded-2xl font-bold text-lg shadow-xl">
                Start Planning <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
          <div className="flex-1 w-full flex justify-center">
            <div className="w-full max-w-sm aspect-square bg-muted rounded-3xl relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                <Utensils className="w-24 h-24" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 opacity-50" />
            </div>
          </div>
        </Card>
      )}

      {/* Time-Based Recipes - personalized by time of day */}
      <TimeBasedRecipes />

      {/* Popular Cuisines */}
      <PopularCuisines />

      {/* High Nutrient Recipes */}
      <HighNutrientRecipes />

      {/* Recommended & Trending Sections */}
      {[
        { title: "Recommended for You", subtitle: "Based on your nutritional goals", data: recommendedRecipes, link: "/recipes" },
        { title: "Trending Now", subtitle: "Community favorites this week", data: popularRecipes, link: "/recipes" }
      ].map((section, idx) => (
        section.data.length > 0 && (
          <div key={idx} className="mb-12 last:mb-0">
            <div className="flex items-end justify-between mb-8 px-2">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">{section.title}</h2>
                <p className="text-muted-foreground font-medium">{section.subtitle}</p>
              </div>
              <Link to={section.link}>
                <Button variant="ghost" className="text-foreground hover:bg-muted font-medium rounded-xl">
                  View All <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {section.data.slice(0, 6).map(recipe => (
                <RecipeCard
                  key={recipe.pk}
                  recipe={recipe}
                />
              ))}
            </div>
          </div>
        )
      ))}
    </>
  );
}

