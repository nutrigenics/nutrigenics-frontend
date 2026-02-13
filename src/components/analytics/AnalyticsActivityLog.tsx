import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import {
    Tooltip as ShadTooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { type DailyHistory } from '@/services/analytics.service';

interface AnalyticsActivityLogProps {
    fullHistory: DailyHistory[];
}

const ITEMS_PER_PAGE = 10;

export function AnalyticsActivityLog({ fullHistory }: AnalyticsActivityLogProps) {
    const [tablePage, setTablePage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredHistory = useMemo(() => {
        if (!searchTerm) return fullHistory;

        const searchLower = searchTerm.toLowerCase();
        return fullHistory.filter(day => {
            if (day.date.toLowerCase().includes(searchLower)) return true;
            if (day.meals.some(m => m.name.toLowerCase().includes(searchLower))) return true;
            return false;
        });
    }, [fullHistory, searchTerm]);

    const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);

    const paginatedHistory = useMemo(() => {
        const start = (tablePage - 1) * ITEMS_PER_PAGE;
        return filteredHistory.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredHistory, tablePage]);

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-slate-900">Activity Log</h3>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search meals or dates..."
                        className="pl-9 bg-white rounded-xl"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setTablePage(1);
                        }}
                    />
                </div>
            </div>

            <Card className="shadow-sm transition-all duration-300 hover:shadow-md overflow-hidden bg-white rounded-3xl border-slate-100">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[1200px]">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-center py-4 px-4 text-xs font-semibold text-slate-600 sticky left-0 bg-slate-50 z-10 w-[140px]">Date</th>
                                    <th className="text-center py-4 px-4 text-xs font-semibold text-slate-600">Meals</th>
                                    <th className="text-center py-4 px-3 text-xs font-semibold text-slate-600">Calories</th>
                                    <th className="text-center py-4 px-3 text-xs font-semibold text-slate-600">Protein<br />(g)</th>
                                    <th className="text-center py-4 px-3 text-xs font-semibold text-slate-600">Carbs<br />(g)</th>
                                    <th className="text-center py-4 px-3 text-xs font-semibold text-slate-600">Fat<br />(g)</th>
                                    <th className="text-center py-4 px-3 text-xs font-semibold text-slate-600">Fiber<br />(g)</th>
                                    <th className="text-center py-4 px-3 text-xs font-semibold text-slate-600">Sugar<br />(g)</th>
                                    <th className="text-center py-4 px-3 text-xs font-semibold text-slate-600">Sodium<br />(mg)</th>
                                    <th className="text-center py-4 px-3 text-xs font-semibold text-slate-600">Cholesterol<br />(mg)</th>
                                    <th className="text-center py-4 px-3 text-xs font-semibold text-slate-600">Sat. Fat<br />(g)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="text-center py-12 text-slate-400">
                                            {searchTerm ? 'No results found for your search.' : 'No meal logs available.'}
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedHistory.map((day) => (
                                        <tr key={day.date} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="py-3 px-4 sticky left-0 bg-white group-hover:bg-slate-50/50 transition-colors z-10 border-r border-transparent group-hover:border-slate-100">
                                                <div className="font-medium text-slate-800">{day.weekday}</div>
                                                <div className="text-xs text-slate-400">{day.date}</div>
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
                                            <td className="text-left text-xs py-3 px-3 font-bold text-slate-800">{day.total_calories}</td>
                                            <td className="text-left text-xs py-3 px-3 text-emerald-600 font-medium">{day.total_protein}g</td>
                                            <td className="text-left text-xs py-3 px-3 text-amber-600 font-medium">{day.total_carbohydrates}g</td>
                                            <td className="text-left text-xs py-3 px-3 text-rose-500 font-medium">{day.total_fat}g</td>
                                            <td className="text-left text-xs py-3 px-3 text-violet-600">{day.total_fiber}g</td>
                                            <td className="text-left text-xs py-3 px-3 text-pink-500">{day.total_sugar}g</td>
                                            <td className="text-left text-xs py-3 px-3 text-blue-500">{day.total_sodium}mg</td>
                                            <td className="text-left text-xs py-3 px-3 text-orange-500">{day.total_cholesterol}mg</td>
                                            <td className="text-left text-xs py-3 px-3 text-red-400">{day.total_saturated_fat}g</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="flex items-center justify-between px-4 py-4 border-t border-slate-100 bg-slate-50/50">
                        <div className="text-sm text-slate-500">
                            Showing <span className="font-medium">{filteredHistory.length > 0 ? (tablePage - 1) * ITEMS_PER_PAGE + 1 : 0}</span> to <span className="font-medium">{Math.min(tablePage * ITEMS_PER_PAGE, filteredHistory.length)}</span> of <span className="font-medium">{filteredHistory.length}</span> results
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setTablePage(p => Math.max(1, p - 1))}
                                disabled={tablePage === 1}
                                className="h-8 w-8 p-0 rounded-xl"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="text-sm font-medium text-slate-700">
                                Page {tablePage} of {Math.max(1, totalPages)}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setTablePage(p => Math.min(totalPages, p + 1))}
                                disabled={tablePage >= totalPages}
                                className="h-8 w-8 p-0 rounded-xl"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
