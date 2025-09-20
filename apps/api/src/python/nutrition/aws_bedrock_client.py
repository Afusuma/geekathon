"""
AWS Bedrock Client for SmartLabel AI Nutrition Label Generator
Handles AI-powered content generation for nutrition labels across multiple markets
"""

import boto3
import json
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class NutritionData:
    """Structured nutrition data for label generation"""
    serving_size: str
    servings_per_container: str
    calories: str
    nutrients: List[Dict]
    ingredients: str
    allergens: str
    certifications: List[str]
    regulatory_notes: str
    market_specific_warnings: str

class BedrockClient:
    """AWS Bedrock client for nutrition label content generation"""
    
    def __init__(self, region: str = "us-east-1", model_id: str = "anthropic.claude-3-5-sonnet-20241022-v2:0"):
        self.region = region
        self.model_id = model_id
        self.client = boto3.client('bedrock-runtime', region_name=region)
        
    def generate_nutrition_content(self, product_data: Dict, market: str) -> NutritionData:
        """
        Generate nutrition label content using AWS Bedrock
        
        Args:
            product_data: Raw product information
            market: Target market (spain, angola, macau, brazil, halal)
            
        Returns:
            NutritionData: Structured nutrition information
        """
        try:
            # For demo purposes, return mock data instead of calling Bedrock
            # TODO: Replace with actual Bedrock call when model is available
            logger.info("Using mock data for nutrition content generation")
            return self._generate_mock_content(product_data, market)
            
            # Uncomment when Bedrock model is available:
            # prompt = self._build_prompt(product_data, market)
            # response = self._call_bedrock(prompt)
            # return self._parse_response(response)
        except Exception as e:
            logger.error(f"Error generating nutrition content: {str(e)}")
            raise
    
    def _generate_mock_content(self, product_data: Dict, market: str) -> NutritionData:
        """Generate mock nutrition content for demo purposes"""
        
        # Get market-specific data
        market_data = {
            "spain": {"title": "Información Nutricional", "language": "Spanish", "allergen_prefix": "Contiene:"},
            "angola": {"title": "Informação Nutricional", "language": "Portuguese", "allergen_prefix": "Contém:"},
            "macau": {"title": "營養標籤", "language": "Chinese", "allergen_prefix": "致敏物:"},
            "brazil": {"title": "Informação Nutricional", "language": "Portuguese", "allergen_prefix": "ALÉRGENOS:"},
            "halal": {"title": "Nutrition Facts", "language": "English", "allergen_prefix": "Contains:"}
        }
        
        market_info = market_data.get(market.lower(), market_data["spain"])
        
        # Generate mock nutrition data based on product input
        nutrients = [
            {"name": "Total Fat", "amount": product_data.get("total_fat", "0"), "unit": "g", "daily_value": "5%", "major": True, "indented": False},
            {"name": "Saturated Fat", "amount": product_data.get("saturated_fat", "0"), "unit": "g", "daily_value": "3%", "major": False, "indented": True},
            {"name": "Protein", "amount": product_data.get("protein", "0"), "unit": "g", "daily_value": "10%", "major": True, "indented": False}
        ]
        
        return NutritionData(
            serving_size=product_data.get("serving_size", "1 serving"),
            servings_per_container=product_data.get("servings_per_container", "1"),
            calories=f"{product_data.get('calories', '0')} {market_info['language']}",
            nutrients=nutrients,
            ingredients=product_data.get("ingredients_list", "Ingredients not specified"),
            allergens=f"{market_info['allergen_prefix']} See ingredients list",
            certifications=product_data.get("certifications", []),
            regulatory_notes=f"Complies with {market_info['language']} food labeling regulations",
            market_specific_warnings=""
        )
    
    def _build_prompt(self, product_data: Dict, market: str) -> str:
        """Build market-specific prompt for Bedrock"""
        
        market_requirements = {
            "spain": {
                "title": "Información Nutricional",
                "language": "Spanish",
                "regulation": "EU Regulation 1169/2011",
                "energy_unit": "kJ and kcal",
                "requirements": [
                    "Use 'Información Nutricional' as title",
                    "Include both kJ and kcal for energy",
                    "List allergens with 'Contiene:' prefix",
                    "Add EU regulation compliance note",
                    "Use Spanish language for all text"
                ]
            },
            "angola": {
                "title": "Informação Nutricional",
                "language": "Portuguese",
                "regulation": "ARSO standards",
                "energy_unit": "kcal",
                "requirements": [
                    "Use Portuguese language",
                    "Include import product warnings",
                    "Add ARSO compliance note",
                    "Include bilingual allergen warnings",
                    "Follow Angolan food labeling standards"
                ]
            },
            "macau": {
                "title": "營養標籤",
                "language": "Chinese Traditional and English",
                "regulation": "Macau SAR requirements",
                "energy_unit": "kcal",
                "requirements": [
                    "Use Traditional Chinese characters",
                    "Include dual language (Chinese/English)",
                    "Add Macau SAR compliance note",
                    "Include dual measurement units",
                    "Follow Macau food safety standards"
                ]
            },
            "brazil": {
                "title": "Informação Nutricional",
                "language": "Portuguese",
                "regulation": "ANVISA RDC 429/2020",
                "energy_unit": "kcal",
                "requirements": [
                    "Use Portuguese language",
                    "Include ANVISA compliance note",
                    "List allergens with 'ALÉRGENOS:' prefix",
                    "Follow Brazilian nutrition labeling standards",
                    "Include mandatory warning statements"
                ]
            },
            "halal": {
                "title": "Nutrition Facts / معلومات التغذية",
                "language": "English and Arabic",
                "regulation": "Islamic dietary compliance",
                "energy_unit": "kcal",
                "requirements": [
                    "Include Halal certification mark",
                    "Add Arabic text elements where appropriate",
                    "Ensure Islamic dietary compliance",
                    "Include certification details",
                    "Follow Halal labeling standards"
                ]
            }
        }
        
        market_info = market_requirements.get(market.lower(), market_requirements["spain"])
        
        prompt = f"""
You are a nutrition labeling expert specializing in {market_info['language']} food labeling for {market.upper()} market.

PRODUCT DATA:
- Product Name: {product_data.get('name', 'Unknown Product')}
- Category: {product_data.get('category', 'Food Product')}
- Serving Size: {product_data.get('serving_size', '1 serving')}
- Servings per Container: {product_data.get('servings_per_container', '1')}

NUTRITIONAL VALUES (per serving):
- Calories: {product_data.get('calories', 0)}
- Total Fat: {product_data.get('total_fat', 0)}g
- Saturated Fat: {product_data.get('saturated_fat', 0)}g
- Trans Fat: {product_data.get('trans_fat', 0)}g
- Cholesterol: {product_data.get('cholesterol', 0)}mg
- Sodium: {product_data.get('sodium', 0)}mg
- Total Carbohydrates: {product_data.get('total_carbs', 0)}g
- Dietary Fiber: {product_data.get('dietary_fiber', 0)}g
- Total Sugars: {product_data.get('total_sugars', 0)}g
- Protein: {product_data.get('protein', 0)}g

INGREDIENTS: {product_data.get('ingredients', '')}
ALLERGENS: {product_data.get('allergens', '')}
CERTIFICATIONS: {', '.join(product_data.get('certifications', []))}

MARKET REQUIREMENTS FOR {market.upper()}:
{chr(10).join(f"- {req}" for req in market_info['requirements'])}

Generate a JSON response with the following structure:
{{
    "nutrition_facts": {{
        "serving_size": "calculated serving size",
        "servings_per_container": "calculated servings",
        "calories": "calories with unit",
        "nutrients": [
            {{"name": "nutrient name in {market_info['language']}", "amount": "amount", "unit": "unit", "daily_value": "DV%", "major": true/false, "indented": true/false}}
        ]
    }},
    "ingredients": "processed ingredients list in {market_info['language']}",
    "allergens": "allergen statement in {market_info['language']}",
    "certifications": ["certification badges"],
    "regulatory_notes": "compliance note for {market_info['regulation']}",
    "market_specific_warnings": "any market-specific warnings"
}}

IMPORTANT:
- Calculate daily values based on {market.upper()} standards
- Use {market_info['language']} language throughout
- Include {market_info['energy_unit']} for energy
- Follow {market_info['regulation']} requirements
- Ensure all text is appropriate for {market.upper()} market
"""
        return prompt
    
    def _call_bedrock(self, prompt: str) -> str:
        """Call AWS Bedrock with the prompt"""
        try:
            body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 4000,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            }
            
            response = self.client.invoke_model(
                modelId=self.model_id,
                body=json.dumps(body),
                contentType="application/json"
            )
            
            response_body = json.loads(response['body'].read())
            return response_body['content'][0]['text']
            
        except Exception as e:
            logger.error(f"Error calling Bedrock: {str(e)}")
            raise
    
    def _parse_response(self, response_text: str) -> NutritionData:
        """Parse Bedrock response into structured data"""
        try:
            # Extract JSON from response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx == -1 or end_idx == 0:
                raise ValueError("No valid JSON found in response")
            
            json_text = response_text[start_idx:end_idx]
            data = json.loads(json_text)
            
            return NutritionData(
                serving_size=data['nutrition_facts']['serving_size'],
                servings_per_container=data['nutrition_facts']['servings_per_container'],
                calories=data['nutrition_facts']['calories'],
                nutrients=data['nutrition_facts']['nutrients'],
                ingredients=data['ingredients'],
                allergens=data['allergens'],
                certifications=data['certifications'],
                regulatory_notes=data['regulatory_notes'],
                market_specific_warnings=data['market_specific_warnings']
            )
            
        except Exception as e:
            logger.error(f"Error parsing response: {str(e)}")
            # Return fallback data
            return NutritionData(
                serving_size="1 serving",
                servings_per_container="1",
                calories="0",
                nutrients=[],
                ingredients="Ingredients not available",
                allergens="Allergen information not available",
                certifications=[],
                regulatory_notes="Compliance information not available",
                market_specific_warnings=""
            )

