"use client";

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';

interface GenerationStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  urgency: boolean;
}

const CRISIS_STEPS: GenerationStep[] = [
  {
    id: 'assessment',
    name: '🔍 Crisis Assessment',
    description: 'Analyzing crisis type, severity, and scope',
    status: 'pending',
    urgency: true
  },
  {
    id: 'labels',
    name: '🏷️ Revised Labels',
    description: 'Generating updated product labels with warnings',
    status: 'pending',
    urgency: true
  },
  {
    id: 'communications',
    name: '📢 Crisis Communications',
    description: 'Creating press releases and customer notifications',
    status: 'pending',
    urgency: false
  },
  {
    id: 'regulatory',
    name: '📋 Regulatory Notices',
    description: 'Preparing authority notifications and compliance docs',
    status: 'pending',
    urgency: true
  },
  {
    id: 'actions',
    name: '✅ Action Plan',
    description: 'Developing crisis response action items and timeline',
    status: 'pending',
    urgency: false
  },
  {
    id: 'validation',
    name: '🔒 Final Validation',
    description: 'Ensuring all materials meet crisis response standards',
    status: 'pending',
    urgency: true
  }
];

interface CrisisGenerationTraceProps {
  onComplete?: () => void;
  totalDuration?: number; // in milliseconds
}

