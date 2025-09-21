'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface NutritionInputProps {
  nutrition: {
    energy: { per100g: { value: number; unit: string } };
    fat: { per100g: { value: number; unit: string } };
    saturatedFat: { per100g: { value: number; unit: string } };
    carbohydrates: { per100g: { value: number; unit: string } };
    sugars: { per100g: { value: number; unit: string } };
    protein: { per100g: { value: number; unit: string } };
    salt: { per100g: { value: number; unit: string } };
    fiber: { per100g: { value: number; unit: string } };
  };
  onChange: (nutrition: any) => void;
}

export function NutritionInput({ nutrition = {
  energy: { per100g: { value: 0, unit: 'kcal' } },
  fat: { per100g: { value: 0, unit: 'g' } },
  saturatedFat: { per100g: { value: 0, unit: 'g' } },
  carbohydrates: { per100g: { value: 0, unit: 'g' } },
  sugars: { per100g: { value: 0, unit: 'g' } },
  protein: { per100g: { value: 0, unit: 'g' } },
  salt: { per100g: { value: 0, unit: 'g' } },
  fiber: { per100g: { value: 0, unit: 'g' } }
}, onChange }: NutritionInputProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (field: string, value: number) => {
    console.log(`NutritionInput: ${field} changed to:`, value);
    const newNutrition = {
      ...nutrition,
      [field]: {
        per100g: {
          value: isNaN(value) ? 0 : value,
          unit: field === 'energy' ? 'kcal' : 'g'
        }
      }
    };
    console.log(`NutritionInput: New nutrition object:`, newNutrition);
    onChange(newNutrition);
  };

  const resetToZero = () => {
    const resetNutrition = {
      energy: { per100g: { value: 0, unit: 'kcal' } },
      fat: { per100g: { value: 0, unit: 'g' } },
      saturatedFat: { per100g: { value: 0, unit: 'g' } },
      carbohydrates: { per100g: { value: 0, unit: 'g' } },
      sugars: { per100g: { value: 0, unit: 'g' } },
      protein: { per100g: { value: 0, unit: 'g' } },
      salt: { per100g: { value: 0, unit: 'g' } },
      fiber: { per100g: { value: 0, unit: 'g' } }
    };
    onChange(resetNutrition);
  };

  const fillSampleData = () => {
    const sampleNutrition = {
      energy: { per100g: { value: 250, unit: 'kcal' } },
      fat: { per100g: { value: 3.5, unit: 'g' } },
      saturatedFat: { per100g: { value: 0.5, unit: 'g' } },
      carbohydrates: { per100g: { value: 45, unit: 'g' } },
      sugars: { per100g: { value: 2, unit: 'g' } },
      protein: { per100g: { value: 8, unit: 'g' } },
      salt: { per100g: { value: 1.2, unit: 'g' } },
      fiber: { per100g: { value: 6, unit: 'g' } }
    };
    console.log('Sample data clicked, setting nutrition to:', sampleNutrition);
    onChange(sampleNutrition);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Nutritional Information (per 100g)</span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetToZero}
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Energy */}
          <div className="space-y-2">
            <Label htmlFor="energy">Energy (kcal)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="energy"
                type="number"
                step="0.1"
                value={nutrition.energy.per100g.value}
                onChange={(e) => {
                  console.log('Energy input changed:', e.target.value);
                  handleChange('energy', parseFloat(e.target.value));
                }}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">kcal</span>
            </div>
          </div>

          {/* Protein */}
          <div className="space-y-2">
            <Label htmlFor="protein">Protein (g)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="protein"
                type="number"
                step="0.1"
                value={nutrition.protein.per100g.value}
                onChange={(e) => {
                  console.log('Protein input changed:', e.target.value);
                  handleChange('protein', parseFloat(e.target.value));
                }}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">g</span>
            </div>
          </div>

          {/* Fat */}
          <div className="space-y-2">
            <Label htmlFor="fat">Total Fat (g)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="fat"
                type="number"
                step="0.1"
                value={nutrition.fat.per100g.value}
                onChange={(e) => handleChange('fat', parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">g</span>
            </div>
          </div>

          {/* Saturated Fat */}
          <div className="space-y-2">
            <Label htmlFor="saturatedFat">Saturated Fat (g)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="saturatedFat"
                type="number"
                step="0.1"
                value={nutrition.saturatedFat.per100g.value}
                onChange={(e) => handleChange('saturatedFat', parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">g</span>
            </div>
          </div>

          {/* Carbohydrates */}
          <div className="space-y-2">
            <Label htmlFor="carbohydrates">Carbohydrates (g)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="carbohydrates"
                type="number"
                step="0.1"
                value={nutrition.carbohydrates.per100g.value}
                onChange={(e) => handleChange('carbohydrates', parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">g</span>
            </div>
          </div>

          {/* Sugars */}
          <div className="space-y-2">
            <Label htmlFor="sugars">Sugars (g)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="sugars"
                type="number"
                step="0.1"
                value={nutrition.sugars.per100g.value}
                onChange={(e) => handleChange('sugars', parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">g</span>
            </div>
          </div>

          {/* Salt */}
          <div className="space-y-2">
            <Label htmlFor="salt">Salt (g)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="salt"
                type="number"
                step="0.1"
                value={nutrition.salt.per100g.value}
                onChange={(e) => handleChange('salt', parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">g</span>
            </div>
          </div>

          {/* Fiber */}
          <div className="space-y-2">
            <Label htmlFor="fiber">Fiber (g)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="fiber"
                type="number"
                step="0.1"
                value={nutrition.fiber.per100g.value}
                onChange={(e) => handleChange('fiber', parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">g</span>
            </div>
          </div>
        </div>

        {showAdvanced && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-semibold mb-2">Advanced Options</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="allergens">Allergens (comma-separated)</Label>
                <Input
                  id="allergens"
                  placeholder="e.g., Gluten, Dairy, Nuts"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="additives">Additives (comma-separated)</Label>
                <Input
                  id="additives"
                  placeholder="e.g., E300, E322, E415"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
