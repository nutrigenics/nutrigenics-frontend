import { MainLayout } from '@/layouts/MainLayout';
import { Utensils, ChefHat, Plus, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function DietitianMealPlansPage() {
    return (
        <MainLayout>
            {/* Hero Header */}
            <div className="w-full mb-8 p-8 md:p-12 bg-white rounded-[2.5rem] relative overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-gray-100 text-center">
                <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 bg-gray-50 rounded-2xl mb-6 shadow-sm"
                    >
                        <Utensils className="w-10 h-10 text-gray-900" />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black text-gray-900 mb-4 tracking-tight"
                    >
                        Meal <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600">Plans</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-gray-500 mb-8"
                    >
                        Create and manage personalized nutrition plans for your patients.
                    </motion.p>
                </div>

                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-orange-500/10 to-transparent rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl opacity-60 translate-y-1/2 -translate-x-1/2" />
            </div>

            <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {[
                        { icon: ChefHat, title: "Recipe Library", desc: "Access a vast database of healthy recipes." },
                        { icon: Calendar, title: "Weekly Scheduling", desc: "Plan meals for the entire week with ease." },
                        { icon: Utensils, title: "Custom Plans", desc: "Tailor macro and micronutrients to patient needs." },
                        { icon: Plus, title: "Templates", desc: "Save time with reusable meal plan templates." }
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + (i * 0.1) }}
                            className="p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex items-start gap-4"
                        >
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <feature.icon className="w-6 h-6 text-gray-900" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 mb-1">{feature.title}</h3>
                                <p className="text-sm text-gray-500">{feature.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="text-center p-8 bg-gray-900 rounded-[2.5rem] text-white relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                    <div className="relative z-10">
                        <h3 className="text-2xl font-bold mb-2">Meal Planning Suite</h3>
                        <p className="text-gray-400 mb-6">Advanced meal planning tools are currently being built.</p>
                        <Button className="bg-white text-black hover:bg-gray-100 font-bold rounded-xl px-8 h-12">
                            Notify Me <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </motion.div>
            </div>
        </MainLayout>
    );
}
