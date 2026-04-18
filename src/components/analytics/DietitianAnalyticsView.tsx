import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { NutrientStats, AdvancedStats, WeightHistory, MealDistribution } from '@/services/analytics.service';
import type { Patient } from '@/types';
import { formatMacroTargetSplitLabel, getNutrientTargets } from '@/utils/nutrition';
import { WeightTrendChart } from './charts/WeightTrendChart';
import { NutrientTrendChart, type AnalyticsTrendDatum } from './charts/NutrientTrendChart';
import { CalorieCompositionChart } from './charts/CalorieCompositionChart';
import DeficiencyAlert from './DeficiencyAlert';
import {
    ResponsiveContainer,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    ComposedChart,
    Line,
    ReferenceLine,
} from 'recharts';
import { type SymptomLog } from '@/services/vital-signs.service';
import { MealDistributionSummaryCard } from './MealDistributionSummaryCard';
import { LimitFocusCard, type LimitFocusMetric } from './LimitFocusCard';
import { AnalyticsNoticeStack, type AnalyticsNotice } from './AnalyticsNoticeStack';

interface WaterHistoryEntry {
    date: string;
    total_ml: number;
}

interface DietitianAnalyticsViewProps {
    currentPatient: Patient;
    stats: NutrientStats | null;
    advancedStats: AdvancedStats | null;
    weightHistory: WeightHistory | null;
    distribution: MealDistribution | null;
    symptomHistory: SymptomLog[];
    waterHistory: WaterHistoryEntry[];
    period: 'weekly' | 'monthly';
    setPeriod: (period: 'weekly' | 'monthly') => void;
}

const GRADIENT_COLOR_MAP: Record<string, string> = {
    'url(#gradWater)': '#3b82f6',
    'url(#gradSymptom)': '#f43f5e',
};

