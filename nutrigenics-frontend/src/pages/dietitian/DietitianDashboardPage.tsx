import { Card } from '@/components/ui/card';
import { Users, MessageSquare, TrendingUp, ChevronRight, Loader2, ArrowRight, User, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { dietitianDashboardService } from '@/services/dietitian-dashboard.service';
import type { DashboardStats } from '@/services/dietitian-dashboard.service';
import { Link } from 'react-router-dom';

export default function DietitianDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [greeting, setGreeting] = useState('Good Morning');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

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
    { label: "Total Patients", value: stats?.total_patients || 0, change: "Active", icon: Users, color: "text-blue-500", bg: "bg-blue-50", link: "/dietitian/patients" },
    { label: "Pending Requests", value: stats?.pending_requests_count || 0, change: "Needs Action", icon: MessageSquare, color: "text-purple-500", bg: "bg-purple-50", link: "/dietitian/patients" },
    { label: "Unread Messages", value: stats?.unread_messages_count || 0, change: "Inbox", icon: Mail, color: "text-orange-500", bg: "bg-orange-50", link: "/dietitian/chats" },
    { label: "Status", value: stats?.is_approved ? "Active" : "Pending", change: "Account", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50", link: "/dietitian/profile" },
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
            Dietitian Dashboard
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-foreground mb-2 tracking-tight"
          >
            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-logo to-emerald-600">
              Dr. {stats?.dietitian?.fname || 'Dietitian'}
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            Manage your patients and track their progress.
          </motion.p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Patients */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-8 border-border shadow-sm rounded-3xl bg-card">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Recent Patients</h2>
                  <p className="text-muted-foreground">Your connected patients</p>
                </div>
                <Link to="/dietitian/patients">
                  <Button variant="ghost" className="text-primary hover:bg-primary/10 hover:text-primary font-bold">
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>

              <div className="space-y-4">
                {stats?.patients?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No patients connected yet</p>
                    <p className="text-sm">Start by adding a patient using their Patient ID</p>
                  </div>
                ) : (
                  stats?.patients?.slice(0, 5).map((patient: any, index: number) => (
                    <Link key={index} to={`/dietitian/chats/${patient.id}`}>
                      <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-colors cursor-pointer group">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
                          {patient.user?.first_name?.[0] || patient.fname?.[0] || 'P'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                            {patient.user?.first_name || patient.fname} {patient.user?.last_name || patient.lname}
                          </h4>
                          <p className="text-muted-foreground text-sm truncate">
                            {patient.user?.email || patient.email || `Patient ID: ${patient.patient_id || patient.id}`}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-8 border-border shadow-sm rounded-3xl bg-card">
              <h2 className="text-xl font-bold text-foreground mb-6">Quick Actions</h2>
              <div className="space-y-4">
                <Link to="/dietitian/patients" className="block">
                  <div className="p-4 rounded-2xl border border-border hover:border-blue-200 hover:bg-blue-50/50 transition-all group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-foreground group-hover:text-blue-600 transition-colors">My Patients</p>
                        <p className="text-xs text-muted-foreground">View all patients</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-blue-500 transition-all translate-x-0 group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
                <Link to="/dietitian/chats" className="block">
                  <div className="p-4 rounded-2xl border border-border hover:border-orange-200 hover:bg-orange-50/50 transition-all group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-orange-100 text-orange-600">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-foreground group-hover:text-orange-600 transition-colors">Messages</p>
                        <p className="text-xs text-muted-foreground">Chat with patients</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-orange-500 transition-all translate-x-0 group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
                <Link to="/dietitian/profile" className="block">
                  <div className="p-4 rounded-2xl border border-border hover:border-gray-300 hover:bg-muted/50 transition-all group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-muted text-foreground">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-foreground">My Profile</p>
                        <p className="text-xs text-muted-foreground">Update settings</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-all translate-x-0 group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}
