import { useEffect, useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
// MainLayout removed
// import { MainLayout } from '@/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  ComposedChart, ReferenceLine, RadialBarChart, RadialBar,
  ScatterChart, Scatter, ZAxis
} from 'recharts';
import {
  Loader2, Flame, Utensils,
  Zap, Scale, Clock, Heart, Brain, AlertTriangle, CheckCircle2,
  Lightbulb, TrendingUp, TrendingDown, Info, Sparkles,
  Search, Download, FileJson, ChevronLeft, ChevronRight, FileSpreadsheet,
  X, Plus
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { Patient } from '@/types';
import { getNutrientTargets } from '@/utils/nutrition';
import {
  Tooltip as ShadTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from '@/lib/utils';
import { format, subDays, startOfMonth } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

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
    good: 'bg-emerald-50 border-emerald-100 text-emerald-800',
    warning: 'bg-amber-50 border-amber-100 text-amber-800',
    info: 'bg-blue-50 border-blue-100 text-blue-800'
  };
  const iconColors = { good: 'text-emerald-500', warning: 'text-amber-500', info: 'text-blue-500' };

  return (
    <div className={cn("w-[98%] mx-auto my-3 p-4 rounded-xl border flex items-start gap-3 text-sm", styles[type])}>
      <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", iconColors[type])} />
      <div>
        {type === 'good' && <p className="font-semibold mb-1">Great Job!</p>}
        {children}
      </div>
    </div>
  );
};

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-100 shadow-xl rounded-xl">
        <p className="font-bold text-gray-800 mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((p: any) => {
            // Handle normalized values: check dataKey for "Pct" suffix
            const dataKey = p.dataKey;
            const isPct = typeof dataKey === 'string' && dataKey.endsWith('Pct');
            const originalName = isPct ? dataKey.replace('Pct', '') : p.name;

            // Value is either directly in payload, or we look it up in payload[0].payload (or p.payload) for the original data
            // p.payload refers to the data object for this X-axis point
            const displayValue = isPct && p.payload[originalName] !== undefined
              ? p.payload[originalName]
              : p.value;

            return (
              <div key={p.name} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.payload?.fill || p.payload?.color }} />
                <span className="text-gray-600">{originalName}:</span>
                <span className="font-semibold text-gray-900">
                  {Number(displayValue).toFixed(1)}
                  {['Calories', 'Target'].includes(originalName) ? ' kcal' :
                    ['Sodium', 'Cholesterol'].includes(originalName) ? ' mg' : 'g'}
                  {isPct && <span className="text-xs text-gray-400 ml-1">({Number(p.value).toFixed(0)}%)</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const { profile } = useAuth();
  const patient = profile as Patient;
  const [period, setPeriod] = useState<'weekly' | 'monthly' | '60days' | 'all'>('weekly');
  const [stats, setStats] = useState<NutrientStats | null>(null);
  const [compliance, setCompliance] = useState<ComplianceStats | null>(null);
  const [distribution, setDistribution] = useState<MealDistribution | null>(null);
  const [history, setHistory] = useState<DailyHistory[]>([]); // Chart specific history (bound to period)
  const [advancedStats, setAdvancedStats] = useState<AdvancedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [hiddenNutrients, setHiddenNutrients] = useState<string[]>([]);
  const [useNormalized, setUseNormalized] = useState(false);

  // Tablet State & Logic
  const [fullHistory, setFullHistory] = useState<DailyHistory[]>([]); // Decoupled full history
  const [tablePage, setTablePage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [tableLogDays, setTableLogDays] = useState<number | 'all'>('all'); // Days filter for table

  // Advanced Filter States
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>([]); // e.g., ['Mon', 'Tue']
  const [mealCountFilter, setMealCountFilter] = useState<{ operator: '>=' | '<=' | '=' | ''; value: number }>({ operator: '', value: 0 });
  const [nutrientFilters, setNutrientFilters] = useState<Array<{ nutrient: string; operator: '>' | '<' | '=' | 'between'; value: number; value2?: number }>>([]);
  const [activePresets, setActivePresets] = useState<string[]>([]); // 'high-sodium', 'low-protein', 'cheat-days', 'over-target', 'under-target'
  const [newFilter, setNewFilter] = useState<{ nutrient: string; operator: '>' | '<' | '=' | 'between'; value: number; value2?: number }>({ nutrient: '', operator: '>', value: 0 });

  const ITEMS_PER_PAGE = 10;

  // Helper to check if any filters are active
  const hasActiveFilters = dateRange.from || dateRange.to || selectedWeekdays.length > 0 || mealCountFilter.operator !== '' || nutrientFilters.length > 0 || activePresets.length > 0;

  // Clear all filters
  const clearAllFilters = () => {
    setDateRange({ from: undefined, to: undefined });
    setSelectedWeekdays([]);
    setMealCountFilter({ operator: '', value: 0 });
    setNutrientFilters([]);
    setActivePresets([]);
    setSearchTerm('');
    setTableLogDays('all');
  };

  // Toggle preset filter
  const togglePreset = (preset: string) => {
    setActivePresets(prev => prev.includes(preset) ? prev.filter(p => p !== preset) : [...prev, preset]);
  };

  // Add nutrient filter
  const addNutrientFilter = (filter: { nutrient: string; operator: '>' | '<' | '=' | 'between'; value: number; value2?: number }) => {
    setNutrientFilters(prev => [...prev, filter]);
  };

  // Remove nutrient filter
  const removeNutrientFilter = (index: number) => {
    setNutrientFilters(prev => prev.filter((_, i) => i !== index));
  };

  // Toggle weekday
  const toggleWeekday = (day: string) => {
    setSelectedWeekdays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const toggleVisibility = (value: string) => {
    setHiddenNutrients(prev =>
      prev.includes(value)
        ? prev.filter(n => n !== value)
        : [...prev, value]
    );
  };

  // Derived days for charts (not table)
  const days = useMemo(() => {
    switch (period) {
      case 'weekly': return 7;
      case 'monthly': return 30;
      case '60days': return 60;
      case 'all': return 90; // Just an approximation for the label
      default: return 7;
    }
  }, [period]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsData, complianceData, distributionData, historyData, advData, fullHistoryData] = await Promise.all([
          analyticsService.getPatientAnalytics(period),
          analyticsService.getComplianceStats(),
          analyticsService.getMealDistribution(days),
          analyticsService.getDailyHistory(days),
          analyticsService.getAdvancedStats(),
          analyticsService.getDailyHistory(180) // Fetch strict 180 days for the table regardless of chart selection
        ]);

        setStats(statsData);
        setCompliance(complianceData);
        setDistribution(distributionData);
        setHistory(historyData);
        setAdvancedStats(advData);
        setFullHistory(fullHistoryData);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period, days]);

  // --- Search & Pagination Logic ---
  const filteredHistory = useMemo(() => {
    let result = fullHistory;

    // 1. Days filter (quick preset)
    if (tableLogDays !== 'all') {
      result = result.slice(0, tableLogDays);
    }

    // 2. Date Range Filter
    if (dateRange.from || dateRange.to) {
      result = result.filter(day => {
        const dayDate = new Date(day.date);
        if (dateRange.from && dayDate < dateRange.from) return false;
        if (dateRange.to && dayDate > dateRange.to) return false;
        return true;
      });
    }

    // 3. Weekday Filter
    if (selectedWeekdays.length > 0) {
      result = result.filter(day => selectedWeekdays.includes(day.weekday));
    }

    // 4. Meal Count Filter
    if (mealCountFilter.operator) {
      result = result.filter(day => {
        const count = day.meals.length;
        switch (mealCountFilter.operator) {
          case '>=': return count >= mealCountFilter.value;
          case '<=': return count <= mealCountFilter.value;
          case '=': return count === mealCountFilter.value;
          default: return true;
        }
      });
    }

    // 5. Nutrient Filters
    if (nutrientFilters.length > 0) {
      result = result.filter(day => {
        return nutrientFilters.every(filter => {
          let value = 0;
          switch (filter.nutrient) {
            case 'calories': value = day.total_calories; break;
            case 'protein': value = day.total_protein; break;
            case 'carbs': value = day.total_carbohydrates; break;
            case 'fat': value = day.total_fat; break;
            case 'fiber': value = day.total_fiber; break;
            case 'sugar': value = day.total_sugar; break;
            case 'sodium': value = day.total_sodium; break;
            case 'cholesterol': value = day.total_cholesterol; break;
            case 'saturated_fat': value = day.total_saturated_fat; break;
            default: return true;
          }
          switch (filter.operator) {
            case '>': return value > filter.value;
            case '<': return value < filter.value;
            case '=': return value === filter.value;
            case 'between': return value >= filter.value && value <= (filter.value2 || filter.value);
            default: return true;
          }
        });
      });
    }

    // 6. Quick Presets
    if (activePresets.length > 0) {
      result = result.filter(day => {
        return activePresets.every(preset => {
          switch (preset) {
            case 'high-sodium': return day.total_sodium > 2300;
            case 'low-protein': return day.total_protein < 50;
            case 'cheat-days': return day.total_calories > 2500;
            case 'over-target': return day.total_calories > 2000; // Using default target
            case 'under-target': return day.total_calories < 2000;
            default: return true;
          }
        });
      });
    }

    // 7. Search Term (last filter)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(day => {
        if (day.date.toLowerCase().includes(searchLower)) return true;
        if (day.meals.some(m => m.name.toLowerCase().includes(searchLower))) return true;
        return false;
      });
    }

    return result;
  }, [fullHistory, searchTerm, tableLogDays, dateRange, selectedWeekdays, mealCountFilter, nutrientFilters, activePresets]);

  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);

  const paginatedHistory = useMemo(() => {
    const start = (tablePage - 1) * ITEMS_PER_PAGE;
    return filteredHistory.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredHistory, tablePage]);

  // Reset page when search changes
  useEffect(() => {
    setTablePage(1);
  }, [searchTerm]);

  const handleExportCSV = () => {
    if (!fullHistory.length) return;

    // Create CSV Header
    const headers = ['Date', 'Weekday', 'Meals', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)', 'Fiber (g)', 'Sugar (g)', 'Sodium (mg)'];

    // Create CSV Rows
    const rows = filteredHistory.map(day => [
      day.date,
      day.weekday,
      `"${day.meals.map(m => m.name).join(', ')}"`, // Quote meal names to handle commas
      day.total_calories,
      day.total_protein,
      day.total_carbohydrates,
      day.total_fat,
      day.total_fiber,
      day.total_sugar,
      day.total_sodium
    ]);

    // Combine
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `meal_log_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (!fullHistory.length) return;
    const blob = new Blob([JSON.stringify(filteredHistory, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `meal_log_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    if (!fullHistory.length) return;

    // Prepare data for Excel
    const excelData = filteredHistory.map(day => ({
      'Date': day.date,
      'Weekday': day.weekday,
      'Meals': day.meals.map(m => m.name).join(', '),
      'Calories': day.total_calories,
      'Protein (g)': day.total_protein,
      'Carbohydrates (g)': day.total_carbohydrates,
      'Fat (g)': day.total_fat,
      'Fiber (g)': day.total_fiber,
      'Sugar (g)': day.total_sugar,
      'Sodium (mg)': day.total_sodium,
      'Cholesterol (mg)': day.total_cholesterol,
      'Saturated Fat (g)': day.total_saturated_fat,
    }));

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Meal Log');

    // Download
    XLSX.writeFile(wb, `meal_log_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // --- Data Processing ---
  const weightKg = patient?.weight || 70;

  // Centralized targets
  const t = getNutrientTargets(patient, advancedStats?.tdee);

  const avgProtein = useMemo(() => (stats?.macro_nutrients.find(n => n.name === 'Protein')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);
  const avgFiber = useMemo(() => (stats?.macro_nutrients.find(n => n.name === 'Fiber')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);
  const avgCarbs = useMemo(() => (stats?.macro_nutrients.find(n => n.name === 'Carbohydrates')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);
  const avgSugar = useMemo(() => (stats?.limiting_nutrients.find(n => n.name === 'Sugar')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);
  const avgSodium = useMemo(() => (stats?.micro_nutrients.find(n => n.name === 'Sodium')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);
  const avgChol = useMemo(() => (stats?.micro_nutrients.find(n => n.name === 'Cholesterol')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);
  const avgSatFat = useMemo(() => (stats?.limiting_nutrients.find(n => n.name === 'Saturated Fat')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);
  const avgFat = useMemo(() => (stats?.macro_nutrients.find(n => n.name === 'Fat')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);
  const avgTransFat = useMemo(() => (stats?.limiting_nutrients.find(n => n.name === 'Trans-fat')?.data.reduce((a, b) => a + b, 0) || 0) / days, [stats, days]);

  const weightImpact = useMemo(() => {
    const dailyBalance = advancedStats?.daily_balance || 0;
    // 7700 kcal ≈ 1kg fat. Weekly change = (daily_balance * 7) / 7700
    const weeklyChangeKg = (dailyBalance * 7) / 7700;
    let color = 'text-gray-600';
    if (weeklyChangeKg < -0.2) color = 'text-blue-600'; // Losing weight
    if (weeklyChangeKg > 0.2) color = 'text-rose-600'; // Gaining weight
    return { value: Number(weeklyChangeKg.toFixed(2)), color };
  }, [advancedStats]);

  const nutrientGaps = useMemo(() => {
    const gaps: string[] = [];
    if (avgFiber < t.fiber * 0.75) gaps.push('Fiber');
    if (avgProtein < t.protein * 0.75) gaps.push('Protein');
    // Using simple averages for micro checks
    if (stats?.micro_nutrients) {
      for (const m of stats.micro_nutrients) {
        // This is a simplified check, ideally would use specific targets map
        const val = m.data.reduce((a, b) => a + b, 0) / days;
        // Heuristic: If value is < 50% of typical RDA, flag it (improving this logic would require per-nutrient RDA mapping)
        // For now, rely on explicitly mapped ones if available in 't' or general ones
        if (['Iron', 'Calcium', 'Vitamin D'].includes(m.name)) {
          // Placeholder thresholds if not in 't'
          const threshold = m.name === 'Iron' ? 18 : m.name === 'Calcium' ? 1000 : 15;
          if (val < threshold * 0.75) gaps.push(m.name);
        }
      }
    }
    return gaps;
  }, [avgFiber, avgProtein, stats, t, days]);

  const heartScore = useMemo(() => {
    let score = 100;
    if (avgSodium > t.sodium) score -= Math.min(30, ((avgSodium - t.sodium) / t.sodium) * 50);
    if (avgChol > t.cholesterol) score -= Math.min(30, ((avgChol - t.cholesterol) / t.cholesterol) * 50);
    if (avgSatFat > t.saturated_fat) score -= Math.min(30, ((avgSatFat - t.saturated_fat) / t.saturated_fat) * 50);
    return Math.max(0, Math.round(score));
  }, [avgSodium, avgChol, avgSatFat, t]);

  const carbQualityScore = avgSugar > 0 ? (avgFiber / avgSugar) : 0;

  const trendData = history.map(h => ({
    date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Calories: h.total_calories || 0,
    Target: t.calories,
    Protein: h.total_protein || 0,
    Carbohydrates: h.total_carbohydrates || 0,
    Fat: h.total_fat || 0,
    Fiber: h.total_fiber || 0,
    Sugar: h.total_sugar || 0,
    Sodium: h.total_sodium || 0,
    Cholesterol: h.total_cholesterol || 0,
    'Saturated Fat': h.total_saturated_fat || 0,
    'Unsaturated Fat': h.total_unsaturated_fat || 0,
    'Trans-fat': h.total_trans_fat || 0,
  }));

  const normalizedTrendData = trendData.map(day => ({
    ...day,
    // Micros
    'SodiumPct': (day.Sodium / t.sodium) * 100,
    'CholesterolPct': (day.Cholesterol / t.cholesterol) * 100,
    'Saturated FatPct': (day['Saturated Fat'] / t.saturated_fat) * 100,
    'Unsaturated FatPct': (day['Unsaturated Fat'] / t.unsaturated_fat) * 100,
    'Trans-fatPct': (day['Trans-fat'] / t.trans_fat) * 100,
    // Macros
    'CaloriesPct': (day.Calories / t.calories) * 100,
    'ProteinPct': (day.Protein / t.protein) * 100,
    'CarbohydratesPct': (day.Carbohydrates / t.carbs) * 100,
    'FatPct': (day.Fat / t.fat) * 100,
    'FiberPct': (day.Fiber / t.fiber) * 100,
    'SugarPct': (day.Sugar / t.sugar) * 100,
  }));

  const fatData = useMemo(() => [
    { name: 'Saturated', value: stats?.limiting_nutrients.find(n => n.name === 'Saturated Fat')?.data.reduce((a, b) => a + b, 0) || 0 },
    { name: 'Unsaturated', value: stats?.limiting_nutrients.find(n => n.name === 'Unsaturated Fat')?.data.reduce((a, b) => a + b, 0) || 0 },
    { name: 'Trans-fat', value: stats?.limiting_nutrients.find(n => n.name === 'Trans-fat')?.data.reduce((a, b) => a + b, 0) || 0 },
  ], [stats]);
  const totalFat = fatData.reduce((a, b) => a + b.value, 0);

  const macroRatioData = useMemo(() => {
    const totalKcal = advancedStats?.avg_daily_intake || 1;
    return [
      { name: 'Protein', value: Math.round(((avgProtein * 4) / totalKcal) * 100), kcal: avgProtein * 4, color: COLORS.emerald.start, fill: COLORS.emerald.start },
      { name: 'Carbohydrates', value: Math.round(((avgCarbs * 4) / totalKcal) * 100), kcal: avgCarbs * 4, color: COLORS.amber.start, fill: COLORS.amber.start },
      { name: 'Fat', value: Math.round(((avgFat * 9) / totalKcal) * 100), kcal: avgFat * 9, color: COLORS.coral.start, fill: COLORS.coral.start }
    ];
  }, [avgProtein, avgCarbs, avgFat, advancedStats]);

  const heartRadarData = useMemo(() => [
    { nutrient: 'Sodium', value: avgSodium, max: t.sodium, pct: Math.min((avgSodium / t.sodium) * 100, 150), unit: 'mg' },
    { nutrient: 'Sat. Fat', value: avgSatFat, max: t.saturated_fat, pct: Math.min((avgSatFat / t.saturated_fat) * 100, 150), unit: 'g' },
    { nutrient: 'Sugar', value: avgSugar, max: t.sugar, pct: Math.min((avgSugar / t.sugar) * 100, 150), unit: 'g' },
    { nutrient: 'Trans Fat', value: avgTransFat, max: t.trans_fat, pct: Math.min((avgTransFat / t.trans_fat) * 100, 150), unit: 'g' },
    { nutrient: 'Cholesterol', value: avgChol, max: t.cholesterol, pct: Math.min((avgChol / t.cholesterol) * 100, 150), unit: 'mg' },
  ], [avgSodium, avgChol, avgSatFat, avgSugar, avgTransFat, t]);

  const energyInsight = useMemo(() => {
    const avgCal = (stats?.calories.reduce((a, b) => a + b, 0) || 0) / days;
    const targetCalories = t.calories;
    const diff = targetCalories - avgCal;
    if (diff > 300) return { type: 'warning' as const, text: `You're averaging ${Math.round(diff)} kcal below your energy needs. Consider adding nutrient-dense snacks like nuts or Greek yogurt.` };
    if (diff < -300) return { type: 'warning' as const, text: `You're ${Math.round(Math.abs(diff))} kcal over your target. Try portion control on carbohydrates to reduce intake.` };
    return { type: 'good' as const, text: `Excellent! Your calorie intake is well-balanced with your daily energy expenditure.` };
  }, [stats, advancedStats, days, t]);

  const macroInsight = useMemo(() => {
    const proteinPct = macroRatioData[0]?.value || 0;
    if (proteinPct < 25) return { type: 'warning' as const, text: `Protein is only ${proteinPct}% of your calories (target: 30%). Add lean meats, eggs, or legumes to boost muscle recovery.` };
    if (proteinPct > 35) return { type: 'info' as const, text: `High protein intake detected (${proteinPct}%). Great for muscle building, but ensure adequate hydration.` };
    return { type: 'good' as const, text: `Your macronutrient balance is on point! Protein, carbohydrates, and fat are in a healthy ratio.` };
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
              <SelectItem value="60days">Last 60 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Section 1: Clinical KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-4">
          {/* Adherence */}
          <Card className="relative overflow-hidden bg-white border-gray-100 shadow-sm transition-all hover:shadow-md h-full">
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-100/50 text-[10px] font-semibold text-emerald-700 pointer-events-none">
              {compliance?.streak || 0} Day Streak 🔥
            </div>
            <CardHeader className="p-4 pb-1">
              <CardTitle className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Adherence Rate</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="flex flex-col h-full justify-center">
                <div className="text-3xl font-extrabold text-emerald-600 tracking-tight flex items-baseline gap-1">
                  {compliance?.compliance_rate || 0}
                  <span className="text-lg text-emerald-400">%</span>
                </div>
                <p className="text-xs font-medium text-emerald-600/60 mt-1">
                  Consistency Score
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Weight Impact */}
          <Card className="relative overflow-hidden bg-white border-gray-100 shadow-sm transition-all hover:shadow-md h-full">
            <CardHeader className="p-4 pb-1">
              <CardTitle className={cn("text-xs font-bold uppercase tracking-widest", weightImpact.color)}>Est. Weight Impact</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className={cn("text-3xl font-extrabold flex items-center gap-2 tracking-tight", weightImpact.color)}>
                {weightImpact.value > 0 ? '+' : ''}{weightImpact.value}
                <span className="text-lg font-semibold text-gray-400">kg/wk</span>
                {weightImpact.value > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              </div>
              <p className="text-xs font-medium opacity-60 mt-1">Based on {period === 'weekly' ? '7-day' : 'avg'} energy balance</p>
            </CardContent>
          </Card>

          {/* Protein Score */}
          <Card className="relative shadow-sm transition-all hover:shadow-md h-full">
            <CardHeader className="p-4 pb-1"><CardTitle className="text-xs font-bold uppercase text-gray-500 tracking-widest">Protein Intake</CardTitle></CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="text-3xl font-extrabold flex items-baseline gap-2 tracking-tight">
                {(avgProtein / weightKg).toFixed(1)} <span className="text-lg font-medium text-muted-foreground">g/kg</span>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-[10px] font-bold mb-1.5">
                  <span className="text-emerald-700">Daily Average</span>
                  <span className="text-gray-400">Target: 1.6 g/kg</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-teal-600 transition-all duration-700 shadow-sm" style={{ width: `${Math.min(((avgProtein / weightKg) / 1.6) * 100, 100)}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Nutrient Gaps (Clean Style) */}
          <Card className="relative shadow-sm transition-all hover:shadow-md h-full bg-white border-gray-100">
            <div className="absolute top-3 right-3">
              {nutrientGaps.length === 0 ? (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">OPTIMAL</span>
              ) : (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">ATTENTION NEEDED</span>
              )}
            </div>
            <CardHeader className="p-4 pb-1"><CardTitle className="text-xs font-bold uppercase text-gray-500 tracking-widest">Nutrient Gaps</CardTitle></CardHeader>
            <CardContent className="p-4 pt-1 flex flex-col justify-center min-h-[90px]">
              {nutrientGaps.length > 0 ? (
                <div>
                  <div className="text-3xl font-extrabold text-amber-600 mb-1">{nutrientGaps.length}</div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Deficiencies Detected</p>
                  <div className="flex flex-wrap gap-1.5">
                    {nutrientGaps.slice(0, 3).map(g => (
                      <span key={g} className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md uppercase border border-amber-100">{g}</span>
                    ))}
                    {nutrientGaps.length > 3 && <span className="text-[10px] text-gray-500 self-center">+{nutrientGaps.length - 3} more</span>}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-3xl font-extrabold text-emerald-600 mb-1">100<span className="text-lg text-emerald-400">%</span></div>
                  <p className="text-xs font-medium text-emerald-600/60 mt-1">
                    Nutrient Coverage Met
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Carb Quality */}
          <Card className="relative shadow-sm transition-all hover:shadow-md h-full">
            <div className={cn("absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter", carbQualityScore >= 0.2 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
              {carbQualityScore >= 0.2 ? 'High Quality' : 'Needs Optimization'}
            </div>
            <CardHeader className="p-4 pb-1"><CardTitle className="text-xs font-bold uppercase text-gray-500 tracking-widest">Glycemic Quality</CardTitle></CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="text-3xl font-extrabold tracking-tight">{carbQualityScore.toFixed(2)}</div>
              <p className="text-[10px] font-semibold text-muted-foreground mt-2">Fiber to Sugar Ratio (&gt;0.2 Ideal)</p>
            </CardContent>
          </Card>

          {/* Heart Score */}
          <Card className="relative overflow-hidden bg-white border-gray-100 shadow-sm transition-all hover:shadow-md h-full">
            <div className="absolute top-0 right-0 w-20 h-20 bg-rose-200/40 rounded-full blur-xl -mr-10 -mt-10 pointer-events-none" />
            <CardHeader className="p-4 pb-1"><CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-600">Cardio Score</CardTitle></CardHeader>
            <CardContent className="p-4 pt-1">
              <div className={cn("text-3xl font-extrabold flex items-center gap-2 tracking-tight", heartScore >= 80 ? 'text-emerald-700' : 'text-orange-700')}>
                {heartScore}
                <Heart className={cn("w-5 h-5", heartScore >= 80 ? 'text-emerald-500 fill-emerald-200' : 'text-orange-500')} />
              </div>
              <p className="text-[10px] font-semibold text-muted-foreground mt-2">Overall Heart Health Benchmark</p>
            </CardContent>
          </Card>
        </div>

        {/* Section 2: Energy Analysis */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500" /> Energy Analysis
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            <Card className="lg:col-span-2 shadow-sm transition-all duration-300 hover:shadow-md">
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
              <CardContent className="h-[400px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="calGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.amber.start} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={COLORS.amber.end} stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} interval={0} tickFormatter={(val, index) => {
                      if (days <= 7) return val;
                      if (days <= 30) return index % 3 === 0 ? val : '';
                      if (days <= 60) return index % 6 === 0 ? val : '';
                      return index % 14 === 0 ? val : '';
                    }} />
                    <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="Calories" stroke={COLORS.amber.start} fill="url(#calGradient)" strokeWidth={2} name="Intake" />
                    <Line type="monotone" dataKey="Target" stroke={COLORS.coral.start} strokeWidth={2.5} strokeDasharray="6 4" dot={false} name="TDEE Target" />
                  </ComposedChart>
                </ResponsiveContainer>

              </CardContent>
              <div className="px-6 pb-6">
                <InsightBox type={energyInsight.type} icon={energyInsight.type === 'good' ? CheckCircle2 : AlertTriangle}>
                  {energyInsight.text}
                </InsightBox>
              </div>
            </Card>

            <Card className="shadow-sm transition-all duration-300 hover:shadow-md h-full flex flex-col">
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
              <CardContent className="flex-1 min-h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distribution?.distribution || []} innerRadius={70} outerRadius={100} paddingAngle={3} dataKey="value" animationDuration={500}>
                      {(distribution?.distribution || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={[COLORS.teal.start, COLORS.amber.start, COLORS.violet.start, COLORS.slate.start][index % 4]} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
              <div className="px-6 pb-6 flex flex-wrap gap-3 justify-center text-xs">
                {(distribution?.distribution || []).map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: [COLORS.teal.start, COLORS.amber.start, COLORS.violet.start, COLORS.slate.start][i % 4] }} />
                    <span className="text-gray-600">{d.name}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* Section 3: Nutrient Trends */}
        <section>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-500" /> Nutrient Trends Analysis
            </h2>

            {/* View Mode Toggle */}
            <div className="bg-gray-100 p-1 rounded-lg inline-flex self-start md:self-auto">
              <button
                onClick={() => setUseNormalized(false)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-all",
                  !useNormalized ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-900"
                )}
              >
                Standard Units
              </button>
              <button
                onClick={() => setUseNormalized(true)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                  useNormalized ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-900"
                )}
              >
                % of Goal <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Advanced</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-8 lg:gap-12">
            {/* Macronutrient Trends */}
            <Card className="shadow-sm transition-all duration-300 hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {useNormalized ? "Macronutrient Daily Trends (% of Goal)" : "Macronutrient Daily Trends"}
                  <TooltipProvider>
                    <ShadTooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-[200px]">
                          {useNormalized
                            ? "Tracks nutrients relative to your daily goals. 100% means you hit your target exactly."
                            : "Tracks daily intake in grams (g) or calories (kcal)."}
                        </p>
                      </TooltipContent>
                    </ShadTooltip>
                  </TooltipProvider>
                </CardTitle>
                <CardDescription>Calories, Protein, Carbohydrates, Fat, Fiber, and Sugar</CardDescription>
              </CardHeader>
              <CardContent className="h-[450px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={useNormalized ? normalizedTrendData : trendData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} interval={0} tickFormatter={(val, index) => {
                      if (days <= 7) return val;
                      if (days <= 30) return index % 3 === 0 ? val : '';
                      if (days <= 60) return index % 6 === 0 ? val : '';
                      return index % 14 === 0 ? val : '';
                    }} />

                    {/* Y-Axes Logic */}
                    {useNormalized ? (
                      <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} unit="%" />
                    ) : (
                      <>
                        <YAxis yAxisId="cal" orientation="left" stroke="#6366f1" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Calories', angle: -90, position: 'insideLeft', offset: 0, fill: '#6366f1' }} />
                        <YAxis yAxisId="grams" orientation="right" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Grams', angle: 90, position: 'insideRight', offset: 10, fill: '#9CA3AF' }} />
                      </>
                    )}

                    <Tooltip content={<CustomTooltip />} />
                    <Legend onClick={toggleVisibility} wrapperStyle={{ cursor: 'pointer', paddingTop: '20px' }} />

                    {useNormalized && <ReferenceLine y={100} yAxisId="left" stroke="#10b981" strokeDasharray="3 3" label={{ position: 'top', value: 'Goal', fill: '#10b981', fontSize: 10 }} />}

                    {/* Lines - conditionally use Pct keys or standard keys */}
                    <Line yAxisId={useNormalized ? "left" : "cal"} type="monotone" dataKey={useNormalized ? "CaloriesPct" : "Calories"} name="Calories" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} hide={hiddenNutrients.includes('Calories')} />
                    <Line yAxisId={useNormalized ? "left" : "grams"} type="monotone" dataKey={useNormalized ? "ProteinPct" : "Protein"} name="Protein" stroke={COLORS.emerald.start} strokeWidth={2} dot={false} hide={hiddenNutrients.includes('Protein')} />
                    <Line yAxisId={useNormalized ? "left" : "grams"} type="monotone" dataKey={useNormalized ? "CarbohydratesPct" : "Carbohydrates"} name="Carbohydrates" stroke={COLORS.amber.start} strokeWidth={2} dot={false} hide={hiddenNutrients.includes('Carbohydrates')} />
                    <Line yAxisId={useNormalized ? "left" : "grams"} type="monotone" dataKey={useNormalized ? "FatPct" : "Fat"} name="Fat" stroke={COLORS.coral.start} strokeWidth={2} dot={false} hide={hiddenNutrients.includes('Fat')} />
                    <Line yAxisId={useNormalized ? "left" : "grams"} type="monotone" dataKey={useNormalized ? "FiberPct" : "Fiber"} name="Fiber" stroke="#8b5cf6" strokeWidth={2} dot={false} hide={hiddenNutrients.includes('Fiber')} />
                    <Line yAxisId={useNormalized ? "left" : "grams"} type="monotone" dataKey={useNormalized ? "SugarPct" : "Sugar"} name="Sugar" stroke="#ec4899" strokeWidth={2} dot={false} hide={hiddenNutrients.includes('Sugar')} />


                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
              <div className="px-6 pb-6 mt-auto">
                <InsightBox type={macroInsight.type === 'info' ? 'info' : macroInsight.type} icon={macroInsight.type === 'good' ? CheckCircle2 : Lightbulb}>
                  {macroInsight.text}
                </InsightBox>
              </div>
            </Card>

            {/* Micronutrient Trends */}
            <Card className="shadow-sm transition-all duration-300 hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {useNormalized ? "Micronutrient & Lipid Trends (% of Limit)" : "Micronutrient & Lipid Trends"}
                  <TooltipProvider>
                    <ShadTooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-[200px]">
                          {useNormalized
                            ? "Values are normalized to % of daily limits. 100% = Daily Limit."
                            : "Tracks daily intake in milligrams (mg) or grams (g)."}
                        </p>
                      </TooltipContent>
                    </ShadTooltip>
                  </TooltipProvider>
                </CardTitle>
                <CardDescription>Sodium (2300mg), Chol (300mg), Sat Fat (20g)</CardDescription>
              </CardHeader>
              <CardContent className="h-[450px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={useNormalized ? normalizedTrendData : trendData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} interval={0} tickFormatter={(val, index) => {
                      if (days <= 7) return val;
                      if (days <= 30) return index % 3 === 0 ? val : '';
                      if (days <= 60) return index % 6 === 0 ? val : '';
                      return index % 14 === 0 ? val : '';
                    }} />
                    {/* Y-Axes Logic */}
                    {useNormalized ? (
                      <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} unit="%" />
                    ) : (
                      <>
                        <YAxis yAxisId="mg" orientation="left" stroke="#3b82f6" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'mg', angle: -90, position: 'insideLeft', offset: 0, fill: '#3b82f6' }} />
                        <YAxis yAxisId="g" orientation="right" stroke="#ef4444" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'g', angle: 90, position: 'insideRight', offset: 10, fill: '#ef4444' }} />
                      </>
                    )}
                    <Tooltip content={<CustomTooltip />} />
                    <Legend onClick={toggleVisibility} wrapperStyle={{ cursor: 'pointer', paddingTop: '20px' }} />

                    {useNormalized && <ReferenceLine y={100} yAxisId="left" stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Limit', fill: '#ef4444', fontSize: 10 }} />}

                    <Line yAxisId={useNormalized ? "left" : "mg"} type="monotone" dataKey={useNormalized ? "SodiumPct" : "Sodium"} name="Sodium" stroke="#3b82f6" strokeWidth={2} dot={false} hide={hiddenNutrients.includes('Sodium')} />
                    <Line yAxisId={useNormalized ? "left" : "mg"} type="monotone" dataKey={useNormalized ? "CholesterolPct" : "Cholesterol"} name="Cholesterol" stroke="#f97316" strokeWidth={2} dot={false} hide={hiddenNutrients.includes('Cholesterol')} />
                    <Line yAxisId={useNormalized ? "left" : "g"} type="monotone" dataKey={useNormalized ? "Saturated FatPct" : "Saturated Fat"} name="Saturated Fat" stroke="#ef4444" strokeWidth={2} dot={false} hide={hiddenNutrients.includes('Saturated Fat')} />
                    <Line yAxisId={useNormalized ? "left" : "g"} type="monotone" dataKey={useNormalized ? "Unsaturated FatPct" : "Unsaturated Fat"} name="Unsaturated Fat" stroke="#22c55e" strokeWidth={2} dot={false} hide={hiddenNutrients.includes('Unsaturated Fat')} />
                    <Line yAxisId={useNormalized ? "left" : "g"} type="monotone" dataKey={useNormalized ? "Trans-fatPct" : "Trans-fat"} name="Trans-fat" stroke="#78716c" strokeWidth={2} dot={false} hide={hiddenNutrients.includes('Trans-fat')} />

                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Calorie Composition & Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mt-4">
              <Card className="shadow-sm transition-all duration-300 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Calorie Composition
                    <TooltipProvider>
                      <ShadTooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-[200px]">Your average macronutrient split compared to the recommended 30% Protein, 40% Carbohydrates, 30% Fat target.</p>
                        </TooltipContent>
                      </ShadTooltip>
                    </TooltipProvider>
                  </CardTitle>
                  <CardDescription>Target: 30P / 40C / 30F</CardDescription>
                </CardHeader>
                <CardContent className="min-h-[400px] flex flex-col items-center justify-center">
                  <div className="h-[250px] w-full max-w-[300px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        innerRadius="50%"
                        outerRadius="100%"
                        barSize={20}
                        data={macroRatioData}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <RadialBar
                          label={{ position: 'insideStart', fill: '#fff', fontSize: 10, fontWeight: 'bold' }}
                          background
                          dataKey="value"
                          cornerRadius={10}
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
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Total</span>
                        <div className="text-lg font-bold text-gray-800">{advancedStats?.avg_daily_intake || 0}</div>
                        <span className="text-[9px] text-gray-500">kcal</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full grid grid-cols-3 gap-2 mt-6">
                    {macroRatioData.map((m) => (
                      <div key={m.name} className="flex flex-col items-center p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                        <div className="w-2 h-2 rounded-full mb-2" style={{ backgroundColor: m.color }} />
                        <span className="text-xs font-semibold text-gray-600 mb-0.5">{m.name}</span>
                        <span className="text-lg font-bold" style={{ color: m.color }}>{m.value}%</span>
                        <span className="text-[10px] text-gray-400">{Math.round(m.kcal)} kcal</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Pattern Analysis (Scatter Plot) */}
              <Card className="shadow-sm transition-all duration-300 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Dietary Pattern Matrix
                    <TooltipProvider>
                      <ShadTooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-[200px]">Analyzes your eating patterns. <br />
                            <b>Top-Right:</b> High Carb & Fat (Cheat Days)<br />
                            <b>Center:</b> Balanced<br />
                            <b>Top-Left:</b> Keto/Low Carb</p>
                        </TooltipContent>
                      </ShadTooltip>
                    </TooltipProvider>
                  </CardTitle>
                  <CardDescription>Carbohydrate vs. Fat Correlation</CardDescription>
                </CardHeader>
                <CardContent className="min-h-[400px] flex flex-col p-6">
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis type="number" dataKey="x" name="Carbs" unit="g" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} label={{ value: 'Carbs (g)', position: 'insideBottom', offset: -10, fill: '#9CA3AF', fontSize: 12 }} />
                        <YAxis type="number" dataKey="y" name="Fat" unit="g" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} label={{ value: 'Fat (g)', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 12 }} />
                        <ZAxis type="number" dataKey="z" range={[60, 400]} name="Calories" unit="kcal" />
                        <Tooltip
                          cursor={{ strokeDasharray: '3 3' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl min-w-[150px]">
                                  <p className="font-bold text-gray-800 mb-1">{data.date}</p>
                                  <div className="space-y-1 text-xs">
                                    <div className="flex justify-between"><span className="text-gray-500">Calories:</span> <span className="font-semibold">{data.z}</span></div>
                                    <div className="flex justify-between"><span className="text-amber-500">Carbs:</span> <span className="font-semibold">{data.x}g</span></div>
                                    <div className="flex justify-between"><span className="text-coral-500">Fat:</span> <span className="font-semibold">{data.y}g</span></div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <ReferenceLine x={t.carbs} stroke={COLORS.amber.end} strokeDasharray="3 3" label={{ value: 'Target Carbs', position: 'insideTopRight', fill: COLORS.amber.end, fontSize: 10 }} />
                        <ReferenceLine y={t.fat} stroke={COLORS.coral.end} strokeDasharray="3 3" label={{ value: 'Target Fat', position: 'insideTopRight', fill: COLORS.coral.end, fontSize: 10 }} />
                        <Scatter name="Daily Intake" data={history.map(h => ({
                          x: h.total_carbohydrates,
                          y: h.total_fat,
                          z: h.total_calories,
                          date: new Date(h.date).toLocaleDateString(),
                          fill: (h.total_carbohydrates > t.carbs * 1.2 && h.total_fat > t.fat * 1.2) ? '#ef4444' : // High Both (Danger)
                            (h.total_carbohydrates < t.carbs * 0.8 && h.total_fat > t.fat * 1.2) ? '#f59e0b' : // Ketoish
                              '#10b981' // Balanced/Other
                        }))}>
                          {history.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={(entry.total_carbohydrates > t.carbs * 1.2 && entry.total_fat > t.fat * 1.2) ? '#ef4444' : (entry.total_carbohydrates < t.carbs * 0.8 && entry.total_fat > t.fat * 1.2) ? '#f59e0b' : '#10b981'}
                              stroke="#ffffff"
                              strokeWidth={2}
                            />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Custom Legend */}
                  <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-4 text-xs text-gray-600 w-full">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm flex-shrink-0"></div>
                      <span>Balanced</span>
                    </div>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <div className="w-3 h-3 rounded-full bg-amber-500 border-2 border-white shadow-sm flex-shrink-0"></div>
                      <span>Imbalanced</span>
                    </div>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-sm flex-shrink-0"></div>
                      <span>Excess (High Carb+Fat)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 4: Fat Quality & Section 5: Glycemic Control */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Fat Quality */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Scale className="w-6 h-6 text-rose-500" /> Fat Quality Analysis
            </h2>
            <Card className="shadow-sm h-full transition-all duration-300 hover:shadow-md flex flex-col">
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
              <CardContent className="flex items-center gap-10 p-8 flex-1">
                <div className="h-[200px] w-[200px] flex-shrink-0">
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
              <div className="px-8 pb-8 mt-auto">
                <InsightBox type={fatInsight.type} icon={fatInsight.type === 'good' ? CheckCircle2 : fatInsight.type === 'warning' ? AlertTriangle : Lightbulb}>
                  {fatInsight.text}
                </InsightBox>
              </div>
            </Card>
          </section>

          {/* Glycemic Control */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Brain className="w-6 h-6 text-pink-500" /> Glycemic Control
            </h2>
            <Card className="shadow-sm h-full transition-all duration-300 hover:shadow-md flex flex-col">
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
              <CardContent className="h-[350px] mt-4 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} interval={0} tickFormatter={(val, index) => {
                      if (days <= 7) return val;
                      if (days <= 30) return index % 3 === 0 ? val : '';
                      if (days <= 60) return index % 6 === 0 ? val : '';
                      return index % 14 === 0 ? val : '';
                    }} />
                    <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#fce7f3', opacity: 0.5 }} />
                    <Legend />
                    <Bar dataKey="Sugar" fill={COLORS.rose.start} radius={[6, 6, 0, 0]} name="Sugar (g)" />
                    <Bar dataKey="Fiber" fill={COLORS.violet.start} radius={[6, 6, 0, 0]} name="Fiber (g)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
              <div className="px-8 pb-8 mt-auto">
                <InsightBox type={glycemicInsight.type} icon={glycemicInsight.type === 'good' ? CheckCircle2 : Lightbulb}>
                  {glycemicInsight.text}
                </InsightBox>
              </div>
            </Card>
          </section>
        </div>

        {/* Section 6: Heart Health */}
        <section className='mt-24'>
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500" /> Cardiovascular Health
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 pl-1 pr-1">
            {/* 1. Risk Assessment */}
            <Card className="shadow-sm transition-all duration-300 hover:shadow-md">
              <CardHeader className="p-6">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
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
                <CardDescription>Key nutrients vs daily limits</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={heartRadarData}>
                    <defs>
                      <radialGradient id="heartGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={COLORS.coral.start} stopOpacity={0.6} />
                        <stop offset="100%" stopColor={COLORS.coral.end} stopOpacity={0.1} />
                      </radialGradient>
                    </defs>
                    <PolarGrid stroke="#E5E7EB" />
                    <PolarAngleAxis dataKey="nutrient" tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 500 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Intake" dataKey="value" stroke={COLORS.coral.start} strokeWidth={2} fill="url(#heartGrad)" fillOpacity={0.6} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
              <div className="px-6 pb-6 mt-auto">
                <InsightBox type={heartInsight.type} icon={heartInsight.type === 'good' ? Heart : AlertTriangle}>
                  {heartInsight.text}
                </InsightBox>
              </div>
            </Card>

            {/* 2. Metabolic Matrix (Carb vs Fat Patterns) */}
            <Card className="shadow-sm transition-all duration-300 hover:shadow-md">
              <CardHeader className="p-6">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  Metabolic Matrix
                  <TooltipProvider>
                    <ShadTooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-[200px]">Analyzes your diet patterns. Top-right (High Carb + High Fat) is the 'Danger Zone'. Aim for the center or bottom-left.</p>
                      </TooltipContent>
                    </ShadTooltip>
                  </TooltipProvider>
                </CardTitle>
                <CardDescription>Carbohydrate vs. Fat Balance per Day</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      type="number"
                      dataKey="total_carbohydrates"
                      name="Carbs"
                      unit="g"
                      label={{ value: 'Carbohydrates (g)', position: 'bottom', offset: 0, fontSize: 12 }}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="total_fat"
                      name="Fat"
                      unit="g"
                      label={{ value: 'Fat (g)', angle: -90, position: 'left', offset: 0, fontSize: 12 }}
                      tick={{ fontSize: 11 }}
                    />
                    <ZAxis type="number" dataKey="total_calories" range={[60, 400]} name="Calories" unit="kcal" />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border rounded-lg shadow-lg text-xs">
                              <p className="font-bold mb-1">{format(new Date(data.date), 'MMM dd, yyyy')}</p>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                <span className="text-gray-500">Carbs:</span>
                                <span className="font-medium">{data.total_carbohydrates}g</span>
                                <span className="text-gray-500">Fat:</span>
                                <span className="font-medium">{data.total_fat}g</span>
                                <span className="text-gray-500">Calories:</span>
                                <span className="font-medium">{data.total_calories}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {/* Reference Lines for Targets */}
                    <ReferenceLine x={t?.carbs || 275} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Target Carbs', position: 'insideTopRight', fontSize: 10, fill: '#059669' }} />
                    <ReferenceLine y={t?.fat || 78} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Target Fat', position: 'insideRight', fontSize: 10, fill: '#059669' }} />

                    <Scatter name="Daily Log" data={history} fill={COLORS.blue.start} shape="circle" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
              <div className="px-6 pb-6 mt-auto">
                <InsightBox type="info" icon={Brain}>
                  Larger circles represent higher calorie days. Clusters in the top-right indicate heavy meals.
                </InsightBox>
              </div>
            </Card>
          </div>


        </section>

        {/* Section 7: Nutrient Summary Table */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Utensils className="w-6 h-6 text-gray-600" /> Average Daily Intake
            <span className="text-sm font-normal text-gray-500 ml-2">
              (Over last {days} days)
            </span>
          </h2>
          <Card className="shadow-none border-none bg-transparent">
            <CardContent className="p-4 bg-transparent shadow-none">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[
                  // 1. Metabolic Essentials
                  ...stats?.macro_nutrients.filter(n => ['Calories', 'Protein', 'Fiber'].includes(n.name)).map(n => ({ ...n, group: 'Essential Fuel' })) || [],
                  // 2. Nutrients to Monitor (Limits)
                  ...stats?.limiting_nutrients.map(n => ({ ...n, group: 'Watch List' })) || [],
                  ...stats?.micro_nutrients.filter(n => ['Sodium', 'Cholesterol'].includes(n.name)).map(n => ({ ...n, group: 'Watch List' })) || [],
                  // 3. Vitamins & Minerals (Targets) - Filter out the ones we just moved to Watch List
                  ...stats?.micro_nutrients.filter(n => !['Sodium', 'Cholesterol'].includes(n.name)).map(n => ({ ...n, group: 'Micronutrients' })) || []
                ].map((n) => {
                  // Re-calculate defaults/limits logic (same as before)
                  let defaultLimit = null;
                  let defaultUnit = 'g';
                  let isMinimum = false;

                  if (n.name === 'Calories') { defaultLimit = t.calories; defaultUnit = 'kcal'; isMinimum = false; }
                  else if (n.name === 'Protein') { defaultLimit = t.protein; isMinimum = true; }
                  else if (n.name === 'Fiber') { defaultLimit = t.fiber; isMinimum = true; }
                  else if (n.name === 'Carbohydrates') { defaultLimit = t.carbs; isMinimum = false; }

                  if (n.name === 'Calories') { defaultLimit = t.calories; defaultUnit = 'kcal'; }
                  else if (n.name === 'Protein') { defaultLimit = t.protein; }
                  else if (n.name === 'Fiber') { defaultLimit = t.fiber; }
                  else if (n.name === 'Carbohydrates') { defaultLimit = t.carbs; }
                  else if (n.name === 'Fat') { defaultLimit = t.fat; }

                  // For micro/limiting nutrients, pull from stats or fallbacks
                  if (!defaultLimit && stats?.nutrient_limits?.[n.name]) {
                    defaultLimit = stats.nutrient_limits[n.name].daily;
                    defaultUnit = stats.nutrient_limits[n.name].unit || 'g';
                  }

                  // Manual fallbacks if API missing
                  if (!defaultLimit) {
                    if (n.name === 'Sodium') { defaultLimit = t.sodium; defaultUnit = 'mg'; }
                    else if (n.name === 'Sugar') { defaultLimit = t.sugar; defaultUnit = 'g'; }
                    else if (n.name === 'Saturated Fat') { defaultLimit = t.saturated_fat; defaultUnit = 'g'; }
                    else if (n.name === 'Cholesterol') { defaultLimit = t.cholesterol; defaultUnit = 'mg'; }
                  }

                  const avg = (n.data.reduce((a: number, b: number) => a + b, 0) || 0) / (days || 1);
                  const limit = defaultLimit || 1; // avoid divide by zero
                  const percentage = Math.min((avg / limit) * 100, 100);

                  // Status Logic
                  let statusColor = 'bg-emerald-500';
                  let statusText = 'Good';
                  let textColor = 'text-emerald-700';
                  let bgColor = 'bg-emerald-50';

                  if (n.name === 'Calories') {
                    const ratio = avg / limit;
                    if (ratio >= 0.9 && ratio <= 1.1) { statusColor = 'bg-emerald-500'; textColor = 'text-emerald-700'; bgColor = 'bg-emerald-50'; statusText = 'On Target'; }
                    else if (ratio < 0.9) { statusColor = 'bg-blue-500'; textColor = 'text-blue-700'; bgColor = 'bg-blue-50'; statusText = 'Under'; }
                    else { statusColor = 'bg-amber-500'; textColor = 'text-amber-700'; bgColor = 'bg-amber-50'; statusText = 'Over'; }
                  }
                  else if (['Sugar', 'Sodium', 'Saturated Fat', 'Trans-fat', 'Cholesterol'].includes(n.name)) {
                    // Limit logic (Lower is better)
                    if (avg > limit) { statusColor = 'bg-red-500'; textColor = 'text-red-700'; bgColor = 'bg-red-50'; statusText = 'Excess'; }
                    else if (avg > limit * 0.8) { statusColor = 'bg-amber-500'; textColor = 'text-amber-700'; bgColor = 'bg-amber-50'; statusText = 'High'; }
                    else { statusColor = 'bg-emerald-500'; textColor = 'text-emerald-700'; bgColor = 'bg-emerald-50'; statusText = 'Good'; }
                  }
                  else {
                    // Target logic (Higher is better, up to a point)
                    if (avg < limit * 0.7) { statusColor = 'bg-red-500'; textColor = 'text-red-700'; bgColor = 'bg-red-50'; statusText = 'Low'; }
                    else if (avg < limit * 0.9) { statusColor = 'bg-amber-500'; textColor = 'text-amber-700'; bgColor = 'bg-amber-50'; statusText = 'Nearly There'; }
                    else { statusColor = 'bg-emerald-500'; textColor = 'text-emerald-700'; bgColor = 'bg-emerald-50'; statusText = 'Great'; }
                  }

                  return (
                    <div key={n.name} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm transition-all hover:shadow-md">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className={cn("p-1.5 rounded-lg", bgColor)}>
                            {['Calories', 'Sugar'].includes(n.name) ? <Flame className={cn("w-4 h-4", textColor)} /> :
                              ['Sodium', 'Cholesterol'].includes(n.name) ? <Heart className={cn("w-4 h-4", textColor)} /> :
                                <Utensils className={cn("w-4 h-4", textColor)} />
                            }
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800 text-sm">{n.name}</div>
                            <div className="text-[10px] text-gray-500">{n.group}</div>
                          </div>
                        </div>
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", bgColor, textColor)}>
                          {statusText}
                        </span>
                      </div>

                      <div className="mb-2">
                        {/* Progress bar with dynamic color class applied to container which child picks up via CSS or direct styling if customized */}
                        <div className={cn("h-2 w-full rounded-full bg-slate-100 overflow-hidden")}>
                          <div className={cn("h-full transition-all duration-500", statusColor)} style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>

                      <div className="flex justify-between items-end">
                        <div className="text-xl font-bold text-gray-800">
                          {avg.toFixed(0)}<span className="text-xs font-normal text-gray-500 ml-0.5">{defaultUnit}</span>
                        </div>
                        <div className="text-xs text-gray-400 mb-1">
                          / {limit} {defaultUnit}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 8: Activity Log (Rich Table) */}
        <section>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Clock className="w-6 h-6 text-slate-500" /> Activity Log
            </h2>


            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search meals or dates..."
                  className="pl-9 bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 bg-white hover:bg-gray-50 text-gray-700 border-dashed">
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Export</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Export Data</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleExportExcel}>
                      <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" /> Excel (.xlsx)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportCSV}>
                      <Download className="w-4 h-4 mr-2 text-blue-600" /> CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportJSON}>
                      <FileJson className="w-4 h-4 mr-2 text-orange-600" /> JSON
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          <div className="flex flex-wrap items-center gap-3 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
            {/* Date Range Picker (Simplified) */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("gap-2", (dateRange.from || dateRange.to) && "border-blue-500 bg-blue-50")}>
                  <CalendarIcon className="w-4 h-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>{dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}</>
                    ) : dateRange.from.toLocaleDateString()
                  ) : "Date Range"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4" align="start">
                <div className="flex flex-col gap-4">
                  <div className="flex gap-2 items-center">
                    <div className="grid gap-1.5">
                      <label htmlFor="fromdate" className="text-xs font-medium text-gray-500">From</label>
                      <Input
                        id="fromdate"
                        type="date"
                        className="h-8 w-36"
                        value={dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : undefined;
                          setDateRange(prev => ({ ...prev, from: date }));
                        }}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <label htmlFor="todate" className="text-xs font-medium text-gray-500">To</label>
                      <Input
                        id="todate"
                        type="date"
                        className="h-8 w-36"
                        value={dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : undefined;
                          setDateRange(prev => ({ ...prev, to: date }));
                        }}
                      />
                    </div>
                  </div>

                  {/* Presets */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    {[
                      { label: 'Today', getValue: () => ({ from: new Date(), to: new Date() }) },
                      { label: 'Last 7 Days', getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
                      { label: 'This Month', getValue: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
                    ].map((preset) => (
                      <Button
                        key={preset.label}
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs bg-gray-50 hover:bg-gray-100"
                        onClick={() => setDateRange(preset.getValue())}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>

                  {(dateRange.from || dateRange.to) && (
                    <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: undefined, to: undefined })} className="w-full h-8 text-xs text-red-500 hover:text-red-700 hover:bg-red-50">
                      Clear Dates
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Weekday Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("gap-2", selectedWeekdays.length > 0 && "border-violet-500 bg-violet-50")}>
                  <Clock className="w-4 h-4" />
                  {selectedWeekdays.length > 0 ? `${selectedWeekdays.length} Days` : "Weekdays"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48" align="start">
                <div className="space-y-1">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <button
                      key={day}
                      onClick={() => toggleWeekday(day)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                        selectedWeekdays.includes(day) ? "bg-violet-100 text-violet-700 font-medium" : "hover:bg-gray-100"
                      )}
                    >
                      {day === 'Mon' ? 'Monday' : day === 'Tue' ? 'Tuesday' : day === 'Wed' ? 'Wednesday' :
                        day === 'Thu' ? 'Thursday' : day === 'Fri' ? 'Friday' : day === 'Sat' ? 'Saturday' : 'Sunday'}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Meal Count Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("gap-2", mealCountFilter.operator && "border-amber-500 bg-amber-50")}>
                  <Utensils className="w-4 h-4" />
                  {mealCountFilter.operator ? `${mealCountFilter.operator} ${mealCountFilter.value} Meals` : "Meal Count"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56" align="start">
                <div className="space-y-3">
                  <Select value={mealCountFilter.operator} onValueChange={(v) => setMealCountFilter(prev => ({ ...prev, operator: v as '>=' | '<=' | '=' | '' }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=">=">At least</SelectItem>
                      <SelectItem value="<=">At most</SelectItem>
                      <SelectItem value="=">Exactly</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={0}
                    placeholder="# of meals"
                    value={mealCountFilter.value || ''}
                    onChange={(e) => setMealCountFilter(prev => ({ ...prev, value: Number(e.target.value) }))}
                  />
                  {mealCountFilter.operator && (
                    <Button variant="ghost" size="sm" onClick={() => setMealCountFilter({ operator: '', value: 0 })} className="w-full">
                      Clear
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Nutrient Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("gap-2", nutrientFilters.length > 0 && "border-emerald-500 bg-emerald-50")}>
                  <Plus className="w-4 h-4" />
                  {nutrientFilters.length > 0 ? `${nutrientFilters.length} Nutrient Filters` : "Add Nutrient Filter"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-3">
                  <div className="font-medium text-sm text-gray-700">Create New Filter</div>

                  {/* Nutrient Selection */}
                  <Select
                    value={newFilter.nutrient}
                    onValueChange={(v) => setNewFilter(prev => ({ ...prev, nutrient: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Nutrient" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="calories">Calories</SelectItem>
                      <SelectItem value="protein">Protein (g)</SelectItem>
                      <SelectItem value="carbs">Carbohydrates (g)</SelectItem>
                      <SelectItem value="fat">Fat (g)</SelectItem>
                      <SelectItem value="fiber">Fiber (g)</SelectItem>
                      <SelectItem value="sugar">Sugar (g)</SelectItem>
                      <SelectItem value="sodium">Sodium (mg)</SelectItem>
                      <SelectItem value="cholesterol">Cholesterol (mg)</SelectItem>
                      <SelectItem value="saturated_fat">Saturated Fat (g)</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Operator and Value Row */}
                  <div className="flex gap-2">
                    <Select
                      value={newFilter.operator}
                      onValueChange={(v) => setNewFilter(prev => ({ ...prev, operator: v as '>' | '<' | '=' | 'between' }))}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="Op" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=">">Greater than (&gt;)</SelectItem>
                        <SelectItem value="<">Less than (&lt;)</SelectItem>
                        <SelectItem value="=">Equals (=)</SelectItem>
                        <SelectItem value="between">Between</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Value"
                      className="flex-1"
                      value={newFilter.value || ''}
                      onChange={(e) => setNewFilter(prev => ({ ...prev, value: Number(e.target.value) }))}
                    />
                    {newFilter.operator === 'between' && (
                      <Input
                        type="number"
                        min={0}
                        placeholder="Max"
                        className="w-20"
                        value={newFilter.value2 || ''}
                        onChange={(e) => setNewFilter(prev => ({ ...prev, value2: Number(e.target.value) }))}
                      />
                    )}
                  </div>

                  {/* Add Button */}
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={!newFilter.nutrient || !newFilter.operator || newFilter.value === 0}
                    onClick={() => {
                      addNutrientFilter(newFilter);
                      setNewFilter({ nutrient: '', operator: '>', value: 0 });
                    }}
                  >
                    Add Filter
                  </Button>

                  {/* Existing Filters */}
                  {nutrientFilters.length > 0 && (
                    <div className="space-y-2 pt-3 border-t">
                      <div className="text-xs font-medium text-gray-500 uppercase">Active Filters</div>
                      {nutrientFilters.map((f, i) => (
                        <div key={i} className="flex items-center justify-between gap-2 p-2 bg-emerald-50 rounded text-sm border border-emerald-200">
                          <span className="capitalize font-medium">
                            {f.nutrient.replace('_', ' ')} {f.operator} {f.value}{f.operator === 'between' && f.value2 ? ` - ${f.value2}` : ''}
                          </span>
                          <button onClick={() => removeNutrientFilter(i)} className="text-red-500 hover:text-red-700">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Quick Presets */}
            <div className="flex gap-2 flex-wrap">
              {[
                { id: 'cheat-days', label: 'Cheat Days', color: 'rose' },
                { id: 'high-sodium', label: 'High Sodium', color: 'orange' },
                { id: 'low-protein', label: 'Low Protein', color: 'yellow' },
                { id: 'over-target', label: 'Over Target', color: 'red' },
                { id: 'under-target', label: 'Under Target', color: 'blue' },
              ].map(preset => (
                <button
                  key={preset.id}
                  onClick={() => togglePreset(preset.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    activePresets.includes(preset.id)
                      ? `bg-${preset.color}-100 border-${preset.color}-400 text-${preset.color}-700`
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Clear All */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                <X className="w-4 h-4 mr-1" /> Clear All
              </Button>
            )}
          </div>

          <Card className="shadow-sm transition-all duration-300 hover:shadow-md overflow-hidden bg-white">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[1200px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-4 px-4 font-semibold text-gray-600 sticky left-0 bg-gray-50 z-10 w-[140px]">Date</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-600 min-w-[200px]">Meals</th>
                      <th className="text-right py-4 px-3 font-semibold text-gray-600">Calories</th>
                      <th className="text-right py-4 px-3 font-semibold text-gray-600">Protein</th>
                      <th className="text-right py-4 px-3 font-semibold text-gray-600">Carbo-<br />hydrates</th>
                      <th className="text-right py-4 px-3 font-semibold text-gray-600">Fat</th>
                      <th className="text-right py-4 px-3 font-semibold text-gray-600">Fiber</th>
                      <th className="text-right py-4 px-3 font-semibold text-gray-600">Sugar</th>
                      <th className="text-right py-4 px-3 font-semibold text-gray-600">Sodium</th>
                      <th className="text-right py-4 px-3 font-semibold text-gray-600">Choles-<br />terol</th>
                      <th className="text-right py-4 px-3 font-semibold text-gray-600">Saturated<br />Fat</th>
                      <th className="text-right py-4 px-3 font-semibold text-gray-600">Unsaturated<br />Fat</th>
                      <th className="text-right py-4 px-3 font-semibold text-gray-600">Trans<br />Fat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedHistory.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="text-center py-12 text-muted-foreground">
                          {searchTerm ? 'No results found for your search.' : 'No meal logs available.'}
                        </td>
                      </tr>
                    ) : (
                      paginatedHistory.map((day) => (
                        <tr key={day.date} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="py-3 px-4 sticky left-0 bg-white group-hover:bg-gray-50/50 transition-colors z-10 border-r border-transparent group-hover:border-gray-100">
                            <div className="font-medium text-gray-800">{day.weekday}</div>
                            <div className="text-xs text-muted-foreground">{day.date}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {day.meals.slice(0, 3).map((meal, i) => (
                                <span key={i} className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 border border-slate-200">
                                  {meal.name}
                                </span>
                              ))}
                              {day.meals.length > 3 && (
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500">
                                  +{day.meals.length - 3} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="text-right py-3 px-3 font-bold text-gray-800">{day.total_calories}</td>
                          <td className="text-right py-3 px-3 text-emerald-600 font-medium">{day.total_protein}g</td>
                          <td className="text-right py-3 px-3 text-amber-600 font-medium">{day.total_carbohydrates}g</td>
                          <td className="text-right py-3 px-3 text-rose-500 font-medium">{day.total_fat}g</td>
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

              {/* Pagination Footer */}
              <div className="flex items-center justify-between px-4 py-4 border-t border-gray-100 bg-gray-50/50">
                <div className="text-sm text-gray-500">
                  Showing <span className="font-medium">{filteredHistory.length > 0 ? (tablePage - 1) * ITEMS_PER_PAGE + 1 : 0}</span> to <span className="font-medium">{Math.min(tablePage * ITEMS_PER_PAGE, filteredHistory.length)}</span> of <span className="font-medium">{filteredHistory.length}</span> results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTablePage(p => Math.max(1, p - 1))}
                    disabled={tablePage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm font-medium text-gray-700">
                    Page {tablePage} of {Math.max(1, totalPages)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTablePage(p => Math.min(totalPages, p + 1))}
                    disabled={tablePage >= totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}

