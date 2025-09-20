import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Market language mapping
const MARKET_LANGUAGES: Record<string, string> = {
  'US': 'EN',
  'UK': 'EN',
  'ES': 'ES', // Spain uses Spanish
  'BR': 'PT',
  'AO': 'PT',
  'MO': 'ZH',
  'AE': 'AR',
};

// Common ingredient translations
const INGREDIENT_TRANSLATIONS: Record<string, Record<string, string>> = {
  // Portuguese to English
  'PT-EN': {
    'açúcar': 'sugar',
    'sal': 'salt',
    'óleo': 'oil',
    'água': 'water',
    'farinha': 'flour',
    'leite': 'milk',
    'ovo': 'egg',
    'manteiga': 'butter',
    'queijo': 'cheese',
    'carne': 'meat',
    'frango': 'chicken',
    'peixe': 'fish',
    'tomate': 'tomato',
    'cebola': 'onion',
    'alho': 'garlic',
    'pimenta': 'pepper',
    'limão': 'lemon',
    'laranja': 'orange',
    'maçã': 'apple',
    'banana': 'banana',
    'arroz': 'rice',
    'feijão': 'beans',
    'batata': 'potato',
    'cenoura': 'carrot',
    'espinafre': 'spinach',
    'alface': 'lettuce',
    'preservantes': 'preservatives',
    'corantes': 'colorants',
    'aromatizantes': 'flavorings',
    'conservantes': 'preservatives',
    'estabilizantes': 'stabilizers',
    'emulsificantes': 'emulsifiers',
    'espessantes': 'thickeners',
    'acidulantes': 'acidulants',
    'antioxidantes': 'antioxidants',
    'edulcorantes': 'sweeteners',
    'realçadores de sabor': 'flavor enhancers',
    'glicose': 'glucose',
    'frutose': 'fructose',
    'lactose': 'lactose',
    'glúten': 'gluten',
    'soja': 'soy',
    'amendoim': 'peanut',
    'castanha': 'nuts',
    'amêndoa': 'almond',
    'avelã': 'hazelnut',
    'noz': 'walnut',
    'sésamo': 'sesame',
    'mostarda': 'mustard',
    'aipo': 'celery',
    'sulfitos': 'sulfites',
  },
  // Spanish to English
  'ES-EN': {
    'azúcar': 'sugar',
    'sal': 'salt',
    'aceite': 'oil',
    'agua': 'water',
    'harina': 'flour',
    'leche': 'milk',
    'huevo': 'egg',
    'mantequilla': 'butter',
    'queso': 'cheese',
    'carne': 'meat',
    'pollo': 'chicken',
    'pescado': 'fish',
    'tomate': 'tomate',
    'cebolla': 'onion',
    'ajo': 'garlic',
    'pimienta': 'pepper',
    'limón': 'lemon',
    'naranja': 'orange',
    'manzana': 'apple',
    'plátano': 'banana',
    'arroz': 'rice',
    'frijoles': 'beans',
    'patata': 'potato',
    'zanahoria': 'carrot',
    'espinaca': 'spinach',
    'lechuga': 'lettuce',
    'conservantes': 'preservatives',
    'colorantes': 'colorants',
    'aromatizantes': 'flavorings',
    'estabilizantes': 'stabilizers',
    'emulsionantes': 'emulsifiers',
    'espesantes': 'thickeners',
    'acidulantes': 'acidulants',
    'antioxidantes': 'antioxidants',
    'edulcorantes': 'sweeteners',
    'potenciadores de sabor': 'flavor enhancers',
    'glucosa': 'glucose',
    'fructosa': 'fructose',
    'lactosa': 'lactose',
    'gluten': 'gluten',
    'soja': 'soy',
    'cacahuete': 'peanut',
    'nueces': 'nuts',
    'almendra': 'almond',
    'avellana': 'hazelnut',
    'nuez': 'walnut',
    'sésamo': 'sesame',
    'mostaza': 'mustard',
    'apio': 'celery',
    'sulfitos': 'sulfites',
  },
  // English to Portuguese
  'EN-PT': {
    'sugar': 'açúcar',
    'salt': 'sal',
    'oil': 'óleo',
    'water': 'água',
    'flour': 'farinha',
    'milk': 'leite',
    'egg': 'ovo',
    'butter': 'manteiga',
    'cheese': 'queijo',
    'meat': 'carne',
    'chicken': 'frango',
    'fish': 'peixe',
    'tomato': 'tomate',
    'onion': 'cebola',
    'garlic': 'alho',
    'pepper': 'pimenta',
    'lemon': 'limão',
    'orange': 'laranja',
    'apple': 'maçã',
    'banana': 'banana',
    'rice': 'arroz',
    'beans': 'feijão',
    'potato': 'batata',
    'carrot': 'cenoura',
    'spinach': 'espinafre',
    'lettuce': 'alface',
    'preservatives': 'preservantes',
    'colorants': 'corantes',
    'flavorings': 'aromatizantes',
    'stabilizers': 'estabilizantes',
    'emulsifiers': 'emulsificantes',
    'thickeners': 'espessantes',
    'acidulants': 'acidulantes',
    'antioxidants': 'antioxidantes',
    'sweeteners': 'edulcorantes',
    'flavor enhancers': 'realçadores de sabor',
    'glucose': 'glicose',
    'fructose': 'frutose',
    'lactose': 'lactose',
    'gluten': 'glúten',
    'soy': 'soja',
    'peanut': 'amendoim',
    'nuts': 'castanha',
    'almond': 'amêndoa',
    'hazelnut': 'avelã',
    'walnut': 'noz',
    'sesame': 'sésamo',
    'mustard': 'mostarda',
    'celery': 'aipo',
    'sulfites': 'sulfitos',
    // Additional common ingredients
    'whole wheat flour': 'farinha de trigo integral',
    'sea salt': 'sal marinho',
    'organic yeast': 'fermento orgânico',
    'olive oil': 'azeite de oliva',
    'milk powder': 'leite em pó',
    'soy lecithin': 'lecitina de soja',
    'wheat': 'trigo',
    'yeast': 'fermento',
    'olive': 'oliva',
    'powder': 'pó',
    'lecithin': 'lecitina',
    'allergen': 'alérgeno',
    'organic': 'orgânico',
    'whole': 'integral',
    'sea': 'marinho',
    'milk powder (allergen)': 'leite em pó (alérgeno)',
    'soy lecithin (allergen)': 'lecitina de soja (alérgeno)',
  },
  // English to Spanish
  'EN-ES': {
    'sugar': 'azúcar',
    'salt': 'sal',
    'oil': 'aceite',
    'water': 'agua',
    'flour': 'harina',
    'milk': 'leche',
    'egg': 'huevo',
    'butter': 'mantequilla',
    'cheese': 'queso',
    'meat': 'carne',
    'chicken': 'pollo',
    'fish': 'pescado',
    'tomato': 'tomate',
    'onion': 'cebolla',
    'garlic': 'ajo',
    'pepper': 'pimienta',
    'lemon': 'limón',
    'orange': 'naranja',
    'apple': 'manzana',
    'banana': 'plátano',
    'rice': 'arroz',
    'beans': 'frijoles',
    'potato': 'patata',
    'carrot': 'zanahoria',
    'spinach': 'espinaca',
    'lettuce': 'lechuga',
    'preservatives': 'conservantes',
    'colorants': 'colorantes',
    'flavorings': 'aromatizantes',
    'stabilizers': 'estabilizantes',
    'emulsifiers': 'emulsionantes',
    'thickeners': 'espesantes',
    'acidulants': 'acidulantes',
    'antioxidants': 'antioxidantes',
    'sweeteners': 'edulcorantes',
    'flavor enhancers': 'potenciadores de sabor',
    'glucose': 'glucosa',
    'fructose': 'fructosa',
    'lactose': 'lactosa',
    'gluten': 'gluten',
    'soy': 'soja',
    'peanut': 'cacahuete',
    'nuts': 'nueces',
    'almond': 'almendra',
    'hazelnut': 'avellana',
    'walnut': 'nuez',
    'sesame': 'sésamo',
    'mustard': 'mostaza',
    'celery': 'apio',
    'sulfites': 'sulfitos',
  },
  // English to Chinese (for Macau)
  'EN-ZH': {
    'sugar': '糖',
    'salt': '盐',
    'oil': '油',
    'water': '水',
    'flour': '面粉',
    'milk': '牛奶',
    'egg': '鸡蛋',
    'butter': '黄油',
    'cheese': '奶酪',
    'meat': '肉',
    'chicken': '鸡肉',
    'fish': '鱼',
    'tomato': '番茄',
    'onion': '洋葱',
    'garlic': '大蒜',
    'pepper': '胡椒',
    'lemon': '柠檬',
    'orange': '橙子',
    'apple': '苹果',
    'banana': '香蕉',
    'rice': '米饭',
    'beans': '豆类',
    'potato': '土豆',
    'carrot': '胡萝卜',
    'spinach': '菠菜',
    'lettuce': '生菜',
    'preservatives': '防腐剂',
    'colorants': '着色剂',
    'flavorings': '调味料',
    'stabilizers': '稳定剂',
    'emulsifiers': '乳化剂',
    'thickeners': '增稠剂',
    'acidulants': '酸味剂',
    'antioxidants': '抗氧化剂',
    'sweeteners': '甜味剂',
    'flavor enhancers': '增味剂',
    'glucose': '葡萄糖',
    'fructose': '果糖',
    'lactose': '乳糖',
    'gluten': '麸质',
    'soy': '大豆',
    'peanut': '花生',
    'nuts': '坚果',
    'almond': '杏仁',
    'hazelnut': '榛子',
    'walnut': '核桃',
    'sesame': '芝麻',
    'mustard': '芥末',
    'celery': '芹菜',
    'sulfites': '亚硫酸盐',
    // Additional ingredients
    'whole wheat flour': '全麦面粉',
    'sea salt': '海盐',
    'organic yeast': '有机酵母',
    'olive oil': '橄榄油',
    'milk powder': '奶粉',
    'soy lecithin': '大豆卵磷脂',
    'honey': '蜂蜜',
    'sesame seeds': '芝麻籽',
  },
  // English to Arabic (for UAE)
  'EN-AR': {
    'sugar': 'سكر',
    'salt': 'ملح',
    'oil': 'زيت',
    'water': 'ماء',
    'flour': 'دقيق',
    'milk': 'حليب',
    'egg': 'بيض',
    'butter': 'زبدة',
    'cheese': 'جبن',
    'meat': 'لحم',
    'chicken': 'دجاج',
    'fish': 'سمك',
    'tomato': 'طماطم',
    'onion': 'بصل',
    'garlic': 'ثوم',
    'pepper': 'فلفل',
    'lemon': 'ليمون',
    'orange': 'برتقال',
    'apple': 'تفاح',
    'banana': 'موز',
    'rice': 'أرز',
    'beans': 'فاصوليا',
    'potato': 'بطاطس',
    'carrot': 'جزر',
    'spinach': 'سبانخ',
    'lettuce': 'خس',
    'preservatives': 'مواد حافظة',
    'colorants': 'ملونات',
    'flavorings': 'منكهات',
    'stabilizers': 'مثبتات',
    'emulsifiers': 'مستحلبات',
    'thickeners': 'مكثفات',
    'acidulants': 'حمضيات',
    'antioxidants': 'مضادات أكسدة',
    'sweeteners': 'محليات',
    'flavor enhancers': 'معززات نكهة',
    'glucose': 'جلوكوز',
    'fructose': 'فركتوز',
    'lactose': 'لاكتوز',
    'gluten': 'جلوتين',
    'soy': 'صويا',
    'peanut': 'فول سوداني',
    'nuts': 'مكسرات',
    'almond': 'لوز',
    'hazelnut': 'بندق',
    'walnut': 'جوز',
    'sesame': 'سمسم',
    'mustard': 'خردل',
    'celery': 'كرفس',
    'sulfites': 'كبريتات',
    // Additional ingredients
    'whole wheat flour': 'دقيق قمح كامل',
    'sea salt': 'ملح بحري',
    'organic yeast': 'خميرة عضوية',
    'olive oil': 'زيت زيتون',
    'milk powder': 'حليب مجفف',
    'soy lecithin': 'ليسيثين الصويا',
    'honey': 'عسل',
    'sesame seeds': 'بذور السمسم',
  },
};

