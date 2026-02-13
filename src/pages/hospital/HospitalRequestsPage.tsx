import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ClipboardList, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
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
      {/* Page Header */}
      <div className="mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-2"
        >
          <div className="p-1.5 bg-gray-100 rounded-lg">
            <ClipboardList className="w-4 h-4 text-gray-600" />
          </div>
          <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Workflows</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-bold text-gray-900"
        >
          System Requests
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-gray-500 mt-1"
        >
          Manage permissions and access controls.
        </motion.p>
      </div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search dietitians..."
            className="pl-10 h-10 bg-gray-50 border-gray-200 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 rounded-xl text-sm"
          />
        </div>
      </motion.div>

      {/* Requests List */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No requests found</div>
        ) : (
          filteredRequests.map((req, index) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (index * 0.05) }}
            >
              <Card className="p-6 rounded-xl border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${req.status === 'pending' ? 'bg-orange-50 border-orange-100 text-orange-500' :
                      req.status === 'approved' ? 'bg-green-50 border-green-100 text-green-500' :
                        'bg-red-50 border-red-100 text-red-500'
                      }`}>
                      {req.status === 'pending' ? <Clock className="w-4 h-4" /> :
                        req.status === 'approved' ? <CheckCircle className="w-4 h-4" /> :
                          <XCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-medium text-gray-900">Dietitian Access</h3>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                          High
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        <span className="font-medium text-gray-700">{req.dietitian_details?.name}</span> • {req.dietitian_details?.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-0 border-gray-100">
                    <div className="text-left sm:text-right">
                      <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Date</span>
                      <span className="text-xs font-medium text-gray-600">{new Date(req.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="flex gap-2">
                      {req.status === 'pending' ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-lg border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs font-medium"
                            onClick={() => handleRespond(req.id, 'rejected')}
                            disabled={processingId === req.id}
                          >
                            {processingId === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Reject'}
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 rounded-lg bg-gray-900 text-white hover:bg-gray-800 text-xs font-medium"
                            onClick={() => handleRespond(req.id, 'approved')}
                            disabled={processingId === req.id}
                          >
                            {processingId === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Approve'}
                          </Button>
                        </>
                      ) : (
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
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
