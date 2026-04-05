import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { SkeletonStatCard, SkeletonRecipeCard } from '@/components/ui/skeleton';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { Zap, ArrowRight, Flame, ChevronRight, Sparkles } from 'lucide-react';
import { planService } from '@/services/plan.service';
import { recipeService } from '@/services/recipe.service';
import { TodaysPlanStatus } from '@/components/dashboard/TodaysPlanStatus';
import { PopularCuisines } from '@/components/dashboard/PopularCuisines';
import { HighNutrientRecipes } from '@/components/dashboard/HighNutrientRecipes';
import { TimeBasedRecipes } from '@/components/dashboard/TimeBasedRecipes';

import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import type { NutrientSummary, Patient, Recipe } from '@/types';
import { getNutrientTargets, getNutrientColor } from '@/utils/nutrition';

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
        if (profile) {
          localStorage.removeItem('is_guest_mode');
        }
        const today = new Date().toISOString().split('T')[0];
        const planData = await planService.getMealPlan(today);
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
        <div className="w-full mb-8 p-8 bg-muted rounded-2xl animate-pulse">
          <div className="h-8 bg-muted-foreground/20 rounded-lg w-1/4 mb-4" />
          <div className="h-12 bg-muted-foreground/20 rounded-lg w-1/2 mb-2" />
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
        <Card className="p-10 text-center border-destructive/20 bg-destructive/5 rounded-2xl">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Connection Error</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">{error}</p>
          <Button onClick={fetchDashboardData} className="rounded-lg px-8 h-12">
            Try Again
          </Button>
        </Card>
      </>
    );
  }

  const userName = (profile as Patient)?.fname || 'there';

  return (
    <>
      {/* Hero Header - Soft Clean Style */}
      <div className="w-full mb-8 relative">
        <div className="relative flex flex-col md:flex-row-reverse items-center justify-between gap-4 z-10 p-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-full shadow-soft-sm border border-slate-100"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-600 text-sm font-semibold tracking-tight">
              {currentDate}
            </span>
          </motion.div>

          <div className="w-full">
            <motion.h1
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 tracking-tight"
            >
              {greeting}, <span className="text-emerald-700">{userName}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-slate-500 font-medium text-lg"
            >
              Your daily wellness overview is ready.
            </motion.p>
          </div>
        </div>
      </div>

      {/* Quick Actions - Primary CTAs */}
      {/* <QuickActions /> */}

      {/* Today's Meals Section */}
      <div className="mb-12">
        <TodaysPlanStatus onRefresh={fetchDashboardData} />
      </div>

      {nutrientIntake ? (
        <Card className="p-8 border-slate-100 shadow-soft hover:shadow-soft-lg transition-all duration-300 bg-white rounded-xl mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Today's Nutrition</h2>
              <p className="text-slate-500 font-medium">Daily intake summary</p>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 shadow-sm">
              <Flame className="w-4 h-4 text-emerald-500 fill-emerald-500" />
              <span>{nutrientIntake.Calories?.toFixed(0) || 0} kcal consumed</span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center">
            {/* Helper to determine color */}
            {(() => {
              const getProgressColor = (val: number, max: number, nutrientName: string) => {
                return val > max ? 'text-destructive' : getNutrientColor(nutrientName);
              };

              // Targets
              const t = getNutrientTargets(profile as Patient);

              return (
                <>
                  {/* Calories */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <CircularProgress
                        value={nutrientIntake.Calories || 0}
                        max={t.calories}
                        color={getProgressColor(nutrientIntake.Calories || 0, t.calories, 'calories')}
                        size="lg"
                      >
                        <Flame className={`w-6 h-6 ${getProgressColor(nutrientIntake.Calories || 0, t.calories, 'calories')} fill-current/20`} />
                      </CircularProgress>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-slate-900">Calories</p>
                      <p className="text-sm text-slate-500 font-medium">
                        {nutrientIntake.Calories?.toFixed(0)} / {t.calories}
                      </p>
                    </div>
                  </div>

                  {/* Protein */}
                  <div className="flex flex-col items-center gap-3">
                    <CircularProgress
                      value={nutrientIntake.Protein || 0}
                      max={t.protein}
                      color={getProgressColor(nutrientIntake.Protein || 0, t.protein, 'protein')}
                      size="lg"
                    />
                    <div className="text-center">
                      <p className="font-bold text-slate-900">Protein</p>
                      <p className="text-sm text-slate-500 font-medium">
                        {nutrientIntake.Protein?.toFixed(0)} / {t.protein}g
                      </p>
                    </div>
                  </div>

                  {/* Carbs */}
                  <div className="flex flex-col items-center gap-3">
                    <CircularProgress
                      value={nutrientIntake.Carbohydrates || 0}
                      max={t.carbs}
                      color={getProgressColor(nutrientIntake.Carbohydrates || 0, t.carbs, 'carbs')}
                      size="lg"
                    />
                    <div className="text-center">
                      <p className="font-bold text-slate-900">Carbohydrates</p>
                      <p className="text-sm text-slate-500 font-medium">
                        {nutrientIntake.Carbohydrates?.toFixed(0)} / {t.carbs}g
                      </p>
                    </div>
                  </div>

                  {/* Fat */}
                  <div className="flex flex-col items-center gap-3">
                    <CircularProgress
                      value={nutrientIntake.Fat || 0}
                      max={t.fat}
                      color={getProgressColor(nutrientIntake.Fat || 0, t.fat, 'fat')}
                      size="lg"
                    />
                    <div className="text-center">
                      <p className="font-bold text-slate-900">Fat</p>
                      <p className="text-sm text-slate-500 font-medium">
                        {nutrientIntake.Fat?.toFixed(0)} / {t.fat}g
                      </p>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          <div className="mt-10 flex justify-center">
            <Link to="/analytics">
              <Button variant="ghost" className="rounded-full px-8 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50">
                View Detailed Analytics <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="w-full rounded-xl overflow-hidden border-slate-100 shadow-soft-lg mb-12 relative min-h-[400px] flex items-center bg-white">
          {/* Background Image / Cover */}
          <div className="absolute top-0 right-0 w-full lg:w-1/2 h-full z-0 overflow-hidden">
            <img
              src="/illustrations/premium-daily-plan.png"
              alt="Premium Daily Plan"
              className="w-full h-full object-cover opacity-90"
            />
            {/* Smooth Fade / Blur Mask */}
            <div className="absolute inset-0 bg-gradient-to-l from-white via-white/40 to-white/10 lg:via-white/30 lg:to-transparent" />
          </div>

          <div className="relative z-10 p-10 md:p-14 lg:p-16 flex flex-col items-center lg:items-start text-center lg:text-left max-w-2xl">
            <span className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full text-xs font-bold text-emerald-700 uppercase tracking-widest mb-6 border border-emerald-100 w-fit">
              <Sparkles className="w-3 h-3 fill-emerald-700" />
              Let's Get Started
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight leading-tight">
              Craft Your Perfect <br className="hidden md:block" />Daily Plan
            </h2>
            <p className="text-slate-500 text-base md:text-lg mb-8 leading-relaxed max-w-lg font-medium">
              Kickstart your wellness journey with nutritious meals. Select from our curated options to build your perfect day.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start w-full sm:w-auto">
              <Link to="/plan" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-14 px-8 rounded-full font-bold text-base shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all">
                  Start Planning <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/recipes" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full h-14 px-8 rounded-full font-medium text-base bg-white/50 backdrop-blur-md hover:bg-white border-slate-200 text-slate-700">
                  Browse Recipes
                </Button>
              </Link>
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
        { title: "Recommended for You", subtitle: "Based on your activity and saved preferences", data: recommendedRecipes, link: "/recipes" },
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
                <Button variant="ghost" className="text-foreground hover:bg-muted font-medium rounded-lg">
                  View All <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {section.data.slice(0, 6).map(recipe => (
                <RecipeCard
                  key={recipe.id}
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
