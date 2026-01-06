import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { dietitianService } from '@/services/dietitian.service';
import { DietitianList } from '@/components/dietitian/DietitianList';
import type { Dietitian } from '@/components/dietitian/DietitianList';
import { Loader2, MessageCircle, Clock, CheckCircle2, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function MyDietitianPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [myDietitian, setMyDietitian] = useState<Dietitian | null>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [availableDietitians, setAvailableDietitians] = useState<Dietitian[]>([]);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const myData = await dietitianService.getMyDietitian();
      setMyDietitian(myData.dietitian);
      setPendingRequestsCount(myData.pending_requests || 0);

      // If no dietitian and no pending requests, fetch available
      if (!myData.dietitian && (!myData.pending_requests || myData.pending_requests === 0)) {
        const listData = await dietitianService.getDietitians();
        setAvailableDietitians(listData.results || listData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequest = async (id: number) => {
    if (confirm("Send a connection request to this dietitian?")) {
      setRequestStatus('sending');
      try {
        await dietitianService.requestDietitian(id, "I would like to connect with you for nutrition guidance.");
        setRequestStatus('success');
        // Refresh data to show pending state
        fetchData();
        alert("Request sent successfully!");
      } catch (error) {
        console.error('Request failed:', error);
        setRequestStatus('error');
        alert("Failed to send request. You may already have a pending request.");
      } finally {
        setRequestStatus('idle');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Case 1: Assigned Dietitian
  if (myDietitian) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/10 to-background border-border shadow-md overflow-hidden relative">
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                <AvatarImage src={myDietitian.image} />
                <AvatarFallback className="text-4xl">{myDietitian.fname[0]}</AvatarFallback>
              </Avatar>
              <div className="text-center md:text-left space-y-2 flex-1">
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <h2 className="text-3xl font-bold">{myDietitian.fname} {myDietitian.lname}</h2>
                  <CheckCircle2 className="w-6 h-6 text-green-500 fill-green-500/10" />
                </div>
                <p className="text-muted-foreground text-lg">{myDietitian.hospital_name || 'Independent Specialist'}</p>
                <p className="text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                  <User className="w-4 h-4" /> Your Assigned Expert
                </p>
              </div>
              <Link to="/my-dietitian/chat">
                <Button size="lg" className="rounded-xl px-8 h-12 text-lg shadow-lg gap-2">
                  <MessageCircle className="w-5 h-5" /> Open Chat
                </Button>
              </Link>
            </div>

            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          </Card>
        </motion.div>

        {/* Placeholder for future features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 rounded-2xl border-dashed border-2 border-muted flex flex-col items-center justify-center text-center p-12 min-h-[200px]">
            <h3 className="font-semibold text-lg mb-2">Upcoming Appointments</h3>
            <p className="text-muted-foreground">No appointments scheduled.</p>
          </Card>
          <Card className="p-6 rounded-2xl border-dashed border-2 border-muted flex flex-col items-center justify-center text-center p-12 min-h-[200px]">
            <h3 className="font-semibold text-lg mb-2">Shared Plans</h3>
            <p className="text-muted-foreground">Check your dashboard for active plans.</p>
          </Card>
        </div>
      </div>
    );
  }

  // Case 2: Pending Request
  if (pendingRequestsCount > 0) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="p-8 rounded-[2rem] border-primary/20 bg-primary/5 text-center space-y-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Request Pending</h2>
            <p className="text-muted-foreground">
              Your request to connect with a dietitian is currently pending approval.
              <br />You will be notified once they accept your request.
            </p>
          </div>
          <Button variant="outline" className="rounded-xl" disabled>
            Awaiting Approval
          </Button>
        </Card>
      </div>
    );
  }

  // Case 3: Available Dietitians (Discovery)
  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl font-black mb-4 tracking-tight">Find Your <span className="text-primary">Dietitian</span></h1>
        <p className="text-lg text-muted-foreground">
          Connect with certified nutrition experts to receive personalized guidance and support.
        </p>
      </div>

      <DietitianList
        dietitians={availableDietitians}
        onRequest={handleRequest}
        isLoading={requestStatus === 'sending'}
      />
    </div>
  );
}
