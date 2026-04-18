import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
// MainLayout removed
// import { MainLayout } from '@/layouts/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
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
  Loader2, Flame, Utensils,
  Zap, Clock, Heart, Sparkles,
  Search, Download, FileJson, ChevronLeft, ChevronRight, FileSpreadsheet,
  X, Plus
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { Patient } from '@/types';
import { formatMacroTargetSplitLabel, getNutrientTargets } from '@/utils/nutrition';
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
import { AnalyticsNoticeStack, type AnalyticsNotice } from '@/components/analytics/AnalyticsNoticeStack';
import { AnalyticsKPICards } from '@/components/analytics/AnalyticsKPICards';
import { WeightTrendChart } from '@/components/analytics/charts/WeightTrendChart';
import { NutrientTrendChart, type AnalyticsTrendDatum } from '@/components/analytics/charts/NutrientTrendChart';
import { CalorieCompositionChart } from '@/components/analytics/charts/CalorieCompositionChart';
import { MealDistributionSummaryCard } from '@/components/analytics/MealDistributionSummaryCard';
import { LimitFocusCard, type LimitFocusMetric } from '@/components/analytics/LimitFocusCard';

const formatNoticeList = (items: string[]) => {
  if (items.length <= 1) return items[0] || '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
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
  const [advancedStats, setAdvancedStats] = useState<AdvancedStats | null>(null);
  const [loading, setLoading] = useState(true);

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
  const selectedRangeLabel = useMemo(() => {
    switch (period) {
      case 'weekly':
        return 'last 7 days';
      case 'monthly':
        return 'last 30 days';
      case '60days':
        return 'last 60 days';
      case 'all':
        return 'all recorded time';
      default:
        return 'selected period';
    }
  }, [period]);

  const handleSymptomLogged = (): void => undefined;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const statsData = await analyticsService.getPatientAnalytics(period);
        const chartSpanDays = statsData.dates.length || requestedDays || 1;

        const [complianceData, distributionData, historyData, advData, fullHistoryData, weightHistoryData] = await Promise.all([
          analyticsService.getComplianceStats(chartSpanDays),
          analyticsService.getMealDistribution(chartSpanDays),
          analyticsService.getDailyHistory(chartSpanDays),
          analyticsService.getAdvancedStats(chartSpanDays),
          analyticsService.getDailyHistory(180), // Fetch strict 180 days for the table regardless of chart selection
          analyticsService.getWeightHistory(Math.max(chartSpanDays, 30))
        ]);

        setStats(statsData);
        setCompliance(complianceData);
        setDistribution(distributionData);
        setHistory(historyData);
        setAdvancedStats(advData);
        setFullHistory(fullHistoryData);
        setWeightHistory(weightHistoryData);
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
  }, [searchTerm, tableLogDays, dateRange, selectedWeekdays, mealCountFilter, nutrientFilters, activePresets]);

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
  const t = getNutrientTargets(patient);
  const targetMacroLabel = useMemo(() => formatMacroTargetSplitLabel(t), [t]);

  const avgProtein = useMemo(() => (stats?.macro_nutrients?.find(n => n.name === 'Protein')?.data.reduce((a, b) => a + b, 0) || 0) / analyticsDays, [analyticsDays, stats]);
  const avgCarbs = useMemo(() => (stats?.macro_nutrients?.find(n => n.name === 'Carbohydrates')?.data.reduce((a, b) => a + b, 0) || 0) / analyticsDays, [analyticsDays, stats]);
  const avgFat = useMemo(() => (stats?.macro_nutrients?.find(n => n.name === 'Fat')?.data.reduce((a, b) => a + b, 0) || 0) / analyticsDays, [analyticsDays, stats]);
  const avgSugar = useMemo(() => (stats?.limiting_nutrients?.find(n => n.name === 'Sugar')?.data.reduce((a, b) => a + b, 0) || 0) / analyticsDays, [analyticsDays, stats]);
  const avgSodium = useMemo(() => (stats?.micro_nutrients?.find(n => n.name === 'Sodium')?.data.reduce((a, b) => a + b, 0) || 0) / analyticsDays, [analyticsDays, stats]);
  const avgChol = useMemo(() => (stats?.micro_nutrients?.find(n => n.name === 'Cholesterol')?.data.reduce((a, b) => a + b, 0) || 0) / analyticsDays, [analyticsDays, stats]);
  const avgSatFat = useMemo(() => (stats?.limiting_nutrients?.find(n => n.name === 'Saturated Fat')?.data.reduce((a, b) => a + b, 0) || 0) / analyticsDays, [analyticsDays, stats]);
  const avgTransFat = useMemo(() => (stats?.limiting_nutrients?.find(n => n.name === 'Trans-fat')?.data.reduce((a, b) => a + b, 0) || 0) / analyticsDays, [analyticsDays, stats]);

  const trendData = useMemo<AnalyticsTrendDatum[]>(() => {
    if (!stats) {
      return [];
    }

    return stats.dates.map((date, index) => {
      const getSeriesValue = (name: string, series: { name: string; data: number[] }[]) =>
        series.find((nutrient) => nutrient.name === name)?.data[index] || 0;

      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Calories: stats.calories[index] || 0,
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
  }, [stats]);

  const hasMealHistoryInRange = history.length > 0;
  const hasPartialNutritionData = useMemo(
    () => history.some((day) =>
      day.meals.length > 0 &&
      day.total_calories === 0 &&
      [
        day.total_protein,
        day.total_carbohydrates,
        day.total_fat,
        day.total_fiber,
        day.total_sugar,
        day.total_sodium,
        day.total_cholesterol,
        day.total_saturated_fat,
      ].some((value) => value > 0)
    ),
    [history]
  );

  const noNutritionDataMessage = hasMealHistoryInRange
    ? `Meals were found in the ${selectedRangeLabel}, but some entries are missing nutrient totals, so the clinical summaries below are partial.`
    : `No nutrition data was recorded in the ${selectedRangeLabel}. Add meals in this range to populate this chart.`;
  const noMealDataMessage = `No meal records were found in the ${selectedRangeLabel}. Add meals in this range to populate this chart.`;
  const limitFocusMetrics = useMemo<LimitFocusMetric[]>(() => [
    { name: 'Sodium', value: avgSodium, limit: t.sodium, unit: 'mg' },
    { name: 'Saturated Fat', value: avgSatFat, limit: t.saturated_fat, unit: 'g' },
    { name: 'Sugar', value: avgSugar, limit: t.sugar, unit: 'g' },
    { name: 'Cholesterol', value: avgChol, limit: t.cholesterol, unit: 'mg' },
    { name: 'Trans Fat', value: avgTransFat, limit: t.trans_fat, unit: 'g' },
  ], [avgChol, avgSatFat, avgSodium, avgSugar, avgTransFat, t]);
  const analyticsNotices = useMemo<AnalyticsNotice[]>(() => {
    const notices: AnalyticsNotice[] = [];
    const highLimitNames = limitFocusMetrics
      .filter((metric) => metric.limit > 0 && metric.value > metric.limit)
      .map((metric) => metric.name.toLowerCase());
    const closeLimitNames = limitFocusMetrics
      .filter((metric) => metric.limit > 0 && metric.value > metric.limit * 0.8 && metric.value <= metric.limit)
      .map((metric) => metric.name.toLowerCase());

    if (!hasMealHistoryInRange) {
      notices.push({
        id: 'no-meals',
        tone: 'warning',
        title: 'No data in this range',
        description: `No meals were logged in the ${selectedRangeLabel}. Add meals in that period to fill the charts.`,
      });
      return notices;
    }

    if (hasPartialNutritionData) {
      notices.push({
        id: 'partial-data',
        tone: 'warning',
        title: 'Some meal details are incomplete',
        description: 'A few meals are missing full nutrition details. Totals may look lower than expected until those entries are updated.',
      });
    }

    if (highLimitNames.length > 0) {
      notices.push({
        id: 'high-limits',
        tone: 'warning',
        title: 'A few limits need attention',
        description: `On average, ${formatNoticeList(highLimitNames)} were above the daily limit in this range.`,
      });
    } else if (closeLimitNames.length > 0) {
      notices.push({
        id: 'close-limits',
        tone: 'info',
        title: 'You are close to a few limits',
        description: `Keep an eye on ${formatNoticeList(closeLimitNames)}. They were close to the daily limit in this range.`,
      });
    } else {
      notices.push({
        id: 'limits-stable',
        tone: 'success',
        title: 'Key limits look steady',
        description: 'Your average sodium, sugar, saturated fat, cholesterol, and trans fat stayed within range in this period.',
      });
    }

    notices.push({
      id: 'estimate-note',
      tone: 'info',
      title: 'Energy and weight numbers are estimates',
      description: 'These figures use your profile details and meals from the selected range. They are helpful guides, not exact predictions.',
    });

    return notices.slice(0, 3);
  }, [hasMealHistoryInRange, hasPartialNutritionData, limitFocusMetrics, selectedRangeLabel]);

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

        {!loading && <AnalyticsNoticeStack notices={analyticsNotices} />}

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

        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="h-[380px]">
            <HydrationWidget />
          </div>
          <div className="h-[380px]">
            <SymptomTracker onSymptomLogged={handleSymptomLogged} />
          </div>
          <div className="h-[380px]">
            <DeficiencyAlert
              nutrients={[...(stats?.macro_nutrients || []), ...(stats?.micro_nutrients || [])]}
              limits={{
                Protein: { daily: t.protein },
                Fiber: { daily: t.fiber },
                Sodium: { daily: t.sodium },
                Cholesterol: { daily: t.cholesterol },
                'Saturated Fat': { daily: t.saturated_fat },
                Sugar: { daily: t.sugar },
              }}
            />
          </div>
        </section>

        <section className="mb-8">
          <WeightTrendChart
            weightHistory={weightHistory}
            days={analyticsDays}
            className="border border-gray-100 bg-white"
          />
        </section>

        <section className="mb-8 space-y-4">
          <div className="space-y-1">
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800">
              <Zap className="h-6 w-6 text-amber-500" />
              Nutrition Trends
            </h2>
            <p className="text-sm text-muted-foreground">
              A smaller set of charts focused on trends, distribution, and threshold management.
            </p>
          </div>

          <NutrientTrendChart
            data={trendData}
            days={analyticsDays}
            title="Macronutrient Trends"
            description="Daily calories, protein, carbohydrates, and fat across the selected range."
            type="macro"
            t={t}
            emptyTitle="No macronutrient trend yet"
            emptyMessage={noNutritionDataMessage}
          />

          <NutrientTrendChart
            data={trendData}
            days={analyticsDays}
            title="Limit-Sensitive Trends"
            description="Daily sodium, cholesterol, and saturated-fat movement across the selected range."
            type="micro"
            t={t}
            emptyTitle="No limit trend yet"
            emptyMessage={noNutritionDataMessage}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CalorieCompositionChart
              avgProtein={avgProtein}
              avgCarbs={avgCarbs}
              avgFat={avgFat}
              totalKcal={advancedStats?.avg_daily_intake || 0}
              targetLabel={targetMacroLabel}
            />
            <MealDistributionSummaryCard
              distribution={distribution?.distribution || []}
              description={`Average calorie share by meal across the ${selectedRangeLabel}.`}
              emptyDescription={noMealDataMessage}
            />
          </div>

          <LimitFocusCard
            metrics={limitFocusMetrics}
            description={`Average per day across the ${selectedRangeLabel}, compared with the limits most likely to matter for review.`}
            emptyDescription={noNutritionDataMessage}
          />
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
                { id: 'cheat-days', label: 'Cheat Days', activeClassName: 'bg-rose-100 border-rose-400 text-rose-700' },
                { id: 'high-sodium', label: 'High Sodium', activeClassName: 'bg-orange-100 border-orange-400 text-orange-700' },
                { id: 'low-protein', label: 'Low Protein', activeClassName: 'bg-yellow-100 border-yellow-400 text-yellow-700' },
                { id: 'over-target', label: 'Over Target', activeClassName: 'bg-red-100 border-red-400 text-red-700' },
                { id: 'under-target', label: 'Under Target', activeClassName: 'bg-blue-100 border-blue-400 text-blue-700' },
              ].map(preset => (
                <button
                  key={preset.id}
                  onClick={() => togglePreset(preset.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    activePresets.includes(preset.id)
                      ? preset.activeClassName
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
