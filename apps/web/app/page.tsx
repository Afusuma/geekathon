'use client';

import { useState, useEffect } from 'react';
import { EnhancedProductForm } from '@/components/forms/enhanced-product-form';
import { EnhancedGenerationTrace } from '@/components/animations/enhanced-generation-trace';
import { EnhancedComparisonLayout } from '@/components/comparison/enhanced-comparison-layout';
import { CrisisResponseForm } from '@/components/forms/crisis-response-form';
import { CrisisAnalysisResults } from '@/components/crisis/crisis-analysis-results';
import { VisualLabelModal } from '@/components/visual-label-modal';
import AuthGuard from '@/components/AuthGuard';
import UserHeader from '@/components/UserHeader';
import { useAppStore } from '@/stores/app-store';


interface Label {
  labelId?: string;
  productName?: string;
  market?: string;
  language?: string;
  createdAt?: string;
  updatedAt?: string;
  servingSize?: string;
  servingsPerContainer?: string;
  calories?: string;
  ingredients?: string;
  nutrition_facts?: {
    serving_size?: string;
    servings_per_container?: string;
    calories?: string;
    nutrients?: Array<{
      name: string;
      amount: string;
      unit: string;
      daily_value: string;
    }>;
  };
  warnings?: string[];
  ai_generated?: boolean;
  fallback?: boolean;
  labelData?: {
    legalLabel?: {
      ingredients?: string;
      allergens?: string;
      nutrition?: any;
    };
    marketing?: {
      short?: string;
      long?: string;
      claims?: string;
    };
  };
}

interface CrisisFormData {
  crisisType: string;
  severity: string;
  description: string;
  affectedProducts: string[];
  affectedMarkets: string[];
  timeline: string;
  additionalInfo?: string;
}

