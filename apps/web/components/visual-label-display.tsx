'use client';

import React, { useState } from 'react';

interface VisualLabelDisplayProps {
  labelData: Record<string, any>;
}

export function VisualLabelDisplay({ labelData }: VisualLabelDisplayProps) {
  console.log('VisualLabelDisplay rendered with labelData:', labelData);
  
  // Extrair dados do label - adaptado para a estrutura do objeto Label
  const productName = labelData.productName || labelData.labelData?.productName || 'Product Name';
  const servingSize = labelData.servingSize || labelData.labelData?.servingSize || '1 serving';
  const servingsPerContainer = labelData.servingsPerContainer || labelData.labelData?.servingsPerContainer || '1';
  const calories = labelData.calories || labelData.labelData?.calories || '0';
  const nutritionalValues = labelData.nutritionalValues || labelData.labelData?.nutritionalValues || {};
  const ingredients = labelData.ingredients || labelData.labelData?.legalLabel?.ingredients || 'Ingredients not specified';
  const market = labelData.market || 'spain';
  const certifications = labelData.certifications || [];

  // Função para formatar valores nutricionais
  const formatNutritionValue = (value: unknown) => {
    if (typeof value === 'object' && value !== null) {
      const objValue = value as Record<string, any>;
      if (objValue.per100g && typeof objValue.per100g === 'object') {
        const per100g = objValue.per100g as Record<string, any>;
        return `${per100g.value || 0}${per100g.unit || ''}`;
      }
      if (objValue.value !== undefined) {
        return `${objValue.value}${objValue.unit || ''}`;
      }
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }
    return '0';
  };

  // Função para gerar PDF da label visual usando window.print
  const generatePDF = () => {
    const element = document.getElementById('visual-nutrition-label');
    if (!element) return;

    // Criar uma nova janela para impressão
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Nutrition Label - ${productName}</title>
          <style>
            body { margin: 0; padding: 20px; font-family: monospace; }
            .nutrition-label { 
              background: white; 
              border: 2px solid black; 
              padding: 20px; 
              font-size: 14px;
              width: 400px;
              margin: 0 auto;
            }
            @media print {
              body { margin: 0; padding: 0; }
              .nutrition-label { border: 2px solid black !important; }
            }
          </style>
        </head>
        <body>
          ${element.outerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  // Função para gerar PNG da label visual usando canvas nativo
  const generatePNG = () => {
    const element = document.getElementById('visual-nutrition-label');
    if (!element) return;

    // Usar a API nativa do navegador para capturar como imagem
    try {
      // Criar canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Definir dimensões
      canvas.width = 400;
      canvas.height = 600;

      // Preencher fundo branco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Desenhar borda
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

      // Desenhar texto (simplificado)
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Nutrition Facts', canvas.width / 2, 30);
      
      ctx.font = '12px monospace';
      ctx.fillText(productName, canvas.width / 2, 50);

      // Baixar imagem
      const link = document.createElement('a');
      link.download = `nutrition-label-${productName}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      alert('PNG generation not available. Please use PDF download instead.');
    }
  };

  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateVisualLabel = async () => {
    setGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
      const response = await fetch(`${apiUrl}/nutrition/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_data: {
            product_name: productName,
            serving_size: servingSize,
            servings_per_container: servingsPerContainer,
            calories: calories,
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

      if (result.success && result.data?.image_base64) {
        setGeneratedImage(`data:image/png;base64,${result.data.image_base64}`);
      } else {
        throw new Error('No image data received');
      }

    } catch (err) {
      console.error('Error generating visual label:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate visual label');
    } finally {
      setGenerating(false);
    }
  };

  const downloadGeneratedImage = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `nutrition-label-${productName}-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {!generatedImage && (
        <div className="mb-4 text-center">
          <button
            onClick={generateVisualLabel}
            disabled={generating}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {generating ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Generating with AWS Bedrock...
              </>
            ) : (
              <>
                🎨 Generate Visual Label with AWS Bedrock
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <strong>Error:</strong> {error}
        </div>
      )}

      {generatedImage && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Generated Nutrition Label</h3>
            <img
              src={generatedImage}
              alt="Generated Nutrition Label"
              className="max-w-full h-auto mx-auto border border-gray-200 rounded-lg shadow-sm"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={downloadGeneratedImage}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              📥 Download PNG
            </button>
            <button
              onClick={generatePDF}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              📄 PDF
            </button>
            <button
              onClick={() => {
                setGeneratedImage(null);
                setError(null);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              🔄 New
            </button>
          </div>
        </div>
      )}

      {/* Fallback HTML version */}
      {!generatedImage && (
        <div className="mb-4 flex gap-2">
          <button
            onClick={generatePDF}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            📄 Download PDF
          </button>
          <button
            onClick={generatePNG}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            🖼️ Download PNG
          </button>
        </div>
      )}

      <div
        id="visual-nutrition-label"
        className="bg-white border-2 border-black p-4 font-mono text-sm"
        style={{ width: '400px', margin: '0 auto' }}
      >
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-2 mb-4">
          <h2 className="text-lg font-bold">Nutrition Facts</h2>
          <p className="text-sm">{productName}</p>
        </div>

        {/* Serving Information */}
        <div className="border-b border-gray-400 pb-2 mb-3">
          <div className="flex justify-between">
            <span className="font-bold">Serving size:</span>
            <span>{servingSize}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Servings per container:</span>
            <span>{servingsPerContainer}</span>
          </div>
        </div>

        {/* Calories */}
        <div className="border-b-2 border-black pb-2 mb-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-lg">Amount per serving</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-2xl">Calories</span>
            <span className="font-bold text-2xl">{calories}</span>
          </div>
        </div>

        {/* Nutritional Values */}
        <div className="space-y-1">
          <div className="flex justify-between border-b border-gray-300 pb-1">
            <span className="font-bold">Total Fat</span>
            <span>{formatNutritionValue(nutritionalValues.totalFat)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-300 pb-1">
            <span className="font-bold">Saturated Fat</span>
            <span>{formatNutritionValue(nutritionalValues.saturatedFat)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-300 pb-1">
            <span className="font-bold">Trans Fat</span>
            <span>{formatNutritionValue(nutritionalValues.transFat)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-300 pb-1">
            <span className="font-bold">Cholesterol</span>
            <span>{formatNutritionValue(nutritionalValues.cholesterol)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-300 pb-1">
            <span className="font-bold">Sodium</span>
            <span>{formatNutritionValue(nutritionalValues.sodium)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-300 pb-1">
            <span className="font-bold">Total Carbohydrate</span>
            <span>{formatNutritionValue(nutritionalValues.totalCarbohydrate)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-300 pb-1">
            <span className="font-bold">Dietary Fiber</span>
            <span>{formatNutritionValue(nutritionalValues.dietaryFiber)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-300 pb-1">
            <span className="font-bold">Total Sugars</span>
            <span>{formatNutritionValue(nutritionalValues.totalSugars)}</span>
          </div>
          <div className="flex justify-between border-b-2 border-black pb-1">
            <span className="font-bold">Protein</span>
            <span>{formatNutritionValue(nutritionalValues.protein)}</span>
          </div>
        </div>

        {/* Additional Nutrients */}
        <div className="mt-3 space-y-1">
          <div className="flex justify-between border-b border-gray-300 pb-1">
            <span>Vitamin D</span>
            <span>{formatNutritionValue(nutritionalValues.vitaminD)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-300 pb-1">
            <span>Calcium</span>
            <span>{formatNutritionValue(nutritionalValues.calcium)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-300 pb-1">
            <span>Iron</span>
            <span>{formatNutritionValue(nutritionalValues.iron)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-300 pb-1">
            <span>Potassium</span>
            <span>{formatNutritionValue(nutritionalValues.potassium)}</span>
          </div>
        </div>

        {/* Ingredients */}
        <div className="mt-4 border-t border-gray-400 pt-3">
          <h3 className="font-bold mb-2">Ingredients:</h3>
          <p className="text-xs leading-relaxed">{ingredients}</p>
        </div>

        {/* Market and Certifications */}
        <div className="mt-4 border-t border-gray-400 pt-3">
          <div className="flex justify-between text-xs">
            <span>Market: <strong>{market.toUpperCase()}</strong></span>
          </div>
          {certifications.length > 0 && (
            <div className="mt-2">
              <span className="text-xs">Certifications: </span>
              <span className="text-xs">{certifications.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
