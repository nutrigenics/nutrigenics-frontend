import {
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    ComposedChart,
    Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Scale } from 'lucide-react';
import { COLORS } from '../constants';
import { CustomTooltip } from './SharedComponents';
import { cn } from '@/lib/utils';
import type { WeightHistory } from '@/services/analytics.service';

interface WeightTrendChartProps {
    weightHistory: WeightHistory | null;
    days: number;
    className?: string;
}

const formatAxisValue = (value: number): string => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(0);
};

export function WeightTrendChart({ weightHistory, days: _days, className }: WeightTrendChartProps) {
    if (!weightHistory) return null;

    const weightChartData = weightHistory.dates.map((date, i) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: weightHistory.weights[i],
        calories: weightHistory.calories[i]
    }));

    const hasData = weightChartData.length > 0 && weightChartData.some(d => d.weight !== null && d.weight !== undefined && d.weight > 0);
    const startWeight = weightChartData.find(d => d.weight)?.weight;
    const endWeight = [...weightChartData].reverse().find(d => d.weight)?.weight;

    return (
        <Card className={cn("shadow-sm transition-all duration-300 hover:shadow-md bg-white border border-gray-100", className)}>
            <CardHeader className="border-b border-gray-50">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Scale className="w-5 h-5 text-teal-500" />
                            Weight Progression vs Intake
                        </CardTitle>
                        <CardDescription>Calories vs Weight</CardDescription>
                    </div>
                    {/* Weight Insight */}
                    <div className="flex items-center gap-4 text-sm hidden md:flex">
                        {hasData && (
                            <>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-700 rounded-full font-medium">
                                    Start: <span className="font-bold">{startWeight} kg</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-violet-50 text-violet-700 rounded-full font-medium">
                                    Now: <span className="font-bold">{endWeight} kg</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="h-[400px] mt-4 flex items-center justify-center p-4">
                {hasData ? (
                    <ResponsiveContainer width="100%" height={400}>
                        <ComposedChart data={weightChartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                            <defs>
                                <linearGradient id="gradWeight" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={COLORS.weight.start} stopOpacity={1} />
                                    <stop offset="100%" stopColor={COLORS.weight.end} stopOpacity={0.8} />
                                </linearGradient>
                                <linearGradient id="gradCalories" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={COLORS.calories.start} stopOpacity={0.6} />
                                    <stop offset="100%" stopColor={COLORS.calories.end} stopOpacity={0.2} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                            <XAxis
                                dataKey="date"
                                stroke="#94a3b8"
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={40}
                                dy={10}
                            />
                            <YAxis
                                yAxisId="left"
                                stroke={COLORS.weight.solid}
                                domain={['dataMin - 2', 'dataMax + 2']}
                                tick={{ fontSize: 11, fill: COLORS.weight.solid }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(v) => `${v}`}
                                label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', style: { fill: COLORS.weight.solid, fontSize: 12 }, offset: 10 }}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke={COLORS.calories.solid}
                                tick={{ fontSize: 11, fill: COLORS.calories.solid }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={formatAxisValue}
                                label={{ value: 'Calories', angle: 90, position: 'insideRight', style: { fill: COLORS.calories.solid, fontSize: 12 }, offset: 10 }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.4 }} />
                            <Legend wrapperStyle={{ paddingTop: '15px' }} iconType="circle" iconSize={10} />

                            <Bar
                                yAxisId="right"
                                dataKey="calories"
                                name="Calories"
                                fill="url(#gradCalories)"
                                radius={50}
                                maxBarSize={40}
                            />
                            <Area
                                yAxisId="left"
                                type="monotone"
                                dataKey="weight"
                                name="Weight"
                                stroke="url(#gradWeight)"
                                strokeWidth={3}
                                fill="url(#gradWeight)"
                                fillOpacity={0.15}
                                dot={false}
                                activeDot={{ r: 6, fill: COLORS.weight.start, stroke: '#fff', strokeWidth: 2 }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">No weight data available</div>
                )}
            </CardContent>
        </Card>
    );
}
