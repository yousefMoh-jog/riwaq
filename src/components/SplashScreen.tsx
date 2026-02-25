import { motion } from 'motion/react';

export function SplashScreen() {
  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-[#4B3F8F] z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col items-center">
        {/* Logo with premium animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            y: [0, -8, 0]
          }}
          transition={{
            scale: { duration: 0.9, ease: 'easeOut' },
            opacity: { duration: 0.9, ease: 'easeOut' },
            y: {
              repeat: Infinity,
              duration: 3,
              ease: 'easeInOut'
            }
          }}
        >
          <img
            src="/riwaq-logo.png"
            alt="رِواق"
            className="w-56 md:w-72 h-auto drop-shadow-[0_10px_25px_rgba(0,0,0,0.25)]"
          />
        </motion.div>

        {/* Text with delayed fade */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.8,
            duration: 0.8,
            ease: 'easeOut'
          }}
          className="text-white text-xl md:text-2xl font-semibold mt-8"
        >
          ابدأ رحلتك التعليمية
        </motion.p>
      </div>
    </motion.div>
  );
}
