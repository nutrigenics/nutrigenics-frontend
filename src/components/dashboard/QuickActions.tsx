import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Calendar, Sparkles, ChefHat, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface QuickAction {
    title: string;
    description: string;
    href: string;
    icon: React.ElementType;
    gradient: string;
    iconBg: string;
    iconColor: string;
}

const actions: QuickAction[] = [
    {
        title: 'Log a Meal',
        description: 'Track what you ate today',
        href: '/plan',
        icon: Calendar,
        gradient: 'from-emerald-500/10 to-teal-500/10',
        iconBg: 'bg-emerald-100 ',
        iconColor: 'text-emerald-600 ',
    },
    {
        title: 'Chat with AI',
        description: 'Get personalized advice',
        href: '/chat',
        icon: Sparkles,
        gradient: 'from-violet-500/10 to-purple-500/10',
        iconBg: 'bg-violet-100 ',
        iconColor: 'text-violet-600 ',
    },
    {
        title: 'Browse Recipes',
        description: 'Find your next meal',
        href: '/recipes',
        icon: ChefHat,
        gradient: 'from-amber-500/10 to-orange-500/10',
        iconBg: 'bg-amber-100 ',
        iconColor: 'text-amber-600 ',
    },
];

export function QuickActions() {
    return (
        <div className="mb-10">
            <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {actions.map((action, index) => (
                    <motion.div
                        key={action.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Link to={action.href}>
                            <Card className={cn(
                                "relative overflow-hidden p-5 cursor-pointer group rounded-2xl",
                                "border border-slate-100 bg-white shadow-soft-sm",
                                "transition-all duration-300 hover:shadow-soft hover:-translate-y-1"
                            )}>
                                {/* Gradient Background - Very Subtle */}
                                <div className={cn(
                                    "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                                    action.gradient
                                )} />

                                <div className="relative flex items-center gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                                        action.iconBg
                                    )}>
                                        <action.icon className={cn("w-6 h-6", action.iconColor)} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                                            {action.title}
                                        </h3>
                                        <p className="text-sm text-slate-500 font-medium">
                                            {action.description}
                                        </p>
                                    </div>

                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

export default QuickActions;
