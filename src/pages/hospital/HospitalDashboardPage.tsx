import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Users, ClipboardList, Clock, Loader2 } from 'lucide-react';
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
    { label: "Total Dietitians", value: stats?.total_dietitians || 0, icon: Users, colorKey: "blue" },
    { label: "Total Patients", value: stats?.total_patients || 0, icon: Users, colorKey: "purple" },
    { label: "Pending Requests", value: stats?.pending_requests_count || 0, icon: ClipboardList, colorKey: "orange" },
  ];

  return (
    <>
      {/* Page Header */}
      <div className="mb-6">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-gray-900"
        >
          {stats?.hospital?.name || 'Hospital'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">Overview</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm text-gray-500 mt-1"
        >
          Real-time insights and administrative controls.
        </motion.p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {stat.label.includes('Dietitians') || stat.label.includes('Patients') ? (
              <Link to="/hospital/dietitians">
                <StatCard
                  label={stat.label}
                  value={stat.value}
                  icon={stat.icon}
                  color={stat.colorKey as any}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                />
              </Link>
            ) : (
              <StatCard
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                color={stat.colorKey as any}
              />
            )}
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Requests */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-5 border-gray-100 shadow-sm rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Recent Requests</h2>
                  <p className="text-xs text-gray-500">Pending administrative actions</p>
                </div>
                <Link to="/hospital/requests" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  View All →
                </Link>
              </div>

              <div className="space-y-3">
                {(stats?.pending_requests || []).length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">No pending requests</div>
                ) : (
                  (stats?.pending_requests || []).slice(0, 5).map((req: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center border border-gray-100 text-gray-500">
                          <ClipboardList className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-gray-900">{req.dietitian_name}</h4>
                          <p className="text-xs text-gray-500">{req.dietitian_email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-600">
                          Pending
                        </span>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center justify-end">
                          <Clock className="w-2.5 h-2.5 mr-1" /> {new Date(req.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Quick Stats */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-5 border-gray-100 shadow-sm rounded-2xl bg-gray-900 text-white">
              <h2 className="text-lg font-bold mb-4">System Status</h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                  <span className="text-sm flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Status
                  </span>
                  <span className="font-medium text-green-400 text-sm">Active</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                  <span className="text-sm">Dietitians</span>
                  <span className="font-bold text-sm">{stats?.total_dietitians || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                  <span className="text-sm">Patients</span>
                  <span className="font-bold text-sm">{stats?.total_patients || 0}</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}
