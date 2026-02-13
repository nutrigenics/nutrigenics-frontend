import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DietitianChatDialog } from '@/components/chat/DietitianChatDialog';
import { useEffect, useState } from 'react';
import { dietitianService } from '@/services/dietitian.service';
import {
  Loader2,
  ShieldCheck,
  User,
  Copy,
  Check,
  Target,
  Flame,
  Beef,
  Wheat,
  Droplet,
  MapPin,
  Mail,
  Leaf,
  Waves,
  HeartPulse,
  Cookie,
  CircleDot,
  Pill,
  Apple,
  Stethoscope
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface DietitianRequest {
  id: number;
  dietitian_details: {
    name: string;
    fname: string;
    lname: string;
    email: string;
    hospital_name?: string;
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
  place?: string;
  is_approved: boolean;
  email?: string;
  user: {
    id: number;
    email: string;
  };
}

// Helper to map nutrient keys to UI config
const getNutrientConfig = (key: string) => {
  const k = key.toLowerCase();
  if (k.includes('calor')) return { label: 'Calories', icon: Flame, color: 'orange', unit: 'kcal' };
  if (k.includes('protein')) return { label: 'Protein', icon: Beef, color: 'blue', unit: 'g' };
  if (k.includes('carb')) return { label: 'Carbs', icon: Wheat, color: 'amber', unit: 'g' };
  if (k.includes('dist')) return { label: 'Distance', icon: MapPin, color: 'slate', unit: 'km' }; // Example outlier
  if (k.includes('saturated')) return { label: 'Sat. Fat', icon: Droplet, color: 'rose', unit: 'g' };
  if (k.includes('trans')) return { label: 'Trans Fat', icon: Droplet, color: 'red', unit: 'g' };
  if (k.includes('fat') || k.includes('lipid')) return { label: 'Total Fat', icon: Droplet, color: 'rose', unit: 'g' };

  if (k.includes('fiber')) return { label: 'Fiber', icon: Leaf, color: 'emerald', unit: 'g' };
  if (k.includes('sugar')) return { label: 'Sugar', icon: Cookie, color: 'pink', unit: 'g' };
  if (k.includes('salt') || k.includes('sodium')) return { label: 'Sodium', icon: Waves, color: 'cyan', unit: 'mg' };
  if (k.includes('cholesterol')) return { label: 'Cholesterol', icon: HeartPulse, color: 'red', unit: 'mg' };
  if (k.includes('iron')) return { label: 'Iron', icon: CircleDot, color: 'stone', unit: 'mg' };
  if (k.includes('calc')) return { label: 'Calcium', icon: Pill, color: 'slate', unit: 'mg' };
  if (k.includes('vit')) return { label: key, icon: Apple, color: 'violet', unit: 'mg' };

  return { label: key, icon: CircleDot, color: 'slate', unit: '' };
};

export default function MyDietitianPage() {
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [myDietitian, setMyDietitian] = useState<Dietitian | null>(null);
  const [pendingRequests, setPendingRequests] = useState<DietitianRequest[]>([]);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const patientId = user?.patient?.patient_id || 'Not available';
  const targets = user?.patient?.nutrient_targets as Record<string, number> | undefined;

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
    toast.success('ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRespond = async (requestId: number, status: 'accepted' | 'rejected') => {
    setProcessingId(requestId);
    try {
      await dietitianService.respondRequest(requestId, status);
      toast.success(status === 'accepted' ? 'Connection established' : 'Request declined');
      await Promise.all([fetchData(), refreshUser?.()]);
    } catch (error) {
      console.error('Error responding:', error);
      toast.error('Failed to process request');
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  // --- Components ---

  const PatientIdCard = () => (
    <Card className="h-full border-2 border-dashed border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50/50 rounded-2xl overflow-hidden relative group">

      <div className="relative z-10 p-6 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-100 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-slate-500" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Patient ID</span>
          </div>
          <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-xs uppercase font-medium border-0">
            Private Access
          </Badge>
        </div>

        <div className="text-center py-6">
          <div className="bg-white border border-slate-100 rounded-xl py-3 px-4 shadow-sm mb-4">
            <code className="text-2xl font-mono font-bold tracking-widest text-slate-800">
              {patientId}
            </code>
          </div>
          <p className="text-xs text-slate-400 max-w-[200px] mx-auto">
            Share this code securely with your dietitian to grant them access to you.
          </p>
        </div>

        <Button
          onClick={copyPatientId}
          variant="outline"
          className={cn(
            "w-full h-10 font-medium transition-all duration-300 border shadow-sm",
            copied
              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
              : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
          )}
        >
          {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? "Copied" : "Copy Patient ID"}
        </Button>
      </div>
    </Card>
  );

  const NutrientCard = ({ nutrientKey, value }: { nutrientKey: string, value: number }) => {
    const config = getNutrientConfig(nutrientKey);
    // Dynamic color mapping based on config
    const bgColors: Record<string, string> = {
      orange: "bg-orange-500", blue: "bg-blue-500", amber: "bg-amber-500", rose: "bg-rose-500",
      red: "bg-red-500", emerald: "bg-emerald-500", pink: "bg-pink-500", cyan: "bg-cyan-500",
      slate: "bg-slate-500", stone: "bg-stone-500", violet: "bg-violet-500"
    };
    const textColors: Record<string, string> = {
      orange: "text-orange-700", blue: "text-blue-700", amber: "text-amber-700", rose: "text-rose-700",
      red: "text-red-700", emerald: "text-emerald-700", pink: "text-pink-700", cyan: "text-cyan-700",
      slate: "text-slate-700", stone: "text-stone-700", violet: "text-violet-700"
    };
    const borderColors: Record<string, string> = {
      orange: "border-orange-100 hover:border-orange-200", blue: "border-blue-100 hover:border-blue-200",
      amber: "border-amber-100 hover:border-amber-200", rose: "border-rose-100 hover:border-rose-200",
      red: "border-red-100 hover:border-red-200", emerald: "border-emerald-100 hover:border-emerald-200",
      pink: "border-pink-100 hover:border-pink-200", cyan: "border-cyan-100 hover:border-cyan-200",
      slate: "border-slate-100 hover:border-slate-200", stone: "border-stone-100 hover:border-stone-200",
      violet: "border-violet-100 hover:border-violet-200"
    };

    return (
      <div className={cn(
        "relative overflow-hidden rounded-2xl p-5 border shadow-sm transition-all duration-300 hover:shadow-md group bg-white",
        borderColors[config.color] || "border-gray-100"
      )}>
        <div className={cn("absolute inset-0 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity", bgColors[config.color] || "bg-gray-500")} />

        <div className="relative z-10 flex flex-col h-full justify-between gap-4">
          <div className="flex justify-between items-start">
            <div className={cn("p-2 rounded-xl bg-opacity-10", bgColors[config.color] || "bg-gray-500", textColors[config.color] || "text-gray-700")}>
              <config.icon className="w-5 h-5 opacity-100" />
            </div>
          </div>

          <div>
            <h4 className="text-2xl font-bold text-gray-900 leading-tight">
              {value}
              <span className="text-sm font-medium text-gray-400 ml-1">{config.unit}</span>
            </h4>
            <p className="text-xs font-medium text-gray-500 mt-1 uppercase tracking-wide">{config.label}</p>
          </div>
        </div>
      </div>
    );
  };


  // Split targets
  const macroKeys = ['calories', 'protein', 'carbs', 'fat', 'total fat'];
  const allTargets = targets ? Object.entries(targets) : [];
  const macros = allTargets.filter(([k]) => macroKeys.some(mk => k.toLowerCase().includes(mk)));
  const micros = allTargets.filter(([k]) => !macroKeys.some(mk => k.toLowerCase().includes(mk)));

  return (
    <div className="min-h-screen bg-transparent pb-20 pt-8 px-4 sm:px-8 space-y-10 max-w-7xl mx-auto animate-in fade-in duration-500">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            My Care Team
            {pendingRequests.length > 0 && (
              <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0 h-6 w-6 p-0 flex items-center justify-center rounded-full text-xs">
                {pendingRequests.length}
              </Badge>
            )}
          </h1>
          <p className="text-lg text-gray-500 mt-2 max-w-2xl">
            Collaborate with certified dietitians to personalize your health journey.
          </p>
        </div>
      </div>

      {/* Main Connection Area */}
      <div className="grid lg:grid-cols-3 gap-8">

        {/* Dietitian Profile (Spans 2 columns) */}
        <div className="lg:col-span-2">
          {myDietitian ? (
            <Card className="h-full border-0 shadow-lg border bg-white/90 backdrop-blur-md rounded-xl overflow-hidden relative">

              <div className="p-4 md:p-4 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left h-full">

                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-xl transform scale-110" />
                  <Avatar className="w-20 h-20 border-[3px] border-white shadow-inner rounded-xl relative z-10 bg-gray-50">
                    <AvatarImage src={myDietitian.image} className="object-cover" />
                    <AvatarFallback className="text-4xl bg-transparent text-gray-400 rounded-xl">
                      {myDietitian.fname[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex-1 flex flex-col mt-4 h-full space-y-4">
                  <div className='flex-1'>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      {myDietitian.fname} {myDietitian.lname}
                    </h2>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Stethoscope className="w-4 h-4 text-blue-500" />
                        <span>{myDietitian.hospital_name || 'Nutrition Specialist'}</span>
                      </div>
                      {myDietitian.place && (
                        <div className="flex items-center gap-1.5 border-l border-gray-300 pl-3">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{myDietitian.place}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-4 mt-2 text-xs text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3" /> {myDietitian.email}
                      </div>
                      <div className="flex justify-center z-20">
                        <Badge className="text-white shadow-sm px-3 py-1 text-xs">
                          <Check className="w-3 h-3 mr-1" /> Verified
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="py-4 flex flex-col sm:flex-row gap-3 justify-center md:justify-end">
                    <Button
                      className="w-full h-12 px-8 rounded-xl bg-white hover:bg-neutral-100 text-black font-semibold transition-all border w-full  shadow-sm"
                      onClick={() => setIsChatOpen(true)}
                    >
                      {/* <MessageCircle className="w-5 h-5 mr-2" /> */}
                      Open Chat
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="h-full border border-dashed border-gray-200 bg-gray-50/30 rounded-xl flex flex-col items-center justify-center p-10 text-center gap-6 group hover:bg-gray-50/50 transition-colors">
              <div className="w-20 h-20 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
                <User className="w-10 h-10 text-gray-300 group-hover:text-blue-500 transition-colors" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-xl font-bold text-gray-900">No Dietitian Connected</h3>
                <p className="text-gray-500 leading-relaxed">
                  Connect with a professional to unlock personalized meal plans and expert guidance.
                  Share your Patient ID to get started.
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Patient ID Card (Spans 1 column) */}
        <div className="lg:col-span-1 h-full min-h-[300px]">
          <PatientIdCard />
        </div>
      </div>

      {/* Targets & Requests Section */}
      <div className="grid lg:grid-cols-3 gap-8">

        {/* Daily Targets */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" /> Daily Nutrition Targets
            </h3>
          </div>

          {targets ? (
            <div className="space-y-6">
              {/* Macros */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {macros.map(([key, val]) => (
                  <NutrientCard key={key} nutrientKey={key} value={val} />
                ))}
              </div>

              {/* micros */}
              {micros.length > 0 && (
                <>
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 pt-2">
                    <Check className="w-4 h-4 text-emerald-500" /> Additional Goals
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {micros.map(([key, val]) => (
                      <NutrientCard key={key} nutrientKey={key} value={val} />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 border border-dash border-gray-200 rounded-2xl p-8 text-center">
              <p className="text-gray-500">No nutrition targets set yet. Ask your dietitian to assign goals.</p>
            </div>
          )}
        </div>

        {/* Pending Requests Column */}
        {pendingRequests.length > 0 && (
          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-amber-500" /> Pending Requests
            </h3>
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <Card key={req.id} className="p-5 border border-amber-100 shadow-sm rounded-2xl bg-gradient-to-br from-amber-50/50 to-white">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold flex-none text-sm border-2 border-white shadow-sm">
                      {req.dietitian_details.fname[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm truncate">
                        {req.dietitian_details.fname} {req.dietitian_details.lname}
                      </h4>
                      <p className="text-xs text-gray-500 mb-2 truncate">{req.dietitian_details.hospital_name || 'Nutrition Specialist'}</p>

                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={() => handleRespond(req.id, 'accepted')}
                          disabled={!!processingId}
                          className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex-1 rounded-lg"
                        >
                          {processingId === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Accept'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRespond(req.id, 'rejected')}
                          disabled={!!processingId}
                          className="h-8 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 flex-1 rounded-lg"
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Chat Dialog */}
      <DietitianChatDialog
        open={isChatOpen}
        onOpenChange={setIsChatOpen}
        dietitian={myDietitian}
      />
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-screen p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex gap-4 items-center">
        <Skeleton className="h-10 w-64 rounded-xl" />
      </div>
      <div className="grid lg:grid-cols-3 gap-8 h-80">
        <div className="lg:col-span-2">
          <Skeleton className="h-full w-full rounded-xl" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-full w-full rounded-2xl" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
      </div>
    </div>
  );
}
