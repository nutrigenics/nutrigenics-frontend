import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Droplets, Plus, GlassWater, Info } from 'lucide-react';
import {
    Tooltip as ShadTooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from '@/lib/utils';
import vitalSignsService, { type WaterLogStats } from '@/services/vital-signs.service';
import { toast } from 'sonner';

export default function HydrationWidget() {
    const [stats, setStats] = useState<WaterLogStats | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchWater = async () => {
        try {
            const data = await vitalSignsService.getTodayWater();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch water logs', error);
        }
    };

    useEffect(() => {
        fetchWater();
    }, []);

    const handleAddWater = async (amount: number) => {
        setLoading(true);
        try {
            await vitalSignsService.addWaterLog(amount);
            await fetchWater();
            toast.success("Hydration Recorded", {
                description: `Added ${amount}ml to your daily intake.`
            });
        } catch (error) {
            toast.error("Error", {
                description: "Failed to log hydration."
            });
        } finally {
            setLoading(false);
        }
    };

    const percentage = stats ? Math.min((stats.total_ml / stats.target_ml) * 100, 100) : 0;

    return (
        <Card className="h-full shadow-sm hover:shadow-md transition-all duration-300 bg-white border border-gray-100 flex flex-col">
            <CardHeader className="flex-none">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
                            <Droplets className="w-5 h-5 text-blue-500" />
                            Hydration
                            <TooltipProvider>
                                <ShadTooltip>
                                    <TooltipTrigger>
                                        <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-[200px]">Daily water intake tracker. Aim for 100% of your daily goal.</p>
                                    </TooltipContent>
                                </ShadTooltip>
                            </TooltipProvider>
                        </CardTitle>
                        <CardDescription className="text-xs font-medium text-gray-500">Daily water intake</CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <span className="text-2xl font-black text-blue-600 block leading-none">{stats?.total_ml || 0}</span>
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">ml/day</span>
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <button type="button" aria-label="Show hydration insight" className={cn("p-2 rounded-full transition-colors", percentage >= 100 ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : percentage >= 50 ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' : 'bg-amber-100 text-amber-600 hover:bg-amber-200')}>
                                    <Info className="w-5 h-5" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-4" align="end">
                                <div className="font-semibold mb-1 capitalize flex items-center gap-2">
                                    <Info className={cn("w-4 h-4", percentage >= 100 ? "text-emerald-500" : percentage >= 50 ? "text-blue-500" : "text-amber-500")} />
                                    Hydration Insight
                                </div>
                                <p className="text-sm text-gray-600">
                                    {percentage >= 100 ? "Great job! You met your hydration goal." : percentage >= 50 ? "Good progress, keep drinking water to reach your goal." : "You are behind on hydration. Drink more water!"}
                                </p>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center">
                <div className="flex flex-col items-center justify-center w-full">

                    {/* Circular Progress Representation (using CSS conic gradient for simplicity or just a large text/icon) */}
                    {/* Circular Progress Representation */}
                    <div className="relative w-40 h-40 flex items-center justify-center mb-4">
                        {/* Background Circle */}
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="50%"
                                cy="50%"
                                r="70"
                                stroke="#eff6ff"
                                strokeWidth="12"
                                fill="transparent"
                            />
                            {/* Progress Circle */}
                            <circle
                                cx="50%"
                                cy="50%"
                                r="70"
                                stroke="#3b82f6"
                                strokeWidth="12"
                                fill="transparent"
                                strokeDasharray={440} // 2 * pi * 70
                                strokeDashoffset={440 - (percentage / 100) * 440}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>

                        {/* Center Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <GlassWater className="w-8 h-8 text-blue-400 mb-1" />
                            <span className="text-3xl font-black text-gray-900">{Math.round(percentage)}%</span>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Goal</span>
                        </div>
                    </div>

                    <div className="flex gap-3 w-full justify-center">
                        <Button
                            variant="outline"
                            className="flex-1 h-12 rounded-xl border-blue-100 hover:bg-blue-50 hover:border-blue-200 text-blue-600 font-bold transition-all shadow-sm"
                            onClick={() => handleAddWater(250)}
                            disabled={loading}
                        >
                            <GlassWater className="w-4 h-4 mr-2" />
                            +250ml
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 h-12 rounded-xl border-blue-100 hover:bg-blue-50 hover:border-blue-200 text-blue-600 font-bold transition-all shadow-sm"
                            onClick={() => handleAddWater(500)}
                            disabled={loading}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            +500ml
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
