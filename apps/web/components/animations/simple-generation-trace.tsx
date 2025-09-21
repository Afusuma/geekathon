'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAppStore } from '@/stores/app-store';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, Globe, Shield, FileText, Wifi, WifiOff } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

// Simple connection detection
const useSimpleConnectionCheck = () => {
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    const prefersReducedData = window.matchMedia('(prefers-reduced-data: reduce)').matches;
    setIsSlowConnection(prefersReducedData);
  }, []);

  return isSlowConnection;
};

export function SimpleGenerationTrace() {
  const { isGenerating, generationProgress, selectedMarkets } = useAppStore();
  const prefersReducedMotion = useReducedMotion();
  const isSlowConnection = useSimpleConnectionCheck();

  // Adaptive animation settings
  const animationConfig = useMemo(() => {
    if (prefersReducedMotion || isSlowConnection) {
      return {
        duration: 0.2,
        enableAnimations: false
      };
    }
    return {
      duration: 0.4,
      enableAnimations: true
    };
  }, [prefersReducedMotion, isSlowConnection]);

  const generationSteps = [
    { id: 'analyze', label: 'Analyzing Product Data', icon: FileText },
    { id: 'compliance', label: 'Checking Compliance Rules', icon: Shield },
    { id: 'translate', label: 'Translating Content', icon: Globe },
    { id: 'generate', label: 'Generating Labels', icon: CheckCircle },
  ];

  // Performance indicator
  const PerformanceIndicator = () => {
    if (prefersReducedMotion || isSlowConnection) {
      return (
        <div className="flex items-center gap-2 text-yellow-400 text-sm mb-4">
          {isSlowConnection ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
          <span>Optimized for better performance</span>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={animationConfig.enableAnimations ? { opacity: 0, y: 20 } : { opacity: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: animationConfig.duration }}
      className="max-w-4xl mx-auto"
    >
      <PerformanceIndicator />

      <div className="text-center mb-8">
        <motion.div
          initial={animationConfig.enableAnimations ? { scale: 0.9 } : { opacity: 0 }}
          animate={animationConfig.enableAnimations ? { scale: 1 } : { opacity: 1 }}
          transition={{ duration: animationConfig.duration, delay: 0.1 }}
          className="flex items-center justify-center gap-3 mb-4"
        >
          {animationConfig.enableAnimations ? (
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          ) : (
            <div className="h-8 w-8 bg-blue-500 rounded-full animate-pulse" />
          )}
          <h2 className="text-2xl font-bold text-white">Generating Smart Labels</h2>
        </motion.div>
        <p className="text-gray-400">
          Creating compliant labels for {selectedMarkets.length} market{selectedMarkets.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Enhanced Progress Bar */}
      <motion.div
        initial={animationConfig.enableAnimations ? { opacity: 0 } : {}}
        animate={{ opacity: 1 }}
        transition={{ duration: animationConfig.duration, delay: 0.2 }}
        className="mb-8"
      >
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Overall Progress</span>
          <span>{Math.round(generationProgress)}%</span>
        </div>
        <div className="relative">
          <Progress value={generationProgress} className="h-3 bg-gray-700" />
          {!animationConfig.enableAnimations && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-blue-400/20 rounded-full" />
          )}
        </div>
      </motion.div>

      {/* Enhanced Generation Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {generationSteps.map((step, index) => {
          const Icon = step.icon;
          const isActive = generationProgress > (index * 25);
          const isCompleted = generationProgress > ((index + 1) * 25);

          return (
            <motion.div
              key={step.id}
              initial={animationConfig.enableAnimations ? { opacity: 0, y: 20 } : { opacity: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: animationConfig.duration,
                delay: animationConfig.enableAnimations ? 0.3 + (index * 0.1) : 0
              }}
              className={`p-6 rounded-lg border-2 transition-all duration-300 ${
                isCompleted
                  ? 'border-green-500 bg-green-500/10'
                  : isActive
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-600 bg-gray-800/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-full ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-600 text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : isActive ? (
                    animationConfig.enableAnimations ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <div className="h-6 w-6 bg-blue-500 rounded-full animate-pulse" />
                    )
                  ) : (
                    <Icon className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{step.label}</h3>
                  <p className="text-sm text-gray-400">
                    {isCompleted
                      ? 'Completed'
                      : isActive
                      ? 'In Progress...'
                      : 'Waiting...'}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Enhanced Market Progress */}
      {selectedMarkets.length > 0 && (
        <motion.div
          initial={animationConfig.enableAnimations ? { opacity: 0 } : {}}
          animate={{ opacity: 1 }}
          transition={{ duration: animationConfig.duration, delay: 0.6 }}
          className="mt-8"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Market Progress
          </h3>
          <div className="space-y-3">
            {selectedMarkets.map((market, index) => (
              <motion.div
                key={market}
                initial={animationConfig.enableAnimations ? { opacity: 0, x: -20 } : { opacity: 0 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: animationConfig.duration,
                  delay: animationConfig.enableAnimations ? 0.7 + (index * 0.1) : 0
                }}
                className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
              >
                <div className="w-24 text-sm text-gray-400 font-medium">{market}</div>
                <div className="flex-1">
                  <Progress value={generationProgress} className="h-2 bg-gray-700" />
                </div>
                <div className="w-12 text-sm text-gray-400 text-right font-mono">
                  {Math.round(generationProgress)}%
                </div>
                {generationProgress >= 100 && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}