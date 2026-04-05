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
  type AnalyticsPeriod,
  type NutrientStats,
  type ComplianceStats,
  type MealDistribution,
  type DailyHistory,
  type AdvancedStats,
  type WeightHistory
} from '@/services/analytics.service';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, Line, Area, AreaChart,
  ComposedChart, ReferenceLine, RadialBarChart, RadialBar,
  ScatterChart, Scatter, ZAxis
} from 'recharts';
import {
  Loader2, Flame, Utensils,
  Zap, Scale, Clock, Heart, Brain, AlertTriangle, CheckCircle2,
  Info, Sparkles,
  Search, Download, FileJson, ChevronLeft, ChevronRight, FileSpreadsheet,
  X, Plus
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { Patient } from '@/types';
import { formatMacroTargetSplitLabel, getMacroTargetSplit, getNutrientTargets } from '@/utils/nutrition';
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
import HydrationWidget from '@/components/analytics/HydrationWidget';
import SymptomTracker from '@/components/analytics/SymptomTracker';
import DeficiencyAlert from '@/components/analytics/DeficiencyAlert';
import FoodMoodChart from '@/components/analytics/FoodMoodChart';
import vitalSignsService, { type SymptomLog } from '@/services/vital-signs.service';
import { AnalyticsKPICards } from '@/components/analytics/AnalyticsKPICards';

// Premium Color Palette - Distinct, High-Contrast, Accessible
const COLORS = {
  // Chart-specific gradients (start = lighter, end = darker)
  weight: { start: '#06b6d4', end: '#0891b2', solid: '#0891b2' },      // Cyan
  calories: { start: '#f97316', end: '#ea580c', solid: '#ea580c' },   // Orange
  protein: { start: '#22c55e', end: '#16a34a', solid: '#16a34a' },    // Green
  carbs: { start: '#eab308', end: '#ca8a04', solid: '#ca8a04' },      // Yellow
  fat: { start: '#ef4444', end: '#dc2626', solid: '#dc2626' },        // Red
  fiber: { start: '#8b5cf6', end: '#7c3aed', solid: '#7c3aed' },      // Violet
  sugar: { start: '#ec4899', end: '#db2777', solid: '#db2777' },      // Pink
  sodium: { start: '#3b82f6', end: '#2563eb', solid: '#2563eb' },     // Blue
  cholesterol: { start: '#f97316', end: '#c2410c', solid: '#c2410c' },// Deep Orange
  satFat: { start: '#f87171', end: '#dc2626', solid: '#dc2626' },        // Light Red
  unsatFat: { start: '#4ade80', end: '#22c55e', solid: '#22c55e' },      // Light Green
  transFat: { start: '#94a3b8', end: '#64748b', solid: '#64748b' },      // Slate

  // Legacy aliases for compatibility
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

// Axis value formatter for large numbers
const formatAxisValue = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 10000) return `${(value / 1000).toFixed(0)}K`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toFixed(0);
};

