import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ModernAuthBackground } from '@/components/auth/ModernAuthBackground';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthFooter } from '@/components/auth/AuthFooter';

export default function VerifyEmailPage() {
    return (
        <div className="relative min-h-screen w-full flex flex-col overflow-hidden">
            <ModernAuthBackground />
            <AuthHeader />

            <div className="w-full h-full flex items-center justify-center sm:p-6 p-4">
                <AuthCard
                    title="Verify your email"
                    subtitle="We've sent a verification link to your email address"
                    delay={0.2}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex justify-center mb-6"
                    >
                        <div className="h-16 w-16 bg-blue-100/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <CheckCircle className="h-8 w-8 text-blue-600" />
                        </div>
                    </motion.div>

                    <p className="text-center text-gray-600 mb-8">
                        Please check your inbox and click the link to verify your account.
                    </p>

                    <div className="space-y-4">
                        <Button
                            asChild
                            className="w-full h-14 text-base bg-gray-900 text-white hover:bg-gray-800 font-medium rounded-xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.2)] hover:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.25)] transition-all duration-300 group cursor-pointer"
                        >
                            <Link to="/login">Back to Sign In</Link>
                        </Button>
                        <p className="text-center text-sm text-gray-500">
                            Didn't receive the email? <button className="text-primary hover:underline font-medium">Resend verification</button>
                        </p>
                    </div>
                </AuthCard>
            </div>

            <AuthFooter />
        </div>
    );
}
