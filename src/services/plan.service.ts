import apiClient from './api.client';
import type { MealPlan, NutrientSummary } from '../types';

export const planService = {
    /**
     * Get meal plan
     */
    async getMealPlan(date?: string): Promise<{
        plans: MealPlan[];
        nutrient_summary: NutrientSummary;
    }> {
        if (localStorage.getItem('is_guest_mode') === 'true') {
            const { MOCK_MEAL_PLAN, MOCK_NUTRIENT_SUMMARY } = await import('@/data/mockData');
            // Filter by date if needed, or just return mock plan for today
            return {
                plans: MOCK_MEAL_PLAN,
                nutrient_summary: MOCK_NUTRIENT_SUMMARY
            };
        }
        const response = await apiClient.get('/api/v1/plans/', { params: { date, summary: true } });
        const data = response.data;
        const plans = Array.isArray(data) ? data : (data.results || []);

        // Calculate nutrient summary from the fetched plans
        const nutrient_summary: NutrientSummary = plans.reduce((acc: NutrientSummary, plan: MealPlan) => ({
            Calories: acc.Calories + (Number(plan.calories) || 0),
            Protein: acc.Protein + (Number(plan.protein) || 0),
            Carbohydrates: acc.Carbohydrates + (Number(plan.carbs) || 0),
            Fat: acc.Fat + (Number(plan.fat) || 0)
        }), {
            Calories: 0,
            Protein: 0,
            Carbohydrates: 0,
            Fat: 0
        });

        return { plans, nutrient_summary };
    },

    /**
     * Add item to plan
     */
    async addToPlan(data: Partial<MealPlan> & { recipe_id?: number }): Promise<MealPlan> {
        if (localStorage.getItem('is_guest_mode') === 'true') {
            const { MOCK_RECIPES } = await import('@/data/mockData');
            const recipe = MOCK_RECIPES.find(r => r.id === data.recipe_id) || MOCK_RECIPES[0];
            return {
                id: Math.floor(Math.random() * 1000),
                recipes: recipe,
                recipe_id: data.recipe_id,
                meal_type: data.meal_type || 'snack',
                date: data.date || new Date().toISOString().split('T')[0],
                completed: false,
                calories: recipe.calories,
                protein: recipe.protein,
                carbs: recipe.carbs,
                fat: recipe.fat,
                portion: 1
            } as any;
        }
        const response = await apiClient.post('/api/v1/plans/', data);
        return response.data;
    },

    /**
     * Get meal plan history for a date range
     */
    async getHistory(startDate: string, endDate: string): Promise<MealPlan[]> {
        if (localStorage.getItem('is_guest_mode') === 'true') {
            const { MOCK_MEAL_PLAN } = await import('@/data/mockData');
            return MOCK_MEAL_PLAN;
        }
        const response = await apiClient.get('/api/v1/plans/', {
            params: { start_date: startDate, end_date: endDate }
        });
        const data = response.data;
        return Array.isArray(data) ? data : (data.results || []);
    },

    /**
     * Remove recipe from plan
     */
    async removeFromPlan(planId: number): Promise<void> {
        if (localStorage.getItem('is_guest_mode') === 'true') {
            return; // Mock success
        }
        await apiClient.delete(`/api/v1/plans/${planId}/`);
    },

    /**
     * Get today's plan status
     */
    async getTodayPlanStatus(): Promise<{
        breakfast: boolean;
        lunch: boolean;
        dinner: boolean;
        snack?: boolean;
    }> {
        if (localStorage.getItem('is_guest_mode') === 'true') {
            return { breakfast: true, lunch: true, dinner: false, snack: false };
        }
        const response = await apiClient.get('/api/v1/plans/today-status/');
        return response.data;
    },
};
