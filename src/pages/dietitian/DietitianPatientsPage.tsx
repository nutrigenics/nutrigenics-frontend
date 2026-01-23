import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, User, TrendingUp, MessageSquare, Activity, Calendar, Loader2, Clock, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { dietitianDashboardService } from '@/services/dietitian-dashboard.service';
import { Link } from 'react-router-dom';
import type { Patient } from '@/types';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import apiClient from '@/services/api.client';

interface PendingRequest {
  id: number;
  patient_details: {
    name: string;
    fname: string;
    lname: string;
    email: string;
  };
  message: string;
  status: string;
  created_at: string;
}

export default function DietitianPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Request Patient Modal State
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestForm, setRequestForm] = useState({
    patient_id: '',
    message: ''
  });

  useEffect(() => {
    fetchData();
  }, [search]);

  const fetchData = async () => {
    try {
      const [patientsData, requestsData] = await Promise.all([
        dietitianDashboardService.getPatients(search),
        apiClient.get('/api/v1/dietitian-requests/')
      ]);

      setPatients(Array.isArray(patientsData) ? patientsData : patientsData.results || []);

      // Filter pending requests
      const requests = requestsData.data.results || requestsData.data || [];
      setPendingRequests(requests.filter((r: PendingRequest) => r.status === 'pending'));
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.patient_id.trim()) {
      toast.error("Please enter a Patient ID");
      return;
    }

    setIsRequesting(true);
    try {
      await apiClient.post('/api/v1/dietitian-requests/', {
        patient_id: requestForm.patient_id.trim(),
        message: requestForm.message
      });

      toast.success("Connection request sent!");
      setIsRequestOpen(false);
      setRequestForm({ patient_id: '', message: '' });
      fetchData(); // Refresh to show new pending request
    } catch (error: any) {
      console.error("Failed to send request", error);
      const errorMsg = error.response?.data?.patient_id ||
        error.response?.data?.detail ||
        "Failed to send request. Please check the Patient ID.";
      toast.error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
    } finally {
      setIsRequesting(false);
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
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="relative group w-full md:w-auto"
            >
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-logo transition-colors" />
              <Input
                type="text"
                placeholder="Search patients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-14 w-full md:w-80 bg-gray-50 border-gray-200 focus:border-logo/50 focus:ring-4 focus:ring-logo/10 rounded-2xl shadow-inner text-base"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button onClick={() => setIsRequestOpen(true)} className="h-14 px-8 rounded-2xl bg-gray-900 text-white font-bold shadow-lg hover:bg-gray-800 w-full md:w-auto">
                <UserPlus className="w-5 h-5 mr-2" />
                Add Patient
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">Pending Requests</h2>
            <p className="text-gray-500">Waiting for patient approval</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingRequests.map((req) => (
              <Card key={req.id} className="p-5 rounded-2xl border-orange-100 bg-orange-50/30">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">
                      {req.patient_details?.fname || 'Patient'} {req.patient_details?.lname || ''}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">{req.patient_details?.email || 'Awaiting response'}</p>
                    <p className="text-xs text-orange-600 mt-1">Pending since {new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Connected Patients List */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Connected Patients</h2>
        <p className="text-gray-500">Patients who have accepted your request</p>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {patients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-gray-50 rounded-2xl border-dashed border-2">
            No connected patients yet.
            <Button variant="link" onClick={() => setIsRequestOpen(true)} className="mt-2 text-primary font-bold">
              Send a connection request
            </Button>
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
                    {patient.fname?.[0] || '?'}{patient.lname?.[0] || ''}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center md:text-left space-y-2">
                    <h3 className="text-xl font-bold text-gray-900">{patient.fname} {patient.lname}</h3>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" /> {patient.patient_id || 'N/A'}
                      </span>
                      {patient.place && (
                        <span className="flex items-center gap-1">
                          <Activity className="w-4 h-4" /> {patient.place}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap justify-center gap-3 w-full md:w-auto">
                    <Link to={`/dietitian/patients/${patient.id}/analytics`}>
                      <Button variant="outline" className="h-12 px-5 rounded-xl border-gray-200 hover:bg-gray-50 font-semibold text-gray-700">
                        <TrendingUp className="w-4 h-4 mr-2" /> Analytics
                      </Button>
                    </Link>
                    <Link to={`/dietitian/patients/${patient.id}/chat`}>
                      <Button variant="outline" className="h-12 px-5 rounded-xl border-gray-200 hover:bg-gray-50 font-semibold text-gray-700">
                        <MessageSquare className="w-4 h-4 mr-2" /> Chat
                      </Button>
                    </Link>
                    <Link to={`/dietitian/patients/${patient.id}/plan`}>
                      <Button className="h-12 px-6 rounded-xl bg-gray-900 text-white font-semibold shadow-lg hover:bg-gray-800">
                        <Calendar className="w-4 h-4 mr-2" /> Plan
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Request Patient Dialog */}
      <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Add Patient by ID</DialogTitle>
            <DialogDescription className="text-center">
              Enter the patient's unique ID to send them a connection request.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRequestPatient} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="patientId">Patient ID</Label>
              <Input
                id="patientId"
                type="text"
                required
                placeholder="e.g., patient-01"
                value={requestForm.patient_id}
                onChange={e => setRequestForm({ ...requestForm, patient_id: e.target.value })}
                className="rounded-xl h-12 font-mono"
              />
              <p className="text-xs text-muted-foreground">Ask your patient to share their ID from their dashboard.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Hello! I'm your dietitian and would like to connect with you..."
                value={requestForm.message}
                onChange={e => setRequestForm({ ...requestForm, message: e.target.value })}
                className="rounded-xl min-h-[80px]"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsRequestOpen(false)} className="rounded-xl h-12 px-6">Cancel</Button>
              <Button type="submit" disabled={isRequesting} className="rounded-xl h-12 px-8 bg-gray-900 text-white font-bold">
                {isRequesting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Request'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
