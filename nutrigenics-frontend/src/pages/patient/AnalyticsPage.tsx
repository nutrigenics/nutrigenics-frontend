import { useEffect, useState, useMemo } from 'react';
// MainLayout removed
// import { MainLayout } from '@/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  analyticsService,
  type NutrientStats,
  type ComplianceStats,
  type MealDistribution,
  type DailyHistory,
  type AdvancedStats
} from '@/services/analytics.service';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, Area,
  ComposedChart
} from 'recharts';
import {
  Loader2, Flame, Utensils,
  Zap, Scale, Clock, Heart, Brain, AlertTriangle, CheckCircle2, AlertCircle,
  Lightbulb, TrendingUp, TrendingDown, Sparkles, Info
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  Tooltip as ShadTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Patient } from '@/types';
import { cn } from '@/lib/utils';

// Premium Color Palette - Soft, Clinical, Modern
const COLORS = {
  // Primary Gradient Pairs
  teal: { start: '#14b8a6', end: '#0d9488' },
  coral: { start: '#fb7185', end: '#f43f5e' },
  amber: { start: '#fbbf24', end: '#f59e0b' },
  violet: { start: '#a78bfa', end: '#8b5cf6' },
  blue: { start: '#60a5fa', end: '#3b82f6' },
  emerald: { start: '#34d399', end: '#10b981' },
  rose: { start: '#fda4af', end: '#fb7185' },
  slate: { start: '#94a3b8', end: '#64748b' },
  // Semantic
  good: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6'
};