// Translation functions
function detectLanguage(text: string): string {
  const lowerText = text.toLowerCase();
  
  // Portuguese indicators (more comprehensive)
  const portugueseIndicators = [
    'açúcar', 'óleo', 'água', 'farinha', 'leite', 'ovo', 'manteiga', 'queijo',
    'carne', 'frango', 'peixe', 'tomate', 'cebola', 'alho', 'pimenta', 'limão',
    'laranja', 'maçã', 'banana', 'arroz', 'feijão', 'batata', 'cenoura',
    'espinafre', 'alface', 'preservantes', 'corantes', 'aromatizantes',
    'conservantes', 'estabilizantes', 'emulsificantes', 'espessantes',
    'acidulantes', 'antioxidantes', 'edulcorantes', 'realçadores de sabor',
    'glicose', 'frutose', 'lactose', 'glúten', 'soja', 'amendoim', 'castanha',
    'amêndoa', 'avelã', 'noz', 'sésamo', 'mostarda', 'aipo', 'sulfitos'
  ];
  
  // Spanish indicators (more comprehensive)
  const spanishIndicators = [
    'azúcar', 'aceite', 'agua', 'harina', 'leche', 'huevo', 'mantequilla', 'queso',
    'carne', 'pollo', 'pescado', 'tomate', 'cebolla', 'ajo', 'pimienta', 'limón',
    'naranja', 'manzana', 'plátano', 'arroz', 'frijoles', 'patata', 'zanahoria',
    'espinaca', 'lechuga', 'conservantes', 'colorantes', 'aromatizantes',
    'estabilizantes', 'emulsionantes', 'espesantes', 'acidulantes',
    'antioxidantes', 'edulcorantes', 'potenciadores de sabor', 'glucosa',
    'fructosa', 'lactosa', 'gluten', 'soja', 'cacahuete', 'nueces', 'almendra',
    'avellana', 'nuez', 'sésamo', 'mostaza', 'apio', 'sulfitos'
  ];
  
  // Count matches for each language
  const portugueseMatches = portugueseIndicators.filter(indicator => 
    lowerText.includes(indicator)
  ).length;
  
  const spanishMatches = spanishIndicators.filter(indicator => 
    lowerText.includes(indicator)
  ).length;
  
  // Return the language with more matches, or English as default
  if (portugueseMatches > spanishMatches && portugueseMatches > 0) {
    return 'PT';
  } else if (spanishMatches > 0) {
    return 'ES';
  }
  
  // Default to English
  return 'EN';
}

