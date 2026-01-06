import * as React from "react"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: number
    max?: number
    variant?: "default" | "calories" | "protein" | "carbs" | "fat" | "fiber"
    size?: "sm" | "default" | "lg"
    showValue?: boolean
}

const progressVariants = {
    default: "bg-primary",
    calories: "bg-gradient-to-r from-amber-400 to-orange-500",
    protein: "bg-gradient-to-r from-rose-400 to-pink-500",
    carbs: "bg-gradient-to-r from-orange-400 to-amber-500",
    fat: "bg-gradient-to-r from-sky-400 to-blue-500",
    fiber: "bg-gradient-to-r from-emerald-400 to-teal-500",
}

const sizeVariants = {
    sm: "h-1.5",
    default: "h-2.5",
    lg: "h-4",
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
    ({ className, value = 0, max = 100, variant = "default", size = "default", showValue = false, ...props }, ref) => {
        const percentage = Math.min(100, Math.max(0, (value / max) * 100))

        return (
            <div className="relative w-full">
                <div
                    ref={ref}
                    className={cn(
                        "w-full overflow-hidden rounded-full bg-secondary",
                        sizeVariants[size],
                        className
                    )}
                    {...props}
                >
                    <div
                        className={cn(
                            "h-full transition-all duration-500 ease-out rounded-full",
                            progressVariants[variant]
                        )}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                {showValue && (
                    <span className="absolute right-0 -top-5 text-xs font-medium text-muted-foreground">
                        {Math.round(percentage)}%
                    </span>
                )}
            </div>
        )
    }
)
Progress.displayName = "Progress"

export { Progress }
