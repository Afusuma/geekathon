'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore, ProductData } from '@/stores/app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Globe,
  ChefHat,
  Activity,
  CheckCircle,
  AlertTriangle,
  Info,
  Save,
  RotateCcw,
  Zap,
  Drumstick,
  Wheat,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IngredientsInput } from './ingredients-input';
import { NutritionInput } from './nutrition-input';
import { AdvancedMarketSelector } from './advanced-market-selector';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

// import type { Market } from '@repo/shared';

type Market = 'US' | 'UK' | 'ES' | 'AO' | 'MO' | 'BR' | 'AE';

interface EnhancedProductFormProps {
  onSubmit: (data: any) => void;
  isGenerating: boolean;
}

interface FormValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

type ExamplePreset = {
  id: string;
  label: string;
  name: string;
  ingredients?: string[];
  nutrition?: ProductData['nutrition'] | null;
};

const ZERO_NUTRITION: ProductData['nutrition'] = {
  energy: { per100g: { value: 0, unit: 'kcal' } },
  fat: { per100g: { value: 0, unit: 'g' } },
  saturatedFat: { per100g: { value: 0, unit: 'g' } },
  carbohydrates: { per100g: { value: 0, unit: 'g' } },
  sugars: { per100g: { value: 0, unit: 'g' } },
  protein: { per100g: { value: 0, unit: 'g' } },
  salt: { per100g: { value: 0, unit: 'g' } },
  fiber: { per100g: { value: 0, unit: 'g' } },
};

const EXAMPLE_PRESETS: ExamplePreset[] = [
  {
    id: 'chicken-orange',
    label: 'COXA DE FRANGO C/P S/O LARANJA E PAPRIKA CF',
    name: 'COXA DE FRANGO C/P S/O LARANJA E PAPRIKA CF',
    ingredients: [
      'Carne de Frango (90%)',
      'sumo de laranja (3,5%)',
      'sumo de Limão',
      'água',
      'alho',
      'azeite',
      'sal',
      'paprika fumada (0,3%)',
      'Louro',
    ],
    nutrition: {
      energy: { per100g: { value: 250, unit: 'kcal' } },
      fat: { per100g: { value: 3.5, unit: 'g' } },
      saturatedFat: { per100g: { value: 0.5, unit: 'g' } },
      carbohydrates: { per100g: { value: 45, unit: 'g' } },
      sugars: { per100g: { value: 2, unit: 'g' } },
      protein: { per100g: { value: 8, unit: 'g' } },
      salt: { per100g: { value: 1.2, unit: 'g' } },
      fiber: { per100g: { value: 6, unit: 'g' } },
    },
  },
  {
    id: 'gluten-free-panado',
    label: 'PANADO SEM GLUTEN',
    name: 'PANADO SEM GLUTEN',
    ingredients: [
      'Peito de Frango',
      'farinha de milho (sem glúten)',
      'água',
      'sal',
      'alho em pó',
      'pimenta',
      'azeite',
    ],
    nutrition: {
      energy: { per100g: { value: 230, unit: 'kcal' } },
      fat: { per100g: { value: 2.5, unit: 'g' } },
      saturatedFat: { per100g: { value: 0.4, unit: 'g' } },
      carbohydrates: { per100g: { value: 43, unit: 'g' } },
      sugars: { per100g: { value: 4, unit: 'g' } },
      protein: { per100g: { value: 9, unit: 'g' } },
      salt: { per100g: { value: 0.9, unit: 'g' } },
      fiber: { per100g: { value: 7, unit: 'g' } },
    },
  },
];

