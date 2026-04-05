import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { NutrientStats, AdvancedStats, WeightHistory, MealDistribution } from '@/services/analytics.service';
import type { Patient } from '@/types';
import { formatMacroTargetSplitLabel, getNutrientTargets } from '@/utils/nutrition';
import { WeightTrendChart } from './charts/WeightTrendChart';
import { NutrientTrendChart } from './charts/NutrientTrendChart';
import { CalorieCompositionChart } from './charts/CalorieCompositionChart';
import DeficiencyAlert from './DeficiencyAlert';
import FoodMoodChart from './FoodMoodChart';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, RadarChart,
    PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ReferenceLine,
    XAxis, YAxis, CartesianGrid, ComposedChart, Line
} from 'recharts';
import { Scale, Brain, Heart } from 'lucide-react';
import { type SymptomLog } from '@/services/vital-signs.service';

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

// Color palette
const COLORS = {
    protein: { start: '#22c55e', end: '#16a34a' },
    carbs: { start: '#eab308', end: '#ca8a04', solid: '#ca8a04' },
    fiber: { start: '#8b5cf6', end: '#7c3aed' },
    sodium: { start: '#3b82f6', end: '#2563eb' },
    fat: { start: '#ef4444', end: '#dc2626', solid: '#dc2626' },
    satFat: { start: '#f87171', end: '#dc2626' },
    unsatFat: { start: '#4ade80', end: '#22c55e' },
    cholesterol: { start: '#f97316', end: '#c2410c' },
    sugar: { start: '#ec4899', end: '#db2777' },
    coral: { start: '#fb7185', end: '#f43f5e' },
    good: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6'
};

