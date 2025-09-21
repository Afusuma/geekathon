'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, LayoutGrid, Columns2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LabelDisplay } from '@/components/label-display';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { MARKET_CONFIG } from '@/lib/market-config';
import { motion, AnimatePresence } from 'framer-motion';
// import type { Market } from '@repo/shared';

interface SideBySideLayoutProps {
  onGenerateNew: () => void;
  className?: string;
}

type ViewMode = 'compact' | 'expanded' | 'stacked';
type DeviceMode = 'mobile' | 'tablet' | 'desktop';

export function SideBySideLayout({ onGenerateNew, className }: SideBySideLayoutProps) {
  const selectedMarkets = useAppStore(state => state.selectedMarkets);
  const labels = useAppStore(state => state.labels);
  const [activeMarketIndex, setActiveMarketIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  const [, setDeviceMode] = useState<DeviceMode>('desktop');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive device detection
  useEffect(() => {
    const updateDeviceMode = () => {
      const width = window.innerWidth;
      if (width < 768) setDeviceMode('mobile');
      else if (width < 1024) setDeviceMode('tablet');
      else setDeviceMode('desktop');
    };

    updateDeviceMode();
    window.addEventListener('resize', updateDeviceMode);
    return () => window.removeEventListener('resize', updateDeviceMode);
  }, []);

  // Smooth view transitions
  const handleViewModeChange = (mode: ViewMode) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setViewMode(mode);
      setIsTransitioning(false);
    }, 150);
  };

  // Filter out markets that don't have labels generated
  const marketsWithLabels = selectedMarkets.filter(market => labels.find(label => label.market === market));

  if (marketsWithLabels.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-8 max-w-md mx-auto">
          <LayoutGrid className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No Labels Generated</h3>
          <p className="text-gray-400 mb-6">Generate smart labels to see side-by-side comparison</p>
          <Button onClick={onGenerateNew} className="bg-blue-600 hover:bg-blue-700 transition-all duration-200">
            Generate Labels
          </Button>
        </div>
      </motion.div>
    );
  }

  // Single market view with enhanced animation
  if (marketsWithLabels.length === 1) {
    const market = marketsWithLabels[0];
    if (!market) return null;
    const label = labels.find(l => l.market === market);
    return label ? (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn('w-full', className)}
      >
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <LabelDisplay
            label={label}
            onGenerateNew={onGenerateNew}
            showMarketHeader={true}
          />
        </div>
      </motion.div>
    ) : null;
  }

  // Enhanced Mobile view with swipe gestures and smooth animations
  const MobileView = () => {
    const currentMarket = marketsWithLabels[activeMarketIndex];
    if (!currentMarket) return null;
    const currentLabel = labels.find(l => l.market === currentMarket);

    const handlePrevious = () => {
      if (activeMarketIndex > 0) {
        setActiveMarketIndex(activeMarketIndex - 1);
      }
    };

    const handleNext = () => {
      if (activeMarketIndex < marketsWithLabels.length - 1) {
        setActiveMarketIndex(activeMarketIndex + 1);
      }
    };

    return (
      <div className="lg:hidden">
        {/* Enhanced Mobile Market Navigator */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="bg-gradient-to-r from-gray-800/90 to-gray-700/90 backdrop-blur-sm rounded-xl border border-gray-600/50 p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevious}
                disabled={activeMarketIndex === 0}
                className="h-10 w-10 rounded-full bg-gray-700/50 hover:bg-gray-600/50 disabled:opacity-30 transition-all duration-200"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <motion.div
                key={activeMarketIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="text-center flex-1"
              >
                <div className="text-lg font-semibold text-gray-100 mb-1">
                  {MARKET_CONFIG[currentMarket as keyof typeof MARKET_CONFIG]?.label}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="text-sm text-gray-400">
                    {activeMarketIndex + 1} of {marketsWithLabels.length}
                  </div>
                  <div className="flex gap-1">
                    {marketsWithLabels.map((_, index) => (
                      <div
                        key={index}
                        className={cn(
                          'w-2 h-2 rounded-full transition-all duration-200',
                          index === activeMarketIndex ? 'bg-blue-400' : 'bg-gray-600'
                        )}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleNext}
                disabled={activeMarketIndex === marketsWithLabels.length - 1}
                className="h-10 w-10 rounded-full bg-gray-700/50 hover:bg-gray-600/50 disabled:opacity-30 transition-all duration-200"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Mobile Label Display with transition */}
        <AnimatePresence mode="wait">
          {currentLabel && (
            <motion.div
              key={activeMarketIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6"
            >
              <LabelDisplay
                label={currentLabel}
                onGenerateNew={onGenerateNew}
                showMarketHeader={false}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Enhanced Desktop view with adaptive layouts and smooth animations
  const DesktopView = () => {
    const getGridCols = () => {
      const count = marketsWithLabels.length;
      if (viewMode === 'stacked') return 'grid-cols-1';
      if (viewMode === 'expanded') return 'grid-cols-1 lg:grid-cols-2 max-w-7xl mx-auto';
      // Compact mode - adaptive based on count
      if (count === 2) return 'grid-cols-1 lg:grid-cols-2';
      if (count === 3) return 'grid-cols-1 lg:grid-cols-3';
      if (count >= 4) return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4';
      return 'grid-cols-1';
    };

    return (
      <div className="hidden lg:block">
        {/* Enhanced Desktop Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-gray-800/90 to-gray-700/90 backdrop-blur-sm rounded-xl border border-gray-600/50 p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-100 mb-2">Market Comparison</h2>
                <p className="text-gray-400">AI-generated labels across {marketsWithLabels.length} market{marketsWithLabels.length > 1 ? 's' : ''}</p>
              </div>

              <div className="flex items-center gap-3">
                {/* View Mode Selector */}
                <div className="flex bg-gray-700/50 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'compact' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleViewModeChange('compact')}
                    className="h-8 px-3"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'expanded' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleViewModeChange('expanded')}
                    className="h-8 px-3"
                  >
                    <Columns2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'stacked' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleViewModeChange('stacked')}
                    className="h-8 px-3"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </div>

                <Button
                  onClick={onGenerateNew}
                  className="bg-blue-600 hover:bg-blue-700 transition-all duration-200"
                >
                  Generate New Labels
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Desktop Grid Layout */}
        <motion.div
          layout
          className={cn(
            'grid gap-6 transition-all duration-300',
            getGridCols(),
            isTransitioning && 'opacity-50'
          )}
          ref={containerRef}
        >
          <AnimatePresence mode="popLayout">
            {marketsWithLabels.map((market, index) => {
              const label = labels.find(l => l.market === market);
              return (
                <motion.div
                  key={market}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.1,
                    ease: 'easeOut'
                  }}
                  whileHover={{
                    scale: viewMode === 'compact' ? 1.02 : 1.01,
                    transition: { duration: 0.2 }
                  }}
                >
                  {label ? (
                    <div className={cn(
                      'bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 transition-all duration-200',
                      'hover:border-gray-600/50 hover:shadow-lg hover:shadow-blue-500/10',
                      viewMode === 'stacked' && 'max-w-4xl mx-auto'
                    )}>
                      <LabelDisplay
                        label={label}
                        onGenerateNew={onGenerateNew}
                        showMarketHeader={true}
                      />
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/30 p-6">
                      <div className="text-center text-gray-400">
                        <div className="flex flex-col items-center gap-4 mb-4">
                          <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center">
                            <span className="text-2xl">🌍</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-100">
                              {MARKET_CONFIG[market as keyof typeof MARKET_CONFIG]?.label}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {MARKET_CONFIG[market as keyof typeof MARKET_CONFIG]?.language}
                            </p>
                          </div>
                        </div>
                        <p className="text-gray-500">No label generated for this market</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={cn('w-full', className)}
    >
      <MobileView />
      <DesktopView />
    </motion.div>
  );
}

// Enhanced comparison component with synchronization
export function SynchronizedComparisonLayout({ onGenerateNew, className }: SideBySideLayoutProps) {
  const selectedMarkets = useAppStore(state => state.selectedMarkets);
  const labels = useAppStore(state => state.labels);
  const [syncScroll, setSyncScroll] = useState(true);
  const [, setFocusedSection] = useState<string | null>(null);

  const marketsWithLabels = selectedMarkets.filter(market => labels.find(l => l.market === market));

  if (marketsWithLabels.length < 2) {
    return (
      <SideBySideLayout onGenerateNew={onGenerateNew} className={className} />
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Synchronization Controls */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-100">Synchronized Comparison</h2>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={syncScroll}
              onChange={(e) => setSyncScroll(e.target.checked)}
              className="rounded"
            />
            Sync Scrolling
          </label>
          <Button onClick={onGenerateNew}>
            Generate New Labels
          </Button>
        </div>
      </div>

      {/* Synchronized Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {marketsWithLabels.map((market) => {
          const label = labels.find(l => l.market === market);
          return label ? (
            <div
              key={market}
              className="bg-gray-800 rounded-lg border border-gray-700 p-6"
              onMouseEnter={() => setFocusedSection(market)}
              onMouseLeave={() => setFocusedSection(null)}
            >
              <LabelDisplay
                label={label}
                onGenerateNew={onGenerateNew}
                showMarketHeader={true}
              />
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
}