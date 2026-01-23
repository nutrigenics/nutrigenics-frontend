import * as React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

// Toast types
type ToastType = "default" | "success" | "error" | "warning" | "info"

interface Toast {
    id: string
    title?: string
    description?: string
    type?: ToastType
    duration?: number
    action?: {
        label: string
        onClick: () => void
    }
}

interface ToastContextType {
    toasts: Toast[]
    toast: (toast: Omit<Toast, "id">) => void
    dismiss: (id: string) => void
    dismissAll: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

// Toast Provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const toast = useCallback((newToast: Omit<Toast, "id">) => {
        const id = Math.random().toString(36).substring(2, 9)
        const duration = newToast.duration ?? 5000

        setToasts((prev) => [...prev, { ...newToast, id }])

        if (duration > 0) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id))
            }, duration)
        }
    }, [])

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    const dismissAll = useCallback(() => {
        setToasts([])
    }, [])

    return (
        <ToastContext.Provider value={{ toasts, toast, dismiss, dismissAll }}>
            {children}
            <ToastViewport />
        </ToastContext.Provider>
    )
}

// Hook to use toast
export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider")
    }
    return context
}

// Toast Viewport (container)
function ToastViewport() {
    const { toasts, dismiss } = useToast()

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
            ))}
        </div>
    )
}

// Individual Toast Item
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    const icons = {
        default: null,
        success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
        error: <AlertCircle className="h-5 w-5 text-red-500" />,
        warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
        info: <Info className="h-5 w-5 text-blue-500" />,
    }

    const borderColors = {
        default: "border-border",
        success: "border-emerald-200",
        error: "border-red-200",
        warning: "border-amber-200",
        info: "border-blue-200",
    }

    return (
        <div
            className={cn(
                "pointer-events-auto flex items-start gap-3 w-full rounded-lg border bg-background p-4 shadow-lg toast-enter",
                borderColors[toast.type || "default"]
            )}
        >
            {icons[toast.type || "default"]}
            <div className="flex-1 min-w-0">
                {toast.title && (
                    <p className="text-sm font-semibold text-foreground">{toast.title}</p>
                )}
                {toast.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">{toast.description}</p>
                )}
                {toast.action && (
                    <button
                        onClick={toast.action.onClick}
                        className="mt-2 text-sm font-medium text-primary hover:underline"
                    >
                        {toast.action.label}
                    </button>
                )}
            </div>
            <button
                onClick={onDismiss}
                className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    )
}

// Convenience function placeholder for external toast calls
export function toast(_options: Omit<Toast, "id">) {
    // This is a placeholder - actual implementation requires context
    console.warn("toast() called outside of ToastProvider. Use useToast() hook instead.")
}
