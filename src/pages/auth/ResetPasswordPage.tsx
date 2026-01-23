import { Link } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ModernAuthBackground } from '@/components/auth/ModernAuthBackground';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthFooter } from '@/components/auth/AuthFooter';

export default function ResetPasswordPage() {
    return (
        <div className="relative min-h-screen w-full flex flex-col overflow-hidden">
            <ModernAuthBackground />
            <AuthHeader />

            <div className="w-full h-full flex-1  flex items-center justify-center sm:p-6 p-4">
                <Card className="w-full max-w-md p-8 rounded-[2.5rem] shadow-xl border-border bg-card/80 backdrop-blur-sm">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
                            <Lock className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Reset Password</h1>
                        <p className="text-muted-foreground">
                            This feature is currently disabled.
                        </p>
                    </div>

                    <div className="bg-amber-50  p-6 rounded-2xl mb-8 border border-amber-100 ">
                        <p className="text-sm text-amber-800  text-center leading-relaxed font-medium">
                            Password reset via link is not configured. Please contact support.
                        </p>
                    </div>

                    <Link to="/login">
                        <Button variant="outline" className="w-full h-12 rounded-xl border-input font-bold hover:bg-accent hover:text-accent-foreground transition-all">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Return to Sign In
                        </Button>
                    </Link>
                </Card>
            </div>

            <AuthFooter />
        </div>
    );
}
