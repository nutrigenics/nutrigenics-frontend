import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react';
import { ModernAuthBackground } from '@/components/auth/ModernAuthBackground';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthFooter } from '@/components/auth/AuthFooter';

const GUEST_CREDENTIALS = {
    email: 'user@testing.com',
    password: 'User123@testing'
};

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }
        setIsLoading(true);
        try {
            const isOnboarded = await login(email, password);
            if (isOnboarded) {
                navigate('/');
            } else {
                navigate('/onboarding');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid email or password');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const isOnboarded = await login(GUEST_CREDENTIALS.email, GUEST_CREDENTIALS.password);
            if (isOnboarded) {
                navigate('/');
            } else {
                navigate('/onboarding');
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Guest login failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const inputClasses = "h-14 bg-white/50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-logo focus:ring-4 focus:ring-logo/10 transition-all rounded-xl text-lg font-medium";

    return (
        <div className="relative min-h-screen w-full flex flex-col overflow-hidden">
            <ModernAuthBackground />

            <AuthHeader />

            <div className="w-full h-full flex items-center justify-center sm:p-6 p-4">
                <AuthCard
                    title="Welcome Back"
                    subtitle="Continue your journey to precision wellness"
                    delay={0.2}
                >
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6 overflow-hidden"
                            >
                                <Alert variant="destructive" className="bg-red-500/5 border-red-500/10 text-red-600 backdrop-blur-md">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                            <div className="relative group/field">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within/field:text-logo transition-colors" />
                                <Input
                                    type="email"
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`${inputClasses} pl-12`}
                                    required
                                />
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                            <div className="relative group/field">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within/field:text-logo transition-colors" />
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`${inputClasses} pl-12 pr-12`}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <div className="flex items-center justify-end mt-2">
                                <div className="text-sm">
                                    <Link to="/forgot-password" className="font-medium text-black/60 hover:text-primary/90">
                                        Forgot your password?
                                    </Link>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="pt-2">
                            <Button
                                type="submit"
                                className="w-full h-14 text-base bg-gray-900 text-white hover:bg-gray-800 font-medium rounded-xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.2)] hover:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.25)] transition-all duration-300 group cursor-pointer"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <LogIn className="w-5 h-5 mr-1" />
                                        Sign In to Account
                                    </span>
                                )}
                            </Button>
                        </motion.div>

                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                            <Button
                                variant="outline"
                                className="w-full h-14 text-base bg-black/[0.03] border-black/5 text-gray-700 font-medium shadow-[0_10px_30px_-10px_rgba(0,0,0,0.2)] hover:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.25)] transition-all duration-300 group hover:bg-black/[0.06] rounded-xl cursor-pointer"
                                type="button"
                                onClick={handleGuestLogin}
                                disabled={isLoading}
                            >
                                Continue as Guest
                            </Button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="relative w-full my-8"
                        >
                            <div className="relative flex items-center justify-center text-xs uppercase">
                                <span className="w-full border-t border-black/5"></span>
                                <span className="w-full whitespace-nowrap px-2 py-1 text-gray-400 font-medium tracking-widest">or continue with</span>
                                <span className="w-full border-t border-black/5"></span>
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="w-full grid grid-cols-1 gap-4">
                            <Button
                                variant="outline"
                                className="w-full h-14 text-base bg-black/[0.03] border-black/5 text-gray-700 font-medium shadow-[0_10px_30px_-10px_rgba(0,0,0,0.2)] hover:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.25)] transition-all duration-300 group hover:bg-black/[0.06] rounded-xl cursor-pointer"
                                type="button"
                                onClick={() => alert('Coming soon')}
                            >
                                <svg width="22px" height="22px" viewBox="-3 0 262 262" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" fill="#000000"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4"></path><path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853"></path><path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05"></path><path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335"></path></g></svg>
                                Continue with Google
                            </Button>
                            {/* <Button variant="outline" className="h-12 bg-white border-black/5 text-gray-700 hover:bg-gray-50 rounded-xl shadow-sm" type="button" disabled>
                                Apple
                            </Button> */}
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="text-center text-gray-500 mt-8"
                        >
                            Don't have an account?{' '}
                            <Link to="/signup" className="font-bold text-gray-900 hover:text-logo transition-colors link-underline">
                                Sign Up
                            </Link>
                        </motion.p>
                    </form>
                </AuthCard>
            </div>

            <AuthFooter />
        </div>
    );
}
