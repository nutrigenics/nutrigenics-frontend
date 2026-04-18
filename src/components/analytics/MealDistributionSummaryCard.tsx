import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { MealDistributionEntry } from '@/services/analytics.service';
import { Utensils } from 'lucide-react';
import { COLORS } from './constants';
import { cn } from '@/lib/utils';

interface MealDistributionSummaryCardProps {
    distribution: MealDistributionEntry[];
    title?: string;
    description?: string;
    emptyTitle?: string;
    emptyDescription?: string;
    className?: string;
}

const MEAL_ORDER = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Snack'];

const MEAL_COLORS: Record<string, string> = {
    Breakfast: COLORS.protein.start,
    Lunch: COLORS.carbs.start,
    Dinner: COLORS.sodium.start,
    Snacks: COLORS.fiber.start,
    Snack: COLORS.fiber.start,
};

export function MealDistributionSummaryCard({
    distribution,
    title = 'Meal Distribution',
    description = 'Average calorie share by meal across the selected range.',
    emptyTitle = 'No meal distribution yet',
    emptyDescription = 'Add meals in the selected range to see how calories are spread across the day.',
    className,
}: MealDistributionSummaryCardProps) {
    const orderedDistribution = [...distribution].sort(
        (left, right) => MEAL_ORDER.indexOf(left.name) - MEAL_ORDER.indexOf(right.name)
    );
    const totalCalories = orderedDistribution.reduce((sum, entry) => sum + entry.value, 0);
    const hasData = totalCalories > 0;

    return (
        <Card className={cn('shadow-sm transition-all duration-300 hover:shadow-md', className)}>
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <Utensils className="h-5 w-5 text-slate-500" />
                            {title}
                        </CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                    {hasData && (
                        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {Math.round(totalCalories)} kcal
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {hasData ? (
                    orderedDistribution.map((entry) => {
                        const percentage = totalCalories > 0 ? (entry.value / totalCalories) * 100 : 0;
                        const color = MEAL_COLORS[entry.name] || COLORS.slate.start;

                        return (
                            <div key={entry.name} className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="h-2.5 w-2.5 rounded-full"
                                            style={{ backgroundColor: color }}
                                        />
                                        <span className="text-sm font-medium text-slate-700">{entry.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-semibold text-slate-900">
                                            {Math.round(entry.value)} kcal
                                        </div>
                                        <div className="text-xs text-slate-500">{percentage.toFixed(0)}%</div>
                                    </div>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: color }}
                                    />
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center">
                        <div className="mb-4 rounded-full bg-slate-100 p-3 text-slate-500">
                            <Utensils className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">{emptyTitle}</p>
                        <p className="mt-2 max-w-sm text-sm text-slate-500">{emptyDescription}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
