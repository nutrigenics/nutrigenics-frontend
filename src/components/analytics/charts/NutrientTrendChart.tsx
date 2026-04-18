import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { COLORS } from '../constants';
import { CustomTooltip } from './SharedComponents';
import { cn } from '@/lib/utils';
import { useId, useMemo, useState } from 'react';
import type { NutrientTargets } from '@/utils/nutrition';

type TrendDatumValue = number | string | null | undefined;

export interface AnalyticsTrendDatum {
    date: string;
    [key: string]: TrendDatumValue;
}

// Format axis values
const formatAxisValue = (value: number): string => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(0);
};

interface NutrientTrendChartProps {
    data: AnalyticsTrendDatum[];
    days: number;
    title: string;
    description: string;
    type: 'macro' | 'micro' | 'weight';
    t: NutrientTargets;
    className?: string;
    emptyTitle?: string;
    emptyMessage?: string;
}

const MAX_VISIBLE_POINTS = 60;

const condenseTrendData = (rows: AnalyticsTrendDatum[]): AnalyticsTrendDatum[] => {
    if (rows.length <= MAX_VISIBLE_POINTS) {
        return rows;
    }

    const bucketSize = Math.ceil(rows.length / MAX_VISIBLE_POINTS);
    const condensed: AnalyticsTrendDatum[] = [];

    for (let index = 0; index < rows.length; index += bucketSize) {
        const chunk = rows.slice(index, index + bucketSize);
        const firstDate = chunk[0]?.date ?? '';
        const lastDate = chunk[chunk.length - 1]?.date ?? firstDate;
        const numericKeys = Array.from(new Set(
            chunk.flatMap((row) => Object.keys(row).filter((key) => key !== 'date'))
        ));

        const aggregated: AnalyticsTrendDatum = {
            date: firstDate === lastDate ? firstDate : `${firstDate} - ${lastDate}`,
        };

        for (const key of numericKeys) {
            const values = chunk
                .map((row) => row[key])
                .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

            aggregated[key] = values.length
                ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2))
                : 0;
        }

        condensed.push(aggregated);
    }

    return condensed;
};

