"""
Market Regulations for SmartLabel AI Nutrition Label Generator
Defines compliance requirements and standards for different international markets
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

class Market(Enum):
    SPAIN = "spain"
    ANGOLA = "angola"
    MACAU = "macau"
    BRAZIL = "brazil"
    HALAL = "halal"

@dataclass
class MarketRegulation:
    """Market-specific regulation information"""
    market: Market
    title: str
    language: str
    regulation: str
    energy_unit: str
    daily_value_standards: Dict[str, float]
    mandatory_warnings: List[str]
    allergen_prefix: str
    certification_requirements: List[str]
    font_requirements: Dict[str, any]

class MarketRegulations:
    """Centralized market regulation definitions"""
    
    def __init__(self):
        self.regulations = self._initialize_regulations()
    
    def get_regulation(self, market: str) -> MarketRegulation:
        """Get regulation for specific market"""
        market_enum = Market(market.lower())
        return self.regulations[market_enum]
    
    def _initialize_regulations(self) -> Dict[Market, MarketRegulation]:
        """Initialize all market regulations"""
        return {
            Market.SPAIN: MarketRegulation(
                market=Market.SPAIN,
                title="Información Nutricional",
                language="Spanish",
                regulation="EU Regulation 1169/2011",
                energy_unit="kJ and kcal",
                daily_value_standards={
                    "total_fat": 70.0,  # g
                    "saturated_fat": 20.0,  # g
                    "sugars": 90.0,  # g
                    "salt": 6.0,  # g
                    "fiber": 25.0,  # g
                    "protein": 50.0,  # g
                    "calories": 2000.0  # kcal
                },
                mandatory_warnings=[
                    "Cumple con Reglamento (UE) Nº 1169/2011",
                    "Información nutricional por 100g"
                ],
                allergen_prefix="Contiene:",
                certification_requirements=["EU Organic", "IFS", "BRC"],
                font_requirements={
                    "title_font_size": 16,
                    "body_font_size": 12,
                    "allergen_font_size": 10,
                    "bold_required": ["title", "allergens", "daily_values"]
                }
            ),
            
            Market.ANGOLA: MarketRegulation(
                market=Market.ANGOLA,
                title="Informação Nutricional",
                language="Portuguese",
                regulation="ARSO standards",
                energy_unit="kcal",
                daily_value_standards={
                    "total_fat": 65.0,  # g
                    "saturated_fat": 20.0,  # g
                    "sugars": 90.0,  # g
                    "salt": 5.0,  # g
                    "fiber": 25.0,  # g
                    "protein": 50.0,  # g
                    "calories": 2000.0  # kcal
                },
                mandatory_warnings=[
                    "Produto importado - cumpre padrões ARSO",
                    "Informação nutricional por 100g"
                ],
                allergen_prefix="ALÉRGENOS:",
                certification_requirements=["ARSO", "IFS", "Halal"],
                font_requirements={
                    "title_font_size": 16,
                    "body_font_size": 12,
                    "allergen_font_size": 10,
                    "bold_required": ["title", "allergens", "import_warning"]
                }
            ),
            
            Market.MACAU: MarketRegulation(
                market=Market.MACAU,
                title="營養標籤",
                language="Chinese Traditional and English",
                regulation="Macau SAR requirements",
                energy_unit="kcal",
                daily_value_standards={
                    "total_fat": 60.0,  # g
                    "saturated_fat": 20.0,  # g
                    "sugars": 90.0,  # g
                    "salt": 5.0,  # g
                    "fiber": 25.0,  # g
                    "protein": 50.0,  # g
                    "calories": 2000.0  # kcal
                },
                mandatory_warnings=[
                    "符合澳門特別行政區食品安全標準",
                    "Nutritional information per 100g"
                ],
                allergen_prefix="過敏原 / Allergens:",
                certification_requirements=["Macau Food Safety", "Halal", "Organic"],
                font_requirements={
                    "title_font_size": 16,
                    "body_font_size": 12,
                    "allergen_font_size": 10,
                    "bold_required": ["title", "allergens", "chinese_text"]
                }
            ),
            
            Market.BRAZIL: MarketRegulation(
                market=Market.BRAZIL,
                title="Informação Nutricional",
                language="Portuguese",
                regulation="ANVISA RDC 429/2020",
                energy_unit="kcal",
                daily_value_standards={
                    "total_fat": 55.0,  # g
                    "saturated_fat": 22.0,  # g
                    "sugars": 50.0,  # g
                    "salt": 2.0,  # g
                    "fiber": 25.0,  # g
                    "protein": 75.0,  # g
                    "calories": 2000.0  # kcal
                },
                mandatory_warnings=[
                    "Cumpre com RDC ANVISA 429/2020",
                    "Informação nutricional por 100g",
                    "ALÉRGENOS: Contém derivados de leite"
                ],
                allergen_prefix="ALÉRGENOS:",
                certification_requirements=["ANVISA", "IFS", "BRC", "Halal"],
                font_requirements={
                    "title_font_size": 16,
                    "body_font_size": 12,
                    "allergen_font_size": 10,
                    "bold_required": ["title", "allergens", "anvisa_compliance"]
                }
            ),
            
            Market.HALAL: MarketRegulation(
                market=Market.HALAL,
                title="Nutrition Facts / معلومات التغذية",
                language="English and Arabic",
                regulation="Islamic dietary compliance",
                energy_unit="kcal",
                daily_value_standards={
                    "total_fat": 65.0,  # g
                    "saturated_fat": 20.0,  # g
                    "sugars": 90.0,  # g
                    "salt": 6.0,  # g
                    "fiber": 25.0,  # g
                    "protein": 50.0,  # g
                    "calories": 2000.0  # kcal
                },
                mandatory_warnings=[
                    "Halal Certified - Certified by Islamic authority",
                    "مُصادق عليه حلال - مُعتمد من السلطة الإسلامية"
                ],
                allergen_prefix="ALÉRGENOS / المواد المسببة للحساسية:",
                certification_requirements=["Halal", "Islamic Authority", "IFS"],
                font_requirements={
                    "title_font_size": 16,
                    "body_font_size": 12,
                    "allergen_font_size": 10,
                    "bold_required": ["title", "halal_certification", "arabic_text"]
                }
            )
        }
    
    def get_daily_value_percentage(self, nutrient: str, amount: float, market: str) -> float:
        """Calculate daily value percentage for nutrient in specific market"""
        regulation = self.get_regulation(market)
        standard = regulation.daily_value_standards.get(nutrient.lower(), 100.0)
        return round((amount / standard) * 100, 0)
    
    def get_mandatory_warnings(self, market: str) -> List[str]:
        """Get mandatory warnings for market"""
        regulation = self.get_regulation(market)
        return regulation.mandatory_warnings
    
    def format_allergen_statement(self, allergens: str, market: str) -> str:
        """Format allergen statement according to market requirements"""
        regulation = self.get_regulation(market)
        if allergens.strip():
            return f"{regulation.allergen_prefix} {allergens}"
        return ""
    
    def get_certification_badges(self, market: str, product_certifications: List[str]) -> List[str]:
        """Get valid certification badges for market and product"""
        regulation = self.get_regulation(market)
        valid_certifications = []
        
        for cert in product_certifications:
            cert_lower = cert.lower()
            for req_cert in regulation.certification_requirements:
                if cert_lower in req_cert.lower() or req_cert.lower() in cert_lower:
                    valid_certifications.append(req_cert)
                    break
        
        # Add market-specific certifications
        if market.lower() == "halal":
            if "halal" in [c.lower() for c in product_certifications]:
                valid_certifications.append("Halal Certified")
        
        return list(set(valid_certifications))  # Remove duplicates
    
    def get_font_requirements(self, market: str) -> Dict[str, any]:
        """Get font requirements for market"""
        regulation = self.get_regulation(market)
        return regulation.font_requirements

# Crisis response regulations
class CrisisRegulations:
    """Crisis-specific regulation handling"""
    
    def __init__(self):
        self.crisis_warnings = {
            "recall": {
                "spain": "RETIRADA DEL PRODUCTO - No consumir",
                "angola": "RECALL DO PRODUTO - Não consumir",
                "macau": "產品回收 - 請勿食用 / Product Recall - Do not consume",
                "brazil": "RECALL DO PRODUTO - Não consumir",
                "halal": "Product Recall / سحب المنتج - Do not consume / لا تستهلك"
            },
            "allergen": {
                "spain": "ADVERTENCIA DE ALÉRGENOS - Puede contener alérgenos no declarados",
                "angola": "AVISO DE ALÉRGENOS - Pode conter alérgenos não declarados",
                "macau": "過敏原警告 / Allergen Warning - May contain undeclared allergens",
                "brazil": "AVISO DE ALÉRGENOS - Pode conter alérgenos não declarados",
                "halal": "Allergen Warning / تحذير المواد المسببة للحساسية - May contain undeclared allergens"
            },
            "contamination": {
                "spain": "ADVERTENCIA DE CONTAMINACIÓN - Producto puede estar contaminado",
                "angola": "AVISO DE CONTAMINAÇÃO - Produto pode estar contaminado",
                "macau": "污染警告 / Contamination Warning - Product may be contaminated",
                "brazil": "AVISO DE CONTAMINAÇÃO - Produto pode estar contaminado",
                "halal": "Contamination Warning / تحذير التلوث - Product may be contaminated"
            },
            "regulatory": {
                "spain": "ACTUALIZACIÓN REGULATORIA - Nuevos requisitos de cumplimiento",
                "angola": "ATUALIZAÇÃO REGULATÓRIA - Novos requisitos de conformidade",
                "macau": "法規更新 / Regulatory Update - New compliance requirements",
                "brazil": "ATUALIZAÇÃO REGULATÓRIA - Novos requisitos de conformidade",
                "halal": "Regulatory Update / تحديث تنظيمي - New compliance requirements"
            }
        }
    
    def get_crisis_warning(self, crisis_type: str, market: str) -> str:
        """Get crisis warning text for specific crisis type and market"""
        warnings = self.crisis_warnings.get(crisis_type.lower(), {})
        return warnings.get(market.lower(), f"CRISIS WARNING - {crisis_type.upper()}")
    
    def get_crisis_contact_info(self, market: str) -> str:
        """Get crisis contact information for market"""
        contact_info = {
            "spain": "Para más información: +34 900 123 456",
            "angola": "Para mais informações: +244 222 123 456",
            "macau": "更多資訊 / More info: +853 2856 3333",
            "brazil": "Para mais informações: 0800 123 456",
            "halal": "For more information / لمزيد من المعلومات: +1 800 123 456"
        }
        return contact_info.get(market.lower(), "For more information: +1 800 123 456")


def get_market_data(market: str) -> Dict[str, Any]:
    """Legacy function to get market data for backward compatibility"""
    market_regulations = MarketRegulations()
    regulation = market_regulations.get_regulation(market)
    
    # Convert MarketRegulation object to dictionary for backward compatibility
    return {
        "name": regulation.market.value.title(),
        "language": regulation.language,
        "title": regulation.title,
        "calories_unit": regulation.energy_unit,
        "daily_value_source": regulation.regulation,
        "allergen_prefix": regulation.allergen_prefix,
        "notes": regulation.mandatory_warnings[0] if regulation.mandatory_warnings else ""
    }