const getTooltipUnit = (label: string) => {
  if (['Calories', 'Target', 'Intake', 'TDEE Target', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Snack'].includes(label)) {
    return ' kcal';
  }
  if (label === 'Weight') {
    return ' kg';
  }
  if (['Sodium', 'Cholesterol', 'Iron', 'Calcium', 'Potassium'].includes(label)) {
    return ' mg';
  }
  if (label === 'Vitamin D') {
    return ' IU';
  }
  return ' g';
};

interface TrendDataPoint {
  date: string;
  Calories: number;
  Target: number;
  Protein: number;
  Carbohydrates: number;
  Fat: number;
  Fiber: number;
  Sugar: number;
  Sodium: number;
  Cholesterol: number;
  'Saturated Fat': number;
  'Unsaturated Fat': number;
  'Trans-fat': number;
  Iron: number;
  Calcium: number;
  'Vitamin D': number;
  Potassium: number;
}


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

            if (displayValue === null || displayValue === undefined) {
              return null;
            }

            return (
              <div key={p.name} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.payload?.fill || p.payload?.color }} />
                <span className="text-gray-600">{originalName}:</span>
                <span className="font-semibold text-gray-900">
                  {Number(displayValue).toFixed(1)}
                  {getTooltipUnit(originalName)}
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
  const [period, setPeriod] = useState<AnalyticsPeriod>('weekly');
  const [stats, setStats] = useState<NutrientStats | null>(null);
  const [compliance, setCompliance] = useState<ComplianceStats | null>(null);
  const [distribution, setDistribution] = useState<MealDistribution | null>(null);
  const [history, setHistory] = useState<DailyHistory[]>([]); // Chart specific history (bound to period)
  const [weightHistory, setWeightHistory] = useState<WeightHistory | null>(null);
  const [symptomHistory, setSymptomHistory] = useState<SymptomLog[]>([]);
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

  const toggleVisibility = (data: any) => {
    const { value } = data;
    setHiddenNutrients(prev =>
      prev.includes(value)
      ? prev.filter(n => n !== value)
      : [...prev, value]
    );
  };

  const requestedDays = useMemo(() => {
    switch (period) {
      case 'weekly':
        return 7;
      case 'monthly':
        return 30;
      case '60days':
        return 60;
      case 'all':
        return 0;
      default:
        return 7;
    }
  }, [period]);
  const analyticsDays = useMemo(
    () => stats?.dates.length || requestedDays || 1,
    [requestedDays, stats]
  );

  const fetchSymptomHistory = async (): Promise<void> => {
    const symptomData = await vitalSignsService.getRecentSymptoms();
    setSymptomHistory(symptomData);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const statsData = await analyticsService.getPatientAnalytics(period);
        const chartSpanDays = statsData.dates.length || requestedDays || 1;

        const [complianceData, distributionData, historyData, advData, fullHistoryData, weightHistoryData, symptomData] = await Promise.all([
          analyticsService.getComplianceStats(chartSpanDays),
          analyticsService.getMealDistribution(chartSpanDays),
          analyticsService.getDailyHistory(chartSpanDays),
          analyticsService.getAdvancedStats(),
          analyticsService.getDailyHistory(180), // Fetch strict 180 days for the table regardless of chart selection
          analyticsService.getWeightHistory(Math.max(chartSpanDays, 30)),
          vitalSignsService.getRecentSymptoms()
        ]);

        setStats(statsData);
        setCompliance(complianceData);
        setDistribution(distributionData);
        setHistory(historyData);
        setAdvancedStats(advData);
        setFullHistory(fullHistoryData);
        setWeightHistory(weightHistoryData);
        setSymptomHistory(symptomData);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period, requestedDays]);

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
      day.total_sodium,
      day.total_cholesterol,
      day.total_saturated_fat,
      // New fields might ideally be added here for export, but skipping for brevity
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


  // Centralized targets
  const t = getNutrientTargets(patient, advancedStats?.tdee);
  const targetMacroSplit = useMemo(() => getMacroTargetSplit(t), [t]);
  const targetMacroLabel = useMemo(() => formatMacroTargetSplitLabel(t), [t]);

  const avgProtein = useMemo(() => (stats?.macro_nutrients?.find(n => n.name === 'Protein')?.data.reduce((a, b) => a + b, 0) || 0) / analyticsDays, [analyticsDays, stats]);
  const avgFiber = useMemo(() => (stats?.macro_nutrients?.find(n => n.name === 'Fiber')?.data.reduce((a, b) => a + b, 0) || 0) / analyticsDays, [analyticsDays, stats]);
  const avgCarbs = useMemo(() => (stats?.macro_nutrients?.find(n => n.name === 'Carbohydrates')?.data.reduce((a, b) => a + b, 0) || 0) / analyticsDays, [analyticsDays, stats]);
  const avgSugar = useMemo(() => (stats?.limiting_nutrients?.find(n => n.name === 'Sugar')?.data.reduce((a, b) => a + b, 0) || 0) / analyticsDays, [analyticsDays, stats]);
  const avgSodium = useMemo(() => (stats?.micro_nutrients?.find(n => n.name === 'Sodium')?.data.reduce((a, b) => a + b, 0) || 0) / analyticsDays, [analyticsDays, stats]);
  const avgChol = useMemo(() => (stats?.micro_nutrients?.find(n => n.name === 'Cholesterol')?.data.reduce((a, b) => a + b, 0) || 0) / analyticsDays, [analyticsDays, stats]);

  // New Micros (Removed manual averages as they are handled dynamically in the mapping)


  const avgSatFat = useMemo(() => (stats?.limiting_nutrients?.find(n => n.name === 'Saturated Fat')?.data.reduce((a, b) => a + b, 0) || 0) / analyticsDays, [analyticsDays, stats]);
  const avgFat = useMemo(() => (stats?.macro_nutrients?.find(n => n.name === 'Fat')?.data.reduce((a, b) => a + b, 0) || 0) / analyticsDays, [analyticsDays, stats]);
  const avgTransFat = useMemo(() => (stats?.limiting_nutrients?.find(n => n.name === 'Trans-fat')?.data.reduce((a, b) => a + b, 0) || 0) / analyticsDays, [analyticsDays, stats]);







  const carbQualityScore = avgSugar > 0 ? (avgFiber / avgSugar) : 0;

  const trendData = useMemo<TrendDataPoint[]>(() => {
    if (!stats) {
      return [];
    }

    return stats.dates.map((date, index) => {
      const getSeriesValue = (name: string, series: { name: string; data: number[] }[]) =>
        series.find((nutrient) => nutrient.name === name)?.data[index] || 0;

      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Calories: stats.calories[index] || 0,
        Target: t.calories,
        Protein: getSeriesValue('Protein', stats.macro_nutrients),
        Carbohydrates: getSeriesValue('Carbohydrates', stats.macro_nutrients),
        Fat: getSeriesValue('Fat', stats.macro_nutrients),
        Fiber: getSeriesValue('Fiber', stats.macro_nutrients),
        Sugar: getSeriesValue('Sugar', stats.limiting_nutrients),
        Sodium: getSeriesValue('Sodium', stats.micro_nutrients),
        Cholesterol: getSeriesValue('Cholesterol', stats.micro_nutrients),
        'Saturated Fat': getSeriesValue('Saturated Fat', stats.limiting_nutrients),
        'Unsaturated Fat': getSeriesValue('Unsaturated Fat', stats.limiting_nutrients),
        'Trans-fat': getSeriesValue('Trans-fat', stats.limiting_nutrients),
        Iron: getSeriesValue('Iron', stats.micro_nutrients),
        Calcium: getSeriesValue('Calcium', stats.micro_nutrients),
        'Vitamin D': getSeriesValue('Vitamin D', stats.micro_nutrients),
        Potassium: getSeriesValue('Potassium', stats.micro_nutrients),
      };
    });
  }, [stats, t.calories]);

  const hasData = trendData.some(d => d.Calories > 0);

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
    { name: 'Saturated', value: stats?.limiting_nutrients?.find(n => n.name === 'Saturated Fat')?.data.reduce((a, b) => a + b, 0) || 0 },
    { name: 'Unsaturated', value: stats?.limiting_nutrients?.find(n => n.name === 'Unsaturated Fat')?.data.reduce((a, b) => a + b, 0) || 0 },
    { name: 'Trans-fat', value: stats?.limiting_nutrients?.find(n => n.name === 'Trans-fat')?.data.reduce((a, b) => a + b, 0) || 0 },
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
    const avgCal = (stats?.calories.reduce((a, b) => a + b, 0) || 0) / analyticsDays;
    const targetCalories = t.calories;
    const diff = targetCalories - avgCal;
    if (diff > 300) return { type: 'warning' as const, text: `You're averaging ${Math.round(diff)} kcal below your energy needs. Consider adding nutrient-dense snacks like nuts or Greek yogurt.` };
    if (diff < -300) return { type: 'warning' as const, text: `You're ${Math.round(Math.abs(diff))} kcal over your target. Try portion control on carbohydrates to reduce intake.` };
    return { type: 'good' as const, text: `Excellent! Your calorie intake is well-balanced with your daily energy expenditure.` };
  }, [analyticsDays, stats, t]);

  const macroInsight = useMemo(() => {
    const actual = {
      Protein: macroRatioData.find((item) => item.name === 'Protein')?.value || 0,
      Carbohydrates: macroRatioData.find((item) => item.name === 'Carbohydrates')?.value || 0,
      Fat: macroRatioData.find((item) => item.name === 'Fat')?.value || 0,
    };
    const targets = {
      Protein: targetMacroSplit.proteinPct,
      Carbohydrates: targetMacroSplit.carbsPct,
      Fat: targetMacroSplit.fatPct,
    };

    const largestDeviation = Object.entries(actual)
      .map(([name, value]) => ({
        name,
        actual: value,
        target: targets[name as keyof typeof targets],
        diff: value - targets[name as keyof typeof targets],
      }))
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))[0];

    if (!largestDeviation || Math.abs(largestDeviation.diff) <= 5) {
      return { type: 'good' as const, text: `Your current macro split is close to your personal target (${targetMacroLabel}).` };
    }

    if (largestDeviation.diff > 0) {
      return {
        type: 'info' as const,
        text: `${largestDeviation.name} is running above your personal target (${largestDeviation.actual}% vs ${largestDeviation.target}%). Keep portion sizes in check if this is intentional.`,
      };
    }

    return {
      type: 'warning' as const,
      text: `${largestDeviation.name} is below your personal target (${largestDeviation.actual}% vs ${largestDeviation.target}%). Rebalancing meals could improve adherence.`,
    };
  }, [macroRatioData, targetMacroLabel, targetMacroSplit]);

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

  // Weight Trend Data Prep
  const weightChartData = useMemo(() => {
    if (!weightHistory) return [];
    return weightHistory.dates.map((date, i) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: weightHistory.weights[i],
      calories: weightHistory.calories[i],
      measured: weightHistory.measured?.[i] ?? weightHistory.weights[i] !== null,
    }));
  }, [weightHistory]);
  const recordedWeightEntries = useMemo(
    () => weightChartData.filter((entry) => entry.measured && entry.weight !== null && entry.weight !== undefined),
    [weightChartData]
  );

  const weightTrendInsight = useMemo(() => {
    if (recordedWeightEntries.length < 2) return { type: 'info' as const, text: 'Not enough recorded weigh-ins to determine a reliable weight trend.' };
    const start = recordedWeightEntries[0].weight as number;
    const end = recordedWeightEntries[recordedWeightEntries.length - 1].weight as number;
    const diff = end - start;

    if (diff < -0.5) return { type: 'good' as const, text: `Across your recorded weigh-ins, weight is down ${Math.abs(diff).toFixed(1)}kg this period.` };
    if (diff > 0.5) return { type: 'warning' as const, text: `Across your recorded weigh-ins, weight is up ${diff.toFixed(1)}kg this period. Review calorie balance and meal consistency.` };
    return { type: 'info' as const, text: `Your recorded weigh-ins are broadly stable (${Math.abs(diff).toFixed(1)}kg change).` };
  }, [recordedWeightEntries]);

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
          <Select value={period} onValueChange={(value) => setPeriod(value as AnalyticsPeriod)}>
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
        <div className="mb-8">
          <AnalyticsKPICards
            patient={patient}
            stats={stats}
            compliance={compliance}
            advancedStats={advancedStats}
            weightHistory={weightHistory}
            days={analyticsDays}
          />
        </div>

        {/* Section 2: Energy Analysis */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500" /> Energy Analysis
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-4">
            <Card className="lg:col-span-2 shadow-sm transition-all duration-300 hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      Calories vs Target (TDEE)
                      <TooltipProvider>
                        <ShadTooltip>
                          <TooltipTrigger><Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-help" /></TooltipTrigger>
                          <TooltipContent><p className="max-w-[200px]">Compares your daily calorie intake against your Total Daily Energy Expenditure (TDEE) target.</p></TooltipContent>
                        </ShadTooltip>
                      </TooltipProvider>
                    </CardTitle>
                    <CardDescription>How your daily intake compares to your energy needs</CardDescription>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" aria-label="Show calorie insight" className={cn("p-2 rounded-full transition-colors", energyInsight.type === 'good' ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : energyInsight.type === 'warning' ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-blue-100 text-blue-600 hover:bg-blue-200')}>
                        {energyInsight.type === 'good' ? <CheckCircle2 className="w-5 h-5" /> : energyInsight.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4" align="end">
                      <div className="font-semibold mb-1 capitalize flex items-center gap-2">
                        {energyInsight.type === 'good' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Info className="w-4 h-4" />}
                        {energyInsight.type} Insight
                      </div>
                      <p className="text-sm text-gray-600">{energyInsight.text}</p>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>
              <CardContent className="h-[450px] mt-0 flex items-center justify-center p-6 pt-0">
                {hasData ? (
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
                        if (analyticsDays <= 7) return val;
                        if (analyticsDays <= 30) return index % 3 === 0 ? val : '';
                        if (analyticsDays <= 60) return index % 6 === 0 ? val : '';
                        return index % 14 === 0 ? val : '';
                      }} />
                      <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={10} />
                      <Area type="monotone" dataKey="Calories" stroke={COLORS.amber.start} fill="url(#calGradient)" strokeWidth={2} name="Intake" />
                      <Line type="monotone" dataKey="Target" stroke={COLORS.coral.start} strokeWidth={2.5} strokeDasharray="6 4" dot={false} name="TDEE Target" />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <p>No data recorded for this period</p>
                    <Button variant="link" className="mt-2 text-primary" onClick={() => setPeriod('monthly')}>
                      Switch to Monthly View
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm transition-all duration-300 hover:shadow-md h-full flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
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
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" aria-label="Show meal timing insight" className="p-2 rounded-full transition-colors bg-blue-100 text-blue-600 hover:bg-blue-200">
                        <Info className="w-5 h-5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4" align="end">
                      <div className="font-semibold mb-1 capitalize flex items-center gap-2">
                        <Info className="w-4 h-4 text-blue-600" />
                        Timing Insight
                      </div>
                      <p className="text-sm text-gray-600">Balanced meal distribution helps maintain steady energy levels throughout the day.</p>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribution?.distribution || []}
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      animationDuration={500}
                      cornerRadius={8}
                    >
                      {(distribution?.distribution || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={[COLORS.protein.start, COLORS.carbs.start, COLORS.fiber.start, COLORS.sodium.start][index % 4]} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
              <div className="px-6 pb-6 flex flex-wrap gap-3 justify-center text-xs">
                {(distribution?.distribution || []).map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: [COLORS.protein.start, COLORS.carbs.start, COLORS.fiber.start, COLORS.sodium.start][i % 4] }} />
                    <span className="text-gray-600">{d.name}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* Section 2a: Clinical Vitals & Deep Nutrition */}
        <section className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="h-[380px]">
            <HydrationWidget />
          </div>
          <div className="h-[380px]">
            <SymptomTracker onSymptomLogged={fetchSymptomHistory} />
          </div>
          <div className="h-[380px]">
            <DeficiencyAlert
              nutrients={[...(stats?.macro_nutrients || []), ...(stats?.micro_nutrients || [])]}
              limits={{
                'Protein': { daily: t.protein },
                'Fiber': { daily: t.fiber },
                'Sodium': { daily: t.sodium },
                'Cholesterol': { daily: t.cholesterol },
                'Saturated Fat': { daily: t.saturated_fat },
                'Sugar': { daily: t.sugar },
                // Add more from 't' if available or rely on defaults
              }}
            />
          </div>
        </section>

        {/* Section 2b: Food-Mood Correlation */}
        <section className="mb-8">
          <FoodMoodChart
            dates={stats?.dates || []}
            nutrients={[
              ...(stats?.macro_nutrients || []),
              ...(stats?.micro_nutrients || []),
              ...(stats?.limiting_nutrients || []),
            ]}
            symptomLogs={symptomHistory}
          />
        </section>

        {/* Section 2b: Weight Progression */}
        <section className="mb-8">
          <Card className="col-span-full shadow-sm transition-all duration-300 hover:shadow-md bg-white border border-gray-100">
            <CardHeader className="border-b border-gray-50">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-teal-500" />
                    Recorded Weight vs Intake
                    <TooltipProvider>
                      <ShadTooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-[220px]">Shows logged weigh-ins alongside daily calorie intake. Days without a weight entry are left blank rather than estimated.</p>
                        </TooltipContent>
                      </ShadTooltip>
                    </TooltipProvider>
                  </CardTitle>
                  <CardDescription>Only recorded weigh-ins are plotted against daily calories.</CardDescription>
                </div>
                {/* Weight Insight */}
                <div className="flex items-center gap-4 text-sm">
                  {recordedWeightEntries.length > 0 && (
                    <>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-700 rounded-full font-medium">
                        First Log: <span className="font-bold">{recordedWeightEntries[0].weight} kg</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-violet-50 text-violet-700 rounded-full font-medium">
                        Latest Log: <span className="font-bold">{recordedWeightEntries[recordedWeightEntries.length - 1].weight} kg</span>
                      </div>
                    </>
                  )}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" aria-label="Show weight trend insight" className={cn("p-2 rounded-full transition-colors", weightTrendInsight.type === 'good' ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : weightTrendInsight.type === 'warning' ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-blue-100 text-blue-600 hover:bg-blue-200')}>
                        <Info className="w-5 h-5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4" align="end">
                      <div className="font-semibold mb-1 capitalize flex items-center gap-2">
                        <Info className={cn("w-4 h-4", weightTrendInsight.type === 'good' ? "text-emerald-500" : "text-blue-500")} />
                        Weight Insight
                      </div>
                      <p className="text-sm text-gray-600">{weightTrendInsight.text}</p>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[400px] mt-4 flex items-center justify-center p-4">
              {recordedWeightEntries.length > 0 ? (
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
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      dy={10}
                      tickFormatter={(value, index) => {
                        if (analyticsDays <= 7) return value;
                        if (analyticsDays <= 30) return index % 3 === 0 ? value : '';
                        if (analyticsDays <= 60) return index % 6 === 0 ? value : '';
                        return index % 14 === 0 ? value : '';
                      }}
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
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="weight"
                      name="Recorded Weight"
                      stroke={COLORS.weight.start}
                      strokeWidth={3}
                      connectNulls
                      dot={{ r: 4, fill: COLORS.weight.start, stroke: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: COLORS.weight.start, stroke: '#fff', strokeWidth: 2 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">No recorded weight logs available</div>
              )}
            </CardContent>
          </Card>
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
                % of Goal <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Advanced</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:gap-4">
            {/* Macronutrient Trends */}
            <Card className="shadow-sm transition-all duration-300 hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {useNormalized ? "Macronutrient Daily Trends (% of Goal)" : "Macronutrient Daily Trends"}
                      <TooltipProvider>
                        <ShadTooltip>
                          <TooltipTrigger><Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-help" /></TooltipTrigger>
                          <TooltipContent><p className="max-w-[200px]">{useNormalized ? "Tracks nutrients relative to your daily goals. 100% means you hit your target exactly." : "Tracks daily intake in grams (g) or calories (kcal)."}</p></TooltipContent>
                        </ShadTooltip>
                      </TooltipProvider>
                    </CardTitle>
                    <CardDescription>Calories, Protein, Carbohydrates, Fat, Fiber, and Sugar</CardDescription>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" aria-label="Show macronutrient insight" className={cn("p-2 rounded-full transition-colors", macroInsight.type === 'good' ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : macroInsight.type === 'warning' ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-blue-100 text-blue-600 hover:bg-blue-200')}>
                        <Info className="w-5 h-5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4" align="end">
                      <div className="font-semibold mb-1 capitalize flex items-center gap-2">
                        <Info className={cn("w-4 h-4", macroInsight.type === 'good' ? "text-emerald-500" : "text-blue-500")} />
                        {macroInsight.type} Insight
                      </div>
                      <p className="text-sm text-gray-600">{macroInsight.text}</p>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>
              <CardContent className="h-[500px] mt-0 flex items-center justify-center p-6 pt-0">
                {hasData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={useNormalized ? normalizedTrendData : trendData} margin={{ top: 20, right: 35, left: 15, bottom: 25 }}>
                      <defs>
                        {/* Macronutrient Gradients */}
                        <linearGradient id="gradCaloriesLine" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.calories.start} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={COLORS.calories.start} stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="gradProteinLine" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.protein.start} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={COLORS.protein.start} stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="gradCarbsLine" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.carbs.start} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={COLORS.carbs.start} stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="gradFatLine" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.fat.start} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={COLORS.fat.start} stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="gradFiberLine" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.fiber.start} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={COLORS.fiber.start} stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="gradSugarLine" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.sugar.start} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={COLORS.sugar.start} stopOpacity={0.0} />
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
                          if (analyticsDays <= 7) return val;
                          if (analyticsDays <= 30) return index % 3 === 0 ? val : '';
                          if (analyticsDays <= 60) return index % 6 === 0 ? val : '';
                          return index % 14 === 0 ? val : '';
                        }}
                      />
                      {useNormalized ? (
                        <YAxis
                          yAxisId="left"
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          unit="%"
                          tick={{ fill: '#64748b' }}
                        />
                      ) : (
                        <>
                          <YAxis
                            yAxisId="cal"
                            orientation="left"
                            stroke={COLORS.calories.solid}
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={formatAxisValue}
                            tick={{ fill: COLORS.calories.solid }}
                            label={{ value: 'Calories', angle: -90, position: 'insideLeft', offset: 5, fill: COLORS.calories.solid, fontSize: 12 }}
                          />
                          <YAxis
                            yAxisId="grams"
                            orientation="right"
                            stroke="#64748b"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: '#64748b' }}
                            label={{ value: 'Grams', angle: 90, position: 'insideRight', offset: 10, fill: '#64748b', fontSize: 12 }}
                          />
                        </>
                      )}
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeDasharray: '3 3' }} />
                      <Legend
                        onClick={toggleVisibility}
                        iconType="circle"
                        iconSize={10}
                        wrapperStyle={{ cursor: 'pointer', paddingTop: '15px' }}
                      />
                      {useNormalized && <ReferenceLine y={100} yAxisId="left" stroke={COLORS.good} strokeDasharray="5 5" strokeWidth={2} label={{ position: 'right', value: '100% Goal', fill: COLORS.good, fontSize: 11, fontWeight: 500 }} />}
                      <Area
                        yAxisId={useNormalized ? "left" : "cal"}
                        type="monotone"
                        dataKey={useNormalized ? "CaloriesPct" : "Calories"}
                        name="Calories"
                        stroke={COLORS.calories.solid}
                        fill="url(#gradCaloriesLine)"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 5, fill: COLORS.calories.start, stroke: '#fff', strokeWidth: 2 }}
                        hide={hiddenNutrients.includes('Calories')}
                      />
                      <Area
                        yAxisId={useNormalized ? "left" : "grams"}
                        type="monotone"
                        dataKey={useNormalized ? "ProteinPct" : "Protein"}
                        name="Protein"
                        stroke={COLORS.protein.solid}
                        fill="url(#gradProteinLine)"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5, fill: COLORS.protein.start, stroke: '#fff', strokeWidth: 2 }}
                        hide={hiddenNutrients.includes('Protein')}
                      />
                      <Area
                        yAxisId={useNormalized ? "left" : "grams"}
                        type="monotone"
                        dataKey={useNormalized ? "CarbohydratesPct" : "Carbohydrates"}
                        name="Carbohydrates"
                        stroke={COLORS.carbs.solid}
                        fill="url(#gradCarbsLine)"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5, fill: COLORS.carbs.start, stroke: '#fff', strokeWidth: 2 }}
                        hide={hiddenNutrients.includes('Carbohydrates')}
                      />
                      <Area
                        yAxisId={useNormalized ? "left" : "grams"}
                        type="monotone"
                        dataKey={useNormalized ? "FatPct" : "Fat"}
                        name="Fat"
                        stroke={COLORS.fat.solid}
                        fill="url(#gradFatLine)"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5, fill: COLORS.fat.start, stroke: '#fff', strokeWidth: 2 }}
                        hide={hiddenNutrients.includes('Fat')}
                      />
                      <Area
                        yAxisId={useNormalized ? "left" : "grams"}
                        type="monotone"
                        dataKey={useNormalized ? "FiberPct" : "Fiber"}
                        name="Fiber"
                        stroke={COLORS.fiber.solid}
                        fill="url(#gradFiberLine)"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5, fill: COLORS.fiber.start, stroke: '#fff', strokeWidth: 2 }}
                        hide={hiddenNutrients.includes('Fiber')}
                      />
                      <Area
                        yAxisId={useNormalized ? "left" : "grams"}
                        type="monotone"
                        dataKey={useNormalized ? "SugarPct" : "Sugar"}
                        name="Sugar"
                        stroke={COLORS.sugar.solid}
                        fill="url(#gradSugarLine)"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5, fill: COLORS.sugar.start, stroke: '#fff', strokeWidth: 2 }}
                        hide={hiddenNutrients.includes('Sugar')}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">No data available</div>
                )}
              </CardContent>
            </Card>

            {/* Micronutrient Trends */}
            <Card className="shadow-sm transition-all duration-300 hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
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
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" aria-label="Show micronutrient insight" className="p-2 rounded-full transition-colors bg-blue-100 text-blue-600 hover:bg-blue-200">
                        <Info className="w-5 h-5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4" align="end">
                      <div className="font-semibold mb-1 capitalize flex items-center gap-2">
                        <Info className="w-4 h-4 text-blue-500" />
                        Micronutrient Insight
                      </div>
                      <p className="text-sm text-gray-600">High Sodium and Saturated Fat are key risk factors. Keep their trend lines below the reference goals.</p>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>
              <CardContent className="h-[500px] mt-4 flex items-center justify-center p-6 pt-0">
                {hasData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={useNormalized ? normalizedTrendData : trendData} margin={{ top: 20, right: 35, left: 15, bottom: 25 }}>
                      <defs>
                        <linearGradient id="gradSodiumLine" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.sodium.start} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={COLORS.sodium.start} stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="gradCholesterolLine" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.cholesterol.start} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={COLORS.cholesterol.start} stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="gradSatFatLine" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.satFat.start} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={COLORS.satFat.start} stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="gradUnsatFatLine" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.unsatFat.start} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={COLORS.unsatFat.start} stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="gradTransFatLine" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.transFat.start} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={COLORS.transFat.start} stopOpacity={0.0} />
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
                          if (analyticsDays <= 7) return val;
                          if (analyticsDays <= 30) return index % 3 === 0 ? val : '';
                          if (analyticsDays <= 60) return index % 6 === 0 ? val : '';
                          return index % 14 === 0 ? val : '';
                        }}
                      />
                      {useNormalized ? (
                        <YAxis
                          yAxisId="left"
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          unit="%"
                          tick={{ fill: '#64748b' }}
                        />
                      ) : (
                        <>
                          <YAxis
                            yAxisId="mg"
                            orientation="left"
                            stroke={COLORS.sodium.solid}
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={formatAxisValue}
                            tick={{ fill: COLORS.sodium.solid }}
                            label={{ value: 'mg', angle: -90, position: 'insideLeft', offset: 5, fill: COLORS.sodium.solid, fontSize: 12 }}
                          />
                          <YAxis
                            yAxisId="g"
                            orientation="right"
                            stroke={COLORS.satFat.solid}
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: COLORS.satFat.solid }}
                            label={{ value: 'g', angle: 90, position: 'insideRight', offset: 10, fill: COLORS.satFat.solid, fontSize: 12 }}
                          />
                        </>
                      )}
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeDasharray: '3 3' }} />
                      <Legend
                        onClick={toggleVisibility}
                        wrapperStyle={{ cursor: 'pointer', paddingTop: '15px' }}
                        iconType="circle"
                        iconSize={10}
                      />
                      {useNormalized && <ReferenceLine y={100} yAxisId="left" stroke={COLORS.danger} strokeDasharray="5 5" strokeWidth={2} label={{ position: 'right', value: 'Limit', fill: COLORS.danger, fontSize: 11, fontWeight: 500 }} />}
                      <Area
                        yAxisId={useNormalized ? "left" : "mg"}
                        type="monotone"
                        dataKey={useNormalized ? "SodiumPct" : "Sodium"}
                        name="Sodium"
                        stroke={COLORS.sodium.solid}
                        fill="url(#gradSodiumLine)"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5, fill: COLORS.sodium.start, stroke: '#fff', strokeWidth: 2 }}
                        hide={hiddenNutrients.includes('Sodium')}
                      />
                      <Area
                        yAxisId={useNormalized ? "left" : "mg"}
                        type="monotone"
                        dataKey={useNormalized ? "CholesterolPct" : "Cholesterol"}
                        name="Cholesterol"
                        stroke={COLORS.cholesterol.solid}
                        fill="url(#gradCholesterolLine)"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5, fill: COLORS.cholesterol.start, stroke: '#fff', strokeWidth: 2 }}
                        hide={hiddenNutrients.includes('Cholesterol')}
                      />
                      <Area
                        yAxisId={useNormalized ? "left" : "g"}
                        type="monotone"
                        dataKey={useNormalized ? "Saturated FatPct" : "Saturated Fat"}
                        name="Saturated Fat"
                        stroke={COLORS.satFat.solid}
                        fill="url(#gradSatFatLine)"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5, fill: COLORS.satFat.start, stroke: '#fff', strokeWidth: 2 }}
                        hide={hiddenNutrients.includes('Saturated Fat')}
                      />
                      <Area
                        yAxisId={useNormalized ? "left" : "g"}
                        type="monotone"
                        dataKey={useNormalized ? "Unsaturated FatPct" : "Unsaturated Fat"}
                        name="Unsaturated Fat"
                        stroke={COLORS.unsatFat.solid}
                        fill="url(#gradUnsatFatLine)"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5, fill: COLORS.unsatFat.start, stroke: '#fff', strokeWidth: 2 }}
                        hide={hiddenNutrients.includes('Unsaturated Fat')}
                      />
                      <Area
                        yAxisId={useNormalized ? "left" : "g"}
                        type="monotone"
                        dataKey={useNormalized ? "Trans-fatPct" : "Trans-fat"}
                        name="Trans-fat"
                        stroke={COLORS.transFat.solid}
                        fill="url(#gradTransFatLine)"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5, fill: COLORS.transFat.start, stroke: '#fff', strokeWidth: 2 }}
                        hide={hiddenNutrients.includes('Trans-fat')}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">No data available</div>
                )}
              </CardContent>
            </Card>

            {/* Calorie Composition & Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-4 mt-4">
              <Card className="shadow-sm transition-all duration-300 hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        Calorie Composition
                        <TooltipProvider>
                          <ShadTooltip>
                            <TooltipTrigger>
                              <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-[220px]">Shows how your average calories are split across protein, carbohydrates, and fat. Personal target: {targetMacroLabel}.</p>
                            </TooltipContent>
                          </ShadTooltip>
                        </TooltipProvider>
                      </CardTitle>
                      <CardDescription>Current average split. Personal target: {targetMacroLabel}</CardDescription>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button type="button" aria-label="Show composition insight" className="p-2 rounded-full transition-colors bg-blue-100 text-blue-600 hover:bg-blue-200">
                          <Info className="w-5 h-5" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-4" align="end">
                        <div className="font-semibold mb-1 capitalize flex items-center gap-2">
                          <Info className="w-4 h-4 text-blue-600" />
                          Composition Insight
                        </div>
                        <p className="text-sm text-gray-600">This chart summarizes your current average macro split. Use your personal target ({targetMacroLabel}) as the reference point.</p>
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardHeader>
                <CardContent className="min-h-[400px] flex flex-col items-center justify-between p-6">
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
                        <span className="text-xs text-gray-400">{Math.round(m.kcal)} kcal</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Pattern Analysis (Scatter Plot) */}
              <Card className="shadow-sm transition-all duration-300 hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
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
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button type="button" aria-label="Show nutrition pattern insight" className="p-2 rounded-full transition-colors bg-blue-100 text-blue-600 hover:bg-blue-200">
                          <Info className="w-5 h-5" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-4" align="end">
                        <div className="font-semibold mb-1 capitalize flex items-center gap-2">
                          <Info className="w-4 h-4 text-blue-500" />
                          Pattern Insight
                        </div>
                        <p className="text-sm text-gray-600">This scatter plot reveals your eating habits. Aim for the "Balanced" (Green) zone in the center.</p>
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardHeader>
                <CardContent className="h-[400px] flex flex-col p-6">
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 30, bottom: 25, left: 10 }}>
                        <defs>
                          <linearGradient id="scatterGradBalanced" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={COLORS.good} stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                          </linearGradient>
                          <linearGradient id="scatterGradWarning" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={COLORS.warning} stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#d97706" stopOpacity={1} />
                          </linearGradient>
                          <linearGradient id="scatterGradDanger" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={COLORS.danger} stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#dc2626" stopOpacity={1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.5} />
                        <XAxis
                          type="number"
                          dataKey="x"
                          name="Carbs"
                          unit="g"
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: '#64748b' }}
                          label={{ value: 'Carbs (g)', position: 'insideBottom', offset: -10, fill: COLORS.carbs.solid, fontSize: 12 }}
                        />
                        <YAxis
                          type="number"
                          dataKey="y"
                          name="Fat"
                          unit="g"
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: '#64748b' }}
                          label={{ value: 'Fat (g)', angle: -90, position: 'insideLeft', fill: COLORS.fat.solid, fontSize: 12 }}
                        />
                        <ZAxis type="number" dataKey="z" range={[80, 400]} name="Calories" unit="kcal" />
                        <Tooltip
                          cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white/95 backdrop-blur-sm p-4 border border-gray-100 shadow-xl rounded-xl min-w-[160px]">
                                  <p className="font-bold text-gray-800 mb-2">{data.date}</p>
                                  <div className="space-y-1.5 text-xs">
                                    <div className="flex justify-between gap-3"><span className="text-gray-500">Calories:</span> <span className="font-semibold text-gray-800">{data.z} kcal</span></div>
                                    <div className="flex justify-between gap-3"><span style={{ color: COLORS.carbs.solid }}>Carbs:</span> <span className="font-semibold">{data.x}g</span></div>
                                    <div className="flex justify-between gap-3"><span style={{ color: COLORS.fat.solid }}>Fat:</span> <span className="font-semibold">{data.y}g</span></div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <ReferenceLine x={t.carbs} stroke={COLORS.carbs.solid} strokeDasharray="5 5" strokeWidth={1.5} label={{ value: 'Target Carbs', position: 'insideTopRight', fill: COLORS.carbs.solid, fontSize: 10, fontWeight: 500 }} />
                        <ReferenceLine y={t.fat} stroke={COLORS.fat.solid} strokeDasharray="5 5" strokeWidth={1.5} label={{ value: 'Target Fat', position: 'insideTopRight', fill: COLORS.fat.solid, fontSize: 10, fontWeight: 500 }} />
                        <Scatter name="Daily Intake" data={history.map(h => ({
                          x: h.total_carbohydrates,
                          y: h.total_fat,
                          z: h.total_calories,
                          date: new Date(h.date).toLocaleDateString(),
                          fill: (h.total_carbohydrates > t.carbs * 1.2 && h.total_fat > t.fat * 1.2) ? COLORS.danger :
                            (h.total_carbohydrates < t.carbs * 0.8 && h.total_fat > t.fat * 1.2) ? COLORS.warning :
                              COLORS.good
                        }))}>
                          {history.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={(entry.total_carbohydrates > t.carbs * 1.2 && entry.total_fat > t.fat * 1.2) ? COLORS.danger : (entry.total_carbohydrates < t.carbs * 0.8 && entry.total_fat > t.fat * 1.2) ? COLORS.warning : COLORS.good}
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
                      <div className="w-3 h-3 rounded-full shadow-sm flex-shrink-0" style={{ backgroundColor: COLORS.good }}></div>
                      <span>Balanced</span>
                    </div>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <div className="w-3 h-3 rounded-full shadow-sm flex-shrink-0" style={{ backgroundColor: COLORS.warning }}></div>
                      <span>Imbalanced</span>
                    </div>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <div className="w-3 h-3 rounded-full shadow-sm flex-shrink-0" style={{ backgroundColor: COLORS.danger }}></div>
                      <span>Excess (High Carb+Fat)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 4: Fat Quality & Section 5: Glycemic Control */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-4">
          {/* Fat Quality */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Scale className="w-6 h-6 text-rose-500" /> Fat Quality Analysis
            </h2>
            <Card className="shadow-sm h-full transition-all duration-300 hover:shadow-md flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      Lipid Breakdown
                      <TooltipProvider>
                        <ShadTooltip>
                          <TooltipTrigger><Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-help" /></TooltipTrigger>
                          <TooltipContent><p className="max-w-[200px]">Breakdown of fat types. Unsaturated fats are healthy; Saturated and Trans-fats should be limited.</p></TooltipContent>
                        </ShadTooltip>
                      </TooltipProvider>
                    </CardTitle>
                    <CardDescription>Healthy vs unhealthy fat sources</CardDescription>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" aria-label="Show fat quality insight" className={cn("p-2 rounded-full transition-colors", fatInsight.type === 'good' ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : fatInsight.type === 'warning' ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-red-100 text-red-600 hover:bg-red-200')}>
                        <Info className="w-5 h-5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4" align="end">
                      <div className="font-semibold mb-1 capitalize flex items-center gap-2">
                        <Info className={cn("w-4 h-4", fatInsight.type === 'good' ? "text-emerald-600" : fatInsight.type === 'warning' ? "text-amber-600" : "text-red-600")} />
                        {fatInsight.type} Insight
                      </div>
                      <p className="text-sm text-gray-600">{fatInsight.text}</p>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-8 p-6 min-h-[300px]">
                {/* Donut Chart */}
                <div className="h-[200px] w-[200px] relative flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={fatData}
                        innerRadius={60}
                        outerRadius={80}
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
                  {/* Center Text */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <span className="text-xs text-muted-foreground uppercase tracking-widest">Total</span>
                      <div className="text-xl font-bold text-gray-800">{totalFat.toFixed(1)}</div>
                      <span className="text-xs text-gray-500">grams</span>
                    </div>
                  </div>
                </div>

                {/* Detail Cards */}
                <div className="flex-1 w-full grid grid-cols-3 gap-3">
                  {[
                    { name: 'Saturated Fat', value: fatData[0].value, color: COLORS.satFat.start, bg: COLORS.satFat.end },
                    { name: 'Unsaturated Fat', value: fatData[1].value, color: COLORS.unsatFat.start, bg: COLORS.unsatFat.end },
                    { name: 'Trans-fat', value: fatData[2].value, color: COLORS.cholesterol.start, bg: COLORS.cholesterol.end },
                  ].map((item) => (
                    <div
                      key={item.name}
                      className="flex flex-col items-center p-3 rounded-xl bg-gray-50/50 border border-gray-100"
                    >
                      <div className="w-2 h-2 rounded-full mb-2" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-semibold text-center text-gray-600 mb-0.5">{item.name}</span>
                      <span className="text-lg font-bold" style={{ color: item.color }}>
                        {totalFat > 0 ? Math.round((item.value / totalFat) * 100) : 0}%
                      </span>
                      <span className="text-xs text-gray-400">{item.value.toFixed(1)}g</span>
                    </div>
                  ))}
                </div>
              </CardContent>

            </Card>
          </section>

          {/* Glycemic Control */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Brain className="w-6 h-6 text-pink-500" /> Glycemic Control
            </h2>
            <Card className="shadow-sm h-full transition-all duration-300 hover:shadow-md flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      Sugar vs Fiber
                      <TooltipProvider>
                        <ShadTooltip>
                          <TooltipTrigger><Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-help" /></TooltipTrigger>
                          <TooltipContent><p className="max-w-[200px]">Visualizes the balance between Sugar (spikes blood glucose) and Fiber (stabilizes it).</p></TooltipContent>
                        </ShadTooltip>
                      </TooltipProvider>
                    </CardTitle>
                    <CardDescription>Balance for blood sugar stability</CardDescription>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" aria-label="Show glycemic balance insight" className={cn("p-2 rounded-full transition-colors", glycemicInsight.type === 'good' ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-blue-100 text-blue-600 hover:bg-blue-200')}>
                        <Info className="w-5 h-5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4" align="end">
                      <div className="font-semibold mb-1 capitalize flex items-center gap-2">
                        <Info className={cn("w-4 h-4", glycemicInsight.type === 'good' ? "text-emerald-500" : "text-blue-500")} />
                        {glycemicInsight.type} Insight
                      </div>
                      <p className="text-sm text-gray-600">{glycemicInsight.text}</p>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>
              <CardContent className="h-[450px] mt-4 flex-1 p-6 pt-0">
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
                        if (analyticsDays <= 7) return val;
                        if (analyticsDays <= 30) return index % 3 === 0 ? val : '';
                        if (analyticsDays <= 60) return index % 6 === 0 ? val : '';
                        return index % 14 === 0 ? val : '';
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
                    <Legend
                      iconType="circle"
                      iconSize={10}
                      wrapperStyle={{ paddingTop: '15px' }}
                    />
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
          </section>
        </div>

        {/* Section 6: Heart Health */}
        <section className="mt-24">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500" /> Cardiovascular Health
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-4 pl-1 pr-1">
            {/* 1. Risk Assessment */}
            <Card className="shadow-sm transition-all duration-300 hover:shadow-md">
              <CardHeader className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
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
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" aria-label="Show heart health insight" className={cn("p-2 rounded-full transition-colors", heartInsight.type === 'good' ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-amber-100 text-amber-600 hover:bg-amber-200')}>
                        <Info className="w-5 h-5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4" align="end">
                      <div className="font-semibold mb-1 capitalize flex items-center gap-2">
                        <Info className={cn("w-4 h-4", heartInsight.type === 'good' ? "text-emerald-500" : "text-amber-500")} />
                        {heartInsight.type} Insight
                      </div>
                      <p className="text-sm text-gray-600">{heartInsight.text}</p>
                    </PopoverContent>
                  </Popover>
                </div>
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
            </Card>

            {/* 2. Metabolic Matrix (Carb vs Fat Patterns) */}
            <Card className="shadow-sm transition-all duration-300 hover:shadow-md">
              <CardHeader className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
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
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" aria-label="Show metabolic insight" className="p-2 rounded-full transition-colors bg-blue-100 text-blue-600 hover:bg-blue-200">
                        <Info className="w-5 h-5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4" align="end">
                      <div className="font-semibold mb-1 capitalize flex items-center gap-2">
                        <Info className="w-4 h-4 text-blue-500" />
                        Metabolic Insight
                      </div>
                      <p className="text-sm text-gray-600">Larger circles represent higher calorie days. Clusters in the top-right indicate heavy meals.</p>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>
              <CardContent className="h-[350px] p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 30, bottom: 25, left: 20 }}>
                    <defs>
                      <linearGradient id="metabolicGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={COLORS.info} stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#1d4ed8" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.5} />
                    <XAxis
                      type="number"
                      dataKey="total_carbohydrates"
                      name="Carbs"
                      unit="g"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#64748b' }}
                      label={{ value: 'Carbohydrates (g)', position: 'bottom', offset: 0, fontSize: 12, fill: COLORS.carbs.solid }}
                    />
                    <YAxis
                      type="number"
                      dataKey="total_fat"
                      name="Fat"
                      unit="g"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#64748b' }}
                      label={{ value: 'Fat (g)', angle: -90, position: 'left', offset: 0, fontSize: 12, fill: COLORS.fat.solid }}
                    />
                    <ZAxis type="number" dataKey="total_calories" range={[80, 400]} name="Calories" unit="kcal" />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white/95 backdrop-blur-sm p-4 border border-gray-100 shadow-xl rounded-xl text-xs min-w-[160px]">
                              <p className="font-bold text-gray-800 mb-2">{format(new Date(data.date), 'MMM dd, yyyy')}</p>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                <span className="text-gray-500">Carbs:</span>
                                <span className="font-medium" style={{ color: COLORS.carbs.solid }}>{data.total_carbohydrates}g</span>
                                <span className="text-gray-500">Fat:</span>
                                <span className="font-medium" style={{ color: COLORS.fat.solid }}>{data.total_fat}g</span>
                                <span className="text-gray-500">Calories:</span>
                                <span className="font-medium text-gray-800">{data.total_calories} kcal</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {/* Reference Lines for Targets */}
                    <ReferenceLine x={t?.carbs || 275} stroke={COLORS.good} strokeDasharray="5 5" strokeWidth={1.5} label={{ value: 'Target Carbs', position: 'insideTopRight', fontSize: 10, fill: COLORS.good, fontWeight: 500 }} />
                    <ReferenceLine y={t?.fat || 78} stroke={COLORS.good} strokeDasharray="5 5" strokeWidth={1.5} label={{ value: 'Target Fat', position: 'insideRight', fontSize: 10, fill: COLORS.good, fontWeight: 500 }} />

                    <Scatter name="Daily Log" data={history} fill={COLORS.info} shape="circle" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>


        </section>

        {/* Section 7: Nutrient Summary Table */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Utensils className="w-6 h-6 text-gray-600" /> Average Daily Intake
            <span className="text-sm font-normal text-gray-500 ml-2">
              {period === 'all' ? '(Across all recorded days)' : `(Over last ${analyticsDays} days)`}
            </span>
          </h2>
          <Card className="shadow-none border-none">
            <CardContent className="p-4 shadow-none">
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

                  // Clean up redundant logic
                  if (n.name === 'Calories') { defaultLimit = t.calories; defaultUnit = 'kcal'; isMinimum = false; }
                  else if (n.name === 'Protein') { defaultLimit = t.protein; isMinimum = true; }
                  else if (n.name === 'Fiber') { defaultLimit = t.fiber; isMinimum = true; }
                  else if (n.name === 'Carbohydrates') { defaultLimit = t.carbs; isMinimum = false; }
                  else if (n.name === 'Fat') { defaultLimit = t.fat; isMinimum = false; }
                  else if (n.name === 'Sugar') isMinimum = false;
                  else if (n.name === 'Sodium') isMinimum = false;
                  else if (['Iron', 'Calcium', 'Vitamin D', 'Potassium'].includes(n.name)) isMinimum = true;

                  // For micro/limiting nutrients, pull from stats or fallbacks
                  if (!defaultLimit && stats?.nutrient_limits?.[n.name]) {
                    defaultLimit = stats.nutrient_limits[n.name].daily;
                    defaultUnit = stats.nutrient_limits[n.name].unit || 'g';
                  }

                  // Specific defaults if not in limits
                  if (!defaultLimit && n.name === 'Sodium') { defaultLimit = 2300; defaultUnit = 'mg'; }
                  if (!defaultLimit && n.name === 'Cholesterol') { defaultLimit = 300; defaultUnit = 'mg'; }
                  if (!defaultLimit && n.name === 'Saturated Fat') { defaultLimit = 22; defaultUnit = 'g'; }
                  if (!defaultLimit && n.name === 'Iron') { defaultLimit = 18; defaultUnit = 'mg'; }
                  if (!defaultLimit && n.name === 'Calcium') { defaultLimit = 1000; defaultUnit = 'mg'; }
                  if (!defaultLimit && n.name === 'Vitamin D') { defaultLimit = 600; defaultUnit = 'IU'; }
                  if (!defaultLimit && n.name === 'Potassium') { defaultLimit = 3500; defaultUnit = 'mg'; }

                  // Manual fallbacks if API missing
                  if (!defaultLimit) {
                    if (n.name === 'Sodium') { defaultLimit = t.sodium; defaultUnit = 'mg'; }
                    else if (n.name === 'Sugar') { defaultLimit = t.sugar; defaultUnit = 'g'; }
                    else if (n.name === 'Saturated Fat') { defaultLimit = t.saturated_fat; defaultUnit = 'g'; }
                    else if (n.name === 'Cholesterol') { defaultLimit = t.cholesterol; defaultUnit = 'mg'; }
                  }

                  const avg = (n.data.reduce((a: number, b: number) => a + b, 0) || 0) / analyticsDays;
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
                  else if (!isMinimum) {
                    // Maximum Limit (Lower is better) - e.g. Sodium, Sugar, Sat Fat
                    if (avg > limit) { statusColor = 'bg-red-500'; textColor = 'text-red-700'; bgColor = 'bg-red-50'; statusText = 'Excess'; }
                    else if (avg > limit * 0.8) { statusColor = 'bg-amber-500'; textColor = 'text-amber-700'; bgColor = 'bg-amber-50'; statusText = 'High'; }
                    else { statusColor = 'bg-emerald-500'; textColor = 'text-emerald-700'; bgColor = 'bg-emerald-50'; statusText = 'Good'; }
                  }
                  else {
                    // Minimum Target (Higher is better) - e.g. Protein, Fiber, Vitamins
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
                            <div className="text-xs text-gray-500">{n.group}</div>
                          </div>
                        </div>
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider", bgColor, textColor)}>
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
                    <Button variant="outline" size="sm" className="gap-1 bg-white hover:bg-gray-50 text-gray-700 border-dashed">
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
                <Button variant="outline" size="sm" className={cn("gap-1", (dateRange.from || dateRange.to) && "border-blue-500 bg-blue-50")}>
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
                <Button variant="outline" size="sm" className={cn("gap-1", selectedWeekdays.length > 0 && "border-violet-500 bg-violet-50")}>
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
                <Button variant="outline" size="sm" className={cn("gap-1", mealCountFilter.operator && "border-amber-500 bg-amber-50")}>
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
                <Button variant="outline" size="sm" className={cn("gap-1", nutrientFilters.length > 0 && "border-emerald-500 bg-emerald-50")}>
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
                          <button type="button" onClick={() => removeNutrientFilter(i)} className="text-red-500 hover:text-red-700" aria-label="Remove nutrient filter">
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
                      <th className="text-center py-4 px-4 text-xs font-semibold text-gray-600 sticky left-0 bg-gray-50 z-10 w-[140px]">Date</th>
                      <th className="text-center py-4 px-4 text-xs font-semibold text-gray-600">Meals</th>
                      <th className="text-center py-4 px-3 text-xs font-semibold text-gray-600">Calories</th>
                      <th className="text-center py-4 px-3 text-xs font-semibold text-gray-600">Protein<br />(g)</th>
                      <th className="text-center py-4 px-3 text-xs font-semibold text-gray-600">Carbo-<br />hydrates (g)</th>
                      <th className="text-center py-4 px-3 text-xs font-semibold text-gray-600">Fat<br />(g)</th>
                      <th className="text-center py-4 px-3 text-xs font-semibold text-gray-600">Fiber<br />(g)</th>
                      <th className="text-center py-4 px-3 text-xs font-semibold text-gray-600">Sugar<br />(g)</th>
                      <th className="text-center py-4 px-3 text-xs font-semibold text-gray-600">Sodium<br />(mg)</th>
                      <th className="text-center py-4 px-3 text-xs font-semibold text-gray-600">Choles-<br />terol (mg)</th>
                      <th className="text-center py-4 px-3 text-xs font-semibold text-gray-600">Saturated<br />Fat (g)</th>
                      <th className="text-center py-4 px-3 text-xs font-semibold text-gray-600">Unsaturated<br />Fat (g)</th>
                      <th className="text-center py-4 px-3 text-xs font-semibold text-gray-600">Trans<br />Fat (g)</th>
                      <th className="text-center py-4 px-3 text-xs font-semibold text-gray-600">Iron<br />(mg)</th>
                      <th className="text-center py-4 px-3 text-xs font-semibold text-gray-600">Calcium<br />(mg)</th>
                      <th className="text-center py-4 px-3 text-xs font-semibold text-gray-600">Vitamin-D <br /> (IU)</th>
                      <th className="text-center py-4 px-3 text-xs font-semibold text-gray-600">Potassium<br />(mg)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedHistory.length === 0 ? (
                      <tr>
                        <td colSpan={18} className="text-center py-12 text-muted-foreground">
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
                            <div className="flex flex-col gap-1">
                              {day.meals.map((meal, i) => (
                                <TooltipProvider key={i}>
                                  <ShadTooltip>
                                    <TooltipTrigger asChild>
                                      <span className="inline-block max-w-[150px] w-fit truncate align-middle rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 border border-slate-200 cursor-help">
                                        {meal.name}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{meal.name}</p>
                                    </TooltipContent>
                                  </ShadTooltip>
                                </TooltipProvider>
                              ))}
                            </div>
                          </td>
                          <td className="text-left text-xs py-3 px-3 font-bold text-gray-800">{day.total_calories}</td>
                          <td className="text-left text-xs py-3 px-3 text-emerald-600 font-medium">{day.total_protein}g</td>
                          <td className="text-left text-xs py-3 px-3 text-amber-600 font-medium">{day.total_carbohydrates}g</td>
                          <td className="text-left text-xs py-3 px-3 text-rose-500 font-medium">{day.total_fat}g</td>
                          <td className="text-left text-xs py-3 px-3 text-violet-600">{day.total_fiber}g</td>
                          <td className="text-left text-xs py-3 px-3 text-pink-500">{day.total_sugar}g</td>
                          <td className="text-left text-xs py-3 px-3 text-blue-500">{day.total_sodium}mg</td>
                          <td className="text-left text-xs py-3 px-3 text-orange-500">{day.total_cholesterol}mg</td>
                          <td className="text-left text-xs py-3 px-3 text-red-400">{day.total_saturated_fat}g</td>
                          <td className="text-left text-xs py-3 px-3 text-green-500">{day.total_unsaturated_fat}g</td>
                          <td className="text-left text-xs py-3 px-3 text-gray-500">{day.total_trans_fat}g</td>
                          <td className="text-left text-xs py-3 px-3 text-gray-600">{day.total_iron ? `${day.total_iron.toFixed(1)} mg` : '-'}</td>
                          <td className="text-left text-xs py-3 px-3 text-gray-600">{day.total_calcium ? `${day.total_calcium.toFixed(0)} mg` : '-'}</td>
                          <td className="text-left text-xs py-3 px-3 text-gray-600">{day.total_vitamin_d ? `${day.total_vitamin_d.toFixed(0)} IU` : '-'}</td>
                          <td className="text-left text-xs py-3 px-3 text-gray-600">{day.total_potassium ? `${day.total_potassium.toFixed(0)} mg` : '-'}</td>
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
