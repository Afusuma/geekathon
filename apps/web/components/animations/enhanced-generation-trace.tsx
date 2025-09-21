'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppStore } from '@/stores/app-store';
import { MARKET_CONFIG } from '@/lib/market-config';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  CheckCircle,
  Loader2,
  XCircle,
  Globe,
  Shield,
  FileText,
  Languages,
  Zap,
  Clock,
  Target,
  Sparkles,
  Wifi,
  WifiOff
} from 'lucide-react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface EnhancedGenerationTraceProps {
  className?: string;
}

// Connection quality detection hook
const useConnectionQuality = () => {
  const [connectionQuality, setConnectionQuality] = useState<'fast' | 'slow' | 'offline'>('fast');
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    // Check if user has slow connection preference
    const prefersReducedData = window.matchMedia('(prefers-reduced-data: reduce)').matches;

    // Simple network speed estimation
    const startTime = performance.now();
    const img = new Image();
    img.onload = () => {
      const loadTime = performance.now() - startTime;
      const isSlowNetwork = loadTime > 1000 || prefersReducedData;
      setIsSlowConnection(isSlowNetwork);
      setConnectionQuality(isSlowNetwork ? 'slow' : 'fast');
    };
    img.onerror = () => {
      setConnectionQuality('offline');
      setIsSlowConnection(true);
    };
    // Use a small test image
    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==';

    // Listen for online/offline events
    const handleOnline = () => setConnectionQuality('fast');
    const handleOffline = () => {
      setConnectionQuality('offline');
      setIsSlowConnection(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { connectionQuality, isSlowConnection };
};

const generationSteps = [
  {
    id: 'analyze',
    title: 'Analyzing Product Data',
    description: 'Processing ingredients, nutrition, and market requirements',
    icon: FileText,
    duration: 2000,
  },
  {
    id: 'regulations',
    title: 'Identifying Market Regulations',
    description: 'Matching product to specific regulatory requirements',
    icon: Shield,
    duration: 1500,
  },
  {
    id: 'generate',
    title: 'Generating Core Label Content',
    description: 'Creating compliant label text and formatting',
    icon: Zap,
    duration: 3000,
  },
  {
    id: 'compliance',
    title: 'Checking Compliance & Warnings',
    description: 'Validating against market-specific regulations',
    icon: Target,
    duration: 2000,
  },
  {
    id: 'translate',
    title: 'Translating & Localizing',
    description: 'Adapting content for target market languages',
    icon: Languages,
    duration: 2500,
  },
  {
    id: 'finalize',
    title: 'Finalizing Labels',
    description: 'Applying final formatting and quality checks',
    icon: Sparkles,
    duration: 1500,
  },
];

export function EnhancedGenerationTrace({ className }: EnhancedGenerationTraceProps) {
  const { isGenerating, generationProgress, selectedMarkets, labels } = useAppStore();
  const { connectionQuality, isSlowConnection } = useConnectionQuality();
  const prefersReducedMotion = useReducedMotion();

  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [marketProgress, setMarketProgress] = useState<Record<string, number>>({});
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState(true);
  const [adaptiveMode, setAdaptiveMode] = useState<'full' | 'minimal' | 'fallback'>('full');
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);

  // Adaptive animation settings based on connection and user preferences
  const animationConfig = useMemo(() => {
    if (prefersReducedMotion || connectionQuality === 'offline') {
      return {
        duration: 0.1,
        enableComplexAnimations: false,
        enableParticles: false,
        enableStaggering: false
      };
    }
    if (isSlowConnection || connectionQuality === 'slow') {
      return {
        duration: 0.3,
        enableComplexAnimations: false,
        enableParticles: false,
        enableStaggering: true
      };
    }
    return {
      duration: 0.5,
      enableComplexAnimations: true,
      enableParticles: true,
      enableStaggering: true
    };
  }, [prefersReducedMotion, connectionQuality, isSlowConnection]);

  // Update adaptive mode based on performance
  useEffect(() => {
    if (prefersReducedMotion || connectionQuality === 'offline') {
      setAdaptiveMode('fallback');
    } else if (isSlowConnection) {
      setAdaptiveMode('minimal');
    } else {
      setAdaptiveMode('full');
    }
  }, [prefersReducedMotion, connectionQuality, isSlowConnection]);

  // Track generation start time and reset progress
  useEffect(() => {
    if (isGenerating && !generationStartTime) {
      setGenerationStartTime(Date.now());
      setMarketProgress({}); // Reset all market progress
    } else if (!isGenerating) {
      setGenerationStartTime(null);
    }
  }, [isGenerating, generationStartTime]);

  // Calculate estimated time based on selected markets and connection quality
  useEffect(() => {
    if (isGenerating) {
      const baseTime = generationSteps.reduce((acc, step) => acc + step.duration, 0);
      const marketMultiplier = Math.max(1, selectedMarkets.length * 0.5);
      const connectionMultiplier = connectionQuality === 'slow' ? 1.5 : connectionQuality === 'offline' ? 2 : 1;
      setEstimatedTime(Math.ceil((baseTime * marketMultiplier * connectionMultiplier) / 1000));
    }
  }, [isGenerating, selectedMarkets.length, connectionQuality]);

  // Countdown timer
  useEffect(() => {
    if (isGenerating && estimatedTime > 0) {
      const interval = setInterval(() => {
        setEstimatedTime(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isGenerating, estimatedTime]);

  // Step progression
  useEffect(() => {
    if (isGenerating) {
      const stepDuration = 100 / generationSteps.length;
      const newCurrentStep = Math.floor(generationProgress / stepDuration);
      setCurrentStep(newCurrentStep);

      // Calculate step progress within current step
      const stepStart = newCurrentStep * stepDuration;
      const stepEnd = (newCurrentStep + 1) * stepDuration;
      const stepProgressValue = Math.max(0, Math.min(100,
        ((generationProgress - stepStart) / (stepEnd - stepStart)) * 100
      ));
      setStepProgress(stepProgressValue);

      // Mark completed steps
      if (newCurrentStep > 0) {
        const newCompletedSteps = new Set<string>();
        for (let i = 0; i < newCurrentStep; i++) {
          const step = generationSteps[i];
          if (step) {
            newCompletedSteps.add(step.id);
          }
        }
        setCompletedSteps(newCompletedSteps);
      }
    } else {
      setCurrentStep(generationSteps.length - 1);
      setStepProgress(100);
      setCompletedSteps(new Set(generationSteps.map(step => step.id)));
    }
  }, [isGenerating, generationProgress]);

  // Staggered market-specific progress simulation with delays between markets
  const updateMarketProgress = useCallback(() => {
    if (!generationStartTime) return;

    setMarketProgress(prev => {
      const newProgress = { ...prev };
      const baseProgressIncrement = isSlowConnection ? Math.random() * 8 : Math.random() * 15;
      const elapsedTime = Date.now() - generationStartTime;

      selectedMarkets.forEach((market, index) => {
        // Calculate delay for each market (staggered start)
        const marketDelay = index * 2000; // 2 second delay between markets
        const marketElapsedTime = elapsedTime - marketDelay;

        if (marketElapsedTime > 0) {
          // Apply a slight randomization to the progress increment for more natural feel
          const progressIncrement = baseProgressIncrement * (0.8 + Math.random() * 0.4);

          if (!newProgress[market] || newProgress[market] < 100) {
            newProgress[market] = Math.min(100, (newProgress[market] || 0) + progressIncrement);
          }
        } else {
          // Market hasn't started yet, keep at 0
          newProgress[market] = 0;
        }
      });
      return newProgress;
    });
  }, [isSlowConnection, selectedMarkets, generationStartTime]);

  useEffect(() => {
    if (isGenerating) {
      const intervalTime = isSlowConnection ? 800 : 500; // Slower updates for slow connections
      const interval = setInterval(updateMarketProgress, intervalTime);
      return () => clearInterval(interval);
    } else {
      setMarketProgress({});
    }
  }, [isGenerating, updateMarketProgress, isSlowConnection]);

  if (!isGenerating && labels.length === 0) return null;

  const currentStepData = generationSteps[currentStep];
  const isCompleted = !isGenerating && labels.length > 0;

  // Connection status indicator
  const ConnectionIndicator = () => {
    if (adaptiveMode === 'fallback') {
      return (
        <div className="flex items-center gap-2 text-yellow-400 text-sm mb-4">
          <WifiOff className="h-4 w-4" />
          <span>Reduced animations for better performance</span>
        </div>
      );
    }
    if (adaptiveMode === 'minimal') {
      return (
        <div className="flex items-center gap-2 text-blue-400 text-sm mb-4">
          <Wifi className="h-4 w-4" />
          <span>Optimized for slower connections</span>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={animationConfig.enableComplexAnimations ? { opacity: 0, y: 20 } : { opacity: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: animationConfig.duration }}
      className={`p-6 rounded-lg shadow-lg bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm border border-gray-700/50 ${className}`}
    >
      <ConnectionIndicator />

      {/* Header */}
      <CardHeader className="text-center pb-4">
        <motion.div
          initial={animationConfig.enableComplexAnimations ? { scale: 0.8 } : { opacity: 0 }}
          animate={animationConfig.enableComplexAnimations ? { scale: 1 } : { opacity: 1 }}
          transition={{ duration: animationConfig.duration }}
        >
          <CardTitle className="text-3xl font-bold text-gray-100 mb-2 flex items-center justify-center gap-3">
            {isCompleted ? (
              <CheckCircle className="h-8 w-8 text-green-500" />
            ) : (
              adaptiveMode === 'fallback' ? (
                <div className="h-8 w-8 bg-blue-500 rounded-full animate-pulse" />
              ) : (
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              )
            )}
            AI SmartLabel Generation
          </CardTitle>
          <p className="text-gray-400">
            {isCompleted
              ? 'Labels generated successfully!'
              : 'Creating compliant labels for your product...'
            }
          </p>
        </motion.div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-300">Overall Progress</span>
            <span className="text-sm text-gray-400">{Math.round(generationProgress)}%</span>
          </div>
          <Progress
            value={generationProgress}
            className="h-3 bg-gray-700"
          />
        </div>

        {/* Current Step */}
        {currentStepData && (
          <motion.div
            key={currentStep}
            initial={animationConfig.enableComplexAnimations ? { opacity: 0, x: -20 } : { opacity: 0 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: animationConfig.duration }}
            className="bg-gradient-to-r from-gray-700/80 to-gray-600/80 backdrop-blur-sm rounded-lg p-4 border border-gray-600/50"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                {isCompleted ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : completedSteps.has(currentStepData.id) ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : adaptiveMode === 'fallback' ? (
                  <div className="h-6 w-6 bg-blue-500 rounded-full animate-pulse" />
                ) : (
                  <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-100">
                  {currentStepData.title}
                </h3>
                <p className="text-sm text-gray-400">
                  {currentStepData.description}
                </p>
              </div>
            </div>

            {!isCompleted && !completedSteps.has(currentStepData.id) && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Step Progress</span>
                  <span className="text-xs text-gray-400">{Math.round(stepProgress)}%</span>
                </div>
                <Progress
                  value={stepProgress}
                  className="h-2 bg-gray-600"
                />
              </div>
            )}
          </motion.div>
        )}

        {/* Steps Overview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-100">Generation Steps</h3>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={animationConfig.enableComplexAnimations ? { opacity: 0, height: 0 } : { opacity: 0 }}
                animate={animationConfig.enableComplexAnimations ? { opacity: 1, height: 'auto' } : { opacity: 1 }}
                exit={animationConfig.enableComplexAnimations ? { opacity: 0, height: 0 } : { opacity: 0 }}
                transition={{ duration: animationConfig.duration }}
                className="space-y-2"
              >
                {generationSteps.map((step, index) => {
                  const isStepCompleted = completedSteps.has(step.id);
                  const isStepCurrent = index === currentStep && !isStepCompleted;

                  return (
                    <motion.div
                      key={step.id}
                      initial={animationConfig.enableComplexAnimations ? { opacity: 0, x: -20 } : { opacity: 0 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: animationConfig.enableStaggering ? index * 0.1 : 0,
                        duration: animationConfig.duration
                      }}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                        isStepCompleted
                          ? 'bg-green-900/20 border border-green-500/30'
                          : isStepCurrent
                          ? 'bg-blue-900/20 border border-blue-500/30'
                          : 'bg-gray-700/50 border border-gray-600/30'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {isStepCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : isStepCurrent ? (
                          adaptiveMode === 'fallback' ? (
                            <div className="h-5 w-5 bg-blue-500 rounded-full animate-pulse" />
                          ) : (
                            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                          )
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-sm font-medium ${
                          isStepCompleted
                            ? 'text-green-300'
                            : isStepCurrent
                            ? 'text-blue-300'
                            : 'text-gray-400'
                        }`}>
                          {step.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {step.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge
                          variant={isStepCompleted ? 'default' : 'secondary'}
                          className={`text-xs ${
                            isStepCompleted
                              ? 'bg-green-600 text-white'
                              : isStepCurrent
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-600 text-gray-300'
                          }`}
                        >
                          {isStepCompleted ? 'Complete' : isStepCurrent ? 'In Progress' : 'Pending'}
                        </Badge>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Market-Specific Progress */}
        {selectedMarkets.length > 1 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Market-Specific Progress
            </h3>
            <div className="space-y-3">
              {selectedMarkets.map((market, index) => {
                const marketInfo = MARKET_CONFIG[market as keyof typeof MARKET_CONFIG];
                const progress = marketProgress[market] || 0;
                const isComplete = progress >= 100;
                const elapsedTime = generationStartTime ? Date.now() - generationStartTime : 0;
                const marketDelay = index * 2000;
                const hasStarted = elapsedTime > marketDelay;
                const isWaiting = !hasStarted && isGenerating;

                return (
                  <motion.div
                    key={market}
                    initial={animationConfig.enableComplexAnimations ? { opacity: 0, y: 10 } : { opacity: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: animationConfig.duration,
                      delay: animationConfig.enableStaggering ? index * 0.1 : 0
                    }}
                    className={`space-y-2 transition-all duration-500 ${
                      isWaiting ? 'opacity-50' : 'opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-300">
                          {marketInfo?.label || market}
                        </span>
                        {isWaiting && (
                          <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400">
                            Waiting {Math.ceil((marketDelay - elapsedTime) / 1000)}s
                          </Badge>
                        )}
                        {hasStarted && !isComplete && progress > 0 && (
                          <Badge variant="outline" className="text-xs text-blue-400 border-blue-400">
                            Processing...
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{Math.round(progress)}%</span>
                        {isComplete && <CheckCircle className="h-4 w-4 text-green-500" />}
                      </div>
                    </div>
                    <Progress
                      value={progress}
                      className={`h-2 bg-gray-700 transition-all duration-300 ${
                        isWaiting ? 'opacity-50' : 'opacity-100'
                      }`}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Enhanced Time Estimation with Connection Awareness */}
        {isGenerating && estimatedTime > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: animationConfig.duration }}
            className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-blue-200">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Estimated time remaining: {estimatedTime} seconds
                </span>
              </div>
              {connectionQuality === 'slow' && (
                <div className="flex items-center gap-2 text-yellow-300">
                  <Wifi className="h-3 w-3" />
                  <span className="text-xs">
                    Times may vary based on connection speed
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Enhanced Completion Message */}
        {isCompleted && (
          <motion.div
            initial={animationConfig.enableComplexAnimations ? { opacity: 0, scale: 0.9 } : { opacity: 0 }}
            animate={animationConfig.enableComplexAnimations ? { opacity: 1, scale: 1 } : { opacity: 1 }}
            transition={{ duration: animationConfig.duration }}
            className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-lg p-6 text-center"
          >
            <motion.div
              initial={animationConfig.enableComplexAnimations ? { scale: 0 } : { opacity: 0 }}
              animate={animationConfig.enableComplexAnimations ? { scale: 1 } : { opacity: 1 }}
              transition={{ delay: 0.2, duration: animationConfig.duration }}
            >
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            </motion.div>
            <h3 className="text-lg font-semibold text-green-300 mb-1">
              Generation Complete!
            </h3>
            <p className="text-sm text-green-200 mb-2">
              {labels.length} label{labels.length !== 1 ? 's' : ''} generated for {selectedMarkets.length} market{selectedMarkets.length !== 1 ? 's' : ''}
            </p>
            {adaptiveMode !== 'full' && (
              <p className="text-xs text-green-300/70">
                Performance optimizations were applied
              </p>
            )}
          </motion.div>
        )}
      </CardContent>
    </motion.div>
  );
}