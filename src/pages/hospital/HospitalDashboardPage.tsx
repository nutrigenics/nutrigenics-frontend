// MainLayout removed
// import { MainLayout } from '@/layouts/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Users, BedDouble, FileText, ArrowUpRight, ArrowDownRight, ClipboardList, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { hospitalDashboardService } from '@/services/hospital-dashboard.service';
import { Link } from 'react-router-dom';
import type { HospitalDashboardStats } from '@/types';

export default function HospitalDashboardPage() {
  const [stats, setStats] = useState<HospitalDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const data = await hospitalDashboardService.getDashboard();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch dashboard", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  }

  const statCards = [
    { label: "Total Dietitians", value: stats?.total_dietitians || 0, change: "+12%", trend: "up", icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Pending Requests", value: stats?.pending_requests_count || 0, change: "-2", trend: "down", icon: ClipboardList, color: "text-orange-500", bg: "bg-orange-50" },
    // Placeholders for other stats not yet in API
    { label: "Total Admitted", value: "82", change: "+5%", trend: "up", icon: BedDouble, color: "text-rose-500", bg: "bg-rose-50" },
    { label: "Revenue", value: "$2.4M", change: "+8.1%", trend: "up", icon: Activity, color: "text-emerald-500", bg: "bg-emerald-50" },
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
            Administration
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-black text-gray-900 leading-tight"
          >
            {stats?.hospital?.name || 'Hospital'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-logo to-emerald-600">Overview</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 mt-2 text-lg"
          >
            Real-time insights and administrative controls.
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button className="bg-gray-900 text-white hover:bg-gray-800 rounded-xl px-6 h-12 font-bold shadow-lg shadow-gray-900/10">
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
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
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${stat.trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black text-gray-900 mb-1">{stat.value}</h3>
                <p className="text-gray-500 font-medium text-sm">{stat.label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Requests */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-8 border-gray-100 shadow-sm rounded-[2.5rem]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Recent Requests</h2>
                  <p className="text-gray-500">Pending administrative actions</p>
                </div>
                <Link to="/hospital/requests">
                  <Button variant="ghost" className="text-logo hover:bg-logo/10 hover:text-logo font-bold">
                    View All <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>

              <div className="space-y-4">
                {(stats?.pending_requests || []).length === 0 ? (
                  <div className="text-center py-8 text-gray-400">No pending requests</div>
                ) : (
                  (stats?.pending_requests || []).map((req: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-gray-100 shadow-sm text-gray-500">
                          <ClipboardList className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{req.dietitian_name}</h4>
                          <p className="text-sm text-gray-500">
                            {req.dietitian_email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 rounded-lg text-xs font-bold mb-1 bg-orange-100 text-orange-600">
                          Pending
                        </span>
                        <p className="text-xs text-gray-400 font-medium flex items-center justify-end">
                          <Clock className="w-3 h-3 mr-1" /> {new Date(req.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* System Status / Quick Actions */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-8 border-gray-100 shadow-sm rounded-[2.5rem] bg-gray-900 text-white relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-6">System Status</h2>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                    <span className="font-medium flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      Server Uptime
                    </span>
                    <span className="font-bold text-emerald-400">99.98%</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                    <span className="font-medium flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-400" />
                      Dietitians
                    </span>
                    <span className="font-bold">{stats?.total_dietitians || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                    <span className="font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-400" />
                      Status
                    </span>
                    <span className="font-bold text-purple-200">Active</span>
                  </div>
                </div>

                <Button className="w-full bg-white text-black hover:bg-gray-100 font-bold rounded-xl h-12 shadow-lg">
                  System Settings
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}
