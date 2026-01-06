// MainLayout removed
// import { MainLayout } from '@/layouts/MainLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, User, TrendingUp, MessageSquare, Activity, Calendar, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { dietitianDashboardService } from '@/services/dietitian-dashboard.service';
import { Link } from 'react-router-dom';
import type { Patient } from '@/types';

export default function DietitianPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPatients();
  }, [search]);

  const fetchPatients = async () => {
    try {
      // Debounce need? For now, simple fetch.
      const data = await dietitianDashboardService.getPatients(search);
      setPatients(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error("Failed to fetch patients", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRandomColor = (id: number) => {
    const colors = [
      "bg-blue-100 text-blue-600 border-blue-200",
      "bg-purple-100 text-purple-600 border-purple-200",
      "bg-orange-100 text-orange-600 border-orange-200",
      "bg-emerald-100 text-emerald-600 border-emerald-200"
    ];
    return colors[id % colors.length];
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  }

  return (
    <>
      {/* Hero Header */}
      <div className="mb-8 p-8 md:p-10 bg-white rounded-[2.5rem] relative overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-gray-100">
        <div className="relative z-10 flex flex-col md:flex-row items-end justify-between gap-6">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mb-4"
            >
              <div className="p-1.5 bg-gray-100 rounded-lg">
                <User className="w-5 h-5 text-gray-900" />
              </div>
              <span className="text-gray-500 text-xs font-bold uppercase tracking-wide">Management</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 tracking-tight"
            >
              My <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600">Patients</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-gray-500 max-w-lg"
            >
              Monitor progress, update plans, and stay connected.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full md:w-auto"
          >
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-logo transition-colors" />
              <Input
                type="text"
                placeholder="Search patients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-14 w-full md:w-80 bg-gray-50 border-gray-200 focus:border-logo/50 focus:ring-4 focus:ring-logo/10 rounded-2xl shadow-inner text-base"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Patients List */}
      <div className="grid grid-cols-1 gap-4">
        {patients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-gray-50 rounded-2xl border-dashed border-2">
            No patients found.
          </div>
        ) : (
          patients.map((patient, index) => (
            <motion.div
              key={patient.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (index * 0.1) }}
            >
              <Card className="p-6 md:p-8 rounded-[2rem] border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* Avatar */}
                  <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-2xl font-black border-4 bg-white ${getRandomColor(patient.id)}`}>
                    {patient.fname[0]}{patient.lname[0]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center md:text-left space-y-2">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-gray-900">{patient.fname} {patient.lname}</h3>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider inline-block self-center md:self-auto bg-green-100 text-green-700`}>
                        Active
                      </span>
                    </div>
                    <p className="text-gray-500 font-medium">{patient.email}</p>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-500 mt-3">
                      <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        <Activity className="w-4 h-4 text-gray-400" />
                        {/* Note: dietary_preferences is string[] in type, but code expected object array. Checking serializer... */}
                        {/* Serializer sends CuisineSerializer which has {id, name}. So type Patient needs update or usage check */}
                        {/* PatientProfileSerializer sends 'diet_preference' as DietSerializer list -> {id, name} */}
                        {((patient.dietary_preferences as any) || []).map((d: any) => d.name).join(', ') || 'General'}
                      </span>
                      <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        Plan Active
                      </span>
                    </div>
                  </div>

                  {/* Progress (Placeholder) */}
                  <div className="w-full md:w-48">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-bold text-gray-500">Goal Progress</span>
                      <span className="text-lg font-black text-gray-900">--%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `0%` }}
                        className={`h-full rounded-full bg-gray-300`}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 w-full md:w-auto">
                    <Link to={`/dietitian/patients/${patient.id}/analytics`} className="flex-1 md:flex-none">
                      <Button variant="outline" className="w-full border-gray-200 hover:bg-gray-50 text-gray-700 font-bold h-12 rounded-xl">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Analytics
                      </Button>
                    </Link>
                    <Link to={`/dietitian/chats`} className="flex-1 md:flex-none">
                      <Button className="w-full bg-gray-900 text-white hover:bg-gray-800 font-bold h-12 rounded-xl shadow-lg shadow-gray-900/10">
                        Message
                        <MessageSquare className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </>
  );
}
