'use client';

import React, { useState } from 'react';

interface VisualLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  labelData: Record<string, unknown>;
}

export function VisualLabelModal({ isOpen, onClose, labelData }: VisualLabelModalProps) {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'png' | 'json'>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  // Extrair dados do label - adaptado para a estrutura do objeto Label
  const labelDataTyped = labelData as Record<string, unknown>; // Type assertion for easier access
  const labelDataNested = labelDataTyped.labelData as Record<string, unknown>;
  const legalLabel = labelDataNested?.legalLabel as Record<string, unknown>;
  const nutritionData = legalLabel?.nutrition as Record<string, unknown> || {};
  const energyData = nutritionData.energy as Record<string, unknown>;
  
  const productName = (labelDataTyped.productName as string) || (labelDataNested?.productName as string) || 'Product Name';
  const servingSize = (labelDataTyped.servingSize as string) || (labelDataNested?.servingSize as string) || '1 serving';
  const servingsPerContainer = (labelDataTyped.servingsPerContainer as string) || (labelDataNested?.servingsPerContainer as string) || '1';
  const calories = (energyData?.per100g as Record<string, unknown>)?.value ? `${(energyData.per100g as Record<string, unknown>).value} ${(energyData.per100g as Record<string, unknown>).unit || 'kcal'}` : '0 kcal';
  
  const nutritionalValues = nutritionData;
  const ingredients = legalLabel?.ingredients as string || 'Ingredients not specified';
  const market = (labelDataTyped.market as string) || 'spain';
  const certifications = (labelDataTyped.marketSpecificData as Record<string, unknown>)?.certifications as string[] || [];

  // Função para formatar valores nutricionais
  const formatNutritionValue = (value: unknown) => {
    if (typeof value === 'number') {
      return `${value}`;
    }
    if (typeof value === 'object' && value !== null) {
      const objValue = value as Record<string, unknown>;
      if (objValue.per100g && typeof objValue.per100g === 'object') {
        const per100g = objValue.per100g as Record<string, unknown>;
        return `${per100g.value || 0}${per100g.unit || ''}`;
      }
      if (objValue.value !== undefined) {
        return `${objValue.value}${objValue.unit || ''}`;
      }
    }
    return String(value || '0');
  };

  const handleExport = async () => {
    setIsGenerating(true);
    
    try {
      if (exportFormat === 'png') {
        // Gerar PNG via unified API service
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
        const response = await fetch(`${apiUrl}/nutrition/visual`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            product_data: {
              product_name: productName,
              serving_size: servingSize,
              servings_per_container: servingsPerContainer,
              calories: (energyData?.per100g as Record<string, unknown>)?.value || 0,
              nutritional_values: nutritionalValues,
              ingredients_list: ingredients,
              market: market,
              certifications: certifications
            }
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.image_base64) {
          // Download da imagem
          const link = document.createElement('a');
          link.href = `data:image/png;base64,${result.image_base64}`;
          link.download = `nutrition-label-${productName}-${new Date().toISOString().split('T')[0]}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          throw new Error('No image data received');
        }
      } else if (exportFormat === 'json') {
        // Gerar JSON
        const dataStr = JSON.stringify(labelData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${productName || 'label'}_${market || 'unknown'}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Gerar PDF (fallback para download simples)
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>Nutrition Label - ${productName}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .label { border: 2px solid #000; padding: 20px; max-width: 400px; margin: 0 auto; }
                .title { font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 20px; }
                .section { margin-bottom: 15px; }
                .line { border-bottom: 1px solid #000; padding: 5px 0; }
                .bold { font-weight: bold; }
                .center { text-align: center; }
              </style>
            </head>
            <body>
              <div class="label">
                <div class="title">${productName}</div>
                <div class="section">
                  <div class="line"><strong>Serving Size:</strong> ${servingSize}</div>
                  <div class="line"><strong>Servings Per Container:</strong> ${servingsPerContainer}</div>
                </div>
                <div class="section center">
                  <div class="bold" style="font-size: 20px;">Calories: ${calories}</div>
                </div>
                <div class="section">
                  ${Object.entries(nutritionalValues).map(([key, value]) => 
                    `<div class="line"><strong>${key}:</strong> ${formatNutritionValue(value)}</div>`
                  ).join('')}
                </div>
                <div class="section">
                  <div class="bold">Ingredients:</div>
                  <div>${ingredients}</div>
                </div>
                ${certifications.length > 0 ? `
                  <div class="section">
                    <div class="bold">Certifications:</div>
                    <div>${certifications.map((cert: string) => `• ${cert}`).join('<br>')}</div>
                  </div>
                ` : ''}
              </div>
            </body>
            </html>
          `;
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 500);
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      alert(`Error generating ${exportFormat.toUpperCase()}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            🎨 Label Preview
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Preview */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Preview</h3>
              <div className="bg-white border-2 border-black p-6 font-mono text-sm max-w-md mx-auto">
                <h2 className="text-xl font-bold text-center mb-4 text-black">{productName}</h2>
                
                <div className="border-b-2 border-black pb-2 mb-2">
                  <p className="text-xs text-black"><strong>Serving Size:</strong> {servingSize}</p>
                  <p className="text-xs text-black"><strong>Servings Per Container:</strong> {servingsPerContainer}</p>
                </div>
                
                <div className="border-b-4 border-black py-2 mb-2">
                  <p className="text-2xl font-bold text-center text-black">Calories: {calories}</p>
                </div>
                
                <div className="space-y-1 mb-4">
                  {Object.entries(nutritionalValues).map(([key, value]) => (
                    <div key={key} className="flex justify-between border-b border-gray-300 py-1">
                      <span className="font-semibold text-black">{key}:</span>
                      <span className="text-black">{formatNutritionValue(value)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="text-xs text-black">
                  <p className="font-bold mb-1">Ingredients:</p>
                  <p className="leading-tight">{ingredients}</p>
                </div>
                
                {certifications.length > 0 && (
                  <div className="text-xs text-black mt-3">
                    <p className="font-bold mb-1">Certifications:</p>
                    <ul>
                      {certifications.map((cert: string, index: number) => (
                        <li key={index}>• {cert}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Export Options */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Export Options</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Export Format
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="pdf"
                        checked={exportFormat === 'pdf'}
                        onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'png' | 'json')}
                        className="mr-2"
                      />
                      <span className="text-white">PDF</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="png"
                        checked={exportFormat === 'png'}
                        onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'png' | 'json')}
                        className="mr-2"
                      />
                      <span className="text-white">PNG</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="json"
                        checked={exportFormat === 'json'}
                        onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'png' | 'json')}
                        className="mr-2"
                      />
                      <span className="text-white">JSON</span>
                    </label>
                  </div>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2">
                    {exportFormat === 'pdf' ? '📄 PDF Export' : exportFormat === 'png' ? '🎨 PNG Export with AI' : '📋 JSON Export'}
                  </h4>
                  <p className="text-gray-300 text-sm">
                    {exportFormat === 'pdf' 
                      ? 'Generates a simple PDF with label data for printing.'
                      : exportFormat === 'png'
                      ? 'Uses AWS Bedrock to generate a professional PNG image of the nutrition label.'
                      : 'Downloads the complete label data in JSON format for integration and analysis.'
                    }
                  </p>
                </div>

                <button
                  onClick={handleExport}
                  disabled={isGenerating}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating {exportFormat.toUpperCase()}...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Generate {exportFormat.toUpperCase()}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
