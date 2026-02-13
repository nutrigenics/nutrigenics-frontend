import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Brain, Info } from 'lucide-react';
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
    microNutrients: { name: string; data: number[] }[];
    symptomLogs: any[]; // We'll need to fetch these or pass them in
}

export default function FoodMoodChart({ dates, microNutrients, symptomLogs }: FoodMoodProps) {
    const [selectedNutrient, setSelectedNutrient] = useState<string>('Sugar');
    const [selectedSymptom, setSelectedSymptom] = useState<string>('Fatigue');

    // Combine data for the chart
    const chartData = useMemo(() => {
        const nutrientData = microNutrients?.find(n => n.name === selectedNutrient)?.data || [];
        const logs = Array.isArray(symptomLogs) ? symptomLogs : [];

        return dates.map((date, index) => {
            // Find symptom log for this date (simplified matching)
            const log = logs.find(l => l.date && l.date.substring(0, 10) === date);

            return {
                date,
                nutrientAmount: nutrientData[index] || 0,
                symptomSeverity: log?.severity || 0, // 0 means no log, or maybe use null?
            };
        });
    }, [dates, microNutrients, symptomLogs, selectedNutrient, selectedSymptom]);

    const nutrientOptions = microNutrients.map(n => n.name).sort();

    return (
        <Card className="col-span-full shadow-sm hover:shadow-md transition-all duration-300 bg-white border border-gray-100">
            <CardHeader className="w-full">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Brain className="w-6 h-6 text-indigo-500" />
                            Food-Mood Correlation
                            <TooltipProvider>
                                <ShadTooltip>
                                    <TooltipTrigger>
                                        <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-[200px]">Analyze potential links between your nutrient intake and reported symptoms.</p>
                                    </TooltipContent>
                                </ShadTooltip>
                            </TooltipProvider>
                        </CardTitle>
                        <CardDescription className="text-sm font-medium text-gray-500">Analyze how specific nutrients impact your symptoms.</CardDescription>
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
                                    Correlating <strong>{selectedNutrient}</strong> history with <strong>{selectedSymptom}</strong> logs. Look for patterns where spikes in intake precede symptoms.
                                </p>
                            </PopoverContent>
                        </Popover>
                        <Select value={selectedNutrient} onValueChange={setSelectedNutrient}>
                            <SelectTrigger className="w-[160px] h-10 rounded-full">
                                <SelectValue placeholder="Nutrient" />
                            </SelectTrigger>
                            <SelectContent>
                                {nutrientOptions.map(n => (
                                    <SelectItem key={n} value={n}>{n}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="flex items-center px-2 text-gray-400 font-medium text-xs uppercase tracking-wider">vs</div>

                        <Select value={selectedSymptom} onValueChange={setSelectedSymptom}>
                            <SelectTrigger className="w-[160px] h-10 rounded-full">
                                <SelectValue placeholder="Symptom" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Fatigue">Fatigue</SelectItem>
                                <SelectItem value="Headache">Headache</SelectItem>
                                <SelectItem value="Bloating">Bloating</SelectItem>
                                <SelectItem value="Anxiety">Anxiety</SelectItem>
                                <SelectItem value="Brain Fog">Brain Fog</SelectItem>
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
                                dataKey="date"
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