interface CrisisAnalysis {
  crisisType: string;
  severity: string;
  description: string;
  affectedProducts: string[];
  affectedMarkets: string[];
  timeline: string;
  analysis: {
    riskAssessment: string;
    immediateActions: string[];
    shortTermActions: string[];
    mediumTermActions: string[];
    communicationPlan: {
      pressRelease: string;
      customerNotice: string;
      regulatoryNotice: string;
    };
    legalCompliance: {
      requirements: string[];
      deadlines: string[];
      contacts: string[];
    };
  };
}

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState('form');
  const [showCrisis, setShowCrisis] = useState(false);
  const [crisisStep, setCrisisStep] = useState<'form' | 'analyzing' | 'results'>('form');
  const [labels, setLabels] = useState<Label[]>([]);
  const [productData, setProductData] = useState<any>(null);
  const [crisisData, setCrisisData] = useState<CrisisFormData | null>(null);
  const [crisisAnalysis, setCrisisAnalysis] = useState<CrisisAnalysis | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // App store methods for generation state
  const { setGenerating, setProgress, setSelectedMarkets, generationProgress } = useAppStore();

  // Multi-select states
  const [selectedLabels, setSelectedLabels] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Visual label modal state
  const [showVisualModal, setShowVisualModal] = useState(false);
  const [selectedLabelForVisual, setSelectedLabelForVisual] = useState<Label | null>(null);

  // Load existing labels from localStorage on mount
  useEffect(() => {
    loadExistingLabels();
  }, []);

  // Multi-select functions
  const toggleLabelSelection = (labelId: string) => {
    setSelectedLabels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(labelId)) {
        newSet.delete(labelId);
      } else {
        newSet.add(labelId);
      }
      return newSet;
    });
  };

  const selectAllLabels = () => {
    setSelectedLabels(new Set(labels.map(label => label.labelId!)));
  };

  const clearSelection = () => {
    setSelectedLabels(new Set());
  };

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    if (isSelectMode) {
      clearSelection();
    }
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedLabels.size === 0) return;
    
    if (!confirm(`Tem certeza que deseja deletar ${selectedLabels.size} label(s)?`)) {
      return;
    }

    try {
      // Delete each selected label from DynamoDB
      const deletePromises = Array.from(selectedLabels).map(async (labelId) => {
        const response = await fetch(`https://2b5m23neo4.execute-api.us-east-1.amazonaws.com/Prod/api/labels/${labelId}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`Failed to delete label ${labelId}`);
        }
        return response.json();
      });

      await Promise.all(deletePromises);
      
      // Update state by removing deleted labels
      setLabels(prevLabels => prevLabels.filter(label => !selectedLabels.has(label.labelId!)));
      clearSelection();
      
      alert(`${selectedLabels.size} label(s) deletada(s) com sucesso!`);
    } catch (error) {
      console.error('Error deleting labels:', error);
      alert('Erro ao deletar labels. Tente novamente.');
    }
  };

  const handleBulkExportJSON = () => {
    if (selectedLabels.size === 0) return;
    
    const selectedLabelsData = labels.filter(label => selectedLabels.has(label.labelId!));
    const dataStr = JSON.stringify(selectedLabelsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `labels_bulk_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkExportPDF = () => {
    if (selectedLabels.size === 0) return;
    
    const selectedLabelsData = labels.filter(label => selectedLabels.has(label.labelId!));
    
    // Create HTML content for all selected labels
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Labels Export</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .label { page-break-after: always; margin-bottom: 30px; padding: 20px; border: 1px solid #ccc; }
          .label:last-child { page-break-after: avoid; }
          .header { background: #f5f5f5; padding: 10px; margin-bottom: 15px; }
          .section { margin-bottom: 15px; }
          .section h3 { color: #333; margin-bottom: 10px; }
          .info-item { margin-bottom: 5px; }
          .nutrition-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .nutrition-table th, .nutrition-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .nutrition-table th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Labels Export - ${selectedLabelsData.length} Labels</h1>
        ${selectedLabelsData.map((label, index) => `
          <div class="label">
            <div class="header">
              <h2>Label ${index + 1}: ${label.productName || 'Unknown Product'}</h2>
              <div class="info-item"><strong>Market:</strong> ${label.market}</div>
              <div class="info-item"><strong>Language:</strong> ${label.language}</div>
              <div class="info-item"><strong>Created:</strong> ${label.createdAt ? new Date(label.createdAt).toLocaleString() : 'N/A'}</div>
            </div>
            
            <div class="section">
              <h3>Legal Label</h3>
              <div class="info-item"><strong>Ingredients:</strong> ${label.labelData?.legalLabel?.ingredients || 'N/A'}</div>
              <div class="info-item"><strong>Allergens:</strong> ${label.labelData?.legalLabel?.allergens || 'None specified'}</div>
              <div class="info-item"><strong>Nutrition:</strong></div>
              ${label.labelData?.legalLabel?.nutrition ? (
                typeof label.labelData.legalLabel.nutrition === 'object' ? 
                  Object.entries(label.labelData.legalLabel.nutrition).map(([key, value]: [string, any]) => {
                    let displayValue = '';
                    if (value && typeof value === 'object') {
                      if (value.per100g && value.per100g.value !== undefined && value.per100g.unit) {
                        displayValue = `${value.per100g.value}${value.per100g.unit}`;
                      } else if (value.value !== undefined && value.unit) {
                        displayValue = `${value.value}${value.unit}`;
                      } else if (value.amount !== undefined) {
                        displayValue = String(value.amount);
                      } else if (value.text) {
                        displayValue = String(value.text);
                      } else {
                        displayValue = JSON.stringify(value);
                      }
                    } else {
                      displayValue = String(value);
                    }
                    return `<div class="info-item"><strong>${key}:</strong> ${displayValue}</div>`;
                  }).join('') :
                  `<div class="info-item">${label.labelData.legalLabel.nutrition}</div>`
              ) : '<div class="info-item">N/A</div>'}
            </div>
            
            <div class="section">
              <h3>Marketing</h3>
              <div class="info-item"><strong>Short:</strong> ${label.labelData?.marketing?.short || 'N/A'}</div>
              <div class="info-item"><strong>Long:</strong> ${label.labelData?.marketing?.long || 'N/A'}</div>
              <div class="info-item"><strong>Claims:</strong> ${label.labelData?.marketing?.claims || 'N/A'}</div>
            </div>
          </div>
        `).join('')}
      </body>
      </html>
    `;

    // Create and download PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  // Load existing labels from DynamoDB
  const loadExistingLabels = async () => {
    try {
      setIsRefreshing(true);
      console.log('Loading labels from DynamoDB...');
      
      const response = await fetch('https://2b5m23neo4.execute-api.us-east-1.amazonaws.com/Prod/api/labels');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.success && result.data) {
        setLabels(result.data);
        console.log('Labels loaded from DynamoDB:', result.data.length, 'labels');
      } else {
        setLabels([]);
        console.log('No labels found in DynamoDB');
      }
    } catch (error) {
      console.error('Error loading labels from DynamoDB:', error);
      // Fallback to localStorage if API fails
      try {
        const savedLabels = localStorage.getItem('smartlabel-labels');
        if (savedLabels) {
          const parsedLabels = JSON.parse(savedLabels);
          setLabels(parsedLabels);
          console.log('Fell back to localStorage labels');
        } else {
          setLabels([]);
        }
      } catch (localError) {
        console.error('Error loading from localStorage fallback:', localError);
        setLabels([]);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFormSubmit = async (data: any) => {
    setProductData(data);
    setCurrentStep('generating');

    // Set up app store state for progress animation
    setGenerating(true);
    setProgress(0);
    setSelectedMarkets(data.selectedMarkets || [data.primaryMarket || 'ES']);

    // Simulate progress during generation
    const progressInterval = setInterval(() => {
      const currentProgress = generationProgress;
      if (currentProgress >= 95) {
        clearInterval(progressInterval);
        return; // Keep at 95% until completion
      }
      setProgress(currentProgress + Math.random() * 10);
    }, 500);

    try {
      // Debug: Log the nutrition data being sent
      console.log('=== PAGE HANDLER DEBUG ===');
      console.log('Form data received:', data);
      console.log('data.selectedMarkets:', data.selectedMarkets);
      console.log('data.primaryMarket:', data.primaryMarket);
      console.log('data.market (fallback):', data.market);
      console.log('typeof data.selectedMarkets:', typeof data.selectedMarkets);
      console.log('Array.isArray(data.selectedMarkets):', Array.isArray(data.selectedMarkets));
      console.log('=== END PAGE DEBUG ===');

      // Map market codes to backend expected values
      const marketMapping: Record<string, string> = {
        'US': 'usa',
        'UK': 'uk',
        'ES': 'spain',
        'BR': 'brazil',
        'AO': 'angola',
        'MO': 'macau',
        'AE': 'halal'
      };

      // Get all selected markets from the app store - fallback to primary market if none selected
      const { selectedMarkets, primaryMarket } = data;
      const marketsToGenerate = selectedMarkets && selectedMarkets.length > 0
        ? selectedMarkets
        : (primaryMarket ? [primaryMarket] : ['ES']); // Default to Spain if nothing selected

      console.log('Markets to generate labels for:', marketsToGenerate);

      // Create base payload template
      const basePayload = {
        name: data.name || 'Product',
        serving_size: data.nutrition?.energy?.per100g ? `${data.nutrition.energy.per100g.value}${data.nutrition.energy.per100g.unit}` : '1 serving',
        servings_per_container: '1',
        calories: data.nutrition?.energy?.per100g?.value?.toString() || '0',
        total_fat: data.nutrition?.fat?.per100g?.value?.toString() || '0',
        protein: data.nutrition?.protein?.per100g?.value?.toString() || '0',
        ingredients: Array.isArray(data.ingredients) ? data.ingredients.join(', ') : (data.ingredients || 'Ingredients not specified'),
      };

      // Generate labels for all selected markets in parallel
      const labelPromises = marketsToGenerate.map(async (market: string) => {
        const mappedMarket = marketMapping[market] || 'spain';
        const payload = {
          ...basePayload,
          market: mappedMarket
        };

        console.log(`Generating label for market ${market} (${mappedMarket}):`, payload);

        const response = await fetch('https://2b5m23neo4.execute-api.us-east-1.amazonaws.com/Prod/api/labels/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`HTTP error for market ${market}! status: ${response.status}`);
        }

        const result = await response.json();
        console.log(`Label generated successfully for market ${market}:`, result);
        return { market, result };
      });

      // Wait for all labels to be generated
      const allResults = await Promise.all(labelPromises);
      console.log(`Successfully generated ${allResults.length} labels for markets:`, allResults.map(r => r.market));

      // Complete the progress
      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause to show completion

      // Refresh the labels list to show all new labels
      await loadExistingLabels();

      // Clear generation state
      setGenerating(false);
      setProgress(0);

      // Move to the labels step to show all labels including the new ones
      setCurrentStep('labels');
    } catch (error) {
      console.error('Error generating labels:', error);

      // Clear generation state on error
      clearInterval(progressInterval);
      setGenerating(false);
      setProgress(0);

      // Handle error, maybe show an error message to the user
      setCurrentStep('form'); // Go back to form on error
    }
  };

  const handleGenerateNew = () => {
    setCurrentStep('form');
  };

  const handleCrisisSubmit = async (data: CrisisFormData) => {
    setCrisisData(data);
    setCrisisStep('analyzing');
    
    try {
      // Simulate crisis analysis (in a real app, this would call your crisis API)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate mock analysis based on the crisis data
      const analysis: CrisisAnalysis = {
        ...data,
        analysis: {
          riskAssessment: `Based on the ${data.severity} severity ${data.crisisType} crisis affecting ${data.affectedProducts.length} product(s) in ${data.affectedMarkets.length} market(s), immediate action is required to protect consumer safety and maintain regulatory compliance.`,
          immediateActions: [
            "Stop all production and distribution of affected products immediately",
            "Notify regulatory authorities in all affected markets within 24 hours",
            "Implement immediate recall procedures for affected products",
            "Activate crisis management team and establish command center",
            "Begin immediate testing and investigation of root cause"
          ],
          shortTermActions: [
            "Complete comprehensive product testing and analysis",
            "Develop detailed communication strategy for all stakeholders",
            "Coordinate with suppliers to identify and isolate contaminated materials",
            "Implement enhanced quality control measures",
            "Prepare regulatory documentation and compliance reports"
          ],
          mediumTermActions: [
            "Conduct thorough investigation and root cause analysis",
            "Implement corrective and preventive action plans",
            "Review and update all quality assurance procedures",
            "Train staff on new protocols and procedures",
            "Monitor market response and consumer feedback"
          ],
          communicationPlan: {
            pressRelease: `We are issuing an immediate voluntary recall of ${data.affectedProducts.join(', ')} due to a potential ${data.crisisType} issue. Consumer safety is our top priority, and we are working closely with regulatory authorities to resolve this matter quickly.`,
            customerNotice: `Important Safety Notice: We have identified a potential ${data.crisisType} issue with ${data.affectedProducts.join(', ')}. Please discontinue use immediately and contact us for a full refund.`,
            regulatoryNotice: `Regulatory Compliance Alert: We are reporting a ${data.severity} severity ${data.crisisType} incident affecting ${data.affectedProducts.length} product(s) in ${data.affectedMarkets.join(', ')} markets. Full documentation and corrective action plans will be submitted within required timeframes.`
          },
          legalCompliance: {
            requirements: [
              "Submit incident report to FDA within 24 hours",
              "Notify all affected retailers and distributors",
              "Maintain detailed records of all actions taken",
              "Comply with local food safety regulations in each market",
              "Prepare for potential regulatory inspection"
            ],
            deadlines: [
              "FDA notification: Within 24 hours",
              "Retailer notification: Within 48 hours", 
              "Public communication: Within 72 hours",
              "Root cause analysis: Within 7 days",
              "Corrective action plan: Within 14 days"
            ],
            contacts: [
              "FDA Emergency Response Team",
              "Local Health Department",
              "Legal Counsel - Food Safety Division",
              "Crisis Management Consultant",
              "Insurance Claims Representative"
            ]
          }
        }
      };
      
      setCrisisAnalysis(analysis);
      setCrisisStep('results');
    } catch (error) {
      console.error('Error analyzing crisis:', error);
      setCrisisStep('form');
    }
  };

  const handleExportCrisisReport = () => {
    if (!crisisAnalysis) return;
    
    const reportData = {
      timestamp: new Date().toISOString(),
      crisis: crisisAnalysis
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `crisis-report-${crisisAnalysis.crisisType}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleNewCrisisReport = () => {
    setCrisisData(null);
    setCrisisAnalysis(null);
    setCrisisStep('form');
  };

  const handleDeleteLabel = async (labelId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta label?')) {
      return;
    }

    try {
      // Delete label from DynamoDB
      const response = await fetch(`https://2b5m23neo4.execute-api.us-east-1.amazonaws.com/Prod/api/labels/${labelId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete label ${labelId}`);
      }
      
      // Update state by removing the deleted label
      setLabels(prevLabels => prevLabels.filter(label => label.labelId !== labelId));
      
      alert('Label deletada com sucesso!');
    } catch (error) {
      console.error('Error deleting label:', error);
      alert('Erro ao deletar label. Tente novamente.');
    }
  };

  const handleGenerateVisualLabel = (label: Label) => {
    setSelectedLabelForVisual(label);
    setShowVisualModal(true);
  };

  const handleCloseVisualModal = () => {
    setShowVisualModal(false);
    setSelectedLabelForVisual(null);
  };

  const handleDownloadPDF = async (label: any) => {
    try {
      // Create a simple PDF-like document using HTML and print
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Não foi possível abrir a janela de impressão. Verifique se o popup está bloqueado.');
        return;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Label - ${label.productName || 'Product'}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .section {
              margin-bottom: 15px;
            }
            .section h3 {
              color: #333;
              border-bottom: 1px solid #ccc;
              padding-bottom: 5px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }
            .info-item {
              background: #f5f5f5;
              padding: 8px;
              border-radius: 4px;
            }
            .nutrition-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            .nutrition-table th,
            .nutrition-table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            .nutrition-table th {
              background-color: #f2f2f2;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Smart Label - ${label.productName || 'Product'}</h1>
            <p>Market: ${label.market || 'N/A'} | Language: ${label.language || 'EN'}</p>
            <p>Generated: ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="section">
            <h3>Product Information</h3>
            <div class="info-grid">
              <div class="info-item"><strong>Product:</strong> ${label.productName || 'N/A'}</div>
              <div class="info-item"><strong>Market:</strong> ${label.market || 'N/A'}</div>
              <div class="info-item"><strong>Language:</strong> ${label.language || 'N/A'}</div>
              <div class="info-item"><strong>Created:</strong> ${label.createdAt ? new Date(label.createdAt).toLocaleString() : 'N/A'}</div>
            </div>
          </div>

          ${label.labelData?.legalLabel ? `
          <div class="section">
            <h3>Legal Label Information</h3>
            ${label.labelData.legalLabel.ingredients ? `<p><strong>Ingredients:</strong> ${label.labelData.legalLabel.ingredients}</p>` : ''}
            ${label.labelData.legalLabel.allergens ? `<p><strong>Allergens:</strong> ${label.labelData.legalLabel.allergens}</p>` : ''}
            
            ${label.labelData.legalLabel.nutrition ? `
            <h4>Nutrition Information</h4>
            <table class="nutrition-table">
              <thead>
                <tr><th>Nutrient</th><th>Value</th></tr>
              </thead>
              <tbody>
                ${Object.entries(label.labelData.legalLabel.nutrition).map(([key, value]) => {
                  // Handle nested nutrition structure (e.g., {per100g: {value: 50, unit: "g"}})
                  let displayValue: string = '';
                  
                  if (typeof value === 'object' && value !== null) {
                    const objValue = value as any;
                    
                    // Check for nested structure like {per100g: {value: 50, unit: "g"}}
                    if (objValue.per100g && typeof objValue.per100g === 'object') {
                      const per100g = objValue.per100g;
                      if (per100g.value !== undefined && per100g.unit !== undefined) {
                        displayValue = `${per100g.value}${per100g.unit}`;
                      } else if (per100g.value !== undefined) {
                        displayValue = String(per100g.value);
                      } else {
                        displayValue = JSON.stringify(per100g);
                      }
                    }
                    // Check for direct value/unit structure
                    else if (objValue.value !== undefined && objValue.unit !== undefined) {
                      displayValue = `${objValue.value}${objValue.unit}`;
                    } else if (objValue.value !== undefined) {
                      displayValue = String(objValue.value);
                    } else if (objValue.amount !== undefined) {
                      displayValue = String(objValue.amount);
                    } else {
                      displayValue = JSON.stringify(value);
                    }
                  } else {
                    displayValue = String(value);
                  }
                  
                  return `<tr><td>${key}</td><td>${displayValue}</td></tr>`;
                }).join('')}
              </tbody>
            </table>
            ` : ''}
          </div>
          ` : ''}

          ${label.labelData?.marketing ? `
          <div class="section">
            <h3>Marketing Information</h3>
            ${label.labelData.marketing.short ? `<p><strong>Short Description:</strong> ${label.labelData.marketing.short}</p>` : ''}
            ${label.labelData.marketing.long ? `<p><strong>Long Description:</strong> ${label.labelData.marketing.long}</p>` : ''}
            ${label.labelData.marketing.claims ? `<p><strong>Claims:</strong> ${label.labelData.marketing.claims}</p>` : ''}
          </div>
          ` : ''}

          <div class="no-print" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
              🖨️ Print as PDF
            </button>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Auto-print after a short delay
      setTimeout(() => {
        printWindow.print();
      }, 500);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  return (
    <AuthGuard>
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
        <header className="bg-gray-900 border-b border-gray-700">
          <div className="flex h-14 items-center justify-between gap-8 px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <a className="shrink-0" aria-label="Home" href="/">
              <img 
                src="/smartlabel-logo.svg" 
                  alt="SmartLabel" 
                className="h-8 w-auto"
              />
              </a>
            </div>
            <div className="flex items-center gap-6 max-md:hidden">
              <button
                type="button"
                onClick={() => setShowCrisis(true)}
                className="text-sm/6 text-gray-950 dark:text-white hover:text-sky-600 dark:hover:text-sky-300"
              >
                Crisis Response
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCrisis(false);
                  setCurrentStep('labels');
                }}
                className="text-sm/6 text-gray-950 dark:text-white hover:text-sky-600 dark:hover:text-sky-300"
              >
                View Labels
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCrisis(false);
                  setCurrentStep('form');
                }}
                className="text-sm/6 text-gray-950 dark:text-white hover:text-sky-600 dark:hover:text-sky-300"
              >
                + Create New Label
              </button>
              <UserHeader />
            </div>
            <div className="flex items-center gap-2.5 md:hidden">
              <button type="button" aria-label="Search" className="inline-grid size-7 place-items-center rounded-md">
                <svg viewBox="0 0 16 16" fill="currentColor" className="size-4">
                  <path fillRule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" clipRule="evenodd"></path>
                </svg>
              </button>
              <button type="button" className="relative inline-grid size-7 place-items-center rounded-md text-gray-950 hover:bg-gray-950/5 dark:text-white dark:hover:bg-white/10 undefined" aria-label="Navigation">
                <span className="absolute top-1/2 left-1/2 size-11 -translate-1/2 pointer-fine:hidden"></span>
                <svg viewBox="0 0 16 16" fill="currentColor" className="size-4">
                  <path d="M8 2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM8 6.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM9.5 12.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z"></path>
                </svg>
              </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
        {showCrisis ? (
          <>
            {crisisStep === 'form' && (
              <CrisisResponseForm
                onSubmit={handleCrisisSubmit}
                isProcessing={false}
              />
            )}
            
            {crisisStep === 'analyzing' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-400 mx-auto mb-6"></div>
                    <h2 className="text-2xl font-bold text-red-400 mb-4">Analyzing Crisis Situation</h2>
              <p className="text-gray-300 mb-6">
                      Our AI is analyzing the crisis data and generating a comprehensive response plan...
                    </p>
                    <div className="space-y-2 text-sm text-gray-400">
                      <div>✓ Validating crisis data</div>
                      <div>✓ Assessing risk levels</div>
                      <div>⏳ Generating action plans</div>
                      <div>⏳ Preparing communication strategies</div>
                    </div>
                  </div>
            </div>
          </div>
            )}
            
            {crisisStep === 'results' && crisisAnalysis && (
              <CrisisAnalysisResults
                analysis={crisisAnalysis}
                onGenerateNew={handleNewCrisisReport}
                onExportReport={handleExportCrisisReport}
              />
            )}
          </>
        ) : (
          <>
            {currentStep === 'form' && (
              <div className="max-w-6xl mx-auto text-white">
                <EnhancedProductForm
                  onSubmit={handleFormSubmit}
                  isGenerating={false}
                />
              </div>
            )}

            {currentStep === 'generating' && (
              <div className="max-w-4xl mx-auto">
                <EnhancedGenerationTrace />
              </div>
            )}

            {currentStep === 'comparison' && (
              <div className="w-full">
                <EnhancedComparisonLayout onGenerateNew={handleGenerateNew} />
              </div>
            )}

            {currentStep === 'labels' && (
              <div className="w-full">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Your Smart Labels</h2>
                    <p className="text-gray-400">View and manage all your generated labels</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={loadExistingLabels}
                      disabled={isRefreshing}
                      className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                        isRefreshing 
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                          : 'bg-gray-700 hover:bg-gray-600 text-white'
                      }`}
                    >
                      {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                    
                    {labels.length > 0 && (
                    <button
                        type="button"
                        onClick={toggleSelectMode}
                        className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                          isSelectMode 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                      >
                        {isSelectMode ? 'Cancel Selection' : 'Select Multiple'}
                    </button>
                    )}
                  </div>
                </div>
                
                {/* Bulk Operations Bar */}
                {isSelectMode && labels.length > 0 && (
                  <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-blue-300 font-medium">
                          {selectedLabels.size} label(s) selected
                        </span>
                        <button
                          type="button"
                          onClick={selectAllLabels}
                          className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={clearSelection}
                          className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                        >
                          Clear Selection
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleBulkExportJSON}
                          disabled={selectedLabels.size === 0}
                          className="px-3 py-1 text-xs bg-slate-600 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
                        >
                          Export JSON
                        </button>
                        <button
                          type="button"
                          onClick={handleBulkExportPDF}
                          disabled={selectedLabels.size === 0}
                          className="px-3 py-1 text-xs bg-slate-600 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
                        >
                          Export PDF
                        </button>
                        <button
                          type="button"
                          onClick={handleBulkDelete}
                          disabled={selectedLabels.size === 0}
                          className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
                        >
                          Delete Selected
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {labels.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-300 mb-2">No labels yet</h3>
                    <p className="text-gray-500 mb-4">Create your first smart label to get started</p>
                    <button
                      type="button"
                      onClick={handleGenerateNew}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Create Your First Label
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {labels.map((label, index) => (
                      <div key={label.labelId || index} className={`bg-gray-800 border rounded-lg p-6 hover:bg-gray-750 transition-colors ${
                        isSelectMode && selectedLabels.has(label.labelId!) 
                          ? 'border-blue-500 bg-blue-900/20' 
                          : 'border-gray-700'
                      }`}>
                        <div className="flex items-center justify-between mb-4">
                          {isSelectMode && (
                            <div className="flex items-center mr-4">
                              <input
                                type="checkbox"
                                checked={selectedLabels.has(label.labelId!)}
                                onChange={() => toggleLabelSelection(label.labelId!)}
                                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                              />
                            </div>
                          )}
                          <div>
                            <h3 className="text-xl font-semibold text-white mb-1">
                              {label.productName || 'Unknown Product'}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                🌍 {label.market}
                              </span>
                              <span className="flex items-center gap-1">
                                📅 {label.createdAt ? new Date(label.createdAt).toLocaleString() : 'N/A'}
                              </span>
                              <span className="flex items-center gap-1">
                                🏷️ {label.language?.toUpperCase() || 'EN'}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateVisualLabel(label);
                              }}
                              className="px-3 py-1 text-xs bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors"
                            >
                              Visual
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteLabel(label.labelId!);
                              }}
                              className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <h4 className="font-medium text-gray-300 mb-2">Legal Label</h4>
                            <p className="text-gray-400 mb-1">
                              <strong>Ingredients:</strong> {label.ingredients || 'N/A'}
                            </p>
                            <p className="text-gray-400 mb-1">
                              <strong>Allergens:</strong> {label.warnings?.join(', ') || 'None specified'}
                            </p>
                            <div className="text-gray-400">
                              <strong>Nutrition:</strong>
                              {label.nutrition_facts?.nutrients ? (
                                <div className="ml-2 mt-1 space-y-1">
                                  {label.nutrition_facts.nutrients.map((nutrient: any, index: number) => (
                                    <div key={index} className="text-sm">
                                      <span className="capitalize">{nutrient.name}:</span> {nutrient.amount} ({nutrient.daily_value})
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="ml-2">N/A</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-300 mb-2">Product Details</h4>
                            <p className="text-gray-400 mb-1">
                              <strong>Market:</strong> {label.market || 'N/A'}
                            </p>
                            <p className="text-gray-400 mb-1">
                              <strong>Serving Size:</strong> {label.servingSize || 'N/A'}
                            </p>
                            <p className="text-gray-400 mb-1">
                              <strong>Servings Per Container:</strong> {label.servingsPerContainer || 'N/A'}
                            </p>
                            <p className="text-gray-400">
                              <strong>Calories:</strong> {label.calories || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </>
        )}
      </main>

      {/* Visual Label Modal */}
      {selectedLabelForVisual && (
        <VisualLabelModal
          isOpen={showVisualModal}
          onClose={handleCloseVisualModal}
          labelData={selectedLabelForVisual as Record<string, unknown>}
        />
      )}

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-400">
            <p>SmartLabel AI - Powered by Advanced AI Technology</p>
            <p className="text-sm mt-2">
              Generate compliant labels for multiple markets with intelligent automation
            </p>
          </div>
        </div>
      </footer>

    </div>
    </AuthGuard>
  );
}