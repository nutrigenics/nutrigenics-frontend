import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    MessagesSquare, Bell, User, ChefHat,
    Activity, Utensils, Plus, Trash2, Search, Loader2, Settings, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { toast } from 'sonner';

import { dietitianDashboardService } from '@/services/dietitian-dashboard.service';
import apiClient from '@/services/api.client';
import { analyticsService, type NutrientStats, type ComplianceStats, type AdvancedStats, type WeightHistory, type DailyHistory, type MealDistribution } from '@/services/analytics.service';
import vitalSignsService, { type SymptomLog } from '@/services/vital-signs.service';
import { PatientChatDialog } from '@/components/chat/PatientChatDialog';
import { SendNotificationDialog } from '@/components/dietitian/SendNotificationDialog';
import { DietitianAnalyticsView } from '@/components/analytics/DietitianAnalyticsView';
import { AnalyticsKPICards } from '@/components/analytics/AnalyticsKPICards';
import { AnalyticsActivityLog } from '@/components/analytics/AnalyticsActivityLog';
import { DietitianNutrientLimits } from '@/components/dietitian/DietitianNutrientLimits';
import { cn } from '@/lib/utils';

import type { Patient, MealPlan, Recipe, Nutrient } from '@/types';

interface NutrientLimit {
    id: number;
    patient: number;
    dietitian: number;
    nutrient: number;
    nutrient_name?: string;
    nutrient_unit?: string;
    daily_limit: number;
    weekly_limit?: number;
    monthly_limit?: number;
    created_at: string;
    updated_at: string;
}

