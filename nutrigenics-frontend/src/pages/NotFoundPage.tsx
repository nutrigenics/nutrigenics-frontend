import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ModernAuthBackground } from '@/components/auth/ModernAuthBackground';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">

      <ModernAuthBackground />

      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-rose-500/10 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="max-w-xl w-full text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="text-[12rem] font-black text-gray-900 leading-none tracking-tighter mix-blend-overlay opacity-10 select-none"
        >
          404
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Page not found</h1>
          <p className="text-lg text-gray-500 mb-8 max-w-md mx-auto">
            Sorry, the page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/">
              <Button className="h-14 px-8 rounded-2xl bg-gray-900 text-white font-bold hover:bg-gray-800 shadow-xl shadow-gray-900/10 w-full sm:w-auto">
                <Home className="w-5 h-5 mr-2" /> Back to Home
              </Button>
            </Link>
            <Button variant="outline" className="h-14 px-8 rounded-2xl border-gray-200 bg-white hover:bg-gray-50 font-bold w-full sm:w-auto" onClick={() => window.history.back()}>
              <ArrowLeft className="w-5 h-5 mr-2" /> Go Back
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
