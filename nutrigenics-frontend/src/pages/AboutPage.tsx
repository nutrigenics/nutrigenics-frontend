import { MainLayout } from '@/layouts/MainLayout';
import { motion } from 'framer-motion';
import { Heart, ShieldCheck, Users, Globe, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="w-full mb-16 p-8 md:p-20 bg-gray-900 text-white rounded-[2.5rem] relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center justify-center p-3 bg-white/10 rounded-2xl mb-6 backdrop-blur-sm"
          >
            <Heart className="w-8 h-8 text-rose-400" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black mb-6 leading-tight"
          >
            We are <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Nutrigenics</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-300 mb-8 font-light"
          >
            Pioneering personalized nutrition to help you live a longer, healthier, and happier life.
          </motion.p>
        </div>

        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-teal-500/20 to-transparent rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Mission Section */}
      <div className="max-w-6xl mx-auto mb-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Our Mission</h2>
          <h3 className="text-4xl font-black text-gray-900 mb-6">Revolutionizing Health Through Data</h3>
          <p className="text-lg text-gray-600 mb-6 leading-relaxed">
            We believe that health isn't one-size-fits-all. By combining advanced genetic insights with cutting-edge AI, we empower individuals to understand their unique biological needs and make informed lifestyle choices.
          </p>
          <div className="flex gap-4">
            {[
              { icon: ShieldCheck, text: "Scientific Rigor" },
              { icon: Users, text: "Patient-First" },
              { icon: Globe, text: "Global Accessibility" }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <item.icon className="w-5 h-5 text-gray-900" />
                </div>
                <span className="text-sm font-bold text-gray-600">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative h-[500px] bg-gray-100 rounded-[2.5rem] overflow-hidden shadow-lg border-4 border-white">
          {/* Placeholder for an image */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <Globe className="w-32 h-32 text-gray-400 opacity-20" />
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gray-50 rounded-[2.5rem] p-12 mb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "50k+", label: "Active Users" },
            { value: "1M+", label: "Meals Tracked" },
            { value: "98%", label: "Satisfaction" },
            { value: "24/7", label: "Expert Support" }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <h4 className="text-4xl md:text-5xl font-black text-gray-900 mb-2">{stat.value}</h4>
              <p className="text-gray-500 font-bold uppercase tracking-wide text-xs">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to start your journey?</h2>
        <p className="text-lg text-gray-500 mb-8">Join thousands of others taking control of their health today.</p>
        <Button className="bg-gray-900 text-white rounded-2xl h-14 px-8 text-lg font-bold hover:bg-gray-800 shadow-xl shadow-gray-900/10">
          Get Started Now <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </MainLayout>
  );
}
