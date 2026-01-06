import { cn } from '@/lib/utils';

interface FilterChipProps {
    label: string;
    active: boolean;
    onToggle: () => void;
    color?: string;
    count?: number;
}

export function FilterChip({
    label,
    active,
    onToggle,
    color = 'black',
    count
}: FilterChipProps) {
    return (
        <button
            onClick={onToggle}
            className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border-2',
                active
                    ? `bg-${color} text-white border-${color} shadow-lg scale-105`
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
            )}
        >
            {label}
            {count !== undefined && count > 0 && (
                <span className={cn(
                    'ml-2 px-2 py-0.5 rounded-full text-xs',
                    active ? 'bg-white/20' : 'bg-gray-100'
                )}>
                    {count}
                </span>
            )}
        </button>
    );
}
