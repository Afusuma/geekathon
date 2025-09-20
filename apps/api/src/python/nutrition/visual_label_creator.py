"""
Visual Label Creator for SmartLabel AI Nutrition Label Generator
Creates high-resolution nutrition labels using PIL and Matplotlib
"""

import math
from PIL import Image, ImageDraw, ImageFont
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from typing import Dict, List, Optional, Tuple
import numpy as np
from market_regulations import MarketRegulations, CrisisRegulations

class NutritionLabelCreator:
    """Creates visual nutrition labels for different markets"""
    
    def __init__(self):
        self.regulations = MarketRegulations()
        self.crisis_regulations = CrisisRegulations()
        
        # Color scheme for nutrition labels
        self.colors = {
            "black": (0, 0, 0),
            "white": (255, 255, 255),
            "red": (255, 0, 0),
            "blue": (0, 0, 255),
            "green": (0, 128, 0),
            "gray": (128, 128, 128),
            "light_gray": (240, 240, 240),
            "dark_gray": (64, 64, 64)
        }
    
    def create_label(self, nutrition_data: Dict, market: str, crisis_type: Optional[str] = None) -> Image.Image:
        """
        Create a complete nutrition label image
        
        Args:
            nutrition_data: Structured nutrition data
            market: Target market
            crisis_type: Optional crisis type for warnings
            
        Returns:
            PIL Image: High-resolution nutrition label
        """
        regulation = self.regulations.get_regulation(market)
        font_reqs = regulation.font_requirements
        
        # Calculate label dimensions
        width, height = self._calculate_label_size(nutrition_data, market, crisis_type)
        
        # Create image
        img = Image.new('RGB', (width, height), self.colors["white"])
        draw = ImageDraw.Draw(img)
        
        # Load fonts
        fonts = self._load_fonts(font_reqs)
        
        # Draw label components
        y_position = 0
        y_position = self._draw_crisis_warning(draw, crisis_type, market, fonts, y_position, width)
        y_position = self._draw_title(draw, regulation.title, fonts["title"], y_position, width)
        y_position = self._draw_serving_info(draw, nutrition_data, fonts["body"], y_position, width)
        y_position = self._draw_nutrition_table(draw, nutrition_data, regulation, fonts, y_position, width)
        y_position = self._draw_ingredients(draw, nutrition_data, fonts["body"], y_position, width)
        y_position = self._draw_allergens(draw, nutrition_data, regulation, fonts, y_position, width)
        y_position = self._draw_certifications(draw, nutrition_data, regulation, fonts, y_position, width)
        y_position = self._draw_regulatory_notes(draw, regulation, fonts["small"], y_position, width)
        
        return img
    
    def _calculate_label_size(self, nutrition_data: Dict, market: str, crisis_type: Optional[str]) -> Tuple[int, int]:
        """Calculate optimal label dimensions"""
        base_width = 400
        base_height = 600
        
        # Add height for crisis warning if needed
        if crisis_type:
            base_height += 80
        
        # Add height for certifications
        cert_count = len(nutrition_data.get("certifications", []))
        base_height += cert_count * 25
        
        # Add height for ingredients (estimate based on length)
        ingredients_length = len(nutrition_data.get("ingredients", ""))
        base_height += max(50, ingredients_length // 40 * 20)
        
        return base_width, base_height
    
    def _load_fonts(self, font_reqs: Dict) -> Dict[str, ImageFont.ImageFont]:
        """Load fonts for label creation"""
        fonts = {}
        
        try:
            # Try to load system fonts
            fonts["title"] = ImageFont.truetype("arial.ttf", font_reqs["title_font_size"])
            fonts["body"] = ImageFont.truetype("arial.ttf", font_reqs["body_font_size"])
            fonts["small"] = ImageFont.truetype("arial.ttf", font_reqs["allergen_font_size"])
            fonts["bold"] = ImageFont.truetype("arialbd.ttf", font_reqs["body_font_size"])
        except:
            # Fallback to default fonts
            fonts["title"] = ImageFont.load_default()
            fonts["body"] = ImageFont.load_default()
            fonts["small"] = ImageFont.load_default()
            fonts["bold"] = ImageFont.load_default()
        
        return fonts
    
    def _draw_crisis_warning(self, draw: ImageDraw.ImageDraw, crisis_type: Optional[str], 
                           market: str, fonts: Dict, y_pos: int, width: int) -> int:
        """Draw crisis warning at top of label"""
        if not crisis_type:
            return y_pos
        
        warning_text = self.crisis_regulations.get_crisis_warning(crisis_type, market)
        
        # Draw red background for warning
        warning_height = 60
        draw.rectangle([0, y_pos, width, y_pos + warning_height], 
                      fill=self.colors["red"])
        
        # Draw warning text
        draw.text((10, y_pos + 10), warning_text, 
                 fill=self.colors["white"], font=fonts["bold"])
        
        # Draw contact info
        contact_info = self.crisis_regulations.get_crisis_contact_info(market)
        draw.text((10, y_pos + 35), contact_info, 
                 fill=self.colors["white"], font=fonts["small"])
        
        return y_pos + warning_height + 10
    
    def _draw_title(self, draw: ImageDraw.ImageDraw, title: str, font: ImageFont.ImageFont, 
                   y_pos: int, width: int) -> int:
        """Draw nutrition facts title"""
        # Center the title
        bbox = draw.textbbox((0, 0), title, font=font)
        text_width = bbox[2] - bbox[0]
        x_pos = (width - text_width) // 2
        
        draw.text((x_pos, y_pos), title, fill=self.colors["black"], font=font)
        
        # Draw underline
        line_y = y_pos + 25
        draw.line([x_pos, line_y, x_pos + text_width, line_y], 
                 fill=self.colors["black"], width=2)
        
        return y_pos + 40
    
    def _draw_serving_info(self, draw: ImageDraw.ImageDraw, nutrition_data: Dict, 
                         font: ImageFont.ImageFont, y_pos: int, width: int) -> int:
        """Draw serving size and servings per container"""
        serving_size = nutrition_data.get("serving_size", "1 serving")
        servings_per_container = nutrition_data.get("servings_per_container", "1")
        
        serving_text = f"Serving size: {serving_size}"
        container_text = f"Servings per container: {servings_per_container}"
        
        draw.text((10, y_pos), serving_text, fill=self.colors["black"], font=font)
        draw.text((10, y_pos + 20), container_text, fill=self.colors["black"], font=font)
        
        return y_pos + 50
    
    def _draw_nutrition_table(self, draw: ImageDraw.ImageDraw, nutrition_data: Dict, 
                            regulation, fonts: Dict, y_pos: int, width: int) -> int:
        """Draw nutrition facts table"""
        calories = nutrition_data.get("calories", "0")
        nutrients = nutrition_data.get("nutrients", [])
        
        # Draw calories section
        calories_text = f"Calories {calories}"
        draw.text((10, y_pos), calories_text, fill=self.colors["black"], font=fonts["bold"])
        
        # Draw separator line
        line_y = y_pos + 25
        draw.line([10, line_y, width - 10, line_y], fill=self.colors["black"], width=2)
        
        y_pos += 35
        
        # Draw nutrients table header
        header_text = "Amount per serving | % Daily Value*"
        draw.text((10, y_pos), header_text, fill=self.colors["black"], font=fonts["body"])
        
        # Draw separator line
        line_y = y_pos + 20
        draw.line([10, line_y, width - 10, line_y], fill=self.colors["black"], width=1)
        
        y_pos += 30
        
        # Draw nutrients
        for nutrient in nutrients:
            name = nutrient.get("name", "")
            amount = nutrient.get("amount", "0")
            unit = nutrient.get("unit", "")
            daily_value = nutrient.get("daily_value", "0")
            is_major = nutrient.get("major", False)
            is_indented = nutrient.get("indented", False)
            
            # Choose font
            font_to_use = fonts["bold"] if is_major else fonts["body"]
            
            # Indent minor nutrients
            x_offset = 20 if is_indented else 10
            
            # Format amount
            amount_text = f"{amount}{unit}" if unit else str(amount)
            
            # Draw nutrient line
            nutrient_text = f"{name} {amount_text}"
            daily_value_text = f"{daily_value}%"
            
            draw.text((x_offset, y_pos), nutrient_text, fill=self.colors["black"], font=font_to_use)
            
            # Draw daily value on the right
            dv_bbox = draw.textbbox((0, 0), daily_value_text, font=font_to_use)
            dv_width = dv_bbox[2] - dv_bbox[0]
            draw.text((width - dv_width - 10, y_pos), daily_value_text, 
                     fill=self.colors["black"], font=font_to_use)
            
            y_pos += 20
        
        # Draw daily value note
        y_pos += 10
        note_text = "* Percent Daily Values are based on a 2000 calorie diet."
        draw.text((10, y_pos), note_text, fill=self.colors["dark_gray"], font=fonts["small"])
        
        return y_pos + 30
    
    def _draw_ingredients(self, draw: ImageDraw.ImageDraw, nutrition_data: Dict, 
                        font: ImageFont.ImageFont, y_pos: int, width: int) -> int:
        """Draw ingredients list"""
        ingredients = nutrition_data.get("ingredients", "")
        
        if not ingredients:
            return y_pos
        
        # Draw ingredients header
        draw.text((10, y_pos), "Ingredients:", fill=self.colors["black"], font=font)
        y_pos += 25
        
        # Wrap ingredients text
        words = ingredients.split()
        lines = []
        current_line = ""
        
        for word in words:
            test_line = current_line + " " + word if current_line else word
            bbox = draw.textbbox((0, 0), test_line, font=font)
            text_width = bbox[2] - bbox[0]
            
            if text_width <= width - 20:
                current_line = test_line
            else:
                if current_line:
                    lines.append(current_line)
                current_line = word
        
        if current_line:
            lines.append(current_line)
        
        # Draw ingredients lines
        for line in lines:
            draw.text((10, y_pos), line, fill=self.colors["black"], font=font)
            y_pos += 20
        
        return y_pos + 10
    
    def _draw_allergens(self, draw: ImageDraw.ImageDraw, nutrition_data: Dict, 
                       regulation, fonts: Dict, y_pos: int, width: int) -> int:
        """Draw allergen information"""
        allergens = nutrition_data.get("allergens", "")
        
        if not allergens:
            return y_pos
        
        # Format allergen statement
        allergen_prefix = regulation.allergen_prefix if hasattr(regulation, 'allergen_prefix') else "Contains:"
        allergen_statement = f"{allergen_prefix} {allergens}" if allergens else ""
        
        if allergen_statement:
            draw.text((10, y_pos), allergen_statement, fill=self.colors["red"], font=fonts["bold"])
            y_pos += 25
        
        return y_pos
    
    def _draw_certifications(self, draw: ImageDraw.ImageDraw, nutrition_data: Dict, 
                           regulation, fonts: Dict, y_pos: int, width: int) -> int:
        """Draw certification badges"""
        certifications = nutrition_data.get("certifications", [])
        
        if not certifications:
            return y_pos
        
        # Draw certifications header
        draw.text((10, y_pos), "Certifications:", fill=self.colors["black"], font=fonts["body"])
        y_pos += 25
        
        # Draw certification badges
        for cert in certifications:
            # Draw badge background
            badge_width = 120
            badge_height = 25
            draw.rectangle([10, y_pos, 10 + badge_width, y_pos + badge_height], 
                          fill=self.colors["light_gray"], outline=self.colors["dark_gray"])
            
            # Draw certification text
            draw.text((15, y_pos + 5), cert, fill=self.colors["black"], font=fonts["small"])
            y_pos += 35
        
        return y_pos
    
    def _draw_regulatory_notes(self, draw: ImageDraw.ImageDraw, regulation, 
                             font: ImageFont.ImageFont, y_pos: int, width: int) -> int:
        """Draw regulatory compliance notes"""
        warnings = regulation.mandatory_warnings
        
        for warning in warnings:
            draw.text((10, y_pos), warning, fill=self.colors["dark_gray"], font=font)
            y_pos += 20
        
        return y_pos + 10
    
    def save_label(self, img: Image.Image, filename: str, dpi: int = 300) -> str:
        """Save label image with high resolution"""
        # Calculate new size for high DPI
        scale_factor = dpi / 72  # 72 is default DPI
        new_size = (int(img.width * scale_factor), int(img.height * scale_factor))
        
        # Resize image
        high_res_img = img.resize(new_size, Image.Resampling.LANCZOS)
        
        # Save with high DPI
        high_res_img.save(filename, dpi=(dpi, dpi))
        
        return filename

class LabelPreview:
    """Create preview versions of labels for React frontend"""
    
    def __init__(self):
        self.creator = NutritionLabelCreator()
    
    def create_preview(self, nutrition_data: Dict, market: str, 
                      crisis_type: Optional[str] = None, size: Tuple[int, int] = (300, 400)) -> str:
        """Create base64 encoded preview of label"""
        import base64
        import io
        
        # Create full resolution label
        full_label = self.creator.create_label(nutrition_data, market, crisis_type)
        
        # Resize for preview
        preview_label = full_label.resize(size, Image.Resampling.LANCZOS)
        
        # Convert to base64
        buffer = io.BytesIO()
        preview_label.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/png;base64,{img_str}"
    
    def create_thumbnail(self, nutrition_data: Dict, market: str, 
                        crisis_type: Optional[str] = None, size: Tuple[int, int] = (150, 200)) -> str:
        """Create thumbnail version of label"""
        return self.create_preview(nutrition_data, market, crisis_type, size)