export function NutrientTrendChart({
    data,
    days: _days,
    title,
    description,
    type,
    t,
    className,
    emptyTitle = 'No chart data available',
    emptyMessage = 'Add meals in the selected range to see this chart.',
}: NutrientTrendChartProps) {
    const [useNormalized, setUseNormalized] = useState(false);
    const [hiddenNutrients, setHiddenNutrients] = useState<string[]>([]);
    const chartId = useId().replace(/:/g, '');
    const visibleKeys = type === 'macro'
        ? ['Calories', 'Protein', 'Carbohydrates', 'Fat']
        : type === 'micro'
            ? ['Sodium', 'Cholesterol', 'Saturated Fat']
            : ['weight'];

    const toggleVisibility = (e: { value?: string | number }) => {
        const value = String(e.value ?? '');
        setHiddenNutrients(prev =>
            prev.includes(value) ? prev.filter(n => n !== value) : [...prev, value]
        );
    };

    const hasData = data.some((day) =>
        visibleKeys.some((key) => typeof day[key] === 'number' && Number(day[key]) > 0)
    );

    // Normalize data if needed
    const chartData = useMemo(() => (useNormalized ? data.map((day) => {
        const normalized: AnalyticsTrendDatum = { ...day };
        Object.keys(day).forEach(key => {
            if (key === 'date') return;
            // Map keys to targets
            let target = 0;
            switch (key) {
                case 'Calories': target = t.calories; break;
                case 'Protein': target = t.protein; break;
                case 'Carbohydrates': target = t.carbs; break;
                case 'Fat': target = t.fat; break;
                case 'Fiber': target = t.fiber; break;
                case 'Sugar': target = t.sugar; break;
                case 'Sodium': target = t.sodium; break;
                case 'Cholesterol': target = t.cholesterol; break;
                case 'Saturated Fat': target = t.saturated_fat; break;
                case 'Unsaturated Fat': target = t.unsaturated_fat; break;
                case 'Trans-fat': target = t.trans_fat; break;
                default: target = 0;
            }
            if (target > 0 && typeof day[key] === 'number') {
                normalized[`${key}Pct`] = (day[key] / target) * 100;
            } else {
                normalized[`${key}Pct`] = 0;
            }
        });
        return normalized;
    }) : data), [data, t, useNormalized]);
    const displayData = useMemo(() => condenseTrendData(chartData), [chartData]);
    const displayPointCount = displayData.length;
    const isCondensed = displayData.length < chartData.length;

    // Define gradients based on type
    const renderGradients = () => {
        if (type === 'macro') {
            return (
                <defs>
                    <linearGradient id={`${chartId}-gradCaloriesLine`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.calories.start} stopOpacity={0.4} /><stop offset="95%" stopColor={COLORS.calories.start} stopOpacity={0.0} /></linearGradient>
                    <linearGradient id={`${chartId}-gradProteinLine`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.protein.start} stopOpacity={0.4} /><stop offset="95%" stopColor={COLORS.protein.start} stopOpacity={0.0} /></linearGradient>
                    <linearGradient id={`${chartId}-gradCarbsLine`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.carbs.start} stopOpacity={0.4} /><stop offset="95%" stopColor={COLORS.carbs.start} stopOpacity={0.0} /></linearGradient>
                    <linearGradient id={`${chartId}-gradFatLine`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.fat.start} stopOpacity={0.4} /><stop offset="95%" stopColor={COLORS.fat.start} stopOpacity={0.0} /></linearGradient>
                    <linearGradient id={`${chartId}-gradFiberLine`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.fiber.start} stopOpacity={0.4} /><stop offset="95%" stopColor={COLORS.fiber.start} stopOpacity={0.0} /></linearGradient>
                </defs>
            );

        } else if (type === 'weight') {
            return (
                <defs>
                    <linearGradient id={`${chartId}-gradWeightLine`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.4} /><stop offset="95%" stopColor="#10b981" stopOpacity={0.0} /></linearGradient>
                </defs>
            );
        } else {
            return (
                <defs>
                    <linearGradient id={`${chartId}-gradSodiumLine`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.sodium.start} stopOpacity={0.4} /><stop offset="95%" stopColor={COLORS.sodium.start} stopOpacity={0.0} /></linearGradient>
                    <linearGradient id={`${chartId}-gradCholesterolLine`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.cholesterol.start} stopOpacity={0.4} /><stop offset="95%" stopColor={COLORS.cholesterol.start} stopOpacity={0.0} /></linearGradient>
                    <linearGradient id={`${chartId}-gradSatFatLine`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.satFat.start} stopOpacity={0.4} /><stop offset="95%" stopColor={COLORS.satFat.start} stopOpacity={0.0} /></linearGradient>
                </defs>
            );
        }
    };

    return (
        <Card className={cn("shadow-sm transition-all duration-300 hover:shadow-md h-full flex flex-col", className)}>
            <CardHeader className="flex-none">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            {useNormalized ? `${title} (% of Goal)` : title}
                            <div className="group relative">
                                <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-slate-900 text-white text-xs rounded shadow-lg z-50">
                                    {useNormalized ? "Normalized to % of daily limits." : ""}
                                </div>
                            </div>
                        </CardTitle>
                        <CardDescription>{description}</CardDescription>
                        {isCondensed && (
                            <p className="text-xs text-slate-500">
                                Showing averaged buckets to keep long-range trends readable.
                            </p>
                        )}
                    </div>
                    {/* View Mode Toggle */}
                    <div className="bg-gray-100 p-1 rounded-lg flex text-xs">
                        <button onClick={() => setUseNormalized(false)} className={cn("px-3 py-1.5 font-medium rounded-md transition-all", !useNormalized ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-900")}>Standard</button>
                        <button onClick={() => setUseNormalized(true)} className={cn("px-3 py-1.5 font-medium rounded-md transition-all", useNormalized ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-900")}>% Goal</button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 h-[360px] min-h-[320px] mt-0 flex items-center justify-center p-6 pt-0 pb-4">
                {hasData ? (
                    <ResponsiveContainer width="100%" height={320}>
                        <AreaChart data={displayData} margin={{ top: 20, right: 35, left: 15, bottom: 25 }}>
                            {renderGradients()}
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                            <XAxis
                                dataKey="date"
                                stroke="#94a3b8"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                                tick={{ fill: '#64748b' }}
                                interval={0}
                                tickFormatter={(value, index) => {
                                    if (displayPointCount <= 7) return value;
                                    if (displayPointCount <= 30) return index % 3 === 0 ? value : '';
                                    if (displayPointCount <= 60) return index % 6 === 0 ? value : '';
                                    return index % 10 === 0 ? value : '';
                                }}
                            />
                            {useNormalized ? (
                                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} unit="%" tick={{ fill: '#64748b' }} />
                            ) : (
                                type === 'macro' ? (
                                    <>
                                        <YAxis yAxisId="cal" orientation="left" stroke={COLORS.calories.solid} fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatAxisValue} tick={{ fill: COLORS.calories.solid }} />
                                        <YAxis yAxisId="grams" orientation="right" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                                    </>
                                ) : type === 'weight' ? (
                                    <>
                                        <YAxis yAxisId="kg" orientation="left" stroke="#10b981" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}kg`} tick={{ fill: '#10b981' }} domain={['dataMin - 1', 'dataMax + 1']} />
                                    </>
                                ) : (
                                    <>
                                        <YAxis yAxisId="mg" orientation="left" stroke={COLORS.sodium.solid} fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatAxisValue} tick={{ fill: COLORS.sodium.solid }} />
                                        <YAxis yAxisId="g" orientation="right" stroke={COLORS.satFat.solid} fontSize={11} tickLine={false} axisLine={false} tick={{ fill: COLORS.satFat.solid }} />
                                    </>
                                )
                            )}
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeDasharray: '3 3' }} />
                            <Legend onClick={toggleVisibility} wrapperStyle={{ cursor: 'pointer', paddingTop: '15px' }} iconType="circle" iconSize={10} />
                            {useNormalized && <ReferenceLine y={100} yAxisId="left" stroke={COLORS.good} strokeDasharray="5 5" strokeWidth={2} />}

                            {type === 'macro' ? (
                                <>
                                    <Area yAxisId={useNormalized ? "left" : "cal"} type="monotone" dataKey={useNormalized ? "CaloriesPct" : "Calories"} name="Calories" stroke={COLORS.calories.solid} fill={`url(#${chartId}-gradCaloriesLine)`} strokeWidth={3} hide={hiddenNutrients.includes('Calories')} dot={false} isAnimationActive={false} />
                                    <Area yAxisId={useNormalized ? "left" : "grams"} type="monotone" dataKey={useNormalized ? "ProteinPct" : "Protein"} name="Protein" stroke={COLORS.protein.solid} fill={`url(#${chartId}-gradProteinLine)`} strokeWidth={2.5} hide={hiddenNutrients.includes('Protein')} dot={false} isAnimationActive={false} />
                                    <Area yAxisId={useNormalized ? "left" : "grams"} type="monotone" dataKey={useNormalized ? "CarbohydratesPct" : "Carbohydrates"} name="Carbohydrates" stroke={COLORS.carbs.solid} fill={`url(#${chartId}-gradCarbsLine)`} strokeWidth={2.5} hide={hiddenNutrients.includes('Carbohydrates')} dot={false} isAnimationActive={false} />
                                    <Area yAxisId={useNormalized ? "left" : "grams"} type="monotone" dataKey={useNormalized ? "FatPct" : "Fat"} name="Fat" stroke={COLORS.fat.solid} fill={`url(#${chartId}-gradFatLine)`} strokeWidth={2.5} hide={hiddenNutrients.includes('Fat')} dot={false} isAnimationActive={false} />
                                </>
                            ) : type === 'weight' ? (
                                <>
                                    <Area yAxisId={useNormalized ? "left" : "kg"} type="monotone" dataKey={"weight"} name="Weight" stroke="#10b981" fill={`url(#${chartId}-gradWeightLine)`} strokeWidth={3} dot={false} isAnimationActive={false} />
                                </>
                            ) : (
                                <>
                                    <Area yAxisId={useNormalized ? "left" : "mg"} type="monotone" dataKey={useNormalized ? "SodiumPct" : "Sodium"} name="Sodium" stroke={COLORS.sodium.solid} fill={`url(#${chartId}-gradSodiumLine)`} strokeWidth={2.5} hide={hiddenNutrients.includes('Sodium')} dot={false} isAnimationActive={false} />
                                    <Area yAxisId={useNormalized ? "left" : "mg"} type="monotone" dataKey={useNormalized ? "CholesterolPct" : "Cholesterol"} name="Cholesterol" stroke={COLORS.cholesterol.solid} fill={`url(#${chartId}-gradCholesterolLine)`} strokeWidth={2.5} hide={hiddenNutrients.includes('Cholesterol')} dot={false} isAnimationActive={false} />
                                    <Area yAxisId={useNormalized ? "left" : "g"} type="monotone" dataKey={useNormalized ? "Saturated FatPct" : "Saturated Fat"} name="Saturated Fat" stroke={COLORS.satFat.solid} fill={`url(#${chartId}-gradSatFatLine)`} strokeWidth={2.5} hide={hiddenNutrients.includes('Saturated Fat')} dot={false} isAnimationActive={false} />
                                </>
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                        <p className="text-sm font-semibold text-slate-700">{emptyTitle}</p>
                        <p className="mt-2 max-w-sm text-sm text-slate-500">{emptyMessage}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
