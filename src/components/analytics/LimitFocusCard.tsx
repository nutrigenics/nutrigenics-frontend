import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface LimitFocusMetric {
    name: string;
    value: number;
    limit: number;
    unit: string;
    direction?: 'max' | 'min';
}

interface LimitFocusCardProps {
    metrics: LimitFocusMetric[];
    title?: string;
    description?: string;
    emptyTitle?: string;
    emptyDescription?: string;
    className?: string;
}

const getStatus = (metric: LimitFocusMetric) => {
    const ratio = metric.limit > 0 ? metric.value / metric.limit : 0;

    if ((metric.direction ?? 'max') === 'min') {
        if (ratio >= 1) {
            return {
                label: 'On Target',
                barClassName: 'bg-emerald-500',
                textClassName: 'text-emerald-700',
                badgeClassName: 'bg-emerald-100',
            };
        }
        if (ratio >= 0.8) {
            return {
                label: 'Close',
                barClassName: 'bg-amber-500',
                textClassName: 'text-amber-700',
                badgeClassName: 'bg-amber-100',
            };
        }
        return {
            label: 'Low',
            barClassName: 'bg-rose-500',
            textClassName: 'text-rose-700',
            badgeClassName: 'bg-rose-100',
        };
    }

    if (ratio <= 0.8) {
        return {
            label: 'In Range',
            barClassName: 'bg-emerald-500',
            textClassName: 'text-emerald-700',
            badgeClassName: 'bg-emerald-100',
        };
    }
    if (ratio <= 1) {
        return {
            label: 'Close',
            barClassName: 'bg-amber-500',
            textClassName: 'text-amber-700',
            badgeClassName: 'bg-amber-100',
        };
    }
    return {
        label: 'High',
        barClassName: 'bg-rose-500',
        textClassName: 'text-rose-700',
        badgeClassName: 'bg-rose-100',
    };
};

export function LimitFocusCard({
    metrics,
    title = 'Limit Focus',
    description = 'Average per day compared with the most important targets and limits.',
    emptyTitle = 'No limit data available',
    emptyDescription = 'Once nutrition data is available for the selected range, the key limit metrics will appear here.',
    className,
}: LimitFocusCardProps) {
    const visibleMetrics = metrics.filter((metric) => metric.limit > 0);
    const hasData = visibleMetrics.some((metric) => metric.value > 0);

    return (
        <Card className={cn('shadow-sm transition-all duration-300 hover:shadow-md', className)}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                {hasData ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {visibleMetrics.map((metric) => {
                            const ratio = metric.limit > 0 ? (metric.value / metric.limit) * 100 : 0;
                            const status = getStatus(metric);

                            return (
                                <div key={metric.name} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">{metric.name}</p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {metric.value.toFixed(1)} {metric.unit} / {metric.limit} {metric.unit}
                                            </p>
                                        </div>
                                        <span
                                            className={cn(
                                                'rounded-full px-2.5 py-1 text-xs font-semibold',
                                                status.textClassName,
                                                status.badgeClassName
                                            )}
                                        >
                                            {status.label}
                                        </span>
                                    </div>
                                    <div className="mt-3">
                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <span>Average per day</span>
                                            <span>{ratio.toFixed(0)}% of {metric.direction === 'min' ? 'goal' : 'limit'}</span>
                                        </div>
                                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                                            <div
                                                className={cn('h-full rounded-full transition-all duration-500', status.barClassName)}
                                                style={{ width: `${Math.min(ratio, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center">
                        <div className="mb-4 rounded-full bg-slate-100 p-3 text-slate-500">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">{emptyTitle}</p>
                        <p className="mt-2 max-w-sm text-sm text-slate-500">{emptyDescription}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
