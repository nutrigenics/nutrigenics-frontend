import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ArrowLeft, User, Search, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { hospitalDashboardService } from '@/services/hospital-dashboard.service';
import { Link } from 'react-router-dom';
import type { HospitalDashboardStats } from '@/types';

export default function HospitalDietitiansPage() {
    const [stats, setStats] = useState<HospitalDashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedDietitian, setExpandedDietitian] = useState<number | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await hospitalDashboardService.getDashboard();
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter dietitians by search term
    const filteredDietitians = (stats?.dietitians || []).filter((d: any) =>
        `${d.fname} ${d.lname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get patients for a specific dietitian
    const getPatientsForDietitian = (dietitianId: number) => {
        return (stats?.patients || []).filter((p: any) => p.dietitian_id === dietitianId);
    };

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
    }

    return (
        <>
            {/* Header */}
            <div className="mb-8">
                <Link to="/hospital/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium text-sm mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Link>
                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-5xl font-bold text-foreground mb-2 tracking-tight"
                >
                    Dietitians <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">& Patients</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-lg text-muted-foreground"
                >
                    View and manage your approved dietitians and their assigned patients.
                </motion.p>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="p-5 border-border shadow-sm rounded-2xl bg-card flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-foreground">{stats?.total_dietitians || 0}</p>
                            <p className="text-sm text-muted-foreground">Approved Dietitians</p>
                        </div>
                    </Card>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card className="p-5 border-border shadow-sm rounded-2xl bg-card flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-foreground">{stats?.total_patients || 0}</p>
                            <p className="text-sm text-muted-foreground">Total Patients</p>
                        </div>
                    </Card>
                </motion.div>
            </div>

            {/* Search */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        placeholder="Search dietitians by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-12 bg-muted/50 border-border rounded-xl text-base"
                    />
                </div>
            </motion.div>

            {/* Dietitians List */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <Card className="border-border shadow-sm rounded-3xl bg-card overflow-hidden">
                    {filteredDietitians.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            {searchTerm ? 'No dietitians found matching your search' : 'No dietitians registered yet'}
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {filteredDietitians.map((dietitian: any, index: number) => {
                                const patients = getPatientsForDietitian(dietitian.id);
                                const isExpanded = expandedDietitian === dietitian.id;

                                return (
                                    <div key={dietitian.id || index}>
                                        {/* Dietitian Row */}
                                        <div
                                            className={`p-6 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors ${isExpanded ? 'bg-muted/30' : ''}`}
                                            onClick={() => setExpandedDietitian(isExpanded ? null : dietitian.id)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
                                                    {dietitian.fname?.[0] || 'D'}{dietitian.lname?.[0] || ''}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-foreground text-lg">{dietitian.fname} {dietitian.lname}</h4>
                                                    <p className="text-sm text-muted-foreground">{dietitian.email || dietitian.place || 'Dietitian'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right mr-2">
                                                    <p className="text-2xl font-bold text-foreground">{patients.length}</p>
                                                    <p className="text-xs text-muted-foreground">Patients</p>
                                                </div>
                                                <span className="inline-block px-3 py-1 rounded-lg text-xs font-bold bg-green-100 text-green-600">
                                                    Active
                                                </span>
                                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                                                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Patients Panel (Expandable) */}
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="bg-muted/20 border-t border-border p-6"
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <h5 className="font-bold text-foreground">Assigned Patients ({patients.length})</h5>
                                                </div>

                                                {patients.length === 0 ? (
                                                    <p className="text-muted-foreground text-sm py-4">No patients assigned to this dietitian yet.</p>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {patients.map((patient: any) => (
                                                            <div key={patient.id} className="bg-card p-4 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-purple-500/20">
                                                                        {patient.name?.split(' ').map((n: string) => n[0]).join('') || 'P'}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-bold text-foreground truncate">{patient.name}</p>
                                                                        <p className="text-xs text-muted-foreground font-mono">{patient.patient_id}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                                                    <span>{patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'N/A'}</span>
                                                                    <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded font-bold">Active</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            </motion.div>
        </>
    );
}
