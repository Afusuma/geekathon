import json
from datetime import datetime
from aws_bedrock_client import BedrockClient
from market_regulations import get_market_data
from visual_label_creator import NutritionLabelCreator
from label_generator import NutritionLabelGenerator

class CrisisResponseGenerator:
    def __init__(self, bedrock_client: BedrockClient, visual_creator: NutritionLabelCreator):
        self.bedrock_client = bedrock_client
        self.visual_creator = visual_creator
        self.label_generator = NutritionLabelGenerator(bedrock_client, visual_creator)

           def generate_crisis_label(self, original_product_data: dict, crisis_info: dict) -> dict:
               crisis_type = crisis_info.get("type", "recall")
               crisis_details = crisis_info.get("details", "Urgent safety recall.")
               
               market = original_product_data.get("market", "spain")
               if isinstance(market, str):
                   market = market.lower()
               market_data = get_market_data(market)

        if not market_data:
            return {"error": f"Unsupported market: {market}"}

        # Augment original product data with crisis information for Bedrock
        augmented_product_data = original_product_data.copy()
        augmented_product_data["crisis_type"] = crisis_type
        augmented_product_data["crisis_details"] = crisis_details

        prompt = f"""
        You are an expert in food safety and labeling for {market_data.get('name')}.
        An urgent crisis has occurred for the product: {original_product_data.get('product_name')}.
        Crisis Type: {crisis_type}
        Crisis Details: {crisis_details}

        Original Product Data:
        {json.dumps(original_product_data, indent=2)}

        Generate an UPDATED nutrition label content in JSON format, similar to the standard label generation,
        but with a prominent "market_specific_warnings" section reflecting the crisis.
        Also, generate a brief "crisis_communication_text" suitable for public announcement.

        Ensure the "market_specific_warnings" is highly visible and clear, using language appropriate for {market_data.get('name')} ({market_data.get('language')}).

        JSON Structure for output:
        {{
          "nutrition_facts": {{...}},
          "ingredients": "...",
          "allergens": "...",
          "certifications": ["...", "..."],
          "regulatory_notes": "...",
          "market_specific_warnings": "...",
          "crisis_communication_text": "..."
        }}
        """

        try:
            # Use the existing BedrockClient method
            response = self.bedrock_client.generate_nutrition_content(augmented_product_data, market)
            
            # Convert to dict format and add crisis communication
            bedrock_output = {
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
                "market_specific_warnings": response.market_specific_warnings,
                "crisis_communication_text": f"URGENT: {crisis_type.upper()} - {crisis_details} Please contact manufacturer immediately."
            }
        except Exception as e:
            print(f"Error generating crisis content with Bedrock: {e}")
            return {"error": str(e)}

        # Merge original product data with bedrock_output, giving bedrock precedence for label content
        final_label_data = {
            "product_name": original_product_data.get("product_name"),
            "market": market,
            **bedrock_output
        }

               # 2. Create visual label with crisis warning
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
                       "crisis_communication_text": bedrock_output.get("crisis_communication_text", "No specific communication text generated."),
                       "filename": f"crisis_label_{market}_{original_product_data.get('product_name', 'unknown').replace(' ', '_')}_{datetime.now().strftime('%Y%m%d%H%M%S')}.png"
                   }
        except Exception as e:
            print(f"Error creating visual crisis label: {e}")
            return {"error": f"Failed to create visual crisis label: {e}"}