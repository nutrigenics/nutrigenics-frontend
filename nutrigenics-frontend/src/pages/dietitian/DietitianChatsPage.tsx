// MainLayout removed
// import { MainLayout } from '@/layouts/MainLayout';
import { MessageSquare, Users, Search, ChevronRight, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dietitianDashboardService } from '@/services/dietitian-dashboard.service';

export default function DietitianChatsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPatients();
  }, [search]);

  const fetchPatients = async () => {
    try {
      const data = await dietitianDashboardService.getPatients(search);
      setPatients(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error("Failed to fetch patients", error);
    } finally {
      setIsLoading(false);
    }
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
                <MessageSquare className="w-5 h-5 text-gray-900" />
              </div>
              <span className="text-gray-500 text-xs font-bold uppercase tracking-wide">Communication</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-black text-gray-900 mb-2 tracking-tight"
            >
              Patient <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600">Messages</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-gray-500 max-w-lg"
            >
              Select a patient to start a conversation.
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
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-14 w-full md:w-80 bg-gray-50 border-gray-200 focus:border-logo/50 focus:ring-4 focus:ring-logo/10 rounded-2xl shadow-inner text-base"
              />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-lg text-gray-900">Active Patients</h3>
            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">{patients.length} total</span>
          </div>

          {/* List */}
          <div className="divide-y divide-gray-50">
            {patients.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No patients found.</p>
              </div>
            ) : (
              patients.map((patient, index) => (
                <motion.div
                  key={patient.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={`/dietitian/chats/${patient.id}`} className="block p-4 hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl group-hover:scale-105 transition-transform">
                        {patient.user.first_name[0]}{patient.user.last_name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {patient.user.first_name} {patient.user.last_name}
                          </h4>
                          {patient.last_message_time && (
                            <span className="text-xs font-bold text-gray-400 flex items-center">
                              {new Date(patient.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center pr-4">
                          <p className={`text-sm truncate flex items-center gap-1 ${patient.unread_count > 0 ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                            {patient.unread_count > 0 && <span className="w-2 h-2 rounded-full bg-blue-500 inline-block flex-shrink-0" />}
                            {patient.last_message || "Tap to start conversation"}
                          </p>
                          {patient.unread_count > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {patient.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