// Insight Component
const InsightBox = ({ type = 'info', icon: Icon = Lightbulb, children }: { type?: 'good' | 'warning' | 'info', icon?: any, children: React.ReactNode }) => {
  const styles = {
    good: 'bg-emerald-50 border-border text-emerald-800',
    warning: 'bg-amber-50 border-border text-amber-800',
    info: 'bg-blue-50 border-border text-blue-800'
  };
  const iconColors = { good: 'text-emerald-500', warning: 'text-amber-500', info: 'text-blue-500' };

  return (
    <div className={cn("w-[98%] mx-auto my-3 p-4 rounded-xl border flex items-start gap-3 text-sm", styles[type])}>
      <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", iconColors[type])} />
      <div>{children}</div>
    </div>
  );
};

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-xl border border-gray-100">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-medium text-gray-800">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const { profile } = useAuth();
  const patient = profile as Patient;
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [stats, setStats] = useState<NutrientStats | null>(null);
  const [compliance, setCompliance] = useState<ComplianceStats | null>(null);
  const [mealDist, setMealDist] = useState<MealDistribution | null>(null);
  const [history, setHistory] = useState<DailyHistory[]>([]);
  const [advanced, setAdvanced] = useState<AdvancedStats | null>(null);
  const [loading, setLoading] = useState(true);

  const days = period === 'weekly' ? 7 : 30;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsData, complianceData, mealData, historyData, advancedData] = await Promise.all([
          analyticsService.getPatientAnalytics(period),
          analyticsService.getComplianceStats(),
          analyticsService.getMealDistribution(days),
          analyticsService.getDailyHistory(days),
          analyticsService.getAdvancedStats()
        ]);
        setStats(statsData);
        setCompliance(complianceData);
        setMealDist(mealData);
        setHistory(historyData);
        setAdvanced(advancedData);
      } catch (error) {
        console.error("Failed to fetch analytics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period, days]);

  // --- Data Processing ---
  const weightKg = patient?.weight || 70;
  const proteinTarget = weightKg * 1.6;
  const fiberTarget = 25;

  const avgProtein = useMemo(() => (stats?.macro_nutrients.find(n => n.name === 'Protein')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);
  const avgFiber = useMemo(() => (stats?.macro_nutrients.find(n => n.name === 'Fiber')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);
  const avgCarbs = useMemo(() => (stats?.macro_nutrients.find(n => n.name === 'Carbohydrates')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);
  const avgSugar = useMemo(() => (stats?.limiting_nutrients.find(n => n.name === 'Sugar')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);
  const avgSodium = useMemo(() => (stats?.micro_nutrients.find(n => n.name === 'Sodium')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);
  const avgChol = useMemo(() => (stats?.micro_nutrients.find(n => n.name === 'Cholesterol')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);
  const avgSatFat = useMemo(() => (stats?.limiting_nutrients.find(n => n.name === 'Saturated Fat')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);
  const avgFat = useMemo(() => (stats?.macro_nutrients.find(n => n.name === 'Fat')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);

  const heartScore = useMemo(() => {
    let score = 100;
    if (avgSodium > 2300) score -= Math.min(30, ((avgSodium - 2300) / 2300) * 50);
    if (avgChol > 300) score -= Math.min(30, ((avgChol - 300) / 300) * 50);
    if (avgSatFat > 20) score -= Math.min(30, ((avgSatFat - 20) / 20) * 50);
    return Math.max(0, Math.round(score));
  }, [avgSodium, avgChol, avgSatFat]);

  const carbQualityScore = avgSugar > 0 ? (avgFiber / avgSugar) : 0;

  const trendData = useMemo(() => stats?.dates.map((date, i) => ({
    date: period === 'weekly' ? stats.weekdays?.[i] : date.slice(5),
    Calories: stats.calories[i] || 0,
    Protein: stats.macro_nutrients.find(n => n.name === 'Protein')?.data[i] || 0,
    Carbohydrates: stats.macro_nutrients.find(n => n.name === 'Carbohydrates')?.data[i] || 0,
    Fat: stats.macro_nutrients.find(n => n.name === 'Fat')?.data[i] || 0,
    Fiber: stats.macro_nutrients.find(n => n.name === 'Fiber')?.data[i] || 0,
    Sugar: stats.limiting_nutrients.find(n => n.name === 'Sugar')?.data[i] || 0,
    Sodium: stats.micro_nutrients.find(n => n.name === 'Sodium')?.data[i] || 0,
    Cholesterol: stats.micro_nutrients.find(n => n.name === 'Cholesterol')?.data[i] || 0,
    'Saturated Fat': stats.limiting_nutrients.find(n => n.name === 'Saturated Fat')?.data[i] || 0,
    'Unsaturated Fat': stats.limiting_nutrients.find(n => n.name === 'Unsaturated Fat')?.data[i] || 0,
    'Trans-fat': stats.limiting_nutrients.find(n => n.name === 'Trans-fat')?.data[i] || 0,
  })) || [], [stats, period]);

  const fatData = useMemo(() => [
    { name: 'Saturated', value: stats?.limiting_nutrients.find(n => n.name === 'Saturated Fat')?.data.reduce((a, b) => a + b, 0) || 0 },
    { name: 'Unsaturated', value: stats?.limiting_nutrients.find(n => n.name === 'Unsaturated Fat')?.data.reduce((a, b) => a + b, 0) || 0 },
    { name: 'Trans-fat', value: stats?.limiting_nutrients.find(n => n.name === 'Trans-fat')?.data.reduce((a, b) => a + b, 0) || 0 },
  ], [stats]);
  const totalFat = fatData.reduce((a, b) => a + b.value, 0);

  const macroRatioData = useMemo(() => {
    const totalKcal = advanced?.avg_daily_intake || 1;
    return [
      { name: 'Protein', value: Math.round(((avgProtein * 4) / totalKcal) * 100), kcal: avgProtein * 4, color: COLORS.emerald.start },
      { name: 'Carbs', value: Math.round(((avgCarbs * 4) / totalKcal) * 100), kcal: avgCarbs * 4, color: COLORS.amber.start },
      { name: 'Fat', value: Math.round(((avgFat * 9) / totalKcal) * 100), kcal: avgFat * 9, color: COLORS.coral.start }
    ];
  }, [avgProtein, avgCarbs, avgFat, advanced]);

  const heartRadarData = useMemo(() => [
    { nutrient: 'Sodium', value: avgSodium, max: 2300, pct: Math.min((avgSodium / 2300) * 100, 150), unit: 'mg' },
    { nutrient: 'Cholesterol', value: avgChol, max: 300, pct: Math.min((avgChol / 300) * 100, 150), unit: 'mg' },
    { nutrient: 'Sat. Fat', value: avgSatFat, max: 20, pct: Math.min((avgSatFat / 20) * 100, 150), unit: 'g' },
  ], [avgSodium, avgChol, avgSatFat]);

  // --- Dynamic Insights ---
  const energyInsight = useMemo(() => {
    const avgCal = (stats?.calories.reduce((a, b) => a + b, 0) || 0) / days;
    const tdee = advanced?.tdee || 2000;
    const diff = tdee - avgCal;
    if (diff > 300) return { type: 'warning' as const, text: `You're averaging ${Math.round(diff)} kcal below your energy needs. Consider adding nutrient-dense snacks like nuts or Greek yogurt.` };
    if (diff < -300) return { type: 'warning' as const, text: `You're ${Math.round(Math.abs(diff))} kcal over your target. Try portion control on carbohydrates to reduce intake.` };
    return { type: 'good' as const, text: `Excellent! Your calorie intake is well-balanced with your daily energy expenditure.` };
  }, [stats, advanced, days]);

  const macroInsight = useMemo(() => {
    const proteinPct = macroRatioData[0]?.value || 0;
    if (proteinPct < 25) return { type: 'warning' as const, text: `Protein is only ${proteinPct}% of your calories (target: 30%). Add lean meats, eggs, or legumes to boost muscle recovery.` };
    if (proteinPct > 35) return { type: 'info' as const, text: `High protein intake detected (${proteinPct}%). Great for muscle building, but ensure adequate hydration.` };
    return { type: 'good' as const, text: `Your macronutrient balance is on point! Protein, carbs, and fat are in a healthy ratio.` };
  }, [macroRatioData]);

  const fatInsight = useMemo(() => {
    const unsatPct = totalFat > 0 ? (fatData[1].value / totalFat) * 100 : 0;
    const hasTrans = fatData[2].value > 0;
    if (hasTrans) return { type: 'warning' as const, text: `Trans-fat detected! Even small amounts increase heart disease risk. Check labels for "partially hydrogenated oils".` };
    if (unsatPct > 60) return { type: 'good' as const, text: `${Math.round(unsatPct)}% of your fats are unsaturated (healthy fats from fish, nuts, olive oil). Keep it up!` };
    return { type: 'info' as const, text: `Try to shift your fat sources towards unsaturated options like avocados, salmon, and nuts.` };
  }, [fatData, totalFat]);

  const glycemicInsight = useMemo(() => {
    if (carbQualityScore >= 0.5) return { type: 'good' as const, text: `Your fiber-to-sugar ratio is exceptional (${carbQualityScore.toFixed(2)}). This helps maintain stable blood sugar and gut health.` };
    if (carbQualityScore >= 0.2) return { type: 'info' as const, text: `Carb quality is moderate. Aim for more whole grains and vegetables to boost fiber intake.` };
    return { type: 'warning' as const, text: `Low fiber-to-sugar ratio (${carbQualityScore.toFixed(2)}). Consider reducing sugary snacks and adding more fiber-rich foods.` };
  }, [carbQualityScore]);

  const heartInsight = useMemo(() => {
    const risks = heartRadarData.filter(d => d.value > d.max);
    if (risks.length === 0) return { type: 'good' as const, text: `All cardiovascular markers are within healthy limits. Your heart thanks you!` };
    const riskNames = risks.map(r => r.nutrient).join(' and ');
    return { type: 'warning' as const, text: `${riskNames} intake is elevated. Reduce processed foods, deli meats, and fried items.` };
  }, [heartRadarData]);

  if (loading && !stats) {
    return (
      <>
        <div className="flex items-center justify-center h-full min-h-[500px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-10 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-violet-500" />
              Nutrition Insights
            </h1>
            <p className="text-muted-foreground mt-1">Your personalized health analytics powered by data.</p>
          </div>
          <Select value={period} onValueChange={(v: 'weekly' | 'monthly') => setPeriod(v)}>
            <SelectTrigger className="w-[180px] bg-white shadow-sm">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Last 7 Days</SelectItem>
              <SelectItem value="monthly">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Section 1: Clinical KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Adherence */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 border-emerald-100 shadow-sm">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200/30 rounded-full blur-2xl -mr-10 -mt-10" />
            <CardHeader className="p-4 pb-2"><CardTitle className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Adherence</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-3xl font-bold text-emerald-600">{compliance?.compliance_rate || 0}%</div>
              <p className="text-xs text-emerald-600/70 mt-1">{compliance?.streak || 0} day streak 🔥</p>
            </CardContent>
          </Card>

          {/* Calorie Balance */}
          <Card className={cn("relative overflow-hidden shadow-sm", advanced?.balance_status === 'surplus' ? 'bg-gradient-to-br from-rose-50 to-pink-50 border-rose-100' : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100')}>
            <CardHeader className="p-4 pb-2"><CardTitle className={cn("text-xs font-semibold uppercase tracking-wide", advanced?.balance_status === 'surplus' ? 'text-rose-700' : 'text-blue-700')}>Calorie Balance</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0">
              <div className={cn("text-3xl font-bold flex items-center gap-1", advanced?.balance_status === 'surplus' ? 'text-rose-600' : 'text-blue-600')}>
                {advanced?.daily_balance ? (advanced.daily_balance > 0 ? '+' : '') + advanced.daily_balance : '--'}
                {advanced?.balance_status === 'surplus' ? <TrendingUp className="w-5 h-5 text-rose-500" /> : <TrendingDown className="w-5 h-5 text-blue-500" />}
              </div>
              <p className="text-xs opacity-70 mt-1">kcal vs TDEE</p>
            </CardContent>
          </Card>

          {/* Protein Score */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-2"><CardTitle className="text-xs font-semibold uppercase text-gray-500 tracking-wide">Protein Score</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-3xl font-bold flex items-baseline gap-1">
                {(avgProtein / weightKg).toFixed(1)} <span className="text-sm font-normal text-muted-foreground">g/kg</span>
              </div>
              <div className="h-2 w-full bg-gray-100 mt-3 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500" style={{ width: `${Math.min(((avgProtein / weightKg) / 1.6) * 100, 100)}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">Target: 1.6 g/kg body weight</p>
            </CardContent>
          </Card>

          {/* Fiber Score */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-2"><CardTitle className="text-xs font-semibold uppercase text-gray-500 tracking-wide">Fiber Score</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-3xl font-bold flex items-baseline gap-1">
                {avgFiber.toFixed(0)} <span className="text-sm font-normal text-muted-foreground">g</span>
              </div>
              <div className="h-2 w-full bg-gray-100 mt-3 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-purple-500 transition-all duration-500" style={{ width: `${Math.min((avgFiber / fiberTarget) * 100, 100)}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">Target: {fiberTarget}g daily</p>
            </CardContent>
          </Card>

          {/* Carb Quality */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-2"><CardTitle className="text-xs font-semibold uppercase text-gray-500 tracking-wide">Carb Quality</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-3xl font-bold">{carbQualityScore.toFixed(2)}</div>
              <div className={cn("text-xs mt-2 px-2 py-0.5 rounded-full inline-block", carbQualityScore >= 0.2 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
                {carbQualityScore >= 0.2 ? 'Good' : 'Needs Work'}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">Fiber ÷ Sugar (&gt;0.2 ideal)</p>
            </CardContent>
          </Card>

          {/* Heart Score */}
          <Card className={cn("relative overflow-hidden shadow-sm", heartScore < 80 ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100' : 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100')}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-rose-200/40 rounded-full blur-xl -mr-8 -mt-8" />
            <CardHeader className="p-4 pb-2"><CardTitle className="text-xs font-semibold uppercase tracking-wide text-gray-600">Heart Score</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0">
              <div className={cn("text-3xl font-bold flex items-center gap-2", heartScore >= 80 ? 'text-emerald-600' : 'text-orange-600')}>
                {heartScore}
                <Heart className={cn("w-5 h-5", heartScore >= 80 ? 'text-emerald-500 fill-emerald-200' : 'text-orange-500')} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">/ 100 (Lower risk = Higher score)</p>
            </CardContent>
          </Card>
        </div>

        {/* Section 2: Energy Analysis */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" /> Energy Analysis
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Calories vs Target (TDEE)
                  <TooltipProvider>
                    <ShadTooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-[200px]">Compares your daily calorie intake against your Total Daily Energy Expenditure (TDEE) target.</p>
                      </TooltipContent>
                    </ShadTooltip>
                  </TooltipProvider>
                </CardTitle>
                <CardDescription>How your daily intake compares to your energy needs</CardDescription>
              </CardHeader>
              <CardContent className="h-100">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="calGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.amber.start} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={COLORS.amber.end} stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="Calories" stroke={COLORS.amber.start} fill="url(#calGradient)" strokeWidth={2} name="Intake" />
                    <Line type="monotone" dataKey="Target" stroke={COLORS.coral.start} strokeWidth={2.5} strokeDasharray="6 4" dot={false} name="TDEE Target" />
                  </ComposedChart>
                </ResponsiveContainer>

              </CardContent>
              <InsightBox type={energyInsight.type} icon={energyInsight.type === 'good' ? CheckCircle2 : AlertTriangle}>
                {energyInsight.text}
              </InsightBox>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Meal Timing
                  <TooltipProvider>
                    <ShadTooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-[200px]">Shows how your daily calories are distributed across Breakfast, Lunch, Dinner, and Snacks.</p>
                      </TooltipContent>
                    </ShadTooltip>
                  </TooltipProvider>
                </CardTitle>
                <CardDescription>Calorie distribution by meal</CardDescription>
              </CardHeader>
              <CardContent className="h-100 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={mealDist?.distribution || []} innerRadius={70} outerRadius={100} paddingAngle={3} dataKey="value" animationDuration={500}>
                      {(mealDist?.distribution || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={[COLORS.teal.start, COLORS.amber.start, COLORS.violet.start, COLORS.slate.start][index % 4]} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
              <div className="px-6 pb-6 flex flex-wrap gap-3 justify-center text-xs">
                {(mealDist?.distribution || []).map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: [COLORS.teal.start, COLORS.amber.start, COLORS.violet.start, COLORS.slate.start][i % 4] }} />
                    <span className="text-gray-600">{d.name}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* Section 3: Macronutrient Analysis */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> Macronutrient Analysis
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  All Nutrients Daily Trends
                  <TooltipProvider>
                    <ShadTooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-[200px]">Tracks all 11 nutrients over the selected period. Hover to see values.</p>
                      </TooltipContent>
                    </ShadTooltip>
                  </TooltipProvider>
                </CardTitle>
                <CardDescription>All nutrients over time (scroll legend to see all)</CardDescription>
              </CardHeader>
              <CardContent className="h-100">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="Calories" stroke="#6366f1" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Protein" stroke={COLORS.emerald.start} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Carbohydrates" stroke={COLORS.amber.start} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Fat" stroke={COLORS.coral.start} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Fiber" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="Sugar" stroke="#ec4899" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="Sodium" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="Cholesterol" stroke="#f97316" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="Saturated Fat" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="Unsaturated Fat" stroke="#22c55e" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="Trans-fat" stroke="#78716c" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
              <InsightBox type={macroInsight.type === 'info' ? 'info' : macroInsight.type} icon={macroInsight.type === 'good' ? CheckCircle2 : Lightbulb}>
                {macroInsight.text}
              </InsightBox>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Calorie Composition
                  <TooltipProvider>
                    <ShadTooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-[200px]">Your average macronutrient split compared to the recommended 30% Protein, 40% Carbs, 30% Fat target.</p>
                      </TooltipContent>
                    </ShadTooltip>
                  </TooltipProvider>
                </CardTitle>
                <CardDescription>Where your calories come from (Target: 30P / 40C / 30F)</CardDescription>
              </CardHeader>
              <CardContent className="h-100 flex items-center">
                <div className='w-full h-full flex flex-wrap items-center justify-center gap-4'>
                  <div className="h-[220px] w-[220px] flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={macroRatioData} innerRadius={70} outerRadius={100} dataKey="value" startAngle={90} endAngle={-270} paddingAngle={2}>
                          {macroRatioData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.color} strokeWidth={0} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val) => val !== undefined ? `${val}%` : ''} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="min-w-xs mx-auto space-y-4 flex-1">
                    {macroRatioData.map((m) => (
                      <div key={m.name} className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white shadow-md" style={{ background: `linear-gradient(135deg, ${m.color}, ${m.color}cc)` }}>
                          {m.name[0]}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-baseline">
                            <span className="text-sm font-medium text-gray-700">{m.name}</span>
                            <span className="text-lg font-bold">{m.value}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full mt-1 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${m.value}%`, background: m.color }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 4: Fat Quality & Section 5: Glycemic Control */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fat Quality */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-rose-500" /> Fat Quality Analysis
            </h2>
            <Card className="shadow-sm h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Lipid Breakdown
                  <TooltipProvider>
                    <ShadTooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-[200px]">Breakdown of fat types. Unsaturated fats are healthy; Saturated and Trans-fats should be limited.</p>
                      </TooltipContent>
                    </ShadTooltip>
                  </TooltipProvider>
                </CardTitle>
                <CardDescription>Healthy vs unhealthy fat sources</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-8">
                <div className="h-[2] w-[180px] flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={fatData} innerRadius={55} outerRadius={75} dataKey="value" paddingAngle={3}>
                        <Cell fill={COLORS.coral.start} />{/* Sat */}
                        <Cell fill={COLORS.emerald.start} />{/* Unsat */}
                        <Cell fill="#1e293b" />{/* Trans */}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4 w-full">
                  {fatData.map((d, i) => (
                    <div key={d.name}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-gray-700">{d.name}</span>
                        <span className="text-gray-500">{d.value.toFixed(1)}g ({totalFat > 0 ? ((d.value / totalFat) * 100).toFixed(0) : 0}%)</span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{
                          width: `${(d.value / (totalFat || 1)) * 100}%`,
                          backgroundColor: i === 0 ? COLORS.coral.start : i === 1 ? COLORS.emerald.start : '#1e293b'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <InsightBox type={fatInsight.type} icon={fatInsight.type === 'good' ? CheckCircle2 : fatInsight.type === 'warning' ? AlertTriangle : Lightbulb}>
                {fatInsight.text}
              </InsightBox>
            </Card>
          </section>

          {/* Glycemic Control */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-pink-500" /> Glycemic Control
            </h2>
            <Card className="shadow-sm h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Sugar vs Fiber
                  <TooltipProvider>
                    <ShadTooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-[200px]">Visualizes the balance between Sugar (spikes blood glucose) and Fiber (stabilizes it).</p>
                      </TooltipContent>
                    </ShadTooltip>
                  </TooltipProvider>
                </CardTitle>
                <CardDescription>Balance for blood sugar stability</CardDescription>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#fce7f3', opacity: 0.5 }} />
                    <Legend />
                    <Bar dataKey="Sugar" fill={COLORS.rose.start} radius={[6, 6, 0, 0]} name="Sugar (g)" />
                    <Bar dataKey="Fiber" fill={COLORS.violet.start} radius={[6, 6, 0, 0]} name="Fiber (g)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
              <InsightBox type={glycemicInsight.type} icon={glycemicInsight.type === 'good' ? CheckCircle2 : Lightbulb}>
                {glycemicInsight.text}
              </InsightBox>
            </Card>
          </section>
        </div>

        {/* Section 6: Heart Health */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" /> Cardiovascular Health
          </h2>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Risk Assessment
                <TooltipProvider>
                  <ShadTooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-[200px]">Radar chart showing key heart health metrics relative to their recommended daily limits (100%).</p>
                    </TooltipContent>
                  </ShadTooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription>Key nutrients affecting heart health vs daily limits</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={heartRadarData}>
                    <defs>
                      <radialGradient id="heartGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={COLORS.coral.start} stopOpacity={0.6} />
                        <stop offset="100%" stopColor={COLORS.coral.end} stopOpacity={0.1} />
                      </radialGradient>
                    </defs>
                    <PolarGrid stroke="#E5E7EB" />
                    <PolarAngleAxis dataKey="nutrient" tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Risk %" dataKey="pct" stroke={COLORS.coral.start} fill="url(#heartGrad)" strokeWidth={2} />
                    <Tooltip formatter={(value) => value !== undefined ? `${Number(value).toFixed(0)}% of limit` : ''} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="col-span-2 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {heartRadarData.map(d => {
                    const isRisk = d.value > d.max;
                    return (
                      <div key={d.nutrient} className={cn("p-4 rounded-xl border transition-all", isRisk ? "bg-red-50 border-red-200 shadow-red-100/50" : "bg-emerald-50 border-emerald-200 shadow-emerald-100/50")}>
                        <div className="flex items-center gap-2 mb-3">
                          {isRisk ? <AlertCircle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          <span className="font-semibold text-sm text-gray-700">{d.nutrient}</span>
                        </div>
                        <div className="text-2xl font-bold">
                          {d.value.toFixed(0)}<span className="text-xs font-normal text-muted-foreground ml-1">{d.unit}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Limit: {d.max} {d.unit}</div>
                      </div>
                    );
                  })}
                </div>
                <InsightBox type={heartInsight.type} icon={heartInsight.type === 'good' ? Heart : AlertTriangle}>
                  {heartInsight.text}
                </InsightBox>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 7: Nutrient Summary Table */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-gray-600" /> Complete Nutrient Summary
          </h2>
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-gray-600">Nutrient</th>
                      <th className="text-right py-4 px-6 font-semibold text-gray-600">Daily Avg</th>
                      <th className="text-right py-4 px-6 font-semibold text-gray-600">Target</th>
                      <th className="text-center py-4 px-6 font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      ...stats?.macro_nutrients.map(n => {
                        // Set proper defaults for each nutrient
                        let defaultLimit = null;
                        let defaultUnit = 'g';
                        let isMinimum = false;

                        if (n.name === 'Calories') {
                          defaultLimit = advanced?.tdee || 2000;
                          defaultUnit = 'kcal';
                          isMinimum = false; // Calories is a target, not a minimum
                        } else if (n.name === 'Protein') {
                          defaultLimit = proteinTarget;
                          isMinimum = true;
                        } else if (n.name === 'Fiber') {
                          defaultLimit = fiberTarget;
                          isMinimum = true;
                        } else if (n.name === 'Carbohydrates') {
                          defaultLimit = 300; // General recommendation
                          isMinimum = false;
                        } else if (n.name === 'Fat') {
                          defaultLimit = 65; // General recommendation
                          isMinimum = false;
                        }

                        return {
                          ...n,
                          limit: stats?.nutrient_limits?.[n.name]?.daily ?? defaultLimit,
                          isMinimum,
                          unit: stats?.nutrient_limits?.[n.name]?.unit || defaultUnit
                        };
                      }) || [],
                      ...stats?.micro_nutrients.map(n => ({
                        ...n,
                        limit: stats?.nutrient_limits?.[n.name]?.daily ?? (n.name === 'Sodium' ? 2300 : n.name === 'Cholesterol' ? 300 : null),
                        isMinimum: false,
                        unit: stats?.nutrient_limits?.[n.name]?.unit || 'mg'
                      })) || [],
                      ...stats?.limiting_nutrients.map(n => ({
                        ...n,
                        limit: stats?.nutrient_limits?.[n.name]?.daily ?? (n.name === 'Sugar' ? 50 : n.name === 'Saturated Fat' ? 20 : n.name === 'Trans-fat' ? 2 : null),
                        isMinimum: false,
                        unit: stats?.nutrient_limits?.[n.name]?.unit || 'g'
                      })) || []
                    ].map((n) => {
                      const avg = (n.data.reduce((a: number, b: number) => a + b, 0) || 0) / days;
                      const limit = n.limit;
                      const unit = n.unit || 'g';
                      let statusColor = 'bg-emerald-100 text-emerald-700';
                      let statusText = 'Good';
                      let StatusIcon = CheckCircle2;
                      let targetPrefix = n.isMinimum ? '≥' : '≤';

                      if (limit) {
                        // Special handling for Calories (target-based instead of limit-based)
                        if (n.name === 'Calories') {
                          targetPrefix = '≈'; // Target, not a limit
                          const ratio = avg / limit;
                          if (ratio >= 0.9 && ratio <= 1.1) {
                            statusColor = 'bg-emerald-100 text-emerald-700';
                            statusText = 'On Target';
                            StatusIcon = CheckCircle2;
                          } else if (ratio < 0.9) {
                            statusColor = 'bg-blue-100 text-blue-700';
                            statusText = 'Under';
                            StatusIcon = TrendingDown;
                          } else {
                            statusColor = 'bg-amber-100 text-amber-700';
                            statusText = 'Over';
                            StatusIcon = TrendingUp;
                          }
                        } else if (n.isMinimum) {
                          if (avg < limit * 0.8) { statusColor = 'bg-amber-100 text-amber-700'; statusText = 'Low'; StatusIcon = AlertCircle; }
                        } else {
                          if (avg > limit) { statusColor = 'bg-rose-100 text-rose-700'; statusText = 'High'; StatusIcon = AlertTriangle; }
                          else if (avg > limit * 0.9) { statusColor = 'bg-amber-100 text-amber-700'; statusText = 'Watch'; StatusIcon = AlertCircle; }
                        }
                      }

                      return (
                        <tr key={n.name} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-6 font-medium text-gray-800">{n.name}</td>
                          <td className="text-right py-4 px-6 text-gray-600">{avg.toFixed(1)} {unit}</td>
                          <td className="text-right py-4 px-6 text-gray-400">{limit ? `${targetPrefix} ${limit} ${unit}` : '-'}</td>
                          <td className="text-center py-4 px-6">
                            <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium", statusColor)}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {statusText}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 8: Daily Meal Log */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-500" /> Daily Meal Log
          </h2>
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[1200px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-4 px-4 font-semibold text-gray-600 sticky left-0 bg-gray-50">Date</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-600">Meals</th>
                      <th className="text-right py-4 px-3 font-semibold text-gray-600">Cal</th>
                      <th className="text-right py-4 px-3 font-semibold text-gray-600">Protein</th>
                      <th className="text-right py-4 px-3 font-semibold text-gray-600">Carbs</th>
                      <th className="text-right py-4 px-3 font-semibold text-gray-600">Fat</th>
                      <th className="text-right py-4 px-3 font-semibold text-gray-600">Fiber</th>
                      <th className="text-right py-4 px-3 font-semibold text-gray-600">Sugar</th>
                      <th className="text-right py-4 px-3 font-semibold text-gray-600">Sodium</th>
                      <th className="text-right py-4 px-3 font-semibold text-gray-600">Chol</th>
                      <th className="text-right py-4 px-3 font-semibold text-gray-600">Sat Fat</th>
                      <th className="text-right py-4 px-3 font-semibold text-gray-600">Unsat</th>
                      <th className="text-right py-4 px-3 font-semibold text-gray-600">Trans</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="text-center py-12 text-muted-foreground">No meal data for this period</td>
                      </tr>
                    ) : (
                      history.map((day) => (
                        <tr key={day.date} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-4 sticky left-0 bg-white">
                            <div className="font-medium text-gray-800">{day.weekday}</div>
                            <div className="text-xs text-muted-foreground">{day.date}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {day.meals.slice(0, 2).map((meal, i) => (
                                <span key={i} className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                                  {meal.name.length > 12 ? meal.name.slice(0, 12) + '…' : meal.name}
                                </span>
                              ))}
                              {day.meals.length > 2 && (
                                <span className="text-xs text-muted-foreground">+{day.meals.length - 2}</span>
                              )}
                            </div>
                          </td>
                          <td className="text-right py-3 px-3 font-semibold text-gray-800">{day.total_calories}</td>
                          <td className="text-right py-3 px-3 text-emerald-600">{day.total_protein}g</td>
                          <td className="text-right py-3 px-3 text-amber-600">{day.total_carbohydrates}g</td>
                          <td className="text-right py-3 px-3 text-rose-500">{day.total_fat}g</td>
                          <td className="text-right py-3 px-3 text-violet-600">{day.total_fiber}g</td>
                          <td className="text-right py-3 px-3 text-pink-500">{day.total_sugar}g</td>
                          <td className="text-right py-3 px-3 text-blue-500">{day.total_sodium}mg</td>
                          <td className="text-right py-3 px-3 text-orange-500">{day.total_cholesterol}mg</td>
                          <td className="text-right py-3 px-3 text-red-400">{day.total_saturated_fat}g</td>
                          <td className="text-right py-3 px-3 text-green-500">{day.total_unsaturated_fat}g</td>
                          <td className="text-right py-3 px-3 text-gray-500">{day.total_trans_fat}g</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}
