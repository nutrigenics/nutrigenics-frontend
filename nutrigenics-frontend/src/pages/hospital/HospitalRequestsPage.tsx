// MainLayout removed
// import { MainLayout } from '@/layouts/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, ClipboardList, CheckCircle, XCircle, Clock, ChevronDown, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { hospitalDashboardService } from '@/services/hospital-dashboard.service';
import { toast } from 'sonner';
import type { DietitianHospitalRequest } from '@/types';

export default function HospitalRequestsPage() {
  const [requests, setRequests] = useState<DietitianHospitalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await hospitalDashboardService.getRequests();
      setRequests(data.results || data);
    } catch (error) {
      toast.error("Failed to fetch requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async (id: number, status: 'approved' | 'rejected') => {
    setProcessingId(id);
    try {
      await hospitalDashboardService.respondRequest(id, status);
      toast.success(`Request ${status} successfully`);
      // Refresh list to update status
      fetchRequests();
    } catch (error) {
      toast.error(`Failed to ${status} request`);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter(req =>
    req.dietitian_details?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.dietitian_details?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  }

  return (
    <>
      {/* Hero Header */}
      <div className="w-full mb-8 p-8 md:p-10 bg-white rounded-[2.5rem] relative overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-gray-100">
        <div className="relative z-10 flex flex-col md:flex-row items-end justify-between gap-6">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mb-4"
            >
              <div className="p-1.5 bg-gray-100 rounded-lg">
                <ClipboardList className="w-5 h-5 text-gray-900" />
              </div>
              <span className="text-gray-500 text-xs font-bold uppercase tracking-wide">Workflows</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 tracking-tight"
            >
              System <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600">Requests</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-gray-500 max-w-lg"
            >
              Manage permissions, access controls, and administrative tasks.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 w-full md:w-auto"
          >
            <div className="relative group flex-1 sm:flex-none">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-logo transition-colors" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search dietitians..."
                className="pl-12 h-14 w-full sm:w-64 bg-gray-50 border-gray-200 focus:border-logo/50 focus:ring-4 focus:ring-logo/10 rounded-xl shadow-inner text-base"
              />
            </div>
            <Button variant="outline" className="h-14 px-6 rounded-xl border-gray-200 bg-white hover:bg-gray-50 font-bold text-gray-700">
              <Filter className="w-4 h-4 mr-2" /> Filter
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No requests found</div>
        ) : (
          filteredRequests.map((req, index) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (index * 0.1) }}
            >
              <Card className="p-6 rounded-[2rem] border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm shrink-0 ${req.status === 'pending' ? 'bg-orange-50 border-orange-100 text-orange-500' :
                      req.status === 'approved' ? 'bg-green-50 border-green-100 text-green-500' :
                        'bg-red-50 border-red-100 text-red-500'
                      }`}>
                      {req.status === 'pending' ? <Clock className="w-6 h-6" /> : req.status === 'approved' ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-gray-900">Dietitian Access</h3>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md bg-blue-100 text-blue-700`}>
                          High
                        </span>
                      </div>
                      <p className="text-gray-500 font-medium">
                        Requested by <span className="text-gray-900 font-bold">{req.dietitian_details?.name}</span> • {req.dietitian_details?.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between lg:justify-end gap-6 w-full lg:w-auto mt-4 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-0 border-gray-100">
                    <div className="text-left lg:text-right">
                      <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Date Requested</span>
                      <span className="font-bold text-gray-700">{new Date(req.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="flex gap-2">
                      {req.status === 'pending' ? (
                        <>
                          <Button
                            variant="outline"
                            className="h-10 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold"
                            onClick={() => handleRespond(req.id, 'rejected')}
                            disabled={processingId === req.id}
                          >
                            {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reject'}
                          </Button>
                          <Button
                            className="h-10 rounded-xl bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-900/10 font-bold"
                            onClick={() => handleRespond(req.id, 'approved')}
                            disabled={processingId === req.id}
                          >
                            {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Approve'}
                          </Button>
                        </>
                      ) : (
                        <Button variant="outline" className="h-10 rounded-xl border-gray-200 text-gray-500 hover:bg-gray-50 font-bold" disabled>
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)} <ChevronDown className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                    </div>
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
