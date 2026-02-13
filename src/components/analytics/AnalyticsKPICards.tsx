
import { useMemo } from 'react';
import { AnalyticsMetricCard } from '@/components/ui/analytics-metric-card';
import {
    TrendingUp, TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Patient } from '@/types';
import { type NutrientStats, type ComplianceStats, type AdvancedStats, type WeightHistory } from '@/services/analytics.service';
import { getNutrientTargets } from '@/utils/nutrition';
import { calculateWeightImpact, calculateAverages, calculateNutrientGaps, calculateHeartScore, calculateCarbQualityScore } from './utils';

interface AnalyticsKPICardsProps {
    patient: Patient | null;
    stats: NutrientStats | null;
    compliance: ComplianceStats | null;
    advancedStats: AdvancedStats | null;
    weightHistory: WeightHistory | null;
    days: number;
}

export function AnalyticsKPICards({ patient, stats, compliance, advancedStats, days }: AnalyticsKPICardsProps) {

    // Calculations
    const weightImpact = useMemo(() => calculateWeightImpact(advancedStats), [advancedStats]);
    const t = useMemo(() => getNutrientTargets(patient, advancedStats?.tdee), [patient, advancedStats]);
    const avgs = useMemo(() => calculateAverages(stats, days), [stats, days]);
    const nutrientGaps = useMemo(() => calculateNutrientGaps(stats, days, t), [stats, days, t, avgs]);
    const heartScore = useMemo(() => calculateHeartScore(avgs, t), [avgs, t]);
    const carbQualityScore = useMemo(() => calculateCarbQualityScore(avgs), [avgs]);

    const weightKg = patient?.weight || 70;
    const proteinPerKg = avgs.protein / weightKg;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Adherence */}
            {/* Adherence */}
            <AnalyticsMetricCard
                title="Adherence Rate"
                titleClassName="text-emerald-700"
                badge={
                    <div className="px-2 py-0.5 rounded-full bg-emerald-100/80 text-xs font-bold text-emerald-700">
                        {compliance?.streak || 0} Day Streak 🔥
                    </div>
                }
                value={<span className="text-emerald-600">{compliance?.compliance_rate || 0}</span>}
                subtitle={<span className="text-emerald-400">%</span>}
            >
                <div className="mt-3">
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-emerald-700">Last 7 Days Activity</span>
                        <span className="text-gray-400">{compliance?.streak || 0} Day Streak</span>
                    </div>
                    <div className="flex justify-between gap-1">
                        {Array.from({ length: 7 }).map((_, i) => {
                            // Mock logic for activity visualization since we don't have explicit daily logs here
                            // In a real app, check stats.dates against specific past dates
                            const isActive = i < (compliance?.streak || 0);
                            return (
                                <div
                                    key={i}
                                    className={cn(
                                        "h-2 flex-1 rounded-full transition-all duration-500",
                                        isActive ? "bg-emerald-500" : "bg-gray-100"
                                    )}
                                />
                            );
                        })}
                    </div>
                </div>
            </AnalyticsMetricCard>

            {/* Weight Impact */}
            {/* Weight Impact */}
            <AnalyticsMetricCard
                title="Est. Weight Impact"
                titleClassName={weightImpact.color}
                value={
                    <div className={cn("text-3xl font-black flex items-center gap-2", weightImpact.color)}>
                        {weightImpact.value > 0 ? '+' : ''}{weightImpact.value}
                        <span className="text-lg font-semibold text-gray-400">kg/wk</span>
                        {weightImpact.value > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                }
            >
                <div className="mt-3">
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-gray-500">Energy Balance</span>
                        <span className="text-gray-400">{Math.round(advancedStats?.avg_daily_intake || 0)} / {Math.round(advancedStats?.tdee || 2000)} kcal</span>
                    </div>
                    <div className="relative h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        {/* TDEE Marker */}
                        <div className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-10" style={{ left: '70%' }} />
                        {/* Intake Bar */}
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-700",
                                (advancedStats?.avg_daily_intake || 0) > (advancedStats?.tdee || 2000) ? "bg-rose-500" : "bg-blue-500"
                            )}
                            style={{ width: `${Math.min(((advancedStats?.avg_daily_intake || 0) / (advancedStats?.tdee || 2000)) * 70, 100)}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Intake</span>
                        <span className="pl-4">Target</span>
                    </div>
                </div>
            </AnalyticsMetricCard>

            {/* Protein Score */}
            {/* Protein Score */}
            <AnalyticsMetricCard
                title="Protein Intake"
                titleClassName="text-gray-500"
                value={<span className="text-slate-900">{proteinPerKg.toFixed(1)}</span>}
                subtitle={<span className="text-slate-400">g/kg</span>}
            >
                <div className="mt-3">
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-emerald-700">Daily Average</span>
                        <span className="text-gray-400">Target: 1.6 g/kg</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-teal-600 transition-all duration-700 shadow-sm" style={{ width: `${Math.min((proteinPerKg / 1.6) * 100, 100)}%` }} />
                    </div>
                </div>
            </AnalyticsMetricCard>

            {/* Nutrient Gaps */}
            {/* Nutrient Gaps */}
            <AnalyticsMetricCard
                title="Nutrient Gaps"
                titleClassName="text-gray-500"
                badge={
                    nutrientGaps.length === 0 ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">OPTIMAL</span>
                    ) : (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">ATTENTION</span>
                    )
                }
                contentClassName="flex flex-col justify-center min-h-[80px]"
            >
                {nutrientGaps.length > 0 ? (
                    <div>
                        <div className="text-3xl font-black text-amber-600 mb-1">{nutrientGaps.length}</div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Deficiencies Detected</p>
                        <div className="flex flex-wrap gap-1.5">
                            {nutrientGaps.slice(0, 3).map(g => (
                                <span key={g} className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-md uppercase border border-amber-100">{g}</span>
                            ))}
                            {nutrientGaps.length > 3 && <span className="text-xs text-gray-500 self-center">+{nutrientGaps.length - 3} more</span>}
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="text-3xl font-black text-emerald-600 mb-1">100<span className="text-lg text-emerald-400">%</span></div>
                        <p className="text-xs font-medium text-emerald-600/60 mt-1">
                            Nutrient Coverage Met
                        </p>
                    </div>
                )}
            </AnalyticsMetricCard>

            {/* Carb Quality */}
            {/* Carb Quality */}
            <AnalyticsMetricCard
                title="Glycemic Quality"
                titleClassName="text-gray-500"
                badge={
                    <div className={cn("text-xs font-bold px-2 py-0.5 rounded-full uppercase", carbQualityScore >= 0.2 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
                        {carbQualityScore >= 0.2 ? 'High Quality' : 'Optimize'}
                    </div>
                }
                value={<span className="text-slate-900">{carbQualityScore.toFixed(2)}</span>}
            >
                <div className="mt-3 space-y-2">
                    {/* Fiber */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold w-12 text-gray-500">Fiber</span>
                        <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min((avgs.fiber / 30) * 100, 100)}%` }} />
                        </div>
                        <span className="text-xs font-medium text-gray-400">{avgs.fiber.toFixed(0)}g</span>
                    </div>
                    {/* Sugar */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold w-12 text-gray-500">Sugar</span>
                        <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min((avgs.sugar / 50) * 100, 100)}%` }} />
                        </div>
                        <span className="text-xs font-medium text-gray-400">{avgs.sugar.toFixed(0)}g</span>
                    </div>
                </div>
            </AnalyticsMetricCard>

            {/* Heart Score */}
            <AnalyticsMetricCard
                title="Cardio Score"
                titleClassName="text-gray-600"
                value={
                    <div className={cn("text-3xl font-black flex items-center gap-2", heartScore >= 80 ? 'text-emerald-700' : 'text-orange-700')}>
                        {heartScore}
                        {/* <Heart className={cn("w-5 h-5", heartScore >= 80 ? 'text-emerald-500 fill-emerald-200' : 'text-orange-500')} /> */}
                    </div>
                }
            >
                <div className="absolute top-0 right-0 w-20 h-20 bg-rose-200/40 rounded-full blur-xl -mr-10 -mt-10 pointer-events-none" />
                {/* Risk Factors */}
                <div className="mt-3 flex justify-between gap-2">
                    {[
                        { label: 'Sodium', valid: avgs.sodium < 2300 },
                        { label: 'Sat. Fat', valid: avgs.satFat < 20 },
                        { label: 'Cholesterol', valid: avgs.cholesterol < 300 }
                    ].map(factor => (
                        <div key={factor.label} className="flex flex-col items-center bg-gray-50 rounded-lg p-1.5 flex-1">
                            <div className={cn("w-2 h-2 rounded-full mb-1", factor.valid ? "bg-emerald-500" : "bg-rose-500")} />
                            <span className="text-[9px] font-bold text-gray-500 leading-tight text-center">{factor.label}</span>
                        </div>
                    ))}
                </div>
            </AnalyticsMetricCard>
        </div>
    );
}
