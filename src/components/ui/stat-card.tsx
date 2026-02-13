import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        label: string;
        direction?: 'up' | 'down' | 'neutral';
    };
    color?: 'blue' | 'purple' | 'orange' | 'emerald' | 'rose' | 'slate';
    className?: string;
    loading?: boolean;
}

const colorStyles = {
    blue: {
        text: 'text-blue-500',
        bg: 'bg-blue-50',
    },
    purple: {
        text: 'text-purple-500',
        bg: 'bg-purple-50',
    },
    orange: {
        text: 'text-orange-500',
        bg: 'bg-orange-50',
    },
    emerald: {
        text: 'text-emerald-500',
        bg: 'bg-emerald-50',
    },
    rose: {
        text: 'text-rose-500',
        bg: 'bg-rose-50',
    },
    slate: {
        text: 'text-slate-500',
        bg: 'bg-slate-50',
    },
};

export function StatCard({
    label,
    value,
    icon: Icon,
    trend,
    color = 'slate',
    className,
    loading = false,
}: StatCardProps) {
    const styles = colorStyles[color];

    if (loading) {
        return (
            <Card className={cn("h-[140px] animate-pulse bg-gray-50", className)} />
        );
    }

    return (
        <Card className={cn(
            "flex flex-row-reverse items-center justify-between p-6",
            "border-slate-100 shadow-soft hover:shadow-soft-lg transition-all duration-300 rounded-2xl bg-white",
            className
        )}>
            <div className={cn("p-3 rounded-xl", styles.bg)}>
                <Icon className={cn("w-6 h-6", styles.text)} />
            </div>
            <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-0.5">{value}</h3>
                <p className="text-slate-500 font-medium text-xs font-bold uppercase tracking-wider">{label}</p>
                {trend && (
                    <span className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full mt-2 inline-block",
                        "bg-gray-50 text-gray-500"
                    )}>
                        {trend.label}
                    </span>
                )}
            </div>
        </Card>
    );
}
