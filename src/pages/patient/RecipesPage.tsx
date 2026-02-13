import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// MainLayout removed
// import { MainLayout } from '@/layouts/MainLayout';
import { ChefHat, Globe, Leaf, Clock, Beef, Wheat, Flame, Dumbbell, Egg, Zap, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { recipeService } from '@/services/recipe.service';
import { getCategoryIcon } from '@/utils/categoryIcons';

const NUTRIENTS = [
  { id: 'Protein', label: 'High Protein', icon: Beef },
  { id: 'Fiber', label: 'High Fiber', icon: Leaf },
  { id: 'Carbohydrates', label: 'High Carbs', icon: Wheat },
  { id: 'Fat', label: 'Low Fat', icon: Flame },
  { id: 'Iron', label: 'High Iron', icon: Dumbbell },
  { id: 'Calcium', label: 'High Calcium', icon: Egg },
  { id: 'Vitamin C', label: 'High Vit C', icon: Zap },
  { id: 'Vitamin A', label: 'High Vit A', icon: Eye }
];

export default function RecipesPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState<{ cuisines: string[], diets: string[], meal_types: string[] }>({
    cuisines: [],
    diets: [],
    meal_types: []
  });

  useEffect(() => {
    fetchFilters();
  }, []);

  const fetchFilters = async () => {
    try {
      const filters = await recipeService.getFilters();
      setFilterOptions(filters);
    } catch (error) {
      console.error('Error fetching filters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <>
        {/* Skeleton Header */}
        <div className="w-full mb-8 p-8 bg-muted rounded-[2rem] animate-pulse">
          <div className="h-8 bg-muted-foreground/20 rounded w-1/4 mb-4" />
          <div className="h-4 bg-muted-foreground/20 rounded w-1/2" />
        </div>
      </>
    );
  }

  // Helper component to render icon safely
  const FilterIcon = ({ type, name, className }: { type: 'cuisine' | 'diet' | 'meal', name: string, className?: string }) => {
    const Icon = getCategoryIcon(type, name);
    return <Icon className={className} />;
  };

  return (
    <>
      {/* Hero Header */}
      <div className="w-full mb-16 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-4"
        >
          <div className="p-1.5 bg-muted rounded-md">
            <ChefHat className="w-5 h-5 text-foreground" />
          </div>
          <span className="text-muted-foreground text-xs font-medium tracking-wide">Culinary Collection</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl md:text-4xl font-semibold text-foreground mb-4 tracking-tight"
        >
          Browse Categories
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-base text-muted-foreground max-w-lg"
        >
          Select a category below to explore recipes tailored to your taste and nutritional needs.
        </motion.p>
      </div>


      {/* Visible Filter Categories */}
      <div className="space-y-16 pb-16 px-1">

        {/* High Nutrient Recipes Section */}
        {/* Nutrient Focus */}
        <div className="space-y-4 px-1">
          <div className="flex items-center gap-3 mb-6 px-1">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <Beef className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Nutrient Focus</h2>
              <p className="text-sm text-muted-foreground">Recipes optimized for your health goals</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {NUTRIENTS.map((nutrient) => (
              <button
                key={nutrient.id}
                onClick={() => navigate(`/recipes/results?nutrient=${encodeURIComponent(nutrient.id)}`)}
                className="group flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-lg font-medium transition-all duration-200 border text-center bg-card text-card-foreground border-border hover:border-primary hover:text-primary hover:shadow-sm cursor-pointer"
              >
                <nutrient.icon className="w-6 h-6 transition-transform group-hover:scale-110 text-muted-foreground group-hover:text-primary" />
                <span className="text-sm">{nutrient.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Meal Types */}
        {filterOptions.meal_types.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6 px-1">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Meal Types</h2>
                <p className="text-sm text-muted-foreground">Find the perfect meal for any time of day</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {filterOptions.meal_types.map((type) => (
                <button
                  key={type}
                  onClick={() => navigate(`/recipes/results?meal_type=${encodeURIComponent(type)}`)}
                  className="group flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-lg font-medium transition-all duration-200 border text-center bg-card text-card-foreground border-border hover:border-primary hover:text-primary hover:shadow-sm cursor-pointer"
                >
                  <FilterIcon
                    type="meal"
                    name={type}
                    className="w-6 h-6 transition-transform group-hover:scale-110 text-muted-foreground group-hover:text-primary"
                  />
                  <span className="text-sm">{type}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Diets */}
        {filterOptions.diets.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6 px-1">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Dietary Preferences</h2>
                <p className="text-sm text-muted-foreground">Recipes that fit your lifestyle</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {filterOptions.diets.map((diet) => (
                <button
                  key={diet}
                  onClick={() => navigate(`/recipes/results?diet=${encodeURIComponent(diet)}`)}
                  className="group flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-lg font-medium transition-all duration-200 border text-center bg-card text-card-foreground border-border hover:border-primary hover:text-primary hover:shadow-sm cursor-pointer"
                >
                  <FilterIcon
                    type="diet"
                    name={diet}
                    className="w-6 h-6 transition-transform group-hover:scale-110 text-muted-foreground group-hover:text-primary"
                  />
                  <span className="text-sm">{diet}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cuisines */}
        {filterOptions.cuisines.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6 px-1">
              <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Global Cuisines</h2>
                <p className="text-sm text-muted-foreground">Explore flavors from around the world</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {filterOptions.cuisines.map((cuisine) => (
                <button
                  key={cuisine}
                  onClick={() => navigate(`/recipes/results?cuisine=${encodeURIComponent(cuisine)}`)}
                  className="group flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-lg font-medium transition-all duration-200 border text-center bg-card text-card-foreground border-border hover:border-primary hover:text-primary hover:shadow-sm cursor-pointer"
                >
                  <FilterIcon
                    type="cuisine"
                    name={cuisine}
                    className="w-6 h-6 transition-transform group-hover:scale-110 text-muted-foreground group-hover:text-primary"
                  />
                  <span className="text-sm">{cuisine}</span>
                </button>
              ))}
            </div>
          </div>
        )}




      </div>


    </>
  );
}
