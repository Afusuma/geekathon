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
  
  // Try to get data from backend structure first (flat), then fall back to nested structure
  const productName = (labelDataTyped.productName as string) || (labelDataNested?.productName as string) || 'Product Name';
  const servingSize = (labelDataTyped.servingSize as string) || (labelDataNested?.servingSize as string) || '1 serving';
  const servingsPerContainer = (labelDataTyped.servingsPerContainer as string) || (labelDataNested?.servingsPerContainer as string) || '1';
  
  // Handle calories - try backend structure first, then nested structure
  let calories = '0 kcal';
  if (labelDataTyped.calories) {
    calories = `${labelDataTyped.calories} kcal`;
  } else if (energyData?.per100g) {
    const per100g = energyData.per100g as Record<string, unknown>;
    calories = `${per100g.value || 0} ${per100g.unit || 'kcal'}`;
  }
  
  // Handle nutritional values - try backend structure first, then nested structure
  let nutritionalValues: Record<string, unknown> = {};
  if (labelDataTyped.nutrition_facts) {
    const nutritionFacts = labelDataTyped.nutrition_facts as Record<string, unknown>;
    if (nutritionFacts.nutrients && Array.isArray(nutritionFacts.nutrients)) {
      // Convert backend nutrients array to object format
      nutritionalValues = {};
      (nutritionFacts.nutrients as Array<{name: string, amount: string, unit: string}>).forEach(nutrient => {
        nutritionalValues[nutrient.name] = {
          per100g: {
            value: parseFloat(nutrient.amount) || 0,
            unit: nutrient.unit
          }
        };
      });
    }
  } else {
    nutritionalValues = nutritionData;
  }
  
  // Handle ingredients - try backend structure first, then nested structure
  const ingredients = (labelDataTyped.ingredients as string) || (legalLabel?.ingredients as string) || 'Ingredients not specified';
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
        // Gerar PNG usando canvas local
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Canvas not supported');
        }

        // Background branco
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Borda preta
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

        let y = 40;

        // Título
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Nutrition Facts', canvas.width / 2, y);
        y += 30;

        // Nome do produto
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(productName || 'Product', 20, y);
        y += 30;

        // Serving size
        ctx.font = '14px Arial';
        ctx.fillText(`Serving size: ${servingSize}`, 20, y);
        y += 20;

        // Servings per container
        ctx.fillText(`Servings per container: ${servingsPerContainer}`, 20, y);
        y += 30;

        // Linha separadora
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(20, y);
        ctx.lineTo(canvas.width - 20, y);
        ctx.stroke();
        y += 20;

        // Calories
        ctx.font = 'bold 16px Arial';
        ctx.fillText('Calories', 20, y);
        ctx.textAlign = 'right';
        ctx.fillText(calories || '0', canvas.width - 20, y);
        y += 25;

        // Linha separadora
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(20, y);
        ctx.lineTo(canvas.width - 20, y);
        ctx.stroke();
        y += 20;

        // Nutritional values
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        
        if (nutritionalValues) {
          Object.entries(nutritionalValues).forEach(([key, value]) => {
            if (value && typeof value === 'object' && 'per100g' in value) {
              const val = (value as any).per100g;
              if (val && val.value !== undefined) {
                ctx.fillText(key, 20, y);
                ctx.textAlign = 'right';
                ctx.fillText(`${val.value}${val.unit || ''}`, canvas.width - 20, y);
                ctx.textAlign = 'left';
                y += 18;
              }
            }
          });
        }

        // Ingredients
        y += 20;
        ctx.font = 'bold 12px Arial';
        ctx.fillText('Ingredients:', 20, y);
        y += 20;
        ctx.font = '10px Arial';
        
        const ingredientsText = Array.isArray(ingredients) ? ingredients.join(', ') : ingredients || 'Not specified';
        const words = ingredientsText.split(' ');
        let line = '';
        
        words.forEach(word => {
          const testLine = line + word + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > canvas.width - 40 && line !== '') {
            ctx.fillText(line, 20, y);
            line = word + ' ';
            y += 12;
          } else {
            line = testLine;
          }
        });
        if (line) {
          ctx.fillText(line, 20, y);
        }

        // Download da imagem
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `nutrition-label-${productName}-${new Date().toISOString().split('T')[0]}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
            Preview
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
