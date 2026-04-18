import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
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


interface DeficiencyAlertProps {
    nutrients: { name: string; data: number[] }[];
    limits?: { [key: string]: { daily?: number; unit?: string } };
}

// Standard RDAs for healthy adults (Fallback)
const STANDARD_RDA: { [key: string]: number } = {
    'Vitamin D': 15, // mcg
    'Iron': 18,      // mg
    'Calcium': 1000, // mg
    'Potassium': 3500,// mg
    'Fiber': 30,     // g
    'Protein': 50,    // g (varies widely)
    'Vitamin C': 90,
    'Magnesium': 400,
    'Zinc': 11,
};

export default function DeficiencyAlert({ nutrients, limits }: DeficiencyAlertProps) {
    const deficiencies = useMemo(() => {
        const alerts: { name: string; avg: number; target: number; pct: number }[] = [];

        nutrients.forEach(n => {
            // Calculate average intake over the period (ignoring days with 0 intake to avoid skewing empty days? No, empty days count as 0 intake)
            // Actually, we should count all days to be accurate about deficiency.
            const total = n.data.reduce((a, b) => a + b, 0);
            const days = n.data.length || 1;
            const avg = total / days;

            let target = STANDARD_RDA[n.name];

            // Override with personalized limit if set
            if (limits && limits[n.name]?.daily) {
                target = limits[n.name].daily!;
            }

            if (target > 0) {
                const pct = (avg / target) * 100;
                if (pct < 75) { // Threshold for "Low"
                    alerts.push({ name: n.name, avg, target, pct });
                }
            }
        });

        // Sort by most deficient (lowest percentage)
        return alerts.sort((a, b) => a.pct - b.pct).slice(0, 5); // Show top 5
    }, [nutrients, limits]);

    if (deficiencies.length === 0) {
        return (
            <Card className="h-full shadow-sm hover:shadow-md transition-all duration-300 bg-emerald-50 border border-emerald-100 flex flex-col justify-center items-center text-center p-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <CardTitle className="text-lg font-bold text-emerald-900 mb-2">
                    No low-intake alerts
                </CardTitle>
                <CardContent>
                    <p className="text-sm font-medium text-emerald-700/80 max-w-[220px]">Your tracked nutrients are staying on target in this period.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col">
            <CardHeader className=" flex-none">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Low Intake Alerts
                            <TooltipProvider>
                                <ShadTooltip>
                                    <TooltipTrigger>
                                        <Info className="w-4 h-4 transition-colors cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-[200px]">This shows nutrients that stayed below 75% of the goal during the selected period.</p>
                                    </TooltipContent>
                                </ShadTooltip>
                            </TooltipProvider>
                        </CardTitle>
                        <CardDescription className="text-xs font-medium">Nutrients below 75% of goal</CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-100 rounded-full px-2 py-0.5 text-xs font-bold text-amber-700">{deficiencies.length} ALERTS</div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <button type="button" aria-label="Show deficiency insight" className="p-2 rounded-full transition-colors bg-amber-100 text-amber-600 hover:bg-amber-200">
                                    <Info className="w-5 h-5" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-4" align="end">
                                <div className="font-semibold mb-1 capitalize flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                    Deficiency Insight
                                </div>
                                <p className="text-sm text-gray-600">
                                    {deficiencies.length > 0
                                        ? `${deficiencies[0].name} is the main area to improve in this period.`
                                        : "Your nutrient intake looks balanced."}
                                </p>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {deficiencies.map((d) => (
                    <div key={d.name} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium text-gray-700">
                            <span>{d.name}</span>
                            <span className="text-amber-600">{Math.round(d.pct)}% of target</span>
                        </div>
                        <TooltipProvider>
                            <ShadTooltip>
                                <TooltipTrigger asChild>
                                    <Progress value={d.pct} className="h-2 bg-amber-100" variant="calories" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Avg: {d.avg.toFixed(1)} / {d.target}</p>
                                </TooltipContent>
                            </ShadTooltip>
                        </TooltipProvider>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
