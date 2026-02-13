import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {

    Loader2,
    Eye,
    EyeOff,
    Check,
    User,
    Stethoscope,
    Building2,
    ArrowRight,
    Mail,
    Lock,
    ChevronLeft,
    UserPlus,
    CheckCircle
} from 'lucide-react';
import { ModernAuthBackground } from '@/components/auth/ModernAuthBackground';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthFooter } from '@/components/auth/AuthFooter';

type UserRole = 'patient' | 'dietitian' | 'hospital' | null;

interface PasswordValidation {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
}

export default function SignupPage() {
    const navigate = useNavigate();
    const { signup } = useAuth();

    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState<UserRole>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
    });

    const validateEmail = (email: string): boolean => {
        const regex = /^([a-z0-9_.+-])+@(([a-z0-9-])+\.)+([a-z0-9]{2,4})+$/i;
        return regex.test(email);
    };

    const validatePassword = (password: string): PasswordValidation => {
        return {
            length: password.length >= 8 && password.length <= 20,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*?_~]/.test(password),
        };
    };

    const isPasswordValid = (validation: PasswordValidation): boolean => {
        return Object.values(validation).every(v => v);
    };

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        setPasswordValidation(validatePassword(value));
        setPasswordError(null);
    };

    const handleEmailChange = (value: string) => {
        setEmail(value);
        if (value && !validateEmail(value)) {
            setEmailError('Please enter a valid email address');
        } else {
            setEmailError(null);
        }
    };

    const handleContinue = () => {
        setError(null);
        if (step === 1) {
            if (!email || !validateEmail(email)) {
                setEmailError('Valid email is required');
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (!isPasswordValid(passwordValidation)) {
                setPasswordError('Please meet all requirements');
                return;
            }
            if (password !== confirmPassword) {
                setPasswordError('Passwords do not match');
                return;
            }
            setStep(3);
        }
    };

    const handleSubmit = async () => {
        if (!selectedRole) {
            setError('Please select an account type');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await signup(email, password, selectedRole);
            navigate('/onboarding');
        } catch (err: any) {
            // Parse DRF serializer errors
            const errorData = err.response?.data;
            if (errorData) {
                if (typeof errorData === 'string') {
                    setError(errorData);
                } else if (errorData.message) {
                    setError(errorData.message);
                } else if (errorData.email) {
                    setError(Array.isArray(errorData.email) ? errorData.email[0] : errorData.email);
                } else if (errorData.password) {
                    setError(Array.isArray(errorData.password) ? errorData.password[0] : errorData.password);
                } else if (errorData.non_field_errors) {
                    setError(Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors[0] : errorData.non_field_errors);
                } else if (errorData.detail) {
                    setError(errorData.detail);
                } else {
                    // Try to extract first error from any field
                    const firstError = Object.values(errorData)[0];
                    setError(Array.isArray(firstError) ? firstError[0] : String(firstError));
                }
            } else {
                setError('Registration failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const roleOptions = [
        {
            role: 'patient' as UserRole,
            icon: User,
            title: 'Patient',
            description: 'Track nutrition & recipes',
            iconColor: 'text-purple-400',
        },
        {
            role: 'dietitian' as UserRole,
            icon: Stethoscope,
            title: 'Dietitian',
            description: 'Manage patients & care',
            iconColor: 'text-emerald-400',
        },
        {
            role: 'hospital' as UserRole,
            icon: Building2,
            title: 'Hospital',
            description: 'Oversee nutrition teams',
            iconColor: 'text-orange-400',
        },
    ];

    const inputClasses = "h-14 bg-white/50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all rounded-lg text-sm font-medium";

    const stepVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 }
    };

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-between overflow-hidden">
            <ModernAuthBackground />

            <AuthHeader />

            <div className="flex-1 w-full h-full flex-1  flex items-center justify-center sm:p-6 p-4">
                <AuthCard delay={0.2}>

                    {/* Progress Bar */}
                    <div className="w-full mx-auto mb-8 flex justify-between relative z-10">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex flex-col items-center gap-2">
                                <motion.div
                                    animate={{
                                        backgroundColor: s <= step ? 'hsl(var(--primary))' : 'rgba(206, 206, 206, 1)',
                                        scale: s === step ? 1.2 : 1
                                    }}
                                    className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(5,150,105,${s <= step ? '0.35' : '0'})]`}
                                />
                                <span className={`text-xs uppercase tracking-widest font-bold ${s <= step ? 'text-primary' : 'text-gray-400'}`}>Step 0{s}</span>
                            </div>
                        ))}
                        <div className="absolute top-[5.5px] left-0 w-full mx-auto h-px bg-black/5 -z-10" />
                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: (step - 1) / 2 }}
                            style={{ originX: 0 }}
                            className="absolute top-[5.5px] left-0 w-full h-px bg-primary -z-10 mx-4 transition-transform duration-500"
                        />
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
                            {step === 1 && "Get Started"}
                            {step === 2 && "Secure Account"}
                            {step === 3 && "Join as"}
                        </h2>
                        <p className="text-gray-600">
                            {step === 1 && "Enter your email address"}
                            {step === 2 && "Create a strong password"}
                            {step === 3 && "Select your professional role"}
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            variants={stepVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={{ duration: 0.3 }}
                        >
                            {step === 1 && (
                                <div className="space-y-6">
                                    <div className="relative group/field">
                                        <label htmlFor="signup-email" className="sr-only">Email Address</label>
                                        <Mail className={`absolute left-4 top-1/2 ${emailError ? '-translate-y-[22px]' : '-translate-y-1/2'}  w-5 h-5 text-gray-400 group-focus-within/field:text-primary transition-colors`} />
                                        <Input
                                            id="signup-email"
                                            type="email"
                                            placeholder="Email Address"
                                            value={email}
                                            onChange={(e) => handleEmailChange(e.target.value)}
                                            className={`${inputClasses} pl-12  ${emailError ? 'border-red-500/50' : ''}`}
                                        />
                                        {emailError && <p className="mt-2 text-xs text-red-600 ml-1 font-medium">{emailError}</p>}
                                    </div>
                                    <Button onClick={handleContinue} className="w-full h-14 bg-gray-900 text-white hover:bg-gray-800 text-base font-medium rounded-lg group shadow-premium hover:shadow-premium-lg transition-all">
                                        Continue <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-5">
                                    <div className="space-y-4">
                                        <div className="relative group/field">
                                            <label htmlFor="signup-password" className="sr-only">Create Secure Password</label>
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within/field:text-primary transition-colors" />
                                            <Input
                                                id="signup-password"
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Create Secure Password"
                                                value={password}
                                                onChange={(e) => handlePasswordChange(e.target.value)}
                                                className={`${inputClasses} pl-12 pr-12`}
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

                                        <div className="grid grid-cols-2 gap-2 bg-black/[0.02] p-4 rounded-lg border border-black/5">
                                            {[
                                                { key: 'length', label: '8-20 chars' },
                                                { key: 'uppercase', label: 'Uppercase' },
                                                { key: 'lowercase', label: 'Lowercase' },
                                                { key: 'number', label: 'Number' },
                                                { key: 'special', label: 'Special' }
                                            ].map((req) => (
                                                <div key={req.key} className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${passwordValidation[req.key as keyof PasswordValidation] ? 'bg-primary shadow-[0_0_6px_rgba(5,150,105,0.45)]' : 'bg-black/10'}`} />
                                                    <span className={`text-xs uppercase font-bold tracking-wider ${passwordValidation[req.key as keyof PasswordValidation] ? 'text-gray-900' : 'text-gray-400'}`}>{req.label}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="relative group/field">
                                            <label htmlFor="signup-confirm-password" className="sr-only">Confirm Password</label>
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within/field:text-primary transition-colors" />
                                            <Input
                                                id="signup-confirm-password"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                placeholder="Confirm Password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className={`${inputClasses} pl-12`}
                                            />
                                        </div>
                                    </div>

                                    {passwordError && <p className="text-xs text-red-600 text-center font-medium">{passwordError}</p>}

                                    <div className="flex gap-4">
                                        <Button variant="outline" onClick={() => setStep(1)} className="h-14 px-6 bg-black/[0.03] border-black/5 text-gray-700 hover:bg-black/[0.06] rounded-lg transition-all">
                                            <ChevronLeft className="w-5 h-5" />
                                        </Button>
                                        <Button onClick={handleContinue} className="flex-1 h-14 bg-gray-900 text-white hover:bg-gray-800 font-bold rounded-lg shadow-premium transition-all" disabled={!isPasswordValid(passwordValidation) || password !== confirmPassword}>
                                            Continue <ArrowRight className="ml-2 w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-4">
                                    <div className="grid gap-3">
                                        {roleOptions.map((opt) => (
                                            <button
                                                key={opt.role}
                                                onClick={() => setSelectedRole(opt.role)}
                                                className={`relative w-full p-4 rounded-lg border-2 transition-all duration-300 text-left overflow-hidden group ${selectedRole === opt.role
                                                    ? 'border-primary bg-primary/5 shadow-premium'
                                                    : 'border-black/5 bg-black/[0.02] hover:bg-black/[0.04]'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4 relative z-10">
                                                    <div className={`p-3 rounded-lg bg-white shadow-sm ${opt.iconColor}`}>
                                                        <opt.icon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 text-sm">{opt.title}</h4>
                                                        <p className="text-xs text-gray-500 uppercase tracking-widest">{opt.description}</p>
                                                    </div>
                                                    {selectedRole === opt.role && (
                                                        <motion.div layoutId="check" className="ml-auto w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(5,150,105,0.45)]">
                                                            <Check className="w-4 h-4 text-white font-bold" />
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    <AnimatePresence>
                                        {error && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                                <Alert variant="destructive" className="bg-red-500/5 border-red-500/10 text-red-600 py-4 backdrop-blur-md">
                                                    <AlertDescription>{error}</AlertDescription>
                                                </Alert>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="flex gap-4 pt-4">
                                        <Button variant="outline" onClick={() => setStep(2)} className="h-14 px-6 bg-black/[0.03] border-black/5 text-gray-700 rounded-lg" disabled={isLoading}>
                                            <ChevronLeft className="w-5 h-5" />
                                        </Button>
                                        <Button onClick={handleSubmit} className="flex-1 h-14 bg-gray-900 text-white hover:bg-gray-800 font-bold rounded-lg shadow-premium transition-all group" disabled={!selectedRole || isLoading}>
                                            {isLoading ? (
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    <UserPlus className="w-5 h-5" />
                                                    Complete Account
                                                    <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform text-primary" />
                                                </span>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    <div className="mt-8 pt-8 border-t border-black/5 text-center">
                        <p className="text-gray-500 text-sm font-medium">
                            Already have an account?{' '}
                            <Link to="/login" className="font-bold text-gray-900 hover:text-primary transition-colors link-underline">Log In</Link>
                        </p>
                    </div>
                </AuthCard>
            </div>


            <AuthFooter />
        </div>
    );
}
