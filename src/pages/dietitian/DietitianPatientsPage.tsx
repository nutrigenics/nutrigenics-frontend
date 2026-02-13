import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Clock, UserPlus, Loader2, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { dietitianDashboardService } from '@/services/dietitian-dashboard.service';
import { useNavigate } from 'react-router-dom';
import type { Patient } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Ensure these are imported or available

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import apiClient from '@/services/api.client';
import { SendNotificationDialog } from '@/components/dietitian/SendNotificationDialog';
import { PatientChatDialog } from '@/components/chat/PatientChatDialog';

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
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('all');

  // Request Patient Modal State
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestForm, setRequestForm] = useState({
    patient_id: '',
    message: ''
  });

  // Notification Modal State - Keeping strictly for redundancy if needed, but actions are removed from table
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [selectedPatientNotify, _setSelectedPatientNotify] = useState<{ id: number, name: string } | null>(null);

  // Chat Modal State - Keeping strictly for redundancy
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChatPatient, _setSelectedChatPatient] = useState<any>(null);

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

  const calculateAge = (dobString?: string) => {
    if (!dobString) return 'N/A';
    const dob = new Date(dobString);
    const diff_ms = Date.now() - dob.getTime();
    const age_dt = new Date(diff_ms);
    return Math.abs(age_dt.getUTCFullYear() - 1970);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredPatients = patients.filter(patient => {
    if (genderFilter === 'all') return true;
    return patient.gender?.toLowerCase() === genderFilter.toLowerCase();
  });

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  }

  return (
    <>
      {/* Simplified Page Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Patients</h1>
          <p className="text-slate-500">Manage your patient list and connection requests.</p>
        </motion.div>
      </div>

      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <h2 className="text-sm font-bold text-orange-700 uppercase tracking-wider">Pending Requests</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pendingRequests.map((req) => (
              <Card key={req.id} className="p-6 rounded-2xl border-orange-100 bg-orange-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate text-sm">
                      {req.patient_details?.fname || 'Patient'} {req.patient_details?.lname || ''}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">{req.patient_details?.email}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Table Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
        <div className="flex flex-1 w-full gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-12 bg-white border-slate-200 rounded-xl focus:ring-emerald-500/20"
            />
          </div>
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-[140px] h-12 bg-white border-slate-200 rounded-xl">
              <div className="flex items-center gap-2 text-slate-600">
                <Filter className="w-3.5 h-3.5" />
                <SelectValue placeholder="Gender" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setIsRequestOpen(true)} className="w-full md:w-auto h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/10">
          <UserPlus className="w-4 h-4 mr-2" /> Add Patient
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-300 shadow-soft overflow-hidden">



        {filteredPatients.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 font-medium">No connected patients found.</p>
            <Button variant="link" onClick={() => setIsRequestOpen(true)} className="mt-2 text-emerald-600 font-bold hover:text-emerald-700">
              Send a connection request
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader className='h-16 border-b border-slate-100 bg-slate-50/50'>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[300px] pl-6">Patient</TableHead>
                <TableHead>Patient ID</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow
                  key={patient.id}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors h-8"
                  onClick={() => navigate(`/dietitian/patients/${patient.id}`)}
                >
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-sm">
                        {patient.fname?.[0]}{patient.lname?.[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{patient.fname} {patient.lname}</div>
                        <div className="text-xs text-slate-500">{patient.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-slate-600 font-medium">
                    {patient.patient_id}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {calculateAge(patient.date_of_birth)}
                  </TableCell>
                  <TableCell className="text-slate-600 capitalize">
                    {patient.gender || '-'}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {formatDate(patient.consent_date)}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Request Patient Dialog */}
      <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
        <DialogContent className="sm:max-w-md rounded-xl p-8">
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
              <Button type="button" variant="outline" onClick={() => setIsRequestOpen(false)} className="rounded-xl h-12 px-6 border-slate-200 text-slate-700 hover:bg-slate-50">Cancel</Button>
              <Button type="submit" disabled={isRequesting} className="rounded-xl h-12 px-8 bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20">
                {isRequesting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Request'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <SendNotificationDialog
        open={isNotificationOpen}
        onOpenChange={setIsNotificationOpen}
        patientId={selectedPatientNotify?.id || null}
        patientName={selectedPatientNotify?.name}
      />

      <PatientChatDialog
        open={isChatOpen}
        onOpenChange={setIsChatOpen}
        patient={selectedChatPatient}
      />
    </>
  );
}
