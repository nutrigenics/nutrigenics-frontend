import { type ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: number | string;
    icon: ReactNode;
    gradient: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    unit?: string;
    iconBg?: string;
}

export function StatCard({
    title,
    value,
    icon,
    gradient,
    trend,
    trendValue,
    unit,
    iconBg = 'bg-white/20'
}: StatCardProps) {
    const getTrendIcon = () => {
        switch (trend) {
            case 'up':
                return <TrendingUp className="w-4 h-4" />;
            case 'down':
                return <TrendingDown className="w-4 h-4" />;
            default:
                return <Minus className="w-4 h-4" />;
        }
    };

    const getTrendColor = () => {
        switch (trend) {
            case 'up':
                return 'text-emerald-600 bg-emerald-50';
            case 'down':
                return 'text-red-600 bg-red-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <Card className={`p-6 border-0 shadow-lg bg-gradient-to-br ${gradient} text-white transition-all duration-300 hover:scale-105 hover:shadow-xl`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <p className="text-white/80 text-sm font-medium mb-2">{title}</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold">
                            {typeof value === 'number' ? value.toLocaleString() : value}
                        </span>
                        {unit && <span className="text-lg text-white/80">{unit}</span>}
                    </div>
                </div>
                <div className={`p-3 rounded-xl ${iconBg} backdrop-blur-sm`}>
                    <div className="w-6 h-6 text-white">
                        {icon}
                    </div>
                </div>
            </div>

            {trend && trendValue && (
                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getTrendColor()}`}>
                    {getTrendIcon()}
                    <span>{trendValue}</span>
                </div>
            )}
        </Card>
    );
}
