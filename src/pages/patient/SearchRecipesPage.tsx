import { useState, useEffect } from 'react';
// MainLayout removed
// import { MainLayout } from '@/layouts/MainLayout';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Search, SlidersHorizontal, Sparkles, Timer, Utensils, Info } from 'lucide-react';
import { recipeService } from '@/services/recipe.service';
import type { Recipe } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchRecipesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [recommendedRecipes, setRecommendedRecipes] = useState<Recipe[]>([]);
  const [recommendationsUsedFallback, setRecommendationsUsedFallback] = useState(false);
  const [recommendationMessage, setRecommendationMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Advanced filters
  const [filterOptions, setFilterOptions] = useState<{
    cuisines: string[];
    diets: string[];
    meal_types: string[];
  }>({ cuisines: [], diets: [], meal_types: [] });

  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [selectedMealTypes, setSelectedMealTypes] = useState<string[]>([]);

  const [minTime, setMinTime] = useState('');
  const [maxTime, setMaxTime] = useState('');

  // Stats state
  const [stats, setStats] = useState({ total: 0, time: 0 });

  type SearchOverrides = {
    cuisines?: string[];
    diets?: string[];
    mealTypes?: string[];
    minTime?: string;
    maxTime?: string;
    query?: string;
  };

  // Fetch filters and stats on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [filters, recipes, recommendations] = await Promise.all([
          recipeService.getFilters(),
          recipeService.getAllRecipes({ page: 1 }), // Get count
          recipeService.getRecommendations(4)
        ]);
        setFilterOptions(filters);
        setRecommendedRecipes(recommendations.recipes || []);
        setRecommendationsUsedFallback(recommendations.usedFallback || false);
        setRecommendationMessage(recommendations.message || null);
        setStats({
          total: recipes.count || 0,
          time: 15 // Mock average time or just static "15min avg"
        });
      } catch (error) {
        console.error("Failed to load initial data", error);
        setRecommendedRecipes([]);
        setRecommendationsUsedFallback(true);
        setRecommendationMessage('Recommendations are not available right now. You can still browse all recipes.');
      }
    }
    loadData();
  }, []);

  const handleBookmark = async (recipeId: number) => {
    try {
      await recipeService.bookmarkRecipe(recipeId);
    } catch (error) {
      console.error('Error bookmarking recipe:', error);
    }
  };

  const handleLike = async (recipeId: number) => {
    try {
      await recipeService.likeRecipe(recipeId);
    } catch (error) {
      console.error('Error liking recipe:', error);
    }
  };

  const handleSearch = async (e?: React.FormEvent, overrides: SearchOverrides = {}) => {
    if (e) e.preventDefault();

    try {
      setIsLoading(true);
      setHasSearched(true);

      const cuisines = overrides.cuisines ?? selectedCuisines;
      const diets = overrides.diets ?? selectedDiets;
      const mealTypes = overrides.mealTypes ?? selectedMealTypes;
      const selectedMinTime = overrides.minTime ?? minTime;
      const selectedMaxTime = overrides.maxTime ?? maxTime;
      const query = overrides.query ?? searchQuery;

      if (cuisines.length > 0 || diets.length > 0 || mealTypes.length > 0 || selectedMinTime || selectedMaxTime) {
        const results = await recipeService.filterRecipes({
          cuisine: cuisines,
          diet: diets,
          meal_types: mealTypes,
          min_time: selectedMinTime ? parseInt(selectedMinTime) : undefined,
          max_time: selectedMaxTime ? parseInt(selectedMaxTime) : undefined,
        });
        let finalResults = results;
        if (query.trim()) {
          const lowerQ = query.toLowerCase();
          finalResults = results.filter((r: Recipe) =>
            r?.recipe_name?.toLowerCase().includes(lowerQ)
          );
        }
        setSearchResults(finalResults);
      } else if (query.trim()) {
        const results = await recipeService.searchRecipes(query);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }

    } catch (error) {
      console.error('Error searching recipes:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdvancedFilter = () => {
    void handleSearch();
    setShowFilters(false);
  };

  const handleQuickMealType = (mealType: string) => {
    const nextMealTypes = [mealType];
    setSearchQuery('');
    setSelectedMealTypes(nextMealTypes);
    void handleSearch(undefined, { mealTypes: nextMealTypes, query: '' });
  };

  const toggleSelection = (list: string[], setList: (l: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCuisines([]);
    setSelectedDiets([]);
    setSelectedMealTypes([]);
    setMinTime('');
    setMaxTime('');
    setSearchResults([]);
    setHasSearched(false);
  }

  return (
    <div className="relative h-full overflow-hidden">

      <div className="relative z-10 mx-auto">

        {/* Full Width Header Split - Reduced Sizes */}
        <div className="flex flex-col lg:flex-row items-end justify-between gap-8 mb-6">

          {/* Left: Text Content */}
          <div className="flex-1 max-w-3xl">

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight mb-3 leading-tight"
            >
              Discover Recipes
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base text-slate-500 max-w-xl"
            >
              Search thousands of nutritionally balanced recipes tailored to your goals.
            </motion.p>
          </div>
        </div>

        {/* Right: Stats Grid - Minimal & Premium */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
        >
          <div className="flex flex-col items-center justify-center p-6 border bg-white rounded-xl">
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{stats.total || '0'}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase">Recipes</p>
          </div>
          <div className="flex flex-col items-center justify-center p-6 border bg-white rounded-xl">
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{filterOptions.cuisines.length || '0'}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase">Cuisines</p>
          </div>
          <div className="flex flex-col items-center justify-center p-6 border bg-white rounded-xl">
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{filterOptions.diets.length || '0'}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase">Diets</p>
          </div>
          <div className="flex flex-col items-center justify-center p-6 border bg-white rounded-xl">
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{filterOptions.meal_types.length || '0'}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase">Meal Types</p>
          </div>
        </motion.div>

        {/* Search Bar Container - Refined Height */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full relative z-20 mb-6"
        >
          <form onSubmit={handleSearch} className="relative group">
            <div className="relative h-16 flex items-center gap-3 bg-white px-2 py-2 rounded-full shadow-[0_2px_15px_rgb(0,0,0,0.04)] border border-slate-200 focus-within:border-emerald-500/50 focus-within:ring-4 focus-within:ring-emerald-500/5 transition-all">

              <div className="w-12 h-12 flex items-center justify-center rounded-full text-slate-400 bg-gray-100">
                <Search className="w-5 h-5" />
              </div>

              <Input
                type="text"
                placeholder="Search recipes, ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-full bg-transparent border-none text-base placeholder:text-slate-400 focus-visible:ring-0 px-0 font-medium text-slate-700"
              />

              {/* Filter Toggle */}
              <div className="flex items-center gap-2">
                <div className="h-6 w-px bg-slate-100 mx-1" />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`h-12 px-6 rounded-full text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all gap-2 text-sm font-medium ${showFilters ? 'bg-emerald-50 text-emerald-600' : ''}`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 px-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white transition-all font-medium text-sm"
                >
                  {isLoading ? '...' : 'Search'}
                </Button>
              </div>
            </div>
          </form>
        </motion.div>

        {/* Quick Suggestion Chips */}
        {!hasSearched && !showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap justify-center gap-2 mt-4 max-w-2xl mx-auto mb-12"
            >
              {(filterOptions.meal_types.length > 0 ? filterOptions.meal_types.slice(0, 5) : ['Breakfast', 'Lunch', 'Dinner', 'Snack']).map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleQuickMealType(tag)}
                  className="px-4 py-2 rounded-full bg-white border border-slate-100 text-xs font-medium text-slate-600 hover:border-emerald-200 hover:text-emerald-700 hover:bg-emerald-50 transition-all shadow-sm"
                >
                  {tag}
                </button>
              ))}
            </motion.div>

            {/* Recommended Recipes Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-12"
            >
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                <h2 className="text-xl font-bold text-slate-900">Recommended for You</h2>
              </div>

              {recommendationsUsedFallback && recommendationMessage && (
                <Alert className="mb-6 border-emerald-200 bg-emerald-50/60">
                  <Info className="w-4 h-4 text-emerald-700" />
                  <AlertDescription className="text-sm text-slate-700">
                    {recommendationMessage}
                  </AlertDescription>
                </Alert>
              )}

              {recommendedRecipes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {recommendedRecipes.map((recipe, index) => (
                    <motion.div
                      key={recipe.pk || recipe.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + (index * 0.1) }}
                    >
                      <RecipeCard
                        recipe={recipe}
                        onBookmark={handleBookmark}
                        onLike={handleLike}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/90 p-8 text-center">
                  <Utensils className="mx-auto mb-4 h-10 w-10 text-slate-300" />
                  <p className="text-base font-semibold text-slate-900">No recommended recipes yet.</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Save a few recipes or broaden your preferences, and this section will start personalizing.
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}

        {/* Expandable Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-8xl w-full h-full mx-auto overflow-hidden"
            >
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xl shadow-slate-200/50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

                  {/* Time Section */}
                  <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-6">
                    <Label className="text-xs font-bold text-slate-900 uppercase mb-3 block">Preparation Time</Label>
                    <div className="space-y-2.5">
                      <div className="relative">
                        <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input
                          type="number"
                          value={minTime}
                          onChange={(e) => setMinTime(e.target.value)}
                          placeholder="Min Minutes"
                          className="pl-8 h-9 rounded-lg bg-slate-50 border-slate-100 focus:bg-white text-xs focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                      <div className="relative">
                        <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input
                          type="number"
                          value={maxTime}
                          onChange={(e) => setMaxTime(e.target.value)}
                          placeholder="Max Minutes"
                          className="pl-8 h-9 rounded-lg bg-slate-50 border-slate-100 focus:bg-white text-xs focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Filter Lists */}
                  <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Meal Types */}
                    <div>
                      <Label className="text-xs font-bold text-slate-900 uppercase mb-2.5 flex items-center gap-2">
                        Meal Type
                      </Label>
                      <div className="flex flex-wrap gap-1.5 border p-2 rounded-lg">
                        {filterOptions.meal_types.length > 0 ? filterOptions.meal_types.map(type => (
                          <button
                            key={type}
                            onClick={() => toggleSelection(selectedMealTypes, setSelectedMealTypes, type)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${selectedMealTypes.includes(type)
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50'
                              }`}
                          >
                            {type}
                          </button>
                        )) : <span className="text-xs text-slate-400 italic">No meal types found</span>}
                      </div>
                    </div>

                    {/* Cuisines */}
                    <div>
                      <Label className="text-xs font-bold text-slate-900 uppercase mb-2.5 block">Cuisine</Label>
                      <div className="flex flex-wrap gap-1.5 border p-2 rounded-lg overflow-y-auto pr-1 custom-scrollbar">
                        {filterOptions.cuisines.length > 0 ? filterOptions.cuisines.map(cuisine => (
                          <button
                            key={cuisine}
                            onClick={() => toggleSelection(selectedCuisines, setSelectedCuisines, cuisine)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${selectedCuisines.includes(cuisine)
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50'
                              }`}
                          >
                            {cuisine}
                          </button>
                        )) : <span className="text-xs text-slate-400 italic">No cuisines found</span>}
                      </div>
                    </div>

                    {/* Diets */}
                    <div>
                      <Label className="text-xs font-bold text-slate-900 uppercase mb-2.5 block">Dietary</Label>
                      <div className="flex flex-wrap gap-1.5 border p-2 rounded-lg">
                        {filterOptions.diets.length > 0 ? filterOptions.diets.map(diet => (
                          <button
                            key={diet}
                            onClick={() => toggleSelection(selectedDiets, setSelectedDiets, diet)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${selectedDiets.includes(diet)
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50'
                              }`}
                          >
                            {diet}
                          </button>
                        )) : <span className="text-xs text-slate-400 italic">No diets found</span>}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-4">
                  <div className="flex gap-2">
                    {(selectedCuisines.length > 0 || selectedDiets.length > 0 || selectedMealTypes.length > 0 || minTime || maxTime) && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                        {selectedCuisines.length + selectedDiets.length + selectedMealTypes.length + (minTime ? 1 : 0) + (maxTime ? 1 : 0)} filters active
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={clearFilters} className="h-9 px-5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full text-xs">
                      Clear All
                    </Button>
                    <Button onClick={handleAdvancedFilter} disabled={isLoading} className="h-9 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold shadow-sm">
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Results Section */}
      <div className="container mx-auto px-4 md:px-8 pb-20">
        {hasSearched && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8"
          >
            <div className="flex items-end justify-between mb-8 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  Search Results
                  <span className="text-sm font-normal text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                    {searchResults.length}
                  </span>
                </h2>
              </div>
            </div>

            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                {searchResults.map((recipe, index) => (
                  <motion.div
                    key={recipe.pk}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <RecipeCard
                      recipe={recipe}
                      onBookmark={handleBookmark}
                      onLike={handleLike}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Utensils className="w-6 h-6 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No recipes found</h3>
                <p className="text-slate-500 mb-6 text-sm">We couldn't find any recipes matching your criteria.</p>
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="rounded-full border-slate-200 text-slate-600 hover:border-slate-300"
                >
                  Clear Search & Filters
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </div>

    </div>
  );
}
