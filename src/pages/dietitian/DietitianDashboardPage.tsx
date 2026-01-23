// MainLayout removed
// import { MainLayout } from '@/layouts/MainLayout';
import { Card } from '@/components/ui/card';
import { Users, MessageSquare, TrendingUp, Calendar, ChevronRight, Loader2 } from 'lucide-react';
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
    { label: "Total Patients", value: stats?.total_patients || 0, change: "Active", trend: "up", icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Pending Requests", value: stats?.pending_requests_count || 0, change: "Needs Action", trend: "neutral", icon: MessageSquare, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Unread Messages", value: stats?.unread_messages_count || 0, change: "Inbox", trend: "neutral", icon: Calendar, color: "text-orange-500", bg: "bg-orange-50" }, // Using Calendar icon as placeholder for now or stick to MessageSquare
    { label: "Status", value: stats?.is_approved ? "Active" : "Pending", change: "Account", trend: "up", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
  ];

  return (
    <>
      {/* Hero Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-gray-500 font-bold uppercase tracking-wider text-xs mb-2"
          >
            Overview
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-black text-gray-900 leading-tight"
          >
            Good Morning, <span className="text-transparent bg-clip-text bg-gradient-to-r from-logo to-emerald-600">
              Dr. {stats?.dietitian?.fname || 'Dietitian'}
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 mt-2 text-lg"
          >
            Here's what's happening with your patients today.
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button className="bg-gray-900 text-white hover:bg-gray-800 rounded-xl px-6 h-12 font-bold shadow-lg shadow-gray-900/10">
            <Calendar className="w-4 h-4 mr-2" />
            View Schedule
          </Button>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6 border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-[2rem]">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black text-gray-900 mb-1">{stat.value}</h3>
                <p className="text-gray-500 font-medium text-sm">{stat.label}</p>
                <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-full mt-2 inline-block">{stat.change}</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity / Patients */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-8 border-gray-100 shadow-sm rounded-[2.5rem]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Recent Patients</h2>
                  <p className="text-gray-500">Latest updates from your patients</p>
                </div>
                <Link to="/dietitian/patients">
                  <Button variant="ghost" className="text-logo hover:bg-logo/10 hover:text-logo font-bold">
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>

              <div className="space-y-6">
                {stats?.patients?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No patients connected yet.</p>
                ) : (
                  stats?.patients?.map((patient: any, index: number) => (
                    <div key={index} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer group">
                      <div className={`p-3 rounded-xl shrink-0 bg-blue-100 text-blue-600`}>
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-gray-900 truncate group-hover:text-logo transition-colors">
                            {patient.user.first_name} {patient.user.last_name}
                          </h4>
                          <span className="text-xs font-bold text-gray-400 flex items-center whitespace-nowrap">
                            ID: {patient.id}
                          </span>
                        </div>
                        <p className="text-gray-500 text-sm truncate">{patient.user.email}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions / Upcoming (Placeholder) */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-8 border-gray-100 shadow-sm rounded-[2.5rem] bg-gray-900 text-white relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-64 h-64 bg-logo/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-6">Upcoming Sessions</h2>
                {/* Placeholder Content */}
                <div className="flex items-center justify-center h-40 text-gray-400">
                  <p>No sessions scheduled.</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}
