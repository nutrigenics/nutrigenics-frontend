import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { dietitianService } from '@/services/dietitian.service';
import { Loader2, MessageCircle, CheckCircle2, User, Copy, Clock, Check, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface DietitianRequest {
  id: number;
  dietitian_details: {
    name: string;
    fname: string;
    lname: string;
    email: string;
  };
  message: string;
  status: string;
  created_at: string;
}

interface Dietitian {
  id: number;
  fname: string;
  lname: string;
  image?: string;
  hospital_name?: string;
}

export default function MyDietitianPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [myDietitian, setMyDietitian] = useState<Dietitian | null>(null);
  const [pendingRequests, setPendingRequests] = useState<DietitianRequest[]>([]);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const patientId = user?.patient?.patient_id || 'Not available';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [myData, requestsData] = await Promise.all([
        dietitianService.getMyDietitian(),
        dietitianService.getPendingRequests()
      ]);
      setMyDietitian(myData.dietitian);

      // Filter only pending requests
      const requests = (requestsData.results || requestsData || []);
      setPendingRequests(requests.filter((r: DietitianRequest) => r.status === 'pending'));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyPatientId = () => {
    navigator.clipboard.writeText(patientId);
    setCopied(true);
    toast.success('Patient ID copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRespond = async (requestId: number, status: 'accepted' | 'rejected') => {
    setProcessingId(requestId);
    try {
      await dietitianService.respondRequest(requestId, status);
      toast.success(`Request ${status}!`);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error responding to request:', error);
      toast.error('Failed to process request');
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Patient ID Card - Always visible */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-6 rounded-[2rem] border-gray-100 shadow-sm bg-gradient-to-br from-gray-50 to-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Your Patient ID</h3>
              <p className="text-sm text-gray-500">Share this ID with your dietitian to connect</p>
            </div>
            <div className="flex items-center gap-3">
              <code className="px-6 py-3 bg-gray-900 text-white font-mono font-bold text-lg rounded-xl">
                {patientId}
              </code>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-xl border-gray-200"
                onClick={copyPatientId}
              >
                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Connected Dietitian */}
      {myDietitian && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-8 rounded-[2.5rem] bg-gradient-to-br from-green-50 to-background border-green-100 shadow-md overflow-hidden relative">
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <Avatar className="w-24 h-24 border-4 border-background shadow-xl">
                <AvatarImage src={myDietitian.image} />
                <AvatarFallback className="text-3xl bg-gray-900 text-white">{myDietitian.fname?.[0]}</AvatarFallback>
              </Avatar>
              <div className="text-center md:text-left space-y-2 flex-1">
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <h2 className="text-2xl font-bold">{myDietitian.fname} {myDietitian.lname}</h2>
                  <CheckCircle2 className="w-6 h-6 text-green-500 fill-green-500/10" />
                </div>
                <p className="text-muted-foreground">{myDietitian.hospital_name || 'Independent Specialist'}</p>
                <p className="text-sm text-gray-500 flex items-center justify-center md:justify-start gap-2">
                  <User className="w-4 h-4" /> Your Connected Dietitian
                </p>
              </div>
              <Link to="/my-dietitian/chat">
                <Button size="lg" className="rounded-xl px-8 h-12 text-lg shadow-lg gap-2 bg-gray-900 text-white hover:bg-gray-800">
                  <MessageCircle className="w-5 h-5" /> Chat
                </Button>
              </Link>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          </Card>
        </motion.div>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">Pending Requests</h2>
            <p className="text-gray-500">Dietitians who want to connect with you</p>
          </div>
          <div className="space-y-4">
            {pendingRequests.map((req) => (
              <Card key={req.id} className="p-6 rounded-[2rem] border-gray-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500">
                      <Clock className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {req.dietitian_details?.fname || req.dietitian_details?.name} {req.dietitian_details?.lname || ''}
                      </h3>
                      <p className="text-sm text-gray-500">{req.dietitian_details?.email}</p>
                      {req.message && (
                        <p className="text-sm text-gray-600 mt-1 italic">"{req.message}"</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      className="flex-1 sm:flex-none h-11 rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-bold"
                      onClick={() => handleRespond(req.id, 'rejected')}
                      disabled={processingId === req.id}
                    >
                      {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><X className="w-4 h-4 mr-1" /> Reject</>}
                    </Button>
                    <Button
                      className="flex-1 sm:flex-none h-11 rounded-xl bg-green-600 text-white hover:bg-green-700 font-bold shadow-lg"
                      onClick={() => handleRespond(req.id, 'accepted')}
                      disabled={processingId === req.id}
                    >
                      {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" /> Accept</>}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* No Dietitian, No Pending */}
      {!myDietitian && pendingRequests.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-12 rounded-[2.5rem] border-dashed border-2 border-gray-200 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Dietitian Connected</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Share your Patient ID with a dietitian to receive a connection request.
              Once they send a request, you can accept or reject it here.
            </p>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