function translateIngredients(ingredients: string[], targetMarket: string): string {
  const targetLanguage = MARKET_LANGUAGES[targetMarket];
  if (!targetLanguage || targetLanguage === 'EN') {
    return ingredients.join(', '); // No translation needed for English
  }

  const translationKey = `EN-${targetLanguage}`;
  const translations = INGREDIENT_TRANSLATIONS[translationKey];
  
  if (!translations) {
    return ingredients.join(', '); // No translations available
  }

  const translatedIngredients = ingredients.map(ingredient => {
    const lowerIngredient = ingredient.toLowerCase().trim();
    return translations[lowerIngredient] || ingredient;
  });

  return translatedIngredients.join(', ');
}

function translateIngredientsFromSource(
  ingredients: string[], 
  sourceLanguage: string, 
  targetMarket: string
): string {
  const targetLanguage = MARKET_LANGUAGES[targetMarket];
  
  if (sourceLanguage === targetLanguage) {
    return ingredients.join(', '); // No translation needed
  }

  // First translate to English if source is not English
  let englishIngredients = ingredients;
  if (sourceLanguage !== 'EN') {
    const toEnglishKey = `${sourceLanguage}-EN`;
    const toEnglishTranslations = INGREDIENT_TRANSLATIONS[toEnglishKey];
    
    if (toEnglishTranslations) {
      englishIngredients = ingredients.map(ingredient => {
        const lowerIngredient = ingredient.toLowerCase().trim();
        return toEnglishTranslations[lowerIngredient] || ingredient;
      });
    }
  }

  // Then translate from English to target language
  return translateIngredients(englishIngredients, targetMarket);
}

