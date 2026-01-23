import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Calendar, Plus, Trash2, Search, Utensils, Egg, Coffee, Moon, ChefHat, ArrowUpRight, History } from 'lucide-react';
import { planService } from '@/services/plan.service';
import { recipeService } from '@/services/recipe.service';
import { motion } from 'framer-motion';
import { PortionDialog, type PortionData } from '@/components/plan/PortionDialog';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { cn } from '@/lib/utils';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { useAuth } from '@/context/AuthContext';
import { getNutrientTargets, getNutrientColor } from '@/utils/nutrition';
import type { MealPlan, Recipe, Patient } from '@/types';

export default function MealPlanPage() {
  const [date, setDate] = useState(new Date());
  const [todayPlans, setTodayPlans] = useState<MealPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [historyData, setHistoryData] = useState<{ [key: string]: MealPlan[] }>({});

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('Breakfast');
  const [dialogMode, setDialogMode] = useState<'add_item' | 'new_section'>('add_item');

  // Portion Dialog State
  const [isPortionDialogOpen, setIsPortionDialogOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | undefined>(undefined);
  const [pendingCustomEntry, setPendingCustomEntry] = useState<any>(null);

  // Search/Custom Entry State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [customEntry, setCustomEntry] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
    sugar: '',
    sodium: '',
    cholesterol: '',
    saturated_fat: '',
    trans_fat: ''
  });

  const [newSectionName, setNewSectionName] = useState('');

  // Date Formatting
  const formattedDate = date.toISOString().split('T')[0];
  const displayDate = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const isToday = new Date().toDateString() === date.toDateString();

  const { profile } = useAuth();

  useEffect(() => {
    fetchTodayPlan();
    fetchHistory();
  }, [date]);

  useEffect(() => {
    if (dialogMode === 'add_item' && isDialogOpen) {
      searchRecipes();
    }
  }, [searchQuery, isDialogOpen, dialogMode]);

  const fetchTodayPlan = async () => {
    try {
      setIsLoading(true);
      const data = await planService.getMealPlan(formattedDate);
      setTodayPlans(data.plans || []);
    } catch (error) {
      console.error('Error fetching plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);

      const startDateStr = start.toISOString().split('T')[0];
      const endDateStr = end.toISOString().split('T')[0];

      const plans = await planService.getHistory(startDateStr, endDateStr);

      const grouped: { [key: string]: MealPlan[] } = {};
      plans.forEach(plan => {
        const planDate = plan.date;
        if (!grouped[planDate]) grouped[planDate] = [];
        grouped[planDate].push(plan);
      });
      setHistoryData(grouped);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const getDayTotals = (plans: MealPlan[]) => {
    return plans.reduce((acc, plan) => {
      // Backend now provides these directly via PlanListSerializer
      const cals = plan.calories || 0;
      const pro = plan.protein || 0;
      const carb = plan.carbs || 0;
      const fat = plan.fat || 0;

      return {
        calories: acc.calories + (Number(cals) || 0),
        protein: acc.protein + (Number(pro) || 0),
        carbs: acc.carbs + (Number(carb) || 0),
        fat: acc.fat + (Number(fat) || 0)
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const searchRecipes = async () => {
    try {
      setIsSearching(true);
      const response = await recipeService.getAllRecipes({ page: 1, search: searchQuery });
      setSearchResults(response.results || []);
    } catch (error) {
      console.error('Error searching recipes:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const initiateAddRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setPendingCustomEntry(null);
    setIsPortionDialogOpen(true);
  };

  const initiateAddCustom = () => {
    setPendingCustomEntry(customEntry);
    setSelectedRecipe(undefined);
    setIsPortionDialogOpen(true);
  };

  const handlePortionConfirm = async (portionData: PortionData) => {
    try {
      const payload: any = {
        date: formattedDate,
        meal_type: activeSection.toLowerCase(),
        portion_quantity: portionData.quantity,
        portion_unit: portionData.unit
      };

      const q = portionData.quantity;

      if (selectedRecipe) {
        payload.recipe_id = selectedRecipe.pk; // Ensure PK is used
        // Calculate nutrients from recipe to ensure they are saved with portion adjustments
        if (selectedRecipe.recipe_nutrient_set) {
          const getNutrient = (name: string) => {
            const n = selectedRecipe.recipe_nutrient_set?.find(n => n.nutrient.name === name);
            return n ? parseFloat(String(n.nutrient_quantity)) : 0;
          };
          payload.calories = getNutrient('Calories') * q;
          payload.protein = getNutrient('Protein') * q;
          payload.carbs = getNutrient('Carbohydrates') * q;
          payload.fat = getNutrient('Fat') * q;
          payload.fiber = getNutrient('Fiber') * q;
          payload.sugar = getNutrient('Sugar') * q;
          payload.sodium = getNutrient('Sodium') * q;
          payload.cholesterol = getNutrient('Cholesterol') * q;
          payload.saturated_fat = getNutrient('Saturated Fat') * q;
          payload.trans_fat = getNutrient('Trans-fat') * q;
        }
      } else if (pendingCustomEntry) {
        payload.custom_name = pendingCustomEntry.name;
        payload.calories = (parseFloat(pendingCustomEntry.calories) || 0) * q;
        payload.protein = (parseFloat(pendingCustomEntry.protein) || 0) * q;
        payload.carbs = (parseFloat(pendingCustomEntry.carbs) || 0) * q;
        payload.fat = (parseFloat(pendingCustomEntry.fat) || 0) * q;
        payload.fiber = (parseFloat(pendingCustomEntry.fiber) || 0) * q;
        payload.sugar = (parseFloat(pendingCustomEntry.sugar) || 0) * q;
        payload.sodium = (parseFloat(pendingCustomEntry.sodium) || 0) * q;
        payload.cholesterol = (parseFloat(pendingCustomEntry.cholesterol) || 0) * q;
        payload.saturated_fat = (parseFloat(pendingCustomEntry.saturated_fat) || 0) * q;
        payload.trans_fat = (parseFloat(pendingCustomEntry.trans_fat) || 0) * q;
      }

      // console.log('Adding to plan:', payload);
      await planService.addToPlan(payload);
      await fetchTodayPlan();

      setIsDialogOpen(false);
      setCustomEntry({
        name: '', calories: '', protein: '', carbs: '', fat: '',
        fiber: '', sugar: '', sodium: '', cholesterol: '', saturated_fat: '', trans_fat: ''
      });
      setSearchQuery('');
      setSelectedRecipe(undefined);
      setPendingCustomEntry(null);
    } catch (error) {
      console.error('Error adding to plan:', error);
    }
  };

  const removePlan = async (id: number) => {
    try {
      await planService.removeFromPlan(id);
      await fetchTodayPlan();
    } catch (error) {
      console.error('Error removing plan:', error);
    }
  };

  const getSectionIcon = (section: string) => {
    switch (section.toLowerCase()) {
      case 'breakfast': return <Egg className="w-5 h-5 text-yellow-500" />;
      case 'lunch': return <Utensils className="w-5 h-5 text-orange-500" />;
      case 'dinner': return <Moon className="w-5 h-5 text-indigo-500" />;
      default: return <Coffee className="w-5 h-5 text-muted-foreground" />;
    }
  };

  // Prepare Data for Render
  const todayTotals = getDayTotals(todayPlans);
  const defaultSections = ['Breakfast', 'Lunch', 'Dinner'];
  const usedSections = Array.from(new Set(todayPlans.map(p => p.meal_type))).filter(s => !!s);
  const dynamicSections = usedSections.filter(s => !defaultSections.some(ds => ds.toLowerCase() === s.toLowerCase()));
  const allSections = [...defaultSections, ...dynamicSections];

  // History List
  const historyDates = Object.keys(historyData)
    .filter(d => d !== formattedDate)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <>
      <div className="flex flex-col gap-8 pb-20">

        {/* TOP SECTION: Main Day View */}
        <div className="flex flex-col gap-6">

          {/* Header & Date Nav */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {isToday ? "Today's Plan" : "Past Meal Plan"}
              </h1>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4" /> {displayDate}
              </p>
            </div>
            {!isToday && (
              <Button onClick={() => setDate(new Date())} variant="outline" className="rounded-xl">
                Back to Today
              </Button>
            )}
          </div>

          {/* Nutrition Overview Card */}
          <Card className="rounded-2xl p-6 shadow-sm border-border bg-card">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {(() => {
                const getProgressColor = (val: number, max: number, nutrientName: string) => {
                  return val > max ? 'text-destructive' : getNutrientColor(nutrientName);
                };

                const t = getNutrientTargets(profile as Patient);

                return (
                  <>
                    {/* Calories - Main Focus */}
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="relative">
                        <CircularProgress
                          value={todayTotals.calories}
                          max={t.calories}
                          size="md"
                          showPercentage={false}
                          showTotal={true}
                          color={getProgressColor(todayTotals.calories, t.calories, 'calories')}
                        >
                        </CircularProgress>
                      </div>
                      <span className="text- font-bold text-muted-foreground uppercase tracking-wider">Calories</span>
                    </div>

                    {/* Protein */}
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CircularProgress
                        value={todayTotals.protein}
                        max={t.protein}
                        size="md"
                        showPercentage={false}
                        showTotal={true}
                        color={getProgressColor(todayTotals.protein, t.protein, 'protein')}
                      />
                      <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Protein</span>
                    </div>

                    {/* Carbs */}
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CircularProgress
                        value={todayTotals.carbs}
                        max={t.carbs}
                        size="md"
                        showPercentage={false}
                        showTotal={true}
                        color={getProgressColor(todayTotals.carbs, t.carbs, 'carbs')}
                      />
                      <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Carbohydrates</span>
                    </div>

                    {/* Fat */}
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CircularProgress
                        value={todayTotals.fat}
                        max={t.fat}
                        size="md"
                        showPercentage={false}
                        showTotal={true}
                        color={getProgressColor(todayTotals.fat, t.fat, 'fat')}
                      />
                      <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Fat</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </Card>

          {/* Meal Logic (Timeline) */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="py-20 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-muted-foreground">Loading nutrition data...</p>
              </div>
            ) : (
              <>
                {allSections.map((section, index) => {
                  const items = todayPlans.filter(p => p.meal_type.toLowerCase() === section.toLowerCase());

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      key={section}
                      className="relative pl-8"
                    >
                      {/* Timeline Line */}
                      <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-border last:bottom-auto last:h-full" />

                      {/* Timeline Dot */}
                      <div className={cn(
                        "absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-background flex items-center justify-center",
                        items.length > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        {/* Inner Dot if needed, or just color */}
                      </div>

                      <div className="bg-card rounded-lg border border-border p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold flex items-center gap-2">
                            {getSectionIcon(section)} {section}
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:bg-primary/10 rounded-full font-bold h-8"
                            onClick={() => {
                              setActiveSection(section);
                              setDialogMode('add_item');
                              setIsDialogOpen(true);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-1" /> Add
                          </Button>
                        </div>

                        {items.length > 0 ? (
                          <div className="grid gap-3">
                            {items.map(item => (
                              <div key={item.id} className="flex items-center gap-4 p-3 rounded-2xl bg-muted/30 border border-transparent hover:border-border transition-colors group">
                                <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden shrink-0">
                                  {item.image ? (
                                    <img
                                      src={item.image.startsWith('http')
                                        ? item.image
                                        : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${item.image}`}
                                      className="w-full h-full object-cover"
                                      alt={item.name}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                                      <ChefHat className="w-6 h-6" />
                                    </div>
                                  )}
                                </div>
                                <Link
                                  to={item.recipe_id ? `/recipes/${item.recipe_id}` : '#'}
                                  className={`flex-1 min-w-0 ${!item.recipe_id && 'pointer-events-none'}`}
                                >
                                  <h4 className="font-bold text-foreground text-sm truncate hover:text-primary transition-colors">{item.name || item.custom_name}</h4>
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                                    <span className="font-medium text-foreground">{item.calories?.toFixed(0) || 0} kcal</span>
                                    <span className="w-1 h-1 rounded-full bg-border" />
                                    <span>{item.protein?.toFixed(1) || 0}g Protein</span>
                                    <span className="w-1 h-1 rounded-full bg-border" />
                                    <span>{item.carbs?.toFixed(1) || 0}g Carbohydrates</span>
                                    <span className="w-1 h-1 rounded-full bg-border" />
                                    <span>{item.fat?.toFixed(1) || 0}g Fat</span>
                                  </div>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => removePlan(item.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground italic pl-2">
                            No meals logged
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {/* Add New Section */}
                <div className="relative pl-8 pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setDialogMode('new_section');
                      setIsDialogOpen(true);
                    }}
                    className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Custom Section
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* BOTTOM SECTION: History - MOVED TO BOTTOM */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex items-center gap-2 text-foreground font-bold text-2xl mb-6">
            <History className="w-6 h-6 text-primary" /> History
          </div>

          <div className="space-y-4">
            {historyDates.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-sm">
                No history yet. Start logging meals!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {historyDates.map(dateStr => {
                  const dayPlans = historyData[dateStr];
                  const totals = getDayTotals(dayPlans);
                  const dateObj = new Date(dateStr);

                  return (
                    <div
                      key={dateStr}
                      onClick={() => setDate(dateObj)}
                      className="group p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm font-bold text-muted-foreground uppercase">{dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                          <p className="text-2xl font-black text-foreground mt-1">{totals.calories.toFixed(0)} <span className="text-sm font-normal text-muted-foreground">kcal</span></p>
                        </div>
                        <div className="p-2 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                          <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>

                      {/* Mini Thumbnails */}
                      <div className="flex items-center gap-2 overflow-hidden">
                        {dayPlans.slice(0, 5).map((p, i) => (
                          <div key={i} className="w-10 h-10 rounded-xl bg-muted overflow-hidden shrink-0 border border-border/50">
                            {p.image ? (
                              <img
                                src={p.image.startsWith('http')
                                  ? p.image
                                  : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${p.image}`}
                                className="w-full h-full object-cover"
                                alt=""
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-muted-foreground/10">
                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                        ))}
                        {dayPlans.length > 5 && (
                          <div className="w-10 h-10 rounded-xl bg-muted border border-border/50 flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                            +{dayPlans.length - 5}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* REUSED: Add Item Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background">
          <div className="h-[80vh] flex flex-col">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="text-2xl font-bold">
                {dialogMode === 'add_item' ? `Add to ${activeSection}` : 'Create New Section'}
              </DialogTitle>
              <DialogDescription>
                {dialogMode === 'add_item' ? 'Choose a recipe or log a custom meal.' : 'Add a custom meal category to your day.'}
              </DialogDescription>
            </DialogHeader>

            {dialogMode === 'add_item' ? (
              <Tabs defaultValue="catalog" className="flex-1 flex flex-col min-h-0">
                <div className="px-6 mb-4">
                  <TabsList className="w-full grid grid-cols-2 p-1 bg-muted rounded-xl">
                    <TabsTrigger value="catalog" className="rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">Catalog</TabsTrigger>
                    <TabsTrigger value="custom" className="rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">Custom</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="catalog" className="flex-1 flex flex-col min-h-0 mt-0">
                  <div className="px-6 mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search recipes..."
                        className="pl-9 bg-muted border-border rounded-xl h-11"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex-1 px-6 pb-6 overflow-y-auto min-h-0">
                    <div className="space-y-3">
                      {isSearching ? (
                        <div className="text-center py-10 text-muted-foreground">Searching...</div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map(recipe => (
                          <RecipeCard
                            key={recipe.pk}
                            recipe={recipe}
                            variant="compact"
                            onClick={() => initiateAddRecipe(recipe)}
                            actions={
                              <Button size="icon" variant="secondary" className="rounded-full h-8 w-8 shrink-0">
                                <Plus className="w-4 h-4" />
                              </Button>
                            }
                          />
                        ))
                      ) : (
                        <div className="text-center py-10 text-muted-foreground">No recipes found</div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="custom" className="flex-1 px-6 pb-6 mt-0 overflow-y-auto min-h-0">
                  <div className="space-y-6 pt-2">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Meal Name</Label>
                        <Input
                          placeholder="e.g., Oatmeal with Berries"
                          className="h-12 rounded-xl bg-muted border-border"
                          value={customEntry.name}
                          onChange={e => setCustomEntry({ ...customEntry, name: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Calories per Portion (kcal)</Label>
                          <Input type="number" placeholder="0" className="h-12 rounded-xl bg-muted border-border" value={customEntry.calories} onChange={e => setCustomEntry({ ...customEntry, calories: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Protein (g)</Label>
                          <Input type="number" placeholder="0" className="h-12 rounded-xl bg-muted border-border" value={customEntry.protein} onChange={e => setCustomEntry({ ...customEntry, protein: e.target.value })} />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Carbohydrates (g)</Label>
                          <Input type="number" placeholder="0" className="h-12 rounded-xl bg-muted border-border" value={customEntry.carbs} onChange={e => setCustomEntry({ ...customEntry, carbs: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Fat (g)</Label>
                          <Input type="number" placeholder="0" className="h-12 rounded-xl bg-muted border-border" value={customEntry.fat} onChange={e => setCustomEntry({ ...customEntry, fat: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Fiber (g)</Label>
                          <Input type="number" placeholder="0" className="h-12 rounded-xl bg-muted border-border" value={customEntry.fiber} onChange={e => setCustomEntry({ ...customEntry, fiber: e.target.value })} />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Sugar (g)</Label>
                          <Input type="number" placeholder="0" className="h-12 rounded-xl bg-muted border-border" value={customEntry.sugar} onChange={e => setCustomEntry({ ...customEntry, sugar: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Sodium (mg)</Label>
                          <Input type="number" placeholder="0" className="h-12 rounded-xl bg-muted border-border" value={customEntry.sodium} onChange={e => setCustomEntry({ ...customEntry, sodium: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Cholesterol (mg)</Label>
                          <Input type="number" placeholder="0" className="h-12 rounded-xl bg-muted border-border" value={customEntry.cholesterol} onChange={e => setCustomEntry({ ...customEntry, cholesterol: e.target.value })} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Saturated Fat (g)</Label>
                          <Input type="number" placeholder="0" className="h-12 rounded-xl bg-muted border-border" value={customEntry.saturated_fat} onChange={e => setCustomEntry({ ...customEntry, saturated_fat: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Trans-fat (g)</Label>
                          <Input type="number" placeholder="0" className="h-12 rounded-xl bg-muted border-border" value={customEntry.trans_fat} onChange={e => setCustomEntry({ ...customEntry, trans_fat: e.target.value })} />
                        </div>
                      </div>
                    </div>

                    <Button className="w-full h-12 rounded-xl font-bold mt-4" onClick={() => initiateAddCustom()}>
                      Continue to Portion
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              // New Section Form
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Section Name</Label>
                  <Input
                    placeholder="e.g., Late Night Snack, Pre-Workout"
                    className="h-12 rounded-xl bg-muted border-border"
                    value={newSectionName}
                    onChange={e => setNewSectionName(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full h-12 rounded-xl font-bold"
                  onClick={() => {
                    if (newSectionName.trim()) {
                      setActiveSection(newSectionName);
                      setDialogMode('add_item');
                    }
                  }}
                >
                  Continue to Add Items
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Portion Dialog - REUSED */}
      <PortionDialog
        isOpen={isPortionDialogOpen}
        onClose={() => setIsPortionDialogOpen(false)}
        onConfirm={handlePortionConfirm}
        recipe={selectedRecipe}
        customMealName={pendingCustomEntry?.name}
      />
    </>
  );
}