export function CrisisGenerationTrace({ onComplete, totalDuration = 3000 }: CrisisGenerationTraceProps) {
  const [steps, setSteps] = useState<GenerationStep[]>(CRISIS_STEPS);
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 0.1);
    }, 100);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentStep >= steps.length) {
      // All steps completed, call onComplete if provided
      if (onComplete) {
        const finalTimer = setTimeout(onComplete, 500); // Small delay for final animation
        return () => clearTimeout(finalTimer);
      }
      return;
    }

    // Calculate step duration based on totalDuration
    const stepDuration = totalDuration / steps.length;
    const minStepDuration = 300; // Minimum 300ms per step
    const actualStepDuration = Math.max(minStepDuration, stepDuration);

    // Start the current step immediately
    setSteps(prev =>
      prev.map((step, index) => {
        if (index === currentStep) {
          return { ...step, status: 'in_progress' };
        }
        if (index < currentStep) {
          return { ...step, status: 'completed' };
        }
        return step;
      })
    );

    // Complete the step after calculated duration
    const completionTimer = setTimeout(() => {
      setSteps(prev =>
        prev.map((step, index) => {
          if (index === currentStep) {
            return { ...step, status: 'completed' };
          }
          return step;
        })
      );
      setCurrentStep(prev => prev + 1);
      setProgress(prev => Math.min(100, prev + (100 / steps.length)));
    }, actualStepDuration);

    return () => clearTimeout(completionTimer);
  }, [currentStep, steps.length, totalDuration, onComplete]);

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const targetTime = totalDuration / 1000; // Convert to seconds
  const isUrgent = elapsedTime > targetTime * 0.8; // Show urgency if taking longer than 80% of target
  const timeColor = elapsedTime > targetTime * 0.8 ? 'text-red-400' : elapsedTime > targetTime * 0.6 ? 'text-yellow-400' : 'text-green-400';

  // Calculate step duration for animations
  const stepDuration = totalDuration / steps.length;
  const actualStepDuration = Math.max(300, stepDuration);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-red-950/20 border-2 border-red-600/30 rounded-lg overflow-hidden">
      {/* Header with Timer */}
      <div className="bg-red-900/40 p-6 border-b border-red-600/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-lg animate-pulse">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-red-400">
                Generating Crisis Response
              </h2>
              <p className="text-red-300">
                Processing {completedSteps}/{steps.length} steps
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Elapsed Time */}
            <div className="text-center">
              <div className={`text-3xl font-bold font-mono ${timeColor}`}>
                {elapsedTime.toFixed(1)}s
              </div>
              <div className="text-xs text-gray-400">elapsed</div>
            </div>

            {/* Target Indicator */}
            <div className="text-center">
              <div className="text-xl font-semibold text-gray-300">
                &lt; {targetTime}s
              </div>
              <div className="text-xs text-gray-400">target</div>
            </div>

            {/* Urgency Indicator */}
            {isUrgent && (
              <div className="flex items-center gap-2 text-red-400 animate-pulse">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                <span className="font-semibold text-sm">URGENT</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-red-300">Overall Progress</span>
            <span className="text-sm text-red-300">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-red-950/50 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ease-out ${
                progress > 80 ? 'bg-red-600' : progress > 50 ? 'bg-orange-600' : 'bg-green-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="p-6">
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.1,
                  ease: 'easeOut'
                }}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                className="flex items-start gap-4">
              {/* Status Icon */}
              <motion.div
                layout
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 transition-all duration-300 ${
                  step.status === 'completed'
                    ? 'bg-green-600 text-white shadow-lg shadow-green-500/20'
                    : step.status === 'in_progress'
                      ? 'bg-red-600 text-white shadow-lg shadow-red-500/20'
                      : 'bg-gray-600 text-gray-400'
                }`}
              >
                <AnimatePresence mode="wait">
                  {step.status === 'completed' ? (
                    <motion.svg
                      key="completed"
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 90 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </motion.svg>
                  ) : step.status === 'in_progress' ? (
                    <motion.div
                      key="progress"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ duration: 0.3 }}
                      className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"
                    />
                  ) : (
                    <motion.div
                      key="pending"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ duration: 0.3 }}
                      className="w-2 h-2 bg-current rounded-full"
                    />
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`font-semibold ${
                    step.status === 'completed'
                      ? 'text-green-400'
                      : step.status === 'in_progress'
                        ? 'text-red-400'
                        : 'text-gray-300'
                  }`}>
                    {step.name}
                  </h3>
                  {step.urgency && (
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                <p className={`text-sm mt-1 ${
                  step.status === 'in_progress' ? 'text-red-300' : 'text-gray-400'
                }`}>
                  {step.description}
                </p>

                {/* Progress indicator for current step */}
                <AnimatePresence>
                  {step.status === 'in_progress' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-2"
                    >
                      <div className="w-full bg-red-950/50 rounded-full h-1">
                        <motion.div
                          initial={{ width: '0%' }}
                          animate={{ width: '65%' }}
                          transition={{ duration: actualStepDuration / 1000 * 0.8, ease: 'easeInOut' }}
                          className="bg-red-500 h-1 rounded-full"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Timing Info */}
              <div className="text-xs text-gray-500 text-right">
                {step.status === 'completed' && '✓ Done'}
                {step.status === 'in_progress' && (
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-red-500 rounded-full animate-ping"></div>
                    Processing...
                  </div>
                )}
              </div>
            </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Performance Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-8 pt-6 border-t border-red-600/30"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-red-400">{completedSteps}</div>
              <div className="text-xs text-gray-400">Steps Complete</div>
            </div>
            <div>
              <div className={`text-lg font-bold ${timeColor}`}>
                {(targetTime - elapsedTime).toFixed(1)}s
              </div>
              <div className="text-xs text-gray-400">Time Remaining</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-400">HIGH</div>
              <div className="text-xs text-gray-400">Priority</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-400">AI</div>
              <div className="text-xs text-gray-400">Powered</div>
            </div>
          </div>
        </motion.div>

        {/* Crisis Mode Messaging */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-6 p-4 bg-red-950/40 border border-red-600/30 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-5 h-5 text-red-400">
              ⚡
            </div>
            <div>
              <h4 className="font-semibold text-red-400 mb-1">Crisis Mode Active</h4>
              <p className="text-sm text-red-300">
                High-priority processing enabled. All materials will be generated within {targetTime} seconds
                for immediate crisis response deployment.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}