interface ErrorResponse {
  error: string;
  message: string;
  details?: string;
}

interface Label {
  id: string;
  productName: string;
  ingredients: string;
  allergens: string[];
  nutritionalInfo: {
    calories: number;
    fat: number;
    carbs: number;
    protein: number;
  };
  market: string;
  language: string;
  warnings: string[];
  complianceNotes: string[];
  generatedAt: string;
  version: string;
}

interface SuccessResponse {
  success: boolean;
  data: Label | Label[];
}

// Helper function to create consistent API responses
function createResponse(
  statusCode: number,
  body: SuccessResponse | ErrorResponse,
  headers: Record<string, string> = {}
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key',
      ...headers,
    },
    body: JSON.stringify(body),
  };
}

// Mock label generation for development
function generateMockLabel(productData: any): Label {
  const labelId = `label_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const market = productData.market || 'EU';
  const targetLanguage = MARKET_LANGUAGES[market] || 'EN';
  
  // Parse ingredients (could be string or array)
  let ingredientsArray: string[] = [];
  if (typeof productData.ingredients === 'string') {
    ingredientsArray = productData.ingredients.split(',').map((ing: string) => ing.trim());
  } else if (Array.isArray(productData.ingredients)) {
    ingredientsArray = productData.ingredients;
  } else {
    ingredientsArray = ['water', 'sugar'];
  }
  
  // Detect source language and translate ingredients
  const sourceLanguage = detectLanguage(ingredientsArray.join(' '));
  console.log(`=== TRANSLATION DEBUG ===`);
  console.log(`Original ingredients: ${ingredientsArray.join(', ')}`);
  console.log(`Detected source language: ${sourceLanguage}`);
  console.log(`Target market: ${market}`);
  console.log(`Target language: ${targetLanguage}`);
  
  const translatedIngredients = translateIngredientsFromSource(ingredientsArray, sourceLanguage, market);
  console.log(`Translated ingredients: ${translatedIngredients}`);
  console.log(`=== END TRANSLATION DEBUG ===`);
  
  return {
    id: labelId,
    productName: productData.productName || productData.name || 'Test Product',
    ingredients: translatedIngredients,
    allergens: productData.allergens || [],
    nutritionalInfo: productData.nutritionalInfo || {
      calories: 100,
      fat: 0,
      carbs: 25,
      protein: 0,
    },
    market: market,
    language: targetLanguage,
    warnings: [
      `This is a mock label for development purposes (${market} market)`,
      `Translated from ${sourceLanguage} to ${targetLanguage}`,
      `Contains: ${translatedIngredients}`,
    ],
    complianceNotes: [
      `Mock compliance note for ${market} market`,
      `Ingredients translated to ${targetLanguage}`,
    ],
    generatedAt: new Date().toISOString(),
    version: '1.0.0',
  };
}

export const handler = async (
  event: APIGatewayProxyEvent,
  context: any
): Promise<APIGatewayProxyResult> => {
  console.log('Generate handler called with event:', JSON.stringify(event, null, 2));

  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return createResponse(200, { success: true, data: {} as Label });
    }

    // Validate HTTP method
    if (event.httpMethod !== 'POST') {
      return createResponse(405, {
        error: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed',
      });
    }

    // Parse and validate request body
    if (!event.body) {
      return createResponse(400, {
        error: 'INVALID_REQUEST',
        message: 'Request body is required',
      });
    }

    let productData;
    try {
      productData = JSON.parse(event.body);
    } catch (parseError) {
      return createResponse(400, {
        error: 'INVALID_JSON',
        message: 'Invalid JSON in request body',
        details: parseError instanceof Error ? parseError.message : 'Unknown parse error',
      });
    }

    // Basic validation
    if ((!productData.productName && !productData.name) || !productData.ingredients) {
      return createResponse(400, {
        error: 'VALIDATION_ERROR',
        message: 'Product name and ingredients are required',
      });
    }

    // Check if multiple markets are requested
    const markets = productData.markets || [productData.market];
    
    if (markets.length === 1) {
      // Single market - generate one label
      const label = generateMockLabel({ ...productData, market: markets[0] });
      console.log('Generated mock label:', JSON.stringify(label, null, 2));
      
      return createResponse(200, {
        success: true,
        data: label,
      });
    } else {
      // Multiple markets - generate multiple labels
      const labels = markets.map((market: string) => 
        generateMockLabel({ ...productData, market })
      );
      
      console.log('Generated mock labels:', JSON.stringify(labels, null, 2));
      
      return createResponse(200, {
        success: true,
        data: labels,
      });
    }

  } catch (error) {
    console.error('Unexpected error in generate handler:', error);
    
    return createResponse(500, {
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
