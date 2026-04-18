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

export default function LoginPage() {
    const navigate = useNavigate();
    const { login, guestLogin } = useAuth();
    const enableGuestLogin = import.meta.env.VITE_ENABLE_GUEST_LOGIN === 'true';
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
            setError(
                err.response?.data?.error ||
                err.response?.data?.detail ||
                err.response?.data?.message ||
                'Invalid email or password'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const isOnboarded = await guestLogin();
            navigate(isOnboarded ? '/' : '/onboarding');
        } catch (err: any) {
            setError(
                err.response?.data?.error ||
                err.response?.data?.detail ||
                'Guest login failed. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const inputClasses = "h-14 bg-white/50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all rounded-lg text-lg font-medium shadow-sm";

    return (
        <div className="relative min-h-screen w-full flex flex-col overflow-hidden">
            <ModernAuthBackground />

            <AuthHeader />

            <div className="w-full h-full flex-1 flex items-center justify-center sm:p-6 p-4">
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
                                <label htmlFor="login-email" className="sr-only">Email Address</label>
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within/field:text-primary transition-colors" />
                                <Input
                                    id="login-email"
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
                                <label htmlFor="login-password" className="sr-only">Password</label>
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within/field:text-primary transition-colors" />
                                <Input
                                    id="login-password"
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
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                                className="w-full h-14 text-base bg-gray-900 text-white hover:bg-gray-800 font-medium rounded-lg shadow-premium hover:shadow-premium-lg transition-all duration-300 group cursor-pointer"
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

                        {enableGuestLogin && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                className="rounded-2xl border border-black/5 bg-black/[0.02] p-4"
                            >
                                <p className="text-sm text-gray-500 mb-3">
                                    Demo access is enabled for this environment.
                                </p>
                                <Button
                                    variant="outline"
                                    className="w-full h-12 bg-white border-black/5 text-gray-700 font-medium hover:bg-gray-50 rounded-xl shadow-sm"
                                    type="button"
                                    onClick={handleGuestLogin}
                                    disabled={isLoading}
                                >
                                    Continue as Guest
                                </Button>
                            </motion.div>
                        )}

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: enableGuestLogin ? 0.8 : 0.7 }}
                            className="text-center text-gray-500 mt-8"
                        >
                            Don't have an account?{' '}
                            <Link to="/signup" className="font-bold text-gray-900 hover:text-primary transition-colors link-underline">
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
