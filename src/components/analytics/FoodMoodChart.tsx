import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Brain, Info } from 'lucide-react';
import type { SymptomLog } from '@/services/vital-signs.service';
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


interface FoodMoodProps {
    dates: string[];
    nutrients: { name: string; data: number[] }[];
    symptomLogs: SymptomLog[];
}

const FALLBACK_SYMPTOMS = ['Fatigue', 'Headache', 'Bloating', 'Anxiety', 'Brain Fog'];

export default function FoodMoodChart({ dates, nutrients, symptomLogs }: FoodMoodProps) {
    const nutrientOptions = useMemo(
        () => nutrients.map((nutrient) => nutrient.name).sort(),
        [nutrients]
    );
    const symptomOptions = useMemo(() => {
        const names = Array.from(new Set(
            symptomLogs
                .map((log) => log.symptom_type_details?.name)
                .filter((name): name is string => Boolean(name))
        )).sort();

        return names.length > 0 ? names : FALLBACK_SYMPTOMS;
    }, [symptomLogs]);

    const [selectedNutrient, setSelectedNutrient] = useState<string>('');
    const [selectedSymptom, setSelectedSymptom] = useState<string>('');

    useEffect(() => {
        if (!nutrientOptions.length) {
            setSelectedNutrient('');
            return;
        }

        if (!selectedNutrient || !nutrientOptions.includes(selectedNutrient)) {
            setSelectedNutrient(nutrientOptions.includes('Sugar') ? 'Sugar' : nutrientOptions[0]);
        }
    }, [nutrientOptions, selectedNutrient]);

    useEffect(() => {
        if (!symptomOptions.length) {
            setSelectedSymptom('');
            return;
        }

        if (!selectedSymptom || !symptomOptions.includes(selectedSymptom)) {
            setSelectedSymptom(symptomOptions[0]);
        }
    }, [selectedSymptom, symptomOptions]);

    // Combine data for the chart
    const chartData = useMemo(() => {
        const nutrientData = nutrients.find((nutrient) => nutrient.name === selectedNutrient)?.data || [];

        return dates.map((date, index) => {
            const matchingLogs = symptomLogs.filter((log) => {
                if (!log.date || log.date.substring(0, 10) !== date) {
                    return false;
                }

                if (!selectedSymptom) {
                    return true;
                }

                return log.symptom_type_details?.name === selectedSymptom;
            });
            const averageSeverity = matchingLogs.length
                ? matchingLogs.reduce((sum, log) => sum + log.severity, 0) / matchingLogs.length
                : null;

            return {
                dateLabel: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                nutrientAmount: nutrientData[index] || 0,
                symptomSeverity: averageSeverity,
            };
        });
    }, [dates, nutrients, selectedNutrient, selectedSymptom, symptomLogs]);

    return (
        <Card className="col-span-full shadow-sm hover:shadow-md transition-all duration-300 bg-white border border-gray-100">
            <CardHeader className="w-full">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Brain className="w-6 h-6 text-indigo-500" />
                            Food & Symptom Patterns
                            <TooltipProvider>
                                <ShadTooltip>
                                    <TooltipTrigger>
                                        <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-[220px]">Overlay same-day nutrient intake with symptom severity to spot possible patterns. This view is observational, not causal.</p>
                                    </TooltipContent>
                                </ShadTooltip>
                            </TooltipProvider>
                        </CardTitle>
                        <CardDescription className="text-sm font-medium text-gray-500">Compare same-day nutrient intake with symptom severity.</CardDescription>
                    </div>
                    <div className="flex gap-2 items-center">
                        <Popover>
                            <PopoverTrigger asChild>
                                <button type="button" aria-label="Show correlation insight" className="p-2 rounded-full transition-colors bg-indigo-100 text-indigo-600 hover:bg-indigo-200">
                                    <Info className="w-5 h-5" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-4" align="end">
                                <div className="font-semibold mb-1 capitalize flex items-center gap-2">
                                    <Brain className="w-4 h-4 text-indigo-500" />
                                    Correlation Insight
                                </div>
                                <p className="text-sm text-gray-600">
                                    Comparing same-day <strong>{selectedNutrient}</strong> intake with logged <strong>{selectedSymptom}</strong> severity. Use this as a pattern-spotting aid, not proof of causation.
                                </p>
                            </PopoverContent>
                        </Popover>
                        <Select value={selectedNutrient} onValueChange={setSelectedNutrient}>
                            <SelectTrigger className="w-[160px] h-10 rounded-full">
                                <SelectValue placeholder="Nutrient" />
                            </SelectTrigger>
                            <SelectContent>
                                {nutrientOptions.map((nutrient) => (
                                    <SelectItem key={nutrient} value={nutrient}>{nutrient}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="flex items-center px-2 text-gray-400 font-medium text-xs uppercase tracking-wider">vs</div>

                        <Select value={selectedSymptom} onValueChange={setSelectedSymptom}>
                            <SelectTrigger className="w-[160px] h-10 rounded-full">
                                <SelectValue placeholder="Symptom" />
                            </SelectTrigger>
                            <SelectContent>
                                {symptomOptions.map((symptom) => (
                                    <SelectItem key={symptom} value={symptom}>{symptom}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="h-[300px] min-h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorNutrient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} stroke="#e5e7eb" />
                            <XAxis
                                dataKey="dateLabel"
                                tick={{ fontSize: 11, fill: '#6b7280' }}
                                axisLine={false}
                                tickLine={false}
                                minTickGap={30}
                                dy={10}
                            />
                            <YAxis
                                yAxisId="left"
                                label={{ value: selectedNutrient, angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: 12 } }}
                                tick={{ fontSize: 11, fill: '#6b7280' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                domain={[0, 10]}
                                label={{ value: 'Severity (1-10)', angle: 90, position: 'insideRight', style: { fill: '#6b7280', fontSize: 12 } }}
                                tick={{ fontSize: 11, fill: '#6b7280' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" iconSize={10} />
                            <Bar
                                yAxisId="left"
                                dataKey="nutrientAmount"
                                name={selectedNutrient}
                                fill="url(#colorNutrient)"
                                barSize={30}
                                // radius={[6, 6, 0, 0]}
                                radius={50}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="symptomSeverity"
                                name={selectedSymptom}
                                stroke="#f97316"
                                strokeWidth={3}
                                connectNulls={false}
                                dot={{ r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
