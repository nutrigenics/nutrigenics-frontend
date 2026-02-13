import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit2, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { dietitianDashboardService } from '@/services/dietitian-dashboard.service';
import apiClient from '@/services/api.client';
import type { Nutrient } from '@/types';

interface NutrientLimit {
    id: number;
    patient: number;
    dietitian: number;
    nutrient: number;
    nutrient_name?: string;
    nutrient_unit?: string;
    daily_limit: number;
    weekly_limit?: number;
    monthly_limit?: number;
    created_at: string;
    updated_at: string;
}

interface DietitianNutrientLimitsProps {
    patientId: number;
    limits: NutrientLimit[];
    nutrients: Nutrient[];
    onRefresh: () => void;
}

export function DietitianNutrientLimits({ patientId, limits, nutrients, onRefresh }: DietitianNutrientLimitsProps) {
    const [isLimitDialogOpen, setIsLimitDialogOpen] = useState(false);
    const [editingLimit, setEditingLimit] = useState<NutrientLimit | null>(null);
    const [limitForm, setLimitForm] = useState({ nutrient_id: '', daily_limit: '', weekly_limit: '' });
    const [isSavingLimit, setIsSavingLimit] = useState(false);

    const handleEditLimit = (limit: NutrientLimit) => {
        setEditingLimit(limit);
        setLimitForm({
            nutrient_id: limit.nutrient.toString(),
            daily_limit: limit.daily_limit.toString(),
            weekly_limit: limit.weekly_limit?.toString() || ''
        });
        setIsLimitDialogOpen(true);
    };

    const handleCreateLimit = () => {
        setEditingLimit(null);
        setLimitForm({ nutrient_id: '', daily_limit: '', weekly_limit: '' });
        setIsLimitDialogOpen(true);
    };

    const handleSaveLimit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!limitForm.nutrient_id) return toast.error("Select a nutrient");
        setIsSavingLimit(true);
        try {
            const payload: any = { daily_limit: parseFloat(limitForm.daily_limit) };
            if (limitForm.weekly_limit) payload.weekly_limit = parseFloat(limitForm.weekly_limit);

            if (editingLimit) {
                await dietitianDashboardService.updateNutrientLimit(editingLimit.id, payload);
                toast.success("Limit updated");
            } else {
                await dietitianDashboardService.createNutrientLimit({
                    patient: patientId,
                    nutrient: Number(limitForm.nutrient_id),
                    ...payload
                });
                toast.success("Limit created");
            }
            setIsLimitDialogOpen(false);
            onRefresh();
        } catch (e) {
            toast.error("Failed to save limit");
        } finally {
            setIsSavingLimit(false);
        }
    };

    const handleDeleteLimit = async (id: number) => {
        if (!confirm("Delete this limit?")) return;
        try {
            await apiClient.delete(`/api/v1/nutrient-limits/${id}/`);
            toast.success("Limit deleted");
            onRefresh();
        } catch (e) {
            toast.error("Failed to delete");
        }
    };

    const availableNutrients = nutrients.filter(
        n => !limits.some(l => l.nutrient === n.id || l.nutrient_name === n.name)
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Nutrient Limits</h2>
                    <p className="text-slate-500">Set daily caps for specific nutrients.</p>
                </div>
                <Button onClick={handleCreateLimit} className="bg-primary hover:bg-primary/80 text-white rounded-full h-10 px-4 font-bold">
                    <Plus className="w-4 h-4" /> Set Limit
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {limits.map((limit) => (
                    <Card key={limit.id} className="p-6 rounded-3xl border-slate-100 shadow-soft hover:shadow-soft-lg transition-all group bg-white relative">
                        <div className="w-full flex justify-between items-center justify-between mb-1">
                            <div className="w-full flex flex-col">
                                <h4 className="text-lg font-bold text-slate-900 mb-1">
                                    {limit.nutrient_name || nutrients.find(n => n.id === limit.nutrient)?.name || 'Unknown'}
                                </h4>
                            </div>
                            <div className="w-fit flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEditLimit(limit)} className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-900" aria-label="Edit nutrient limit">
                                    <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteLimit(limit.id)} className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600" aria-label="Delete nutrient limit">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <div className='flex items-baseline gap-1'>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-slate-900">{Math.round(limit.daily_limit)}</span>
                                <span className="text-sm font-bold text-slate-400">{limit.nutrient_unit || nutrients.find(n => n.id === limit.nutrient)?.unit || ''}/day</span>
                            </div>
                            {limit.weekly_limit && (
                                <div className="mt-3 pt-3 border-t border-slate-50 text-xs font-medium text-slate-400 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Weekly Limit: {limit.weekly_limit}
                                </div>
                            )}
                        </div>
                    </Card>
                ))}
                {limits.length === 0 && (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
                        <p className="text-slate-400 font-bold">No limits configured yet.</p>
                    </div>
                )}
            </div>

            {/* Limit Dialog */}
            <Dialog open={isLimitDialogOpen} onOpenChange={setIsLimitDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-center">
                            {editingLimit ? 'Edit Limit' : 'Set Nutrient Limit'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveLimit} className="space-y-6 pt-4">
                        <div className="space-y-2">
                            <Label>Nutrient</Label>
                            <Select value={limitForm.nutrient_id} onValueChange={(v) => setLimitForm({ ...limitForm, nutrient_id: v })} disabled={!!editingLimit}>
                                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200"><SelectValue placeholder="Select nutrient" /></SelectTrigger>
                                <SelectContent>
                                    {(editingLimit ? nutrients : availableNutrients).map(n => n.id ? (
                                        <SelectItem key={n.id} value={n.id.toString()}>{n.name} ({n.unit})</SelectItem>
                                    ) : null)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Daily Limit</Label>
                                <Input type="number" step="0.1" required value={limitForm.daily_limit} onChange={e => setLimitForm({ ...limitForm, daily_limit: e.target.value })} className="h-12 rounded-xl bg-slate-50 border-slate-200 font-bold" placeholder="0.00" />
                            </div>
                            <div className="space-y-2">
                                <Label>Weekly (Optional)</Label>
                                <Input type="number" step="0.1" value={limitForm.weekly_limit} onChange={e => setLimitForm({ ...limitForm, weekly_limit: e.target.value })} className="h-12 rounded-xl bg-slate-50 border-slate-200" placeholder="Optional" />
                            </div>
                        </div>
                        <DialogFooter><Button type="submit" disabled={isSavingLimit} className="w-full h-12 rounded-xl bg-slate-900 text-white font-bold">{isSavingLimit ? 'Saving...' : 'Save Limit'}</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
