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
    nutrient_limits?: {
        [nutrientName: string]: { daily?: number | null; weekly?: number | null; unit?: string };
    };
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
    total_carbohydrates: number;
    total_fat: number;
    total_fiber: number;
    total_sugar: number;
    total_sodium: number;
    total_cholesterol: number;
    total_saturated_fat: number;
    total_unsaturated_fat: number;
    total_trans_fat: number;
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
    async getPatientAnalytics(period: 'weekly' | 'monthly' | '60days' | 'all' = 'weekly'): Promise<NutrientStats> {
        if (localStorage.getItem('is_guest_mode') === 'true') {
            const { MOCK_NUTRIENT_STATS } = await import('@/data/mockData');

            // Filter mock data based on period
            let days = 7;
            if (period === 'monthly') days = 30;
            if (period === '60days') days = 60;
            if (period === 'all') days = 180;

            // Helper to slice data arrays
            const sliceData = (arr: number[]) => arr.slice(-days);

            return {
                ...MOCK_NUTRIENT_STATS,
                dates: MOCK_NUTRIENT_STATS.dates.slice(-days),
                weekdays: MOCK_NUTRIENT_STATS.weekdays?.slice(-days),
                calories: sliceData(MOCK_NUTRIENT_STATS.calories),
                macro_nutrients: MOCK_NUTRIENT_STATS.macro_nutrients.map(n => ({ ...n, data: sliceData(n.data) })),
                micro_nutrients: MOCK_NUTRIENT_STATS.micro_nutrients.map(n => ({ ...n, data: sliceData(n.data) })),
                limiting_nutrients: MOCK_NUTRIENT_STATS.limiting_nutrients.map(n => ({ ...n, data: sliceData(n.data) }))
            } as unknown as NutrientStats;
        }
        const response = await apiClient.get('/api/analytics/patient/', {
            params: { period }
        });
        return response.data;
    },

    async getComplianceStats(): Promise<ComplianceStats> {
        if (localStorage.getItem('is_guest_mode') === 'true') {
            return {
                compliance_rate: 85,
                planned_days: 7,
                total_days: 7,
                streak: 4
            };
        }
        const response = await apiClient.get('/api/analytics/patient/', {
            params: { period: 'compliance' }
        });
        return response.data;
    },

    async getMealDistribution(days: number = 7): Promise<MealDistribution> {
        if (localStorage.getItem('is_guest_mode') === 'true') {
            return {
                distribution: [
                    { name: "Breakfast", value: 450 },
                    { name: "Lunch", value: 600 },
                    { name: "Dinner", value: 700 },
                    { name: "Snack", value: 250 }
                ],
                total: 2000
            };
        }
        const response = await apiClient.get('/api/analytics/patient/', {
            params: { period: 'meal_distribution', days }
        });
        return response.data;
    },

    async getDailyHistory(days: number = 7): Promise<DailyHistory[]> {
        if (localStorage.getItem('is_guest_mode') === 'true') {
            const { MOCK_HISTORY } = await import('@/data/mockData');
            return MOCK_HISTORY.slice(-days) as unknown as DailyHistory[];
        }
        const response = await apiClient.get('/api/analytics/patient/', {
            params: { period: 'history', days }
        });
        return response.data;
    },

    async getAdvancedStats(): Promise<AdvancedStats> {
        if (localStorage.getItem('is_guest_mode') === 'true') {
            return {
                bmr: 1600,
                tdee: 2200,
                avg_daily_intake: 2050,
                daily_balance: -150,
                balance_status: 'deficit',
                this_week_total: 14350,
                last_week_total: 14000,
                week_change: 350,
                week_change_pct: 2.5
            };
        }
        const response = await apiClient.get('/api/analytics/patient/', {
            params: { period: 'advanced' }
        });
        return response.data;
    }
};
