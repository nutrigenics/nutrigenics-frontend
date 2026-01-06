import apiClient from './api.client';

export interface NutrientStats {
    dates: string[];
    weekdays?: string[];
    macro_nutrients: {
        name: string;
        data: number[];
    }[];
    micro_nutrients: {
        name: string;
        data: number[];
    }[];
    limiting_nutrients: {
        name: string;
        data: number[];
    }[];
    calories: number[];
    total_calories: string | number;
}

export interface ComplianceStats {
    compliance_rate: number;
    planned_days: number;
    total_days: number;
    streak: number;
}

export interface MealDistribution {
    distribution: { name: string; value: number }[];
    total: number;
}

export interface DailyMeal {
    name: string;
    meal_type: string;
    calories: number;
}

export interface DailyHistory {
    date: string;
    weekday: string;
    meals: DailyMeal[];
    total_calories: number;
    total_protein: number;
    total_carbs: number;
    total_fat: number;
}

export interface AdvancedStats {
    bmr: number;
    tdee: number;
    avg_daily_intake: number;
    daily_balance: number;
    balance_status: 'surplus' | 'deficit';
    this_week_total: number;
    last_week_total: number;
    week_change: number;
    week_change_pct: number;
}

export const analyticsService = {
    async getPatientAnalytics(period: 'weekly' | 'monthly' | 'all' = 'weekly'): Promise<NutrientStats> {
        const response = await apiClient.get('/api/analytics/patient/', {
            params: { period }
        });
        return response.data;
    },

    async getComplianceStats(): Promise<ComplianceStats> {
        const response = await apiClient.get('/api/analytics/patient/', {
            params: { period: 'compliance' }
        });
        return response.data;
    },

    async getMealDistribution(days: number = 7): Promise<MealDistribution> {
        const response = await apiClient.get('/api/analytics/patient/', {
            params: { period: 'meal_distribution', days }
        });
        return response.data;
    },

    async getDailyHistory(days: number = 7): Promise<DailyHistory[]> {
        const response = await apiClient.get('/api/analytics/patient/', {
            params: { period: 'history', days }
        });
        return response.data;
    },

    async getAdvancedStats(): Promise<AdvancedStats> {
        const response = await apiClient.get('/api/analytics/patient/', {
            params: { period: 'advanced' }
        });
        return response.data;
    }
};
