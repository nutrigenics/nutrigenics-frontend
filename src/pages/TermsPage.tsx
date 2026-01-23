import { Header } from '@/components/layout/Header';
import { AuthFooter } from '@/components/auth/AuthFooter';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-12">
                <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>

                    <div className="space-y-6 text-gray-600">
                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Acceptance of Terms</h2>
                            <p>
                                By accessing and using Nutrigenics ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Medical Disclaimer</h2>
                            <p>
                                The Service provides nutritional information and meal planning tools for educational and informational purposes only. It is not intended as medical advice. Always consult with a qualified healthcare professional before making changes to your diet, especially if you have a medical condition.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">3. User Accounts</h2>
                            <p>
                                You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Privacy</h2>
                            <p>
                                Your use of the Service is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices.
                            </p>
                        </section>

                        <section>
                            <p className="text-sm italic mt-8">
                                Last updated: December 29, 2025
                            </p>
                        </section>
                    </div>
                </div>
            </main>
            <AuthFooter />
        </div>
    );
}
