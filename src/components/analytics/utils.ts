
import { type NutrientStats, type AdvancedStats } from '@/services/analytics.service';

// Type definitions for insights
export type InsightType = 'good' | 'warning' | 'info' | 'danger';

export interface Insight {
    type: InsightType;
    text: string;
}

// Weight Impact Calculation
export const calculateWeightImpact = (advancedStats: AdvancedStats | null) => {
    const dailyBalance = advancedStats?.daily_balance || 0;
    // 7700 kcal ≈ 1kg fat. Weekly change = (daily_balance * 7) / 7700
    const weeklyChangeKg = (dailyBalance * 7) / 7700;
    let color = 'text-gray-600';
    if (weeklyChangeKg < -0.2) color = 'text-blue-600'; // Losing weight
    if (weeklyChangeKg > 0.2) color = 'text-rose-600'; // Gaining weight
    return { value: Number(weeklyChangeKg.toFixed(2)), color };
};

// Averages Calculation
export const calculateAverages = (stats: NutrientStats | null, days: number) => {
    const safeDays = days || 1;
    const getAvg = (list: any[], name: string) =>
        (list?.find(n => n.name === name)?.data.reduce((a: number, b: number) => a + b, 0) || 0) / safeDays;

    return {
        protein: getAvg(stats?.macro_nutrients || [], 'Protein'),
        fiber: getAvg(stats?.macro_nutrients || [], 'Fiber'),
        carbs: getAvg(stats?.macro_nutrients || [], 'Carbohydrates'),
        fat: getAvg(stats?.macro_nutrients || [], 'Fat'),
        sugar: getAvg(stats?.limiting_nutrients || [], 'Sugar'),
        sodium: getAvg(stats?.micro_nutrients || [], 'Sodium'),
        cholesterol: getAvg(stats?.micro_nutrients || [], 'Cholesterol'),
        satFat: getAvg(stats?.limiting_nutrients || [], 'Saturated Fat'),
        transFat: getAvg(stats?.limiting_nutrients || [], 'Trans-fat'),
        unsaturatedFat: getAvg(stats?.limiting_nutrients || [], 'Unsaturated Fat'),
    };
};

// Nutrient Gaps Calculation
export const calculateNutrientGaps = (stats: NutrientStats | null, days: number, targets: any) => {
    const avgs = calculateAverages(stats, days);
    const gaps: string[] = [];

    if (avgs.fiber < targets.fiber * 0.75) gaps.push('Fiber');
    if (avgs.protein < targets.protein * 0.75) gaps.push('Protein');

    // Micro checks
    if (stats?.micro_nutrients) {
        for (const m of stats.micro_nutrients) {
            const val = m.data.reduce((a, b) => a + b, 0) / (days || 1);
            if (['Iron', 'Calcium', 'Vitamin D'].includes(m.name)) {
                // Placeholder thresholds if not in 't'
                const threshold = m.name === 'Iron' ? 18 : m.name === 'Calcium' ? 1000 : 15;
                if (val < threshold * 0.75) gaps.push(m.name);
            }
        }
    }
    return gaps;
};

// Heart Score Calculation
export const calculateHeartScore = (avgs: any, targets: any) => {
    let score = 100;
    if (avgs.sodium > targets.sodium) score -= Math.min(30, ((avgs.sodium - targets.sodium) / targets.sodium) * 50);
    if (avgs.cholesterol > targets.cholesterol) score -= Math.min(30, ((avgs.cholesterol - targets.cholesterol) / targets.cholesterol) * 50);
    if (avgs.satFat > targets.saturated_fat) score -= Math.min(30, ((avgs.satFat - targets.saturated_fat) / targets.saturated_fat) * 50);
    return Math.max(0, Math.round(score));
};

// Carb Quality Score
export const calculateCarbQualityScore = (avgs: any) => {
    return avgs.sugar > 0 ? (avgs.fiber / avgs.sugar) : 0;
};

// Insight Generators
export const getDoEnergyInsight = (stats: NutrientStats | null, _advancedStats: AdvancedStats | null, days: number, targets: any): Insight => {
    const safeDays = days || 1;
    const avgCal = (stats?.calories.reduce((a, b) => a + b, 0) || 0) / safeDays;
    const diff = targets.calories - avgCal;
    if (diff > 300) return { type: 'warning', text: `Averaging ${Math.round(diff)} kcal below energy needs. Consider adding nutrient-dense snacks.` };
    if (diff < -300) return { type: 'warning', text: `${Math.round(Math.abs(diff))} kcal over target. Try portion control on carbohydrates.` };
    return { type: 'good', text: `Excellent! Calorie intake is well-balanced with energy expenditure.` };
};

export const getMacroInsight = (avgs: any, totalKcal: number): Insight => {
    const proteinPct = totalKcal > 0 ? Math.round(((avgs.protein * 4) / totalKcal) * 100) : 0;
    if (proteinPct < 25) return { type: 'warning', text: `Protein is only ${proteinPct}% of calories (target: 30%). Add lean meats, eggs, or legumes.` };
    if (proteinPct > 35) return { type: 'info', text: `High protein intake detected (${proteinPct}%). Good for muscle, but ensure hydration.` };
    return { type: 'good', text: `Macronutrient balance is on point!` };
};

export const getFatInsight = (avgs: any): Insight => {
    const totalFat = avgs.satFat + avgs.transFat + avgs.unsaturatedFat;
    const unsatPct = totalFat > 0 ? (avgs.unsaturatedFat / totalFat) * 100 : 0;

    if (avgs.transFat > 0) return { type: 'warning', text: `Trans-fat detected! Even small amounts increase heart disease risk.` };
    if (unsatPct > 60) return { type: 'good', text: `${Math.round(unsatPct)}% of fats are unsaturated (healthy). Keep it up!` };
    return { type: 'info', text: `Try to shift fat sources towards unsaturated options like avocados and nuts.` };
};

export const getGlycemicInsight = (qualityScore: number): Insight => {
    if (qualityScore >= 0.5) return { type: 'good', text: `Fiber-to-sugar ratio is exceptional (${qualityScore.toFixed(2)}). Helps maintain stable blood sugar.` };
    if (qualityScore >= 0.2) return { type: 'info', text: `Carb quality is moderate. Aim for more whole grains and vegetables.` };
    return { type: 'warning', text: `Low fiber-to-sugar ratio (${qualityScore.toFixed(2)}). Reduce sugary snacks, add fiber.` };
};

export const getHeartInsight = (avgs: any, targets: any): Insight => {
    const risks = [];
    if (avgs.sodium > targets.sodium) risks.push('Sodium');
    if (avgs.satFat > targets.saturated_fat) risks.push('Sat. Fat');
    if (avgs.sugar > targets.sugar) risks.push('Sugar');
    if (avgs.transFat > targets.trans_fat) risks.push('Trans Fat');
    if (avgs.cholesterol > targets.cholesterol) risks.push('Cholesterol');

    if (risks.length === 0) return { type: 'good', text: `All cardiovascular markers are within healthy limits.` };
    return { type: 'warning', text: `${risks.join(' and ')} intake is elevated. Reduce processed foods.` };
};
