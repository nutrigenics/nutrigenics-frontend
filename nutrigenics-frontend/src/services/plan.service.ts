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
        const response = await apiClient.get('/api/v1/plans/', { params: { date, summary: true } });
        const data = response.data;
        const plans = Array.isArray(data) ? data : (data.results || []);

        // Nutrient summary is now calculated by the page view or backend in future
        const nutrient_summary: NutrientSummary = {
            Calories: 0, Protein: 0, Carbohydrates: 0, Fat: 0
        };

        return { plans, nutrient_summary };
    },

    /**
     * Add item to plan
     */
    async addToPlan(data: Partial<MealPlan> & { recipe_id?: number }): Promise<MealPlan> {
        const response = await apiClient.post('/api/v1/plans/', data);
        return response.data;
    },

    /**
     * Get meal plan history for a date range
     */
    async getHistory(startDate: string, endDate: string): Promise<MealPlan[]> {
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
        const response = await apiClient.get('/api/v1/plans/today-status/');
        return response.data;
    },
};
