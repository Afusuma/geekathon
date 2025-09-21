'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { MARKET_CONFIG } from '@/lib/market-config';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Download,
  Share2,
  Eye,
  EyeOff,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Globe,
  Shield,
  FileText,
  Languages,
  LayoutGrid,
  Columns2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// import type { Label } from '@repo/shared';

interface EnhancedComparisonLayoutProps {
  onGenerateNew: () => void;
}

export function EnhancedComparisonLayout({ onGenerateNew }: EnhancedComparisonLayoutProps) {
  const labels = useAppStore(state => state.labels);
  const selectedMarkets = useAppStore(state => state.selectedMarkets);
  const primaryMarket = useAppStore(state => state.primaryMarket);
  const comparisonMode = useAppStore(state => state.comparisonMode);
  const [viewMode, setViewMode] = useState<'grid' | 'side-by-side' | 'masonry'>('grid');
  const [expandedLabel, setExpandedLabel] = useState<string | null>(null);
  const [showComplianceDetails, setShowComplianceDetails] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Smooth view transitions
  const handleViewModeChange = (mode: 'grid' | 'side-by-side' | 'masonry') => {
    setIsTransitioning(true);
    setTimeout(() => {
      setViewMode(mode);
      setIsTransitioning(false);
    }, 150);
  };

  if (labels.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 max-w-md mx-auto">
          <FileText className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No Labels Generated</h3>
          <p className="text-gray-400 mb-6">Generate smart labels to see them here</p>
          <Button onClick={onGenerateNew} className="bg-blue-600 hover:bg-blue-700">
            Generate Labels
          </Button>
        </div>
      </motion.div>
    );
  }

  const primaryLabel = primaryMarket ? labels.find(l => l.market === primaryMarket) : labels[0];
  const otherLabels = labels.filter(l => l.market !== primaryMarket);

  const getComplianceScore = (label: any) => {
    // Mock compliance score based on market requirements
    const marketInfo = MARKET_CONFIG[label.market as keyof typeof MARKET_CONFIG];
    const baseScore = 85;
    // Handle both old format (labelData) and new format (direct properties)
    const warnings = label.labelData?.warnings?.length || label.warnings?.length || 0;
    const complianceNotes = label.labelData?.complianceNotes?.length || label.complianceNotes?.length || 0;
    return Math.max(60, baseScore - (warnings * 5) + (complianceNotes * 3));
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getComplianceBadge = (score: number) => {
    if (score >= 90) return { variant: 'default' as const, text: 'Excellent', className: 'bg-green-600' };
    if (score >= 75) return { variant: 'secondary' as const, text: 'Good', className: 'bg-yellow-600' };
    return { variant: 'destructive' as const, text: 'Needs Review', className: 'bg-red-600' };
  };

  const LabelCard = ({ label, index, isPrimary = false }: { label: any; index: number; isPrimary?: boolean }) => {
    const marketInfo = MARKET_CONFIG[label.market as keyof typeof MARKET_CONFIG];
    const complianceScore = getComplianceScore(label);
    const complianceBadge = getComplianceBadge(complianceScore);
    const isExpanded = expandedLabel === label.labelId || expandedLabel === index.toString();

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      >
        <Card className={`bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm border-gray-700/50 text-white transition-all duration-200 hover:border-gray-600/50 hover:shadow-lg hover:shadow-blue-500/10 ${
          isPrimary ? 'ring-2 ring-blue-400/50' : ''
        }`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-lg font-medium">
                    Product Label
                  </CardTitle>
                  {isPrimary && (
                    <Badge className="bg-blue-600 text-white text-xs">
                      Primary
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    <Globe className="h-3 w-3 mr-1" />
                    {marketInfo?.label || label.market}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Languages className="h-3 w-3 mr-1" />
                    {label.language}
                  </Badge>
                  <Badge className={`text-xs ${complianceBadge.className}`}>
                    <Shield className="h-3 w-3 mr-1" />
                    {complianceBadge.text}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Compliance Score:</span>
                  <span className={`text-sm font-semibold ${getComplianceColor(complianceScore)}`}>
                    {complianceScore}%
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedLabel(isExpanded ? null : label.labelId || index.toString())}
                  className="p-2 h-8 w-8"
                >
                  {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm" className="p-2 h-8 w-8">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2 h-8 w-8">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CardContent className="pt-0 space-y-4">
                  {/* Ingredients */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      Ingredients
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(label.labelData?.legalLabel?.ingredients) 
                        ? label.labelData.legalLabel.ingredients.map((ingredient: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {ingredient}
                            </Badge>
                          ))
                        : <span className="text-sm text-gray-400">{label.labelData?.legalLabel?.ingredients || label.ingredients || 'No ingredients'}</span>
                      }
                    </div>
                  </div>

                  {/* Nutritional Information */}
                  {(label.labelData?.legalLabel?.nutrition || label.nutritionalInfo) && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Nutritional Information (per 100g)</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {label.labelData?.legalLabel?.nutrition ? 
                          Object.entries(label.labelData.legalLabel.nutrition).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm">
                              <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                               <span className="text-gray-200">{(value as any)?.per100g?.value || 'N/A'} {(value as any)?.per100g?.unit || ''}</span>
                            </div>
                          )) :
                          Object.entries(label.nutritionalInfo).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm">
                              <span className="text-gray-400 capitalize">{key}:</span>
                               <span className="text-gray-200">{String(value)}</span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {((label.labelData?.warnings && label.labelData.warnings.length > 0) || (label.warnings && label.warnings.length > 0)) && (
                    <div>
                      <h4 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        Warnings
                      </h4>
                      <ul className="space-y-1">
                         {(label.labelData?.warnings || label.warnings || []).map((warning: string, i: number) => (
                          <li key={i} className="text-sm text-yellow-300 flex items-start gap-2">
                            <span className="text-yellow-500 mt-1">•</span>
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Compliance Notes */}
                  {((label.labelData?.complianceNotes && label.labelData.complianceNotes.length > 0) || (label.complianceNotes && label.complianceNotes.length > 0)) && showComplianceDetails && (
                    <div>
                      <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Compliance Notes
                      </h4>
                      <ul className="space-y-1">
                         {(label.labelData?.complianceNotes || label.complianceNotes || []).map((note: string, i: number) => (
                          <li key={i} className="text-sm text-green-300 flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            {note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Market-Specific Requirements */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Market Requirements</h4>
                    <div className="space-y-1">
                      {marketInfo?.requirements.map((req, i) => (
                        <p key={i} className="text-xs text-gray-400 flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          {req}
                        </p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-100 mb-2">
            Generated Labels ({labels.length})
          </h2>
          <p className="text-gray-400">
            AI-generated compliant labels for {selectedMarkets.length} market{selectedMarkets.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowComplianceDetails(!showComplianceDetails)}
            className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
          >
            {showComplianceDetails ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showComplianceDetails ? 'Hide' : 'Show'} Details
          </Button>
          {/* Enhanced View Mode Selector */}
          <div className="flex bg-gray-700/50 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('grid')}
              className="h-8 px-3"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'side-by-side' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('side-by-side')}
              className="h-8 px-3"
            >
              <Columns2 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'masonry' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('masonry')}
              className="h-8 px-3"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={onGenerateNew} className="bg-blue-600 hover:bg-blue-700">
            Generate New Labels
          </Button>
        </div>
      </div>

      {/* Comparison Mode with Tabs */}
      {comparisonMode && primaryLabel && otherLabels.length > 0 ? (
        <Tabs defaultValue={otherLabels[0]?.market || ''} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-700">
            <TabsTrigger value="primary" className="data-[state=active]:bg-blue-600">
              Primary: {MARKET_CONFIG[primaryLabel.market as keyof typeof MARKET_CONFIG]?.label}
            </TabsTrigger>
            {otherLabels.map(label => (
              <TabsTrigger key={label.market} value={label.market} className="data-[state=active]:bg-blue-600">
                {MARKET_CONFIG[label.market as keyof typeof MARKET_CONFIG]?.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="primary" className="mt-4">
            <LabelCard label={primaryLabel} index={0} isPrimary={true} />
          </TabsContent>
          
          {otherLabels.map((label, index) => (
            <TabsContent key={label.market} value={label.market} className="mt-4">
              <LabelCard label={label} index={index + 1} />
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        /* Enhanced Grid View with better responsive layout */
        <motion.div
          layout
          className={cn(
            'grid gap-6 transition-all duration-300',
            isTransitioning && 'opacity-50',
            viewMode === 'side-by-side' && labels.length <= 2
              ? 'grid-cols-1 lg:grid-cols-2'
              : viewMode === 'masonry'
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
          )}
        >
          <AnimatePresence mode="popLayout">
            {labels.map((label, index) => (
              <motion.div
                key={label.labelId || index}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.1,
                  ease: 'easeOut'
                }}
              >
                <LabelCard
                  label={label}
                  index={index}
                  isPrimary={primaryMarket === label.market}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Enhanced Summary Stats with animations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >
        <Card className="bg-gradient-to-r from-gray-800/90 to-gray-700/90 backdrop-blur-sm border-gray-700/50 text-white">
          <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{labels.length}</div>
              <div className="text-sm text-gray-400">Labels Generated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{selectedMarkets.length}</div>
              <div className="text-sm text-gray-400">Markets Covered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {Math.round(labels.reduce((acc, label) => acc + getComplianceScore(label), 0) / labels.length)}%
              </div>
              <div className="text-sm text-gray-400">Avg Compliance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                 {labels.reduce((acc, label) => acc + (label.labelData?.warnings?.length || (label as any).warnings?.length || 0), 0)}
              </div>
              <div className="text-sm text-gray-400">Total Warnings</div>
            </div>
          </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