# Crisis response functionality
class CrisisResponseGenerator:
    """Handle crisis response for nutrition labels"""
    
    def __init__(self, bedrock_client: BedrockClient):
        self.bedrock_client = bedrock_client
    
    def generate_crisis_label(self, original_data: Dict, crisis_type: str, market: str) -> NutritionData:
        """
        Generate updated nutrition label for crisis response
        
        Args:
            original_data: Original product data
            crisis_type: Type of crisis (recall, allergen, contamination, regulatory)
            market: Target market
            
        Returns:
            NutritionData: Updated nutrition information with crisis warnings
        """
        crisis_prompt = self._build_crisis_prompt(original_data, crisis_type, market)
        
        try:
            response = self.bedrock_client._call_bedrock(crisis_prompt)
            return self.bedrock_client._parse_response(response)
        except Exception as e:
            logger.error(f"Error generating crisis response: {str(e)}")
            raise
    
    def _build_crisis_prompt(self, original_data: Dict, crisis_type: str, market: str) -> str:
        """Build crisis-specific prompt"""
        
        crisis_warnings = {
            "recall": "PRODUCT RECALL NOTICE - Do not consume this product",
            "allergen": "ALLERGEN CONTAMINATION WARNING - May contain undeclared allergens",
            "contamination": "CONTAMINATION WARNING - Product may be contaminated",
            "regulatory": "REGULATORY UPDATE - New compliance requirements apply"
        }
        
        warning = crisis_warnings.get(crisis_type.lower(), "CRISIS NOTICE")
        
        prompt = f"""
CRISIS RESPONSE GENERATION for {market.upper()} market

ORIGINAL PRODUCT DATA:
{json.dumps(original_data, indent=2)}

CRISIS TYPE: {crisis_type.upper()}
CRISIS WARNING: {warning}

Generate an updated nutrition label JSON response that includes:

1. All original nutrition information
2. PROMINENT crisis warning at the top of the label
3. Updated allergen information if applicable
4. Regulatory compliance updates if needed
5. Crisis-specific warnings in appropriate language for {market.upper()}

The response should maintain the same JSON structure as the original nutrition label generator but with crisis modifications.

CRISIS REQUIREMENTS:
- Add prominent warning at the top
- Update allergen statements if contamination related
- Include crisis contact information
- Maintain regulatory compliance
- Use appropriate language for {market.upper()} market
"""
        return prompt
