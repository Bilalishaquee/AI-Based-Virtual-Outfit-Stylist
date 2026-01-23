import { motion } from 'framer-motion';
import { Sparkles, Shirt } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Show content after a brief delay
    const timer = setTimeout(() => setShowContent(true), 300);
    
    // Auto-navigate after 2.5 seconds
    const navigateTimer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => {
      clearTimeout(timer);
      clearTimeout(navigateTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-brown-50 via-peach-50 to-orange-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: showContent ? 1 : 0, scale: showContent ? 1 : 0.8 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        {/* Logo/Icon Animation */}
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className="mb-8 flex justify-center"
        >
          <div className="relative">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: 'reverse'
              }}
              className="bg-gradient-to-br from-orange-500 to-brown-600 p-6 rounded-3xl shadow-2xl"
            >
              <Shirt className="w-16 h-16 text-white" />
            </motion.div>
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity
              }}
              className="absolute inset-0 bg-orange-400 rounded-3xl blur-xl -z-10"
            />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: showContent ? 0 : 20, opacity: showContent ? 1 : 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-5xl font-bold text-gray-800 mb-4"
        >
          AI Stylist
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: showContent ? 0 : 20, opacity: showContent ? 1 : 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-xl text-gray-600 mb-8"
        >
          Your Personal Outfit Assistant
        </motion.p>

        {/* Loading Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showContent ? 1 : 0 }}
          transition={{ delay: 0.7 }}
          className="flex justify-center items-center gap-2"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            className="w-3 h-3 bg-orange-500 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            className="w-3 h-3 bg-brown-500 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
            className="w-3 h-3 bg-orange-500 rounded-full"
          />
        </motion.div>

        {/* Sparkle Effects */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              x: [0, Math.random() * 200 - 100],
              y: [0, Math.random() * 200 - 100],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3
            }}
            className="absolute"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
            }}
          >
            <Sparkles className="w-4 h-4 text-orange-400" />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
