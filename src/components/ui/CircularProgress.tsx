interface CircularProgressProps {
    value: number;
    max: number;
    size?: 'sm' | 'md' | 'lg';
    color?: string; // Can pass a specific color class like "text-blue-500" or hex if needed, but defaults should be semantic
    label?: string;
    showPercentage?: boolean;
    showTotal?: boolean; // New prop to show "Value / Max" format
    showText?: boolean; // New prop to toggle built-in text
    children?: React.ReactNode; // New prop for center icon
}

export function CircularProgress({
    value,
    max,
    size = 'md',
    color = 'text-primary', // Expecting a Tailwind text color class which will be applied to stroke via CurrentColor
    label,
    showPercentage = true,
    showTotal = false,
    showText = true,
    children
}: CircularProgressProps) {
    const safeValue = isNaN(value) ? 0 : value;
    const safeMax = max || 1; // Prevent divide by zero
    const percentage = Math.min(100, Math.max(0, (safeValue / safeMax) * 100));

    const sizes = {
        sm: { width: 80, stroke: 6, fontSize: 'text-sm' },
        md: { width: 120, stroke: 8, fontSize: 'text-lg' },
        lg: { width: 160, stroke: 10, fontSize: 'text-2xl' },
    };

    const { width, stroke, fontSize } = sizes[size] || sizes.md;
    const radius = (width - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative" style={{ width, height: width }}>
                <svg width={width} height={width} className="transform -rotate-90">
                    {/* Background circle */}
                    <circle
                        cx={width / 2}
                        cy={width / 2}
                        r={radius}
                        className="stroke-muted"
                        strokeWidth={stroke}
                        fill="none"
                    />
                    {/* Progress circle */}
                    <circle
                        cx={width / 2}
                        cy={width / 2}
                        r={radius}
                        className={`transition-all duration-500 ease-out ${color} stroke-current`}
                        strokeWidth={stroke}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                    />
                </svg>

                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    {children && <div className="mb-0">{children}</div>}

                    {showText && (
                        showTotal ? (
                            <div className="flex flex-col items-center leading-none">
                                <span className={`font-bold text-foreground ${sizes[size].fontSize}`}>
                                    {Math.round(safeValue)}
                                </span>
                                <span className="text-sm text-muted-foreground font-medium mt-0.5">
                                    / {max}
                                </span>
                            </div>
                        ) : (
                            <span className={`font-bold text-foreground ${fontSize}`}>
                                {showPercentage ? `${Math.round(percentage)}%` : Math.round(safeValue)}
                            </span>
                        )
                    )}
                </div>
            </div>

            {label && (
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
            )}
        </div>
    );
}