const formatNoticeList = (items: string[]) => {
    if (items.length <= 1) return items[0] || '';
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border border-gray-100 bg-white p-3 shadow-lg">
                <p className="mb-1 text-sm font-bold text-gray-800">{label}</p>
                <div className="space-y-0.5">
                    {payload.map((entry: any) => {
                        let color = entry.color || entry.fill || entry.payload?.fill;
                        if (typeof color === 'string' && color.startsWith('url(')) {
                            color = GRADIENT_COLOR_MAP[color] || '#6b7280';
                        }

                        if (entry.value === null || entry.value === undefined) {
                            return null;
                        }

                        return (
                            <div key={entry.name || entry.dataKey} className="flex items-center gap-2 text-xs">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color || '#6b7280' }} />
                                <span className="text-gray-600">{entry.name}:</span>
                                <span className="font-semibold text-gray-900">{Number(entry.value).toFixed(1)}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return null;
};

export function DietitianAnalyticsView({
    currentPatient,
    stats,
    advancedStats,
    weightHistory,
    distribution,
    symptomHistory,
    waterHistory,
    period,
    setPeriod,
}: DietitianAnalyticsViewProps) {
    const days = period === 'weekly' ? 7 : 30;
    const selectedRangeLabel = period === 'weekly' ? 'last 7 days' : 'last 30 days';

    const targets = getNutrientTargets(currentPatient);
    const targetMacroLabel = useMemo(() => formatMacroTargetSplitLabel(targets), [targets]);

    const avgProtein = useMemo(() => (stats?.macro_nutrients.find((nutrient) => nutrient.name === 'Protein')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);
    const avgCarbs = useMemo(() => (stats?.macro_nutrients.find((nutrient) => nutrient.name === 'Carbohydrates')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);
    const avgFat = useMemo(() => (stats?.macro_nutrients.find((nutrient) => nutrient.name === 'Fat')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);
    const avgSugar = useMemo(() => (stats?.limiting_nutrients.find((nutrient) => nutrient.name === 'Sugar')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);
    const avgSodium = useMemo(() => (stats?.micro_nutrients.find((nutrient) => nutrient.name === 'Sodium')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);
    const avgCholesterol = useMemo(() => (stats?.micro_nutrients.find((nutrient) => nutrient.name === 'Cholesterol')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);
    const avgSaturatedFat = useMemo(() => (stats?.limiting_nutrients.find((nutrient) => nutrient.name === 'Saturated Fat')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);
    const avgTransFat = useMemo(() => (stats?.limiting_nutrients.find((nutrient) => nutrient.name === 'Trans-fat')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);

    const trendData = useMemo<AnalyticsTrendDatum[]>(() => {
        if (!stats) {
            return [];
        }

        return stats.dates.map((date, index) => {
            const day: AnalyticsTrendDatum = {
                date: new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                Calories: stats.calories[index] || 0,
            };

            stats.macro_nutrients.forEach((nutrient) => {
                day[nutrient.name] = nutrient.data[index] || 0;
            });
            stats.micro_nutrients.forEach((nutrient) => {
                day[nutrient.name] = nutrient.data[index] || 0;
            });
            stats.limiting_nutrients.forEach((nutrient) => {
                day[nutrient.name] = nutrient.data[index] || 0;
            });

            return day;
        });
    }, [stats]);

    const symptomTimelineData = useMemo(() => {
        if (!stats?.dates.length) {
            return [];
        }

        const logsByDate = symptomHistory.reduce((accumulator, log) => {
            if (!log.date) {
                return accumulator;
            }

            const dateKey = log.date.substring(0, 10);
            if (!accumulator[dateKey]) {
                accumulator[dateKey] = [];
            }
            accumulator[dateKey].push(log);
            return accumulator;
        }, {} as Record<string, SymptomLog[]>);

        return stats.dates.map((date) => {
            const logs = logsByDate[date] || [];
            const avgSeverity = logs.length
                ? logs.reduce((sum, log) => sum + log.severity, 0) / logs.length
                : null;

            return {
                date: new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                avgSeverity,
                symptomCount: logs.length,
            };
        });
    }, [stats, symptomHistory]);

    const limitFocusMetrics = useMemo<LimitFocusMetric[]>(() => [
        { name: 'Sodium', value: avgSodium, limit: targets.sodium, unit: 'mg' },
        { name: 'Saturated Fat', value: avgSaturatedFat, limit: targets.saturated_fat, unit: 'g' },
        { name: 'Sugar', value: avgSugar, limit: targets.sugar, unit: 'g' },
        { name: 'Cholesterol', value: avgCholesterol, limit: targets.cholesterol, unit: 'mg' },
        { name: 'Trans Fat', value: avgTransFat, limit: targets.trans_fat, unit: 'g' },
    ], [avgCholesterol, avgSaturatedFat, avgSodium, avgSugar, avgTransFat, targets]);
    const analyticsNotices = useMemo<AnalyticsNotice[]>(() => {
        const notices: AnalyticsNotice[] = [];
        const hasLoggedMeals = stats?.calories.some((value) => value > 0) ?? false;
        const hasPartialNutritionData = trendData.some((day) =>
            Number(day.Calories ?? 0) === 0 &&
            ['Protein', 'Carbohydrates', 'Fat', 'Fiber', 'Sugar', 'Sodium', 'Cholesterol', 'Saturated Fat']
                .some((key) => typeof day[key] === 'number' && Number(day[key]) > 0)
        );
        const highLimitNames = limitFocusMetrics
            .filter((metric) => metric.limit > 0 && metric.value > metric.limit)
            .map((metric) => metric.name.toLowerCase());

        if (!hasLoggedMeals) {
            notices.push({
                id: 'no-meals',
                tone: 'warning',
                title: 'No meal logs in this range',
                description: `There are no logged meals in the ${selectedRangeLabel}, so this review is limited.`,
            });
            return notices;
        }

        if (hasPartialNutritionData) {
            notices.push({
                id: 'partial-data',
                tone: 'warning',
                title: 'Some nutrition details are incomplete',
                description: 'A few entries have meals but not full nutrient totals. Chart values may be lower than the true intake.',
            });
        }

        if (highLimitNames.length > 0) {
            notices.push({
                id: 'high-limits',
                tone: 'warning',
                title: 'A few intake limits are elevated',
                description: `Average ${formatNoticeList(highLimitNames)} were above the daily limit in this range.`,
            });
        }

        notices.push({
            id: 'estimate-note',
            tone: 'info',
            title: 'Energy and weight figures are screening estimates',
            description: 'Use these numbers as a simple review aid. They are based on profile data and meals in the selected range, not a diagnosis.',
        });

        return notices.slice(0, 3);
    }, [limitFocusMetrics, selectedRangeLabel, stats, trendData]);

    if (!stats) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Analytics Charts</h3>
                    <p className="text-sm text-slate-500">Clinical trends and adherence patterns for the selected range.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPeriod('weekly')}
                        className={cn('h-8 rounded-lg font-bold', period === 'weekly' ? 'border border-slate-200 bg-white text-slate-900 shadow-sm' : 'text-slate-400')}
                    >
                        7 Days
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPeriod('monthly')}
                        className={cn('h-8 rounded-lg font-bold', period === 'monthly' ? 'border border-slate-200 bg-white text-slate-900 shadow-sm' : 'text-slate-400')}
                    >
                        30 Days
                    </Button>
                </div>
            </div>

            <AnalyticsNoticeStack notices={analyticsNotices} />

            <NutrientTrendChart
                data={trendData}
                days={days}
                title="Macronutrient Trends"
                description="Daily intake of calories, protein, carbohydrates, and fat."
                type="macro"
                t={targets}
                className="rounded-2xl border-slate-100 bg-white shadow-sm"
                emptyTitle="No macronutrient trend yet"
                emptyMessage={`No usable nutrition data was found in the ${selectedRangeLabel}.`}
            />

            <WeightTrendChart
                weightHistory={weightHistory}
                days={days}
                className="rounded-2xl border-slate-100 bg-white shadow-sm"
            />

            <NutrientTrendChart
                data={trendData}
                days={days}
                title="Limit-Sensitive Trends"
                description="Daily sodium, cholesterol, and saturated-fat movement across the selected range."
                type="micro"
                t={targets}
                className="rounded-2xl border-slate-100 bg-white shadow-sm"
                emptyTitle="No limit trend yet"
                emptyMessage={`No usable nutrition data was found in the ${selectedRangeLabel}.`}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <CalorieCompositionChart
                    avgProtein={avgProtein}
                    avgCarbs={avgCarbs}
                    avgFat={avgFat}
                    totalKcal={advancedStats?.avg_daily_intake || 0}
                    targetLabel={targetMacroLabel}
                    className="rounded-2xl border-slate-100 bg-white shadow-sm"
                />
                <MealDistributionSummaryCard
                    distribution={distribution?.distribution || []}
                    description={`Average calorie share by meal across the ${selectedRangeLabel}.`}
                    className="rounded-2xl border-slate-100 bg-white shadow-sm"
                />
            </div>

            <LimitFocusCard
                metrics={limitFocusMetrics}
                description={`Average per day across the ${selectedRangeLabel}, compared with the key limits most dietitians monitor.`}
                className="rounded-2xl border-slate-100 bg-white shadow-sm"
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card className="h-[360px] rounded-2xl border-slate-100 bg-white shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                            <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                            </svg>
                            Hydration Trend
                        </CardTitle>
                        <CardDescription className="text-xs">Daily water intake for the selected period.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[280px]">
                        {waterHistory.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={waterHistory} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                    <defs>
                                        <linearGradient id="gradWater" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                                            <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.6} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <ReferenceLine y={2000} stroke="#22c55e" strokeDasharray="5 5" label={{ value: 'Target', position: 'right', fontSize: 10, fill: '#22c55e' }} />
                                    <Bar dataKey="total_ml" name="Water (ml)" fill="url(#gradWater)" radius={[4, 4, 0, 0]} maxBarSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-slate-400">
                                No hydration data logged
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="h-[360px] rounded-2xl border-slate-100 bg-white shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                            <svg className="h-5 w-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Symptom Timeline
                        </CardTitle>
                        <CardDescription className="text-xs">Average severity and symptom logging frequency per day.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[280px]">
                        {symptomHistory.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={symptomTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                    <defs>
                                        <linearGradient id="gradSymptom" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9} />
                                            <stop offset="100%" stopColor="#fb7185" stopOpacity={0.6} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 9 }}
                                        tickLine={false}
                                        axisLine={false}
                                        interval={0}
                                        tickFormatter={(value, index) => {
                                            if (days <= 7) return value;
                                            if (days <= 30) return index % 3 === 0 ? value : '';
                                            return index % 6 === 0 ? value : '';
                                        }}
                                    />
                                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 10]} label={{ value: 'Severity', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }} />
                                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} label={{ value: 'Logs', angle: 90, position: 'insideRight', fontSize: 10, fill: '#64748b' }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar yAxisId="right" dataKey="symptomCount" name="Symptom Logs" fill="#fecdd3" radius={[4, 4, 0, 0]} maxBarSize={28} />
                                    <Line yAxisId="left" type="monotone" dataKey="avgSeverity" name="Avg Severity" stroke="#e11d48" strokeWidth={2.5} connectNulls={false} dot={{ r: 3, fill: '#e11d48', stroke: '#fff', strokeWidth: 1 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-slate-400">
                                No symptoms logged
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="h-[360px]">
                    <DeficiencyAlert
                        nutrients={[...(stats?.macro_nutrients || []), ...(stats?.micro_nutrients || [])]}
                        limits={{
                            Protein: { daily: targets.protein },
                            Fiber: { daily: targets.fiber },
                            Sodium: { daily: targets.sodium },
                            Cholesterol: { daily: targets.cholesterol },
                            'Saturated Fat': { daily: targets.saturated_fat },
                            Sugar: { daily: targets.sugar },
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
