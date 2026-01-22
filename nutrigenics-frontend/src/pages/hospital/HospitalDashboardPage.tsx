import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ArrowRight, ClipboardList, Loader2, MapPin, Phone, Shield, Settings, User, ChevronRight } from 'lucide-react';
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

  const hospitalInfo = stats?.hospital;

  const statCards = [
    { label: "Total Dietitians", value: stats?.total_dietitians || 0, change: "Approved", icon: Users, color: "text-blue-500", bg: "bg-blue-50", link: "/hospital/dietitians" },
    { label: "Total Patients", value: stats?.total_patients || 0, change: "Managed", icon: User, color: "text-purple-500", bg: "bg-purple-50", link: "/hospital/dietitians" },
    { label: "Pending Requests", value: stats?.pending_requests_count || 0, change: "Needs Action", icon: ClipboardList, color: "text-orange-500", bg: "bg-orange-50", link: "/hospital/requests" },
  ];

  return (
    <>
      {/* Hero Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-muted-foreground font-bold uppercase tracking-wider text-xs mb-2"
          >
            Hospital Administration
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-foreground mb-2 tracking-tight"
          >
            Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-logo to-emerald-600">
              {hospitalInfo?.name || 'Hospital'}
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            Manage your team and monitor operations from your dashboard.
          </motion.p>
        </div>
      </div>

      {/* Hospital Info Card */}
      {hospitalInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="p-6 md:p-8 border-border shadow-sm rounded-3xl bg-card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-logo to-emerald-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-logo/20">
                  {hospitalInfo.name?.[0] || 'H'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{hospitalInfo.name}</h3>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                    {hospitalInfo.address && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" /> {hospitalInfo.address}
                      </span>
                    )}
                    {hospitalInfo.contact_number && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4" /> {hospitalInfo.contact_number}
                      </span>
                    )}
                    {hospitalInfo.license_number && (
                      <span className="flex items-center gap-1.5">
                        <Shield className="w-4 h-4" /> License: {hospitalInfo.license_number}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Link to="/hospital/profile">
                <Button variant="outline" className="rounded-xl h-11 px-5 font-bold">
                  <Settings className="w-4 h-4 mr-2" /> Edit Profile
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <Link to={stat.link}>
              <Card className="p-6 border-border shadow-sm hover:shadow-md transition-all duration-300 rounded-3xl bg-card cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${stat.bg}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-foreground mb-1">{stat.value}</h3>
                  <p className="text-muted-foreground font-medium text-sm">{stat.label}</p>
                  <span className="text-xs font-bold text-muted-foreground/70 bg-muted px-2 py-1 rounded-full mt-2 inline-block">{stat.change}</span>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-8 border-border shadow-sm rounded-3xl bg-card">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-foreground">Quick Actions</h3>
            <p className="text-muted-foreground text-sm">Navigate to common management areas</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/hospital/dietitians" className="block">
              <div className="p-5 rounded-2xl border border-border hover:border-blue-200 hover:bg-blue-50/50 transition-all group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-foreground group-hover:text-blue-600 transition-colors">Dietitians & Patients</p>
                    <p className="text-sm text-muted-foreground">Manage your team</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-blue-500 transition-all translate-x-0 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
            <Link to="/hospital/requests" className="block">
              <div className="p-5 rounded-2xl border border-border hover:border-orange-200 hover:bg-orange-50/50 transition-all group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-orange-100 text-orange-600">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-foreground group-hover:text-orange-600 transition-colors">Review Requests</p>
                    <p className="text-sm text-muted-foreground">Approve registrations</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-orange-500 transition-all translate-x-0 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
            <Link to="/hospital/profile" className="block">
              <div className="p-5 rounded-2xl border border-border hover:border-gray-300 hover:bg-muted/50 transition-all group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-muted text-foreground">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-foreground">Hospital Settings</p>
                    <p className="text-sm text-muted-foreground">Update profile</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-foreground transition-all translate-x-0 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </div>
        </Card>
      </motion.div>
    </>
  );
}