export function EnhancedProductForm({ onSubmit, isGenerating }: EnhancedProductFormProps) {
  const { productData, selectedMarkets, primaryMarket, setProductData, resetForm } = useAppStore();

  const [name, setName] = useState(productData?.name || '');
  const [ingredients, setIngredients] = useState<string[]>(productData?.ingredients || []);
  const [nutrition, setNutrition] = useState<ProductData['nutrition']>(
    productData?.nutrition || ZERO_NUTRITION
  );

  // Debug: Log nutrition changes
  const handleNutritionChange = (newNutrition: any) => {
    console.log('Nutrition changed to:', newNutrition);
    setNutrition(newNutrition);
  };

  const [validation, setValidation] = useState<FormValidation>({
    isValid: false,
    errors: [],
    warnings: [],
  });

  const [showValidation, setShowValidation] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Validate form data
  const validateForm = useCallback((): FormValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Product name validation
    if (!name.trim()) {
      errors.push('Product name is required');
    } else if (name.trim().length < 3) {
      warnings.push('Product name should be at least 3 characters long');
    }

    // Ingredients validation
    if (ingredients.length === 0) {
      errors.push('At least one ingredient is required');
    } else if (ingredients.length < 3) {
      warnings.push('Consider adding more ingredients for better label accuracy');
    }

    // Market validation
    if (selectedMarkets.length === 0) {
      errors.push('Please select at least one target market');
    }

    // Nutrition validation
    const hasNutritionData = Object.values(nutrition).some((nutrient) => nutrient.per100g.value > 0);
    if (!hasNutritionData) {
      warnings.push('Nutritional information is recommended for better compliance');
    }

    // Check for common allergens
    const commonAllergens = ['milk', 'soy', 'gluten', 'wheat', 'nuts', 'peanuts', 'eggs', 'fish', 'shellfish'];
    const hasAllergens = ingredients.some((ingredient) =>
      commonAllergens.some((allergen) => ingredient.toLowerCase().includes(allergen))
    );
    if (hasAllergens) {
      warnings.push('Allergens detected - ensure proper labeling requirements');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, [name, ingredients, nutrition, selectedMarkets]);

  // Update validation when form data changes
  useEffect(() => {
    const newValidation = validateForm();
    setValidation(newValidation);
    setHasUnsavedChanges(true);
  }, [validateForm]);

  // Reset form when productData is cleared (from Generate New)
  useEffect(() => {
    if (!productData) {
      setName('');
      setIngredients([]);
      setNutrition(ZERO_NUTRITION);
      setShowValidation(false);
      setHasUnsavedChanges(false);
    }
  }, [productData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validationResult = validateForm();
    setShowValidation(true);

    if (!validationResult.isValid) {
      return;
    }

    // Ensure we have a primary market - if not, use the first selected market or default to US
    const marketToUse = primaryMarket || selectedMarkets[0] || 'US';

    const dataToSend: ProductData = {
      name: name.trim(),
      ingredients,
      market: marketToUse as Market,
      nutrition,
    };

    console.log('EnhancedProductForm: Data being sent:', dataToSend);
    console.log('EnhancedProductForm: Nutrition object:', nutrition);

    setProductData(dataToSend);
    setHasUnsavedChanges(false);
    onSubmit(dataToSend);
  };

  const handleReset = () => {
    resetForm(); // Use store reset function to also reset markets
    setName('');
    setIngredients([]);
    setNutrition(ZERO_NUTRITION);
    setShowValidation(false);
    setHasUnsavedChanges(false);
  };

  // -------- Dropdown Example Presets --------
  const examplePresets = EXAMPLE_PRESETS;

  function applyExamplePreset(preset: ExamplePreset) {
    setName(preset.name);
    setIngredients(preset.ingredients ?? []);
    setNutrition(preset.nutrition ?? ZERO_NUTRITION);
    setHasUnsavedChanges(true);
    setShowValidation(false);
  }
  // ------------------------------------------

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 bg-gray-900">
      {/* Validation Alerts */}
      <AnimatePresence>
        {showValidation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {validation.errors.map((error, index) => (
              <Alert key={index} className="bg-red-900/20 border-red-500">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-200">{error}</AlertDescription>
              </Alert>
            ))} 
            {validation.warnings.map((warning, index) => (
              <Alert key={index} className="bg-yellow-900/20 border-yellow-500">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-yellow-200">{warning}</AlertDescription>
              </Alert>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-6 bg-gray-900">
        {/* Product Name */}
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Information
              </CardTitle>
              <div className="flex items-center gap-2">                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full px-3 py-1.5 text-xs font-semibold bg-gray-700 hover:bg-gray-600 text-white border-gray-600 h-auto"
                      disabled={isGenerating}
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Demo AutoFill
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className="w-[26rem] p-0 bg-gray-900/95 backdrop-blur border-gray-700 rounded-xl shadow-2xl overflow-hidden"
                  >                    
                    {examplePresets.length === 0 && (
                      <DropdownMenuItem disabled className="text-xs opacity-70">
                        No presets found
                      </DropdownMenuItem>
                    )}

                    {examplePresets.map((preset: ExamplePreset) => {
                      const isChicken = /frango|chicken|coxa/i.test(preset.label);
                      const Icon = isChicken ? Drumstick : Wheat;
                      const tags = isChicken ? ['Frango', 'C/P', 'S/O', 'Paprika'] : ['Sem glúten', 'Panado'];

                      return (
                        <DropdownMenuItem
                          key={preset.id}
                          onSelect={() => {
                            if (isGenerating) return;
                            applyExamplePreset(preset); // fecha automático
                          }}
                          className="
                            group p-0 cursor-pointer
                            data-[highlighted]:bg-gradient-to-r
                            data-[highlighted]:from-blue-600/15
                            data-[highlighted]:to-indigo-600/15
                          "
                        >
                          <div className="flex w-full items-center gap-3 px-3 py-3">
                            <div
                              className="
                                flex h-10 w-10 items-center justify-center
                                rounded-lg ring-1 ring-inset
                                bg-gradient-to-br
                                from-gray-700/60 to-gray-700/30
                                ring-gray-600/60
                                group-data-[highlighted]:from-blue-700/40
                                group-data-[highlighted]:to-indigo-700/30
                                group-data-[highlighted]:ring-blue-500/50
                                transition-colors
                              "
                            >
                              <Icon className="h-5 w-5" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm text-white truncate">{preset.label}</div>
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {tags.map((t) => (
                                  <span
                                    key={t}
                                    className="
                                      text-[10px] leading-4 px-2 py-0.5
                                      rounded-full border
                                      bg-gray-800/70 border-gray-700/70 text-gray-200
                                      group-data-[highlighted]:bg-blue-900/30
                                      group-data-[highlighted]:border-blue-700/40
                                      uppercase tracking-wide
                                    "
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold bg-gray-700 hover:bg-gray-600 text-white border-gray-600 h-auto"
                  disabled={isGenerating}
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="name" className="text-gray-300 text-sm font-medium">
                Product Name *
              </Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Insert Product Name"
                className="mt-2 bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Enter a clear, descriptive name for your product</p>
            </div>
          </CardContent>
        </Card>

        {/* Market Selection */}
        <AdvancedMarketSelector />

        {/* Ingredients */}
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              Ingredients & Allergens
            </CardTitle>
            <p className="text-gray-400 text-sm">List all ingredients in order of quantity (highest first)</p>
          </CardHeader>
          <CardContent>
            <IngredientsInput ingredients={ingredients} onChange={setIngredients} />
          </CardContent>
        </Card>

        {/* Nutritional Information */}
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Nutritional Information
            </CardTitle>
            <p className="text-gray-400 text-sm">Provide nutritional values per 100g/ml for accurate labeling</p>
          </CardHeader>
          <CardContent>
            <NutritionInput nutrition={nutrition} onChange={handleNutritionChange} />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    {selectedMarkets.length} market{selectedMarkets.length !== 1 ? 's' : ''} selected
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Globe className="h-4 w-4 text-blue-400" />
                    {ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''} listed
                  </div>
                </div>
              </div>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 text-lg"
                disabled={isGenerating || !validation.isValid}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Labels...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-2" />
                    Generate Smart Labels
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </motion.div>
  );
}
