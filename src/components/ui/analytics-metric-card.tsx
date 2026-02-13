import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface AnalyticsMetricCardProps {
    title: string;
    value?: ReactNode;
    subtitle?: ReactNode; // Replaces 'unit' for flexibility
    badge?: ReactNode;
    children?: ReactNode;
    className?: string;
    contentClassName?: string;
    headerClassName?: string;
    titleClassName?: string;
}

export function AnalyticsMetricCard({
    title,
    value,
    subtitle,
    badge,
    children,
    className,
    contentClassName,
    headerClassName,
    titleClassName,
}: AnalyticsMetricCardProps) {
    return (
        <Card className={cn(
            "relative overflow-hidden bg-white border-slate-200 shadow-sm hover:shadow-md transition-all h-full rounded-xl gap-0",
            className
        )}>

            {badge && (
                <div className="absolute top-3 right-3">
                    {badge}
                </div>
            )}

            <CardHeader className={cn("p-4 pb-3 mb-0", headerClassName)}>
                <CardTitle className={cn("text-xs font-bold uppercase", titleClassName)}>
                    {title}
                </CardTitle>
            </CardHeader>

            <CardContent className={cn("p-4", contentClassName)}>
                {(value || subtitle) && (
                    <div className="flex flex-col justify-center">
                        <div className="text-3xl font-black tracking-tight flex items-baseline gap-1">
                            {value}
                            {subtitle && <span className="text-lg font-medium text-muted-foreground">{subtitle}</span>}
                        </div>
                    </div>
                )}
                {children}
            </CardContent>
        </Card>
    );
}
