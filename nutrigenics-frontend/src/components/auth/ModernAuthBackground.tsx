import { motion } from 'framer-motion';

export const ModernAuthBackground = () => {
    return (
        <div className="fixed inset-0 w-full h-full overflow-hidden bg-[#f8faf8] -z-10">
            {/* Base Image with Parallax and Scale */}
            <motion.div
                className="absolute inset-0 w-full h-full opacity-70"
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.7 }}
                transition={{ duration: 2, ease: "easeOut" }}
            >
                <img
                    src="/auth-bg-light.png"
                    alt="Nutritional background"
                    className="w-full h-full object-cover"
                />
                {/* Overlay Gradients */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/60 via-transparent to-white/30" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-[#f8faf8]" />
            </motion.div>

            {/* Floating Glow Orbs */}
            {[
                { color: 'bg-logo/10', size: 'w-[500px] h-[500px]', pos: 'top-[-10%] left-[-10%]', duration: 15 },
                { color: 'bg-emerald-200/20', size: 'w-[400px] h-[400px]', pos: 'bottom-[-5%] right-[0%]', duration: 20 },
                { color: 'bg-blue-100/20', size: 'w-[300px] h-[300px]', pos: 'top-[20%] right-[-5%]', duration: 18 },
            ].map((orb, i) => (
                <motion.div
                    key={i}
                    className={`absolute ${orb.pos} ${orb.size} ${orb.color} rounded-full blur-[100px] pointer-events-none`}
                    animate={{
                        x: [0, 30, -30, 0],
                        y: [0, -40, 40, 0],
                    }}
                    transition={{
                        duration: orb.duration,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            ))}

            {/* Particle Effects (Simplified) */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-gray-300/30 rounded-full"
                        initial={{
                            x: Math.random() * 100 + "%",
                            y: Math.random() * 100 + "%",
                            opacity: Math.random() * 0.5,
                        }}
                        animate={{
                            y: [null, "-20%"],
                            opacity: [0, 0.5, 0],
                        }}
                        transition={{
                            duration: Math.random() * 10 + 10,
                            repeat: Infinity,
                            ease: "linear",
                            delay: Math.random() * 10
                        }}
                    />
                ))}
            </div>
        </div>
    );
};
