import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Activity, Save, History, CalendarClock, Info } from 'lucide-react';
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

import vitalSignsService, { type SymptomType, type SymptomLog } from '@/services/vital-signs.service';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface SymptomTrackerProps {
    onSymptomLogged?: () => Promise<void> | void;
}

export default function SymptomTracker({ onSymptomLogged }: SymptomTrackerProps) {
    const [types, setTypes] = useState<SymptomType[]>([]);
    const [history, setHistory] = useState<SymptomLog[]>([]);
    const [selectedType, setSelectedType] = useState<string>('');
    const [severity, setSeverity] = useState([1]);
    const [loading, setLoading] = useState(false);
    const [openHistory, setOpenHistory] = useState(false);

    useEffect(() => {
        fetchMetadata();
    }, []);

    const fetchMetadata = async () => {
        try {
            const [typesData, historyData] = await Promise.all([
                vitalSignsService.getSymptomTypes(),
                vitalSignsService.getRecentSymptoms()
            ]);
            setTypes(typesData);
            setHistory(historyData);
        } catch (error) {
            console.error('Error loading symptom data', error);
        }
    };

    const handleLogSymptom = async () => {
        if (!selectedType) return;
        setLoading(true);
        try {
            await vitalSignsService.logSymptom({
                symptom_type: parseInt(selectedType),
                severity: severity[0]
            });
            toast.success("Symptom Logged", {
                description: "Your biofeedback has been recorded.",
            });
            await fetchMetadata();
            await onSymptomLogged?.();
            setSeverity([1]);
            setSelectedType('');
        } catch (error) {
            toast.error("Failed to log symptom");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="h-full shadow-sm hover:shadow-md transition-all duration-300 bg-white border border-gray-100 flex flex-col relative overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl -z-10 translate-x-10 -translate-y-10 opacity-50"></div>

            <CardHeader className="flex-none">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
                            <Activity className="w-5 h-5 text-rose-500" />
                            Biofeedback
                            <TooltipProvider>
                                <ShadTooltip>
                                    <TooltipTrigger>
                                        <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-[200px]">Log your symptoms and severity to track health patterns over time.</p>
                                    </TooltipContent>
                                </ShadTooltip>
                            </TooltipProvider>
                        </CardTitle>
                        <CardDescription className="text-xs font-medium text-gray-500">Track symptoms & mood</CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <button type="button" aria-label="Show symptom insight" className="p-2 rounded-full transition-colors bg-rose-100 text-rose-600 hover:bg-rose-200">
                                    <Info className="w-4 h-4" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-4" align="end">
                                <div className="font-semibold mb-1 capitalize flex items-center gap-2">
                                    <Info className="w-4 h-4 text-rose-500" />
                                    Symptom Insight
                                </div>
                                <p className="text-sm text-gray-600">
                                    {history.length > 0
                                        ? `You've logged ${history.length} entries recently. Regular logging helps identify food triggers.`
                                        : "Start logging symptoms to unlock personalized health insights."}
                                </p>
                            </PopoverContent>
                        </Popover>

                        <Dialog open={openHistory} onOpenChange={setOpenHistory}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors" aria-label="View symptom history">
                                    <History className="w-4 h-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md rounded-2xl">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-xl">
                                        <CalendarClock className="w-5 h-5 text-rose-500" />
                                        Symptom History
                                    </DialogTitle>
                                    <DialogDescription>
                                        Your recent biofeedback entries and severity levels.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="mt-4">
                                    <ScrollArea className="h-[300px] pr-4">
                                        <div className="space-y-3">
                                            {history.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                                    <Activity className="w-8 h-8 mb-2 opacity-20" />
                                                    <p className="text-sm">No symptoms logged in the last 7 days.</p>
                                                </div>
                                            ) : (
                                                history.map(log => (
                                                    <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 border border-gray-100 hover:bg-gray-50 transition-colors">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="font-semibold text-sm text-gray-900">{log.symptom_type_details?.name || 'Unknown'}</span>
                                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                                {format(new Date(log.date), 'MMM d, yyyy')}
                                                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                                {format(new Date(log.date), 'h:mm a')}
                                                            </span>
                                                        </div>
                                                        <Badge variant="outline" className={`px-2.5 py-0.5 text-xs font-bold border-0 ${log.severity > 7 ? "bg-rose-100 text-rose-700" :
                                                            log.severity > 4 ? "bg-orange-100 text-orange-700" :
                                                                "bg-emerald-100 text-emerald-700"
                                                            }`}>
                                                            Severity: {log.severity}/10
                                                        </Badge>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between min-h-[220px]">
                <div className="space-y-4 flex-1">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                            What are you feeling?
                        </label>
                        <Select value={selectedType} onValueChange={setSelectedType}>
                            <SelectTrigger className="h-9 rounded-full focus:ring-2 focus:ring-rose-500/20 text-xs font-medium">
                                <SelectValue placeholder="Select symptom..." />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.isArray(types) && types.map(t => (
                                    <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-widest">Severity Level</label>
                            <div className="flex items-baseline gap-1">
                                <span className={`text-2xl font-black ${severity[0] > 7 ? "text-rose-600" :
                                    severity[0] > 4 ? "text-orange-500" :
                                        "text-emerald-500"
                                    }`}>
                                    {severity[0]}
                                </span>
                                <span className="text-xs font-bold text-gray-400">/ 10</span>
                            </div>
                        </div>
                        <Slider
                            value={severity}
                            onValueChange={setSeverity}
                            max={10}
                            min={1}
                            step={1}
                            className="py-2"
                        />
                        <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
                            <span>Mild</span>
                            <span>Moderate</span>
                            <span>Severe</span>
                        </div>
                    </div>

                    <Button
                        onClick={handleLogSymptom}
                        disabled={!selectedType || loading}
                        className="w-full h-9 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-sm transition-all text-xs mt-2"
                    >
                        {loading ? 'Saving...' : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Log Entry
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card >
    );
}
