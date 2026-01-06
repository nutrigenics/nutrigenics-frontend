import { useState } from 'react';
// MainLayout removed
// import { MainLayout } from '@/layouts/MainLayout';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, SlidersHorizontal, Sparkles, X, Timer, Utensils } from 'lucide-react';
import { recipeService } from '@/services/recipe.service';
import type { Recipe } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchRecipesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Advanced filters
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [minTime, setMinTime] = useState('');
  const [maxTime, setMaxTime] = useState('');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!searchQuery.trim()) return;

    try {
      setIsLoading(true);
      setHasSearched(true);
      const results = await recipeService.searchRecipes(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching recipes:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdvancedFilter = async () => {
    try {
      setIsLoading(true);
      const filters = {
        cuisine: cuisines,
        min_time: minTime ? parseInt(minTime) : undefined,
        max_time: maxTime ? parseInt(maxTime) : undefined,
      };
      const results = await recipeService.filterRecipes(filters);
      setSearchResults(results);
      setHasSearched(true);
      setShowFilters(false);
    } catch (error) {
      console.error('Error filtering recipes:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const clearFilters = () => {
    setSearchQuery('');
    setCuisines([]);
    setMinTime('');
    setMaxTime('');
    setSearchResults([]);
    setHasSearched(false);
  }

  return (
    <>
      {/* Hero Header */}
      <Card className="w-full mb-8 p-8 md:p-10 rounded-[2.5rem] relative overflow-hidden shadow-sm border-border">
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-4"
          >
            <div className="p-1.5 bg-muted rounded-lg">
              <Search className="w-5 h-5 text-foreground" />
            </div>
            <span className="text-muted-foreground text-xs font-bold uppercase tracking-wide">Explore</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-foreground mb-2 tracking-tight"
          >
            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted-foreground">Flavor</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-lg mb-8"
          >
            Search for specific recipes, ingredients, or explore by cuisine and time.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSearch}
            className="flex flex-col md:flex-row gap-4 max-w-2xl"
          >
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-5 h-5" />
              <Input
                type="text"
                placeholder="Search recipes, ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 bg-muted/50 border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl text-lg"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="h-14 px-8 rounded-2xl font-bold shadow-lg"
              >
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
              <Button
                type="button"
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className={`h-14 px-4 rounded-2xl border-2 font-bold transition-all ${showFilters ? '' : 'border-border hover:bg-muted'}`}
              >
                <SlidersHorizontal className="w-5 h-5" />
              </Button>
            </div>
          </motion.form>
        </div>

        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl opacity-60 translate-y-1/2 -translate-x-1/3" />
      </Card>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-8"
          >
            <Card className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 md:p-8 border-border rounded-[2rem] shadow-lg">
              <div>
                <Label htmlFor="minTime" className="text-foreground font-bold mb-2 block">Min Time (mins)</Label>
                <div className="relative">
                  <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="minTime"
                    type="number"
                    value={minTime}
                    onChange={(e) => setMinTime(e.target.value)}
                    placeholder="0"
                    className="pl-9 h-12 rounded-xl bg-muted/50 border-border"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="maxTime" className="text-foreground font-bold mb-2 block">Max Time (mins)</Label>
                <div className="relative">
                  <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="maxTime"
                    type="number"
                    value={maxTime}
                    onChange={(e) => setMaxTime(e.target.value)}
                    placeholder="120"
                    className="pl-9 h-12 rounded-xl bg-muted/50 border-border"
                  />
                </div>
              </div>

              <div className="lg:col-span-2">
                <Label className="text-foreground font-bold mb-2 block">Cuisines</Label>
                <div className="relative">
                  <Utensils className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g., Italian, Asian (comma-separated)"
                    onChange={(e) => setCuisines(e.target.value.split(',').map(c => c.trim()).filter(Boolean))}
                    className="pl-9 h-12 rounded-xl bg-muted/50 border-border"
                  />
                </div>
              </div>

              <div className="lg:col-span-4 flex justify-between items-center pt-4 border-t border-border mt-2">
                <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl">
                  <X className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
                <Button onClick={handleAdvancedFilter} disabled={isLoading} className="font-bold rounded-xl px-6 h-12 shadow-lg">
                  Apply Filters
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Results */}
      {hasSearched ? (
        <div>
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                {searchResults.length > 0 ? 'Search Results' : 'No Results Found'}
              </h2>
            </div>
            <p className="text-muted-foreground text-sm font-medium bg-muted px-3 py-1 rounded-full">
              {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
            </p>
          </div>

          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <div className="text-center py-20 bg-muted/30 rounded-[3rem] border-2 border-dashed border-border">
              <div className="w-20 h-20 bg-card rounded-full shadow-sm flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No recipes found</h3>
              <p className="text-muted-foreground max-w-xs mx-auto mb-8">
                Try adjusting your search terms or filters to find what you're looking for.
              </p>
              <Button
                onClick={clearFilters}
                className="rounded-xl px-8 h-12 font-bold shadow-lg"
              >
                Clear Search
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-24">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Start your culinary journey</h2>
          <p className="text-muted-foreground">Enter keywords above to find delicious recipes.</p>
        </div>
      )}
    </>
  );
}
