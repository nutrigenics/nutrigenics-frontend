import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import logo from '@/assets/logo.svg';

export function AuthHeader() {
    return (
        <header className="w-full p-3 lg:p-4 z-50 flex justify-between items-center pointer-events-none">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="flex items-center gap-3 pointer-events-auto"
            >
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="p-2 bg-white/10 backdrop-blur-xl rounded-xl border border-white/40 shadow-sm group-hover:scale-105 transition-transform duration-300">
                        <img src={logo} alt="Nutrigenics" className="w-10 h-10" />
                    </div>
                    <span className="text-xl font-bold text-gray-900 tracking-tight">
                        Nutrigenics
                    </span>
                </Link>
            </motion.div>
        </header>
    );
}
