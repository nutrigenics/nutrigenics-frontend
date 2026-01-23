// MainLayout removed (provided by router)
import { TrendingUp, Activity, Edit2, Loader2, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { dietitianDashboardService } from '@/services/dietitian-dashboard.service';
import apiClient from '@/services/api.client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

// Fallback nutrients list if API fails
const FALLBACK_NUTRIENTS = [
  { id: 1, name: 'Calories', unit: 'kcal' },
  { id: 2, name: 'Protein', unit: 'g' },
  { id: 3, name: 'Carbohydrates', unit: 'g' },
  { id: 4, name: 'Fat', unit: 'g' },
  { id: 5, name: 'Fiber', unit: 'g' },
  { id: 6, name: 'Sugar', unit: 'g' },
  { id: 7, name: 'Sodium', unit: 'mg' },
  { id: 8, name: 'Cholesterol', unit: 'mg' },
  { id: 9, name: 'Saturated Fat', unit: 'g' },
  { id: 10, name: 'Iron', unit: 'mg' },
  { id: 11, name: 'Vitamin C', unit: 'mg' },
];

interface Nutrient {
  id: number;
  name: string;
  unit: string;
}

interface NutrientLimit {
  id: number;
  patient: number;
  nutrient: number;
  nutrient_name: string;
  nutrient_unit: string;
  daily_limit: number;
  weekly_limit?: number;
}

interface Patient {
  id: number;
  fname: string;
  lname: string;
  patient_id: string;
  email?: string;
}

export default function DietitianPatientAnalyticsPage() {
  const { patientId } = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [limits, setLimits] = useState<NutrientLimit[]>([]);
  const [nutrients, setNutrients] = useState<Nutrient[]>(FALLBACK_NUTRIENTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLimit, setEditingLimit] = useState<NutrientLimit | null>(null);
  const [formData, setFormData] = useState({ nutrient_id: '', daily_limit: '', weekly_limit: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [patientId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch data individually to handle failures gracefully
      let limitsData: any = [];
      let nutrientsData: Nutrient[] = FALLBACK_NUTRIENTS;
      let foundPatient: Patient | null = null;

      // Fetch patients
      try {
        const patientsData = await dietitianDashboardService.getPatients();
        const patientsList = Array.isArray(patientsData) ? patientsData : patientsData.results || [];
        foundPatient = patientsList.find((p: any) => p.id === Number(patientId)) || null;
        setPatient(foundPatient);
      } catch (e) {
        console.error("Failed to fetch patients", e);
      }

      // Fetch limits
      try {
        const data = await dietitianDashboardService.getNutrientLimits(Number(patientId));
        limitsData = data.results || data || [];
        setLimits(limitsData);
      } catch (e) {
        console.error("Failed to fetch limits", e);
        setLimits([]);
      }

      // Fetch nutrients from reference data (use fallback if fails)
      try {
        const refData = await apiClient.get('/api/v1/reference-data/');
        if (refData.data.nutrients && refData.data.nutrients.length > 0) {
          nutrientsData = refData.data.nutrients;
        }
      } catch (e) {
        console.error("Failed to fetch reference data, using fallback nutrients", e);
      }
      setNutrients(nutrientsData);

    } catch (error) {
      console.error("Failed to load data", error);
      toast.error("Failed to load patient data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (limit: NutrientLimit) => {
    setEditingLimit(limit);
    setFormData({
      nutrient_id: limit.nutrient.toString(),
      daily_limit: limit.daily_limit.toString(),
      weekly_limit: limit.weekly_limit?.toString() || ''
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingLimit(null);
    setFormData({ nutrient_id: '', daily_limit: '', weekly_limit: '' });
    setIsDialogOpen(true);
  };

  const handleDelete = async (limitId: number) => {
    if (!confirm('Delete this nutrient limit?')) return;
    try {
      await apiClient.delete(`/api/v1/nutrient-limits/${limitId}/`);
      toast.success("Limit deleted");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete limit");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nutrient_id) {
      toast.error("Please select a nutrient");
      return;
    }
    setIsSaving(true);
    try {
      const payload: any = {
        daily_limit: parseFloat(formData.daily_limit),
      };

      if (formData.weekly_limit) {
        payload.weekly_limit = parseFloat(formData.weekly_limit);
      }

      if (editingLimit) {
        await dietitianDashboardService.updateNutrientLimit(editingLimit.id, payload);
        toast.success("Limit updated");
      } else {
        await dietitianDashboardService.createNutrientLimit({
          patient: Number(patientId),
          nutrient: Number(formData.nutrient_id),
          ...payload
        });
        toast.success("Limit created");
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save limit");
    } finally {
      setIsSaving(false);
    }
  };

  // Get nutrients not yet assigned
  const availableNutrients = nutrients.filter(
    n => !limits.some(l => l.nutrient === n.id || l.nutrient_name === n.name)
  );

  // Get nutrient info for form display
  const getSelectedNutrient = () => {
    return nutrients.find(n => n.id.toString() === formData.nutrient_id);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  return (
    <>
      {/* Back Button & Patient Header */}
      <div className="mb-6">
        <Link to="/dietitian/patients">
          <Button variant="outline" className="mb-4 rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Patients
          </Button>
        </Link>

        {patient && (
          <div className="flex items-center gap-4 p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-gray-900 flex items-center justify-center text-white text-xl font-bold">
              {patient.fname?.[0] || 'P'}{patient.lname?.[0] || ''}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{patient.fname} {patient.lname}</h2>
              <p className="text-gray-500">Patient ID: {patient.patient_id}</p>
            </div>
          </div>
        )}
      </div>

      {/* Hero Header */}
      <div className="w-full mb-8 p-8 md:p-12 bg-white rounded-[2.5rem] relative overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-gray-100 text-center">
        <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-gray-50 rounded-2xl mb-6 shadow-sm"
          >
            <TrendingUp className="w-10 h-10 text-gray-900" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight"
          >
            Nutrition <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600">Limits</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-500"
          >
            Set daily and weekly nutrient limits for this patient.
          </motion.p>
        </div>

        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-teal-500/10 to-transparent rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl opacity-60 translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Nutrient Limits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Active Limits</h2>
              <p className="text-gray-500">{limits.length} of {nutrients.length} nutrients configured</p>
            </div>
            <Button
              onClick={handleCreate}
              disabled={availableNutrients.length === 0}
              className="rounded-xl h-12 px-6 bg-gray-900 text-white font-bold shadow-lg hover:bg-gray-800"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Limit
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {limits.map((limit) => (
              <Card key={limit.id} className="p-6 rounded-[2rem] border-gray-100 shadow-sm hover:shadow-md transition-all relative group bg-white">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-green-50 rounded-xl text-green-600">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(limit)} className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-900">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(limit.id)} className="h-8 w-8 rounded-lg text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{limit.nutrient_name || nutrients.find(n => n.id === limit.nutrient)?.name || 'Unknown'}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-black text-gray-900">{Math.round(limit.daily_limit)}</span>
                  <span className="text-sm font-bold text-gray-400">{limit.nutrient_unit || nutrients.find(n => n.id === limit.nutrient)?.unit || ''} / day</span>
                </div>
                {limit.weekly_limit && (
                  <div className="text-sm text-gray-500">
                    Weekly: {limit.weekly_limit} {limit.nutrient_unit}
                  </div>
                )}
              </Card>
            ))}

            {limits.length === 0 && (
              <div className="col-span-full py-12 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-bold mb-2">No limits set yet.</p>
                <p className="text-sm text-gray-400 mb-4">Set nutrient limits to help your patient stay on track.</p>
                <Button onClick={handleCreate} className="rounded-xl">
                  <Plus className="w-4 h-4 mr-2" /> Set First Limit
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Add Section */}
        {availableNutrients.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Add Nutrients</h3>
            <div className="flex flex-wrap gap-2">
              {availableNutrients.map(nutrient => (
                <Button
                  key={nutrient.id}
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    setEditingLimit(null);
                    setFormData({ nutrient_id: nutrient.id.toString(), daily_limit: '', weekly_limit: '' });
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" /> {nutrient.name} ({nutrient.unit})
                </Button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Weekly Progress Section */}
        {limits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-2">Weekly Progress Overview</h3>
            <p className="text-gray-500 mb-6">See how close the patient is to their nutrient targets</p>

            <div className="grid gap-4">
              {limits.map((limit) => {
                // Generate stable progress based on limit ID (for demo purposes)
                // In production, fetch actual consumption data from API
                const seed = limit.id * 17 % 100;
                const progress = Math.min(seed + 20, 100); // 20-100% range
                const consumed = Math.round((limit.daily_limit * progress) / 100);
                const isOver = progress > 100;
                const displayProgress = Math.min(progress, 100);

                return (
                  <div key={limit.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">{limit.nutrient_name || nutrients.find(n => n.id === limit.nutrient)?.name}</span>
                      <span className={`text-sm font-bold ${isOver ? 'text-red-600' : progress > 80 ? 'text-amber-600' : 'text-gray-600'}`}>
                        {consumed} / {Math.round(limit.daily_limit)} {limit.nutrient_unit}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' :
                          progress > 80 ? 'bg-amber-500' :
                            'bg-emerald-500'
                          }`}
                        style={{ width: `${displayProgress}%` }}
                      />
                    </div>
                    {progress > 80 && !isOver && (
                      <p className="text-xs text-amber-600 mt-1">⚡ Approaching daily limit</p>
                    )}
                    {isOver && (
                      <p className="text-xs text-red-600 mt-1">⚠️ Patient has exceeded the daily limit</p>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-gray-400 mt-4 text-center">
              * Progress is simulated. Connect to patient analytics API for real-time data.
            </p>
          </motion.div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              {editingLimit ? 'Edit Limit' : 'Set Nutrient Limit'}
            </DialogTitle>
            <DialogDescription className="text-center">
              Define daily and weekly targets for this nutrient.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Nutrient</Label>
              <Select
                value={formData.nutrient_id}
                onValueChange={(val) => setFormData({ ...formData, nutrient_id: val })}
                disabled={!!editingLimit}
              >
                <SelectTrigger className="w-full h-12 rounded-xl bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Select a nutrient..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {(editingLimit ? nutrients : availableNutrients).map(n => (
                    <SelectItem key={n.id} value={n.id.toString()}>
                      {n.name} ({n.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Daily Limit *</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    required
                    placeholder="e.g. 2000"
                    value={formData.daily_limit}
                    onChange={e => setFormData({ ...formData, daily_limit: e.target.value })}
                    className="rounded-xl h-12 bg-gray-50 border-gray-200 pr-16 text-lg font-bold"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm pointer-events-none">
                    {getSelectedNutrient()?.unit || 'unit'}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Weekly Limit</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Optional"
                    value={formData.weekly_limit}
                    onChange={e => setFormData({ ...formData, weekly_limit: e.target.value })}
                    className="rounded-xl h-12 bg-gray-50 border-gray-200 pr-16 text-lg font-bold"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm pointer-events-none">
                    {getSelectedNutrient()?.unit || 'unit'}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-3">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-12 px-6">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving || !formData.nutrient_id || !formData.daily_limit}
                className="rounded-xl h-12 px-8 bg-gray-900 text-white font-bold"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Limit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