export default function DietitianPatientDetailsPage() {
    const { patientId } = useParams();
    const [patient, setPatient] = useState<Patient | null>(null);
    // --- State: UI ---
    const [activeTab, setActiveTab] = useState('analytics');
    const [isLoading, setIsLoading] = useState(true);

    // --- State: Nutrient Limits ---
    const [limits, setLimits] = useState<NutrientLimit[]>([]);
    const [nutrients, setNutrients] = useState<Nutrient[]>([]);

    // --- State: Meal Plans ---
    const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isMealDialogOpen, setIsMealDialogOpen] = useState(false);
    const [mealSearchQuery, setMealSearchQuery] = useState('');
    const [mealForm, setMealForm] = useState({
        recipe_id: '',
        meal_type: 'breakfast',
        date: new Date().toISOString().split('T')[0]
    });
    const [isSavingMeal, setIsSavingMeal] = useState(false);

    // --- State: Analytics ---
    const [stats, setStats] = useState<NutrientStats | null>(null);
    const [compliance, setCompliance] = useState<ComplianceStats | null>(null);
    const [advancedStats, setAdvancedStats] = useState<AdvancedStats | null>(null);
    const [weightHistory, setWeightHistory] = useState<WeightHistory | null>(null);
    const [dailyHistory, setDailyHistory] = useState<DailyHistory[]>([]);
    const [distribution, setDistribution] = useState<MealDistribution | null>(null);
    const [symptomHistory, setSymptomHistory] = useState<SymptomLog[]>([]);
    const [waterHistory, setWaterHistory] = useState<{ date: string; total_ml: number }[]>([]);
    const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');

    // --- State: Dialogs ---
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isNotifyOpen, setIsNotifyOpen] = useState(false);

    useEffect(() => {
        if (patientId) {
            fetchData();
        }
    }, [patientId, period]);

    const fetchData = async () => {
        try {
            setIsLoading(true);

            // 1. Fetch Patient Details
            try {
                const patientsData = await dietitianDashboardService.getPatients();
                const patientsList = Array.isArray(patientsData) ? patientsData : patientsData.results || [];
                const found = patientsList.find((p: any) => p.id === Number(patientId));
                setPatient(found || null);
            } catch (e) {
                console.error("Failed to fetch patient", e);
            }

            // 2. Fetch Nutrients Ref Data
            try {
                const refData = await apiClient.get('/api/v1/reference-data/');
                if (refData.data.nutrients && refData.data.nutrients.length > 0) {
                    setNutrients(refData.data.nutrients);
                }
            } catch (e) {
                // use fallback
            }

            // 3. Fetch Limits
            fetchLimits();

            // 4. Fetch Meal Plans & Recipes
            fetchMealPlansAndRecipes();

            // 5. Fetch Analytics
            try {
                const days = period === 'weekly' ? 7 : 30;
                const [statsData, complianceData, advData, weightData, historyData, distributionData, symptomData] = await Promise.all([
                    analyticsService.getPatientAnalytics(period, patientId),
                    analyticsService.getComplianceStats(patientId),
                    analyticsService.getAdvancedStats(patientId),
                    analyticsService.getWeightHistory(days, patientId),
                    analyticsService.getDailyHistory(180, patientId),
                    analyticsService.getMealDistribution(days, patientId),
                    vitalSignsService.getRecentSymptoms(patientId)
                ]);
                setStats(statsData);
                setCompliance(complianceData);
                setAdvancedStats(advData);
                setWeightHistory(weightData);
                setDailyHistory(historyData);
                setDistribution(distributionData);
                setSymptomHistory(symptomData);

                // Fetch water history separately (endpoint may not exist)
                try {
                    const waterData = await vitalSignsService.getWaterHistory(days, patientId);
                    setWaterHistory(waterData);
                } catch {
                    // Water history endpoint not available - chart will show "No data"
                    setWaterHistory([]);
                }
            } catch (e) {
                console.error("Failed to fetch analytics", e);
            }

        } catch (error) {
            console.error("Global fetch error", error);
        } finally {
            setIsLoading(false);
        }
    };



    const fetchLimits = async () => {
        try {
            const data = await dietitianDashboardService.getNutrientLimits(Number(patientId));
            setLimits(data.results || data || []);
        } catch (e) {
            console.error("Failed to fetch limits", e);
        }
    };

    const fetchMealPlansAndRecipes = async () => {
        try {
            const [plansData, recipesData] = await Promise.all([
                apiClient.get(`/api/v1/plans/`, { params: { patient_id: patientId } }),
                apiClient.get('/api/v1/recipes/', { params: { limit: 50 } })
            ]);
            setMealPlans(plansData.data.results || plansData.data || []);
            setRecipes(recipesData.data.results || recipesData.data || []);
        } catch (e) {
            console.error("Failed to fetch plans/recipes", e);
        }
    };



    // --- Logic: Meal Plans ---
    const handleAddMeal = () => {
        setMealForm({
            recipe_id: '',
            meal_type: 'breakfast',
            date: new Date().toISOString().split('T')[0]
        });
        setIsMealDialogOpen(true);
    };

    const handleSaveMeal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mealForm.recipe_id) return toast.error("Select a recipe");
        setIsSavingMeal(true);
        try {
            await apiClient.post('/api/v1/plans/', {
                user_id: Number(patientId),
                recipe_id: Number(mealForm.recipe_id),
                meal_type: mealForm.meal_type,
                date: mealForm.date
            });
            toast.success("Meal planned");
            setIsMealDialogOpen(false);
            fetchMealPlansAndRecipes(); // refresh plans
        } catch (e) {
            toast.error("Failed to add meal");
        } finally {
            setIsSavingMeal(false);
        }
    };

    const handleDeleteMeal = async (id: number) => {
        if (!confirm("Remove meal?")) return;
        try {
            await apiClient.delete(`/api/v1/plans/${id}/`);
            toast.success("Meal removed");
            fetchMealPlansAndRecipes();
        } catch (e) {
            toast.error("Failed to remove");
        }
    };

    const filteredRecipes = recipes.filter(r =>
        (r.recipe_name ?? '').toLowerCase().includes(mealSearchQuery.toLowerCase())
    );

    const mealsByDate = mealPlans.reduce((acc: Record<string, MealPlan[]>, meal) => {
        const date = meal.date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(meal);
        return acc;
    }, {});

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="animate-spin w-8 h-8 text-primary" />
            </div>
        );
    }

    // Calculate patient age and BMI
    const calculateAge = (dob: string) => {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const calculateBMI = (weight: number, height: number) => {
        const heightInMeters = height / 100;
        return (weight / (heightInMeters * heightInMeters)).toFixed(1);
    };

    return (
        <div className="max-w-9xl mx-auto space-y-6 pb-20 px-4">
            {/* Patient Header */}
            <div className="w-full mb-12">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 mb-10">
                    {/* Left: Avatar & Identity */}
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-emerald-500/30 ring-2 ring-white">
                            {patient?.fname?.[0]}{patient?.lname?.[0]}
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900">{patient?.fname} {patient?.lname}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                    <User className="w-3 h-3" /> {patient?.patient_id}
                                </span>
                                {patient?.email && (
                                    <span className="text-xs font-medium text-slate-500">{patient.email}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex gap-2">
                        <Button
                            onClick={() => setIsChatOpen(true)}
                            className="h-10 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold hover:from-emerald-600 hover:to-emerald-700 shadow-md"
                        >
                            <MessagesSquare className="w-4 h-4 mr-1.5" /> Chat
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setIsNotifyOpen(true)}
                            className="h-10 px-4 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50"
                        >
                            <Bell className="w-4 h-4 mr-1.5" /> Notify
                        </Button>
                    </div>
                </div>
                {/* Center: Key Stats */}
                <div className="w-full flex items-center gap-4">
                    <div className="w-full text-center bg-white rounded-xl p-4 border border-slate-200">
                        <div className="text-xl font-black text-slate-900">
                            {(patient?.date_of_birth || (patient as any)?.dob || (patient as any)?.user?.date_of_birth)
                                ? calculateAge(patient?.date_of_birth || (patient as any)?.dob || (patient as any)?.user?.date_of_birth)
                                : '--'}
                        </div>
                        <div className="text-xs font-bold uppercase text-slate-500 mt-0.5 tracking-wide">Years Old</div>
                    </div>
                    <div className="w-full text-center bg-white rounded-xl p-4 border border-slate-200">
                        <div className="text-xl font-black text-slate-900 capitalize">{patient?.gender || '--'}</div>
                        <div className="text-xs font-bold uppercase text-slate-500 mt-0.5 tracking-wide">Sex</div>
                    </div>
                    <div className="w-full text-center bg-white rounded-xl p-4 border border-slate-200">
                        <div className="text-xl font-black text-slate-900">
                            {patient?.weight && patient?.height ? calculateBMI(patient.weight, patient.height) : '--'}
                        </div>
                        <div className="text-xs font-bold uppercase text-slate-500 mt-0.5 tracking-wide">BMI</div>
                    </div>
                </div>
            </div>

            {/* Main Content Tabs - Modern Design */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full grid grid-cols-3 gap-2 h-16 p-2 bg-white border border-slate-200 rounded-full mb-12">
                    <TabsTrigger
                        value="analytics"
                        className="py-3 rounded-full font-bold text-slate-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:outline-2 data-[state=active]:outline-emerald-500 outline-offset-4 data-[state=inactive]:hover:bg-gray-100 data-[state=inactive]:hover:text-slate-600 transition-all"
                    >
                        <Activity className="w-5 h-5 mr-2" /> Analytics
                    </TabsTrigger>
                    <TabsTrigger
                        value="limits"
                        className="py-3 rounded-full font-bold text-slate-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:outline-2 data-[state=active]:outline-emerald-500 outline-offset-4 data-[state=inactive]:hover:bg-gray-100 data-[state=inactive]:hover:text-slate-600 transition-all"
                    >
                        <Settings className="w-5 h-5 mr-2" /> Limits
                    </TabsTrigger>
                    <TabsTrigger
                        value="meal-plan"
                        className="py-3 rounded-full font-bold text-slate-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:outline-2 data-[state=active]:outline-emerald-500 outline-offset-4 data-[state=inactive]:hover:bg-gray-100 data-[state=inactive]:hover:text-slate-600 transition-all"
                    >
                        <Utensils className="w-5 h-5 mr-2" /> Meal Plans
                    </TabsTrigger>
                </TabsList>

                {/* --- ANALYTICS TAB --- */}
                <TabsContent value="analytics" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* KPI Cards */}
                    {patient && (
                        <div>
                            <div className="mb-4">
                                <h2 className="text-lg font-bold text-slate-900">Key Metrics</h2>
                                <p className="text-sm text-slate-500 mt-0.5">Patient performance overview</p>
                            </div>
                            <AnalyticsKPICards
                                patient={patient}
                                stats={stats}
                                compliance={compliance}
                                advancedStats={advancedStats}
                                weightHistory={weightHistory}
                                days={period === 'weekly' ? 7 : 30}
                            />
                        </div>
                    )}

                    {/* Analytics Charts */}
                    {patient && (
                        <DietitianAnalyticsView
                            currentPatient={patient}
                            stats={stats}
                            advancedStats={advancedStats}
                            weightHistory={weightHistory}
                            distribution={distribution}
                            symptomHistory={symptomHistory}
                            waterHistory={waterHistory}
                            period={period}
                            setPeriod={setPeriod}
                        />
                    )}

                    {/* Activity Log */}
                    <div>
                        <div className="mb-4">
                            <h2 className="text-lg font-bold text-slate-900">Meal History</h2>
                            <p className="text-sm text-slate-500 mt-0.5">Detailed daily nutrition log</p>
                        </div>
                        <AnalyticsActivityLog fullHistory={dailyHistory} />
                    </div>
                </TabsContent>

                {/* --- LIMITS TAB --- */}
                <TabsContent value="limits" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <DietitianNutrientLimits
                        patientId={Number(patientId)}
                        limits={limits}
                        nutrients={nutrients}
                        onRefresh={fetchLimits}
                    />
                </TabsContent>

                {/* --- MEAL PLANS TAB --- */}
                <TabsContent value="meal-plan" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Weekly Meal Plan</h2>
                            <p className="text-slate-500">Schedule meals for the patient.</p>
                        </div>
                        <Button onClick={handleAddMeal} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-12 px-6 font-bold shadow-lg shadow-orange-500/20">
                            <Plus className="w-4 h-4 mr-2" /> Add Meal
                        </Button>
                    </div>

                    <div className="space-y-8">
                        {Object.keys(mealsByDate).sort().reverse().map(date => (
                            <div key={date}>
                                <div className="flex items-center gap-2 mb-4">
                                    <Calendar className="w-5 h-5 text-slate-400" />
                                    <h3 className="text-lg font-bold text-slate-900">
                                        {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {mealsByDate[date].map(meal => (
                                        <Card key={meal.id} className="p-6 rounded-xl border-slate-100 shadow-sm hover:shadow-md transition-all group bg-white overflow-hidden">
                                            {meal.recipe?.recipe_image && (
                                                <div className="w-full h-32 rounded-2xl overflow-hidden mb-3 bg-slate-100">
                                                    <img
                                                        src={
                                                            meal.recipe.recipe_image?.startsWith('http')
                                                                ? meal.recipe.recipe_image
                                                                : `${API_BASE_URL}${meal.recipe.recipe_image?.startsWith('/') ? '' : '/media/'}${meal.recipe.recipe_image}`
                                                        }
                                                        alt={meal.recipe.recipe_name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { (e.target as HTMLImageElement).src = '/illustrations/recipe-placeholder.png'; }}
                                                    />
                                                </div>
                                            )}
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className={cn(
                                                        "inline-block px-2 py-1 rounded-full text-xs font-bold mb-2",
                                                        meal.meal_type === 'breakfast' && "bg-amber-100 text-amber-700",
                                                        meal.meal_type === 'lunch' && "bg-emerald-100 text-emerald-700",
                                                        meal.meal_type === 'dinner' && "bg-indigo-100 text-indigo-700",
                                                        !['breakfast', 'lunch', 'dinner'].includes(meal.meal_type) && "bg-slate-100 text-slate-700"
                                                    )}>
                                                        {meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}
                                                    </span>
                                                    <h4 className="font-bold text-slate-900 line-clamp-1">{meal.recipe?.recipe_name || meal.custom_name}</h4>
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteMeal(meal.id)} className="h-8 w-8 rounded-lg text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Delete meal">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {mealPlans.length === 0 && (
                            <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50">
                                <ChefHat className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold mb-2">No meals scheduled.</p>
                                <Button variant="link" onClick={handleAddMeal} className="text-orange-500 font-bold">Plan a meal now</Button>
                            </div>
                        )}
                    </div>
                </TabsContent>

            </Tabs>


            {/* --- DIALOGS --- */}

            {/* Meal Dialog */}
            <Dialog open={isMealDialogOpen} onOpenChange={setIsMealDialogOpen}>
                <DialogContent className="sm:max-w-lg rounded-xl p-8">
                    <DialogHeader><DialogTitle className="text-2xl font-bold text-center">Add Meal</DialogTitle></DialogHeader>
                    <form onSubmit={handleSaveMeal} className="space-y-6 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input type="date" required value={mealForm.date} onChange={e => setMealForm({ ...mealForm, date: e.target.value })} className="h-12 rounded-xl bg-slate-50" />
                            </div>
                            <div className="space-y-2">
                                <Label>Meal Type</Label>
                                <Select value={mealForm.meal_type} onValueChange={v => setMealForm({ ...mealForm, meal_type: v })}>
                                    <SelectTrigger className="h-12 rounded-xl bg-slate-50"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="breakfast">Breakfast</SelectItem>
                                        <SelectItem value="lunch">Lunch</SelectItem>
                                        <SelectItem value="dinner">Dinner</SelectItem>
                                        <SelectItem value="snack">Snack</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Recipe</Label>
                            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search recipes..." value={mealSearchQuery} onChange={e => setMealSearchQuery(e.target.value)} className="pl-10 h-12 rounded-xl bg-slate-50" /></div>
                            <div className="max-h-48 overflow-y-auto border rounded-xl bg-slate-50">
                                {filteredRecipes.map(r => (
                                    <div key={r.id} onClick={() => setMealForm({ ...mealForm, recipe_id: r.id.toString() })} className={cn("p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-100", mealForm.recipe_id === r.id.toString() && "bg-orange-50 border-l-4 border-orange-500")}>
                                        <div className="w-10 h-10 rounded-lg bg-slate-200 overflow-hidden"><img src={r.recipe_image ? (r.recipe_image.startsWith('http') ? r.recipe_image : `${API_BASE_URL}/media/${r.recipe_image}`) : '/illustrations/recipe-placeholder.png'} className="w-full h-full object-cover" /></div>
                                        <span className="text-sm font-bold text-slate-900">{r.recipe_name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <DialogFooter><Button type="submit" disabled={isSavingMeal} className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold">{isSavingMeal ? 'Adding...' : 'Add Meal'}</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* 3. Global Dialogs */}
            <SendNotificationDialog open={isNotifyOpen} onOpenChange={setIsNotifyOpen} patientId={patient?.id || null} patientName={patient ? `${patient.fname} ${patient.lname}` : ''} />
            <PatientChatDialog open={isChatOpen} onOpenChange={setIsChatOpen} patient={patient} />

        </div>
    );
}
