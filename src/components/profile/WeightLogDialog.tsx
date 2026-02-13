import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import vitalSignsService from '@/services/vital-signs.service';
import { toast } from 'sonner';
import { Loader2, Scale } from 'lucide-react';

interface WeightLogDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentWeight?: string | number;
    onSuccess?: () => void;
}

export function WeightLogDialog({ open, onOpenChange, currentWeight, onSuccess }: WeightLogDialogProps) {
    const [weight, setWeight] = useState(currentWeight?.toString() || '');
    const [unit, setUnit] = useState('kg');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!weight) return;

        setLoading(true);
        try {
            await vitalSignsService.logWeight(parseFloat(weight), unit);
            toast.success("Weight recorded successfully");
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            toast.error("Failed to record weight");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xs rounded-3xl p-6">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Scale className="w-5 h-5 text-emerald-600" />
                        Log Weight
                    </DialogTitle>
                    <DialogDescription>
                        Update your weight to track progress.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="flex gap-2 items-end">
                        <div className="flex-1 space-y-2">
                            <Label>Weight</Label>
                            <Input
                                type="number"
                                step="0.1"
                                placeholder="0.0"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                required
                                className="text-lg font-bold"
                                autoFocus
                            />
                        </div>
                        <div className="w-24 space-y-2">
                            <Label>Unit</Label>
                            <Select value={unit} onValueChange={setUnit}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="kg">kg</SelectItem>
                                    <SelectItem value="Lb">lbs</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
