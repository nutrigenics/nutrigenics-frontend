import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export interface AnalyticsNotice {
    id: string;
    tone: 'info' | 'warning' | 'success';
    title: string;
    description: string;
}

interface AnalyticsNoticeStackProps {
    notices: AnalyticsNotice[];
    className?: string;
}

const NOTICE_STYLES = {
    info: {
        container: 'border-blue-100 bg-blue-50 text-blue-950 [&>svg]:text-blue-600',
        icon: Info,
    },
    warning: {
        container: 'border-amber-100 bg-amber-50 text-amber-950 [&>svg]:text-amber-600',
        icon: AlertTriangle,
    },
    success: {
        container: 'border-emerald-100 bg-emerald-50 text-emerald-950 [&>svg]:text-emerald-600',
        icon: CheckCircle2,
    },
} as const;

export function AnalyticsNoticeStack({ notices, className }: AnalyticsNoticeStackProps) {
    const visibleNotices = notices.filter((notice) => notice.title && notice.description);

    if (!visibleNotices.length) {
        return null;
    }

    return (
        <div className={cn('space-y-3', className)}>
            {visibleNotices.map((notice) => {
                const style = NOTICE_STYLES[notice.tone];
                const Icon = style.icon;

                return (
                    <Alert key={notice.id} className={style.container}>
                        <Icon className="h-4 w-4" />
                        <div>
                            <AlertTitle>{notice.title}</AlertTitle>
                            <AlertDescription>{notice.description}</AlertDescription>
                        </div>
                    </Alert>
                );
            })}
        </div>
    );
}
