import type { Patient } from '../types';

export interface NutrientTargets {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
    cholesterol: number;
    saturated_fat: number;
    unsaturated_fat: number;
    trans_fat: number;
}

export interface MacroTargetSplit {
    proteinPct: number;
    carbsPct: number;
    fatPct: number;
}

/**
 * Returns the backend-provided daily nutrient targets for a patient.
 * Falls back to safe defaults when profile data is unavailable.
 */
export const getNutrientTargets = (patient: Patient | null): NutrientTargets => {
    // Constant Defaults/Limits
    const defaultTargets: NutrientTargets = {
        calories: 2000,
        protein: 150,
        carbs: 250,
        fat: 70,
        fiber: 25,
        sugar: 50,
        sodium: 2300,
        cholesterol: 300,
        saturated_fat: 20,
        unsaturated_fat: 50,
        trans_fat: 2,
    };

    if (!patient) return defaultTargets;

    // 1. Check for explicit targets in profile
    if (patient.nutrient_targets) {
        const nt = patient.nutrient_targets;
        return {
            ...defaultTargets,
            calories: nt.calories ?? defaultTargets.calories,
            protein: nt.protein ?? defaultTargets.protein,
            carbs: nt.carbs ?? defaultTargets.carbs,
            fat: nt.fat ?? defaultTargets.fat,
            fiber: nt.fiber ?? defaultTargets.fiber,
            sugar: nt.sugar ?? defaultTargets.sugar,
            sodium: nt.sodium ?? defaultTargets.sodium,
            cholesterol: nt.cholesterol ?? defaultTargets.cholesterol,
            saturated_fat: nt.saturated_fat ?? defaultTargets.saturated_fat,
            unsaturated_fat: nt.unsaturated_fat ?? defaultTargets.unsaturated_fat,
            trans_fat: nt.trans_fat ?? defaultTargets.trans_fat,
        };
    }

    return defaultTargets;
};

export const getMacroTargetSplit = (targets: NutrientTargets): MacroTargetSplit => {
    const proteinKcal = targets.protein * 4;
    const carbsKcal = targets.carbs * 4;
    const fatKcal = targets.fat * 9;
    const totalMacroKcal = proteinKcal + carbsKcal + fatKcal || 1;

    return {
        proteinPct: Math.round((proteinKcal / totalMacroKcal) * 100),
        carbsPct: Math.round((carbsKcal / totalMacroKcal) * 100),
        fatPct: Math.round((fatKcal / totalMacroKcal) * 100),
    };
};

export const formatMacroTargetSplitLabel = (targets: NutrientTargets): string => {
    const split = getMacroTargetSplit(targets);
    return `${split.proteinPct}P / ${split.carbsPct}C / ${split.fatPct}F`;
};

/**
 * Returns consistent colors for nutrients
 */
export const getNutrientColor = (nutrientName: string): string => {
    const name = nutrientName.toLowerCase();
    const colors: Record<string, string> = {
        calories: 'text-orange-500',
        protein: 'text-emerald-500',
        carbohydrates: 'text-amber-500',
        carbs: 'text-amber-500',
        fat: 'text-indigo-500',
        fiber: 'text-violet-500',
        sugar: 'text-pink-500',
        sodium: 'text-blue-500',
        cholesterol: 'text-orange-600',
        saturated_fat: 'text-rose-500',
        'saturated fat': 'text-rose-500',
        unsaturated_fat: 'text-teal-500',
        trans_fat: 'text-slate-600',
    };
    return colors[name] || 'text-primary';
};
