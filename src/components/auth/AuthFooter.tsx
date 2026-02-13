import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function AuthFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full mt-auto py-8 sm:px-6 px-2 text-center relative z-10">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="flex flex-col items-center gap-4"
            >
                <div className="w-full flex items-center justify-center gap-3 sm:gap-6 text-sm font-medium text-gray-500">
                    <Link to="/privacy" className="hover:text-primary transition-colors link-underline">Privacy Policy</Link>
                    <div className="w-1 h-1 bg-gray-300 rounded-full" />
                    <Link to="/terms" className="hover:text-primary transition-colors link-underline">Terms of Service</Link>
                    <div className="w-1 h-1 bg-gray-300 rounded-full" />
                    <Link to="/contact" className="hover:text-primary transition-colors link-underline">Support</Link>
                </div>

                <p className="text-xs text-gray-400 font-medium tracking-wide">
                    © {currentYear} Nutrigenics.care. All rights reserved.
                </p>
            </motion.div>
        </footer>
    );
}
