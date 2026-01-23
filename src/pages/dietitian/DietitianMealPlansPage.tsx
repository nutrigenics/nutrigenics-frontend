// MainLayout removed (provided by router)
import { Utensils, Calendar, ArrowLeft, Plus, Loader2, Search, ChefHat, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { dietitianDashboardService } from '@/services/dietitian-dashboard.service';
import apiClient from '@/services/api.client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface Patient {
    id: number;
    fname: string;
    lname: string;
    patient_id: string;
}

interface MealPlan {
    id: number;
    recipe?: {
        id: number;
        recipe_name: string;
        recipe_image?: string;
    };
    meal_type: string;
    date: string;
    completed: boolean;
    custom_name?: string;
}

interface Recipe {
    id: number;
    recipe_name: string;
    recipe_image?: string;
}

export default function DietitianMealPlansPage() {
    const { patientId } = useParams();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        recipe_id: '',
        meal_type: 'breakfast',
        date: new Date().toISOString().split('T')[0]
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, [patientId]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [patientsData, recipesData] = await Promise.all([
                dietitianDashboardService.getPatients(),
                apiClient.get('/api/v1/recipes/', { params: { limit: 50 } })
            ]);

            const patientsList = Array.isArray(patientsData) ? patientsData : patientsData.results || [];
            const foundPatient = patientsList.find((p: any) => p.id === Number(patientId));
            setPatient(foundPatient || null);

            // Fetch meal plans for patient
            try {
                const plansData = await apiClient.get(`/api/v1/plans/`, { params: { patient_id: patientId } });
                setMealPlans(plansData.data.results || plansData.data || []);
            } catch {
                setMealPlans([]);
            }

            setRecipes(recipesData.data.results || recipesData.data || []);
        } catch (error) {
            console.error("Failed to load data", error);
            toast.error("Failed to load patient data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddMeal = () => {
        setFormData({
            recipe_id: '',
            meal_type: 'breakfast',
            date: new Date().toISOString().split('T')[0]
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (planId: number) => {
        if (!confirm('Remove this meal from plan?')) return;
        try {
            await apiClient.delete(`/api/v1/plans/${planId}/`);
            toast.success("Meal removed");
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Failed to remove meal");
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.recipe_id) {
            toast.error("Please select a recipe");
            return;
        }

        setIsSaving(true);
        try {
            await apiClient.post('/api/v1/plans/', {
                user_id: Number(patientId),
                recipe_id: Number(formData.recipe_id),
                meal_type: formData.meal_type,
                date: formData.date
            });
            toast.success("Meal added to plan");
            setIsDialogOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Failed to add meal");
        } finally {
            setIsSaving(false);
        }
    };

    // Group meals by date
    const mealsByDate = mealPlans.reduce((acc: Record<string, MealPlan[]>, meal) => {
        const date = meal.date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(meal);
        return acc;
    }, {});

    const filteredRecipes = recipes.filter(r =>
        r.recipe_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="animate-spin w-8 h-8 text-primary" />
            </div>
        );
    }

    return (
        <>
            {/* Back Button & Patient Header */}
            <div className="mb-6">
                <Link to="/dietitian/patients">
                    <Button variant="outline" className="mb-4 rounded-xl">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Patients
                    </Button>
                </Link>

                {patient && (
                    <div className="flex items-center gap-4 p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
                        <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center text-white text-xl font-bold">
                            {patient.fname?.[0] || 'P'}{patient.lname?.[0] || ''}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{patient.fname} {patient.lname}</h2>
                            <p className="text-gray-500">Patient ID: {patient.patient_id}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Hero Header */}
            <div className="w-full mb-8 p-8 md:p-12 bg-white rounded-[2.5rem] relative overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-gray-100 text-center">
                <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 bg-orange-50 rounded-2xl mb-6 shadow-sm"
                    >
                        <Utensils className="w-10 h-10 text-orange-600" />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight"
                    >
                        Meal <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-600">Plan</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-gray-500"
                    >
                        Create and manage meal plans for this patient.
                    </motion.p>
                </div>

                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-orange-500/10 to-transparent rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl opacity-60 translate-y-1/2 -translate-x-1/2" />
            </div>

            <div className="max-w-5xl mx-auto space-y-8">
                {/* Add Meal Button */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Scheduled Meals</h2>
                        <p className="text-gray-500">{mealPlans.length} meals planned</p>
                    </div>
                    <Button onClick={handleAddMeal} className="rounded-xl h-12 px-6 bg-orange-500 text-white font-bold shadow-lg hover:bg-orange-600">
                        <Plus className="w-4 h-4 mr-2" /> Add Meal
                    </Button>
                </div>

                {/* Meal Plans by Date */}
                {Object.keys(mealsByDate).sort().reverse().map(date => (
                    <motion.div
                        key={date}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <h3 className="text-lg font-bold text-gray-900">
                                {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {mealsByDate[date].map(meal => (
                                <Card key={meal.id} className="p-4 rounded-[1.5rem] border-gray-100 shadow-sm hover:shadow-md transition-all relative group bg-white overflow-hidden">
                                    {meal.recipe?.recipe_image && (
                                        <div className="w-full h-32 rounded-xl overflow-hidden mb-3">
                                            <img
                                                src={
                                                    meal.recipe.recipe_image && meal.recipe.recipe_image !== 'undefined'
                                                        ? meal.recipe.recipe_image.startsWith('http')
                                                            ? meal.recipe.recipe_image
                                                            : `${API_BASE_URL}${meal.recipe.recipe_image.startsWith('/') ? '' : '/media/'}${meal.recipe.recipe_image}`
                                                        : '/illustrations/recipe-placeholder.png'
                                                }
                                                alt={meal.recipe.recipe_name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => { (e.target as HTMLImageElement).src = '/illustrations/recipe-placeholder.png'; }}
                                            />
                                        </div>
                                    )}
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold mb-2 ${meal.meal_type === 'breakfast' ? 'bg-amber-100 text-amber-700' :
                                                meal.meal_type === 'lunch' ? 'bg-emerald-100 text-emerald-700' :
                                                    'bg-indigo-100 text-indigo-700'
                                                }`}>
                                                {meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}
                                            </span>
                                            <h4 className="font-bold text-gray-900">{meal.recipe?.recipe_name || meal.custom_name || 'Custom Meal'}</h4>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(meal.id)}
                                            className="h-8 w-8 rounded-lg text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    {meal.completed && (
                                        <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                            ✓ Done
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    </motion.div>
                ))}

                {/* Empty State */}
                {mealPlans.length === 0 && (
                    <div className="py-16 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                        <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold mb-2">No meals planned yet.</p>
                        <p className="text-sm text-gray-400 mb-4">Start by adding meals from the recipe library.</p>
                        <Button onClick={handleAddMeal} className="rounded-xl bg-orange-500 hover:bg-orange-600">
                            <Plus className="w-4 h-4 mr-2" /> Add First Meal
                        </Button>
                    </div>
                )}
            </div>

            {/* Add Meal Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-lg rounded-3xl p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-center">Add Meal to Plan</DialogTitle>
                        <DialogDescription className="text-center">
                            Select a recipe and schedule it for a specific day.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="rounded-xl h-12 bg-gray-50 border-gray-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Meal Type</Label>
                                <Select value={formData.meal_type} onValueChange={val => setFormData({ ...formData, meal_type: val })}>
                                    <SelectTrigger className="h-12 rounded-xl bg-gray-50 border-gray-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="breakfast">Breakfast</SelectItem>
                                        <SelectItem value="lunch">Lunch</SelectItem>
                                        <SelectItem value="dinner">Dinner</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Recipe</Label>
                            <div className="relative mb-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search recipes..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="pl-10 rounded-xl h-12 bg-gray-50 border-gray-200"
                                />
                            </div>
                            <div className="max-h-64 overflow-y-auto border rounded-xl bg-gray-50">
                                {filteredRecipes.length === 0 ? (
                                    <div className="p-4 text-center text-gray-400">No recipes found</div>
                                ) : (
                                    filteredRecipes.map(recipe => (
                                        <div
                                            key={recipe.id}
                                            onClick={() => setFormData({ ...formData, recipe_id: recipe.id.toString() })}
                                            className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-0 ${formData.recipe_id === recipe.id.toString() ? 'bg-orange-50 border-orange-200' : ''
                                                }`}
                                        >
                                            {recipe.recipe_image && (
                                                <img
                                                    src={
                                                        recipe.recipe_image && recipe.recipe_image !== 'undefined'
                                                            ? recipe.recipe_image.startsWith('http')
                                                                ? recipe.recipe_image
                                                                : `${API_BASE_URL}${recipe.recipe_image.startsWith('/') ? '' : '/media/'}${recipe.recipe_image}`
                                                            : '/illustrations/recipe-placeholder.png'
                                                    }
                                                    alt={recipe.recipe_name}
                                                    className="w-12 h-12 rounded-lg object-cover"
                                                    onError={(e) => { (e.target as HTMLImageElement).src = '/illustrations/recipe-placeholder.png'; }}
                                                />
                                            )}
                                            <span className={`font-medium ${formData.recipe_id === recipe.id.toString() ? 'text-orange-600' : 'text-gray-900'}`}>
                                                {recipe.recipe_name}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-12 px-6">Cancel</Button>
                            <Button type="submit" disabled={isSaving || !formData.recipe_id} className="rounded-xl h-12 px-8 bg-orange-500 text-white font-bold hover:bg-orange-600">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Add to Plan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
