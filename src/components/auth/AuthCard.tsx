import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

interface AuthCardProps {
    children: ReactNode;
    title?: string;
    subtitle?: string;
    delay?: number;
}

export const AuthCard = ({ children, title, subtitle, delay = 0 }: AuthCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                duration: 0.8,
                delay,
                ease: [0.16, 1, 0.3, 1]
            }}
            className="w-full max-w-md h-full"
        >
            <div className="relative group">
                {/* Glow effect background */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-logo/10 to-emerald-500/10 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />

                <div className="relative bg-white/30 backdrop-blur-2xl border border-white/40 p-8 lg:p-10 rounded-2xl shadow-premium-lg overflow-hidden">
                    {/* Interior highlights */}
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

                    {(title || subtitle) && (
                        <div className="text-center mb-8">
                            {title && (
                                <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
                                    {title}
                                </h1>
                            )}
                            {subtitle && (
                                <p className="text-gray-600 font-medium">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    )}

                    {children}
                </div>
            </div>
        </motion.div>
    );
};
