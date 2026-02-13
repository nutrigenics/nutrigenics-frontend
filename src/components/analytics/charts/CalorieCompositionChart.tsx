import {
    RadialBarChart, RadialBar, ResponsiveContainer, Tooltip
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { COLORS } from '../constants';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface CalorieCompositionChartProps {
    avgProtein: number; // in grams
    avgCarbs: number; // in grams
    avgFat: number; // in grams
    totalKcal: number;
    className?: string;
}

export function CalorieCompositionChart({ avgProtein, avgCarbs, avgFat, totalKcal, className }: CalorieCompositionChartProps) {
    const macroRatioData = useMemo(() => {
        const safeTotal = totalKcal || 1;
        return [
            { name: 'Protein', value: Math.round(((avgProtein * 4) / safeTotal) * 100), kcal: avgProtein * 4, color: COLORS.emerald.start, fill: COLORS.emerald.start },
            { name: 'Carbohydrates', value: Math.round(((avgCarbs * 4) / safeTotal) * 100), kcal: avgCarbs * 4, color: COLORS.amber.start, fill: COLORS.amber.start },
            { name: 'Fat', value: Math.round(((avgFat * 9) / safeTotal) * 100), kcal: avgFat * 9, color: COLORS.coral.start, fill: COLORS.coral.start }
        ];
    }, [avgProtein, avgCarbs, avgFat, totalKcal]);

    return (
        <Card className={cn("shadow-sm transition-all duration-300 hover:shadow-md h-full", className)}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">Calorie Composition</CardTitle>
                        <CardDescription>Target: 30P / 40C / 30F</CardDescription>
                    </div>
                    <Info className="w-5 h-5 text-gray-300" />
                </div>
            </CardHeader>
            <CardContent className="min-h-[300px] flex flex-col items-center justify-between p-6">
                <div className="h-[200px] w-full max-w-[250px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            innerRadius="50%"
                            outerRadius="100%"
                            barSize={15}
                            data={macroRatioData}
                            startAngle={90}
                            endAngle={-270}
                        >
                            <RadialBar
                                label={{ position: 'insideStart', fill: '#fff', fontSize: 10, fontWeight: 'bold' }}
                                background={{ fill: '#f1f5f9' }}
                                dataKey="value"
                                cornerRadius={50}
                            />
                            <Tooltip
                                wrapperStyle={{ zIndex: 1000 }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl">
                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.fill }} />
                                                    <span className="text-gray-900">{data.name}</span>
                                                </div>
                                                <div className="mt-1 pl-4 text-xs text-gray-500">
                                                    <span className="font-bold text-gray-800 text-base">{data.value}%</span>
                                                    <span className="ml-1">({Math.round(data.kcal)} kcal)</span>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                                cursor={false}
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                            <span className="text-xs text-muted-foreground uppercase tracking-widest">Total</span>
                            <div className="text-lg font-bold text-gray-800">{Math.round(totalKcal)}</div>
                            <span className="text-[9px] text-gray-500">kcal</span>
                        </div>
                    </div>
                </div>

                <div className="w-full grid grid-cols-3 gap-2 mt-2">
                    {macroRatioData.map((m) => (
                        <div key={m.name} className="flex flex-col items-center p-2 rounded-xl bg-gray-50/50 border border-gray-100 transition-colors hover:bg-white">
                            <div className="w-2 h-2 rounded-full mb-2" style={{ backgroundColor: m.color }} />
                            <span className="text-xs font-semibold text-gray-600 mb-0.5">{m.name.slice(0, 4)}</span>
                            <span className="text-sm font-bold" style={{ color: m.color }}>{m.value}%</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
