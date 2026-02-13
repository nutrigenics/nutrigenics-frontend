// MainLayout removed
// import { MainLayout } from '@/layouts/MainLayout';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Users, MessagesSquare, TrendingUp, Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { dietitianDashboardService } from '@/services/dietitian-dashboard.service';
import type { DashboardStats } from '@/services/dietitian-dashboard.service';
import { Link } from 'react-router-dom';

export default function DietitianDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dietitianDashboardService.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  }

  const statCards = [
    { label: "Total Patients", value: stats?.total_patients || 0, change: "Active", trend: "up", icon: Users, colorKey: "blue" },
    { label: "Pending Requests", value: stats?.pending_requests_count || 0, change: "Needs Action", trend: "neutral", icon: MessagesSquare, colorKey: "purple" },
    { label: "Unread Messages", value: stats?.unread_messages_count || 0, change: "Inbox", trend: "neutral", icon: Calendar, colorKey: "orange" },
    { label: "Status", value: stats?.is_approved ? "Active" : "Pending", change: "Account", trend: "up", icon: TrendingUp, colorKey: "emerald" },
  ];

  return (
    <>
      {/* Hero Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-slate-900 leading-tight"
          >
            Good Morning, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-emerald-500">
              Dr. {stats?.dietitian?.fname || 'Dietitian'}
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 mt-1 text-sm"
          >
            Here's what's happening with your patients today.
          </motion.p>
        </div>
      </div>


      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {
          statCards.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <StatCard
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                trend={{ label: stat.change }}
                color={stat.colorKey as any}
              />
            </motion.div>
          ))
        }
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Recent Activity / Patients */}
        <div className="w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-5 border-slate-100 shadow-soft rounded-2xl bg-white">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Recent Patients</h2>
                  <p className="text-gray-500 text-xs">Latest updates from your patients</p>
                </div>
                <Link to="/dietitian/patients">
                  <Button variant="ghost" size="sm" className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 font-bold rounded-full text-xs">
                    View All <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>

              <div className="space-y-4">
                {stats?.patients?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6 text-sm">No patients connected yet.</p>
                ) : (
                  stats?.patients?.map((patient: any, index: number) => (
                    <Link key={index} to={`/dietitian/patients/${patient.id}`}>
                      <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                        <div className={`p-2.5 rounded-lg shrink-0 bg-blue-100 text-blue-600`}>
                          <Users className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className="font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors text-sm">
                              {patient.user.first_name} {patient.user.last_name}
                            </h4>
                            <span className="text-xs font-bold text-gray-400 flex items-center whitespace-nowrap">
                              ID: {patient.id}
                            </span>
                          </div>
                          <p className="text-slate-500 text-xs truncate">{patient.user.email}</p>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}
