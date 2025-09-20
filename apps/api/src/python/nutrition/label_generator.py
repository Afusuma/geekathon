import json
from datetime import datetime
from aws_bedrock_client import BedrockClient
from market_regulations import get_market_data
from visual_label_creator import NutritionLabelCreator

class NutritionLabelGenerator:
    def __init__(self, bedrock_client: BedrockClient, visual_creator: NutritionLabelCreator):
        self.bedrock_client = bedrock_client
        self.visual_creator = visual_creator

    def _generate_bedrock_content(self, product_data: dict, market: str) -> dict:
        market_info = get_market_data(market)
        market_name = market_info.get("name", market)
        market_language = market_info.get("language", "en")

        prompt = f"""
        You are an expert in food labeling regulations for {market_name} ({market_language}).
        Generate comprehensive nutrition label content based on the following product data.
        Ensure compliance with {market_name}'s specific regulations (e.g., EU Regulation 1169/2011 for Spain, ANVISA RDC 429/2020 for Brazil, ARSO for Angola, Macau SAR requirements for Macau, Islamic dietary compliance for Halal).

        Product Name: {product_data.get('product_name')}
        Serving Size: {product_data.get('serving_size')}
        Servings Per Container: {product_data.get('servings_per_container')}
        Calories: {product_data.get('calories')}
        Nutritional Values (per serving):
        {json.dumps(product_data.get('nutritional_values', {}), indent=2)}
        Ingredients List: {product_data.get('ingredients_list')}
        Certifications: {', '.join(product_data.get('certifications', []))}
        Target Market: {market_name}

        Based on this, generate a JSON object with the following structure:
        {{
          "nutrition_facts": {{
            "serving_size": "...",
            "servings_per_container": "...",
            "calories": "...",
            "nutrients": [
              {{"name": "Total Fat", "amount": "...", "unit": "g", "daily_value": "...", "major": true}},
              {{"name": "Saturated Fat", "amount": "...", "unit": "g", "daily_value": "...", "indented": true}}
              // ... other nutrients
            ]
          }},
          "ingredients": "...",
          "allergens": "...",
          "certifications": ["...", "..."],
          "regulatory_notes": "...",
          "market_specific_warnings": "..."
        }}

        Ensure:
        - Nutritional values are correctly formatted and daily values are calculated based on {market_name} standards.
        - Ingredients list is compliant and translated if necessary for {market_name}.
        - Allergens are clearly identified and prefixed with "{market_info.get('allergen_prefix', 'Contains:')}".
        - Regulatory notes are specific to {market_name}.
        - Certifications are listed.
        - Use {market_language} for market-specific text where appropriate, but keep nutrient names in English for consistency unless explicitly required otherwise by {market_name} regulations.
        - For Halal, include relevant Islamic dietary compliance notes.
        """
        
        try:
            response = self.bedrock_client.generate_nutrition_content(product_data, market)
            # Convert the NutritionData object to dict format expected by visual creator
            return {
                "nutrition_facts": {
                    "serving_size": response.serving_size,
                    "servings_per_container": response.servings_per_container,
                    "calories": response.calories,
                    "nutrients": response.nutrients
                },
                "ingredients": response.ingredients,
                "allergens": response.allergens,
                "certifications": response.certifications,
                "regulatory_notes": response.regulatory_notes,
                "market_specific_warnings": response.market_specific_warnings
            }
        except Exception as e:
            print(f"Error generating content with Bedrock: {e}")
            return {"error": str(e)}

    def generate_label(self, product_data: dict) -> dict:
        market = product_data.get("market", "spain").lower()
        market_data = get_market_data(market)

        if not market_data:
            return {"error": f"Unsupported market: {market}"}

        # 1. Generate content using AWS Bedrock
        bedrock_output = self._generate_bedrock_content(product_data, market)
        if bedrock_output.get("error"):
            return bedrock_output

        # Merge product_data with bedrock_output, giving bedrock precedence for label content
        final_label_data = {
            "product_name": product_data.get("product_name"),
            "market": market,
            **bedrock_output
        }

        # 2. Create visual label
        try:
            image = self.visual_creator.create_label(final_label_data, market)
            
            # Convert PIL Image to base64 string
            import io
            import base64
            
            # Save image to bytes buffer
            img_buffer = io.BytesIO()
            image.save(img_buffer, format='PNG')
            img_buffer.seek(0)
            
            # Encode to base64
            image_base64 = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
            
            return {
                "image_base64": image_base64,
                "label_data": final_label_data,
                "filename": f"nutrition_label_{market}_{product_data.get('product_name', 'unknown').replace(' ', '_')}_{datetime.now().strftime('%Y%m%d%H%M%S')}.png"
            }
        except Exception as e:
            print(f"Error creating visual label: {e}")
            return {"error": f"Failed to create visual label: {e}"}