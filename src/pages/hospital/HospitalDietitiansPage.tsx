import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users, User, Search, Loader2, ChevronDown, Mail, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { hospitalDashboardService } from '@/services/hospital-dashboard.service';
import type { Dietitian, HospitalManagedPatient } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function HospitalDietitiansPage() {
    const [dietitians, setDietitians] = useState<Dietitian[]>([]);
    const [patients, setPatients] = useState<HospitalManagedPatient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedDietitian, setExpandedDietitian] = useState<number | null>(null);

    useEffect(() => {
        fetchData();
    }, [searchTerm]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [dietitiansData, patientsData] = await Promise.all([
                hospitalDashboardService.getManagedDietitians(searchTerm),
                hospitalDashboardService.getManagedPatients(searchTerm),
            ]);
            setDietitians(dietitiansData.results || []);
            setPatients(patientsData.results || []);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getPatientsForDietitian = (dietitianId: number) => {
        return patients.filter((p) => p.dietitian_id === dietitianId);
    };

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
    }

    return (
        <div className="max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl font-bold text-slate-900 tracking-tight"
                        >
                            Dietitians & Patients
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-slate-500 mt-2 text-base"
                        >
                            Manage your staff and monitor patient distributions.
                        </motion.p>
                    </div>

                    {/* Search Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative w-full md:w-80"
                    >
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search dietitians or patients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-11 bg-white border-slate-200 rounded-xl shadow-sm focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                        />
                    </motion.div>
                </div>
            </div>

            {/* Dietitians List */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
                {dietitians.length === 0 ? (
                    <Card className="p-12 text-center border-dashed border-2 border-slate-200 bg-slate-50 rounded-2xl">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <Users className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No results found</h3>
                        <p className="text-slate-500">Try adjusting your search terms.</p>
                    </Card>
                ) : (
                    dietitians.map((dietitian, index: number) => {
                        const assignedPatients = getPatientsForDietitian(dietitian.id);
                        const isExpanded = expandedDietitian === dietitian.id;
                        const hasPatients = assignedPatients.length > 0;

                        return (
                            <motion.div
                                key={dietitian.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div className={cn(
                                    "rounded-2xl border transition-all duration-300 overflow-hidden bg-white",
                                    isExpanded ? "border-emerald-500/30 ring-4 ring-emerald-500/5 shadow-lg" : "border-slate-200 shadow-sm hover:border-emerald-500/30 hover:shadow-md"
                                )}>
                                    {/* Dietitian Header / Trigger */}
                                    <div
                                        className="p-5 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer relative"
                                        onClick={() => setExpandedDietitian(isExpanded ? null : dietitian.id)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                setExpandedDietitian(isExpanded ? null : dietitian.id);
                                            }
                                        }}
                                    >
                                        {/* Status Line (Left Border) - Optional Visual Cue */}
                                        <div className={cn("absolute left-0 top-0 bottom-0 w-1 transition-colors", isExpanded ? "bg-emerald-500" : "bg-transparent")} />

                                        <div className="flex items-center gap-4 flex-1">
                                            {/* Avatar */}
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-lg shadow-inner">
                                                {dietitian.fname?.[0] || 'D'}{dietitian.lname?.[0] || ''}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center flex-wrap gap-2">
                                                    <h3 className="font-bold text-slate-900 text-lg">
                                                        {dietitian.fname} {dietitian.lname}
                                                    </h3>
                                                    {dietitian.is_approved && (
                                                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold text-xs h-5">
                                                            Approved
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-500 font-medium">
                                                    <span className="flex items-center gap-1.5">
                                                        <Mail className="w-3.5 h-3.5" /> {dietitian.email}
                                                    </span>
                                                    {dietitian.place && (
                                                        <span className="flex items-center gap-1.5">
                                                            <Building2 className="w-3.5 h-3.5" /> {dietitian.place}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats & Toggle */}
                                        <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0 mt-2 md:mt-0 pl-16 md:pl-0">
                                            <div className="text-right">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl font-black text-slate-900">{assignedPatients.length}</span>
                                                    <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Patients</span>
                                                </div>
                                            </div>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className={cn("h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 transition-transform duration-300", isExpanded && "rotate-180 bg-emerald-50 text-emerald-600")}
                                                aria-label={isExpanded ? "Collapse patient list" : "Expand patient list"}
                                            >
                                                <ChevronDown className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Expanded Patient List */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                            >
                                                <div className="px-5 pb-5 pt-0">
                                                    <div className="bg-slate-50/80 rounded-xl border border-slate-100 p-5">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                                                <Users className="w-4 h-4 text-emerald-500" />
                                                                Assigned Patients
                                                            </h4>
                                                            <Badge variant="outline" className="bg-white text-slate-500 border-slate-200">
                                                                {assignedPatients.length} Active
                                                            </Badge>
                                                        </div>

                                                        {hasPatients ? (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                {assignedPatients.map((patient) => (
                                                                    <div key={patient.id} className="group bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200 flex items-center gap-3">
                                                                        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold text-sm shadow-sm">
                                                                            {patient.name?.split(' ').map((n: string) => n[0]).join('') || 'P'}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="font-bold text-slate-900 text-sm truncate group-hover:text-emerald-700 transition-colors">
                                                                                {patient.name}
                                                                            </p>
                                                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                                                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs">
                                                                                    {patient.patient_id}
                                                                                </span>
                                                                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                                                <span>{patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'N/A'}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-col gap-1 items-end">
                                                                            <span className="w-2 h-2 rounded-full bg-green-500" title="Active" />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-center py-8">
                                                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                                    <User className="w-5 h-5 text-slate-400" />
                                                                </div>
                                                                <p className="text-slate-500 text-sm font-medium">No patients currently assigned.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </motion.div>
        </div>
    );
}
