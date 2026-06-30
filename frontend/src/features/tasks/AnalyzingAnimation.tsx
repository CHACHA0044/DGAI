import { motion } from 'framer-motion';

export default function AnalyzingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-6">
      {/* Orbital ring animation */}
      <div className="relative w-24 h-24">
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-guardian-500/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />

        {/* Inner ring */}
        <motion.div
          className="absolute inset-3 rounded-full border-2 border-accent-cyan/20"
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />

        {/* Orbiting dot — outer */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-2.5 h-2.5 rounded-full bg-guardian-400 shadow-lg shadow-guardian-400/60"
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            style={{ originX: '50%', originY: '50%', translateX: '36px' }}
          />
        </div>

        {/* Orbiting dot — inner */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-2 h-2 rounded-full bg-accent-cyan shadow-lg shadow-cyan-400/60"
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{ originX: '50%', originY: '50%', translateX: '24px' }}
          />
        </div>

        {/* Core pulse */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-7 h-7 rounded-full bg-gradient-to-br from-guardian-500 to-guardian-700"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Inner glow */}
          <motion.div
            className="absolute w-7 h-7 rounded-full bg-guardian-500/40 blur-md"
            animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>

      {/* Text */}
      <div className="text-center">
        <motion.p
          className="text-sm font-semibold text-guardian-400"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          Gemini AI is analyzing your task…
        </motion.p>
        <p className="text-xs text-text-muted mt-1">
          Generating priority · subtasks · execution plan
        </p>
      </div>

      {/* Scanning dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-guardian-500/60"
            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
}
