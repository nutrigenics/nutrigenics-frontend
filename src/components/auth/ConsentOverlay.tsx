import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Check, Lock, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

export const ConsentOverlay = () => {
    const { user, profile, acceptConsent } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Only show for patients who haven't accepted consent
    if (!user || user.role !== 'patient') return null;
    if (!profile || (profile as any).consent_accepted) return null;

    const handleAccept = async () => {
        setIsSubmitting(true);
        try {
            await acceptConsent();
        } catch (error) {
            console.error('Failed to accept consent:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6"
            >
                {/* Backdrop with extreme blur and dark tint */}
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[20px] shadow-[inset_0_0_100px_rgba(0,0,0,0.05)]" />

                <motion.div
                    initial={{ scale: 0.9, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300, delay: 0.1 }}
                    className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.12)] border border-gray-100/50 overflow-hidden"
                >
                    {/* Top accent bar */}
                    <div className="h-2 w-full bg-gradient-to-r from-teal-400 via-emerald-500 to-teal-400" />

                    <div className="p-8 md:p-12">
                        <div className="flex flex-col items-center text-center space-y-6">
                            {/* Animated Icon Container */}
                            <div className="relative">
                                <div className="absolute inset-0 bg-teal-500/10 blur-2xl rounded-full scale-150" />
                                <div className="relative h-20 w-20 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                                    <Shield className="w-10 h-10 text-white" strokeWidth={1.5} />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                                    Digital Health Consent
                                </h2>
                                <p className="text-lg text-gray-500 font-medium max-w-md mx-auto">
                                    To provide personalized insights and clinical-grade health tracking, we need your consent to process your data.
                                </p>
                            </div>

                            {/* Terms Content Container */}
                            <div className="w-full bg-gray-50/50 rounded-2xl border border-gray-100 p-6 text-left space-y-4 max-h-[30vh] overflow-y-auto custom-scrollbar">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1 h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-3 h-3 text-emerald-600" />
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        <span className="font-semibold text-gray-900">Personalized Analytics:</span> We process your meal logs and biometrics to generate nutrition insights and health trends.
                                    </p>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="mt-1 h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-3 h-3 text-emerald-600" />
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        <span className="font-semibold text-gray-900">Clinical Compliance:</span> Our platform adheres to strict DOH and HIPAA guidelines for Protected Health Information (PHI).
                                    </p>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="mt-1 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <Lock className="w-3 h-3 text-blue-600" />
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        <span className="font-semibold text-gray-900">Secure Storage:</span> Your data is encrypted and only accessible to you and your authorized healthcare providers.
                                    </p>
                                </div>

                                <p className="text-xs text-gray-400 pt-4 leading-relaxed border-t border-gray-100">
                                    By clicking "I Accept & Continue", you acknowledge that you have read and agree to our Digital Health Usage Terms and Privacy Policy regarding the processing of your health information.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="w-full pt-4 flex flex-col gap-4">
                                <Button
                                    onClick={handleAccept}
                                    disabled={isSubmitting}
                                    className="w-full h-16 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-lg font-semibold rounded-2xl shadow-xl shadow-teal-500/20 transition-all duration-300 active:scale-[0.98]"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        "I Accept & Continue"
                                    )}
                                </Button>

                                <div className="flex items-center justify-center gap-6">
                                    <a href="/privacy" className="text-sm font-medium text-gray-400 hover:text-teal-600 flex items-center gap-1 transition-colors">
                                        Privacy Policy
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                    <div className="w-1 h-1 rounded-full bg-gray-200" />
                                    <a href="/terms" className="text-sm font-medium text-gray-400 hover:text-teal-600 flex items-center gap-1 transition-colors">
                                        Clinical Terms
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Background Decorative Blur */}
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-500/5 blur-[80px] rounded-full pointer-events-none" />
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none" />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