// Gradient to solid color mapping for tooltips
const GRADIENT_COLOR_MAP: Record<string, string> = {
    'url(#gradWater)': '#3b82f6',
    'url(#gradSymptom)': '#f43f5e',
    'url(#gradSugarBar)': '#ec4899',
    'url(#gradFiberBar)': '#8b5cf6',
};

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg">
                <p className="font-bold text-gray-800 mb-1 text-sm">{label}</p>
                <div className="space-y-0.5">
                    {payload.map((p: any) => {
                        // Extract color from various sources
                        let color = p.color || p.fill || p.payload?.fill;
                        // Handle gradient fills
                        if (color && color.startsWith('url(')) {
                            color = GRADIENT_COLOR_MAP[color] || '#6b7280';
                        }
                        if (p.value === null || p.value === undefined) {
                            return null;
                        }
                        return (
                            <div key={p.name || p.dataKey} className="flex items-center gap-2 text-xs">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color || '#6b7280' }} />
                                <span className="text-gray-600">{p.name}:</span>
                                <span className="font-semibold text-gray-900">{Number(p.value).toFixed(1)}</span>
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
    currentPatient, stats, advancedStats, weightHistory, distribution, symptomHistory, waterHistory, period, setPeriod
}: DietitianAnalyticsViewProps) {

    const days = period === 'weekly' ? 7 : 30;

    // Calculate Targets
    const t = getNutrientTargets(currentPatient, advancedStats?.tdee);
    const targetMacroLabel = useMemo(() => formatMacroTargetSplitLabel(t), [t]);

    const symptomTimelineData = useMemo(() => {
        if (!stats?.dates.length) return [];

        const logsByDate = symptomHistory.reduce((acc, log) => {
            if (!log.date) return acc;
            const dateKey = log.date.substring(0, 10);
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(log);
            return acc;
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

    // Calorie composition for chart
    const avgProtein = useMemo(() => (stats?.macro_nutrients.find(n => n.name === 'Protein')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);
    const avgCarbs = useMemo(() => (stats?.macro_nutrients.find(n => n.name === 'Carbohydrates')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);
    const avgFat = useMemo(() => (stats?.macro_nutrients.find(n => n.name === 'Fat')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);
    const avgSugar = useMemo(() => (stats?.limiting_nutrients.find(n => n.name === 'Sugar')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);
    const avgSodium = useMemo(() => (stats?.micro_nutrients.find(n => n.name === 'Sodium')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);
    const avgChol = useMemo(() => (stats?.micro_nutrients.find(n => n.name === 'Cholesterol')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);
    const avgSatFat = useMemo(() => (stats?.limiting_nutrients.find(n => n.name === 'Saturated Fat')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);
    const avgTransFat = useMemo(() => (stats?.limiting_nutrients.find(n => n.name === 'Trans-fat')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);

    // Fat quality data
    const fatData = useMemo(() => [
        { name: 'Saturated', value: stats?.limiting_nutrients.find(n => n.name === 'Saturated Fat')?.data.reduce((a, b) => a + b, 0) || 0 },
        { name: 'Unsaturated', value: stats?.limiting_nutrients.find(n => n.name === 'Unsaturated Fat')?.data.reduce((a, b) => a + b, 0) || 0 },
        { name: 'Trans-fat', value: stats?.limiting_nutrients.find(n => n.name === 'Trans-fat')?.data.reduce((a, b) => a + b, 0) || 0 },
    ], [stats]);
    const totalFat = fatData.reduce((a, b) => a + b.value, 0);

    // Heart radar data
    const heartRadarData = useMemo(() => [
        { nutrient: 'Sodium', value: Math.min((avgSodium / t.sodium) * 100, 150), pct: Math.min((avgSodium / t.sodium) * 100, 150) },
        { nutrient: 'Sat. Fat', value: Math.min((avgSatFat / t.saturated_fat) * 100, 150), pct: Math.min((avgSatFat / t.saturated_fat) * 100, 150) },
        { nutrient: 'Sugar', value: Math.min((avgSugar / t.sugar) * 100, 150), pct: Math.min((avgSugar / t.sugar) * 100, 150) },
        { nutrient: 'Trans Fat', value: Math.min((avgTransFat / t.trans_fat) * 100, 150), pct: Math.min((avgTransFat / t.trans_fat) * 100, 150) },
        { nutrient: 'Cholesterol', value: Math.min((avgChol / t.cholesterol) * 100, 150), pct: Math.min((avgChol / t.cholesterol) * 100, 150) },
    ], [avgSodium, avgChol, avgSatFat, avgSugar, avgTransFat, t]);

    // Transform Stats to Trend Data for Charts
    const trendData = useMemo(() => {
        if (!stats) return [];
        return stats.dates.map((date, i) => {
            const day: any = {
                date: new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                Calories: stats.calories[i] || 0
            };

            stats.macro_nutrients.forEach(n => day[n.name] = n.data[i] || 0);
            stats.micro_nutrients.forEach(n => day[n.name] = n.data[i] || 0);
            stats.limiting_nutrients.forEach(n => day[n.name] = n.data[i] || 0);

            return day;
        });
    }, [stats]);



    if (!stats) return null;

    return (
        <div className="space-y-6">
            {/* Period Selector */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Analytics Charts</h3>
                    <p className="text-sm text-slate-500">Comprehensive patient nutrition tracking</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setPeriod('weekly')} className={cn("h-8 rounded-lg font-bold", period === 'weekly' ? "bg-white border border-slate-200 text-slate-900 shadow-sm" : "text-slate-400")}>7 Days</Button>
                    <Button variant="ghost" size="sm" onClick={() => setPeriod('monthly')} className={cn("h-8 rounded-lg font-bold", period === 'monthly' ? "bg-white border border-slate-200 text-slate-900 shadow-sm" : "text-slate-400")}>30 Days</Button>
                </div>
            </div>

            {/* Charts - Line charts full width, others in grid */}
            <div className="space-y-6">
                {/* Macronutrient Trends - Full Width */}
                <NutrientTrendChart
                    data={trendData}
                    days={days}
                    title="Macronutrient Trends"
                    description="Daily intake of Calories, Protein, Carbs, and Fat"
                    type="macro"
                    t={t}
                    className="border-slate-100 shadow-sm bg-white rounded-2xl"
                />

                {/* Grid for Composition, Meal Timing, and Micro Trends */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Calorie Composition */}
                    <CalorieCompositionChart
                        avgProtein={avgProtein}
                        avgCarbs={avgCarbs}
                        avgFat={avgFat}
                        totalKcal={advancedStats?.avg_daily_intake || 0}
                        targetLabel={targetMacroLabel}
                        className="border-slate-100 shadow-sm bg-white rounded-2xl"
                    />

                    {/* Meal Timing */}
                    <Card className="shadow-sm bg-white border-slate-100 rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-base font-bold">Meal Timing</CardTitle>
                            <CardDescription className="text-sm">Calorie distribution by meal</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[280px] flex flex-col">
                            <div className="flex-1">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={distribution?.distribution || []}
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={4}
                                            dataKey="value"
                                            cornerRadius={6}
                                        >
                                            {(distribution?.distribution || []).map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={[COLORS.protein.start, COLORS.carbs.start, COLORS.fiber.start, COLORS.sodium.start][index % 4]} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            {/* Legend */}
                            <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                                {(distribution?.distribution || []).map((item, index) => (
                                    <div key={item.name} className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg">
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: [COLORS.protein.start, COLORS.carbs.start, COLORS.fiber.start, COLORS.sodium.start][index % 4] }}
                                        />
                                        <span className="text-slate-600 truncate">{item.name}</span>
                                        <span className="ml-auto font-semibold text-slate-900">{Math.round(item.value)} kcal</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Weight Trend - Full Width */}
                <WeightTrendChart
                    weightHistory={weightHistory}
                    days={days}
                    className="border-slate-100 shadow-sm bg-white rounded-2xl"
                />

                {/* Micronutrient & Lipid Trends - Full Width */}
                <NutrientTrendChart
                    data={trendData}
                    days={days}
                    title="Micronutrient & Lipid Trends"
                    description="Sodium, Cholesterol, and Saturated Fat tracking"
                    type="micro"
                    t={t}
                    className="border-slate-100 shadow-sm bg-white rounded-2xl"
                />

                {/* Clinical Vitals Analytics - 3 Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Hydration Trend Chart */}
                    <Card className="h-[360px] shadow-sm bg-white border-slate-100 rounded-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                                </svg>
                                Hydration Trend
                            </CardTitle>
                            <CardDescription className="text-xs">Patient's daily water intake</CardDescription>
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
                                <div className="h-full flex items-center justify-center text-sm text-slate-400">
                                    No hydration data logged
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Symptom Timeline Chart */}
                    <Card className="h-[360px] shadow-sm bg-white border-slate-100 rounded-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                                <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Symptom Timeline
                            </CardTitle>
                            <CardDescription className="text-xs">Daily average severity and number of symptom logs</CardDescription>
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
                                <div className="h-full flex items-center justify-center text-sm text-slate-400">
                                    No symptoms logged
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Deficiency Alert - Keep as-is (already analytics) */}
                    <div className="h-[360px]">
                        <DeficiencyAlert
                            nutrients={[...(stats?.macro_nutrients || []), ...(stats?.micro_nutrients || [])]}
                            limits={{
                                'Protein': { daily: t.protein },
                                'Fiber': { daily: t.fiber },
                                'Sodium': { daily: t.sodium },
                                'Cholesterol': { daily: t.cholesterol },
                                'Saturated Fat': { daily: t.saturated_fat },
                                'Sugar': { daily: t.sugar },
                            }}
                        />
                    </div>
                </div>

                {/* Food-Mood Correlation - Full Width */}
                <FoodMoodChart
                    dates={stats?.dates || []}
                    nutrients={[
                        ...(stats?.macro_nutrients || []),
                        ...(stats?.micro_nutrients || []),
                        ...(stats?.limiting_nutrients || []),
                    ]}
                    symptomLogs={symptomHistory}
                />

                {/* Fat Quality & Glycemic Control - 2 Column Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Fat Quality Analysis */}
                    <Card className="shadow-sm bg-white border-slate-100 rounded-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-bold">
                                <Scale className="w-5 h-5 text-rose-500" /> Fat Quality Analysis
                            </CardTitle>
                            <CardDescription className="text-sm">Lipid breakdown</CardDescription>
                        </CardHeader>
                        <CardContent className="h-100 flex flex-col items-center gap-4">
                            <div className="w-full h-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={fatData}
                                            innerRadius={70}
                                            outerRadius={100}
                                            paddingAngle={4}
                                            dataKey="value"
                                            cornerRadius={6}
                                        >
                                            <Cell fill={COLORS.satFat.start} />
                                            <Cell fill={COLORS.unsatFat.start} />
                                            <Cell fill={COLORS.cholesterol.start} />
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-gray-800">{totalFat.toFixed(1)}</div>
                                        <span className="text-xs text-gray-500">grams</span>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full grid grid-cols-3 gap-2 text-center text-xs">
                                {fatData.map((item, i) => (
                                    <div key={item.name} className="w-full px-2 py-4 rounded-lg bg-gray-50">
                                        <div className="font-semibold">{item.name}</div>
                                        <div className="text-lg font-bold" style={{ color: [COLORS.satFat.start, COLORS.unsatFat.start, COLORS.cholesterol.start][i] }}>
                                            {totalFat > 0 ? Math.round((item.value / totalFat) * 100) : 0}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Glycemic Control */}
                    <Card className="shadow-sm bg-white border-slate-100 rounded-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-bold">
                                <Brain className="w-5 h-5 text-pink-500" /> Glycemic Control
                            </CardTitle>
                            <CardDescription className="text-sm">Sugar vs Fiber balance over time</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[420px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={trendData} margin={{ top: 20, right: 20, left: -10, bottom: 25 }}>
                                    <defs>
                                        <linearGradient id="gradSugarBar" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={COLORS.sugar.start} stopOpacity={0.95} />
                                            <stop offset="100%" stopColor={COLORS.sugar.end} stopOpacity={0.85} />
                                        </linearGradient>
                                        <linearGradient id="gradFiberBar" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={COLORS.fiber.start} stopOpacity={0.95} />
                                            <stop offset="100%" stopColor={COLORS.fiber.end} stopOpacity={0.85} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#94a3b8"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        interval={0}
                                        dy={10}
                                        tick={{ fill: '#64748b' }}
                                        tickFormatter={(val, index) => {
                                            if (days <= 7) return val;
                                            if (days <= 30) return index % 3 === 0 ? val : '';
                                            return index % 6 === 0 ? val : '';
                                        }}
                                    />
                                    <YAxis
                                        stroke="#94a3b8"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: '#64748b' }}
                                        label={{ value: 'Grams', angle: -90, position: 'insideLeft', offset: 15, fill: '#64748b', fontSize: 12 }}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.4 }} />
                                    <Bar
                                        dataKey="Sugar"
                                        fill="url(#gradSugarBar)"
                                        radius={50}
                                        name="Sugar (g)"
                                        maxBarSize={36}
                                    />
                                    <Bar
                                        dataKey="Fiber"
                                        fill="url(#gradFiberBar)"
                                        radius={50}
                                        name="Fiber (g)"
                                        maxBarSize={36}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Cardiovascular Health - 2 Column Grid */}
                <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Heart className="w-5 h-5 text-red-500" /> Cardiovascular Health
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Risk Assessment */}
                        <Card className="shadow-sm bg-white border-slate-100 rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-base font-bold">Risk Assessment</CardTitle>
                                <CardDescription className="text-sm">Key nutrients vs daily limits</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[320px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart data={heartRadarData}>
                                        <PolarGrid stroke="#E5E7EB" />
                                        <PolarAngleAxis dataKey="nutrient" tick={{ fill: '#6b7280', fontSize: 11 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                        <Radar name="Intake %" dataKey="value" stroke={COLORS.coral.start} strokeWidth={2} fill={COLORS.coral.start} fillOpacity={0.4} />
                                        <Tooltip content={<CustomTooltip />} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Metabolic Matrix - Scatter */}
                        <Card className="shadow-sm bg-white border-slate-100 rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-base font-bold">Metabolic Matrix</CardTitle>
                                <CardDescription className="text-sm">Carbs vs Fat patterns</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[320px]">
                                <div className="text-sm text-center text-gray-500 py-20">
                                    Scatter plot visualization showing daily carb/fat balance patterns
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
