import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, KeyRound, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ModernAuthBackground } from '@/components/auth/ModernAuthBackground';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthFooter } from '@/components/auth/AuthFooter';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';

type Step = 'EMAIL' | 'OTP';

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('EMAIL');
    const [isLoading, setIsLoading] = useState(false);

    // Form Data
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        try {
            setIsLoading(true);
            await authService.requestPasswordReset(email);
            // Always move to next step for security (user enumeration protection)
            // unless strict error handling occurs
            setStep('OTP');
            toast.success('If an account exists, an OTP has been sent via email.');
        } catch (error: any) {
            // Only show specific error if it's rate limiting
            if (error.response?.status === 429) {
                toast.error('Please wait a minute before requesting another OTP.');
            } else {
                // Fallback for generic errors
                toast.error('Failed to send OTP. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (otp.length !== 6) {
            toast.error('Please enter the complete 6-digit OTP.');
            return;
        }

        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match.');
            return;
        }

        try {
            setIsLoading(true);
            await authService.confirmPasswordReset({
                email,
                otp,
                new_password: newPassword
            });

            toast.success('Password reset successfully! Please login with your new password.');
            navigate('/login');
        } catch (error: any) {
            const msg = error.response?.data?.error || 'Failed to reset password. Please check your OTP and try again.';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full flex flex-col overflow-hidden">
            <ModernAuthBackground />
            <AuthHeader />

            <div className="w-full h-full flex items-center justify-center sm:p-6 p-4 flex-1">
                <Card className="w-full max-w-md p-8 rounded-[2.5rem] shadow-xl border-border bg-card/80 backdrop-blur-sm relative z-10">

                    {/* Header Icon */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
                            {step === 'EMAIL' ? <Mail className="w-8 h-8" /> : <KeyRound className="w-8 h-8" />}
                        </div>
                        <h1 className="text-2xl font-bold text-foreground mb-2">
                            {step === 'EMAIL' ? 'Forgot Password?' : 'Enter OTP'}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {step === 'EMAIL'
                                ? 'Enter your email to receive a password reset code.'
                                : `We sent a 6-digit code to ${email}`}
                        </p>
                    </div>

                    {step === 'EMAIL' ? (
                        <form onSubmit={handleRequestOTP} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="ml-1 font-bold text-foreground/80">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        className="pl-11 h-12 rounded-xl bg-background/50 border-input/60 focus:bg-background transition-all"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 rounded-xl font-bold text-md shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Sending OTP...
                                    </>
                                ) : (
                                    'Send Reset Code'
                                )}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            {/* OTP Input */}
                            <div className="space-y-2 flex flex-col items-center">
                                <Label className="text-foreground/80 mb-2">One-Time Password</Label>
                                <InputOTP
                                    maxLength={6}
                                    value={otp}
                                    onChange={(value) => setOtp(value)}
                                    disabled={isLoading}
                                >
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0} className="w-10 h-12 text-lg rounded-l-xl border-y border-l border-r-0" />
                                        <InputOTPSlot index={1} className="w-10 h-12 text-lg border-y border-l border-r-0" />
                                        <InputOTPSlot index={2} className="w-10 h-12 text-lg border-y border-l border-r-0" />
                                        <InputOTPSlot index={3} className="w-10 h-12 text-lg border-y border-l border-r-0" />
                                        <InputOTPSlot index={4} className="w-10 h-12 text-lg border-y border-l border-r-0" />
                                        <InputOTPSlot index={5} className="w-10 h-12 text-lg rounded-r-xl border-y border-l border-r" />
                                    </InputOTPGroup>
                                </InputOTP>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Did not receive code? <button type="button" onClick={() => setStep('EMAIL')} className="text-primary font-bold hover:underline">Resend</button>
                                </p>
                            </div>

                            {/* New Password Inputs */}
                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">New Password</Label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        placeholder="Minimum 8 characters"
                                        className="h-12 rounded-xl bg-background/50 border-input/60"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        disabled={isLoading}
                                        minLength={8}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Confirm Password</Label>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        placeholder="Re-enter new password"
                                        className="h-12 rounded-xl bg-background/50 border-input/60"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={isLoading}
                                        minLength={8}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 rounded-xl font-bold text-md shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all bg-emerald-600 hover:bg-emerald-700 text-white"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5 mr-2" />
                                        Reset Password
                                    </>
                                )}
                            </Button>
                        </form>
                    )}

                    <div className="mt-8 pt-6 border-t border-border">
                        <Link to="/login">
                            <Button variant="ghost" className="w-full h-10 rounded-xl font-bold text-muted-foreground hover:text-foreground transition-all">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Login
                            </Button>
                        </Link>
                    </div>
                </Card>
            </div>

            <AuthFooter />
        </div>
    );
}
